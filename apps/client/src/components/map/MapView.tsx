import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useTrainStore } from '../../stores/trainStore';
import { TrainState } from '../../types';
import { TRACK_COLORS } from '../../lib/mapConstants';
import { delayKey, LIVERY, registerTrainIcons, TYPE_COLORS, TYPE_LABEL } from '../../lib/trainStyle';
import { apiGetStationsGeoJSON, apiGetTracksGeoJSON } from '../../services/api';

type CarPose = { lng: number; lat: number; heading: number; role: 'loco' | 'coach' | 'tail' };
type Pose = { lng: number; lat: number; heading: number; cars: CarPose[] };

function emptyFC(): any {
  return { type: 'FeatureCollection', features: [] };
}

function iconFor(train: TrainState, role: CarPose['role'], markerMode: 'minimal' | 'typed') {
  if (markerMode === 'typed') return `${role}-${train.type}`;
  return `min-${role}-${delayKey(train.delayMinutes, train.status)}`;
}

function trainsToHeadFC(
  trains: Map<string, TrainState>,
  display: Map<string, Pose>,
  markerMode: 'minimal' | 'typed',
  typeFilter: Record<string, boolean>,
  selectedTrainNo: string | null
): any {
  const features: any[] = [];
  trains.forEach((train) => {
    if (typeFilter[train.type] === false) return;
    const d = display.get(train.trainNo);
    const lng = d?.lng ?? train.snappedLng;
    const lat = d?.lat ?? train.snappedLat;
    const heading = d?.heading ?? train.heading;
    features.push({
      type: 'Feature',
      properties: {
        trainNo: train.trainNo,
        trainName: train.trainName,
        type: train.type,
        speed: Math.round(train.speed),
        delay: train.delayMinutes,
        status: train.status,
        heading,
        icon: iconFor(train, 'loco', markerMode),
        selected: train.trainNo === selectedTrainNo ? 1 : 0,
      },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    });
  });
  return { type: 'FeatureCollection', features };
}

function trainsToConsistFC(
  trains: Map<string, TrainState>,
  display: Map<string, Pose>,
  typeFilter: Record<string, boolean>,
  selectedTrainNo: string | null
): any {
  const features: any[] = [];
  trains.forEach((train) => {
    if (typeFilter[train.type] === false) return;
    const d = display.get(train.trainNo);
    const cars = d?.cars?.length ? d.cars : train.cars;
    if (!cars || cars.length < 2) return;
    features.push({
      type: 'Feature',
      properties: {
        trainNo: train.trainNo,
        trainName: train.trainName,
        type: train.type,
        selected: train.trainNo === selectedTrainNo ? 1 : 0,
        color: LIVERY[train.type]?.body || TYPE_COLORS[train.type],
        stripe: LIVERY[train.type]?.stripe || '#F8FAFC',
      },
      geometry: {
        type: 'LineString',
        coordinates: cars.map((c) => [c.lng, c.lat]),
      },
    });
  });
  return { type: 'FeatureCollection', features };
}

function trainsToCarsFC(
  trains: Map<string, TrainState>,
  display: Map<string, Pose>,
  markerMode: 'minimal' | 'typed',
  typeFilter: Record<string, boolean>
): any {
  const features: any[] = [];
  trains.forEach((train) => {
    if (typeFilter[train.type] === false) return;
    const d = display.get(train.trainNo);
    const cars = d?.cars || [];
    cars.forEach((car, idx) => {
      if (idx === 0) return;
      features.push({
        type: 'Feature',
        properties: {
          trainNo: train.trainNo,
          trainName: train.trainName,
          type: train.type,
          heading: car.heading,
          icon: iconFor(train, car.role, markerMode),
        },
        geometry: { type: 'Point', coordinates: [car.lng, car.lat] },
      });
    });
  });
  return { type: 'FeatureCollection', features };
}

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const displayRef = useRef<Map<string, Pose>>(new Map());
  const targetRef = useRef<Map<string, Pose>>(new Map());
  const rafRef = useRef<number>(0);
  const lastPaintRef = useRef<number>(0);

  const trains = useTrainStore((s) => s.trains);
  const selectedTrainNo = useTrainStore((s) => s.selectedTrainNo);
  const theme = useTrainStore((s) => s.theme);
  const markerMode = useTrainStore((s) => s.markerMode);
  const mapDensity = useTrainStore((s) => s.mapDensity);
  const typeFilter = useTrainStore((s) => s.typeFilter);
  const followTrain = useTrainStore((s) => s.followTrain);
  const layersVisible = useTrainStore((s) => s.layersVisible);
  const focusRequest = useTrainStore((s) => s.focusRequest);
  const selectTrain = useTrainStore((s) => s.selectTrain);
  const setFocusRequest = useTrainStore((s) => s.setFocusRequest);
  const setLayersVisible = useTrainStore((s) => s.setLayersVisible);

  const [legendOpen, setLegendOpen] = useState(false);

  const darkStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const lightStyle = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  const paintNetwork = (map: maplibregl.Map, currentTheme: 'dark' | 'light') => {
    registerTrainIcons(map);

    if (!map.getSource('india-rail')) {
      map.addSource('india-rail', { type: 'geojson', data: emptyFC() });
    }
    if (!map.getSource('stations-geo')) {
      map.addSource('stations-geo', { type: 'geojson', data: emptyFC() });
    }
    if (!map.getSource('live-trains')) {
      map.addSource('live-trains', { type: 'geojson', data: emptyFC() });
    }
    if (!map.getSource('live-consist')) {
      map.addSource('live-consist', { type: 'geojson', data: emptyFC() });
    }
    if (!map.getSource('live-cars')) {
      map.addSource('live-cars', { type: 'geojson', data: emptyFC() });
    }

    if (!map.getLayer('tracks-main-glow')) {
      map.addLayer({
        id: 'tracks-main-glow',
        type: 'line',
        source: 'india-rail',
        filter: ['==', ['get', 'usage'], 'main'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': currentTheme === 'dark' ? '#38BDF8' : '#0284C7',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.2, 8, 5, 12, 9] as any,
          'line-opacity': currentTheme === 'dark' ? 0.18 : 0.16,
          'line-blur': 1.2,
        },
      });
    }

    if (!map.getLayer('tracks-main')) {
      map.addLayer({
        id: 'tracks-main',
        type: 'line',
        source: 'india-rail',
        filter: ['==', ['get', 'usage'], 'main'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': currentTheme === 'dark' ? '#7DD3FC' : '#0369A1',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 8, 1.6, 12, 2.8, 14, 4] as any,
          'line-opacity': 0.95,
        },
      });
    }

    if (!map.getLayer('tracks-branch')) {
      map.addLayer({
        id: 'tracks-branch',
        type: 'line',
        source: 'india-rail',
        filter: ['==', ['get', 'usage'], 'branch'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': currentTheme === 'dark' ? '#94A3B8' : '#475569',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 1, 12, 1.8] as any,
          'line-opacity': 0.75,
        },
      });
    }

    if (!map.getLayer('tracks-siding')) {
      map.addLayer({
        id: 'tracks-siding',
        type: 'line',
        source: 'india-rail',
        filter: ['in', ['get', 'service'], ['literal', ['siding', 'yard']]],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.siding,
          'line-width': 1.6,
          'line-dasharray': [2, 1.2],
          'line-opacity': 0.9,
        },
      });
    }

    if (!map.getLayer('stations-dot')) {
      map.addLayer({
        id: 'stations-dot',
        type: 'circle',
        source: 'stations-geo',
        minzoom: 5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 1.6, 8, 3.2, 12, 5] as any,
          'circle-color': currentTheme === 'dark' ? '#E2E8F0' : '#0F172A',
          'circle-stroke-color': currentTheme === 'dark' ? '#0B1220' : '#FFFFFF',
          'circle-stroke-width': 1,
          'circle-opacity': 0.9,
        },
      });
    }

    if (!map.getLayer('stations-label')) {
      map.addLayer({
        id: 'stations-label',
        type: 'symbol',
        source: 'stations-geo',
        minzoom: 8,
        layout: {
          'text-field': ['get', 'code'],
          'text-size': 10,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: {
          'text-color': currentTheme === 'dark' ? '#CBD5E1' : '#1E293B',
          'text-halo-color': currentTheme === 'dark' ? '#020617' : '#FFFFFF',
          'text-halo-width': 1.2,
        },
      });
    }

    if (!map.getLayer('live-consist-glow')) {
      map.addLayer({
        id: 'live-consist-glow',
        type: 'line',
        source: 'live-consist',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2.2, 8, 5, 11, 9, 14, 14] as any,
          'line-opacity': 0.28,
          'line-blur': 1.4,
        },
      });
    }

    if (!map.getLayer('live-consist')) {
      map.addLayer({
        id: 'live-consist',
        type: 'line',
        source: 'live-consist',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            ['case', ['==', ['get', 'selected'], 1], 2.6, 1.8],
            8,
            ['case', ['==', ['get', 'selected'], 1], 5.5, 3.6],
            12,
            ['case', ['==', ['get', 'selected'], 1], 10, 7],
            15,
            ['case', ['==', ['get', 'selected'], 1], 16, 12],
          ] as any,
          'line-opacity': 0.96,
        },
      });
    }

    if (!map.getLayer('live-consist-stripe')) {
      map.addLayer({
        id: 'live-consist-stripe',
        type: 'line',
        source: 'live-consist',
        minzoom: 8,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'stripe'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.1, 12, 2.2, 15, 3.4] as any,
          'line-opacity': 0.95,
        },
      });
    }

    if (!map.getLayer('live-trains-halo')) {
      map.addLayer({
        id: 'live-trains-halo',
        type: 'circle',
        source: 'live-trains',
        filter: ['==', ['get', 'trainNo'], ''],
        paint: {
          'circle-radius': 16,
          'circle-color': '#22D3EE',
          'circle-opacity': 0.22,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#67E8F9',
        },
      });
    }

    if (!map.getLayer('live-cars')) {
      map.addLayer({
        id: 'live-cars',
        type: 'symbol',
        source: 'live-cars',
        minzoom: 9,
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.42, 12, 0.7, 15, 1.05] as any,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      });
    }

    if (!map.getLayer('live-trains')) {
      map.addLayer({
        id: 'live-trains',
        type: 'symbol',
        source: 'live-trains',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.42, 7, 0.58, 11, 0.85, 14, 1.15] as any,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      });
    }

    apiGetTracksGeoJSON()
      .then((data) => {
        const src = map.getSource('india-rail') as maplibregl.GeoJSONSource;
        if (src && data) src.setData(data);
      })
      .catch(() => {
        fetch('/geojson/tracks-with-speed.geojson')
          .then((r) => r.json())
          .then((data) => {
            const src = map.getSource('india-rail') as maplibregl.GeoJSONSource;
            if (src) src.setData(data);
          })
          .catch(() => undefined);
      });

    apiGetStationsGeoJSON()
      .then((data) => {
        const src = map.getSource('stations-geo') as maplibregl.GeoJSONSource;
        if (src && data) src.setData(data);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'dark' ? darkStyle : lightStyle,
      center: [79.2, 22.8],
      zoom: 4.55,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => paintNetwork(map, theme));

    const pickTrain = (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.trainNo;
      if (id) selectTrain(id);
    };
    map.on('click', 'live-trains', pickTrain);
    map.on('click', 'live-cars', pickTrain);
    map.on('click', 'live-consist', pickTrain);

    map.on('click', (e) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: ['live-trains', 'live-cars', 'live-consist'].filter((id) => map.getLayer(id)),
      });
      if (!feats.length) selectTrain(null);
    });

    ['live-trains', 'live-cars', 'live-consist'].forEach((layer) => {
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'tp-popup',
    });

    const showPopup = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || !e.lngLat) return;
      const p = f.properties || {};
      const train = useTrainStore.getState().trains.get(p.trainNo);
      const delay = train?.delayMinutes ?? p.delay ?? 0;
      const status = train?.status ?? p.status;
      const speed = train ? Math.round(train.speed) : p.speed;
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="tp-pop">
            <div class="tp-pop-name">${p.trainName || train?.trainName || ''}</div>
            <div class="tp-pop-meta">${p.trainNo} · ${p.type} · ${speed || 0} km/h</div>
            <div class="tp-pop-delay">${status === 'LOOPED' ? 'Looped' : delay > 0 ? `+${delay} min` : 'On time'}</div>
          </div>`
        )
        .addTo(map);
    };
    map.on('mousemove', 'live-trains', showPopup);
    map.on('mousemove', 'live-consist', showPopup);
    map.on('mouseleave', 'live-trains', () => popup.remove());
    map.on('mouseleave', 'live-consist', () => popup.remove());

    mapRef.current = map;

    const lerpHeading = (from: number, to: number, t: number) => {
      let dh = to - from;
      while (dh > 180) dh -= 360;
      while (dh < -180) dh += 360;
      return from + dh * t;
    };

    const loop = (now: number) => {
      displayRef.current.forEach((d, id) => {
        const t = targetRef.current.get(id);
        if (!t) return;
        d.lng += (t.lng - d.lng) * 0.16;
        d.lat += (t.lat - d.lat) * 0.16;
        d.heading = lerpHeading(d.heading, t.heading, 0.16);
        if (t.cars && d.cars) {
          const n = Math.min(d.cars.length, t.cars.length);
          for (let i = 0; i < n; i++) {
            d.cars[i].lng += (t.cars[i].lng - d.cars[i].lng) * 0.16;
            d.cars[i].lat += (t.cars[i].lat - d.cars[i].lat) * 0.16;
            d.cars[i].heading = lerpHeading(d.cars[i].heading, t.cars[i].heading, 0.16);
          }
        }
      });

      if (now - lastPaintRef.current > 50) {
        lastPaintRef.current = now;
        const mapNow = mapRef.current;
        const headSrc = mapNow?.getSource('live-trains') as maplibregl.GeoJSONSource | undefined;
        const consistSrc = mapNow?.getSource('live-consist') as maplibregl.GeoJSONSource | undefined;
        const carSrc = mapNow?.getSource('live-cars') as maplibregl.GeoJSONSource | undefined;
        const state = useTrainStore.getState();
        if (headSrc) {
          headSrc.setData(
            trainsToHeadFC(state.trains, displayRef.current, state.markerMode, state.typeFilter, state.selectedTrainNo)
          );
        }
        if (consistSrc) {
          consistSrc.setData(
            trainsToConsistFC(state.trains, displayRef.current, state.typeFilter, state.selectedTrainNo)
          );
        }
        if (carSrc && (mapNow?.getZoom() || 0) >= 9) {
          carSrc.setData(
            trainsToCarsFC(state.trains, displayRef.current, state.markerMode, state.typeFilter)
          );
        }
        if (mapNow?.getLayer('live-trains-halo')) {
          mapNow.setFilter('live-trains-halo', ['==', ['get', 'trainNo'], state.selectedTrainNo || '']);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(theme === 'dark' ? darkStyle : lightStyle);
    map.once('style.load', () => paintNetwork(map, theme));
  }, [theme]);

  useEffect(() => {
    trains.forEach((train) => {
      const cars = (train.cars || []).map((c) => ({ ...c }));
      const tgt: Pose = {
        lng: train.snappedLng,
        lat: train.snappedLat,
        heading: train.heading,
        cars,
      };
      targetRef.current.set(train.trainNo, tgt);
      if (!displayRef.current.has(train.trainNo)) {
        displayRef.current.set(train.trainNo, {
          lng: tgt.lng,
          lat: tgt.lat,
          heading: tgt.heading,
          cars: cars.map((c) => ({ ...c })),
        });
      } else {
        const d = displayRef.current.get(train.trainNo)!;
        if (d.cars.length !== cars.length) d.cars = cars.map((c) => ({ ...c }));
      }
    });
    const live = new Set(Array.from(trains.keys()));
    displayRef.current.forEach((_v, id) => {
      if (!live.has(id)) displayRef.current.delete(id);
    });
    targetRef.current.forEach((_v, id) => {
      if (!live.has(id)) targetRef.current.delete(id);
    });
  }, [trains]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const railfan = mapDensity === 'railfan';
    const vis = (id: string, on: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };
    vis('tracks-main-glow', layersVisible.tracksMain);
    vis('tracks-main', layersVisible.tracksMain);
    vis('tracks-branch', layersVisible.tracksBranch || railfan);
    vis('tracks-siding', layersVisible.sidings || railfan);
    vis('stations-dot', layersVisible.stations);
    vis('stations-label', layersVisible.stations && railfan);
  }, [layersVisible, mapDensity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) return;
    map.easeTo({ center: [focusRequest.lng, focusRequest.lat], zoom: focusRequest.zoom, duration: 1200 });
    setFocusRequest(null);
  }, [focusRequest, setFocusRequest]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followTrain || !selectedTrainNo) return;
    const t = trains.get(selectedTrainNo);
    if (!t) return;
    map.easeTo({ center: [t.snappedLng, t.snappedLat], duration: 700, zoom: Math.max(map.getZoom(), 8) });
  }, [followTrain, selectedTrainNo, trains]);

  const glass =
    theme === 'light'
      ? 'bg-white/90 border-slate-200 text-slate-800'
      : 'bg-slate-950/80 border-white/10 text-slate-100';

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      <div className="absolute bottom-6 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setLegendOpen((v) => !v)}
          className={`${glass} backdrop-blur-md border rounded-xl px-3 py-1.5 text-[11px] font-semibold shadow-lg`}
        >
          {legendOpen ? 'Hide legend' : 'Legend'}
        </button>

        {legendOpen && (
          <div className={`${glass} backdrop-blur-md border rounded-2xl p-3 shadow-xl w-52`}>
            <div className="text-[10px] font-bold tracking-wide uppercase opacity-60 mb-2">
              {markerMode === 'typed' ? 'Train class' : 'Delay'}
            </div>
            {markerMode === 'typed' ? (
              <div className="space-y-1">
                {Object.entries(TYPE_LABEL).map(([type, label]) => {
                  const liv = LIVERY[type as keyof typeof LIVERY];
                  return (
                    <div key={type} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="w-7 h-2.5 rounded-sm overflow-hidden border border-black/20 flex"
                        title={label}
                      >
                        <span className="flex-1" style={{ background: liv.body }} />
                        <span className="w-1.5" style={{ background: liv.stripe }} />
                        <span className="w-1.5" style={{ background: liv.dark }} />
                      </span>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> On time
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 15–45 min late
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> 45+ min late
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Held / looped
                </div>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
              {[
                { key: 'tracksMain', label: 'Main lines' },
                { key: 'tracksBranch', label: 'Branches' },
                { key: 'stations', label: 'Stations' },
                { key: 'sidings', label: 'Loops' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-sky-400"
                    checked={layersVisible[item.key as keyof typeof layersVisible]}
                    onChange={(e) => setLayersVisible({ [item.key]: e.target.checked } as any)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
