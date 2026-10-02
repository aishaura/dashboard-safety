'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Tv,
  Radio,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onSelectQueryChip: (query: string) => void;
  onToggleWebinarMode: () => void;
  onRefreshData: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: string;
}

const QUICK_CHIPS = [
  { label: 'Jakarta', query: 'Jakarta', icon: MapPin },
  { label: 'Surabaya', query: 'Surabaya', icon: MapPin },
  { label: 'Bandung', query: 'Bandung', icon: MapPin },
  { label: 'Gempa Terkini', query: 'Gempa', icon: Radio },
  { label: 'Titik Api', query: 'Titik Api', icon: Sparkles },
];

export default function Navbar({
  onSearch,
  onSelectQueryChip,
  onToggleWebinarMode,
  onRefreshData,
  isRefreshing,
  lastUpdated,
}: NavbarProps) {
  const [searchInput, setSearchInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedTime = useMemo(() => {
    if (!mounted) return '--:--:-- WIB';
    const targetDate = lastUpdated ? new Date(lastUpdated) : new Date();
    if (isNaN(targetDate.getTime())) return '--:--:-- WIB';
    return `${targetDate.toLocaleTimeString('id-ID')} WIB`;
  }, [mounted, lastUpdated]);

  const fullDateTooltip = useMemo(() => {
    if (!mounted) return 'Waktu pembaruan data sistem';
    const targetDate = lastUpdated ? new Date(lastUpdated) : new Date();
    if (isNaN(targetDate.getTime())) return 'Waktu pembaruan data sistem';
    return `Sinkronisasi terakhir: ${targetDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} pukul ${targetDate.toLocaleTimeString('id-ID')} WIB`;
  }, [mounted, lastUpdated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleChipClick = (query: string) => {
    setSearchInput(query);
    onSelectQueryChip(query);
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-white tracking-wide">
                    SAFETY INTEL <span className="text-blue-400">ID</span>
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Live Monitor
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Data Kebencanaan, Kecelakaan & Pemantauan Risiko Indonesia
                </p>
              </div>
            </div>

            {/* Mobile Webinar Button */}
            <button
              onClick={onToggleWebinarMode}
              className="md:hidden p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4" />
              <span>Webinar</span>
            </button>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            className="relative flex-1 max-w-xl w-full"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari wilayah atau kejadian (misal: 'Bandung', 'Kecelakaan Bandung', 'Banjir Dayeuhkolot')..."
                className="w-full pl-10 pr-20 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Actions & Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Live Indicator */}
            <div className="hidden lg:flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Konektivitas Aktif</span>
              </div>
              <span
                className="text-[10px] text-gray-400 cursor-help hover:text-gray-300 transition-colors"
                title={fullDateTooltip}
                suppressHydrationWarning
              >
                Pembaruan: {formattedTime}
              </span>
            </div>

            {/* Sync Button */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              title="Tarik pembaruan data terkini dari BMKG, NASA FIRMS & Satelit"
              className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>

            {/* Webinar Mode Button */}
            <button
              onClick={onToggleWebinarMode}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Tv className="w-4 h-4" />
              <span>Mode Presentasi / Webinar</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold shrink-0">
            Fokus Cepat:
          </span>
          {QUICK_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.query}
                type="button"
                onClick={() => handleChipClick(chip.query)}
                className="px-2 py-0.5 rounded-md bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 text-gray-300 hover:text-white shrink-0 flex items-center gap-1 transition-all text-[11px]"
              >
                <Icon className="w-3 h-3 text-blue-400" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
