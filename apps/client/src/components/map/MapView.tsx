import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useTrainStore } from '../../stores/trainStore';
import { Station } from '../../types';
import { ZONE_COLORS, TRACK_COLORS } from '../../lib/mapConstants';

interface MapViewProps {
  stations?: Station[];
  routeGeoJSON?: any;
}

export const MapView: React.FC<MapViewProps> = ({ stations = [], routeGeoJSON }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const speedBadgeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);

  const { trains, selectedTrainNo, mode, theme, selectTrain, followTrain, layersVisible, setLayersVisible } =
    useTrainStore();

  const [localStations, setLocalStations] = useState<Station[]>(stations);
  const [localRoute, setLocalRoute] = useState<any>(routeGeoJSON);
  const [speedBadgesData, setSpeedBadgesData] = useState<any>(null);

  const darkStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const lightStyle = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  // Fetch local GeoJSON data if not passed in props
  useEffect(() => {
    if (localStations.length === 0) {
      fetch('/geojson/stations.geojson')
        .then((res) => res.json())
        .then((data) => {
          const list: Station[] = (data.features || []).map((f: any) => ({
            code: f.properties.code,
            name: f.properties.name,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            zone: f.properties.zone,
            division: f.properties.division,
            kmMarker: f.properties.kmMarker,
            platforms: f.properties.platforms,
          }));
          setLocalStations(list);
        })
        .catch((e) => console.warn('Could not fetch stations.geojson:', e));
    }

    if (!localRoute) {
      fetch('/geojson/12393_NDLS_RJPB.json')
        .then((res) => res.json())
        .then((data) => setLocalRoute(data))
        .catch((e) => console.warn('Could not fetch route json:', e));
    }

    fetch('/geojson/speed-badges.geojson')
      .then((res) => res.json())
      .then((data) => setSpeedBadgesData(data))
      .catch((e) => console.warn('Could not fetch speed-badges.geojson:', e));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'dark' ? darkStyle : lightStyle,
      center: [78.2411, 27.2063],
      zoom: 6,
      pitch: 20,
      bearing: -10,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      addIRLayers(map, theme);
      if (localRoute) addTrainRoute(map, localRoute, theme);
      if (localStations.length > 0) addStationMarkers(map, localStations, theme);
      if (speedBadgesData) addSpeedBadges(map, speedBadgesData, theme);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Theme change handling
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetStyle = theme === 'dark' ? darkStyle : lightStyle;
    map.setStyle(targetStyle);

    map.once('style.load', () => {
      addIRLayers(map, theme);
      if (localRoute) addTrainRoute(map, localRoute, theme);
      if (localStations.length > 0) addStationMarkers(map, localStations, theme);
      if (speedBadgesData) addSpeedBadges(map, speedBadgesData, theme);
      applyLayerVisibility(map, layersVisible);
    });
  }, [theme]);

  // Update stations when loaded
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (localStations.length > 0) {
      addStationMarkers(map, localStations, theme);
    }
  }, [localStations]);

  // Update speed badges when loaded
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (speedBadgesData) {
      addSpeedBadges(map, speedBadgesData, theme);
    }
  }, [speedBadgesData]);

  // Route updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (localRoute) {
      addTrainRoute(map, localRoute, theme);
    }
  }, [localRoute]);

  const applyLayerVisibility = (map: maplibregl.Map, vis: typeof layersVisible) => {
    const setVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };
    setVis('zones-fill', vis.zones);
    setVis('zones-outline', vis.zones);
    setVis('zones-label', vis.zones);
    setVis('tracks-main-glow', vis.tracksMain);
    setVis('tracks-main', vis.tracksMain);
    setVis('tracks-branch', vis.tracksBranch);
    setVis('tracks-siding', vis.sidings);
    setVis('tracks-yard', vis.sidings);
    setVis('speed-labels', vis.speeds);
    setVis('speed-badges-circle', vis.speeds);
    speedBadgeMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      el.style.display = vis.speeds ? 'block' : 'none';
    });
    stationMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      el.style.display = vis.stations ? 'flex' : 'none';
    });
    setVis('stations-dot', vis.stations);
    setVis('stations-label', vis.stations);
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    applyLayerVisibility(map, layersVisible);
  }, [layersVisible]);

  const addIRLayers = (map: maplibregl.Map, currentTheme: 'dark' | 'light') => {
    if (!map.getSource('ir-zones')) {
      map.addSource('ir-zones', {
        type: 'geojson',
        data: '/geojson/zones-all.geojson',
      });
    }

    if (!map.getLayer('zones-fill')) {
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'ir-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'zone'],
            'NR', ZONE_COLORS['NR'],
            'NCR', ZONE_COLORS['NCR'],
            'CR', ZONE_COLORS['CR'],
            'WR', ZONE_COLORS['WR'],
            'SCR', ZONE_COLORS['SCR'],
            'SR', ZONE_COLORS['SR'],
            'ER', ZONE_COLORS['ER'],
            'ECR', ZONE_COLORS['ECR'],
            'NER', ZONE_COLORS['NER'],
            'NFR', ZONE_COLORS['NFR'],
            'SECR', ZONE_COLORS['SECR'],
            'SWR', ZONE_COLORS['SWR'],
            'WCR', ZONE_COLORS['WCR'],
            'ECoR', ZONE_COLORS['ECoR'],
            'NWR', ZONE_COLORS['NWR'],
            'SER', (ZONE_COLORS as any)['SER'] || '#FFCCBC',
            'KR', ZONE_COLORS['KR'],
            '#1a1a2e',
          ] as any,
          'fill-opacity': currentTheme === 'dark' ? 0.28 : 0.35,
        },
      } as any);
    }

    if (!map.getLayer('zones-outline')) {
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'ir-zones',
        paint: {
          'line-color': [
            'match',
            ['get', 'zone'],
            'NR', ZONE_COLORS['NR'],
            'NCR', ZONE_COLORS['NCR'],
            'CR', ZONE_COLORS['CR'],
            'WR', ZONE_COLORS['WR'],
            'SCR', ZONE_COLORS['SCR'],
            'SR', ZONE_COLORS['SR'],
            'ER', ZONE_COLORS['ER'],
            'ECR', ZONE_COLORS['ECR'],
            'NER', ZONE_COLORS['NER'],
            'NFR', ZONE_COLORS['NFR'],
            'SECR', ZONE_COLORS['SECR'],
            'SWR', ZONE_COLORS['SWR'],
            'WCR', ZONE_COLORS['WCR'],
            'ECoR', ZONE_COLORS['ECoR'],
            'NWR', ZONE_COLORS['NWR'],
            'SER', (ZONE_COLORS as any)['SER'] || '#FFCCBC',
            'KR', ZONE_COLORS['KR'],
            '#64748B',
          ] as any,
          'line-width': 1.2,
          'line-opacity': currentTheme === 'dark' ? 0.5 : 0.7,
          'line-dasharray': [2, 2],
        },
      } as any);
    }

    if (!map.getLayer('zones-label')) {
      map.addLayer({
        id: 'zones-label',
        type: 'symbol',
        source: 'ir-zones',
        minzoom: 4,
        maxzoom: 8,
        layout: {
          'text-field': ['get', 'zone'],
          'text-size': 14,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false,
        } as any,
        paint: {
          'text-color': currentTheme === 'dark' ? '#94A3B8' : '#475569',
          'text-halo-color': currentTheme === 'dark' ? '#0A0E17' : '#FFFFFF',
          'text-halo-width': 2,
          'text-opacity': 0.8,
        },
      } as any);
    }

    if (!map.getSource('india-rail')) {
      map.addSource('india-rail', {
        type: 'geojson',
        data: '/geojson/tracks-with-speed.geojson',
      });
    }

    if (!map.getLayer('tracks-main-glow')) {
      map.addLayer({
        id: 'tracks-main-glow',
        type: 'line',
        source: 'india-rail',
        filter: [
          'all',
          ['==', ['get', 'railway'], 'rail'],
          ['!in', ['get', 'service'], ['literal', ['siding', 'yard']]],
          ['==', ['get', 'usage'], 'main'],
        ] as any,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.main,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 8, 3, 12, 6, 14, 10] as any,
          'line-opacity': currentTheme === 'dark' ? 0.25 : 0.2,
        },
      } as any);
    }

    if (!map.getLayer('tracks-main')) {
      map.addLayer({
        id: 'tracks-main',
        type: 'line',
        source: 'india-rail',
        filter: [
          'all',
          ['==', ['get', 'railway'], 'rail'],
          ['!in', ['get', 'service'], ['literal', ['siding', 'yard']]],
          ['==', ['get', 'usage'], 'main'],
        ] as any,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.main,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.2, 12, 2.5, 14, 4] as any,
          'line-opacity': 0.95,
        },
      } as any);
    }

    if (!map.getLayer('tracks-branch')) {
      map.addLayer({
        id: 'tracks-branch',
        type: 'line',
        source: 'india-rail',
        filter: ['all', ['==', ['get', 'railway'], 'rail'], ['==', ['get', 'usage'], 'branch']] as any,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.branch,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 0.9, 12, 1.8, 14, 3] as any,
          'line-opacity': 0.8,
        },
      } as any);
    }

    if (!map.getLayer('tracks-siding')) {
      map.addLayer({
        id: 'tracks-siding',
        type: 'line',
        source: 'india-rail',
        filter: ['in', ['get', 'service'], ['literal', ['siding']]] as any,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.siding,
          'line-width': 1.8,
          'line-dasharray': [2, 1],
          'line-opacity': 0.95,
        },
      } as any);
    }

    if (!map.getLayer('tracks-yard')) {
      map.addLayer({
        id: 'tracks-yard',
        type: 'line',
        source: 'india-rail',
        filter: ['in', ['get', 'service'], ['literal', ['yard']]] as any,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': TRACK_COLORS.yard,
          'line-width': 1.2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.7,
        },
      } as any);
    }

    if (!map.getLayer('speed-labels')) {
      map.addLayer({
        id: 'speed-labels',
        type: 'symbol',
        source: 'india-rail',
        minzoom: 7,
        filter: ['all', ['has', 'maxspeed'], ['!in', ['get', 'service'], ['literal', ['siding', 'yard']]]] as any,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['concat', ['get', 'maxspeed'], ' kmph'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-pitch-alignment': 'viewport',
          'text-allow-overlap': false,
          'symbol-spacing': 400,
        } as any,
        paint: {
          'text-color': currentTheme === 'dark' ? '#0EA5E9' : '#0284C7',
          'text-halo-color': currentTheme === 'dark' ? '#0A0E17' : '#FFFFFF',
          'text-halo-width': 2,
        },
      } as any);
    }

    if (!map.getSource('stations-geo')) {
      map.addSource('stations-geo', {
        type: 'geojson',
        data: '/geojson/stations.geojson',
      });
    }

    if (!map.getLayer('stations-dot')) {
      map.addLayer({
        id: 'stations-dot',
        type: 'circle',
        source: 'stations-geo',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 4, 14, 6] as any,
          'circle-color': currentTheme === 'dark' ? '#10B981' : '#059669',
          'circle-stroke-color': currentTheme === 'dark' ? '#0A0E17' : '#FFFFFF',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      } as any);
    }

    if (!map.getLayer('stations-label')) {
      map.addLayer({
        id: 'stations-label',
        type: 'symbol',
        source: 'stations-geo',
        minzoom: 7,
        layout: {
          'text-field': ['concat', ['get', 'name'], ' (', ['get', 'code'], ')'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        } as any,
        paint: {
          'text-color': currentTheme === 'dark' ? '#E2E8F0' : '#1E293B',
          'text-halo-color': currentTheme === 'dark' ? '#0A0E17' : '#FFFFFF',
          'text-halo-width': 1.5,
        },
      } as any);
    }

    if (!map.getSource('speed-badges')) {
      map.addSource('speed-badges', {
        type: 'geojson',
        data: '/geojson/speed-badges.geojson',
      });
    }

    if (!map.getLayer('speed-badges-circle')) {
      map.addLayer({
        id: 'speed-badges-circle',
        type: 'circle',
        source: 'speed-badges',
        minzoom: 9,
        paint: {
          'circle-radius': 0,
          'circle-opacity': 0,
        },
      } as any);
    }
  };

  const addTrainRoute = (map: maplibregl.Map, geojson: any, currentTheme: 'dark' | 'light') => {
    if (!geojson) return;
    if (map.getSource('rail-track-demo')) {
      (map.getSource('rail-track-demo') as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }
    map.addSource('rail-track-demo', {
      type: 'geojson',
      data: geojson,
    });

    const trackColor = currentTheme === 'dark' ? '#4DA8FF' : '#0284C7';

    if (!map.getLayer('rail-track-demo-glow')) {
      map.addLayer({
        id: 'rail-track-demo-glow',
        type: 'line',
        source: 'rail-track-demo',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': trackColor,
          'line-width': 8,
          'line-opacity': 0.25,
          'line-blur': 4,
        },
      });
    }

    if (!map.getLayer('rail-track-demo-line')) {
      map.addLayer({
        id: 'rail-track-demo-line',
        type: 'line',
        source: 'rail-track-demo',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': trackColor,
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });
    }
  };

  const addStationMarkers = (map: maplibregl.Map, stList: Station[], currentTheme: 'dark' | 'light') => {
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    stList.forEach((st) => {
      const el = document.createElement('div');
      el.className = 'group relative flex flex-col items-center cursor-pointer';
      const bgCard =
        currentTheme === 'dark'
          ? 'bg-slate-950/90 text-slate-200 border-slate-800'
          : 'bg-white/95 text-slate-900 border-slate-300';

      el.innerHTML = `
        <div class="w-3.5 h-3.5 rotate-45 ${
          currentTheme === 'dark' ? 'bg-slate-900 border-emerald-400' : 'bg-white border-emerald-600'
        } border-2 group-hover:scale-125 transition-transform shadow-lg"></div>
        <div class="absolute bottom-5 px-2 py-0.5 ${bgCard} text-[10px] font-bold border rounded-md whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ${st.name} <span class="${currentTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-mono">(${
        st.code
      })</span> • ${st.zone || ''}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el }).setLngLat([st.lng, st.lat]).addTo(map);
      stationMarkersRef.current.push(marker);
    });
  };

  const addSpeedBadges = (map: maplibregl.Map, badgesData: any, _currentTheme: 'dark' | 'light') => {
    speedBadgeMarkersRef.current.forEach((m) => m.remove());
    speedBadgeMarkersRef.current = [];

    const badges = badgesData?.features || [];

    badges.forEach((feat: any) => {
      const coords = feat.geometry.coordinates;
      const speed = feat.properties.maxspeed;
      const zone = feat.properties.zone || '';
      const usage = feat.properties.usage || 'main';

      const el = document.createElement('div');
      el.className = 'speed-badge';
      el.textContent = `${speed} kmph`;
      el.title = `${feat.properties.name || 'Section'} • ${zone} • ${usage}`;

      let bg = '#E0F2FE';
      let color = '#0369A1';
      let border = '#7DD3FC';
      const s = parseInt(speed);
      if (s >= 130) {
        bg = '#DCFCE7';
        color = '#166534';
        border = '#86EFAC';
      } else if (s >= 110) {
        bg = '#E0F2FE';
        color = '#075985';
        border = '#7DD3FC';
      } else if (s >= 100) {
        bg = '#FEF9C3';
        color = '#854D0E';
        border = '#FDE047';
      } else if (s <= 30) {
        bg = '#FFEDD5';
        color = '#9A3412';
        border = '#FDBA74';
      }

      el.style.background = bg;
      el.style.color = color;
      el.style.borderColor = border;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coords)
        .addTo(map);

      speedBadgeMarkersRef.current.push(marker);
    });

    const updateBadgeVisibility = () => {
      const z = map.getZoom();
      const shouldShow = z >= 8;
      speedBadgeMarkersRef.current.forEach((m) => {
        const el = m.getElement();
        el.style.display = shouldShow && layersVisible.speeds ? 'block' : 'none';
      });
    };

    map.on('zoom', updateBadgeVisibility);
    updateBadgeVisibility();
  };

  // Render & Update Live Trains
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    trains.forEach((train) => {
      const isSelected = train.trainNo === selectedTrainNo;
      const isLooped = train.status === 'LOOPED';

      let marker = markersRef.current.get(train.trainNo);

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'train-marker-wrapper cursor-pointer';
        el.onclick = () => selectTrain(train.trainNo);

        marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([train.snappedLng, train.snappedLat])
          .addTo(map);

        markersRef.current.set(train.trainNo, marker);
      } else {
        marker.setLngLat([train.snappedLng, train.snappedLat]);
      }

      const el = marker.getElement();
      const color = train.type === 'RAJDHANI' ? '#F59E0B' : '#4DA8FF';

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isSelected
              ? `<div class="absolute w-12 h-12 rounded-full border-2 border-emerald-400 pulsing-ring pointer-events-none"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-2xl transition-transform ${
            isSelected ? 'scale-125 ring-2 ring-white' : ''
          }" style="background: ${color};">
            <svg class="w-4 h-4 text-slate-950 transform" style="transform: rotate(${train.heading - 90}deg)" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>

          ${
            isLooped
              ? `<div class="absolute -top-3 -right-3 bg-amber-500 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-slate-900 animate-bounce">
                  ⚡
                </div>`
              : ''
          }

          <div class="absolute top-9 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap shadow-xl border pointer-events-none ${
            theme === 'light'
              ? 'bg-white/95 text-slate-900 border-slate-300'
              : 'bg-slate-950/90 text-slate-200 border-slate-800'
          }">
            ${train.trainName} • <span class="${train.speed === 0 ? 'text-amber-500' : 'text-emerald-500'}">${Math.round(
        train.speed
      )} km/h</span>
          </div>
        </div>
      `;
    });

    // Follow selected train camera
    if (followTrain && selectedTrainNo && trains.has(selectedTrainNo)) {
      const sel = trains.get(selectedTrainNo)!;
      map.easeTo({
        center: [sel.snappedLng, sel.snappedLat],
        duration: 1000,
      });
    }
  }, [trains, selectedTrainNo, mode, theme, followTrain, selectTrain]);

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Layer Control Widget */}
      <div className="absolute bottom-24 left-3 z-20 flex flex-col gap-2">
        <div
          className={`${
            theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-700'
          } backdrop-blur-md border rounded-xl p-2.5 shadow-xl`}
        >
          <div className="text-[10px] font-bold font-mono mb-1.5 opacity-70">MAP LAYERS — IRI Replica</div>
          <div className="flex flex-col gap-1">
            {[
              { key: 'zones', label: 'Zone Fills', color: '#BBDEFB', desc: 'NR/NCR/CR...' },
              { key: 'tracksMain', label: 'Mainline', color: TRACK_COLORS.main, desc: '130 kmph' },
              { key: 'tracksBranch', label: 'Branch', color: TRACK_COLORS.branch, desc: '100-110' },
              { key: 'sidings', label: 'Loops/Sidings', color: TRACK_COLORS.siding, desc: '30 kmph' },
              { key: 'speeds', label: 'Speed Badges', color: '#0EA5E9', desc: '110 kmph' },
              { key: 'stations', label: 'Stations', color: '#10B981', desc: 'Jn markers' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 cursor-pointer text-[11px] hover:opacity-80"
              >
                <input
                  type="checkbox"
                  checked={layersVisible[item.key as keyof typeof layersVisible]}
                  onChange={(e) =>
                    setLayersVisible({ [item.key]: e.target.checked } as any)
                  }
                  className="w-3 h-3 rounded"
                />
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: item.color }} />
                <span className="font-medium">{item.label}</span>
                <span className="text-[9px] opacity-50 font-mono">{item.desc}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/30 text-[9px] font-mono opacity-50">
            Bottom→Top: Zones → Tracks → Speeds → Stations → Trains
          </div>
        </div>

        {layersVisible.zones && (
          <div
            className={`${
              theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-700'
            } backdrop-blur-md border rounded-xl p-2 shadow-xl max-h-32 overflow-y-auto`}
          >
            <div className="text-[10px] font-bold font-mono mb-1 opacity-70">
              ZONES — {Object.keys(ZONE_COLORS).length} Zones
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {Object.entries(ZONE_COLORS).map(([code, col]) => (
                <div key={code} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-3 rounded-sm border border-black/10" style={{ background: col }} />
                  <span className="font-mono font-bold">{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
