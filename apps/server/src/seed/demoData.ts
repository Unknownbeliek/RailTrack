import fs from 'fs';
import path from 'path';
import { TrainState, Station } from '../../../../packages/core/types/train';
import { config } from '../config';

export function getInitialDemoTrains(): TrainState[] {
  return [
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
        { timestamp: Date.now(), speed: 0 },
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
          confidence: 'HIGH',
        },
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
          relativeSpeed: 112,
        },
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
          message:
            'Howrah Rajdhani Express (12301) is 14km behind, approaching 112 km/h faster. You are looped at Tundla Jn for ~7 min.',
        },
      ],
      dataSource: 'GPS',
      confidence: 'HIGH',
      reporterCount: 14,
      lastUpdated: new Date().toISOString(),
      routeId: '12393_NDLS_RJPB',
      fromStation: 'NDLS',
      toStation: 'RJPB',
      nextStation: {
        code: 'FZD',
        name: 'Firozabad',
        distanceKm: 16.6,
        etaMinutes: 18,
        scheduledTime: '19:45',
      },
      lastStation: {
        code: 'TDL',
        name: 'Tundla Jn',
        departedAt: '19:10 (Stopped)',
        delayAtDeparture: 42,
      },
    },
    {
      trainNo: '12301',
      trainName: 'Howrah Rajdhani Express',
      type: 'RAJDHANI',
      priority: 1,
      lat: 27.28,
      lng: 78.14,
      snappedLat: 27.28,
      snappedLng: 78.14,
      kmMarker: 193.0,
      heading: 105,
      speed: 112,
      maxSpeedToday: 130,
      avgSpeedLastHour: 108,
      speedHistory: [
        { timestamp: Date.now() - 3600000, speed: 115 },
        { timestamp: Date.now() - 1800000, speed: 120 },
        { timestamp: Date.now(), speed: 112 },
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
          confidence: 'HIGH',
        },
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
          relativeSpeed: -112,
        },
      ],
      overtakePredictions: [],
      dataSource: 'GPS',
      confidence: 'HIGH',
      reporterCount: 52,
      lastUpdated: new Date().toISOString(),
      routeId: '12393_NDLS_RJPB',
      fromStation: 'NDLS',
      toStation: 'HWH',
      nextStation: {
        code: 'CNB',
        name: 'Kanpur Central',
        distanceKm: 246.6,
        etaMinutes: 132,
        scheduledTime: '21:30',
      },
      lastStation: {
        code: 'ALJN',
        name: 'Aligarh Jn',
        departedAt: '18:35',
        delayAtDeparture: 5,
      },
    },
  ];
}

export function loadStationsData(): Station[] {
  try {
    const stationsFile = path.join(config.dataDir, 'stations.json');
    if (fs.existsSync(stationsFile)) {
      const raw = fs.readFileSync(stationsFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load stations data from disk:', err);
  }
  return [];
}
