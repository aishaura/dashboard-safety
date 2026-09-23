import { SafetyEvent } from '@/types/safety';

export async function fetchBMKGEarthquakes(): Promise<SafetyEvent[]> {
  const events: SafetyEvent[] = [];
  const headers = { 'User-Agent': 'SafetyIntelligenceDashboard/1.0' };

  try {
    // 1. Fetch Gempa Terkini (M >= 5.0)
    const resTerkini = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', {
      headers,
      next: { revalidate: 300 },
    });

    if (resTerkini.ok) {
      const data = await resTerkini.json();
      const list = data?.Infogempa?.gempa || [];
      const items = Array.isArray(list) ? list : [list];

      for (const item of items) {
        if (!item || !item.Coordinates) continue;
        const [latStr, lonStr] = item.Coordinates.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const mag = parseFloat(item.Magnitude) || 5.0;

        // Parse date time
        const isoDate = item.DateTime || new Date().toISOString();
        const fingerprint = `bmkg-quake-m5-${item.Tanggal}-${item.Jam}-${item.Coordinates}`;

        events.push({
          id: `bmkg-${Math.random().toString(36).substring(2, 9)}`,
          fingerprint,
          title: `Gempa Bumi M ${item.Magnitude} - ${item.Wilayah}`,
          description: `Pusat gempa kedalaman ${item.Kedalaman}. ${item.Potensi || ''}.`,
          category: 'EARTHQUAKE',
          subcategory: 'TEKTONIK_M5',
          severity: mag >= 6.5 ? 'CRITICAL' : mag >= 5.5 ? 'HIGH' : 'MEDIUM',
          status: 'ACTIVE',
          temporalStatus: 'REALTIME',
          sourceName: 'BMKG Indonesia (TEWS)',
          sourceUrl: 'https://data.bmkg.go.id/',
          latitude: lat,
          longitude: lon,
          locationName: item.Wilayah,
          regencyCity: extractCity(item.Wilayah),
          province: extractProvince(item.Wilayah),
          occurredAt: isoDate,
          ingestedAt: new Date().toISOString(),
          periodLabel: formatPeriod(isoDate),
          impactSummary: item.Potensi,
          metadata: {
            magnitude: mag,
            depth: item.Kedalaman,
            lintang: item.Lintang,
            bujur: item.Bujur,
            shakemapUrl: item.Shakemap
              ? `https://data.bmkg.go.id/DataMKG/TEWS/${item.Shakemap}`
              : undefined,
          },
        });
      }
    }
  } catch (err) {
    console.error('Error fetching BMKG gempa terkini:', err);
  }

  try {
    // 2. Fetch Gempa Dirasakan
    const resDirasakan = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json', {
      headers,
      next: { revalidate: 300 },
    });

    if (resDirasakan.ok) {
      const data = await resDirasakan.json();
      const list = data?.Infogempa?.gempa || [];
      const items = Array.isArray(list) ? list : [list];

      for (const item of items) {
        if (!item || !item.Coordinates) continue;
        const [latStr, lonStr] = item.Coordinates.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const mag = parseFloat(item.Magnitude) || 4.0;
        const isoDate = item.DateTime || new Date().toISOString();
        const fingerprint = `bmkg-quake-felt-${item.Tanggal}-${item.Jam}-${item.Coordinates}`;

        events.push({
          id: `bmkg-felt-${Math.random().toString(36).substring(2, 9)}`,
          fingerprint,
          title: `Gempa Dirasakan M ${item.Magnitude} - ${item.Wilayah}`,
          description: `Kedalaman: ${item.Kedalaman}. Skala intensitas dirasakan: ${item.Dirasakan || 'Tidak ada data intensitas'}.`,
          category: 'EARTHQUAKE',
          subcategory: 'GEMPA_DIRASAKAN',
          severity: mag >= 5.5 ? 'HIGH' : mag >= 4.0 ? 'MEDIUM' : 'LOW',
          status: 'ACTIVE',
          temporalStatus: 'REALTIME',
          sourceName: 'BMKG Indonesia (TEWS)',
          sourceUrl: 'https://data.bmkg.go.id/',
          latitude: lat,
          longitude: lon,
          locationName: item.Wilayah,
          regencyCity: extractCity(item.Wilayah),
          province: extractProvince(item.Wilayah),
          occurredAt: isoDate,
          ingestedAt: new Date().toISOString(),
          periodLabel: formatPeriod(isoDate),
          impactSummary: `Dirasakan: ${item.Dirasakan}`,
          metadata: {
            magnitude: mag,
            depth: item.Kedalaman,
            mmiScale: item.Dirasakan,
          },
        });
      }
    }
  } catch (err) {
    console.error('Error fetching BMKG gempa dirasakan:', err);
  }

  return events;
}

function extractCity(wilayah: string): string {
  if (!wilayah) return 'Indonesia';
  const clean = wilayah.replace(/pusat gempa berada di (laut|darat)/gi, '').trim();
  const match = clean.match(
    /(Bandung|Jakarta|Bogor|Sukabumi|Cianjur|Garut|Tasikmalaya|Pangandaran|Cilacap|Bantul|Malang|Ruteng|Lombok|Palu|Jayapura|Ambon|Padang|Bengkulu)/i
  );
  if (match) return match[1];
  return clean.split(',')[0].slice(0, 30);
}

function extractProvince(wilayah: string): string {
  if (!wilayah) return 'Indonesia';
  const text = wilayah.toLowerCase();
  if (
    text.includes('jabar') ||
    text.includes('jawa barat') ||
    text.includes('bandung') ||
    text.includes('sukabumi') ||
    text.includes('cianjur') ||
    text.includes('garut')
  ) {
    return 'Jawa Barat';
  }
  if (text.includes('jatim') || text.includes('jawa timur')) return 'Jawa Timur';
  if (text.includes('jateng') || text.includes('jawa tengah')) return 'Jawa Tengah';
  if (text.includes('sumbar') || text.includes('sumatera barat')) return 'Sumatera Barat';
  if (text.includes('ntt')) return 'Nusa Tenggara Timur';
  if (text.includes('ntb')) return 'Nusa Tenggara Barat';
  if (text.includes('sulawesi')) return 'Sulawesi';
  if (text.includes('papua')) return 'Papua';
  return 'Indonesia';
}

function formatPeriod(iso: string): string {
  try {
    const d = new Date(iso);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '2026';
  }
}
