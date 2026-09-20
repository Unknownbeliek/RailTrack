/**
 * Rail network types - OSM / OpenRailwayMap compatible
 * Used for zones + lines + speeds layers
 */

export type RailwayZoneCode =
  | 'NR' | 'NWR' | 'NCR' | 'NER' | 'ECR' | 'ER' | 'ECoR' | 'SER' | 'SECR'
  | 'SR' | 'SWR' | 'SCR' | 'WCR' | 'WR' | 'CR' | 'NFR' | 'KR';

export interface IRZone {
  zone: RailwayZoneCode;
  name: string;
  color: string;
  division: string;
}

export type TrackUsage = 'main' | 'branch' | 'industrial' | 'military' | 'test';
export type TrackService = 'siding' | 'yard' | 'spur' | 'crossover' | undefined;
export type Gauge = '1676' | '1000' | '762' | '610';

export interface TrackProperties {
  id: string;
  name: string;
  railway: 'rail' | 'narrow_gauge' | 'light_rail' | 'siding' | 'yard';
  usage?: TrackUsage;
  service?: TrackService;
  gauge?: Gauge;
  electrified?: 'contact_line' | 'no' | 'yes';
  maxspeed?: string;
  'maxspeed:railway'?: string;
  zone?: RailwayZoneCode;
  section?: string;
  speed_source?: string;
  speed_confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  'railway:track_ref'?: string;
}

export interface SpeedPatch {
  from_station: string;
  to_station: string;
  section_name: string;
  line: string;
  max_speed_kmph: string;
  source: 'WTT' | 'OSM' | 'RAILFAN';
  updated: string;
  notes?: string;
}

export interface SpeedBadge {
  maxspeed: string;
  section: string;
  name: string;
  zone?: RailwayZoneCode;
  usage?: TrackUsage;
  coordinates: [number, number];
}
