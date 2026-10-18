import { TrainState } from '../../../../packages/core/types/train';
import { alongPolyline, offsetLngLat, sampleConsist } from '../simulation/geo';
import { buildNetwork, BuiltRoute, findLastStation, findStationAtKm } from './network';
import { STATION_CATALOG } from './stationsCatalog';

export type TrainType = TrainState['type'];

export interface SimMeta {
  routeId: string;
  progress: number;
  direction: 1 | -1;
  cruiseSpeed: number;
  dwellUntil: number;
  looped: boolean;
}

const TYPE_SPEED: Record<string, number> = {
  VANDE_BHARAT: 110,
  RAJDHANI: 105,
  SHATABDI: 100,
  DURONTO: 95,
  SF: 82,
  MAIL: 68,
  PASSENGER: 48,
  FREIGHT: 42,
};

const CONSIST: Record<string, { cars: number; carKm: number }> = {
  VANDE_BHARAT: { cars: 8, carKm: 0.038 },
  RAJDHANI: { cars: 10, carKm: 0.038 },
  SHATABDI: { cars: 8, carKm: 0.036 },
  DURONTO: { cars: 9, carKm: 0.036 },
  SF: { cars: 8, carKm: 0.034 },
  MAIL: { cars: 8, carKm: 0.034 },
  PASSENGER: { cars: 6, carKm: 0.032 },
  FREIGHT: { cars: 14, carKm: 0.028 },
};

const TYPE_PRIORITY: Record<string, number> = {
  RAJDHANI: 1,
  VANDE_BHARAT: 1,
  SHATABDI: 2,
  DURONTO: 2,
  SF: 3,
  MAIL: 4,
  PASSENGER: 5,
  FREIGHT: 6,
};

interface NamedSpec {
  trainNo: string;
  trainName: string;
  type: TrainType;
  routeId: string;
  progress: number;
  direction: 1 | -1;
  delay?: number;
  looped?: boolean;
}

const NAMED: NamedSpec[] = [
  { trainNo: '12301', trainName: 'Howrah Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_HWH', progress: 0.18, direction: 1, delay: 5 },
  { trainNo: '12302', trainName: 'Howrah Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_HWH', progress: 0.72, direction: -1, delay: 12 },
  { trainNo: '12393', trainName: 'Sampoorna Kranti Express', type: 'SF', routeId: 'NDLS_HWH', progress: 0.22, direction: 1, delay: 42, looped: true },
  { trainNo: '12394', trainName: 'Sampoorna Kranti Express', type: 'SF', routeId: 'NDLS_HWH', progress: 0.61, direction: -1, delay: 18 },
  { trainNo: '12951', trainName: 'Mumbai Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_BCT', progress: 0.14, direction: 1, delay: 0 },
  { trainNo: '12952', trainName: 'Mumbai Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_BCT', progress: 0.66, direction: -1, delay: 8 },
  { trainNo: '12423', trainName: 'Dibrugarh Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_GKP', progress: 0.4, direction: 1, delay: 22 },
  { trainNo: '12434', trainName: 'Chennai Rajdhani Express', type: 'RAJDHANI', routeId: 'NDLS_MAS', progress: 0.35, direction: 1, delay: 3 },
  { trainNo: '22691', trainName: 'KSR Bengaluru Rajdhani', type: 'RAJDHANI', routeId: 'NDLS_SBC', progress: 0.28, direction: 1, delay: 15 },
  { trainNo: '12957', trainName: 'Swarna Jayanti Rajdhani', type: 'RAJDHANI', routeId: 'NDLS_ADI', progress: 0.33, direction: 1, delay: 6 },
  { trainNo: '22435', trainName: 'Varanasi Vande Bharat', type: 'VANDE_BHARAT', routeId: 'NDLS_LKO_BSB', progress: 0.45, direction: 1, delay: 0 },
  { trainNo: '20901', trainName: 'Ahmedabad Vande Bharat', type: 'VANDE_BHARAT', routeId: 'NDLS_ADI', progress: 0.2, direction: 1, delay: 4 },
  { trainNo: '22201', trainName: 'Sealdah Vande Bharat', type: 'VANDE_BHARAT', routeId: 'NDLS_HWH', progress: 0.55, direction: -1, delay: 2 },
  { trainNo: '20607', trainName: 'Mysuru Vande Bharat', type: 'VANDE_BHARAT', routeId: 'MAS_SBC', progress: 0.4, direction: 1, delay: 0 },
  { trainNo: '26401', trainName: 'Ernakulam Vande Bharat', type: 'VANDE_BHARAT', routeId: 'MAS_TVC', progress: 0.38, direction: 1, delay: 7 },
  { trainNo: '12001', trainName: 'Bhopal Shatabdi Express', type: 'SHATABDI', routeId: 'NDLS_MAS', progress: 0.16, direction: 1, delay: 0 },
  { trainNo: '12002', trainName: 'Bhopal Shatabdi Express', type: 'SHATABDI', routeId: 'NDLS_MAS', progress: 0.22, direction: -1, delay: 9 },
  { trainNo: '12009', trainName: 'Ahmedabad Shatabdi', type: 'SHATABDI', routeId: 'NDLS_ADI', progress: 0.48, direction: 1, delay: 11 },
  { trainNo: '12007', trainName: 'Mysuru Shatabdi', type: 'SHATABDI', routeId: 'MAS_SBC', progress: 0.62, direction: 1, delay: 0 },
  { trainNo: '12259', trainName: 'Sealdah Duronto Express', type: 'DURONTO', routeId: 'NDLS_HWH', progress: 0.41, direction: 1, delay: 27 },
  { trainNo: '12223', trainName: 'LTT Ernakulam Duronto', type: 'DURONTO', routeId: 'KONKAN', progress: 0.3, direction: 1, delay: 14 },
  { trainNo: '12621', trainName: 'Tamil Nadu Express', type: 'SF', routeId: 'NDLS_MAS', progress: 0.52, direction: 1, delay: 33 },
  { trainNo: '12622', trainName: 'Tamil Nadu Express', type: 'SF', routeId: 'NDLS_MAS', progress: 0.48, direction: -1, delay: 19 },
  { trainNo: '12627', trainName: 'Karnataka Express', type: 'SF', routeId: 'NDLS_SBC', progress: 0.61, direction: 1, delay: 41 },
  { trainNo: '12801', trainName: 'Purushottam Express', type: 'SF', routeId: 'NDLS_HWH', progress: 0.33, direction: 1, delay: 16 },
  { trainNo: '12615', trainName: 'Grand Trunk Express', type: 'MAIL', routeId: 'NDLS_MAS', progress: 0.27, direction: 1, delay: 48 },
  { trainNo: '12311', trainName: 'Howrah Kalka Mail', type: 'MAIL', routeId: 'NDLS_HWH', progress: 0.08, direction: -1, delay: 55 },
  { trainNo: '12903', trainName: 'Golden Temple Mail', type: 'MAIL', routeId: 'NDLS_ASR', progress: 0.5, direction: 1, delay: 21 },
  { trainNo: '12617', trainName: 'Mangala Lakshadweep Exp', type: 'SF', routeId: 'KONKAN', progress: 0.55, direction: 1, delay: 29 },
  { trainNo: '12841', trainName: 'Coromandel Express', type: 'SF', routeId: 'HWH_MAS', progress: 0.36, direction: 1, delay: 8 },
  { trainNo: '12842', trainName: 'Coromandel Express', type: 'SF', routeId: 'HWH_MAS', progress: 0.44, direction: -1, delay: 25 },
  { trainNo: '12809', trainName: 'Howrah Mail', type: 'MAIL', routeId: 'CSMT_HWH', progress: 0.42, direction: 1, delay: 37 },
  { trainNo: '11077', trainName: 'Jhelum Express', type: 'MAIL', routeId: 'NDLS_JAT', progress: 0.35, direction: 1, delay: 14 },
  { trainNo: '12431', trainName: 'Thiruvananthapuram Rajdhani', type: 'RAJDHANI', routeId: 'KONKAN', progress: 0.18, direction: 1, delay: 6 },
  { trainNo: '19019', trainName: 'Dehradun Express', type: 'MAIL', routeId: 'NDLS_DDN', progress: 0.55, direction: 1, delay: 44 },
  { trainNo: '12926', trainName: 'Paschim Express', type: 'SF', routeId: 'NDLS_BCT', progress: 0.4, direction: -1, delay: 17 },
  { trainNo: '12625', trainName: 'Kerala Express', type: 'SF', routeId: 'NDLS_MAS', progress: 0.78, direction: 1, delay: 52 },
  { trainNo: '12723', trainName: 'Telangana Express', type: 'SF', routeId: 'SC_MAS', progress: 0.2, direction: -1, delay: 9 },
  { trainNo: '18645', trainName: 'East Coast Express', type: 'MAIL', routeId: 'HWH_MAS', progress: 0.22, direction: 1, delay: 61 },
  { trainNo: '15647', trainName: 'Guwahati Express', type: 'MAIL', routeId: 'HWH_GHY', progress: 0.48, direction: 1, delay: 73 },
  { trainNo: '15959', trainName: 'Kamrup Express', type: 'MAIL', routeId: 'HWH_GHY', progress: 0.62, direction: 1, delay: 88 },
  { trainNo: '12505', trainName: 'North East Express', type: 'SF', routeId: 'NDLS_GKP', progress: 0.7, direction: 1, delay: 36 },
  { trainNo: '12204', trainName: 'Amritsar Garib Rath', type: 'SF', routeId: 'NDLS_ASR', progress: 0.25, direction: 1, delay: 13 },
  { trainNo: '12903A', trainName: 'Golden Temple Mail', type: 'MAIL', routeId: 'NDLS_ASR', progress: 0.7, direction: -1, delay: 5 },
];

function pickType(i: number): TrainType {
  const r = i % 17;
  if (r === 0) return 'FREIGHT';
  if (r === 1) return 'FREIGHT';
  if (r === 2) return 'PASSENGER';
  if (r === 3) return 'PASSENGER';
  if (r === 4) return 'MAIL';
  if (r === 5) return 'MAIL';
  if (r === 6) return 'MAIL';
  if (r === 7) return 'SF';
  if (r === 8) return 'SF';
  if (r === 9) return 'SF';
  if (r === 10) return 'SF';
  if (r === 11) return 'FREIGHT';
  if (r === 12) return 'PASSENGER';
  if (r === 13) return 'MAIL';
  if (r === 14) return 'SF';
  if (r === 15) return 'DURONTO';
  return 'SF';
}

const NAME_POOL = [
  'Ganga', 'Godavari', 'Narmada', 'Kaveri', 'Krishna', 'Yamuna', 'Tapti', 'Mahanadi',
  'Saryu', 'Gomti', 'Sabarmati', 'Shipra', 'Teesta', 'Brahmaputra', 'Kosi', 'Betwa',
  'Chambal', 'Indravati', 'Pennar', 'Palar', 'Vaigai', 'Periyar', 'Mandakini', 'Alaknanda',
];

function fillerName(type: TrainType, i: number, routeName: string): string {
  const river = NAME_POOL[i % NAME_POOL.length];
  if (type === 'FREIGHT') return `${river} Goods`;
  if (type === 'PASSENGER') return `${river} Passenger`;
  if (type === 'MAIL') return `${river} Mail`;
  if (type === 'DURONTO') return `${river} Duronto`;
  return `${river} SF Express`;
}

function terminals(route: BuiltRoute, direction: 1 | -1) {
  const a = route.stationKm[0];
  const b = route.stationKm[route.stationKm.length - 1];
  if (direction === 1) return { from: a?.code || 'XXX', to: b?.code || 'YYY' };
  return { from: b?.code || 'YYY', to: a?.code || 'XXX' };
}

export function materializeTrain(
  spec: {
    trainNo: string;
    trainName: string;
    type: TrainType;
    delayMinutes: number;
    looped?: boolean;
    dwellUntil?: number;
  },
  route: BuiltRoute,
  meta: SimMeta
): TrainState {
  const length = route.index.lengthKm || 1;
  const km = meta.progress * length;
  const along = alongPolyline(route.index, km);
  let coord = along.coord;
  let heading = along.heading;
  if (meta.direction === -1) heading = (heading + 180) % 360;
  if (meta.looped) {
    coord = offsetLngLat(coord, heading, 28);
  }

  const next = findStationAtKm(route, km, meta.direction);
  const last = findLastStation(route, km, meta.direction);
  const nextKm = next ? Math.abs(next.km - km) : 12;
  const speed = meta.dwellUntil > Date.now() || meta.looped ? 0 : meta.cruiseSpeed;
  const ends = terminals(route, meta.direction);
  const nextInfo = next
    ? {
        code: next.code,
        name: next.name,
        distanceKm: Math.round(nextKm * 10) / 10,
        etaMinutes: speed > 1 ? Math.max(1, Math.round((nextKm / speed) * 60)) : 18,
        scheduledTime: '—',
      }
    : {
        code: ends.to,
        name: STATION_CATALOG[ends.to]?.name || ends.to,
        distanceKm: 12,
        etaMinutes: 20,
        scheduledTime: '—',
      };

  const consistSpec = CONSIST[spec.type] || CONSIST.SF;
  let cars = sampleConsist(route.index, km, meta.direction, consistSpec.cars, consistSpec.carKm);
  if (meta.looped) {
    cars = cars.map((c) => {
      const off = offsetLngLat([c.lng, c.lat], c.heading, 28);
      return { ...c, lng: off[0], lat: off[1] };
    });
  }

  const status: TrainState['status'] = meta.looped
    ? 'LOOPED'
    : speed < 3
    ? 'STOPPED'
    : 'RUNNING';

  const contextReasons =
    meta.looped
      ? [
          {
            priority: 1,
            type: 'LOOPED' as const,
            icon: '🔄',
            title: `Looped at ${last?.name || 'junction'}`,
            subtitle: 'Yielding mainline to a higher-priority service',
            detail: 'Demo hold on the loop siding. Mainline traffic is being given precedence.',
            estimatedHoldMinutes: 6,
            confidence: 'HIGH' as const,
          },
        ]
      : speed < 3
      ? [
          {
            priority: 2,
            type: 'STATION_DWELL' as const,
            icon: '⏸',
            title: `Stopped at ${last?.name || 'station'}`,
            subtitle: 'Scheduled halt / crew change',
            confidence: 'HIGH' as const,
          },
        ]
      : spec.delayMinutes > 40
      ? [
          {
            priority: 3,
            type: 'CONGESTION' as const,
            icon: '⚠️',
            title: `Running ${spec.delayMinutes} min late`,
            subtitle: 'Section congestion on the trunk route',
            confidence: 'MEDIUM' as const,
          },
        ]
      : [
          {
            priority: 5,
            type: 'UNKNOWN' as const,
            icon: '▶',
            title: 'Running on time',
            subtitle: 'Mainline clear ahead',
            confidence: 'HIGH' as const,
          },
        ];

  return {
    trainNo: spec.trainNo,
    trainName: spec.trainName,
    type: spec.type,
    priority: TYPE_PRIORITY[spec.type] || 4,
    lat: coord[1],
    lng: coord[0],
    snappedLat: coord[1],
    snappedLng: coord[0],
    kmMarker: Math.round(km * 10) / 10,
    heading,
    speed,
    maxSpeedToday: Math.round((TYPE_SPEED[spec.type] || 80) * 1.15),
    avgSpeedLastHour: Math.round(speed * 0.92 || 40),
    speedHistory: [
      { timestamp: Date.now() - 3600000, speed: speed * 0.9 },
      { timestamp: Date.now() - 1800000, speed: speed * 1.05 },
      { timestamp: Date.now(), speed },
    ],
    status,
    isOnLoopLine: !!meta.looped,
    lateralOffset: meta.looped ? 24 : 0.4,
    slowDuration: speed < 5 ? 90 : 0,
    delayMinutes: spec.delayMinutes,
    contextReasons,
    nearbyTrains: [],
    overtakePredictions: [],
    dataSource: 'INTERPOLATED',
    confidence: 'HIGH',
    reporterCount: 0,
    lastUpdated: new Date().toISOString(),
    routeId: route.def.id,
    fromStation: ends.from,
    toStation: ends.to,
    nextStation: nextInfo,
    lastStation: {
      code: last?.code || ends.from,
      name: last?.name || STATION_CATALOG[ends.from]?.name || ends.from,
      departedAt: speed < 3 ? 'Stopped' : 'Departed',
      delayAtDeparture: spec.delayMinutes,
    },
    cars: cars,
  };
}

export interface FleetBundle {
  trains: TrainState[];
  meta: Map<string, SimMeta>;
}

export function generateFleet(): FleetBundle {
  const network = buildNetwork();
  const trains: TrainState[] = [];
  const meta = new Map<string, SimMeta>();
  const used = new Set<string>();

  const push = (
    spec: { trainNo: string; trainName: string; type: TrainType; delayMinutes: number },
    route: BuiltRoute,
    m: SimMeta
  ) => {
    if (used.has(spec.trainNo)) return;
    used.add(spec.trainNo);
    meta.set(spec.trainNo, m);
    trains.push(materializeTrain(spec, route, m));
  };

  for (const n of NAMED) {
    if (n.trainNo.length !== 5) continue;
    const route = network.routeById.get(n.routeId);
    if (!route) continue;
    const cruise = TYPE_SPEED[n.type] || 70;
    const m: SimMeta = {
      routeId: n.routeId,
      progress: n.progress,
      direction: n.direction,
      cruiseSpeed: n.looped ? 0 : cruise + ((n.progress * 10) % 8) - 3,
      dwellUntil: n.looped ? Date.now() + 8 * 60 * 1000 : 0,
      looped: !!n.looped,
    };
    push(
      { trainNo: n.trainNo, trainName: n.trainName, type: n.type, delayMinutes: n.delay || 0 },
      route,
      m
    );
  }

  let serial = 15001;
  let freightNo = 50101;
  let passNo = 40101;
  let i = 0;

  for (const route of network.routes) {
    const length = route.index.lengthKm;
    const count = Math.max(4, Math.round(length / 90));
    for (let k = 0; k < count; k++) {
      const type = pickType(i++);
      let trainNo: string;
      if (type === 'FREIGHT') {
        trainNo = String(freightNo++);
      } else if (type === 'PASSENGER') {
        trainNo = String(passNo++);
      } else {
        while (used.has(String(serial))) serial++;
        trainNo = String(serial++);
      }
      const progress = (k + 0.37) / count;
      const direction: 1 | -1 = k % 2 === 0 ? 1 : -1;
      const looped = k === 2 && length > 400 && Math.random() < 0.35;
      const delay =
        type === 'FREIGHT'
          ? 20 + (k * 13) % 90
          : type === 'PASSENGER'
          ? (k * 7) % 25
          : (k * 11) % 55;
      const cruise = (TYPE_SPEED[type] || 70) + ((k * 3) % 9) - 4;
      const m: SimMeta = {
        routeId: route.def.id,
        progress: Math.min(0.97, Math.max(0.02, progress)),
        direction,
        cruiseSpeed: looped ? 0 : Math.max(28, cruise),
        dwellUntil: looped ? Date.now() + 5 * 60 * 1000 : k % 9 === 0 ? Date.now() + 45000 : 0,
        looped,
      };
      push(
        {
          trainNo,
          trainName: fillerName(type, i, route.def.name),
          type,
          delayMinutes: delay,
        },
        route,
        m
      );
    }
  }

  return { trains, meta };
}

export { TYPE_SPEED };
