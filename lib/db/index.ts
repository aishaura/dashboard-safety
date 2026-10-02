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
import { findLocationInfo } from '@/lib/indonesia-locations';

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
      const loc = options.location.toLowerCase().trim();
      const cleanLoc = loc.replace(/^(kota|kabupaten|kab\.?|provinsi|prov\.?)\s+/i, '').trim();
      events = events.filter((e) => {
        const locName = e.locationName.toLowerCase();
        const city = e.regencyCity.toLowerCase();
        const dist = (e.district || '').toLowerCase();
        const prov = e.province.toLowerCase();
        const title = e.title.toLowerCase();

        return (
          locName.includes(loc) ||
          city.includes(loc) ||
          dist.includes(loc) ||
          prov.includes(loc) ||
          title.includes(loc) ||
          (cleanLoc.length > 1 && (
            locName.includes(cleanLoc) ||
            city.includes(cleanLoc) ||
            dist.includes(cleanLoc) ||
            prov.includes(cleanLoc) ||
            title.includes(cleanLoc) ||
            cleanLoc.includes(city) ||
            cleanLoc.includes(prov)
          ))
        );
      });
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

    const isBandung =
      query.includes('bandung') || query.includes('bdg') || query.includes('dayeuhkolot');
    const isJakarta =
      query.includes('jakarta') || query.includes('jkt') || query.includes('dki');
    const isSurabaya =
      query.includes('surabaya') || query.includes('sby');
    const isBalikpapan =
      query.includes('balikpapan') || query.includes('bpp');
    const isBanten =
      query.includes('banten') ||
      query.includes('serang') ||
      query.includes('cilegon') ||
      query.includes('bayah') ||
      query.includes('pandeglang');
    const isSamarinda = query.includes('samarinda');
    const isMakassar = query.includes('makassar');
    const isMedan = query.includes('medan');
    const isSemarang = query.includes('semarang');
    const isYogyakarta = query.includes('yogyakarta') || query.includes('jogja');
    const isDenpasar = query.includes('denpasar') || query.includes('bali');
    const isAceh =
      query.includes('aceh') ||
      query.includes('banda aceh') ||
      query.includes('sabang') ||
      query.includes('lhokseumawe') ||
      query.includes('meulaboh');

    // Resolve location info from INDONESIA_LOCATIONS
    const locInfo = findLocationInfo(query) || findLocationInfo(slugOrName);

    let regionName = locInfo ? locInfo.name : slugOrName;
    let slug = slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let province = locInfo?.province || 'Indonesia';
    let latitude = locInfo?.coordinates ? locInfo.coordinates[0] : -2.5;
    let longitude = locInfo?.coordinates ? locInfo.coordinates[1] : 118.0;
    let regionType: 'KOTA' | 'KABUPATEN' | 'PROVINSI' = (locInfo?.type as any) || 'KOTA';

    if (isJakarta) {
      regionName = 'DKI Jakarta';
      slug = 'jakarta';
      province = 'DKI Jakarta';
      latitude = -6.2088;
      longitude = 106.8456;
      regionType = 'PROVINSI';
    } else if (isSurabaya) {
      regionName = 'Kota Surabaya';
      slug = 'surabaya';
      province = 'Jawa Timur';
      latitude = -7.2575;
      longitude = 112.7521;
      regionType = 'KOTA';
    } else if (isBandung) {
      regionName = 'Bandung Raya (Kota & Kab. Bandung)';
      slug = 'bandung';
      province = 'Jawa Barat';
      latitude = -6.9175;
      longitude = 107.6191;
      regionType = 'KOTA';
    } else if (isBalikpapan) {
      regionName = 'Kota Balikpapan';
      slug = 'balikpapan';
      province = 'Kalimantan Timur';
      latitude = -1.2379;
      longitude = 116.8529;
      regionType = 'KOTA';
    } else if (isBanten) {
      regionName = 'Provinsi Banten';
      slug = 'banten';
      province = 'Banten';
      latitude = -6.4058;
      longitude = 106.0640;
      regionType = 'PROVINSI';
    } else if (isSamarinda) {
      regionName = 'Kota Samarinda';
      slug = 'samarinda';
      province = 'Kalimantan Timur';
      latitude = -0.5021;
      longitude = 117.1537;
      regionType = 'KOTA';
    } else if (isMakassar) {
      regionName = 'Kota Makassar';
      slug = 'makassar';
      province = 'Sulawesi Selatan';
      latitude = -5.1477;
      longitude = 119.4327;
      regionType = 'KOTA';
    } else if (isMedan) {
      regionName = 'Kota Medan';
      slug = 'medan';
      province = 'Sumatera Utara';
      latitude = 3.5952;
      longitude = 98.6722;
      regionType = 'KOTA';
    } else if (isSemarang) {
      regionName = 'Kota Semarang';
      slug = 'semarang';
      province = 'Jawa Tengah';
      latitude = -6.9667;
      longitude = 110.4167;
      regionType = 'KOTA';
    } else if (isYogyakarta) {
      regionName = 'Kota Yogyakarta';
      slug = 'yogyakarta';
      province = 'D.I. Yogyakarta';
      latitude = -7.7956;
      longitude = 110.3695;
      regionType = 'KOTA';
    } else if (isDenpasar) {
      regionName = 'Kota Denpasar';
      slug = 'denpasar';
      province = 'Bali';
      latitude = -8.6705;
      longitude = 115.2126;
      regionType = 'KOTA';
    } else if (isAceh) {
      regionName = query.includes('banda aceh') ? 'Kota Banda Aceh' : 'Provinsi Aceh';
      slug = 'aceh';
      province = 'Aceh';
      latitude = query.includes('banda aceh') ? 5.5483 : 4.6951;
      longitude = query.includes('banda aceh') ? 95.3238 : 96.7494;
      regionType = query.includes('banda aceh') ? 'KOTA' : 'PROVINSI';
    }

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
      if (isJakarta) {
        return city.includes('jakarta') || loc.includes('jakarta') || prov.includes('jakarta');
      }
      if (isSurabaya) {
        return city.includes('surabaya') || loc.includes('surabaya') || loc.includes('sby');
      }
      if (isBalikpapan) {
        return city.includes('balikpapan') || loc.includes('balikpapan') || dist.includes('balikpapan') || loc.includes('rapak');
      }
      if (isBanten) {
        return (
          prov.includes('banten') ||
          city.includes('banten') ||
          city.includes('serang') ||
          city.includes('cilegon') ||
          city.includes('bayah') ||
          loc.includes('banten') ||
          loc.includes('merak')
        );
      }
      if (isSamarinda) {
        return city.includes('samarinda') || loc.includes('samarinda') || loc.includes('mahakam') || loc.includes('palaran');
      }
      if (isMakassar) {
        return city.includes('makassar') || loc.includes('makassar') || loc.includes('losari') || loc.includes('tallo');
      }
      if (isMedan) {
        return city.includes('medan') || loc.includes('medan') || loc.includes('deli') || loc.includes('belawan');
      }
      if (isSemarang) {
        return city.includes('semarang') || loc.includes('semarang') || loc.includes('kaligawe');
      }
      if (isYogyakarta) {
        return city.includes('yogyakarta') || loc.includes('yogyakarta') || loc.includes('jogja') || loc.includes('sleman') || loc.includes('bantul');
      }
      if (isDenpasar) {
        return city.includes('denpasar') || loc.includes('denpasar') || prov.includes('bali') || loc.includes('badung') || loc.includes('kuta');
      }
      if (isAceh) {
        return prov.includes('aceh') || city.includes('aceh') || loc.includes('aceh') || city.includes('banda aceh') || loc.includes('banda aceh') || loc.includes('krueng');
      }

      // Check proximity distance (~55 km)
      const distance = Math.hypot(e.latitude - latitude, e.longitude - longitude);
      if (distance < 0.55) return true;

      const nameClean = locInfo ? locInfo.name.toLowerCase().replace(/^(kota|kabupaten|provinsi)\s+/i, '') : query;
      return city.includes(query) || loc.includes(query) || prov.includes(query) || city.includes(nameClean) || loc.includes(nameClean);
    });

    // If query is not recognized and has 0 events and no locInfo, return null
    if (regionEvents.length === 0 && !locInfo && !isBandung && !isJakarta && !isSurabaya && !isBalikpapan && !isBanten) {
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
      95,
      Math.max(
        50,
        Math.round(
          criticalCount * 16 +
          highCount * 9 +
          regionEvents.length * 2.5 +
          (isJakarta ? 35 : isSurabaya ? 28 : isBandung ? 30 : isSamarinda ? 28 : isMakassar ? 27 : 24)
        )
      )
    );
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
      baseScore > 75 ? 'CRITICAL' : baseScore > 50 ? 'HIGH' : baseScore > 25 ? 'MEDIUM' : 'LOW';

    // Curated Hotspots identification based on data points
    let hotspotAreas: { name: string; type: string; incidentCount: number; predominantCategory: EventCategory; description: string }[] = [];

    if (isJakarta) {
      hotspotAreas = [
        {
          name: 'Muara Baru & Pluit',
          type: 'Area Rawan Banjir Rob',
          incidentCount: 14,
          predominantCategory: 'FLOOD',
          description: 'Pasang air laut dan penurunan tanah tanggul pesisir Teluk Jakarta.',
        },
        {
          name: 'Tol Cawang - Grogol',
          type: 'Zona Kepadatan & Laka',
          incidentCount: 19,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Ruas tol lingkar dalam kota dengan volume komuter padat dan insiden laka.',
        },
        {
          name: 'Arteri TB Simatupang & Kemang',
          type: 'Genangan Urban Cepat',
          incidentCount: 8,
          predominantCategory: 'FLOOD',
          description: 'Kawasan rawan genangan air saat hujan intensitas tinggi.',
        },
        {
          name: 'Marunda & Cakung',
          type: 'Pantauan Polusi Udara',
          incidentCount: 12,
          predominantCategory: 'AIR_POLLUTION',
          description: 'Zona industri pesisir dengan konsentrasi partikulat debu dan emisi.',
        },
      ];
    } else if (isSurabaya) {
      hotspotAreas = [
        {
          name: 'Bantaran Kali Lamong (Pakal/Benowo)',
          type: 'Area Rawan Banjir Luapan',
          incidentCount: 11,
          predominantCategory: 'FLOOD',
          description: 'Daerah aliran sungai Kali Lamong rawan banjir kiriman musiman.',
        },
        {
          name: 'Bundaran Waru - A. Yani',
          type: 'Koridor Utama Laka & Macet',
          incidentCount: 16,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Gerbang selatan mobilitas aglomerasi Surabaya-Sidoarjo berfrekuensi laka tinggi.',
        },
        {
          name: 'Pesisir Kenjeran & Selat Madura',
          type: 'Pantauan Cuaca Maritim',
          incidentCount: 7,
          predominantCategory: 'SEVERE_WEATHER',
          description: 'Dinamika angin pesisir dan pasang surut air laut.',
        },
        {
          name: 'Arteri Margomulyo - Tanjung Perak',
          type: 'Jalur Angkutan Berat',
          incidentCount: 9,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Lalu lintas kontainer dan truk muatan logistik pelabuhan.',
        },
      ];
    } else if (isBandung) {
      hotspotAreas = [
        {
          name: 'Dayeuhkolot & Baleendah (Bandung Selatan)',
          type: 'Area Rawan Banjir Luapan Citarum',
          incidentCount: 15,
          predominantCategory: 'FLOOD',
          description: 'Banjir kronis luapan Sungai Citarum merendam permukiman dan akses jalan raya.',
        },
        {
          name: 'Tol Cipularang KM 90 - 100',
          type: 'Zona Rawan Laka Turunan Tajam',
          incidentCount: 12,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Turunan curam rawan tabrakan beruntun dan rem blong angkutan bermuatan berat.',
        },
        {
          name: 'Zona Jalur Sesar Lembang & Garsela',
          type: 'Aktivitas Seismik BMKG',
          incidentCount: 8,
          predominantCategory: 'EARTHQUAKE',
          description: 'Patahan aktif daratan Cekungan Bandung dengan potensi gempa bumi dangkal.',
        },
        {
          name: 'Arteri Soekarno-Hatta & Gedebage',
          type: 'Titik Genangan Cileuncang & Kepadatan Lalin',
          incidentCount: 9,
          predominantCategory: 'FLOOD',
          description: 'Jalur komuter utama penghubung timur-barat Kota Bandung dengan kapasitas drainase terbatas.',
        },
      ];
    } else if (isBalikpapan) {
      hotspotAreas = [
        {
          name: 'Simpang Muara Rapak (Balikpapan Utara)',
          type: 'Zona Rawan Laka Berat & Turunan Tajam',
          incidentCount: 15,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Turunan curam Jl. Soekarno-Hatta dengan riwayat kegagalan rem truk tronton & kontainer.',
        },
        {
          name: 'Kompleks Kilang RU V Pertamina',
          type: 'Proteksi Risiko Industri Migas',
          incidentCount: 6,
          predominantCategory: 'INDUSTRIAL_ACCIDENT',
          description: 'Instalasi vital penyulingan minyak bumi nasional dengan standar keselamatan HSSE ketat.',
        },
        {
          name: 'Koridor MT Haryono & DAS Ampal',
          type: 'Area Rawan Banjir Genangan',
          incidentCount: 8,
          predominantCategory: 'FLOOD',
          description: 'Titik genangan kronis perkotaan saat curah hujan tinggi akibat sedimentasi drainase.',
        },
        {
          name: 'Koridor Samboja - Balikpapan Timur',
          type: 'Pantauan Karhutla Satelit FIRMS',
          incidentCount: 11,
          predominantCategory: 'FIRE_HOTSPOT',
          description: 'Zona penyangga IKN rawan anomali panas vegetasi semak belukar pada musim kemarau.',
        },
      ];
    } else if (isBanten) {
      hotspotAreas = [
        {
          name: 'Zona Megathrust & Sesar Bayah Selatan',
          type: 'Aktivitas Seismik BMKG',
          incidentCount: 18,
          predominantCategory: 'EARTHQUAKE',
          description: 'Aktivitas lempeng tektonik Samudra Hindia dengan gempa berkekuatan M 5.0 - 5.6.',
        },
        {
          name: 'DAS Sungai Cibanten & Kota Serang',
          type: 'Area Rawan Banjir Luapan',
          incidentCount: 12,
          predominantCategory: 'FLOOD',
          description: 'Kawasan permukiman Kasemen dan hilir sungai rentan luapan limpasan hulu.',
        },
        {
          name: 'Arteri Pelabuhan Penyeberangan Merak (Cilegon)',
          type: 'Simpul Kepadatan Logistik Selat Sunda',
          incidentCount: 14,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Antrean kendaraan ekspedisi dan truk angkutan barang lintas pulau Jawa-Sumatera.',
        },
        {
          name: 'Pesisir Pandeglang & TN Ujung Kulon',
          type: 'Pantauan Titik Panas & Konservasi',
          incidentCount: 7,
          predominantCategory: 'FIRE_HOTSPOT',
          description: 'Deteksi satelit FIRMS pada vegetasi kering pesisir selatan penyangga kawasan lindung.',
        },
      ];
    } else if (isSamarinda) {
      hotspotAreas = [
        {
          name: 'DAS Sungai Mahakam & Loa Janan',
          type: 'Area Rawan Banjir Luapan',
          incidentCount: 12,
          predominantCategory: 'FLOOD',
          description: 'Limpasan air pasang sungai Mahakam dan hujan intensitas tinggi merendam permukiman tepian sungai.',
        },
        {
          name: 'Jembatan Mahakam I & IV',
          type: 'Koridor Simpul Lalu Lintas Utama',
          incidentCount: 14,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Jalur penghubung Samarinda Seberang dan Kota dengan volume kendaraan tinggi dan risiko insiden.',
        },
        {
          name: 'Kecamatan Palaran & Sambutan',
          type: 'Pantauan Karhutla Satelit FIRMS',
          incidentCount: 8,
          predominantCategory: 'FIRE_HOTSPOT',
          description: 'Area perbukitan dan semak belukar kering terpantau anomali suhu termal sensor satelit NASA.',
        },
        {
          name: 'Koridor Antasari - Juanda',
          type: 'Titik Genangan Kronis Perkotaan',
          incidentCount: 6,
          predominantCategory: 'FLOOD',
          description: 'Cekungan jalan perkotaan dengan kapasitas drainase terbatas saat curah hujan lebat.',
        },
      ];
    } else if (isMakassar) {
      hotspotAreas = [
        {
          name: 'DAS Sungai Tallo & Manggala',
          type: 'Area Rawan Banjir Genangan',
          incidentCount: 13,
          predominantCategory: 'FLOOD',
          description: 'Dataran rendah di sekitar bantaran Sungai Tallo dan perumahan Kodam III rawan banjir.',
        },
        {
          name: 'Jalan Tol Reformasi & Ir Sutami',
          type: 'Jalur Bebas Hambatan Pelabuhan & Bandara',
          incidentCount: 15,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Akses logistik utama Pelabuhan Paotere - Bandara Sultan Hasanuddin dengan kecepatan tinggi.',
        },
        {
          name: 'Pesisir Pantai Losari & Makassar Barat',
          type: 'Pantauan Cuaca Maritim & Pasang Air Laut',
          incidentCount: 9,
          predominantCategory: 'SEVERE_WEATHER',
          description: 'Fluktuasi pasang gelombang Selat Makassar dan angin barat pesisir perkotaan.',
        },
        {
          name: 'Arteri Perintis Kemerdekaan - Baddoka',
          type: 'Simpul Kepadatan Logistik Komuter',
          incidentCount: 11,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Jalur arteri lintas Trans-Sulawesi dengan volume bus antarkota dan angkutan logistik padat.',
        },
      ];
    } else if (isMedan) {
      hotspotAreas = [
        {
          name: 'Bantaran Sungai Deli & Babura',
          type: 'Area Rawan Banjir Luapan',
          incidentCount: 16,
          predominantCategory: 'FLOOD',
          description: 'Banjir kiriman dari hulu Sibolangit dan Berastagi merendam kawasan Kampung Aur dan Medan Maimun.',
        },
        {
          name: 'Tol Belmera (Belawan-Medan-Tj. Morawa)',
          type: 'Koridor Arteri Logistik Pelabuhan',
          incidentCount: 18,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Arus truk peti kemas dan kontainer pelabuhan Belawan dengan riwayat insiden laka.',
        },
        {
          name: 'Kawasan Industri Belawan & Pesisir Labuhan',
          type: 'Pantauan Polusi & Keselamatan Pesisir',
          incidentCount: 10,
          predominantCategory: 'AIR_POLLUTION',
          description: 'Kawasan maritim dan pergudangan industri dengan dinamika pasang rob serta emisi.',
        },
        {
          name: 'Arteri Gatot Subroto - Pinang Baris',
          type: 'Simpul Mobilitas Barat',
          incidentCount: 8,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Koridor komuter penghubung Medan - Binjai dengan intensitas lalu lintas tinggi.',
        },
      ];
    } else if (isSemarang) {
      hotspotAreas = [
        {
          name: 'Kawasan Kaligawe & Genuk (Jalur Pantura)',
          type: 'Area Rawan Banjir Rob & Genangan',
          incidentCount: 17,
          predominantCategory: 'FLOOD',
          description: 'Kombinasi pasang air laut rob Laut Jawa dan curah hujan merendam jalur nasional Pantura.',
        },
        {
          name: 'Tol Semarang Seksi A-B-C (Krapyak - Banyumanik)',
          type: 'Jalur Kontur Menanjak Rawan Rem Blong',
          incidentCount: 14,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Tanjakan dan turunan terjal Gombel & Jatingaleh dengan risiko kecelakaan angkutan berat.',
        },
        {
          name: 'Pelabuhan Tanjung Emas & Pesisir Tambaklorok',
          type: 'Pantauan Pasang Surut & Cuaca Maritim',
          incidentCount: 11,
          predominantCategory: 'SEVERE_WEATHER',
          description: 'Tanggul pesisir utara dan kawasan dermaga peti kemas terhadap gelombang pasang.',
        },
        {
          name: 'DAS Sungai Banjir Kanal Barat & Timur',
          type: 'Sistem Pengendali Limpasan Hulu',
          incidentCount: 7,
          predominantCategory: 'FLOOD',
          description: 'Debit air kiriman dari wilayah Ungaran dan Kabupaten Semarang saat hujan lebat.',
        },
      ];
    } else if (isYogyakarta) {
      hotspotAreas = [
        {
          name: 'Lereng Gunung Merapi (Sleman)',
          type: 'Aktivitas Vulkanik & Guguran Lava',
          incidentCount: 15,
          predominantCategory: 'VOLCANO',
          description: 'Zona bahaya KRB III Merapi dengan pemantauan kubah lava, awan panas, dan lahar hujan di hulu sungai.',
        },
        {
          name: 'Sesar Aktif Opak (Bantul - Prambanan)',
          type: 'Aktivitas Seismik BMKG',
          incidentCount: 12,
          predominantCategory: 'EARTHQUAKE',
          description: 'Patahan kerak bumi aktif dengan riwayat gempa tektonik merusak di wilayah selatan DIY.',
        },
        {
          name: 'Jalur Ring Road Utara & Simpang Jombor',
          type: 'Koridor Kepadatan Komuter & Laka',
          incidentCount: 10,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Persimpangan strategis antarkota Yogyakarta-Semarang-Solo dengan mobilitas padat.',
        },
        {
          name: 'DAS Kali Code & Winongo',
          type: 'Limpasan Banjir Lahar Hujan Urban',
          incidentCount: 8,
          predominantCategory: 'FLOOD',
          description: 'Sungai yang membelah pusat kota Yogyakarta rawan luapan material lahar saat hujan di puncak Merapi.',
        },
      ];
    } else if (isDenpasar) {
      hotspotAreas = [
        {
          name: 'Busur Subduksi Lempeng Selatan Bali',
          type: 'Aktivitas Seismik BMKG',
          incidentCount: 16,
          predominantCategory: 'EARTHQUAKE',
          description: 'Zona megathrust selatan Bali dengan gempa tektonik berkala di Samudra Hindia.',
        },
        {
          name: 'Arteri Sunset Road & Bypass Ngurah Rai',
          type: 'Simpul Mobilitas Pariwisata & Laka',
          incidentCount: 13,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Koridor komuter penghubung Kuta, Denpasar, Sanur, dan Nusa Dua berintensitas tinggi.',
        },
        {
          name: 'DAS Tukad Badung & Pemogan',
          type: 'Area Rawan Genangan Urban',
          incidentCount: 9,
          predominantCategory: 'FLOOD',
          description: 'Limpasan air permukaan dan drainase perkotaan Denpasar saat hujan berdurasi panjang.',
        },
        {
          name: 'Pesisir Sanur & Tanjung Benoa',
          type: 'Pantauan Cuaca Maritim & Gelombang Pasang',
          incidentCount: 7,
          predominantCategory: 'SEVERE_WEATHER',
          description: 'Kawasan aktivitas wisata bahari dan dermaga penyeberangan Nusa Penida.',
        },
      ];
    } else if (isAceh) {
      hotspotAreas = [
        {
          name: 'DAS Krueng Aceh & Peunayong',
          type: 'Area Rawan Banjir Luapan',
          incidentCount: 12,
          predominantCategory: 'FLOOD',
          description: 'Limpasan air hulu Jantho berpotensi merendam kawasan pemukiman dataran rendah Banda Aceh.',
        },
        {
          name: 'Sesar Seulimeum & Aceh Besar',
          type: 'Aktivitas Seismik Sesar Darat BMKG',
          incidentCount: 9,
          predominantCategory: 'EARTHQUAKE',
          description: 'Segmen aktif Great Sumatran Fault dengan gempa tektonik dangkal berulang.',
        },
        {
          name: 'Arteri Lintas Barat Km 42 Gunung Kulu',
          type: 'Zona Rawan Laka & Tanjakan Curam',
          incidentCount: 11,
          predominantCategory: 'TRAFFIC_ACCIDENT',
          description: 'Jalur nasional perbukitan Banda Aceh - Meulaboh dengan kontur jurang dan tikungan tajam.',
        },
        {
          name: 'Lahan Gambut Suak Puntong (Nagan Raya)',
          type: 'Pantauan Karhutla Satelit FIRMS',
          incidentCount: 8,
          predominantCategory: 'FIRE_HOTSPOT',
          description: 'Deteksi titik anomali termal vegetasi gambut pesisir barat daya Aceh.',
        },
      ];
    } else {
      // Dynamic Hotspots from regionEvents or localized synthesis
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
      hotspotAreas = Object.entries(hotspotMap)
        .map(([name, data]) => ({
          name,
          type: 'Area Rawan Insiden',
          incidentCount: data.count,
          predominantCategory: data.category,
          description: data.desc,
        }))
        .sort((a, b) => b.incidentCount - a.incidentCount)
        .slice(0, 4);

      if (hotspotAreas.length < 4) {
        const defaultSpots = [
          {
            name: `Koridor Arteri Utama ${regionName}`,
            type: 'Simpul Mobilitas & Keselamatan Jalan',
            incidentCount: 8,
            predominantCategory: 'TRAFFIC_ACCIDENT' as EventCategory,
            description: `Jalur arteri komuter utama ${regionName} dengan intensitas kendaraan tinggi dan pemantauan CCTV Korlantas.`,
          },
          {
            name: `Daerah Aliran Sungai & Drainase ${regionName}`,
            type: 'Area Rawan Genangan Urban',
            incidentCount: 6,
            predominantCategory: 'FLOOD' as EventCategory,
            description: `Kawasan dataran rendah dan tangkapan air ${regionName} yang rentan luapan limpasan saat curah hujan ekstrem.`,
          },
          {
            name: `Kawasan Penyangga & Vegetasi ${regionName}`,
            type: 'Pantauan Lingkungan & Karhutla Satelit',
            incidentCount: 5,
            predominantCategory: 'FIRE_HOTSPOT' as EventCategory,
            description: `Zona hijau dan lahan vegetasi terbuka dalam pantauan anomali termal satelit NASA FIRMS.`,
          },
          {
            name: `Pusat Siaga Bencana BPBD ${province}`,
            type: 'Jejaring Tanggap Darurat & Evakuasi',
            incidentCount: 4,
            predominantCategory: 'SEVERE_WEATHER' as EventCategory,
            description: `Pusat komando logistik, shelter darurat, dan koordinasi evakuasi kebencanaan terpadu wilayah ${province}.`,
          },
        ];

        for (const spot of defaultSpots) {
          if (hotspotAreas.length >= 4) break;
          if (!hotspotAreas.some((h) => h.name.includes(spot.name.split(' ')[0]))) {
            hotspotAreas.push(spot);
          }
        }
      }
    }

    let summary = `Profil pemantauan keselamatan terintegrasi untuk wilayah ${regionName} (${province}) mengintegrasikan sensor hidrometeorologi BMKG, satelit NASA FIRMS, sistem penanggulangan bencana BPBD ${province}, serta rekayasa keselamatan transportasi.`;
    if (isJakarta) {
      summary = 'Metropolitan DKI Jakarta menghadapi kerentanan hidrometeorologi (banjir rob di pesisir utara, genangan jalan arteri saat curah hujan ekstrem), tingkat polusi udara partikulat (PM2.5/AQI), serta frekuensi insiden lalu lintas di jalur tol lingkar dalam kota dan arteri primer.';
    } else if (isSurabaya) {
      summary = 'Kota Surabaya sebagai poros aglomerasi Gerbangkertosusila memprioritaskan mitigasi luapan DAS Kali Lamong & pesisir Kenjeran, dinamika cuaca maritim Selat Madura, kepadatan logistik kontainer Margomulyo-Tanjung Perak, serta pemantauan kualitas udara perkotaan.';
    } else if (isBandung) {
      summary = 'Kawasan Cekungan Bandung memiliki kerentanan multi-ancaman: banjir musiman di bantaran Sungai Citarum (Dayeuhkolot/Baleendah), kerawanan kecelakaan di ruas Tol Cipularang & arteri utama, potensi seismik aktif dari jalur Sesar Lembang & Sesar Garsela, serta fluktuasi indeks kualitas udara urban.';
    } else if (isBalikpapan) {
      summary = 'Kota Balikpapan sebagai kota penyangga utama Ibu Kota Nusantara (IKN) dan sentra industri energi memprioritaskan keselamatan transportasi turunan curam Muara Rapak, keandalan proteksi bahaya proses Kilang Pertamina RU V, mitigasi genangan DAS Ampal, serta patroli karhutla koridor Samboja.';
    } else if (isBanten) {
      summary = 'Provinsi Banten sebagai gerbang barat Pulau Jawa memiliki profil risiko tinggi terhadap aktivitas seismik selatan (Sesar Bayah & zona subduksi Selat Sunda), banjir luapan DAS Sungai Cibanten Kota Serang, antrean logistik arteri Pelabuhan Merak Cilegon, dan deteksi titik panas di pesisir Pandeglang.';
    } else if (isSamarinda) {
      summary = 'Kota Samarinda sebagai ibu kota Kalimantan Timur dan sentra perekonomian DAS Mahakam menghadapi kerentanan banjir luapan Sungai Mahakam, kerawanan lalu lintas jembatan Mahakam I & IV, serta anomali titik panas karhutla perbukitan Palaran.';
    } else if (isMakassar) {
      summary = 'Kota Makassar sebagai hub logistik Indonesia Timur memfokuskan mitigasi pada genangan DAS Sungai Tallo, kecepatan tinggi dan blindspot tol Reformasi, dinamika pasang cuaca maritim Pantai Losari, serta arus padat arteri Trans-Sulawesi.';
    } else if (isMedan) {
      summary = 'Kota Medan sebagai metropolitan terbesar Pulau Sumatera memprioritaskan normalisasi banjir DAS Sungai Deli-Babura, keselamatan koridor truk kontainer Tol Belmera-Pelabuhan Belawan, dan mitigasi kebakaran vegetasi pinggiran Deli Serdang.';
    } else if (isSemarang) {
      summary = 'Kota Semarang memadukan mitigasi banjir rob pesisir Kaligawe Pantura, pencegahan kecelakaan rem blong turunan curam Tol Gombel-Jatingaleh, serta penataan tanggul penahan ombak Pelabuhan Tanjung Emas.';
    } else if (isYogyakarta) {
      summary = 'Kawasan D.I. Yogyakarta memiliki karakter multi-risiko geologis aktif: erupsi dan lahar hujan Gunung Merapi di utara, patahan aktif seismik Sesar Opak di selatan, serta rekayasa keselamatan persimpangan komuter Ring Road.';
    } else if (isDenpasar) {
      summary = 'Kota Denpasar dan kawasan metropolitan Sarbagita memprioritaskan mitigasi seismik busur subduksi Samudra Hindia, drainase perkotaan Tukad Badung, keselamatan lalu lintas bypass wisata, dan cuaca maritim pesisir.';
    }

    return {
      id: `region-${slug}`,
      name: regionName,
      slug,
      province,
      type: regionType,
      coordinates: {
        latitude,
        longitude,
      },
      riskScore: baseScore,
      riskLevel,
      summary,
      totalIncidents: regionEvents.length || (isJakarta ? 42 : isSurabaya ? 28 : isSamarinda ? 15 : isMakassar ? 16 : isMedan ? 18 : 20),
      activeAlerts: regionEvents.filter((e) => e.status === 'ACTIVE').length || 2,
      categoryBreakdown,
      hotspotAreas,
      recentIncidents: regionEvents.slice(0, 15),
      environmentalStatus: {
        aqi: isJakarta ? 142 : isSurabaya ? 95 : isBandung ? 68 : isSamarinda ? 64 : isMakassar ? 58 : isMedan ? 88 : 62,
        aqiCategory:
          (isJakarta ? 142 : isSurabaya ? 95 : isBandung ? 68 : isMedan ? 88 : 62) > 100
            ? 'Tidak Sehat (Unhealthy)'
            : (isJakarta ? 142 : isSurabaya ? 95 : isBandung ? 68 : isMedan ? 88 : 62) > 50
            ? 'Sedang (Moderate)'
            : 'Baik (Good)',
        weather: isJakarta ? 'Hujan Ringan / Lembap' : isSurabaya ? 'Cerah Berawan' : isSamarinda ? 'Hujan Lokal' : 'Cerah Berawan Tropis',
        temperature: isJakarta ? 30.5 : isSurabaya ? 31.8 : isBandung ? 24.2 : isSamarinda ? 31.0 : isMakassar ? 31.4 : 29.5,
        precipitation: isJakarta ? 4.2 : isSurabaya ? 0.8 : isBandung ? 2.4 : isSamarinda ? 3.1 : 1.6,
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
