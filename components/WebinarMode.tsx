'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ShieldAlert,
  MapPin,
  Activity,
  Flame,
  Waves,
  Car,
  Wind,
  CheckCircle,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  AlertTriangle,
  FileText,
  Compass,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SafetyEvent, RegionSafetyProfile, SafetyInsight } from '@/types/safety';
import { SearchedLocation } from '@/components/Map/SafetyMap';
import { findLocationInfo } from '@/lib/indonesia-locations';

interface WebinarModeProps {
  onClose: () => void;
  events: SafetyEvent[];
  stats: any;
  activeRegionName?: string;
  searchedLocation?: SearchedLocation | null;
  bandungProfile?: RegionSafetyProfile | null;
  insights: SafetyInsight[];
}

const CATEGORY_COLORS: Record<string, string> = {
  FLOOD: '#3B82F6',
  TRAFFIC_ACCIDENT: '#F43F5E',
  EARTHQUAKE: '#A855F7',
  FIRE_HOTSPOT: '#F59E0B',
  SEVERE_WEATHER: '#06B6D4',
  AIR_POLLUTION: '#14B8A6',
  VOLCANO: '#EA580C',
  LANDSLIDE: '#84CC16',
  INDUSTRIAL_ACCIDENT: '#64748B',
};

const CATEGORY_NAMES: Record<string, string> = {
  FLOOD: 'Banjir',
  TRAFFIC_ACCIDENT: 'Kecelakaan',
  EARTHQUAKE: 'Gempa',
  FIRE_HOTSPOT: 'Titik Api',
  SEVERE_WEATHER: 'Cuaca',
  AIR_POLLUTION: 'Udara',
  VOLCANO: 'Gunung Api',
  LANDSLIDE: 'Longsor',
  INDUSTRIAL_ACCIDENT: 'Industri',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#10B981',
};

export default function WebinarMode({
  onClose,
  events,
  stats,
  activeRegionName = 'Nasional',
  searchedLocation,
  bandungProfile,
  insights,
}: WebinarModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [timerProgress, setTimerProgress] = useState(0);

  const SLIDE_DURATION_SEC = 16;
  const TOTAL_SLIDES = 5;

  // Determine active city/region identity
  const rawTarget = searchedLocation?.name || activeRegionName || 'Nasional';
  const regionQuery = rawTarget.toLowerCase().trim();
  const isNational = regionQuery === 'nasional' || regionQuery === 'indonesia' || (!searchedLocation && activeRegionName === 'Nasional');

  const locInfo = isNational ? null : findLocationInfo(regionQuery) || findLocationInfo(rawTarget);

  const isJakarta = regionQuery.includes('jakarta') || regionQuery.includes('dki');
  const isSurabaya = regionQuery.includes('surabaya') || regionQuery.includes('sby');
  const isBandung = regionQuery.includes('bandung') || regionQuery.includes('bdg');
  const isBalikpapan = regionQuery.includes('balikpapan') || regionQuery.includes('bpp');
  const isBanten =
    regionQuery.includes('banten') ||
    regionQuery.includes('serang') ||
    regionQuery.includes('cilegon') ||
    regionQuery.includes('bayah') ||
    regionQuery.includes('pandeglang');
  const isSamarinda = regionQuery.includes('samarinda');
  const isMakassar = regionQuery.includes('makassar');
  const isMedan = regionQuery.includes('medan');
  const isSemarang = regionQuery.includes('semarang');
  const isYogyakarta = regionQuery.includes('yogyakarta') || regionQuery.includes('jogja');
  const isDenpasar = regionQuery.includes('denpasar') || regionQuery.includes('bali');
  const isAceh =
    regionQuery.includes('aceh') ||
    regionQuery.includes('banda aceh') ||
    regionQuery.includes('sabang') ||
    regionQuery.includes('lhokseumawe');

  const displayName = isNational
    ? 'Pantauan Nasional Indonesia'
    : isAceh
    ? (regionQuery.includes('banda aceh') ? 'Kota Banda Aceh' : 'Provinsi Aceh')
    : isJakarta
    ? 'DKI Jakarta'
    : isSurabaya
    ? 'Kota Surabaya'
    : isBandung
    ? 'Bandung Raya'
    : isBalikpapan
    ? 'Kota Balikpapan'
    : isBanten
    ? 'Provinsi Banten'
    : isSamarinda
    ? 'Kota Samarinda'
    : isMakassar
    ? 'Kota Makassar'
    : isMedan
    ? 'Kota Medan'
    : isSemarang
    ? 'Kota Semarang'
    : isYogyakarta
    ? 'Kota Yogyakarta'
    : isDenpasar
    ? 'Kota Denpasar'
    : locInfo?.name || rawTarget;

  // Filter events relevant to this region
  const regionEvents = useMemo(() => {
    if (isNational) return events;
    const cleanTerm = locInfo
      ? locInfo.name.toLowerCase().replace(/^(kota|kabupaten|provinsi)\s+/i, '')
      : regionQuery;
    const matched = events.filter((e) => {
      const city = e.regencyCity.toLowerCase();
      const loc = e.locationName.toLowerCase();
      const prov = e.province.toLowerCase();
      const dist = (e.district || '').toLowerCase();
      if (locInfo) {
        const d = Math.hypot(e.latitude - locInfo.coordinates[0], e.longitude - locInfo.coordinates[1]);
        if (d < 0.6) return true;
      }
      return (
        city.includes(cleanTerm) ||
        loc.includes(cleanTerm) ||
        prov.includes(cleanTerm) ||
        dist.includes(cleanTerm)
      );
    });
    return matched.length > 0 ? matched : events;
  }, [events, isNational, locInfo, regionQuery]);

  // Aggregate stats for this region
  const criticalEvents = regionEvents.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
  );

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    regionEvents.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, count]) => ({
      name: CATEGORY_NAMES[cat] || cat,
      count,
      category: cat,
      color: CATEGORY_COLORS[cat] || '#3B82F6',
    })).sort((a, b) => b.count - a.count);
  }, [regionEvents]);

  const severityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    regionEvents.forEach((e) => {
      if (counts[e.severity] !== undefined) counts[e.severity]++;
    });
    return [
      { name: 'Kritis (Lvl 4)', value: counts.CRITICAL, color: SEVERITY_COLORS.CRITICAL },
      { name: 'Tinggi (Lvl 3)', value: counts.HIGH, color: SEVERITY_COLORS.HIGH },
      { name: 'Sedang (Lvl 2)', value: counts.MEDIUM, color: SEVERITY_COLORS.MEDIUM },
      { name: 'Rendah (Lvl 1)', value: counts.LOW, color: SEVERITY_COLORS.LOW },
    ].filter((item) => item.value > 0);
  }, [regionEvents]);

  // Profile Dossier Data (Jakarta, Surabaya, Bandung, or Fallback)
  const profileData = useMemo(() => {
    if (isJakarta) {
      return {
        name: 'DKI Jakarta',
        riskScore: 84,
        riskLevel: 'CRITICAL',
        summary:
          'Kawasan Metropolitan DKI Jakarta menghadapi kerentanan hidrometeorologi (banjir rob pesisir Teluk Jakarta dan genangan jalan arteri saat curah hujan tinggi), tingkat konsentrasi polutan PM2.5/AQI, serta frekuensi kecelakaan lantas di jalan tol lingkar dalam kota dan arteri primer.',
        hotspots: [
          {
            name: 'Muara Baru & Pluit',
            desc: 'Banjir rob pasang air laut dan penurunan muka tanah tanggul pesisir.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Tol Cawang - Grogol',
            desc: 'Ruas tol lingkar dalam dengan kepadatan volume komuter tinggi dan blindspot laka.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Arteri TB Simatupang & Kemang',
            desc: 'Titik genangan urban cepat saat curah hujan ekstrem di cekungan Jakarta Selatan.',
            icon: Waves,
            color: 'text-cyan-400',
          },
          {
            name: 'Pesisir Marunda & Cakung',
            desc: 'Zona paparan partikulat debu industri dan ISPU melampaui batas aman berkala.',
            icon: Wind,
            color: 'text-teal-400',
          },
        ],
        environment: {
          aqi: 142,
          aqiLabel: 'Tidak Sehat (Unhealthy)',
          weather: 'Hujan Ringan / Lembap',
          temp: 30.5,
          rain: 4.2,
        },
        recommendations: [
          'Peninggian tanggul NCICD fase pesisir & optimalisasi pompa polder waduk Pluit.',
          'Pemasangan sensor peringatan dini genangan (Early Warning System) otomatis di 14 titik arteri.',
          'Sistem buka-tutup rekayasa lalin terintegrasi CCTV Korlantas di persimpangan rawan.',
          'Pengetatan uji emisi kendaraan komuter & pengawasan cerobong industri pesisir.',
        ],
      };
    }

    if (isSurabaya) {
      return {
        name: 'Kota Surabaya',
        riskScore: 74,
        riskLevel: 'HIGH',
        summary:
          'Kota Surabaya sebagai poros aglomerasi Gerbangkertosusila memprioritaskan mitigasi luapan DAS Kali Lamong & pesisir Kenjeran, dinamika cuaca maritim Selat Madura, kepadatan logistik kontainer Margomulyo-Tanjung Perak, serta pemantauan kualitas udara perkotaan.',
        hotspots: [
          {
            name: 'Bantaran Kali Lamong (Pakal/Benowo)',
            desc: 'Daerah aliran sungai rawan banjir kiriman musiman merendam permukiman barat.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Bundaran Waru - A. Yani',
            desc: 'Gerbang utama mobilitas aglomerasi Surabaya-Sidoarjo berfrekuensi laka padat.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Pesisir Kenjeran & Selat Madura',
            desc: 'Dinamika cuaca maritim perairan pesisir dan pasang surut air laut.',
            icon: Waves,
            color: 'text-cyan-400',
          },
          {
            name: 'Arteri Margomulyo - Tanjung Perak',
            desc: 'Perlintasan angkutan peti kemas, kontainer, dan truk logistik pelabuhan.',
            icon: Car,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: 95,
          aqiLabel: 'Sedang (Moderate)',
          weather: 'Cerah Berawan',
          temp: 31.8,
          rain: 0.8,
        },
        recommendations: [
          'Normalisasi tanggul dan kolam retensi di hulu-hilir Kali Lamong.',
          'Penataan lajur khusus angkutan berat dan manajemen batas kecepatan di koridor Margomulyo.',
          'Sensor radar gelombang cuaca maritim terintegrasi BMKG Tanjung Perak.',
          'Penambahan stasiun pemantau kualitas udara otomatis (SPKU) di simpul komuter.',
        ],
      };
    }

    if (isBalikpapan) {
      return {
        name: 'Kota Balikpapan',
        riskScore: 76,
        riskLevel: 'HIGH',
        summary:
          'Kota Balikpapan sebagai gerbang utama IKN dan sentra industri migas nasional memiliki konsentrasi risiko pada turunan curam Muara Rapak, keandalan proteksi industri Kilang Pertamina RU V, genangan drainase DAS Ampal, serta patroli karhutla koridor Samboja.',
        hotspots: [
          {
            name: 'Simpang Muara Rapak (Turunan Tajam)',
            desc: 'Turunan curam Jl. Soekarno-Hatta dengan riwayat kegagalan pengereman truk kontainer & tronton.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Kilang Minyak Pertamina RU V',
            desc: 'Objek vital nasional dengan sistem proteksi kebakaran dan HSSE industri migas ketat.',
            icon: Flame,
            color: 'text-amber-400',
          },
          {
            name: 'Arteri MT Haryono & Kawasan Beller',
            desc: 'Antrean genangan air limpasan DAS Ampal saat hujan lebat merendam badan jalan utama.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Koridor Balikpapan Timur - Samboja',
            desc: 'Titik anomali termal vegetasi semak kering terpantau sensor satelit NASA VIIRS.',
            icon: Flame,
            color: 'text-orange-400',
          },
        ],
        environment: {
          aqi: 72,
          aqiLabel: 'Baik / Sedang',
          weather: 'Cerah Berawan Tropis',
          temp: 31.2,
          rain: 1.5,
        },
        recommendations: [
          'Rekayasa jalur penyelamat rem blong (emergency escape ramp) dan flyover Muara Rapak.',
          'Sistem deteksi dini gas & pemadaman otomatis terintegrasi tim HSSE kilang Pertamina.',
          'Normalisasi saluran primer DAS Ampal dan penataan kolam retensi pengendali banjir.',
          'Satgas patroli darat gabungan Manggala Agni pencegah karhutla di koridor penyangga IKN.',
        ],
      };
    }

    if (isBanten) {
      return {
        name: 'Provinsi Banten',
        riskScore: 82,
        riskLevel: 'CRITICAL',
        summary:
          'Provinsi Banten sebagai gerbang barat Pulau Jawa memiliki profil risiko tinggi terhadap aktivitas seismik selatan (Sesar Bayah & zona subduksi Selat Sunda), banjir luapan DAS Sungai Cibanten Kota Serang, antrean logistik arteri Pelabuhan Merak Cilegon, dan deteksi titik panas di pesisir Pandeglang.',
        hotspots: [
          {
            name: 'Zona Megathrust & Sesar Bayah Selatan',
            desc: 'Aktivitas lempeng tektonik Samudra Hindia dengan gempa dangkal M 5.0 - 5.6.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'DAS Sungai Cibanten & Kota Serang',
            desc: 'Kawasan permukiman Kasemen dan hilir sungai rentan luapan limpasan hulu.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Arteri Pelabuhan Penyeberangan Merak (Cilegon)',
            desc: 'Antrean kendaraan ekspedisi dan truk angkutan barang lintas pulau Jawa-Sumatera.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Pesisir Pandeglang & TN Ujung Kulon',
            desc: 'Deteksi satelit FIRMS pada vegetasi kering pesisir selatan penyangga kawasan lindung.',
            icon: Flame,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: 88,
          aqiLabel: 'Sedang (Moderate)',
          weather: 'Hujan Sedang / Lembap',
          temp: 29.4,
          rain: 3.8,
        },
        recommendations: [
          'Penguatan jaringan sensor gempa & sirine tsunami InaTEWS di pesisir Bayah dan Pandeglang.',
          'Normalisasi sungai Cibanten dan optimalisasi pintu pelimpah Bendungan Sindangheula.',
          'Delaying system logistik rest area KM 43 & KM 68 Tol Tangerang-Merak.',
          'Patroli terpadu satelit FIRMS dan brigade damkar hutan di zona pesisir konservasi.',
        ],
      };
    }

    if (isAceh) {
      return {
        name: regionQuery.includes('banda aceh') ? 'Kota Banda Aceh' : 'Provinsi Aceh',
        riskScore: 79,
        riskLevel: 'HIGH',
        summary:
          'Wilayah Aceh memiliki karakteristik geomorfologi dan kebencanaan unik: lintasan Sesar Besar Sumatera (Great Sumatran Fault segmen Seulimeum & Aceh), potensi banjir luapan Daerah Aliran Sungai (DAS) Krueng Aceh, titik api gambut di pesisir barat, serta kerentanan cuaca maritim Selat Malaka.',
        hotspots: [
          {
            name: 'DAS Krueng Aceh & Lueng Bata',
            desc: 'Banjir luapan limpasan hulu Jantho menggenangi kawasan pemukiman dataran rendah.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Sesar Seulimeum & Aceh Besar',
            desc: 'Zona sesar aktif darat dengan aktivitas kegempaan tektonik dangkal M 4.8 - 5.4.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'Arteri Lintas Barat Km 42 Gunung Kulu',
            desc: 'Titik rawan laka lantas dan longsor tebing di tanjakan tikungan curam Lhoong.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Lahan Gambut Suak Puntong (Nagan Raya)',
            desc: 'Deteksi titik anomali termal sensor satelit NASA VIIRS pada lapisan tanah gambut.',
            icon: Flame,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: 42,
          aqiLabel: 'Baik (Good / Bersih)',
          weather: 'Hujan Ringan Tropis',
          temp: 28.6,
          rain: 4.2,
        },
        recommendations: [
          'Optimalisasi sistem pompanisasi dan polder tanggul pengendali banjir DAS Krueng Aceh.',
          'Pemeliharaan instrumen seismometer BMKG & edukasi simulasi evakuasi mandiri gempa sesar darat.',
          'Pemasangan rambu kejut, cermin tikungan, dan guardrail pengaman di tanjakan Gunung Kulu Km 42.',
          'Sekat kanal (canal blocking) dan patroli terpadu Manggala Agni di kawasan gambut Suak Puntong.',
        ],
      };
    }

    if (isBandung) {
      return {
        name: bandungProfile?.name || 'Bandung Raya (Kota & Kab. Bandung)',
        riskScore: bandungProfile?.riskScore || 78,
        riskLevel: bandungProfile?.riskLevel || 'HIGH',
        summary:
          bandungProfile?.summary ||
          'Kawasan Cekungan Bandung memiliki kerentanan multi-ancaman: banjir musiman di bantaran Sungai Citarum (Dayeuhkolot/Baleendah), kerawanan kecelakaan di ruas Tol Cipularang & arteri utama, potensi seismik aktif dari jalur Sesar Lembang & Sesar Garsela, serta fluktuasi indeks kualitas udara urban.',
        hotspots: [
          {
            name: 'Dayeuhkolot & Baleendah',
            desc: 'Banjir kronis luapan Sungai Citarum, ketinggian air hingga 120 cm merendam ribuan KK.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Tol Cipularang KM 90 - 100',
            desc: 'Zona turunan tajam rawan tabrakan beruntun dan rem blong truk muatan berat.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Zona Sesar Garsela & Lembang',
            desc: 'Riwayat gempa darat dangkal M 5.0 di Kertasari/Pangalengan merusak ribuan bangunan.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'Arteri Soekarno-Hatta & Gedebage',
            desc: 'Kerap terjadi kecelakaan lantas di persimpangan jalan dan genangan air cileuncang.',
            icon: Waves,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: bandungProfile?.environmentalStatus?.aqi || 68,
          aqiLabel: bandungProfile?.environmentalStatus?.aqiCategory || 'Sedang',
          weather: bandungProfile?.environmentalStatus?.weather || 'Berawan / Hujan Ringan',
          temp: bandungProfile?.environmentalStatus?.temperature || 24.2,
          rain: bandungProfile?.environmentalStatus?.precipitation || 2.4,
        },
        recommendations: [
          'Pengerukan sedimentasi kolam retensi Cieunteung & Danau Retensi Andir.',
          'Sosialisasi mitigasi gempa dan perkuatan struktur bangunan di sepanjang buffer Sesar Lembang.',
          'Penerapan rumble strip aktif & emergency escape ramp di turunan Tol Cipularang.',
          'Modernisasi sistem interlocking persinyalan kereta api di seluruh koridor jalur ganda.',
        ],
      };
    }

    if (isSamarinda) {
      return {
        name: 'Kota Samarinda',
        riskScore: 75,
        riskLevel: 'HIGH',
        summary:
          'Kota Samarinda sebagai ibu kota Kalimantan Timur menghadapi kerentanan hidrometeorologi banjir luapan Sungai Mahakam, kerawanan lalu lintas di simpul jembatan Mahakam I & IV, serta anomali titik panas karhutla perbukitan Palaran.',
        hotspots: [
          {
            name: 'DAS Sungai Mahakam & Loa Janan',
            desc: 'Limpasan air pasang sungai Mahakam dan hujan intensitas tinggi merendam permukiman tepian sungai.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Jembatan Mahakam I & IV',
            desc: 'Jalur penghubung Samarinda Seberang dan Kota dengan volume kendaraan tinggi dan risiko insiden.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Kecamatan Palaran & Sambutan',
            desc: 'Area perbukitan dan semak belukar kering terpantau anomali suhu termal sensor satelit NASA.',
            icon: Flame,
            color: 'text-amber-400',
          },
          {
            name: 'Koridor Antasari - Juanda',
            desc: 'Cekungan jalan perkotaan dengan kapasitas drainase terbatas saat curah hujan lebat.',
            icon: Waves,
            color: 'text-cyan-400',
          },
        ],
        environment: {
          aqi: 64,
          aqiLabel: 'Baik / Sedang',
          weather: 'Hujan Lokal / Lembap',
          temp: 31.0,
          rain: 3.1,
        },
        recommendations: [
          'Optimalisasi pengerukan sedimentasi Sungai Mahakam dan anak sungai DAS Karang Mumus.',
          'Pemasangan rambu peringatan kecepatan dan pemeliharaan struktur bentang Jembatan Mahakam.',
          'Patroli terpadu satgas karhutla darat gabungan Manggala Agni di zona perbukitan Palaran.',
          'Modernisasi pompa pengendali banjir di 6 titik cekungan rawan genangan perkotaan.',
        ],
      };
    }

    if (isMakassar) {
      return {
        name: 'Kota Makassar',
        riskScore: 73,
        riskLevel: 'HIGH',
        summary:
          'Kota Makassar sebagai pintu gerbang Indonesia Timur memprioritaskan mitigasi luapan banjir DAS Sungai Tallo, manajemen kecepatan bebas hambatan Tol Reformasi, dinamika cuaca maritim Pantai Losari, serta arus lalu lintas Trans-Sulawesi.',
        hotspots: [
          {
            name: 'DAS Sungai Tallo & Manggala',
            desc: 'Dataran rendah di sekitar bantaran Sungai Tallo dan perumahan Kodam III rawan banjir.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Jalan Tol Reformasi & Ir Sutami',
            desc: 'Akses logistik utama Pelabuhan Paotere - Bandara Sultan Hasanuddin dengan kecepatan tinggi.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Pesisir Pantai Losari & Makassar Barat',
            desc: 'Fluktuasi pasang gelombang Selat Makassar dan angin barat pesisir perkotaan.',
            icon: Waves,
            color: 'text-cyan-400',
          },
          {
            name: 'Arteri Perintis Kemerdekaan - Baddoka',
            desc: 'Jalur arteri lintas Trans-Sulawesi dengan volume bus antarkota dan angkutan logistik padat.',
            icon: Car,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: 58,
          aqiLabel: 'Baik (Good)',
          weather: 'Cerah Berawan Tropis',
          temp: 31.4,
          rain: 1.2,
        },
        recommendations: [
          'Peninggian tanggul dan pengoperasian kolam retensi Nipa-Nipa pengendali DAS Tallo.',
          'Rekayasa lajur pembatas kecepatan dan pemasangan kamera ETLE di ruas Tol Reformasi.',
          'Sistem pemantauan dini gelombang maritim dan kesiapsiagaan nelayan pesisir Losari.',
          'Penataan traffic management di persimpangan padat rute komuter Perintis Kemerdekaan.',
        ],
      };
    }

    if (isMedan) {
      return {
        name: 'Kota Medan',
        riskScore: 79,
        riskLevel: 'HIGH',
        summary:
          'Kota Medan sebagai metropolitan terbesar Pulau Sumatera memprioritaskan pengendalian banjir luapan DAS Sungai Deli dan Babura, keselamatan koridor truk peti kemas Tol Belmera, serta penataan kawasan industri pesisir Belawan.',
        hotspots: [
          {
            name: 'Bantaran Sungai Deli & Babura',
            desc: 'Banjir kiriman dari hulu Sibolangit dan Berastagi merendam kawasan permukiman Kampung Aur.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Tol Belmera (Belawan - Tanjung Morawa)',
            desc: 'Arus truk peti kemas dan kontainer pelabuhan Belawan dengan riwayat insiden laka.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Kawasan Industri Belawan & Pesisir',
            desc: 'Kawasan maritim dan pergudangan industri dengan dinamika pasang rob serta emisi.',
            icon: Wind,
            color: 'text-teal-400',
          },
          {
            name: 'Arteri Gatot Subroto - Pinang Baris',
            desc: 'Koridor komuter penghubung Medan - Binjai dengan intensitas lalu lintas tinggi.',
            icon: Car,
            color: 'text-amber-400',
          },
        ],
        environment: {
          aqi: 88,
          aqiLabel: 'Sedang (Moderate)',
          weather: 'Hujan Ringan / Berawan',
          temp: 29.8,
          rain: 2.7,
        },
        recommendations: [
          'Normalisasi terpadu dan pembangunan waduk pengendali banjir hulu DAS Sungai Deli.',
          'Penegakan pembatasan tonase muatan truk kontainer dan patroli laka di Tol Belmera.',
          'Optimalisasi pintu polder dan pompa air pengendali pasang rob di pesisir Medan Belawan.',
          'Pengawasan stasiun pemantau mutu udara otomatis di zona industri dan simpul komuter.',
        ],
      };
    }

    if (isSemarang) {
      return {
        name: 'Kota Semarang',
        riskScore: 81,
        riskLevel: 'CRITICAL',
        summary:
          'Kota Semarang mengintegrasikan penanganan banjir rob pesisir Pantura Kaligawe, pencegahan kecelakaan rem blong turunan curam Tol Krapyak-Jatingaleh, dan pemantauan pasang laut Pelabuhan Tanjung Emas.',
        hotspots: [
          {
            name: 'Kawasan Kaligawe & Genuk (Jalur Pantura)',
            desc: 'Kombinasi pasang air laut rob Laut Jawa dan curah hujan merendam jalur nasional Pantura.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Tol Semarang (Krapyak - Jatingaleh)',
            desc: 'Tanjakan dan turunan terjal Gombel dengan risiko kecelakaan angkutan berat.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'Pelabuhan Tanjung Emas & Tambaklorok',
            desc: 'Tanggul pesisir utara dan kawasan dermaga peti kemas terhadap gelombang pasang.',
            icon: Waves,
            color: 'text-cyan-400',
          },
          {
            name: 'DAS Sungai Banjir Kanal Barat & Timur',
            desc: 'Debit air kiriman dari wilayah hulu Ungaran saat curah hujan lebat.',
            icon: Waves,
            color: 'text-blue-500',
          },
        ],
        environment: {
          aqi: 92,
          aqiLabel: 'Sedang (Moderate)',
          weather: 'Cerah Berawan / Angin Laut',
          temp: 32.2,
          rain: 1.1,
        },
        recommendations: [
          'Percepatan tanggul laut terpadu Tol Semarang-Demak pengendali rob Kaligawe.',
          'Pemasangan jalur penyelamat darurat (escape ramp) di turunan Jatingaleh.',
          'Peninggian parapet tanggul pengaman dermaga Pelabuhan Tanjung Emas.',
          'Optimalisasi pompa polder Banjir Kanal Timur dan sistem drainase perkotaan.',
        ],
      };
    }

    if (isYogyakarta) {
      return {
        name: 'Kota Yogyakarta',
        riskScore: 77,
        riskLevel: 'HIGH',
        summary:
          'Kawasan D.I. Yogyakarta memiliki karakter multi-risiko geologis aktif: erupsi dan lahar hujan Gunung Merapi di utara, patahan aktif seismik Sesar Opak di selatan, serta rekayasa keselamatan komuter persimpangan Ring Road.',
        hotspots: [
          {
            name: 'Lereng Gunung Merapi (KRB III Sleman)',
            desc: 'Zona bahaya Merapi dengan pemantauan kubah lava, awan panas, dan banjir lahar dingin di hulu kali.',
            icon: Flame,
            color: 'text-orange-400',
          },
          {
            name: 'Sesar Aktif Opak (Bantul - Prambanan)',
            desc: 'Patahan kerak bumi aktif dengan riwayat gempa tektonik dangkal merusak.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'Jalur Ring Road & Simpang Jombor',
            desc: 'Persimpangan strategis antarkota Yogyakarta-Semarang-Solo dengan arus mobilitas padat.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'DAS Kali Code & Winongo',
            desc: 'Sungai yang membelah pusat kota Yogyakarta rawan luapan material lahar hujan.',
            icon: Waves,
            color: 'text-blue-400',
          },
        ],
        environment: {
          aqi: 62,
          aqiLabel: 'Baik / Sedang',
          weather: 'Cerah Berawan',
          temp: 28.5,
          rain: 1.8,
        },
        recommendations: [
          'Penguatan sistem deteksi dini EWS lahar hujan dan seismograf Gunung Merapi.',
          'Simulasi rutin mitigasi kebencanaan gempa tektonik di koridor buffer Sesar Opak.',
          'Manajemen rekayasa lalin terpadu CCTV Dishub di jalur persimpangan Ring Road.',
          'Penataan sabo dam di hulu kali penahan material sedimen letusan Merapi.',
        ],
      };
    }

    if (isDenpasar) {
      return {
        name: 'Kota Denpasar',
        riskScore: 70,
        riskLevel: 'MEDIUM',
        summary:
          'Kota Denpasar dan kawasan pariwisata Sarbagita memprioritaskan kesiapsiagaan seismik megathrust selatan Bali, mitigasi genangan drainase Tukad Badung, dan keselamatan mobilitas koridor bypass.',
        hotspots: [
          {
            name: 'Busur Subduksi Lempeng Selatan Bali',
            desc: 'Zona megathrust selatan Bali dengan gempa tektonik berkala di Samudra Hindia.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'Arteri Sunset Road & Bypass Ngurah Rai',
            desc: 'Koridor komuter pariwisata berintensitas tinggi dengan titik pertemuan lalu lintas.',
            icon: Car,
            color: 'text-rose-400',
          },
          {
            name: 'DAS Tukad Badung & Pemogan',
            desc: 'Limpasan air permukaan dan drainase perkotaan Denpasar saat hujan berdurasi panjang.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Pesisir Sanur & Tanjung Benoa',
            desc: 'Kawasan aktivitas wisata bahari dan dermaga penyeberangan antarpulau.',
            icon: Waves,
            color: 'text-cyan-400',
          },
        ],
        environment: {
          aqi: 48,
          aqiLabel: 'Sangat Baik (Good)',
          weather: 'Cerah Berawan Tropis',
          temp: 31.0,
          rain: 0.5,
        },
        recommendations: [
          'Penguatan jaringan sirine tsunami InaTEWS di sepanjang garis pantai selatan.',
          'Normalisasi drainase primer dan pembangunan kolam retensi Tukad Badung.',
          'Penyediaan jalur evakuasi bencana terintegrasi di seluruh kawasan destinasi wisata.',
          'Rekayasa jalur penyeberangan aman dan penataan rambu di koridor bypass arteri.',
        ],
      };
    }

    if (isNational) {
      return {
        name: 'Pantauan Nasional Indonesia',
        riskScore: 76,
        riskLevel: 'HIGH',
        summary:
          'Sistem Terpadu Intelijen Keselamatan Wilayah Republik Indonesia memantau multi-hazard geologis aktif (gempa subduksi megathrust, erupsi vulkanik busur cincin api), hidrometeorologi (banjir musiman, cuaca ekstrem tropis), serta karhutla satelit FIRMS lintas 38 provinsi.',
        hotspots: [
          {
            name: 'Busur Megathrust Sunda & Pasifik',
            desc: 'Aktivitas seismik subduksi lempeng Indo-Australia, Eurasia, dan Pasifik.',
            icon: Activity,
            color: 'text-purple-400',
          },
          {
            name: 'Jalur Pantura & DAS Sungai Utama Jawa',
            desc: 'Kerawanan banjir rob pesisir dan luapan limpasan sungai besar antarkota.',
            icon: Waves,
            color: 'text-blue-400',
          },
          {
            name: 'Koridor Penyangga IKN & Kalimantan',
            desc: 'Pantauan anomali suhu termal vegetasi dan proteksi objek vital industri migas.',
            icon: Flame,
            color: 'text-amber-400',
          },
          {
            name: 'Jaringan Tol Trans-Jawa & Trans-Sumatera',
            desc: 'Koridor logistik nasional berkecepatan tinggi dengan pemantauan blindspot Korlantas.',
            icon: Car,
            color: 'text-rose-400',
          },
        ],
        environment: {
          aqi: 74,
          aqiLabel: 'Sedang (Moderate)',
          weather: 'Dinamika Tropis Maritim',
          temp: 30.2,
          rain: 2.1,
        },
        recommendations: [
          'Integrasi multi-layer sensor real-time BMKG, BNPB DIBI, NASA FIRMS, dan CCTV Korlantas.',
          'Standarisasi sistem peringatan dini (EWS) bencana geologis dan hidrometeorologi daerah.',
          'Peningkatan kesiapsiagaan logistik evakuasi dan respon cepat BPBD di seluruh provinsi.',
          'Manajemen keselamatan infrastruktur transportasi publik dan angkutan logistik antarpulau.',
        ],
      };
    }

    // Dynamic generator for ANY OTHER Indonesian City/Regency
    const provName = locInfo?.province || 'Indonesia';
    return {
      name: displayName,
      riskScore: 72,
      riskLevel: 'HIGH',
      summary: `Profil pemantauan keselamatan dan mitigasi risiko komprehensif untuk wilayah ${displayName} (${provName}). Mengintegrasikan sensor cuaca BMKG, deteksi satelit FIRMS, serta sistem penanggulangan bencana BPBD ${provName}.`,
      hotspots: [
        {
          name: `Koridor Arteri Utama ${displayName}`,
          desc: `Jalur mobilitas komuter utama dengan intensitas kendaraan tinggi dan pemantauan CCTV Korlantas.`,
          icon: Car,
          color: 'text-rose-400',
        },
        {
          name: `Daerah Aliran Sungai & Drainase ${displayName}`,
          desc: `Kawasan dataran rendah dan tangkapan air yang rentan luapan limpasan saat curah hujan ekstrem.`,
          icon: Waves,
          color: 'text-blue-400',
        },
        {
          name: `Zona Penyangga & Vegetasi ${displayName}`,
          desc: `Zona hijau dan lahan vegetasi terbuka dalam pantauan anomali termal satelit NASA FIRMS.`,
          icon: Flame,
          color: 'text-amber-400',
        },
        {
          name: `Pusat Siaga Bencana BPBD ${provName}`,
          desc: `Pusat komando logistik, shelter darurat, dan koordinasi evakuasi kebencanaan terpadu wilayah ${provName}.`,
          icon: Activity,
          color: 'text-purple-400',
        },
      ],
      environment: {
        aqi: 65,
        aqiLabel: 'Baik / Sedang',
        weather: 'Cerah Berawan Tropis',
        temp: 30.0,
        rain: 1.5,
      },
      recommendations: [
        `Optimalisasi sistem drainase primer dan normalisasi sungai pengendali genangan di ${displayName}.`,
        `Pemasangan rambu peringatan keselamatan dan rekayasa lalin di koridor arteri komuter.`,
        `Penguatan koordinasi posko siaga bencana dan jejaring relawan tanggap darurat BPBD ${provName}.`,
        `Pemantauan berkala indeks mutu udara dan kesiapsiagaan cuaca ekstrem BMKG setempat.`,
      ],
    };
  }, [
    isNational,
    isJakarta,
    isSurabaya,
    isBandung,
    isBalikpapan,
    isBanten,
    isSamarinda,
    isMakassar,
    isMedan,
    isSemarang,
    isYogyakarta,
    isDenpasar,
    displayName,
    locInfo,
    bandungProfile,
  ]);

  // Lock body scroll when presentation is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
        setTimerProgress(0);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
        setTimerProgress(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto rotation timer
  useEffect(() => {
    if (!isAutoRotate) return;

    const intervalMs = 100;
    const step = 100 / ((SLIDE_DURATION_SEC * 1000) / intervalMs);

    const timer = setInterval(() => {
      setTimerProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((s) => (s + 1) % TOTAL_SLIDES);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoRotate, currentSlide]);

  const slideTitles = [
    `1. Situasi Terkini (${displayName})`,
    `2. Profil & Dossier Risiko (${displayName})`,
    `3. Visual Analitik & Grafik Data`,
    `4. Rekap Insiden Terverifikasi`,
    `5. Rekomendasi Kebijakan & Mitigasi`,
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-950 text-white flex flex-col h-screen max-h-screen overflow-hidden select-none animate-fadeIn">
      {/* Top Webinar Presentation Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider uppercase text-indigo-400">
                Mode Presentasi Webinar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>Fokus: {displayName}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1 hidden sm:flex">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Live Broadcast
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Safety Intelligence & Monitoring Platform — Screen Share & Projector Optimized
            </p>
          </div>
        </div>

        {/* Slide Indicators & Auto-Rotate Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800/80 px-2.5 py-1 rounded-xl border border-gray-700">
            <button
              onClick={() => {
                setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
                setTimerProgress(0);
              }}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-white px-2">
              Slide {currentSlide + 1} / {TOTAL_SLIDES}
            </span>

            <button
              onClick={() => {
                setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
                setTimerProgress(0);
              }}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Slide Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-3.5 w-px bg-gray-700 mx-0.5" />

            <button
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className={`p-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                isAutoRotate ? 'text-emerald-400' : 'text-gray-400'
              }`}
              title={isAutoRotate ? 'Jeda Rotasi Otomatis' : 'Mulai Rotasi Otomatis'}
            >
              {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">
                {isAutoRotate ? `${SLIDE_DURATION_SEC}s` : 'Paused'}
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Keluar (ESC)</span>
          </button>
        </div>
      </div>

      {/* Auto-rotation Progress Line */}
      {isAutoRotate && (
        <div className="w-full bg-gray-800 h-1 shrink-0">
          <div
            className="bg-indigo-500 h-1 transition-all duration-100 ease-linear"
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      )}

      {/* Slide Navigation Tabs */}
      <div className="bg-gray-900/60 border-b border-gray-800/80 px-6 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {slideTitles.map((title, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx);
              setTimerProgress(0);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              currentSlide === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Main Slide Content Area (strictly non-scrolling presentation viewport) */}
      <div className="flex-1 px-6 py-4 md:px-8 md:py-4 max-w-7xl mx-auto w-full flex flex-col justify-center overflow-hidden">
        {/* SLIDE 1: Situational Awareness & Live Summary */}
        {currentSlide === 0 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="border-l-4 border-indigo-500 pl-3.5 space-y-0.5">
              <span className="text-[11px] uppercase font-extrabold text-indigo-400 tracking-widest flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Situational Awareness — {displayName}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Ringkasan Pemantauan & Status Terkini: {displayName}
              </h2>
              <p className="text-xs text-gray-300 max-w-3xl line-clamp-2">
                Agregasi sensor real-time BMKG, satelit NASA FIRMS, laporan kebencanaan BNPB, dan data lalu lintas terverifikasi untuk wilayah <strong>{displayName}</strong>.
              </p>
            </div>

            {/* KPI Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">
                  Total Kejadian Terdata
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                  {regionEvents.length}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Dalam cakupan {displayName}
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl">
                <span className="text-[11px] font-bold uppercase text-red-400 block">
                  Insiden Kritis (Level 4)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-red-400 mt-1 block">
                  {criticalEvents.length}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Memerlukan atensi darurat
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl">
                <span className="text-[11px] font-bold uppercase text-amber-400 block">
                  Skor Indeks Risiko
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 block">
                  {profileData.riskScore}
                  <span className="text-xs font-normal text-gray-400">/100</span>
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Status: <strong>{profileData.riskLevel}</strong>
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl">
                <span className="text-[11px] font-bold uppercase text-teal-400 block">
                  Kualitas Udara
                </span>
                <span className="text-2xl sm:text-3xl font-black text-teal-300 mt-1 block">
                  AQI {profileData.environment.aqi}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {profileData.environment.aqiLabel}
                </p>
              </div>
            </div>

            {/* Critical Live Ticker for this region */}
            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Insiden Prioritas di Wilayah {displayName}:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {regionEvents.slice(0, 4).map((e) => (
                  <div key={e.id} className="p-2.5 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-start gap-2.5">
                    <span className="p-1.5 rounded-md bg-red-500/20 text-red-400 mt-0.5 shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-red-400 uppercase bg-red-950/60 px-1 py-0.5 rounded border border-red-800">
                          {e.severity}
                        </span>
                        <span className="text-[10px] text-gray-400">{e.sourceName.split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-500 ml-auto">
                          {new Date(e.occurredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{e.title}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{e.locationName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: Regional Memory & City Dossier */}
        {currentSlide === 1 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="border-l-4 border-rose-500 pl-3.5 space-y-0.5">
              <span className="text-[11px] uppercase font-extrabold text-rose-400 tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Regional Risk Dossier — {displayName}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Profil & Analisis Kerentanan Risiko: {profileData.name}
              </h2>
              <p className="text-xs text-gray-300 max-w-3xl line-clamp-2">
                {profileData.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-gray-900 border border-gray-800 p-3.5 sm:p-4 rounded-xl md:col-span-2 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Titik Rawan Utama (Risk Hotspots) {displayName}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Indeks: {profileData.riskScore}/100 ({profileData.riskLevel})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {profileData.hotspots.map((spot, idx) => {
                    const Icon = spot.icon;
                    return (
                      <div key={idx} className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-700/50 space-y-0.5">
                        <span className={`font-bold ${spot.color} flex items-center gap-1.5 text-xs`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{spot.name}</span>
                        </span>
                        <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2">
                          {spot.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Environmental Sensor Status */}
              <div className="bg-gray-900 border border-gray-800 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                    Kondisi Sensor Terkini ({displayName})
                  </span>
                  <div className="mt-2 space-y-1.5">
                    <div className="p-2 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Kualitas Udara:</span>
                      <span className="font-bold text-teal-300">
                        AQI {profileData.environment.aqi} ({profileData.environment.aqiLabel})
                      </span>
                    </div>

                    <div className="p-2 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Suhu & Cuaca:</span>
                      <span className="font-bold text-white">
                        {profileData.environment.temp}°C ({profileData.environment.weather})
                      </span>
                    </div>

                    <div className="p-2 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Curah Hujan:</span>
                      <span className="font-bold text-blue-400">
                        {profileData.environment.rain} mm/jam
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono text-center pt-2 border-t border-gray-800">
                  Data Sensor: BMKG Radar & Open-Meteo
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: Visual Analytics & Charts */}
        {currentSlide === 2 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="border-l-4 border-blue-500 pl-3.5 space-y-0.5">
              <span className="text-[11px] uppercase font-extrabold text-blue-400 tracking-widest flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual Analytics — {displayName}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Distribusi & Visualisasi Risiko di {displayName}
              </h2>
              <p className="text-xs text-gray-300 max-w-3xl line-clamp-2">
                Komposisi kategori bencana dan proporsi tingkat keparahan yang tercatat dalam data intelijen keselamatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Chart 1: Bar Chart Category Distribution */}
              <div className="bg-gray-900 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl space-y-1.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Distribusi Kejadian Berdasarkan Kategori</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Total: {regionEvents.length} Data
                  </span>
                </div>

                <div className="h-44 sm:h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDistribution.slice(0, 6)} margin={{ top: 8, right: 8, left: -24, bottom: 15 }}>
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#9CA3AF" fontSize={10} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                        {categoryDistribution.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Severity Distribution Pie Chart */}
              <div className="bg-gray-900 border border-gray-800 p-3 sm:p-3.5 rounded-xl shadow-xl space-y-1.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PieIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Proporsi Tingkat Keparahan (Severity)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    4 Tingkatan Level
                  </span>
                </div>

                <div className="h-36 sm:h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={62}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {severityDistribution.map((entry, index) => (
                          <Cell key={`sev-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-gray-800">
                  {severityDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}:</span>
                      <strong className="text-white ml-auto">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Verified Incident Dossier */}
        {currentSlide === 3 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="border-l-4 border-amber-500 pl-3.5 space-y-0.5">
              <span className="text-[11px] uppercase font-extrabold text-amber-400 tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Kronologi Insiden — {displayName}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Rekap Insiden & Bukti Lapangan Terverifikasi: {displayName}
              </h2>
              <p className="text-xs text-gray-300 max-w-3xl line-clamp-2">
                Catatan kronologis insiden keselamatan yang terverifikasi resmi oleh otoritas kebencanaan, kepolisian, dan satelit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {regionEvents.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        e.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : e.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}
                    >
                      {e.severity}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(e.occurredAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                    {e.title}
                  </h4>
                  <p className="text-[11px] text-gray-300 line-clamp-2">
                    {e.description}
                  </p>

                  <div className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="truncate">📍 {e.locationName}</span>
                    <span className="text-blue-400 font-medium shrink-0 ml-2">Sumber: {e.sourceName.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 5: Strategic Policy & Mitigation Recommendations */}
        {currentSlide === 4 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="border-l-4 border-emerald-500 pl-3.5 space-y-0.5">
              <span className="text-[11px] uppercase font-extrabold text-emerald-400 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rekomendasi Kebijakan — {displayName}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Rekomendasi Strategis & Langkah Mitigasi: {displayName}
              </h2>
              <p className="text-xs text-gray-300 max-w-3xl line-clamp-2">
                Sintesis rekomendasi kebijakan pencegahan dan mitigasi risiko operasional berbasis data intelijen keselamatan terpadu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profileData.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">
                      Pilar Mitigasi #{idx + 1}
                    </h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      {rec}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls & Instructions */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-2.5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Navigasi: <strong>Panah Kiri/Kanan</strong> atau <strong>Spasi</strong></span>
          <span>•</span>
          <span>Tutup: <strong>ESC</strong></span>
        </div>
        <div className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5">
          <span>Safety Intelligence Dashboard ID</span>
          <span>—</span>
          <span>Presentasi: {displayName}</span>
        </div>
      </div>
    </div>
  );
}
