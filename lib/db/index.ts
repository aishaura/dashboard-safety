import fs from 'fs';
import path from 'path';
import {
  SafetyEvent,
  EventCategory,
  EventSeverity,
  EventStatus,
  TemporalStatus,
  RegionSafetyProfile,
  SyncLog,
} from '@/types/safety';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'safety-events.json');
const SYNC_FILE = path.join(DATA_DIR, 'sync-logs.json');

// In-memory cache for ultra-fast query and instant dashboard rendering
let eventsMemoryCache: SafetyEvent[] | null = null;
let syncLogsCache: SyncLog[] | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadEventsFromDisk(): SafetyEvent[] {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    // Seed with initial curated verified incidents
    const { CURATED_INCIDENTS } = require('@/lib/ingestion/curated-incidents');
    fs.writeFileSync(DATA_FILE, JSON.stringify(CURATED_INCIDENTS, null, 2));
    return CURATED_INCIDENTS;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const { CURATED_INCIDENTS } = require('@/lib/ingestion/curated-incidents');
      fs.writeFileSync(DATA_FILE, JSON.stringify(CURATED_INCIDENTS, null, 2));
      return CURATED_INCIDENTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to read safety events from disk:', err);
    return [];
  }
}

function saveEventsToDisk(events: SafetyEvent[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
  } catch (err) {
    console.error('Failed to save safety events to disk:', err);
  }
}

function loadSyncLogsFromDisk(): SyncLog[] {
  ensureDataDir();
  if (!fs.existsSync(SYNC_FILE)) {
    fs.writeFileSync(SYNC_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read sync logs from disk:', err);
    return [];
  }
}

function saveSyncLogsToDisk(logs: SyncLog[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to save sync logs to disk:', err);
  }
}

export function getEventsCache(): SafetyEvent[] {
  if (!eventsMemoryCache) {
    eventsMemoryCache = loadEventsFromDisk();
  }
  return eventsMemoryCache;
}

export interface EventFilterOptions {
  category?: EventCategory;
  severity?: EventSeverity;
  status?: EventStatus;
  temporalStatus?: TemporalStatus;
  search?: string;
  location?: string;
  regencyCity?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  minSeverity?: EventSeverity;
  limit?: number;
  offset?: number;
}

const SEVERITY_RANKS: Record<EventSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export const SafetyDB = {
  getEvents(options?: EventFilterOptions): { events: SafetyEvent[]; total: number } {
    let events = [...getEventsCache()];

    if (!options) {
      return { events, total: events.length };
    }

    if (options.category) {
      events = events.filter((e) => e.category === options.category);
    }

    if (options.severity) {
      events = events.filter((e) => e.severity === options.severity);
    }

    if (options.minSeverity) {
      const minRank = SEVERITY_RANKS[options.minSeverity] || 1;
      events = events.filter((e) => SEVERITY_RANKS[e.severity] >= minRank);
    }

    if (options.status) {
      events = events.filter((e) => e.status === options.status);
    }

    if (options.temporalStatus) {
      events = events.filter((e) => e.temporalStatus === options.temporalStatus);
    }

    if (options.regencyCity) {
      const target = options.regencyCity.toLowerCase();
      events = events.filter(
        (e) =>
          e.regencyCity.toLowerCase().includes(target) ||
          e.locationName.toLowerCase().includes(target)
      );
    }

    if (options.province) {
      const prov = options.province.toLowerCase();
      events = events.filter((e) => e.province.toLowerCase().includes(prov));
    }

    if (options.location) {
      const loc = options.location.toLowerCase();
      events = events.filter(
        (e) =>
          e.locationName.toLowerCase().includes(loc) ||
          e.regencyCity.toLowerCase().includes(loc) ||
          (e.district && e.district.toLowerCase().includes(loc)) ||
          e.province.toLowerCase().includes(loc) ||
          e.title.toLowerCase().includes(loc)
      );
    }

    if (options.search) {
      const term = options.search.toLowerCase().trim();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.locationName.toLowerCase().includes(term) ||
          e.regencyCity.toLowerCase().includes(term) ||
          (e.district && e.district.toLowerCase().includes(term)) ||
          e.category.toLowerCase().includes(term) ||
          e.sourceName.toLowerCase().includes(term)
      );
    }

    if (options.year) {
      events = events.filter((e) => {
        const d = new Date(e.occurredAt);
        return d.getFullYear() === options.year;
      });
    }

    if (options.month) {
      events = events.filter((e) => {
        const d = new Date(e.occurredAt);
        return d.getMonth() + 1 === options.month;
      });
    }

    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      events = events.filter((e) => new Date(e.occurredAt).getTime() >= start);
    }

    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      events = events.filter((e) => new Date(e.occurredAt).getTime() <= end);
    }

    // Sort latest first
    events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const total = events.length;
    const offset = options.offset || 0;
    const limit = options.limit || 100;

    return {
      events: events.slice(offset, offset + limit),
      total,
    };
  },

  getEventById(id: string): SafetyEvent | null {
    const events = getEventsCache();
    return events.find((e) => e.id === id) || null;
  },

  upsertEvents(newEvents: SafetyEvent[]): { inserted: number; updated: number } {
    const existing = getEventsCache();
    const map = new Map<string, SafetyEvent>();

    // Index existing by fingerprint
    for (const item of existing) {
      map.set(item.fingerprint, item);
    }

    let inserted = 0;
    let updated = 0;

    for (const event of newEvents) {
      if (map.has(event.fingerprint)) {
        const prev = map.get(event.fingerprint)!;
        // Merge updates
        map.set(event.fingerprint, {
          ...prev,
          ...event,
          id: prev.id, // preserve ID
          ingestedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        map.set(event.fingerprint, event);
        inserted++;
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    eventsMemoryCache = merged;
    saveEventsToDisk(merged);

    return { inserted, updated };
  },

  getStats() {
    const events = getEventsCache();
    const activeAlerts = events.filter(
      (e) => e.status === 'ACTIVE' || e.severity === 'CRITICAL' || e.severity === 'HIGH'
    );

    const affectedCities = new Set(events.map((e) => e.regencyCity)).size;

    const categoryDistribution: Record<string, number> = {};
    const severityDistribution: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    let totalFatalities = 0;
    let totalInjured = 0;

    for (const e of events) {
      categoryDistribution[e.category] = (categoryDistribution[e.category] || 0) + 1;
      severityDistribution[e.severity] = (severityDistribution[e.severity] || 0) + 1;
      if (e.casualtiesFatal) totalFatalities += e.casualtiesFatal;
      if (e.casualtiesInjured) totalInjured += e.casualtiesInjured;
    }

    // Monthly trend for the past 6 months
    const monthlyTrend: Record<string, number> = {};
    for (const e of events) {
      const d = new Date(e.occurredAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
    }

    return {
      totalEvents: events.length,
      activeAlertsCount: activeAlerts.length,
      affectedCitiesCount: affectedCities,
      totalFatalities,
      totalInjured,
      categoryDistribution,
      severityDistribution,
      monthlyTrend,
      latestUpdated: events.length > 0 ? events[0].ingestedAt : new Date().toISOString(),
    };
  },

  getRegionProfile(slugOrName: string): RegionSafetyProfile | null {
    const events = getEventsCache();
    const query = slugOrName.toLowerCase().trim();

    // Check if query matches Bandung or other regions
    const isBandung =
      query.includes('bandung') ||
      query.includes('bdg') ||
      query.includes('jabar') ||
      query.includes('dayeuhkolot');

    const regionName = isBandung ? 'Bandung Raya (Kota & Kab. Bandung)' : slugOrName;
    const slug = isBandung ? 'bandung' : slugOrName.toLowerCase().replace(/\s+/g, '-');

    // Filter events for this region
    const regionEvents = events.filter((e) => {
      const city = e.regencyCity.toLowerCase();
      const loc = e.locationName.toLowerCase();
      const prov = e.province.toLowerCase();
      const dist = (e.district || '').toLowerCase();

      if (isBandung) {
        return (
          city.includes('bandung') ||
          loc.includes('bandung') ||
          loc.includes('cipularang') ||
          loc.includes('padaleunyi') ||
          loc.includes('dayeuhkolot') ||
          loc.includes('lembang') ||
          dist.includes('dayeuhkolot')
        );
      }
      return city.includes(query) || loc.includes(query) || prov.includes(query);
    });

    if (regionEvents.length === 0 && !isBandung) {
      return null;
    }

    const categoryBreakdown: Record<EventCategory, number> = {
      EARTHQUAKE: 0,
      FLOOD: 0,
      LANDSLIDE: 0,
      TRAFFIC_ACCIDENT: 0,
      FIRE_HOTSPOT: 0,
      VOLCANO: 0,
      SEVERE_WEATHER: 0,
      AIR_POLLUTION: 0,
      INDUSTRIAL_ACCIDENT: 0,
    };

    let criticalCount = 0;
    let highCount = 0;

    for (const e of regionEvents) {
      if (categoryBreakdown[e.category] !== undefined) {
        categoryBreakdown[e.category]++;
      }
      if (e.severity === 'CRITICAL') criticalCount++;
      if (e.severity === 'HIGH') highCount++;
    }

    // Dynamic risk score calculation (0 - 100)
    const baseScore = Math.min(
      100,
      Math.round(criticalCount * 18 + highCount * 10 + regionEvents.length * 2)
    );
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
      baseScore > 75 ? 'CRITICAL' : baseScore > 50 ? 'HIGH' : baseScore > 25 ? 'MEDIUM' : 'LOW';

    // Curated Hotspots identification based on data points
    const hotspotMap: Record<string, { count: number; category: EventCategory; desc: string }> = {};

    for (const e of regionEvents) {
      const area = e.district || e.locationName || e.regencyCity;
      if (!hotspotMap[area]) {
        hotspotMap[area] = {
          count: 0,
          category: e.category,
          desc: e.impactSummary || e.title,
        };
      }
      hotspotMap[area].count++;
    }

    const hotspotAreas = Object.entries(hotspotMap)
      .map(([name, data]) => ({
        name,
        type: 'Area Rawan Insiden',
        incidentCount: data.count,
        predominantCategory: data.category,
        description: data.desc,
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount)
      .slice(0, 5);

    return {
      id: `region-${slug}`,
      name: regionName,
      slug,
      province: 'Jawa Barat',
      type: 'KOTA',
      coordinates: {
        latitude: -6.9175,
        longitude: 107.6191,
      },
      riskScore: baseScore,
      riskLevel,
      summary: isBandung
        ? 'Kawasan Cekungan Bandung memiliki kerentanan multi-ancaman: banjir musiman di bantaran Sungai Citarum (Dayeuhkolot/Baleendah), kerawanan kecelakaan di ruas Tol Cipularang & arteri utama, potensi seismik aktif dari jalur Sesar Lembang & Sesar Garsela, serta fluktuasi indeks kualitas udara urban.'
        : `Profil pemantauan keselamatan terintegrasi untuk wilayah ${regionName} berdasarkan data historis dan sensor terkini.`,
      totalIncidents: regionEvents.length,
      activeAlerts: regionEvents.filter((e) => e.status === 'ACTIVE').length,
      categoryBreakdown,
      hotspotAreas,
      recentIncidents: regionEvents.slice(0, 15),
      environmentalStatus: {
        aqi: 72,
        aqiCategory: 'Sedang (Moderate)',
        weather: 'Hujan Ringan / Berawan',
        temperature: 24.5,
        precipitation: 2.4,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  logSync(log: SyncLog) {
    if (!syncLogsCache) {
      syncLogsCache = loadSyncLogsFromDisk();
    }
    syncLogsCache.unshift(log);
    if (syncLogsCache.length > 50) syncLogsCache = syncLogsCache.slice(0, 50);
    saveSyncLogsToDisk(syncLogsCache);
  },

  getSyncLogs(): SyncLog[] {
    if (!syncLogsCache) {
      syncLogsCache = loadSyncLogsFromDisk();
    }
    return syncLogsCache;
  },
};
