'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Check,
  Activity,
  Waves,
  Mountain,
  Car,
  Flame,
  CloudLightning,
  Wind,
  Factory,
  ShieldAlert,
} from 'lucide-react';

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

const CATEGORIES = [
  { label: 'Semua Kategori', value: 'ALL', icon: SlidersHorizontal },
  { label: 'Banjir & Genangan', value: 'FLOOD', icon: Waves },
  { label: 'Kecelakaan Lalu Lintas', value: 'TRAFFIC_ACCIDENT', icon: Car },
  { label: 'Gempa Bumi', value: 'EARTHQUAKE', icon: Activity },
  { label: 'Titik Api (Hotspot)', value: 'FIRE_HOTSPOT', icon: Flame },
  { label: 'Cuaca Ekstrem', value: 'SEVERE_WEATHER', icon: CloudLightning },
  { label: 'Kualitas Udara', value: 'AIR_POLLUTION', icon: Wind },
  { label: 'Gunung Api', value: 'VOLCANO', icon: Mountain },
  { label: 'Tanah Longsor', value: 'LANDSLIDE', icon: Mountain },
  { label: 'Kecelakaan Industri', value: 'INDUSTRIAL_ACCIDENT', icon: Factory },
];

const SEVERITIES = [
  { label: 'Semua Tingkat', value: 'ALL', color: 'bg-gray-400' },
  { label: 'Kritis (Lvl 4)', value: 'CRITICAL', color: 'bg-red-500' },
  { label: 'Tinggi (Lvl 3)', value: 'HIGH', color: 'bg-orange-500' },
  { label: 'Sedang (Lvl 2)', value: 'MEDIUM', color: 'bg-yellow-500' },
  { label: 'Rendah (Lvl 1)', value: 'LOW', color: 'bg-emerald-500' },
];

const TEMPORAL_STATUSES = [
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
  const [openDropdown, setOpenDropdown] = useState<'CATEGORY' | 'SEVERITY' | 'STATUS' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isFiltered =
    selectedCategory !== 'ALL' ||
    selectedSeverity !== 'ALL' ||
    selectedTemporalStatus !== 'ALL';

  const activeCategoryObj = CATEGORIES.find((c) => c.value === selectedCategory) || CATEGORIES[0];
  const activeSeverityObj = SEVERITIES.find((s) => s.value === selectedSeverity) || SEVERITIES[0];
  const activeStatusObj = TEMPORAL_STATUSES.find((s) => s.value === selectedTemporalStatus) || TEMPORAL_STATUSES[0];

  // Quick 4 primary tabs for fastest 1-click access
  const PRIMARY_TABS = [
    { label: 'Semua', value: 'ALL', icon: SlidersHorizontal },
    { label: 'Banjir', value: 'FLOOD', icon: Waves },
    { label: 'Kecelakaan', value: 'TRAFFIC_ACCIDENT', icon: Car },
    { label: 'Gempa', value: 'EARTHQUAKE', icon: Activity },
  ];

  const isOtherCategoryActive = !PRIMARY_TABS.some((t) => t.value === selectedCategory);

  return (
    <div
      ref={containerRef}
      className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs select-none shadow-lg relative z-30"
    >
      {/* Left: Compact Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Tabs for top categories */}
        <div className="flex items-center bg-gray-950/70 p-1 rounded-lg border border-gray-800 shrink-0">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  onSelectCategory(tab.value);
                  setOpenDropdown(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Category Dropdown (Other Categories) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'CATEGORY' ? null : 'CATEGORY')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
              isOtherCategoryActive
                ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-bold'
                : 'bg-gray-800/70 hover:bg-gray-800 border-gray-700/80 text-gray-300'
            }`}
          >
            <span>
              {isOtherCategoryActive ? activeCategoryObj.label : 'Kategori Lainnya'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'CATEGORY' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'CATEGORY' && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 mb-1">
                Pilih Kategori Spesifik
              </div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-800 transition-colors ${
                      isSelected ? 'text-blue-400 font-bold bg-blue-950/30' : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-800 mx-0.5 hidden sm:block" />

        {/* 2. Severity Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'SEVERITY' ? null : 'SEVERITY')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
              selectedSeverity !== 'ALL'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold'
                : 'bg-gray-800/70 hover:bg-gray-800 border-gray-700/80 text-gray-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeSeverityObj.color}`} />
            <span>{selectedSeverity === 'ALL' ? 'Tingkat Keparahan' : activeSeverityObj.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'SEVERITY' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'SEVERITY' && (
            <div className="absolute left-0 top-full mt-1.5 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 mb-1">
                Filter Tingkat Keparahan
              </div>
              {SEVERITIES.map((sev) => {
                const isSelected = selectedSeverity === sev.value;
                return (
                  <button
                    key={sev.value}
                    type="button"
                    onClick={() => {
                      onSelectSeverity(sev.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-800 transition-colors ${
                      isSelected ? 'text-amber-400 font-bold bg-amber-950/30' : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${sev.color}`} />
                      <span>{sev.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Temporal Status Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'STATUS' ? null : 'STATUS')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
              selectedTemporalStatus !== 'ALL'
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-300 font-bold'
                : 'bg-gray-800/70 hover:bg-gray-800 border-gray-700/80 text-gray-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeStatusObj.dotColor}`} />
            <span>{selectedTemporalStatus === 'ALL' ? 'Status Data' : activeStatusObj.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'STATUS' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'STATUS' && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 mb-1">
                Filter Status & Keaslian Data
              </div>
              {TEMPORAL_STATUSES.map((stat) => {
                const isSelected = selectedTemporalStatus === stat.value;
                return (
                  <button
                    key={stat.value}
                    type="button"
                    onClick={() => {
                      onSelectTemporalStatus(stat.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-800 transition-colors ${
                      isSelected ? 'text-blue-400 font-bold bg-blue-950/30' : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stat.dotColor}`} />
                      <span>{stat.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Count Badge & Reset */}
      <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-800">
        <span className="text-[11px] text-gray-400 px-2 py-1 rounded bg-gray-950 border border-gray-800">
          <strong className="text-white">{totalFiltered}</strong> Kejadian
        </span>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-red-400" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
