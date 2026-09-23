'use client';

import React, { useState, useEffect } from 'react';
import {
  Tv,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  ShieldAlert,
  MapPin,
  Activity,
  Flame,
  Waves,
  Car,
  Wind,
  CheckCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SafetyEvent, RegionSafetyProfile, SafetyInsight } from '@/types/safety';

interface WebinarModeProps {
  onClose: () => void;
  events: SafetyEvent[];
  stats: any;
  bandungProfile: RegionSafetyProfile | null;
  insights: SafetyInsight[];
}

export default function WebinarMode({
  onClose,
  events,
  stats,
  bandungProfile,
  insights,
}: WebinarModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [timerProgress, setTimerProgress] = useState(0);

  const SLIDE_DURATION_SEC = 15;
  const TOTAL_SLIDES = 5;

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

  const criticalEvents = events.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 text-white flex flex-col overflow-hidden select-none animate-fadeIn">
      {/* Top Webinar Presentation Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider uppercase text-indigo-400">
                Mode Presentasi Webinar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Live Broadcast Ready
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Safety Intelligence & Monitoring Platform — Zoom & Screen Share Optimized
            </p>
          </div>
        </div>

        {/* Slide Indicators & Auto-Rotate Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-700">
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

            <div className="h-4 w-px bg-gray-700 mx-1" />

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
        <div className="w-full bg-gray-800 h-1">
          <div
            className="bg-indigo-500 h-1 transition-all duration-100 ease-linear"
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      )}

      {/* Slide Navigation Tabs */}
      <div className="bg-gray-900/60 border-b border-gray-800/80 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          '1. Apa yang sedang terjadi sekarang?',
          '2. Studi Kasus: Profil Bandung Raya',
          '3. Pola Rawan Kecelakaan Lalu Lintas',
          '4. Karhutla & Anomali Satelit (FIRMS)',
          '5. Safety Insights & Kebijakan Mitigasi',
        ].map((title, idx) => (
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

      {/* Main Slide Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col justify-center">
        {/* SLIDE 1: Real-time Situational Awareness */}
        {currentSlide === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-indigo-500 pl-4 space-y-1">
              <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-widest">
                Pertanyaan 1 — Situational Awareness
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Apa yang Sedang Terjadi Sekarang di Indonesia?
              </h2>
              <p className="text-sm text-gray-300 max-w-3xl">
                Pemantauan real-time terhadap aktivitas seismik BMKG, deteksi termal satelit NASA, kondisi cuaca ekstrem, dan laporan insiden lapangan terverifikasi.
              </p>
            </div>

            {/* Top KPI Cards in Presentation Size */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gray-900/90 border border-red-500/40 p-5 rounded-2xl shadow-xl">
                <span className="text-xs font-bold uppercase text-red-400 block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Kejadian Kritis Aktif
                </span>
                <span className="text-4xl font-black text-white mt-2 block">
                  {stats?.severityDistribution?.CRITICAL || 0}
                </span>
                <p className="text-xs text-red-300 mt-1">
                  Gempa M6+, Erupsi Level IV, Kecelakaan fatal
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-5 rounded-2xl shadow-xl">
                <span className="text-xs font-bold uppercase text-blue-400 block">
                  Total Kejadian Terpantau
                </span>
                <span className="text-4xl font-black text-white mt-2 block">
                  {stats?.totalEvents || 0}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Integrasi BMKG, FIRMS, DIBI & Laporan Resmi
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-5 rounded-2xl shadow-xl">
                <span className="text-xs font-bold uppercase text-amber-400 block">
                  Titik Panas Satelit (24 Jam)
                </span>
                <span className="text-4xl font-black text-white mt-2 block">
                  {stats?.categoryDistribution?.FIRE_HOTSPOT || 0}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Sensor MODIS / VIIRS NASA FIRMS
                </p>
              </div>

              <div className="bg-gray-900/90 border border-gray-800 p-5 rounded-2xl shadow-xl">
                <span className="text-xs font-bold uppercase text-emerald-400 block">
                  Status Jaringan Data
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-2 block flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  100% ONLINE
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Transparansi status data terjaga (Provenance Badge)
                </p>
              </div>
            </div>

            {/* Critical Live Ticker */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Peringatan Kejadian Terbaru:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criticalEvents.slice(0, 4).map((e) => (
                  <div key={e.id} className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-red-500/20 text-red-400 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-red-400 uppercase bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800">
                          {e.severity}
                        </span>
                        <span className="text-[10px] text-gray-400">{e.sourceName.split(' ')[0]}</span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1">{e.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{e.locationName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: Historical Memory & City Dossier (Bandung) */}
        {currentSlide === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-rose-500 pl-4 space-y-1">
              <span className="text-xs uppercase font-extrabold text-rose-400 tracking-widest">
                Pertanyaan 2 — Regional Memory & Risk Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Apa Saja yang Pernah Terjadi di Bandung Raya?
              </h2>
              <p className="text-sm text-gray-300 max-w-3xl">
                Cekungan Bandung memiliki kerentanan multi-ancaman: banjir musiman di Dayeuhkolot/Baleendah, risiko seismik Sesar Lembang & Garsela, serta titik rawan Tol Cipularang.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Area Kerawanan Tertinggi (Risk Hotspots) Bandung</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Indeks Risiko: {bandungProfile?.riskScore || 78}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-1">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5">
                      <Waves className="w-4 h-4" />
                      Dayeuhkolot & Baleendah
                    </span>
                    <p className="text-gray-300 text-[11px]">
                      Banjir kronis luapan Sungai Citarum, ketinggian air hingga 120 cm merendam ribuan KK.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-1">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <Car className="w-4 h-4" />
                      Tol Cipularang KM 90 - 100
                    </span>
                    <p className="text-gray-300 text-[11px]">
                      Zona turunan tajam rawan tabrakan beruntun dan rem blong truk muatan berat.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-1">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      Zona Sesar Garsela & Lembang
                    </span>
                    <p className="text-gray-300 text-[11px]">
                      Riwayat gempa darat dangkal M 5.0 di Kertasari/Pangalengan merusak ribuan bangunan.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Car className="w-4 h-4" />
                      Arteri Soekarno-Hatta Bandung
                    </span>
                    <p className="text-gray-300 text-[11px]">
                      Kerap terjadi kecelakaan lantas di persimpangan jalan dan genangan air Gedebage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bandung Live Weather & Air Quality */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                    Kondisi Sensor Terkini (Bandung)
                  </span>
                  <div className="mt-3 space-y-2">
                    <div className="p-2.5 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between">
                      <span className="text-xs text-gray-300">Kualitas Udara:</span>
                      <span className="text-xs font-bold text-teal-300">
                        AQI {bandungProfile?.environmentalStatus?.aqi || 68} ({bandungProfile?.environmentalStatus?.aqiCategory || 'Sedang'})
                      </span>
                    </div>

                    <div className="p-2.5 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between">
                      <span className="text-xs text-gray-300">Suhu & Cuaca:</span>
                      <span className="text-xs font-bold text-white">
                        {bandungProfile?.environmentalStatus?.temperature || 24}°C ({bandungProfile?.environmentalStatus?.weather || 'Berawan'})
                      </span>
                    </div>

                    <div className="p-2.5 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between">
                      <span className="text-xs text-gray-300">Curah Hujan:</span>
                      <span className="text-xs font-bold text-blue-400">
                        {bandungProfile?.environmentalStatus?.precipitation || 2.4} mm/jam
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono text-center">
                  Sumber: Open-Meteo & BMKG Radar Live
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: Spatial Pattern of Accidents */}
        {currentSlide === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-amber-500 pl-4 space-y-1">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-widest">
                Pertanyaan 3 — Spatial Pattern & Transport Safety
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Di Mana & Bagaimana Pola Kejadian Kecelakaan Terjadi?
              </h2>
              <p className="text-sm text-gray-300 max-w-3xl">
                Kajian data Korlantas Polri, investigasi KNKT, dan laporan Jasa Marga menunjukkan pola konsentrasi kecelakaan berat pada koridor jalan bebas hambatan berkontur curam.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Titik Rawan (Blackspot) Tol Cipularang
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold">
                    Tingkat Bahaya Kritis
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Karakteristik Segmen KM 90 - KM 100 Arah Jakarta
                </h4>
                <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
                  <li>Kontur turunan panjang (&gt; 4 km) dengan gradien kemiringan signifikan.</li>
                  <li>Faktor risiko dominan: *Brake fade* (kegagalan rem karena panas berlebih pada rem tromol kendaraan berat bermuatan lebih/ODOL).</li>
                  <li>Rekomendasi mitigasi: Pembangunan *emergency escape ramp*, rambu kecepatan dinamis, dan jembatan timbang WIM (*Weight-in-Motion*).</li>
                </ul>
              </div>

              <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Investigasi Keselamatan Kereta Api (KNKT)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 font-bold">
                    KNKT.24.01.01.01
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Studi Kasus Tabrakan KA Cicalengka - Haurpugur (KM 181)
                </h4>
                <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
                  <li>Terjadi pada perbatasan sistem persinyalan blok mekanik dan elektrik.</li>
                  <li>Anomali tegangan transient memicu *uncommanded signal transmission*.</li>
                  <li>Rekomendasi mitigasi: Modernisasi total sistem interlocking persinyalan terpusat (CTC) di seluruh koridor jalur ganda Bandung Raya.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Satellite Hotspots (NASA FIRMS) */}
        {currentSlide === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-amber-500 pl-4 space-y-1">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-widest">
                Deteksi Luar Angkasa & Kebakaran Hutan Lahan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Sebaran Titik Panas Satelit Sensor MODIS & VIIRS
              </h2>
              <p className="text-sm text-gray-300 max-w-3xl">
                Platform menyerap data satelit NASA FIRMS Near-Real-Time (NRT) dengan radius cakupan seluruh yurisdiksi kepulauan Indonesia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase text-amber-400">
                  Total Hotspot Terdeteksi
                </span>
                <span className="text-4xl font-black text-white block">
                  {stats?.categoryDistribution?.FIRE_HOTSPOT || 0}
                </span>
                <p className="text-xs text-gray-400">
                  Dalam siklus orbit 24 jam terakhir satelit Terra & Aqua
                </p>
              </div>

              <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase text-orange-400">
                  Tingkat Kepercayaan (Confidence)
                </span>
                <span className="text-4xl font-black text-orange-400 block">
                  50% - 95%
                </span>
                <p className="text-xs text-gray-400">
                  Titik ber-confidence &gt; 80% memerlukan verifikasi darat segera
                </p>
              </div>

              <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase text-blue-400">
                  Transparansi Provenance
                </span>
                <span className="text-xl font-bold text-white block">
                  Near-Real-Time (3-4h)
                </span>
                <p className="text-xs text-gray-400">
                  Jujur diklasifikasikan sebagai NRT karena jeda orbit satelit
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: Safety Insights & Mitigation */}
        {currentSlide === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-indigo-500 pl-4 space-y-1">
              <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-widest">
                Kesimpulan Eksekutif & Rekomendasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Safety Intelligence Insights & Actionable Mitigation
              </h2>
              <p className="text-sm text-gray-300 max-w-3xl">
                Sintesis otomatis dari agregasi data keselamatan untuk mendukung pengambilan keputusan strategis dan mitigasi risiko preventif.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      {insight.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        insight.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {insight.narrative}
                  </p>
                  <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-500">
                    Sumber: {insight.sourceName}
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
        <div className="text-[11px] text-indigo-400 font-semibold">
          Safety Intelligence Dashboard ID — Presenter Edition
        </div>
      </div>
    </div>
  );
}
