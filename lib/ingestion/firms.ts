import { SafetyEvent } from '@/types/safety';

export async function fetchFIRMSHotspots(): Promise<SafetyEvent[]> {
  const events: SafetyEvent[] = [];
  const url =
    'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_SouthEast_Asia_24h.csv';

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SafetyIntelligenceDashboard/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn('NASA FIRMS HTTP status:', res.status);
      return [];
    }

    const text = await res.text();
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim());
    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    const brightIdx = header.indexOf('brightness');
    const dateIdx = header.indexOf('acq_date');
    const timeIdx = header.indexOf('acq_time');
    const confIdx = header.indexOf('confidence');
    const frpIdx = header.indexOf('frp');

    // Indonesia bounding box roughly: lat [-11 to 6], lon [95 to 141]
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);

      if (lat >= -11.0 && lat <= 6.0 && lon >= 95.0 && lon <= 141.0) {
        const bright = parseFloat(cols[brightIdx]) || 300;
        const confidence = parseInt(cols[confIdx]) || 50;
        const frp = parseFloat(cols[frpIdx]) || 0;
        const dateStr = cols[dateIdx] || '2026-09-23';
        const timeStr = (cols[timeIdx] || '0000').padStart(4, '0');
        const hour = timeStr.substring(0, 2);
        const minute = timeStr.substring(2, 4);
        const iso = `${dateStr}T${hour}:${minute}:00Z`;

        const province = estimateProvinceFromCoords(lat, lon);
        const fingerprint = `firms-fire-${lat.toFixed(2)}-${lon.toFixed(2)}-${dateStr}`;

        events.push({
          id: `firms-${Math.random().toString(36).substring(2, 9)}`,
          fingerprint,
          title: `Titik Panas Satelit (Hotspot) - ${province}`,
          description: `Deteksi sensor satelit MODIS Terra/Aqua. Suhu kecerahan ${bright.toFixed(1)} K, Tingkat kepercayaan deteksi: ${confidence}%, Fire Radiative Power: ${frp.toFixed(1)} MW.`,
          category: 'FIRE_HOTSPOT',
          subcategory: 'KARHUTLA_SATELIT',
          severity: confidence >= 80 ? 'HIGH' : confidence >= 50 ? 'MEDIUM' : 'LOW',
          status: 'ACTIVE',
          temporalStatus: 'NEAR_REALTIME',
          sourceName: 'NASA FIRMS (MODIS/VIIRS NRT)',
          sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
          latitude: lat,
          longitude: lon,
          locationName: `Koordinat ${lat.toFixed(3)}, ${lon.toFixed(3)} (${province})`,
          regencyCity: province,
          province,
          occurredAt: iso,
          ingestedAt: new Date().toISOString(),
          periodLabel: 'Sep 2026',
          impactSummary: `Confidence: ${confidence}%, FRP: ${frp} MW`,
          metadata: {
            brightness: bright,
            confidence,
            frp,
            satellite: 'MODIS/VIIRS',
          },
        });

        count++;
        if (count >= 50) break; // limit to top 50 active hotspots for Indonesia
      }
    }
  } catch (err) {
    console.error('Error fetching NASA FIRMS hotspots:', err);
  }

  return events;
}

function estimateProvinceFromCoords(lat: number, lon: number): string {
  if (lat > -1 && lat < 3 && lon > 100 && lon < 105) return 'Riau';
  if (lat > -4 && lat < 0 && lon > 102 && lon < 106) return 'Sumatera Selatan';
  if (lat > -7 && lat < -6 && lon > 106 && lon < 109) return 'Jawa Barat';
  if (lat > -8 && lat < -6 && lon > 109 && lon < 112) return 'Jawa Tengah';
  if (lat > -9 && lat < -7 && lon > 111 && lon < 115) return 'Jawa Timur';
  if (lat > -3 && lat < 2 && lon > 108 && lon < 118) return 'Kalimantan';
  if (lat > -5 && lat < 2 && lon > 118 && lon < 125) return 'Sulawesi';
  if (lon > 130) return 'Papua / Maluku';
  return 'Wilayah Indonesia';
}
