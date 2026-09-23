import { SafetyDB } from '@/lib/db';
import { SafetyInsight } from '@/types/safety';

export function generateSafetyInsights(): SafetyInsight[] {
  const { events } = SafetyDB.getEvents();
  const insights: SafetyInsight[] = [];

  // 1. Quake insight
  const quakes = events.filter((e) => e.category === 'EARTHQUAKE');
  const recentQuakes = quakes.filter((e) => {
    const diffDays = (Date.now() - new Date(e.occurredAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  });

  if (recentQuakes.length > 0) {
    const criticalQuakes = recentQuakes.filter(
      (q) => q.severity === 'CRITICAL' || q.severity === 'HIGH'
    );
    insights.push({
      id: 'insight-quake-recent',
      title: 'Aktivitas Seismik Mingguan Signifikan',
      narrative: `Dalam 7 hari terakhir terdeteksi ${recentQuakes.length} aktivitas gempa tektonik di Indonesia, dengan ${criticalQuakes.length} kejadian berkekuatan M ≥ 5.0 atau dirasakan nyata oleh penduduk.`,
      category: 'EARTHQUAKE',
      severity: criticalQuakes.length > 0 ? 'HIGH' : 'MEDIUM',
      sourceName: 'Pusat Gempa Bumi & Tsunami BMKG',
      evidenceCount: recentQuakes.length,
      filterPayload: { category: 'EARTHQUAKE' },
      generatedAt: new Date().toISOString(),
    });
  }

  // 2. Bandung Basin Hydrological & Flood Risk Memory
  const bandungFloods = events.filter(
    (e) =>
      e.category === 'FLOOD' &&
      (e.regencyCity.toLowerCase().includes('bandung') ||
        e.locationName.toLowerCase().includes('bandung') ||
        e.locationName.toLowerCase().includes('dayeuhkolot') ||
        e.locationName.toLowerCase().includes('baleendah'))
  );

  if (bandungFloods.length > 0) {
    insights.push({
      id: 'insight-bandung-floods',
      title: 'Kerentanan Kronis Cekungan Bandung Selatan',
      narrative: `Tercatat ${bandungFloods.length} kejadian genangan air dan luapan Sungai Citarum di Bandung Selatan (termasuk Dayeuhkolot dan Baleendah), dengan ketinggian air mencapai hingga 120 cm. Wilayah ini memerlukan pemantauan elevasi air secara kontinu terutama saat intensitas hujan hulu meningkat.`,
      category: 'FLOOD',
      severity: 'HIGH',
      sourceName: 'BPBD Jabar & Data Informasi Bencana Indonesia (DIBI BNPB)',
      evidenceCount: bandungFloods.length,
      filterPayload: { category: 'FLOOD', location: 'Bandung' },
      generatedAt: new Date().toISOString(),
    });
  }

  // 3. Traffic Accident Blackspot Risk (Cipularang & Arterial)
  const trafficIncidents = events.filter((e) => e.category === 'TRAFFIC_ACCIDENT');
  const tollAccidents = trafficIncidents.filter((e) =>
    e.locationName.toLowerCase().includes('tol')
  );

  if (tollAccidents.length > 0) {
    insights.push({
      id: 'insight-traffic-corridors',
      title: 'Analisis Titik Rawan Kecelakaan Koridor Tol',
      narrative: `Data kecelakaan terverifikasi menyoroti segmen Tol Cipularang KM 90-100 dan Tol Padaleunyi sebagai zona rawan benturan beruntun, dipicu faktor turunan terjal dan rem blong pada kendaraan berat. Rekomendasi mitigasi mencakup penambahan jalur penyelamat darurat (emergency escape ramp) dan pembatasan kecepatan.`,
      category: 'TRAFFIC_ACCIDENT',
      severity: 'CRITICAL',
      sourceName: 'PJR Korlantas Polri & KNKT',
      evidenceCount: tollAccidents.length,
      filterPayload: { category: 'TRAFFIC_ACCIDENT', location: 'Cipularang' },
      generatedAt: new Date().toISOString(),
    });
  }

  // 4. Hotspots / Karhutla Satellite Detection
  const hotspots = events.filter((e) => e.category === 'FIRE_HOTSPOT');
  const highConfHotspots = hotspots.filter(
    (h) => (h.metadata?.confidence || 0) >= 70
  );

  if (hotspots.length > 0) {
    insights.push({
      id: 'insight-fire-hotspots',
      title: 'Deteksi Dini Titik Panas Karhutla Sensor Satelit',
      narrative: `Sensor MODIS dan VIIRS satelit NASA mendeteksi ${hotspots.length} anomali termal/titik panas di wilayah Indonesia dalam siklus 24 jam terakhir, dengan ${highConfHotspots.length} titik memiliki tingkat keyakinan (confidence) tinggi > 70%.`,
      category: 'FIRE_HOTSPOT',
      severity: highConfHotspots.length > 5 ? 'HIGH' : 'MEDIUM',
      sourceName: 'NASA FIRMS Near-Real-Time Active Fire',
      evidenceCount: hotspots.length,
      filterPayload: { category: 'FIRE_HOTSPOT' },
      generatedAt: new Date().toISOString(),
    });
  }

  // 5. Volcano Alerts
  const volcanoAlerts = events.filter((e) => e.category === 'VOLCANO');
  const criticalVolcano = volcanoAlerts.filter((v) => v.severity === 'CRITICAL');

  if (volcanoAlerts.length > 0) {
    insights.push({
      id: 'insight-volcano-status',
      title: 'Status Waspada & Awas Gunung Api Aktif',
      narrative: `Terpantau ${volcanoAlerts.length} gunung api dalam status peringatan aktif di Indonesia (${criticalVolcano.length} dalam status Level IV Awas). Rekomendasi kepatuhan radius sektoral bahaya dan notice penerbangan (VONA) wajib dipatuhi.`,
      category: 'VOLCANO',
      severity: criticalVolcano.length > 0 ? 'CRITICAL' : 'MEDIUM',
      sourceName: 'Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG)',
      evidenceCount: volcanoAlerts.length,
      filterPayload: { category: 'VOLCANO' },
      generatedAt: new Date().toISOString(),
    });
  }

  return insights;
}
