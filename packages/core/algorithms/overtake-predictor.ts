import { OvertakePrediction, Station } from '../types/train';

export interface TrainForOvertake {
  trainNo: string;
  name: string;
  priority: number; // 1=Rajdhani, 2=Shatabdi, 3=SF, 4=Mail/Express, 5=Passenger
  kmMarker: number;
  speed: number;
  direction: 'SAME' | 'OPPOSITE';
  routeId: string;
}

export function predictOvertake(
  myTrain: TrainForOvertake,
  allTrainsOnSection: TrainForOvertake[],
  stations: Station[]
): OvertakePrediction[] {
  const predictions: OvertakePrediction[] = [];

  for (const otherTrain of allTrainsOnSection) {
    if (otherTrain.trainNo === myTrain.trainNo) continue;
    if (otherTrain.direction !== myTrain.direction) continue;

    // Distance behind us (positive means otherTrain is behind myTrain)
    const distanceBehind = myTrain.kmMarker - otherTrain.kmMarker;

    if (distanceBehind > 0 && distanceBehind < 60) {
      // Speed difference: how much faster the trailing train is traveling
      const speedDiff = otherTrain.speed - myTrain.speed;

      if (speedDiff > 8 || (otherTrain.priority < myTrain.priority && speedDiff > -5)) {
        // Time to catch up in minutes
        const timeToReachMin = Math.max(1, Math.round((distanceBehind / Math.max(10, speedDiff > 0 ? speedDiff : 30)) * 60));

        // Priority check (e.g. 1 (Rajdhani) vs 3 (SF))
        const takesPriority = otherTrain.priority < myTrain.priority;

        if (takesPriority && timeToReachMin < 45) {
          // Next loop station ahead of myTrain
          const loopStation = stations.find(
            (st) => st.kmMarker >= myTrain.kmMarker && st.hasLoopLine
          ) || stations.find((st) => st.kmMarker >= myTrain.kmMarker);

          predictions.push({
            type: 'INCOMING_OVERTAKE',
            trainNo: otherTrain.trainNo,
            trainName: otherTrain.name,
            distanceBehind: Math.round(distanceBehind * 10) / 10,
            speedDiff: Math.round(speedDiff),
            etaMinutes: timeToReachMin,
            likelyLoopStation: loopStation?.name || 'Tundla Jn',
            overtakeSide: 'LEFT',
            message: `${otherTrain.name} (${otherTrain.trainNo}) is ${Math.round(distanceBehind)}km behind at ${Math.round(otherTrain.speed)} km/h. Expected to overtake in ~${timeToReachMin} min near ${loopStation?.name || 'next station'}.`
          });
        }
      }
    }

    // Check if myTrain just overtook someone
    if (distanceBehind < 0 && distanceBehind > -10) {
      if (myTrain.speed > otherTrain.speed + 15) {
        predictions.push({
          type: 'JUST_OVERTOOK',
          trainNo: otherTrain.trainNo,
          trainName: otherTrain.name,
          message: `Your train just overtook ${otherTrain.name} (${otherTrain.trainNo})`
        });
      }
    }
  }

  return predictions.sort((a, b) => (a.etaMinutes || 999) - (b.etaMinutes || 999));
}
