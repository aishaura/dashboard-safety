export type EventCategory =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'LANDSLIDE'
  | 'TRAFFIC_ACCIDENT'
  | 'FIRE_HOTSPOT'
  | 'VOLCANO'
  | 'SEVERE_WEATHER'
  | 'AIR_POLLUTION'
  | 'INDUSTRIAL_ACCIDENT';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EventStatus = 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'HISTORICAL_RECORD';

export type TemporalStatus = 'REALTIME' | 'NEAR_REALTIME' | 'HISTORICAL' | 'VERIFIED_REPORT';

export interface SafetyEvent {
  id: string;
  fingerprint: string;
  title: string;
  description: string;
  category: EventCategory;
  subcategory?: string;
  severity: EventSeverity;
  status: EventStatus;
  temporalStatus: TemporalStatus;
  sourceName: string;
  sourceUrl?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  district?: string; // Kecamatan
  regencyCity: string; // Kabupaten / Kota
  province: string; // Provinsi
  occurredAt: string; // ISO string
  ingestedAt: string; // ISO string
  periodLabel: string; // e.g. "Sep 2026", "Q3 2026", "2024 Rekap"
  casualtiesFatal?: number;
  casualtiesInjured?: number;
  impactSummary?: string;
  metadata?: Record<string, any>; // magnitude, depth, shakemap, brightness, frp, aqi, weatherCode, etc.
}

export interface RegionSafetyProfile {
  id: string;
  name: string; // e.g. "Kota Bandung"
  slug: string; // e.g. "bandung", "kota-bandung"
  province: string;
  type: 'KOTA' | 'KABUPATEN' | 'PROVINSI';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  totalIncidents: number;
  activeAlerts: number;
  categoryBreakdown: Record<EventCategory, number>;
  hotspotAreas: {
    name: string;
    type: string;
    incidentCount: number;
    predominantCategory: EventCategory;
    description: string;
  }[];
  recentIncidents: SafetyEvent[];
  environmentalStatus: {
    aqi?: number;
    aqiCategory?: string;
    weather?: string;
    temperature?: number;
    precipitation?: number;
    updatedAt: string;
  };
}

export interface SyncLog {
  id: string;
  sourceName: string;
  startedAt: string;
  endedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  errorMessage?: string;
}

export interface ParsedSearchQuery {
  rawQuery: string;
  location?: string;
  category?: EventCategory;
  severity?: EventSeverity;
  year?: number;
  month?: number;
  temporalStatus?: TemporalStatus;
  isSpecificEventSearch: boolean;
  isLocationProfileSearch: boolean;
}

export interface SafetyInsight {
  id: string;
  title: string;
  narrative: string;
  category: EventCategory;
  severity: EventSeverity;
  sourceName: string;
  evidenceCount: number;
  filterPayload: {
    category?: EventCategory;
    location?: string;
    timeframe?: string;
  };
  generatedAt: string;
}
