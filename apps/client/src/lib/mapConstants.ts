export const ZONE_COLORS: Record<string, string> = {
  NR: '#C8E6C9',
  NCR: '#BBDEFB',
  CR: '#FFE0B2',
  WR: '#F8BBD0',
  SCR: '#E1BEE7',
  SR: '#B2DFDB',
  ER: '#FFF9C4',
  ECR: '#DCEDC8',
  NER: '#B3E5FC',
  NFR: '#C5CAE9',
  SECR: '#FFCCBC',
  SWR: '#D7CCC8',
  WCR: '#F0F4C3',
  ECoR: '#B2EBF2',
  NWR: '#FFECB3',
  SER: '#FFAB91',
  KR: '#80CBC4',
};

export const TRACK_COLORS = {
  main: '#22C55E',
  mainGlow: '#22C55E',
  branch: '#4DA8FF',
  siding: '#FB923C',
  yard: '#9CA3AF',
  narrowGauge: '#A78BFA',
};

export const SPEED_BADGE_STYLE = {
  background: '#E0F2FE',
  color: '#0369A1',
  border: '#7DD3FC',
};

export const LAYER_ORDER = [
  'background',
  'zones-fill',
  'zones-outline',
  'zones-label',
  'tracks-main-glow',
  'tracks-branch',
  'tracks-main',
  'tracks-siding',
  'tracks-yard',
  'speed-labels',
  'stations-dot',
  'stations-label',
  'live-trains',
] as const;

export const ZONE_NAMES: Record<string, string> = {
  NR: 'Northern Railway',
  NWR: 'North Western Railway',
  NCR: 'North Central Railway',
  NER: 'North Eastern Railway',
  ECR: 'East Central Railway',
  ER: 'Eastern Railway',
  ECoR: 'East Coast Railway',
  SER: 'South Eastern Railway',
  SECR: 'South East Central Railway',
  SR: 'Southern Railway',
  SWR: 'South Western Railway',
  SCR: 'South Central Railway',
  WCR: 'West Central Railway',
  WR: 'Western Railway',
  CR: 'Central Railway',
  NFR: 'Northeast Frontier Railway',
  KR: 'Konkan Railway',
};
