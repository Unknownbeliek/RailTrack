import fastify from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';

import { GPSReport, TrainState, Station } from '../../packages/core/types/train';
import { snapToTrack } from '../../packages/core/algorithms/rail-snapper';
import { TrainKalmanFilter } from '../../packages/core/algorithms/kalman-filter';
import { detectLoopLine } from '../../packages/core/algorithms/loop-detector';
import { predictOvertake, TrainForOvertake } from '../../packages/core/algorithms/overtake-predictor';
import { generateDelayReason } from '../../packages/core/algorithms/context-engine';

const app = fastify({ logger: true });
const httpServer = createServer(app.server);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Load static station data & GeoJSON track routes
const STATIONS_PATH = path.join(process.cwd(), 'data', 'stations.json');
const ROUTE_PATH = path.join(process.cwd(), 'data', 'geojson', 'routes', '12393_NDLS_RJPB.json');

let stations: Station[] = [];
let routeGeoJSON: any = null;

try {
  if (fs.existsSync(STATIONS_PATH)) {
    stations = JSON.parse(fs.readFileSync(STATIONS_PATH, 'utf-8'));
  }
  if (fs.existsSync(ROUTE_PATH)) {
    routeGeoJSON = JSON.parse(fs.readFileSync(ROUTE_PATH, 'utf-8'));
  }
} catch (e) {
  console.error('Failed to load initial track/station data:', e);
}

// In-memory train states and Kalman filters
const trainStateMap = new Map<string, TrainState>();
const kalmanFilterMap = new Map<string, TrainKalmanFilter>();

// Seed initial demo trains (12393 Sampark Kranti, 12301 Rajdhani Express, 12417 Prayagraj Exp)
function initializeDemoTrains() {
  const demoTrains: TrainState[] = [
    {
      trainNo: '12393',
      trainName: 'Sampark Kranti Express',
      type: 'SF',
      priority: 3,
      lat: 27.2063,
      lng: 78.2411,
      snappedLat: 27.2063,
      snappedLng: 78.2411,
      kmMarker: 207.2,
      heading: 105,
      speed: 0,
      maxSpeedToday: 110,
      avgSpeedLastHour: 72,
      speedHistory: [
        { timestamp: Date.now() - 3600000, speed: 105 },
        { timestamp: Date.now() - 1800000, speed: 92 },
        { timestamp: Date.now() - 300000, speed: 12 },
        { timestamp: Date.now(), speed: 0 }
      ],
      status: 'LOOPED',
      isOnLoopLine: true,
      lateralOffset: 24.5,
      slowDuration: 180,
      delayMinutes: 42,
      contextReasons: [
        {
          priority: 1,
          type: 'LOOPED',
          icon: '🔄',
          title: 'Looped at Tundla Junction',
          subtitle: 'Yielding mainline track to 12301 Howrah Rajdhani Express',
          detail: '12301 Rajdhani Express is 14km behind at 112 km/h. Estimated hold: ~7 min.',
          estimatedHoldMinutes: 7,
          relatedTrain: 'Howrah Rajdhani Express',
          confidence: 'HIGH'
        }
      ],
      nearbyTrains: [
        {
          trainNo: '12301',
          trainName: 'Howrah Rajdhani Express',
          type: 'RAJDHANI',
          direction: 'SAME',
          position: 'BEHIND',
          distanceKm: 14.2,
          speed: 112,
          relativeSpeed: 112
        }
      ],
      overtakePredictions: [
        {
          type: 'INCOMING_OVERTAKE',
          trainNo: '12301',
          trainName: 'Howrah Rajdhani Express',
          distanceBehind: 14.2,
          speedDiff: 112,
          etaMinutes: 7,
          likelyLoopStation: 'Tundla Jn',
          overtakeSide: 'LEFT',
          message: 'Howrah Rajdhani Express (12301) is 14km behind, approaching 112 km/h faster. You are looped at Tundla Jn for ~7 min.'
        }
      ],
      dataSource: 'GPS',
      confidence: 'HIGH',
      reporterCount: 12,
      lastUpdated: new Date().toISOString(),
      routeId: '12393_NDLS_RJPB',
      fromStation: 'NDLS',
      toStation: 'RJPB',
      nextStation: {
        code: 'FZD',
        name: 'Firozabad',
        distanceKm: 16.6,
        etaMinutes: 18,
        scheduledTime: '19:45'
      },
      lastStation: {
        code: 'TDL',
        name: 'Tundla Jn',
        departedAt: '19:10 (Stopped)',
        delayAtDeparture: 42
      }
    },
    {
      trainNo: '12301',
      trainName: 'Howrah Rajdhani Express',
      type: 'RAJDHANI',
      priority: 1,
      lat: 27.2800,
      lng: 78.1400,
      snappedLat: 27.2800,
      snappedLng: 78.1400,
      kmMarker: 193.0,
      heading: 105,
      speed: 112,
      maxSpeedToday: 130,
      avgSpeedLastHour: 108,
      speedHistory: [
        { timestamp: Date.now() - 3600000, speed: 115 },
        { timestamp: Date.now() - 1800000, speed: 120 },
        { timestamp: Date.now(), speed: 112 }
      ],
      status: 'RUNNING',
      isOnLoopLine: false,
      lateralOffset: 0.5,
      slowDuration: 0,
      delayMinutes: 5,
      contextReasons: [
        {
          priority: 5,
          type: 'UNKNOWN',
          icon: '⚡',
          title: 'Priority Track Clearance',
          subtitle: 'Mainline green signal locked — Overtaking 12393 at Tundla Jn',
          confidence: 'HIGH'
        }
      ],
      nearbyTrains: [
        {
          trainNo: '12393',
          trainName: 'Sampark Kranti Express',
          type: 'SF',
          direction: 'SAME',
          position: 'AHEAD',
          distanceKm: 14.2,
          speed: 0,
          relativeSpeed: -112
        }
      ],
      overtakePredictions: [],
      dataSource: 'GPS',
      confidence: 'HIGH',
      reporterCount: 45,
      lastUpdated: new Date().toISOString(),
      routeId: '12393_NDLS_RJPB',
      fromStation: 'NDLS',
      toStation: 'HWH',
      nextStation: {
        code: 'CNB',
        name: 'Kanpur Central',
        distanceKm: 246.6,
        etaMinutes: 132,
        scheduledTime: '21:30'
      },
      lastStation: {
        code: 'ALJN',
        name: 'Aligarh Jn',
        departedAt: '18:35',
        delayAtDeparture: 5
      }
    }
  ];

  demoTrains.forEach((t) => {
    trainStateMap.set(t.trainNo, t);
    kalmanFilterMap.set(t.trainNo, new TrainKalmanFilter());
  });
}

initializeDemoTrains();

// Process incoming telemetry
export function processGPSReport(report: GPSReport): TrainState {
  let kalman = kalmanFilterMap.get(report.trainNo);
  if (!kalman) {
    kalman = new TrainKalmanFilter();
    kalmanFilterMap.set(report.trainNo, kalman);
  }

  // 1. Smooth GPS jitter with Kalman Filter
  const filtered = kalman.update({
    lat: report.lat,
    lng: report.lng,
    accuracy: report.accuracy,
    timestamp: report.timestamp
  });

  // 2. Rail Snapper
  const snapped = routeGeoJSON
    ? snapToTrack({ lat: filtered.lat, lng: filtered.lng, accuracy: report.accuracy }, routeGeoJSON)
    : {
        snappedLat: filtered.lat,
        snappedLng: filtered.lng,
        lateralOffset: 0,
        distanceAlongRoute: 0,
        kmMarker: 200,
        confidence: 'HIGH' as const
      };

  let existing = trainStateMap.get(report.trainNo);
  const nowSec = Date.now();
  const speed = report.speed !== undefined ? report.speed : filtered.speed;
  const slowDuration = speed < 5 ? ((existing?.slowDuration || 0) + 3) : 0;

  // 3. Loop line detection
  const loopResult = detectLoopLine(
    { speed, slowDuration, routeId: existing?.routeId || '12393_NDLS_RJPB', heading: report.heading || 0 },
    snapped,
    stations
  );

  // 4. Overtake prediction
  const activeTrains: TrainForOvertake[] = Array.from(trainStateMap.values()).map((t) => ({
    trainNo: t.trainNo,
    name: t.trainName,
    priority: t.priority,
    kmMarker: t.kmMarker,
    speed: t.speed,
    direction: 'SAME',
    routeId: t.routeId
  }));

  const myTrainForOvertake: TrainForOvertake = {
    trainNo: report.trainNo,
    name: existing?.trainName || `Train ${report.trainNo}`,
    priority: existing?.priority || 3,
    kmMarker: snapped.kmMarker,
    speed,
    direction: 'SAME',
    routeId: existing?.routeId || '12393_NDLS_RJPB'
  };

  const overtakePredictions = predictOvertake(myTrainForOvertake, activeTrains, stations);

  // 5. Context engine delay reason generator
  const delayReasons = generateDelayReason(
    { speed, slowDuration, expectedSpeed: existing?.maxSpeedToday || 110 },
    loopResult,
    overtakePredictions
  );

  const updatedState: TrainState = {
    ...(existing || {
      trainNo: report.trainNo,
      trainName: `Train ${report.trainNo}`,
      type: 'SF',
      priority: 3,
      maxSpeedToday: 110,
      avgSpeedLastHour: 75,
      delayMinutes: 0,
      routeId: '12393_NDLS_RJPB',
      fromStation: 'NDLS',
      toStation: 'RJPB',
      nextStation: { code: 'CNB', name: 'Kanpur Central', distanceKm: 200, etaMinutes: 120, scheduledTime: '20:00' },
      lastStation: { code: 'TDL', name: 'Tundla Jn', departedAt: '19:00', delayAtDeparture: 0 }
    }),
    lat: report.lat,
    lng: report.lng,
    snappedLat: snapped.snappedLat,
    snappedLng: snapped.snappedLng,
    kmMarker: snapped.kmMarker,
    heading: report.heading || existing?.heading || 90,
    speed,
    speedHistory: [
      ...((existing?.speedHistory || []).slice(-20)),
      { timestamp: nowSec, speed }
    ],
    status: loopResult.status === 'LOOPED' ? 'LOOPED' : speed < 3 ? 'STOPPED' : 'RUNNING',
    isOnLoopLine: loopResult.status === 'LOOPED',
    lateralOffset: snapped.lateralOffset,
    slowDuration,
    contextReasons: delayReasons,
    overtakePredictions,
    dataSource: 'GPS',
    confidence: snapped.confidence,
    reporterCount: (existing?.reporterCount || 0) + 1,
    lastUpdated: new Date().toISOString()
  };

  trainStateMap.set(report.trainNo, updatedState);
  return updatedState;
}

// Socket.io WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial list of all trains
  socket.emit('train:all', Array.from(trainStateMap.values()));

  socket.on('gps:report', (report: GPSReport) => {
    const newState = processGPSReport(report);
    io.emit('train:state', newState);
  });

  socket.on('train:subscribe', (trainNo: string) => {
    socket.join(`train:${trainNo}`);
    const state = trainStateMap.get(trainNo);
    if (state) socket.emit('train:state', state);
  });
});

// REST API Endpoints
app.get('/health', async () => ({ status: 'ok', trainsCount: trainStateMap.size }));
app.get('/trains', async () => Array.from(trainStateMap.values()));
app.get('/trains/:trainNo', async (req: any, reply) => {
  const train = trainStateMap.get(req.params.trainNo);
  if (!train) return reply.status(404).send({ error: 'Train not found' });
  return train;
});
app.get('/stations', async () => stations);

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`TrackPulse Gateway Service running on http://localhost:${PORT}`);
});
