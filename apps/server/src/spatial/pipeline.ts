import fs from 'fs';
import path from 'path';
import { GPSReport, TrainState, Station } from '../../../../packages/core/types/train';
import { snapToTrack } from '../../../../packages/core/algorithms/rail-snapper';
import { TrainKalmanFilter } from '../../../../packages/core/algorithms/kalman-filter';
import { detectLoopLine } from '../../../../packages/core/algorithms/loop-detector';
import { predictOvertake, TrainForOvertake } from '../../../../packages/core/algorithms/overtake-predictor';
import { generateDelayReason } from '../../../../packages/core/algorithms/context-engine';
import { config } from '../config';

export class SpatialPipeline {
  private kalmanFilterMap = new Map<string, TrainKalmanFilter>();
  private routeGeoJSON: any = null;

  constructor() {
    this.loadRoute();
  }

  private loadRoute() {
    try {
      const routeFile = path.join(config.routesDir, '12393_NDLS_RJPB.json');
      if (fs.existsSync(routeFile)) {
        this.routeGeoJSON = JSON.parse(fs.readFileSync(routeFile, 'utf-8'));
      }
    } catch (err) {
      console.warn('Could not load primary route GeoJSON in SpatialPipeline:', err);
    }
  }

  public processReport(
    report: GPSReport,
    existingTrain: TrainState | null,
    allTrains: TrainState[],
    stations: Station[]
  ): TrainState {
    let kalman = this.kalmanFilterMap.get(report.trainNo);
    if (!kalman) {
      kalman = new TrainKalmanFilter();
      this.kalmanFilterMap.set(report.trainNo, kalman);
    }

    // 1. Smooth GPS jitter with Kalman Filter
    const filtered = kalman.update({
      lat: report.lat,
      lng: report.lng,
      accuracy: report.accuracy,
      timestamp: report.timestamp,
    });

    // 2. Rail Snapper
    const snapped = this.routeGeoJSON
      ? snapToTrack({ lat: filtered.lat, lng: filtered.lng, accuracy: report.accuracy }, this.routeGeoJSON)
      : {
          snappedLat: filtered.lat,
          snappedLng: filtered.lng,
          lateralOffset: 0,
          distanceAlongRoute: 0,
          kmMarker: 200,
          confidence: 'HIGH' as const,
        };

    const nowSec = Date.now();
    const speed = report.speed !== undefined ? report.speed : filtered.speed;
    const slowDuration = speed < 5 ? (existingTrain?.slowDuration || 0) + 3 : 0;

    // 3. Loop line detection
    const loopResult = detectLoopLine(
      {
        speed,
        slowDuration,
        routeId: existingTrain?.routeId || '12393_NDLS_RJPB',
        heading: report.heading || 0,
      },
      snapped,
      stations
    );

    // 4. Overtake prediction
    const activeTrains: TrainForOvertake[] = allTrains.map((t) => ({
      trainNo: t.trainNo,
      name: t.trainName,
      priority: t.priority,
      kmMarker: t.kmMarker,
      speed: t.speed,
      direction: 'SAME',
      routeId: t.routeId,
    }));

    const myTrainForOvertake: TrainForOvertake = {
      trainNo: report.trainNo,
      name: existingTrain?.trainName || `Train ${report.trainNo}`,
      priority: existingTrain?.priority || 3,
      kmMarker: snapped.kmMarker,
      speed,
      direction: 'SAME',
      routeId: existingTrain?.routeId || '12393_NDLS_RJPB',
    };

    const overtakePredictions = predictOvertake(myTrainForOvertake, activeTrains, stations);

    // 5. Context engine delay reason generator
    const delayReasons = generateDelayReason(
      { speed, slowDuration, expectedSpeed: existingTrain?.maxSpeedToday || 110 },
      loopResult,
      overtakePredictions
    );

    const updatedState: TrainState = {
      ...(existingTrain || {
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
        nextStation: {
          code: 'CNB',
          name: 'Kanpur Central',
          distanceKm: 200,
          etaMinutes: 120,
          scheduledTime: '20:00',
        },
        lastStation: {
          code: 'TDL',
          name: 'Tundla Jn',
          departedAt: '19:00',
          delayAtDeparture: 0,
        },
        nearbyTrains: [],
        overtakePredictions: [],
        contextReasons: [],
      }),
      lat: report.lat,
      lng: report.lng,
      snappedLat: snapped.snappedLat,
      snappedLng: snapped.snappedLng,
      kmMarker: snapped.kmMarker,
      heading: report.heading || existingTrain?.heading || 90,
      speed,
      speedHistory: [
        ...((existingTrain?.speedHistory || []).slice(-20)),
        { timestamp: nowSec, speed },
      ],
      status: loopResult.status === 'LOOPED' ? 'LOOPED' : speed < 3 ? 'STOPPED' : 'RUNNING',
      isOnLoopLine: loopResult.status === 'LOOPED',
      lateralOffset: snapped.lateralOffset,
      slowDuration,
      contextReasons: delayReasons,
      overtakePredictions,
      dataSource: 'GPS',
      confidence: snapped.confidence,
      reporterCount: (existingTrain?.reporterCount || 0) + 1,
      lastUpdated: new Date().toISOString(),
    };

    return updatedState;
  }
}

export const spatialPipeline = new SpatialPipeline();
