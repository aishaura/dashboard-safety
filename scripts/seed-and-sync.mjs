import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'safety-events.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('Seeding initial data and fetching live BMKG + FIRMS feeds...');

async function run() {
  const events = [];

  // 1. Fetch BMKG
  try {
    console.log('Fetching BMKG TEWS...');
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
    if (res.ok) {
      const data = await res.json();
      const list = data?.Infogempa?.gempa || [];
      for (const item of list) {
        if (!item || !item.Coordinates) continue;
        const [latStr, lonStr] = item.Coordinates.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const mag = parseFloat(item.Magnitude) || 5.0;
        events.push({
          id: `bmkg-${Math.random().toString(36).substring(2, 9)}`,
          fingerprint: `bmkg-quake-${item.Tanggal}-${item.Jam}-${item.Coordinates}`,
          title: `Gempa Bumi M ${item.Magnitude} - ${item.Wilayah}`,
          description: `Kedalaman: ${item.Kedalaman}. ${item.Potensi || ''}.`,
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
          regencyCity: item.Wilayah.split(',')[0].slice(0, 30),
          province: item.Wilayah.includes('Jabar') || item.Wilayah.includes('Bandung') ? 'Jawa Barat' : 'Indonesia',
          occurredAt: item.DateTime || new Date().toISOString(),
          ingestedAt: new Date().toISOString(),
          periodLabel: 'Sep 2026',
          impactSummary: item.Potensi,
          metadata: {
            magnitude: mag,
            depth: item.Kedalaman,
            shakemapUrl: item.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${item.Shakemap}` : undefined,
          },
        });
      }
      console.log(`Fetched ${events.length} BMKG earthquakes.`);
    }
  } catch (e) {
    console.warn('BMKG fetch warning:', e.message);
  }

  // 2. Fetch FIRMS Hotspots
  try {
    console.log('Fetching NASA FIRMS Active Fire...');
    const res = await fetch('https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_SouthEast_Asia_24h.csv');
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      const header = lines[0].split(',').map(h => h.trim());
      const latIdx = header.indexOf('latitude');
      const lonIdx = header.indexOf('longitude');
      const brightIdx = header.indexOf('brightness');
      const dateIdx = header.indexOf('acq_date');
      const timeIdx = header.indexOf('acq_time');
      const confIdx = header.indexOf('confidence');
      const frpIdx = header.indexOf('frp');

      let fireCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const lat = parseFloat(cols[latIdx]);
        const lon = parseFloat(cols[lonIdx]);

        if (lat >= -11.0 && lat <= 6.0 && lon >= 95.0 && lon <= 141.0) {
          const bright = parseFloat(cols[brightIdx]) || 300;
          const conf = parseInt(cols[confIdx]) || 50;
          const frp = parseFloat(cols[frpIdx]) || 0;
          const dateStr = cols[dateIdx] || '2026-09-23';
          const timeStr = (cols[timeIdx] || '0000').padStart(4, '0');
          const iso = `${dateStr}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00Z`;

          events.push({
            id: `firms-${Math.random().toString(36).substring(2, 9)}`,
            fingerprint: `firms-${lat.toFixed(2)}-${lon.toFixed(2)}-${dateStr}`,
            title: `Titik Panas Satelit (Hotspot MODIS)`,
            description: `Sensor satelit mendeteksi anomali termal. Suhu kecerahan ${bright.toFixed(1)} K, Tingkat kepercayaan ${conf}%, FRP ${frp.toFixed(1)} MW.`,
            category: 'FIRE_HOTSPOT',
            subcategory: 'KARHUTLA_SATELIT',
            severity: conf >= 80 ? 'HIGH' : 'MEDIUM',
            status: 'ACTIVE',
            temporalStatus: 'NEAR_REALTIME',
            sourceName: 'NASA FIRMS (NRT MODIS)',
            sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
            latitude: lat,
            longitude: lon,
            locationName: `Koordinat ${lat.toFixed(3)}, ${lon.toFixed(3)}`,
            regencyCity: 'Indonesia',
            province: 'Indonesia',
            occurredAt: iso,
            ingestedAt: new Date().toISOString(),
            periodLabel: 'Sep 2026',
            impactSummary: `Confidence: ${conf}%, FRP: ${frp} MW`,
            metadata: { brightness: bright, confidence: conf, frp },
          });
          fireCount++;
          if (fireCount >= 25) break;
        }
      }
      console.log(`Fetched ${fireCount} NASA FIRMS hotspots.`);
    }
  } catch (e) {
    console.warn('NASA FIRMS fetch warning:', e.message);
  }

  // 3. Append Curated Incidents (Bandung & Indonesia)
  const curated = [
    {
      id: 'inc-bdg-flood-2026-09',
      fingerprint: 'flood-dayeuhkolot-2026-09-18',
      title: 'Banjir Luapan Sungai Citarum & Cipalasari Dayeuhkolot',
      description: 'Hujan deras berdurasi > 4 jam di wilayah hulu Bandung Selatan menyebabkan Sungai Citarum meluap. Ketinggian muka air berkisar 40 - 120 cm merendam pemukiman warga Desa Dayeuhkolot dan akses jalan utama penghubung Bandung - Banjaran.',
      category: 'FLOOD',
      subcategory: 'LUAPAN_SUNGAI',
      severity: 'HIGH',
      status: 'ACTIVE',
      temporalStatus: 'VERIFIED_REPORT',
      sourceName: 'BPBD Kabupaten Bandung & Pusdalops Jabar',
      sourceUrl: 'https://bpbd.jabarprov.go.id/',
      latitude: -7.0019,
      longitude: 107.6205,
      locationName: 'Kecamatan Dayeuhkolot, Bandung Selatan',
      district: 'Dayeuhkolot',
      regencyCity: 'Kabupaten Bandung',
      province: 'Jawa Barat',
      occurredAt: '2026-09-18T14:30:00Z',
      ingestedAt: '2026-09-18T15:10:00Z',
      periodLabel: 'Sep 2026',
      casualtiesFatal: 0,
      casualtiesInjured: 0,
      impactSummary: '1.240 KK terdampak, Jalan Raya Dayeuhkolot terputus sementara',
      metadata: { waterLevelCm: 120, affectedHouseholds: 1240, riverBasin: 'DAS Citarum Hulu' },
    },
    {
      id: 'inc-bdg-flood-baleendah-2026',
      fingerprint: 'flood-baleendah-andir-2026-08',
      title: 'Banjir Genangan Kelurahan Andir & Baleendah',
      description: 'Genangan air berulang merendam pemukiman Kampung Cieunteung dan Kelurahan Andir dengan ketinggian air 30 - 80 cm setelah hujan intensitas tinggi di wilayah Cekungan Bandung.',
      category: 'FLOOD',
      subcategory: 'GENANGAN_KRONIS',
      severity: 'MEDIUM',
      status: 'HISTORICAL_RECORD',
      temporalStatus: 'HISTORICAL',
      sourceName: 'BNPB DIBI & BPBD Jabar',
      sourceUrl: 'https://dibi.bnpb.go.id/',
      latitude: -6.9961,
      longitude: 107.6322,
      locationName: 'Kampung Cieunteung, Baleendah',
      district: 'Baleendah',
      regencyCity: 'Kabupaten Bandung',
      province: 'Jawa Barat',
      occurredAt: '2026-08-25T17:00:00Z',
      ingestedAt: '2026-08-26T08:00:00Z',
      periodLabel: 'Agu 2026',
      casualtiesFatal: 0,
      casualtiesInjured: 0,
      impactSummary: '850 rumah tergenang, pompa polder Cieunteung dioperasikan maksimal',
      metadata: { waterLevelCm: 80, polderStatus: 'Operasional' },
    },
    {
      id: 'inc-traffic-cipularang-km92',
      fingerprint: 'traffic-tol-cipularang-km92-2026-09',
      title: 'Kecelakaan Beruntun Tol Cipularang KM 92 Arah Jakarta',
      description: 'Truk muatan berat mengalami kegagalan fungsi pengereman (rem blong) pada turunan tajam Tol Cipularang KM 92, menabrak beruntun 11 kendaraan roda empat yang sedang melambat karena kepadatan lalu lintas.',
      category: 'TRAFFIC_ACCIDENT',
      subcategory: 'TABRAKAN_BERUNTUN_TOL',
      severity: 'CRITICAL',
      status: 'HISTORICAL_RECORD',
      temporalStatus: 'VERIFIED_REPORT',
      sourceName: 'PJR Korlantas Polri & Jasa Marga Traffic Information',
      sourceUrl: 'https://jasamarga.com/',
      latitude: -6.6432,
      longitude: 107.4121,
      locationName: 'Ruas Jalan Tol Cipularang KM 92 (Purwakarta - Bandung)',
      district: 'Sukatani',
      regencyCity: 'Kabupaten Purwakarta / Koridor Bandung Raya',
      province: 'Jawa Barat',
      occurredAt: '2026-09-08T15:20:00Z',
      ingestedAt: '2026-09-08T16:05:00Z',
      periodLabel: 'Sep 2026',
      casualtiesFatal: 1,
      casualtiesInjured: 14,
      impactSummary: 'Tol Cipularang ditutup arah Jakarta selama 4 jam, 12 kendaraan rusak berat',
      metadata: { investigationBody: 'KNKT & Korlantas Polri', causeFactor: 'Rem blong pada kontur turunan terjal' },
    },
    {
      id: 'inc-traffic-soetta-bandung-2026',
      fingerprint: 'traffic-soetta-mohammad-toha-2026-09',
      title: 'Kecelakaan Fatal Jalur Arteri Soekarno-Hatta - Moh. Toha Bandung',
      description: 'Truk tangki menabrak separator jalan dan dua sepeda motor di perempatan by-pass Jl. Soekarno-Hatta persimpangan Moh. Toha saat cuaca hujan gerimis.',
      category: 'TRAFFIC_ACCIDENT',
      subcategory: 'TABRAKAN_LALU_LINTAS_KOTA',
      severity: 'HIGH',
      status: 'ACTIVE',
      temporalStatus: 'VERIFIED_REPORT',
      sourceName: 'Satlantas Polrestabes Bandung & Dishub Kota Bandung',
      sourceUrl: 'https://korlantas.polri.go.id/',
      latitude: -6.9538,
      longitude: 107.6119,
      locationName: 'Simpang Empat By-pass Soekarno Hatta - Moh Toha',
      district: 'Regol',
      regencyCity: 'Kota Bandung',
      province: 'Jawa Barat',
      occurredAt: '2026-09-19T07:15:00Z',
      ingestedAt: '2026-09-19T08:00:00Z',
      periodLabel: 'Sep 2026',
      casualtiesFatal: 2,
      casualtiesInjured: 3,
      impactSummary: 'Kemacetan panjang 4 km di jalur cepat Soekarno-Hatta arah barat',
      metadata: { roadType: 'Jalan Nasional Arteri Primer' },
    },
    {
      id: 'inc-earthquake-lembang-garsela',
      fingerprint: 'quake-sesar-garsela-kab-bandung-2024-09',
      title: 'Gempa Bumi Dangkal M 5.0 Akibat Sesar Garsela Mengguncang Kertasari Bandung',
      description: 'Gempa tektonik darat dangkal kedalaman 10 km dipicu oleh deformasi batuan pada zona Sesar Garsela (Garut Selatan). Guncangan mencapai intensitas IV-V MMI di Kertasari dan Pangalengan, dirasakan nyata di Kota Bandung.',
      category: 'EARTHQUAKE',
      subcategory: 'SESAR_AKTIF_DARAT',
      severity: 'CRITICAL',
      status: 'HISTORICAL_RECORD',
      temporalStatus: 'HISTORICAL',
      sourceName: 'Pusat Gempa Bumi & Tsunami BMKG',
      sourceUrl: 'https://bmkg.go.id/',
      latitude: -7.1902,
      longitude: 107.6712,
      locationName: 'Kecamatan Kertasari & Bedeng, Kabupaten Bandung',
      district: 'Kertasari',
      regencyCity: 'Kabupaten Bandung',
      province: 'Jawa Barat',
      occurredAt: '2024-09-18T09:41:00Z',
      ingestedAt: '2024-09-18T10:00:00Z',
      periodLabel: 'Sep 2024',
      casualtiesFatal: 2,
      casualtiesInjured: 81,
      impactSummary: '4.483 bangunan rumah & fasilitas publik di Kertasari dan Pangalengan rusak',
      metadata: { magnitude: 5.0, depth: '10 km', faultSystem: 'Sesar Garsela (Segmen Rakutai)' },
    },
    {
      id: 'inc-volcano-tangkuban-parahu',
      fingerprint: 'volcano-tangkuban-parahu-level2-waspada',
      title: 'Aktivitas Gunung Api Tangkuban Parahu: Status Level II (Waspada)',
      description: 'Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) menetapkan Status Waspada seiring peningkatan gempa hembusan dan emisi gas CO2 di Kawah Ratu. Masyarakat dilarang mendekati bibir kawah dalam radius 500 meter.',
      category: 'VOLCANO',
      subcategory: 'STATUS_GUNUNG_API',
      severity: 'MEDIUM',
      status: 'MONITORING',
      temporalStatus: 'VERIFIED_REPORT',
      sourceName: 'PVMBG Badan Geologi Kementerian ESDM (MAGMA Indonesia)',
      sourceUrl: 'https://magma.esdm.go.id/',
      latitude: -6.7594,
      longitude: 107.6097,
      locationName: 'Kawah Ratu Gunung Tangkuban Parahu (Lembang - Subang)',
      district: 'Lembang',
      regencyCity: 'Kabupaten Bandung Barat',
      province: 'Jawa Barat',
      occurredAt: '2026-09-15T08:00:00Z',
      ingestedAt: '2026-09-15T09:00:00Z',
      periodLabel: 'Sep 2026',
      casualtiesFatal: 0,
      casualtiesInjured: 0,
      impactSummary: 'Radius rekomendasi bahaya 500 meter dari Kawah Ratu & Kawah Upas',
      metadata: { alertLevel: 'Level II (Waspada)', hazardRadiusMeters: 500 },
    },
    {
      id: 'inc-air-bandung-live',
      fingerprint: 'air-bandung-current-sep2026',
      title: 'Indeks Kualitas Udara Kota Bandung: AQI 68 (Sedang)',
      description: 'Stasiun pemantauan kualitas udara Copernicus / Open-Meteo mendeteksi konsentrasi PM2.5 sebesar 20.4 µg/m³. Kualitas udara aman untuk sebagian besar orang, sensitif disarankan waspada.',
      category: 'AIR_POLLUTION',
      subcategory: 'INDEKS_ISPU_AQI',
      severity: 'LOW',
      status: 'MONITORING',
      temporalStatus: 'REALTIME',
      sourceName: 'Open-Meteo & Copernicus Atmosphere Service',
      sourceUrl: 'https://open-meteo.com/',
      latitude: -6.9175,
      longitude: 107.6191,
      locationName: 'Pusat Kota Bandung, Jl. Asia Afrika',
      district: 'Sumur Bandung',
      regencyCity: 'Kota Bandung',
      province: 'Jawa Barat',
      occurredAt: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      periodLabel: 'Sep 2026',
      impactSummary: 'AQI: 68, PM2.5: 20.4 µg/m³',
      metadata: { usAqi: 68, pm25: 20.4, pm10: 38 },
    },
  ];

  events.push(...curated);

  // Write merged events
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
  console.log(`Successfully written ${events.length} total events to ${DATA_FILE}`);
}

run().catch(console.error);
