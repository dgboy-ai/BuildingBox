// SIMULATED DATA — Operation: Lost Signal
// All values are synthetic for hackathon demo. NOT real GPS.
// Timestamps relative to "now" = 11:30 AM incident time.

export const INCIDENT_TIME = '11:30 AM';
export const SECTORS = ['All', 'B-North', 'C-East', 'A-South', 'D-West'];

export const MOCK_TREKKERS = [
  {
    id: 'TRK-01',
    name: 'Aarav Sharma',
    age: 28,
    sector: 'B-North',
    sectorLabel: 'Sector B-North (Ridge Trail)',
    lastPing: '07:15 AM',
    minutesAgo: 255,
    elevation: 2450,
    signalBars: 1,
    signalLabel: 'Weak (1 bar)',
    battery: 14,
    injury: 'Minor ankle injury',
    injurySeverity: 'moderate', // none | minor | moderate | severe
    gear: ['Thermal tent', 'Emergency whistle', 'Offline GPS'],
    companions: 'With TRK-02',
    groupId: 'G1',
    confidence: 48,
    confidenceLabel: 'Low — single weak ping, 4h+ stale',
    status: 'contradictory',
    statusNote: 'Cell handshake says B-North, ranger log hints B-Ridge junction. Contradiction unresolved.',
    lastMessage: 'Minor ankle injury; companion with him.'
  },
  {
    id: 'TRK-02',
    name: 'Maya Patel',
    age: 25,
    sector: 'B-North',
    sectorLabel: 'Sector B-North (Ridge Trail)',
    lastPing: '07:18 AM',
    minutesAgo: 252,
    elevation: 2430,
    signalBars: 2,
    signalLabel: 'Weak (2 bars)',
    battery: 38,
    injury: 'No reported injury',
    injurySeverity: 'none',
    gear: ['First-aid kit', 'Power bank', 'Rain shell'],
    companions: 'With TRK-01',
    groupId: 'G1',
    confidence: 62,
    confidenceLabel: 'Medium — paired ping corroborates TRK-01',
    status: 'stale',
    statusNote: 'Last ping 4h ago. Paired with TRK-01, slightly stronger battery.',
    lastMessage: 'Staying put with Aarav, conserving battery.'
  },
  {
    id: 'TRK-03',
    name: 'Rohan Varma',
    age: 31,
    sector: 'C-East',
    sectorLabel: 'Sector C-East (Gorge Creek)',
    lastPing: '06:40 AM',
    minutesAgo: 290,
    elevation: 1890,
    signalBars: 0,
    signalLabel: 'No signal (0 bars)',
    battery: 8,
    injury: 'Possible hypothermia risk',
    injurySeverity: 'severe',
    gear: ['Light jacket only', 'No tent'],
    companions: 'Solo — separated',
    groupId: 'G2-solo',
    confidence: 31,
    confidenceLabel: 'Very low — 5h stale, gorge blocks signal',
    status: 'critical',
    statusNote: 'Gorge Creek is flash-mudslide zone. Zero bars since 06:40. Lowest battery.',
    lastMessage: 'Creek rising fast, phone dying.'
  },
  {
    id: 'TRK-04',
    name: 'Ananya Sen',
    age: 23,
    sector: 'A-South',
    sectorLabel: 'Sector A-South (Pine Basin)',
    lastPing: '08:05 AM',
    minutesAgo: 205,
    elevation: 2100,
    signalBars: 3,
    signalLabel: 'Fair (3 bars)',
    battery: 56,
    injury: 'No reported injury',
    injurySeverity: 'none',
    gear: ['Tent', 'Dry food 2 days', 'Headlamp'],
    companions: 'Moving toward TRK-06',
    groupId: 'G3',
    confidence: 74,
    confidenceLabel: 'High — recent ping, open basin',
    status: 'reliable',
    statusNote: 'Most recent reliable fix. Sheltered basin, lower terrain risk.',
    lastMessage: 'In basin, visible to air if clouds lift.'
  },
  {
    id: 'TRK-05',
    name: 'Vikram Malhotra',
    age: 42,
    sector: 'D-West',
    sectorLabel: 'Sector D-West (Old Mine Pass)',
    lastPing: '05:55 AM',
    minutesAgo: 335,
    elevation: 2780,
    signalBars: 1,
    signalLabel: 'Weak (1 bar)',
    battery: 22,
    injury: 'Chest pain reported',
    injurySeverity: 'severe',
    gear: ['Heart medication (limited)', 'Basic raincoat'],
    companions: 'Solo — high altitude',
    groupId: 'G4-solo',
    confidence: 39,
    confidenceLabel: 'Low — 5.5h stale, highest altitude',
    status: 'contradictory',
    statusNote: 'Highest + coldest. Chest pain + solo + oldest ping = high medical risk despite moderate battery.',
    lastMessage: 'Chest discomfort, resting at mine shelter.'
  },
  {
    id: 'TRK-06',
    name: 'Dr. Priyamvada Iyer',
    age: 35,
    sector: 'A-South',
    sectorLabel: 'Sector A-South (Pine Basin)',
    lastPing: '08:12 AM',
    minutesAgo: 198,
    elevation: 2120,
    signalBars: 3,
    signalLabel: 'Fair (3 bars)',
    battery: 67,
    injury: 'Doctor — assisting others',
    injurySeverity: 'none',
    gear: ['Medical kit', 'Satellite messenger (1-way)', 'Tent'],
    companions: 'Near TRK-04, can assist',
    groupId: 'G3',
    confidence: 81,
    confidenceLabel: 'Highest — freshest ping + medical asset',
    status: 'reliable',
    statusNote: 'Medical asset in field. Could stabilize others if directed.',
    lastMessage: 'With Ananya, ready to assist.'
  }
];

export const MOCK_TEAMS = [
  { id: 'Alpha', size: 4, medic: true, base: 'Base Camp', status: 'ready', speed: 'fast' },
  { id: 'Bravo', size: 3, medic: false, base: 'Ridge Post', status: 'ready', speed: 'medium' },
  { id: 'Charlie', size: 2, medic: true, base: 'Basin Post', status: 'low-fuel', speed: 'slow' }
];

export const WEATHER_PRESETS = {
  cloudy: { label: 'Cloudy', severity: 1, travelPenalty: 1.0, desc: 'Aerial search limited' },
  rain: { label: 'Rain', severity: 2, travelPenalty: 1.4, desc: 'Mudslide risk in gorge' },
  storm: { label: 'Storm', severity: 3, travelPenalty: 1.9, desc: 'Aerial grounded, ravines dangerous' }
};
