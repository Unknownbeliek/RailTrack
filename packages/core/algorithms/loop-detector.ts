import { Station } from '../types/train';
import { SnappedResult } from './rail-snapper';

const LOOP_THRESHOLD_METERS = 18;  // minimum lateral offset from mainline
const SPEED_THRESHOLD_KMH = 5;     // train must be slow/stopped
const DWELL_THRESHOLD_SEC = 60;    // must be slow for > 60 seconds

export interface LoopDetectionResult {
  status: 'LOOPED' | 'SIGNAL_CHECK' | 'RUNNING';
  station?: string;
  stationCode?: string;
  loopSide?: 'LEFT' | 'RIGHT';
  dwellTime?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

export function detectLoopLine(
  trainState: { speed: number; slowDuration: number; routeId: string; heading: number },
  snappedResult: SnappedResult,
  stations: Station[]
): LoopDetectionResult {
  const { lateralOffset, kmMarker } = snappedResult;
  const { speed, slowDuration } = trainState;

  const isOffset = Math.abs(lateralOffset) > LOOP_THRESHOLD_METERS;
  const isSlow = speed < SPEED_THRESHOLD_KMH;
  const isDwelling = slowDuration > DWELL_THRESHOLD_SEC;

  // Find nearest station along route
  const nearestStation = stations.find((st) => Math.abs(st.kmMarker - kmMarker) < 2.5);

  if (isOffset && isSlow && isDwelling && nearestStation) {
    return {
      status: 'LOOPED',
      station: nearestStation.name,
      stationCode: nearestStation.code,
      loopSide: lateralOffset > 0 ? 'RIGHT' : 'LEFT',
      dwellTime: slowDuration,
      confidence: nearestStation.hasLoopLine ? 'HIGH' : 'MEDIUM',
      message: `Looped at ${nearestStation.name} siding`
    };
  }

  if (isSlow && isDwelling && !isOffset && nearestStation) {
    return {
      status: 'LOOPED',
      station: nearestStation.name,
      stationCode: nearestStation.code,
      dwellTime: slowDuration,
      confidence: 'MEDIUM',
      message: `Halted at ${nearestStation.name} platform/loop`
    };
  }

  if (isSlow && isDwelling && !nearestStation) {
    return {
      status: 'SIGNAL_CHECK',
      confidence: 'MEDIUM',
      message: 'Stopped between stations — likely signal hold or section block'
    };
  }

  return {
    status: 'RUNNING',
    confidence: 'HIGH'
  };
}
