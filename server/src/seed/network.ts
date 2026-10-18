import { Station } from '../../../../packages/core/types/train';
import { STATION_CATALOG, stationList } from './stationsCatalog';
import { EXTRA_WAYPOINTS, ROUTE_CATALOG, RouteDef } from './routeCatalog';
import { indexPolyline, LngLat, PolylineIndex } from '../simulation/geo';

export interface BuiltRoute {
  def: RouteDef;
  coords: LngLat[];
  index: PolylineIndex;
  stationKm: Array<{ code: string; name: string; km: number }>;
}

export interface BuiltNetwork {
  stations: Station[];
  routes: BuiltRoute[];
  routeById: Map<string, BuiltRoute>;
  tracksGeoJSON: any;
  stationsGeoJSON: any;
}

function coordsForRoute(def: RouteDef): LngLat[] {
  const extras = EXTRA_WAYPOINTS[def.id] || [];
  const coords: LngLat[] = [];
  for (const code of def.stations) {
    const st = STATION_CATALOG[code];
    if (!st) {
      console.warn(`[network] missing station ${code} on ${def.id}`);
      continue;
    }
    coords.push([st.lng, st.lat]);
    for (const extra of extras.filter((e) => e.after === code)) {
      coords.push([extra.lng, extra.lat]);
    }
  }
  return coords;
}

function sidingFeature(id: string, name: string, around: LngLat, headingRad: number): any {
  const dx = 0.012 * Math.cos(headingRad);
  const dy = 0.008 * Math.sin(headingRad);
  const off = 0.004;
  return {
    type: 'Feature',
    properties: {
      id,
      name,
      railway: 'rail',
      service: 'siding',
      maxspeed: '30',
      usage: 'siding',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [around[0] - dx, around[1] - dy + off],
        [around[0], around[1] + off],
        [around[0] + dx, around[1] + dy + off],
      ],
    },
  };
}

let cached: BuiltNetwork | null = null;

export function buildNetwork(): BuiltNetwork {
  if (cached) return cached;

  const stations: Station[] = stationList().map((s) => ({
    code: s.code,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    kmMarker: 0,
    hasLoopLine: ['TDL', 'CNB', 'BZA', 'NGP', 'ET', 'KZJ', 'JHS', 'BPL'].includes(s.code),
    loopLineCount: ['TDL', 'CNB', 'BZA', 'NGP'].includes(s.code) ? 2 : 0,
    platforms: s.platforms || 2,
    zone: s.zone,
    division: s.zone,
  }));

  const routes: BuiltRoute[] = [];
  const trackFeatures: any[] = [];

  for (const def of ROUTE_CATALOG) {
    const coords = coordsForRoute(def);
    if (coords.length < 2) continue;
    const index = indexPolyline(coords);
    const stationKm: BuiltRoute['stationKm'] = [];
    let cursor = 0;
    for (const code of def.stations) {
      const st = STATION_CATALOG[code];
      if (!st) continue;
      let best = cursor;
      let bestD = Infinity;
      for (let i = cursor; i < coords.length; i++) {
        const d = Math.hypot(coords[i][0] - st.lng, coords[i][1] - st.lat);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      cursor = best;
      stationKm.push({ code: st.code, name: st.name, km: index.cumKm[best] || 0 });
    }

    routes.push({ def, coords, index, stationKm });

    trackFeatures.push({
      type: 'Feature',
      properties: {
        id: def.id,
        name: def.name,
        railway: 'rail',
        usage: def.usage,
        gauge: '1676',
        electrified: 'contact_line',
        maxspeed: String(def.maxspeed),
        zone: def.zone,
        section: def.id,
      },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }

  const tdl = STATION_CATALOG.TDL;
  const cnb = STATION_CATALOG.CNB;
  const ndls = STATION_CATALOG.NDLS;
  const hwh = STATION_CATALOG.HWH;
  const bza = STATION_CATALOG.BZA;
  if (tdl) trackFeatures.push(sidingFeature('TDL_LOOP_1', 'Tundla Jn Loop 1', [tdl.lng, tdl.lat], 0.4));
  if (tdl) trackFeatures.push(sidingFeature('TDL_LOOP_2', 'Tundla Jn Loop 2', [tdl.lng, tdl.lat], 0.55));
  if (cnb) {
    trackFeatures.push({
      type: 'Feature',
      properties: {
        id: 'CNB_YARD',
        name: 'Kanpur Central Yard',
        railway: 'rail',
        service: 'yard',
        maxspeed: '15',
        usage: 'yard',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [cnb.lng - 0.01, cnb.lat + 0.006],
          [cnb.lng, cnb.lat + 0.004],
          [cnb.lng + 0.012, cnb.lat + 0.002],
        ],
      },
    });
  }
  if (ndls) trackFeatures.push(sidingFeature('NDLS_YARD', 'New Delhi Yard', [ndls.lng, ndls.lat], 1.2));
  if (hwh) trackFeatures.push(sidingFeature('HWH_YARD', 'Howrah Yard', [hwh.lng, hwh.lat], 2.1));
  if (bza) trackFeatures.push(sidingFeature('BZA_LOOP', 'Vijayawada Loop', [bza.lng, bza.lat], 0.9));

  const stationsGeoJSON: any = {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature',
      properties: {
        code: s.code,
        name: s.name,
        zone: s.zone,
        division: s.division,
        platforms: s.platforms,
      },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    })),
  };

  const tracksGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: trackFeatures,
  };

  const routeById = new Map<string, BuiltRoute>();
  routes.forEach((r) => routeById.set(r.def.id, r));

  cached = { stations, routes, routeById, tracksGeoJSON, stationsGeoJSON };
  return cached;
}

export function findStationAtKm(route: BuiltRoute, km: number, direction: 1 | -1) {
  const list = route.stationKm;
  if (!list.length) return null;
  if (direction === 1) {
    for (const s of list) {
      if (s.km > km + 0.4) return s;
    }
    return list[list.length - 1];
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].km < km - 0.4) return list[i];
  }
  return list[0];
}

export function findLastStation(route: BuiltRoute, km: number, direction: 1 | -1) {
  const list = route.stationKm;
  if (!list.length) return null;
  if (direction === 1) {
    let last = list[0];
    for (const s of list) {
      if (s.km <= km) last = s;
      else break;
    }
    return last;
  }
  let last = list[list.length - 1];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].km >= km) last = list[i];
    else break;
  }
  return last;
}
