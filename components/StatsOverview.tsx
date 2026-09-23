'use client';

import React from 'react';
import {
  AlertTriangle,
  Layers,
  MapPin,
  Flame,
  Wind,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalEvents: number;
    activeAlertsCount: number;
    affectedCitiesCount: number;
    severityDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
  onSelectSeverity: (severity: string) => void;
  onSelectCategory: (category: string) => void;
}

export default function StatsOverview({
  stats,
  onSelectSeverity,
  onSelectCategory,
}: StatsOverviewProps) {
  const criticalCount = stats.severityDistribution?.CRITICAL || 0;
  const highCount = stats.severityDistribution?.HIGH || 0;
  const fireHotspots = stats.categoryDistribution?.FIRE_HOTSPOT || 0;
  const trafficIncidents = stats.categoryDistribution?.TRAFFIC_ACCIDENT || 0;
  const floodEvents = stats.categoryDistribution?.FLOOD || 0;
  const quakeEvents = stats.categoryDistribution?.EARTHQUAKE || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Peringatan Kritis / Aktif */}
      <div
        onClick={() => onSelectSeverity('CRITICAL')}
        className="cursor-pointer bg-gradient-to-br from-red-950/40 via-gray-900 to-gray-900 border border-red-900/40 hover:border-red-600/60 p-4 rounded-xl shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Peringatan Kritis
          </span>
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {criticalCount}
          </span>
          <span className="text-xs text-red-300 font-medium">
            Kejadian Level 4
          </span>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          + {highCount} kejadian berstatus level Tinggi (Gempa M5+, Erupsi, Tabrakan Beruntun)
        </p>
      </div>

      {/* Card 2: Total Kejadian Terpantau */}
      <div
        onClick={() => onSelectSeverity('ALL')}
        className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-blue-500/50 p-4 rounded-xl shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Total Kejadian
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {stats.totalEvents}
          </span>
          <span className="text-xs text-blue-300 font-medium">
            Rekam Data Aktif
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
          <span>{quakeEvents} Gempa</span>
          <span>•</span>
          <span>{floodEvents} Banjir</span>
          <span>•</span>
          <span>{trafficIncidents} Laka</span>
        </div>
      </div>

      {/* Card 3: Wilayah Terdampak & Pemantauan Khusus */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Cakupan Spasial
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {stats.affectedCitiesCount}
          </span>
          <span className="text-xs text-emerald-300 font-medium">
            Kabupaten / Kota
          </span>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Fokus wilayah: Cekungan Bandung, Jawa Barat, dan koridor rawan nasional
        </p>
      </div>

      {/* Card 4: Titik Panas & Parameter Lingkungan */}
      <div
        onClick={() => onSelectCategory('FIRE_HOTSPOT')}
        className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-amber-500/50 p-4 rounded-xl shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Deteksi Satelit NRT
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {fireHotspots}
          </span>
          <span className="text-xs text-amber-300 font-medium">
            Titik Panas (FIRMS)
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Activity className="w-3 h-3 text-amber-400" />
          <span>Siklus satelit Terra/Aqua 24 jam</span>
        </div>
      </div>
    </div>
  );
}
