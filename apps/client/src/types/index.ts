export interface SpeedHistoryPoint {
  timestamp: number;
  speed: number;
}

export interface DelayReason {
  priority: number;
  type: 'LOOPED' | 'OVERTAKE_HOLD' | 'SPEED_RESTRICTION' | 'CONGESTION' | 'STATION_DWELL' | 'UNKNOWN';
  icon: string;
  title: string;
  subtitle: string;
  detail?: string;
  estimatedHoldMinutes?: number;
  relatedTrain?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NearbyTrain {
  trainNo: string;
  trainName: string;
  type: 'RAJDHANI' | 'SHATABDI' | 'SF' | 'MAIL' | 'PASSENGER' | 'FREIGHT';
  direction: 'SAME' | 'OPPOSITE';
  position: 'AHEAD' | 'BEHIND';
  distanceKm: number;
  speed: number;
  relativeSpeed: number;
}

export interface OvertakePrediction {
  type: 'INCOMING_OVERTAKE' | 'OVERTAKING_AHEAD' | 'CROSSING_AHEAD';
  trainNo: string;
  trainName: string;
  distanceBehind: number;
  speedDiff: number;
  etaMinutes: number;
  likelyLoopStation?: string;
  overtakeSide: 'LEFT' | 'RIGHT';
  message: string;
}

export interface StationDeparture {
  code: string;
  name: string;
  departedAt: string;
  delayAtDeparture: number;
}

export interface StationUpcoming {
  code: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  scheduledTime: string;
}

export interface TrainState {
  trainNo: string;
  trainName: string;
  type: 'RAJDHANI' | 'SHATABDI' | 'SF' | 'MAIL' | 'PASSENGER' | 'FREIGHT';
  priority: number;
  lat: number;
  lng: number;
  snappedLat: number;
  snappedLng: number;
  kmMarker: number;
  heading: number;
  speed: number;
  maxSpeedToday: number;
  avgSpeedLastHour: number;
  speedHistory: SpeedHistoryPoint[];
  status: 'RUNNING' | 'STOPPED' | 'LOOPED' | 'ARRIVING' | 'DEPARTED';
  isOnLoopLine: boolean;
  lateralOffset: number;
  slowDuration: number;
  delayMinutes: number;
  contextReasons: DelayReason[];
  nearbyTrains: NearbyTrain[];
  overtakePredictions: OvertakePrediction[];
  dataSource: 'GPS' | 'NTES' | 'INTERPOLATED';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reporterCount: number;
  lastUpdated: string;
  routeId: string;
  fromStation: string;
  toStation: string;
  nextStation: StationUpcoming;
  lastStation: StationDeparture;
}

export interface Station {
  code: string;
  name: string;
  lat: number;
  lng: number;
  kmMarker?: number;
  hasLoopLine?: boolean;
  loopLineCount?: number;
  platforms?: number;
  zone?: string;
  division?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'railfan' | 'admin';
  createdAt?: string;
}
