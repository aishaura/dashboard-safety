import { EventCategory, EventSeverity, ParsedSearchQuery } from '@/types/safety';

const CATEGORY_KEYWORDS: Record<string, EventCategory> = {
  // Traffic accidents
  kecelakaan: 'TRAFFIC_ACCIDENT',
  tabrakan: 'TRAFFIC_ACCIDENT',
  lantas: 'TRAFFIC_ACCIDENT',
  laka: 'TRAFFIC_ACCIDENT',
  mobil: 'TRAFFIC_ACCIDENT',
  truk: 'TRAFFIC_ACCIDENT',
  motor: 'TRAFFIC_ACCIDENT',
  kereta: 'TRAFFIC_ACCIDENT',

  // Floods
  banjir: 'FLOOD',
  genangan: 'FLOOD',
  cileuncang: 'FLOOD',
  tma: 'FLOOD',
  citarum: 'FLOOD',

  // Landslides
  longsor: 'LANDSLIDE',
  tanah: 'LANDSLIDE',
  ambles: 'LANDSLIDE',

  // Earthquakes
  gempa: 'EARTHQUAKE',
  lindu: 'EARTHQUAKE',
  seismik: 'EARTHQUAKE',
  sesar: 'EARTHQUAKE',
  bmkg: 'EARTHQUAKE',

  // Fires / Hotspots
  hotspot: 'FIRE_HOTSPOT',
  kebakaran: 'FIRE_HOTSPOT',
  karhutla: 'FIRE_HOTSPOT',
  api: 'FIRE_HOTSPOT',
  firms: 'FIRE_HOTSPOT',

  // Volcano
  gunung: 'VOLCANO',
  erupsi: 'VOLCANO',
  vulkanik: 'VOLCANO',
  magma: 'VOLCANO',
  lahar: 'VOLCANO',
  vona: 'VOLCANO',

  // Severe weather
  cuaca: 'SEVERE_WEATHER',
  badai: 'SEVERE_WEATHER',
  hujan: 'SEVERE_WEATHER',
  angin: 'SEVERE_WEATHER',
  topan: 'SEVERE_WEATHER',

  // Air Pollution
  polusi: 'AIR_POLLUTION',
  ispu: 'AIR_POLLUTION',
  aqi: 'AIR_POLLUTION',
  udara: 'AIR_POLLUTION',
  asap: 'AIR_POLLUTION',

  // Industrial
  industri: 'INDUSTRIAL_ACCIDENT',
  kilang: 'INDUSTRIAL_ACCIDENT',
  pabrik: 'INDUSTRIAL_ACCIDENT',
  ledakan: 'INDUSTRIAL_ACCIDENT',
};

const MONTH_NAMES: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agu: 8,
  agst: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
};

const KNOWN_LOCATIONS = [
  'bandung',
  'dayeuhkolot',
  'baleendah',
  'lembang',
  'cipularang',
  'padaleunyi',
  'gedebage',
  'pasteur',
  'jakarta',
  'bogor',
  'depok',
  'tangerang',
  'bekasi',
  'sukabumi',
  'cianjur',
  'garut',
  'tasikmalaya',
  'cirebon',
  'surabaya',
  'semarang',
  'yogyakarta',
  'malang',
  'medan',
  'padang',
  'palembang',
  'riau',
  'bali',
  'lombok',
  'makassar',
  'manado',
  'papua',
  'jawa barat',
  'jawa tengah',
  'jawa timur',
];

export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const query = rawQuery.toLowerCase().trim();
  const tokens = query.split(/\s+/);

  let category: EventCategory | undefined;
  let location: string | undefined;
  let year: number | undefined;
  let month: number | undefined;
  let severity: EventSeverity | undefined;

  // 1. Check for year (e.g. 2021 - 2027)
  const yearMatch = query.match(/\b(202[0-9])\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // 2. Check for month names
  for (const [mName, mNum] of Object.entries(MONTH_NAMES)) {
    const regex = new RegExp(`\\b${mName}\\b`, 'i');
    if (regex.test(query)) {
      month = mNum;
      break;
    }
  }

  // 3. Check for Category keyword
  for (const token of tokens) {
    if (CATEGORY_KEYWORDS[token]) {
      category = CATEGORY_KEYWORDS[token];
      break;
    }
  }

  // Also check two-word categories like "titik api" or "kualitas udara"
  if (query.includes('titik api')) category = 'FIRE_HOTSPOT';
  if (query.includes('kualitas udara') || query.includes('polusi udara'))
    category = 'AIR_POLLUTION';
  if (query.includes('gunung api')) category = 'VOLCANO';
  if (query.includes('cuaca ekstrem')) category = 'SEVERE_WEATHER';
  if (query.includes('kecelakaan tol')) category = 'TRAFFIC_ACCIDENT';

  // 4. Check for Severity keyword
  if (query.includes('kritis') || query.includes('critical') || query.includes('m6') || query.includes('m7')) {
    severity = 'CRITICAL';
  } else if (query.includes('tinggi') || query.includes('high') || query.includes('m5')) {
    severity = 'HIGH';
  }

  // 5. Check for Location
  for (const loc of KNOWN_LOCATIONS) {
    if (query.includes(loc)) {
      location = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  // If no known location detected but query contains unrecognized word besides category/date
  if (!location) {
    const remaining = tokens.filter(
      (t) =>
        !CATEGORY_KEYWORDS[t] &&
        !MONTH_NAMES[t] &&
        !t.match(/^\d{4}$/) &&
        !['di', 'pada', 'bulan', 'tahun', 'wilayah', 'kota', 'kabupaten'].includes(t)
    );
    if (remaining.length > 0 && !category) {
      location = remaining.join(' ');
    }
  }

  const isLocationProfileSearch = Boolean(location && !category && !year);
  const isSpecificEventSearch = Boolean(category && !location);

  return {
    rawQuery,
    location,
    category,
    severity,
    year,
    month,
    isSpecificEventSearch,
    isLocationProfileSearch,
  };
}
