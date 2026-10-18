export interface RouteDef {
  id: string;
  name: string;
  usage: 'main' | 'branch';
  maxspeed: number;
  zone: string;
  stations: string[];
}

export const ROUTE_CATALOG: RouteDef[] = [
  {
    id: 'NDLS_HWH',
    name: 'New Delhi – Howrah (Grand Chord)',
    usage: 'main',
    maxspeed: 130,
    zone: 'NCR',
    stations: [
      'NDLS', 'GZB', 'KRJ', 'ALJN', 'HRS', 'TDL', 'FZD', 'SKB', 'ETW', 'PHD',
      'CNB', 'FTP', 'PRYJ', 'MZP', 'DDU', 'BXR', 'ARA', 'PNBE', 'MKA', 'JAJ',
      'JSME', 'MDP', 'CRJ', 'ASN', 'DGR', 'BWN', 'HWH',
    ],
  },
  {
    id: 'NDLS_BCT',
    name: 'New Delhi – Mumbai Central',
    usage: 'main',
    maxspeed: 130,
    zone: 'WR',
    stations: [
      'NDLS', 'NZM', 'FDB', 'PWL', 'MTJ', 'BTE', 'SWM', 'KOTA', 'RMA', 'NAD',
      'RTM', 'BRC', 'ST', 'VAPI', 'BVI', 'BCT',
    ],
  },
  {
    id: 'NDLS_MAS',
    name: 'New Delhi – Chennai (Grand Trunk)',
    usage: 'main',
    maxspeed: 130,
    zone: 'NCR',
    stations: [
      'NDLS', 'NZM', 'AGC', 'GWL', 'JHS', 'BINA', 'BPL', 'ET', 'AMLA', 'NGP',
      'CD', 'BPQ', 'KZJ', 'WL', 'BZA', 'OGL', 'NLR', 'GDR', 'MAS',
    ],
  },
  {
    id: 'NDLS_SBC',
    name: 'New Delhi – KSR Bengaluru',
    usage: 'main',
    maxspeed: 110,
    zone: 'SWR',
    stations: [
      'NDLS', 'AGC', 'GWL', 'JHS', 'BPL', 'ET', 'NGP', 'BPQ', 'KZJ', 'SC',
      'GTL', 'WADI', 'KJM', 'SBC',
    ],
  },
  {
    id: 'HWH_MAS',
    name: 'Howrah – Chennai (East Coast)',
    usage: 'main',
    maxspeed: 130,
    zone: 'ECoR',
    stations: [
      'HWH', 'KGP', 'BLS', 'BHC', 'CTC', 'BBS', 'KUR', 'BAM', 'VZM', 'VSKP',
      'BZA', 'OGL', 'NLR', 'GDR', 'MAS',
    ],
  },
  {
    id: 'CSMT_HWH',
    name: 'Mumbai CSMT – Howrah via Nagpur',
    usage: 'main',
    maxspeed: 110,
    zone: 'CR',
    stations: [
      'CSMT', 'DR', 'TNA', 'KYN', 'MMR', 'BSL', 'AK', 'BD', 'WR', 'NGP',
      'G', 'DURG', 'R', 'BSP', 'JSG', 'ROU', 'CKP', 'TATA', 'KGP', 'HWH',
    ],
  },
  {
    id: 'CSMT_MAS',
    name: 'Mumbai CSMT – Chennai via Pune',
    usage: 'main',
    maxspeed: 110,
    zone: 'CR',
    stations: [
      'CSMT', 'DR', 'KYN', 'LNL', 'PUNE', 'DD', 'SUR', 'KLBG', 'WADI', 'GTL',
      'RU', 'AJJ', 'MAS',
    ],
  },
  {
    id: 'NDLS_JAT',
    name: 'New Delhi – Jammu Tawi – Katra',
    usage: 'main',
    maxspeed: 110,
    zone: 'NR',
    stations: ['NDLS', 'UMB', 'LDH', 'JUC', 'PTK', 'JAT', 'UHP', 'SVDK'],
  },
  {
    id: 'NDLS_ADI',
    name: 'New Delhi – Ahmedabad via Jaipur',
    usage: 'main',
    maxspeed: 130,
    zone: 'NWR',
    stations: ['NDLS', 'DEC', 'GGN', 'RE', 'AWR', 'BKI', 'JP', 'AII', 'ABR', 'PNU', 'MSH', 'ADI'],
  },
  {
    id: 'KONKAN',
    name: 'Konkan Railway (Panvel – Mangaluru)',
    usage: 'main',
    maxspeed: 110,
    zone: 'KR',
    stations: ['PNVL', 'ROHA', 'CHI', 'RN', 'KKW', 'THVM', 'MAO', 'KAWR', 'UD', 'MAQ'],
  },
  {
    id: 'HWH_GHY',
    name: 'Howrah – Guwahati – Dibrugarh',
    usage: 'main',
    maxspeed: 110,
    zone: 'NFR',
    stations: [
      'HWH', 'BWN', 'MLDT', 'KIR', 'NJP', 'NCB', 'NBQ', 'GHY', 'LMG', 'DMV', 'MXN', 'DBRT',
    ],
  },
  {
    id: 'NDLS_GKP',
    name: 'New Delhi – Lucknow – Gorakhpur',
    usage: 'main',
    maxspeed: 110,
    zone: 'NR',
    stations: ['NDLS', 'GZB', 'MB', 'BE', 'LKO', 'GD', 'BST', 'GKP'],
  },
  {
    id: 'PNBE_GHY',
    name: 'Patna – Katihar – Guwahati',
    usage: 'branch',
    maxspeed: 100,
    zone: 'ECR',
    stations: ['PNBE', 'BJU', 'SPJ', 'KIR', 'NJP', 'NCB', 'NBQ', 'GHY'],
  },
  {
    id: 'MAS_SBC',
    name: 'Chennai – Bengaluru – Mysuru',
    usage: 'main',
    maxspeed: 110,
    zone: 'SR',
    stations: ['MAS', 'AJJ', 'KPD', 'JTJ', 'KJM', 'SBC', 'MYS'],
  },
  {
    id: 'MAS_TVC',
    name: 'Chennai – Coimbatore – Kochi – Thiruvananthapuram',
    usage: 'main',
    maxspeed: 110,
    zone: 'SR',
    stations: ['MAS', 'AJJ', 'KPD', 'SA', 'ED', 'TUP', 'CBE', 'TCR', 'ERS', 'QLN', 'TVC'],
  },
  {
    id: 'SC_MAS',
    name: 'Secunderabad – Vijayawada – Chennai',
    usage: 'main',
    maxspeed: 110,
    zone: 'SCR',
    stations: ['SC', 'KZJ', 'WL', 'BZA', 'OGL', 'NLR', 'GDR', 'MAS'],
  },
  {
    id: 'NDLS_ASR',
    name: 'New Delhi – Ludhiana – Amritsar',
    usage: 'main',
    maxspeed: 110,
    zone: 'NR',
    stations: ['NDLS', 'UMB', 'LDH', 'JUC', 'ASR'],
  },
  {
    id: 'NDLS_DDN',
    name: 'New Delhi – Haridwar – Dehradun',
    usage: 'branch',
    maxspeed: 110,
    zone: 'NR',
    stations: ['NDLS', 'GZB', 'MB', 'HW', 'DDN'],
  },
  {
    id: 'BPL_INDB',
    name: 'Bhopal – Ujjain – Indore',
    usage: 'branch',
    maxspeed: 110,
    zone: 'WR',
    stations: ['BPL', 'UJN', 'INDB'],
  },
  {
    id: 'CNB_LKO',
    name: 'Kanpur – Lucknow',
    usage: 'branch',
    maxspeed: 110,
    zone: 'NR',
    stations: ['CNB', 'LKO'],
  },
  {
    id: 'PRYJ_BSB',
    name: 'Prayagraj – Varanasi – Gaya',
    usage: 'branch',
    maxspeed: 110,
    zone: 'NR',
    stations: ['PRYJ', 'BSB', 'GAYA'],
  },
  {
    id: 'BBS_PURI',
    name: 'Bhubaneswar – Puri',
    usage: 'branch',
    maxspeed: 100,
    zone: 'ECoR',
    stations: ['BBS', 'KUR', 'PURI'],
  },
  {
    id: 'ADI_BCT',
    name: 'Ahmedabad – Mumbai Central',
    usage: 'main',
    maxspeed: 130,
    zone: 'WR',
    stations: ['ADI', 'BRC', 'ST', 'VAPI', 'BVI', 'BCT'],
  },
  {
    id: 'JP_ADI',
    name: 'Jaipur – Ajmer – Ahmedabad',
    usage: 'main',
    maxspeed: 110,
    zone: 'NWR',
    stations: ['JP', 'AII', 'ABR', 'PNU', 'ADI'],
  },
  {
    id: 'SBC_UBL',
    name: 'Bengaluru – Hubballi',
    usage: 'branch',
    maxspeed: 100,
    zone: 'SWR',
    stations: ['SBC', 'YPR', 'DWR', 'UBL'],
  },
  {
    id: 'MDU_CAPE',
    name: 'Madurai – Tirunelveli – Kanniyakumari',
    usage: 'branch',
    maxspeed: 100,
    zone: 'SR',
    stations: ['MDU', 'TEN', 'CAPE'],
  },
  {
    id: 'NDLS_LKO_BSB',
    name: 'New Delhi – Lucknow – Varanasi',
    usage: 'main',
    maxspeed: 130,
    zone: 'NR',
    stations: ['NDLS', 'GZB', 'MB', 'BE', 'LKO', 'GD', 'BSB'],
  },
];

/** Extra waypoints so a few corridors follow the real bend instead of a straight cut. */
export const EXTRA_WAYPOINTS: Record<string, Array<{ after: string; lat: number; lng: number }>> = {
  HWH_GHY: [
    { after: 'BWN', lat: 25.0, lng: 87.85 },
    { after: 'BWN', lat: 25.01, lng: 88.14 },
  ],
  KONKAN: [
    { after: 'ROHA', lat: 17.9, lng: 73.22 },
    { after: 'MAO', lat: 15.0, lng: 74.02 },
  ],
};
