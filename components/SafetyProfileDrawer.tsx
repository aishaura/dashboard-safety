'use client';

import React, { useState } from 'react';
import { RegionSafetyProfile, SafetyEvent } from '@/types/safety';
import {
  X,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Waves,
  Car,
  Activity,
  Wind,
  Flame,
  ChevronRight,
  ExternalLink,
  FlameKindling,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
} from 'lucide-react';

interface SafetyProfileDrawerProps {
  profile: RegionSafetyProfile | null;
  onClose: () => void;
  onSelectEvent: (event: SafetyEvent) => void;
  onFocusRegionMap: (coords: { latitude: number; longitude: number }) => void;
}

export default function SafetyProfileDrawer({
  profile,
  onClose,
  onSelectEvent,
  onFocusRegionMap,
}: SafetyProfileDrawerProps) {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!profile) return null;

  const filteredIncidents =
    filterCategory === 'ALL'
      ? profile.recentIncidents
      : profile.recentIncidents.filter((e) => e.category === filterCategory);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header Banner */}
        <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Safety Profile Wilayah
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeColor(
                  profile.riskLevel
                )}`}
              >
                Indeks Risiko: {profile.riskScore}/100 ({profile.riskLevel})
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <span>{profile.name}</span>
            </h2>

            <p className="text-xs text-gray-400 max-w-2xl">
              {profile.summary}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFocusRegionMap(profile.coordinates);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Peta Wilayah</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Total Insiden Terdata
              </span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {profile.totalIncidents}
              </span>
              <span className="text-[10px] text-gray-400">Kejadian historis & realtime</span>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-red-400 block">
                Peringatan Aktif
              </span>
              <span className="text-2xl font-extrabold text-red-400 mt-1 block">
                {profile.activeAlerts}
              </span>
              <span className="text-[10px] text-gray-400">Dalam status monitoring</span>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-teal-400 block flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>Kualitas Udara</span>
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                AQI {profile.environmentalStatus.aqi || 68}
              </span>
              <span className="text-[10px] text-teal-300">
                {profile.environmentalStatus.aqiCategory || 'Sedang'}
              </span>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block flex items-center gap-1">
                <CloudRain className="w-3 h-3" />
                <span>Kondisi Cuaca</span>
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {profile.environmentalStatus.temperature}°C
              </span>
              <span className="text-[10px] text-gray-400 truncate block">
                {profile.environmentalStatus.weather}
              </span>
            </div>
          </div>

          {/* Sub-Area Hotspots (Area Berfrekuensi Tinggi) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FlameKindling className="w-4 h-4 text-orange-400" />
                <span>Area dengan Frekuensi Kejadian Tertinggi (Risk Hotspots)</span>
              </h3>
              <span className="text-[10px] text-gray-400">Berdasarkan agregasi data spasial</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.hotspotAreas.map((hotspot, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-800/40 hover:bg-gray-800/70 border border-gray-800 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-200">
                      {hotspot.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {hotspot.incidentCount} Insiden
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {hotspot.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History Table for this region */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Daftar Kejadian & Insiden Tercatat di {profile.name}</span>
              </h3>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                {['ALL', 'FLOOD', 'TRAFFIC_ACCIDENT', 'EARTHQUAKE', 'VOLCANO'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                      filterCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'Semua'
                      : cat === 'FLOOD'
                      ? 'Banjir'
                      : cat === 'TRAFFIC_ACCIDENT'
                      ? 'Kecelakaan'
                      : cat === 'EARTHQUAKE'
                      ? 'Gempa'
                      : 'Gunung Api'}
                  </button>
                ))}
              </div>
            </div>

            {/* Incidents List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => {
                    onSelectEvent(incident);
                    onClose();
                  }}
                  className="p-3 bg-gray-800/40 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : incident.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(incident.occurredAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-gray-700 text-gray-300">
                        {incident.temporalStatus}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {incident.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">
                      {incident.locationName} — {incident.impactSummary || incident.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {incident.sourceName.split(' ')[0]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Sumber Terpadu: BPBD, BNPB DIBI, Korlantas Polri, BMKG & Open-Meteo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
}
