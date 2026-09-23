'use client';

import React from 'react';
import {
  Activity,
  Waves,
  Mountain,
  Car,
  Flame,
  CloudLightning,
  Wind,
  Factory,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { EventCategory, EventSeverity, TemporalStatus } from '@/types/safety';

interface FilterBarProps {
  selectedCategory: string;
  selectedSeverity: string;
  selectedTemporalStatus: string;
  onSelectCategory: (cat: string) => void;
  onSelectSeverity: (sev: string) => void;
  onSelectTemporalStatus: (status: string) => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

const CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: 'Semua Kategori', value: 'ALL', icon: SlidersHorizontal },
  { label: 'Gempa Bumi', value: 'EARTHQUAKE', icon: Activity },
  { label: 'Banjir & Genangan', value: 'FLOOD', icon: Waves },
  { label: 'Kecelakaan Lalu Lintas', value: 'TRAFFIC_ACCIDENT', icon: Car },
  { label: 'Titik Api (Hotspot)', value: 'FIRE_HOTSPOT', icon: Flame },
  { label: 'Gunung Api', value: 'VOLCANO', icon: Mountain },
  { label: 'Tanah Longsor', value: 'LANDSLIDE', icon: Mountain },
  { label: 'Cuaca Ekstrem', value: 'SEVERE_WEATHER', icon: CloudLightning },
  { label: 'Kualitas Udara', value: 'AIR_POLLUTION', icon: Wind },
  { label: 'Kecelakaan Industri', value: 'INDUSTRIAL_ACCIDENT', icon: Factory },
];

const SEVERITIES: { label: string; value: string; color: string }[] = [
  { label: 'Semua Tingkat', value: 'ALL', color: 'bg-gray-800 text-gray-300' },
  { label: 'Kritis (Lvl 4)', value: 'CRITICAL', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  { label: 'Tinggi (Lvl 3)', value: 'HIGH', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { label: 'Sedang (Lvl 2)', value: 'MEDIUM', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  { label: 'Rendah (Lvl 1)', value: 'LOW', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
];

const TEMPORAL_STATUSES: { label: string; value: string; dotColor: string }[] = [
  { label: 'Semua Status Data', value: 'ALL', dotColor: 'bg-gray-400' },
  { label: 'Realtime (< 1j)', value: 'REALTIME', dotColor: 'bg-emerald-400' },
  { label: 'Near Realtime (Satelit)', value: 'NEAR_REALTIME', dotColor: 'bg-amber-400' },
  { label: 'Historis Terverifikasi', value: 'HISTORICAL', dotColor: 'bg-blue-400' },
  { label: 'Laporan Resmi / Kurasi', value: 'VERIFIED_REPORT', dotColor: 'bg-purple-400' },
];

export default function FilterBar({
  selectedCategory,
  selectedSeverity,
  selectedTemporalStatus,
  onSelectCategory,
  onSelectSeverity,
  onSelectTemporalStatus,
  onResetFilters,
  totalFiltered,
}: FilterBarProps) {
  const isFiltered =
    selectedCategory !== 'ALL' ||
    selectedSeverity !== 'ALL' ||
    selectedTemporalStatus !== 'ALL';

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 space-y-3">
      {/* Category Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Row: Severity & Provenance Data Status & Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mr-1">
            Keparahan:
          </span>
          {SEVERITIES.map((sev) => {
            const isActive = selectedSeverity === sev.value;
            return (
              <button
                key={sev.value}
                onClick={() => onSelectSeverity(sev.value)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                  isActive
                    ? `${sev.color} ring-1 ring-white/30 font-bold`
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {sev.label}
              </button>
            );
          })}
        </div>

        {/* Provenance Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mr-1">
            Status Data:
          </span>
          {TEMPORAL_STATUSES.map((stat) => {
            const isActive = selectedTemporalStatus === stat.value;
            return (
              <button
                key={stat.value}
                onClick={() => onSelectTemporalStatus(stat.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-gray-700 text-white border-blue-500 ring-1 ring-blue-500'
                    : 'bg-gray-800/40 border-gray-700/80 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor}`} />
                <span>{stat.label}</span>
              </button>
            );
          })}

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="ml-2 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-red-400 text-[11px] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
