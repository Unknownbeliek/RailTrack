import { DelayReason, OvertakePrediction } from '../types/train';
import { LoopDetectionResult } from './loop-detector';

export function generateDelayReason(
  trainState: { speed: number; slowDuration: number; expectedSpeed?: number },
  loopResult: LoopDetectionResult,
  overtakePredictions: OvertakePrediction[],
  sectionCongestion: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): DelayReason[] {
  const reasons: DelayReason[] = [];

  // Priority 1: Looped for incoming overtake
  if (loopResult.status === 'LOOPED' && overtakePredictions.length > 0) {
    const incoming = overtakePredictions[0];
    const holdEst = (incoming.etaMinutes || 5) + 3;
    reasons.push({
      priority: 1,
      type: 'LOOPED',
      icon: '🔄',
      title: `Looped at ${loopResult.station || 'Station'}`,
      subtitle: `Yielding track to ${incoming.trainName} (${incoming.trainNo})`,
      detail: `${incoming.trainName} is approaching ${incoming.distanceBehind || 12}km behind. Estimated hold: ~${holdEst} min.`,
      estimatedHoldMinutes: holdEst,
      relatedTrain: incoming.trainName,
      confidence: 'HIGH'
    });
  }
  // Priority 2: Looped (waiting without detected overtake train yet)
  else if (loopResult.status === 'LOOPED') {
    const holdEst = Math.max(4, 12 - Math.round(trainState.slowDuration / 60));
    reasons.push({
      priority: 2,
      type: 'LOOPED',
      icon: '☕',
      title: `Waiting at ${loopResult.station || 'Station'} Siding`,
      subtitle: 'Yielding loop-line for higher priority express or freight clearance',
      detail: `Train held at loop siding for ~${Math.round(trainState.slowDuration / 60)} min. Accelerates upon signal clearance.`,
      estimatedHoldMinutes: holdEst,
      confidence: 'MEDIUM'
    });
  }
  // Priority 3: Signal check / Block section hold
  else if (trainState.speed < 4 && trainState.slowDuration > 90) {
    reasons.push({
      priority: 3,
      type: 'SIGNAL_CHECK',
      icon: '🚦',
      title: 'Signal Block Check',
      subtitle: 'Waiting for preceding train to clear block section ahead',
      detail: sectionCongestion === 'HIGH'
        ? 'Mainline congestion ahead — multiple trains operating in adjacent block sections'
        : 'Automatic signal clearance pending for next section',
      estimatedHoldMinutes: 3,
      confidence: 'MEDIUM'
    });
  }
  // Priority 4: Caution order / speed restriction
  else if (trainState.speed > 5 && trainState.speed < 35 && (trainState.expectedSpeed || 90) > 70) {
    reasons.push({
      priority: 4,
      type: 'SPEED_RESTRICTION',
      icon: '🐌',
      title: 'Caution Order / Speed Restriction',
      subtitle: 'Track maintenance or bridge speed restriction zone',
      detail: `Operating at restricted speed (${Math.round(trainState.speed)} km/h)`,
      confidence: 'LOW'
    });
  }
  // Priority 5: Running smoothly
  else {
    reasons.push({
      priority: 5,
      type: 'UNKNOWN',
      icon: '⚡',
      title: 'Clear Line Running',
      subtitle: 'Mainline tracks clear ahead',
      confidence: 'HIGH'
    });
  }

  return reasons.sort((a, b) => a.priority - b.priority);
}
