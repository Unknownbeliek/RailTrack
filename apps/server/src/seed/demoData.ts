import { TrainState, Station } from '../../../../packages/core/types/train';
import { generateFleet } from './fleet';
import { buildNetwork } from './network';

export function getInitialDemoTrains(): TrainState[] {
  return generateFleet().trains;
}

export function loadStationsData(): Station[] {
  return buildNetwork().stations;
}
