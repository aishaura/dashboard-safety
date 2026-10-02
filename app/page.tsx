'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import StatsOverview from '@/components/StatsOverview';
import FilterBar from '@/components/FilterBar';
import SafetyMap from '@/components/Map/SafetyMap';
import EventFeed from '@/components/EventFeed';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import EventDetailModal from '@/components/EventDetailModal';
import SafetyProfileDrawer from '@/components/SafetyProfileDrawer';
import SafetyInsightsPanel from '@/components/SafetyInsightsPanel';
import WebinarMode from '@/components/WebinarMode';
import { SafetyEvent, RegionSafetyProfile, SafetyInsight } from '@/types/safety';
import { parseSearchQuery } from '@/lib/search-parser';
import { findLocationInfo } from '@/lib/indonesia-locations';
import { SearchedLocation } from '@/components/Map/SafetyMap';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  MapPin,
  ExternalLink,
  Info,
  Tv,
} from 'lucide-react';

export default function DashboardPage() {
  // State
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<SafetyInsight[]>([]);
  const [bandungProfile, setBandungProfile] = useState<RegionSafetyProfile | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<SearchedLocation | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedTemporalStatus, setSelectedTemporalStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilterDescription, setActiveFilterDescription] = useState<string>('');

  // UI Modals & Drawers
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [activeProfile, setActiveProfile] = useState<RegionSafetyProfile | null>(null);
  const [isWebinarMode, setIsWebinarMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5, 118.0]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Events
      let url = '/api/events?limit=100';
      if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
      if (selectedSeverity !== 'ALL') url += `&severity=${selectedSeverity}`;
      if (selectedTemporalStatus !== 'ALL') url += `&temporalStatus=${selectedTemporalStatus}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

      const resEvents = await fetch(url);
      if (resEvents.ok) {
        const data = await resEvents.json();
        setEvents(data.events || []);
        if (data.stats) setStats(data.stats);
      }

      // 2. Fetch Insights
      const resInsights = await fetch('/api/insights');
      if (resInsights.ok) {
        const data = await resInsights.json();
        setInsights(data.insights || []);
      }

      // 3. Pre-fetch Bandung Safety Profile for quick demonstration
      const resProfile = await fetch('/api/regions/bandung');
      if (resProfile.ok) {
        const data = await resProfile.json();
        setBandungProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [selectedCategory, selectedSeverity, selectedTemporalStatus, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Category Selection (from FilterBar, Stats, or Charts)
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'ALL') {
      // Clear location constraints if present so category events across Indonesia are visible
      if (searchedLocation || searchQuery) {
        setSearchedLocation(null);
        setSearchQuery('');
      }
      setMapCenter([-2.5, 118.0]);
      setMapZoom(5);
      setActiveFilterDescription(`Kategori: ${cat} (Pantauan Spasial Nasional)`);
    } else {
      setActiveFilterDescription('');
    }
  };

  // Handle Search Input or Quick Chips
  const handleSearch = (rawQuery: string) => {
    const parsed = parseSearchQuery(rawQuery);

    // If query is purely a category (e.g. "Titik Api", "Gempa", "Banjir") without location
    if (parsed.category && !parsed.location) {
      setSelectedCategory(parsed.category);
      setSearchQuery('');
      setSearchedLocation(null);
      setMapCenter([-2.5, 118.0]);
      setMapZoom(5);
      setActiveFilterDescription(`Kategori: ${parsed.category} (Pantauan Spasial Nasional)`);
      return;
    }

    setSearchQuery(rawQuery);
    let desc = `Pencarian: "${rawQuery}"`;

    // Check if location matches known Indonesian cities/regions (e.g. Balikpapan, Banten, Surabaya, Jakarta, Bandung, etc.)
    const locTarget = parsed.location;
    const locInfo = locTarget ? findLocationInfo(locTarget) : findLocationInfo(rawQuery);

    if (locInfo) {
      setSearchedLocation({
        name: locInfo.name,
        coordinates: locInfo.coordinates,
        zoom: locInfo.zoom,
        province: locInfo.province,
      });
      setMapCenter(locInfo.coordinates);
      setMapZoom(locInfo.zoom);
    } else {
      setSearchedLocation(null);
    }

    // Handle profile drawer request for any city (e.g. "profil bandung", "profil samarinda")
    if (parsed.isLocationProfileSearch) {
      const targetCity = parsed.location || locInfo?.name || rawQuery;
      handleOpenCityProfile(targetCity);
      desc += ` → Membuka Safety Profile ${targetCity}`;
    } else {
      if (parsed.category) {
        setSelectedCategory(parsed.category);
        desc += ` [Kategori: ${parsed.category}]`;
      }
      if (locInfo) {
        desc += ` [Lokasi: ${locInfo.name}]`;
      } else if (parsed.location) {
        desc += ` [Lokasi: ${parsed.location}]`;
      }
      if (parsed.year) {
        desc += ` [Tahun: ${parsed.year}]`;
      }
      if (parsed.month) {
        desc += ` [Bulan: ${parsed.month}]`;
      }
    }

    setActiveFilterDescription(desc);
  };

  // Open Safety Profile for any city dynamically
  const handleOpenCityProfile = async (cityName?: string) => {
    const target = cityName || searchedLocation?.name || 'Bandung';
    try {
      const res = await fetch(`/api/regions/${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setActiveProfile(data.profile);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load region profile:', err);
    }
  };

  // Clear Searched City / Exit Pointer -> Smooth Zoom Out to National & Restore all markers
  const handleClearSearchedLocation = useCallback(() => {
    setSearchedLocation(null);
    setSearchQuery('');
    setActiveFilterDescription('');
    setMapCenter([-2.5, 118.0]);
    setMapZoom(5);
  }, []);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSeverity('ALL');
    setSelectedTemporalStatus('ALL');
    handleClearSearchedLocation();
  };

  // Sync Live Data from BMKG / FIRMS
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Data sync failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Focus map on Bandung
  const handleFocusBandung = () => {
    setMapCenter([-6.9175, 107.6191]);
    setMapZoom(12);
    if (bandungProfile) {
      setActiveProfile(bandungProfile);
    }
  };

  // Focus map on specific event
  const handleSelectEvent = (event: SafetyEvent) => {
    setSelectedEvent(event);
    setMapCenter([event.latitude, event.longitude]);
    setMapZoom(13);
  };

  // Apply filter from Safety Insights
  const handleApplyInsightFilter = (payload: { category?: any; location?: string }) => {
    if (payload.category) setSelectedCategory(payload.category);
    if (payload.location) {
      setSearchQuery(payload.location);
      if (payload.location.toLowerCase().includes('bandung')) {
        setMapCenter([-6.9175, 107.6191]);
        setMapZoom(12);
      }
    }
    setActiveFilterDescription(`Difilter dari Insight: ${payload.category || ''} ${payload.location || ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        onSearch={handleSearch}
        onSelectQueryChip={handleSearch}
        onToggleWebinarMode={() => setIsWebinarMode(true)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        lastUpdated={stats?.latestUpdated || ''}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Active Filter Ticker / Notification */}
        {activeFilterDescription && (
          <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="font-semibold text-blue-200">
                {activeFilterDescription}
              </span>
              <span className="text-gray-400">
                ({events.length} kejadian ditemukan)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Bersihkan Filter</span>
            </button>
          </div>
        )}

        {/* 1. Top KPI Stats */}
        {stats && (
          <StatsOverview
            stats={stats}
            onSelectSeverity={(sev) => setSelectedSeverity(sev)}
            onSelectCategory={(cat) => handleCategorySelect(cat)}
          />
        )}

        {/* 2. Filter Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          selectedSeverity={selectedSeverity}
          selectedTemporalStatus={selectedTemporalStatus}
          onSelectCategory={handleCategorySelect}
          onSelectSeverity={setSelectedSeverity}
          onSelectTemporalStatus={setSelectedTemporalStatus}
          onResetFilters={handleResetFilters}
          totalFiltered={events.length}
        />

        {/* 3. Map View Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Peta Spasial Intelijen Keselamatan</span>
            </h2>
            <span className="text-xs text-gray-400 hidden sm:inline">
              (Multi-layer: BMKG, FIRMS, DIBI, Korlantas)
            </span>
          </div>

          {/* Quick Focus & Presets Buttons */}
          <div className="flex items-center gap-2">
            {searchedLocation ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenCityProfile(searchedLocation.name)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                  <span>Profil {searchedLocation.name.replace(/^(Kota|Kabupaten)\s+/i, '')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSearchedLocation}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <span>🌐 Zoom Out ke Nasional</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSearch('Bandung')}
                  className="px-3 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bandung</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSearch('Surabaya')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Surabaya</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSearch('Samarinda')}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Samarinda</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSearchedLocation}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset Nasional
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4. Core Grid: Interactive Map (7 cols) + Event Feed (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <SafetyMap
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={(e) => setSelectedEvent(e)}
              center={mapCenter}
              zoom={mapZoom}
              searchedLocation={searchedLocation}
              onClearSearchedLocation={handleClearSearchedLocation}
              onOpenCityProfile={handleOpenCityProfile}
            />
          </div>

          <div className="lg:col-span-5">
            <EventFeed
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={handleSelectEvent}
              activeLocationName={searchedLocation?.name}
              onOpenSafetyProfile={handleOpenCityProfile}
            />
          </div>
        </div>

        {/* 5. Safety Insights Engine */}
        <SafetyInsightsPanel
          insights={insights}
          onApplyInsightFilter={handleApplyInsightFilter}
        />

        {/* 6. Analytics Charts Section */}
        {stats && (
          <AnalyticsCharts
            categoryDistribution={stats.categoryDistribution}
            severityDistribution={stats.severityDistribution}
            monthlyTrend={stats.monthlyTrend}
            onSelectCategory={(cat) => handleCategorySelect(cat)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/60 mt-10 py-5 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-gray-300">
              Safety Intelligence Dashboard ID
            </span>
            <span>— Media Demonstrasi Webinar & Pemantauan Berkelanjutan</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-[11px]">
            <span>Sumber: BMKG, NASA FIRMS, Open-Meteo, BNPB DIBI, Korlantas Polri, KNKT</span>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}

      {/* 1. Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onFocusMap={(event) => {
            setMapCenter([event.latitude, event.longitude]);
            setMapZoom(14);
          }}
        />
      )}

      {/* 2. City Safety Profile Drawer (e.g. Bandung) */}
      {activeProfile && (
        <SafetyProfileDrawer
          profile={activeProfile}
          onClose={() => setActiveProfile(null)}
          onSelectEvent={handleSelectEvent}
          onFocusRegionMap={(coords) => {
            setMapCenter([coords.latitude, coords.longitude]);
            setMapZoom(12);
          }}
        />
      )}

      {/* 3. Webinar Mode Presentation Fullscreen */}
      {isWebinarMode && (
        <WebinarMode
          onClose={() => setIsWebinarMode(false)}
          events={events}
          stats={stats}
          activeRegionName={searchedLocation?.name || searchQuery || 'Nasional'}
          searchedLocation={searchedLocation}
          bandungProfile={bandungProfile}
          insights={insights}
        />
      )}
    </div>
  );
}
