import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useTrainStore } from '../../stores/trainStore';
import { Station } from '../../../../packages/core/types/train';

interface MapViewProps {
  stations: Station[];
  routeGeoJSON: any;
}

export const MapView: React.FC<MapViewProps> = ({ stations, routeGeoJSON }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const { trains, selectedTrainNo, mode, theme, selectTrain, followTrain } = useTrainStore();

  const darkStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const lightStyle = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'dark' ? darkStyle : lightStyle,
      center: [78.2411, 27.2063], // Centered around Tundla Jn / Kanpur corridor
      zoom: 10,
      pitch: 35,
      bearing: -15
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      addTrackAndStations(map, routeGeoJSON, stations, theme);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stations, routeGeoJSON]);

  // Update style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetStyle = theme === 'dark' ? darkStyle : lightStyle;
    map.setStyle(targetStyle);

    map.once('style.load', () => {
      addTrackAndStations(map, routeGeoJSON, stations, theme);
    });
  }, [theme, routeGeoJSON, stations]);

  // Helper to re-add track layers & station markers after style change
  const addTrackAndStations = (map: maplibregl.Map, geojson: any, stList: Station[], currentTheme: 'dark' | 'light') => {
    if (geojson && !map.getSource('rail-track')) {
      map.addSource('rail-track', {
        type: 'geojson',
        data: geojson
      });

      const trackColor = currentTheme === 'dark' ? '#4DA8FF' : '#0284C7';

      // Mainline Track Glow
      map.addLayer({
        id: 'rail-track-glow',
        type: 'line',
        source: 'rail-track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': trackColor,
          'line-width': 6,
          'line-opacity': 0.35
        }
      });

      // Mainline Track Center
      map.addLayer({
        id: 'rail-track-line',
        type: 'line',
        source: 'rail-track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': trackColor,
          'line-width': 3
        }
      });
    }

    // Add Station Markers
    stList.forEach((st) => {
      const el = document.createElement('div');
      el.className = 'group relative flex flex-col items-center cursor-pointer';

      const bgCard = currentTheme === 'dark' ? 'bg-slate-950/90 text-slate-200 border-slate-800' : 'bg-white/95 text-slate-900 border-slate-300';

      el.innerHTML = `
        <div class="w-3.5 h-3.5 rotate-45 ${currentTheme === 'dark' ? 'bg-slate-900 border-emerald-400' : 'bg-white border-emerald-600'} border-2 group-hover:scale-125 transition-transform shadow-lg"></div>
        <div class="absolute bottom-5 px-2 py-0.5 ${bgCard} text-[10px] font-bold border rounded-md whitespace-nowrap shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
          ${st.name} <span class="${currentTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-mono">(${st.code})</span>
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat([st.lng, st.lat])
        .addTo(map);
    });
  };

  // Update Train Markers on state change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    trains.forEach((train) => {
      const isSelected = train.trainNo === selectedTrainNo;
      const isLooped = train.status === 'LOOPED';

      let marker = markersRef.current.get(train.trainNo);

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer relative flex items-center justify-center';

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([train.snappedLng, train.snappedLat])
          .addTo(map);

        el.addEventListener('click', () => {
          selectTrain(train.trainNo);
          map.flyTo({ center: [train.snappedLng, train.snappedLat], zoom: 12, speed: 1.2 });
        });

        markersRef.current.set(train.trainNo, marker);
      } else {
        marker.setLngLat([train.snappedLng, train.snappedLat]);
      }

      // Render custom html marker with speed vector arrow
      const el = marker.getElement();
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isSelected ? '<div class="absolute w-12 h-12 rounded-full border-2 border-accentBlue pulsing-ring"></div>' : ''}
          <div class="w-8 h-8 rounded-full ${
            isLooped
              ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-amber-500/80 ring-4 ring-amber-500/20'
              : train.type === 'RAJDHANI'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/80 ring-4 ring-cyan-500/20'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/80'
          } shadow-xl flex items-center justify-center font-bold text-[10px] text-slate-950 font-mono border border-white/60">
            ${train.type === 'RAJDHANI' ? 'RAJ' : 'SF'}
          </div>

          ${
            mode === 'RAILFAN'
              ? `<div class="absolute -bottom-6 px-1.5 py-0.5 ${
                  theme === 'dark' ? 'bg-slate-950/95 border-slate-700 text-white' : 'bg-white/95 border-slate-300 text-slate-900'
                } border text-[9px] font-mono rounded whitespace-nowrap shadow-lg">
                  ${train.trainNo} • ${Math.round(train.speed)} km/h
                </div>`
              : ''
          }
        </div>
      `;
    });

    // Follow active train camera
    if (followTrain && selectedTrainNo) {
      const selectedState = trains.get(selectedTrainNo);
      if (selectedState && map) {
        map.easeTo({
          center: [selectedState.snappedLng, selectedState.snappedLat],
          duration: 1000
        });
      }
    }
  }, [trains, selectedTrainNo, mode, theme, followTrain, selectTrain]);

  return <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />;
};
