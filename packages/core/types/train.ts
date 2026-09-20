export interface TrainState {
  trainNo: string;
  trainName: string;
  type: 'RAJDHANI' | 'SHATABDI' | 'SF' | 'MAIL' | 'PASSENGER' | 'FREIGHT';
  priority: number;
  
  // Position & Map Snapping
  lat: number;
  lng: number;
  snappedLat: number;
  snappedLng: number;
  kmMarker: number;
  heading: number;
  
  // Motion
  speed: number;              // km/h
  maxSpeedToday: number;
  avgSpeedLastHour: number;
  speedHistory: { timestamp: number; speed: number }[];
  
  // Status
  status: 'RUNNING' | 'STOPPED' | 'LOOPED' | 'ARRIVING' | 'DEPARTED';
  isOnLoopLine: boolean;
  lateralOffset: number;      // meters from mainline
  slowDuration: number;       // seconds spent under low speed threshold
  
  // Context
  delayMinutes: number;
  contextReasons: DelayReason[];
  nearbyTrains: NearbyTrain[];
  overtakePredictions: OvertakePrediction[];
  
  // Meta
  dataSource: 'GPS' | 'NTES' | 'INTERPOLATED';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reporterCount: number;
  lastUpdated: string;        // ISO timestamp
  
  // Route
  routeId: string;
  fromStation: string;
  toStation: string;
  nextStation: StationETA;
  lastStation: StationDeparture;
}

export interface StationETA {
  code: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  scheduledTime: string;
}

export interface StationDeparture {
  code: string;
  name: string;
  departedAt: string;
  delayAtDeparture: number;
}

export interface DelayReason {
  priority: number;
  type: 'LOOPED' | 'SIGNAL_CHECK' | 'CONGESTION' | 'SPEED_RESTRICTION' | 
        'PRECEDING_TRAIN' | 'CAUTION_ORDER' | 'UNKNOWN';
  title: string;
  subtitle: string;
  detail?: string;
  estimatedHoldMinutes?: number;
  relatedTrain?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  icon: string;
}

export interface NearbyTrain {
  trainNo: string;
  trainName: string;
  type: string;
  direction: 'SAME' | 'OPPOSITE';
  position: 'AHEAD' | 'BEHIND';
  distanceKm: number;
  speed: number;
  relativeSpeed: number;      // positive = approaching
}

export interface OvertakePrediction {
  type: 'INCOMING_OVERTAKE' | 'WILL_OVERTAKE' | 'JUST_OVERTOOK';
  trainNo: string;
  trainName: string;
  distanceBehind?: number;
  speedDiff?: number;
  etaMinutes?: number;
  likelyLoopStation?: string;
  overtakeSide?: 'LEFT' | 'RIGHT';
  message: string;
}

export interface GPSReport {
  trainNo: string;
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  speed?: number;             // Device-reported speed in km/h
  heading?: number;
  timestamp: number;          // Unix ms
  reporterId: string;         // Anonymous device UUID
  batteryLevel?: number;
  isWindowSeat?: boolean;     // User self-reported, for weighting
}

export interface Station {
  code: string;
  name: string;
  lat: number;
  lng: number;
  kmMarker: number;
  hasLoopLine: boolean;
  loopLineCount: number;
  platforms: number;
  zone: string;
  division: string;
}

export interface RouteTrack {
  id: string;
  name: string;
  stations: Station[];
  geoJson: any; // GeoJSON LineString
}
