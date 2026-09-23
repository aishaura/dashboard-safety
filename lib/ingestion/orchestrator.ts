import { SafetyDB } from '@/lib/db';
import { fetchBMKGEarthquakes } from './bmkg';
import { fetchFIRMSHotspots } from './firms';
import { fetchWeatherAndAirQuality } from './weather-air';
import { CURATED_INCIDENTS } from './curated-incidents';
import { SyncLog } from '@/types/safety';

export async function runFullSync(): Promise<{
  bmkgCount: number;
  firmsCount: number;
  weatherCount: number;
  curatedCount: number;
  totalInserted: number;
  totalUpdated: number;
}> {
  console.log('[Orchestrator] Starting data synchronization...');
  const startTime = new Date().toISOString();

  // 1. Seed curated historical data first
  const { inserted: curIns, updated: curUpd } = SafetyDB.upsertEvents(CURATED_INCIDENTS);

  // 2. Fetch live BMKG earthquakes
  let bmkgEvents: any[] = [];
  try {
    bmkgEvents = await fetchBMKGEarthquakes();
  } catch (err) {
    console.error('[Orchestrator] BMKG sync error:', err);
  }

  // 3. Fetch live NASA FIRMS hotspots
  let firmsEvents: any[] = [];
  try {
    firmsEvents = await fetchFIRMSHotspots();
  } catch (err) {
    console.error('[Orchestrator] NASA FIRMS sync error:', err);
  }

  // 4. Fetch live Weather & Air Quality alerts
  let weatherEvents: any[] = [];
  try {
    weatherEvents = await fetchWeatherAndAirQuality();
  } catch (err) {
    console.error('[Orchestrator] Weather/Air sync error:', err);
  }

  const liveEvents = [...bmkgEvents, ...firmsEvents, ...weatherEvents];
  const { inserted: liveIns, updated: liveUpd } = SafetyDB.upsertEvents(liveEvents);

  const endTime = new Date().toISOString();

  const syncLog: SyncLog = {
    id: `sync-${Date.now()}`,
    sourceName: 'Unified Multi-Source Sync (BMKG, FIRMS, Open-Meteo, Curated)',
    startedAt: startTime,
    endedAt: endTime,
    status: 'SUCCESS',
    recordsFetched: CURATED_INCIDENTS.length + liveEvents.length,
    recordsInserted: curIns + liveIns,
    recordsUpdated: curUpd + liveUpd,
  };

  SafetyDB.logSync(syncLog);

  console.log('[Orchestrator] Sync finished successfully:', syncLog);

  return {
    bmkgCount: bmkgEvents.length,
    firmsCount: firmsEvents.length,
    weatherCount: weatherEvents.length,
    curatedCount: CURATED_INCIDENTS.length,
    totalInserted: curIns + liveIns,
    totalUpdated: curUpd + liveUpd,
  };
}
