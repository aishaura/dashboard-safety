'use client';

import React from 'react';
import { SafetyEvent } from '@/types/safety';
import {
  Activity,
  Flame,
  Waves,
  Car,
  Mountain,
  Wind,
  CloudLightning,
  AlertCircle,
  MapPin,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface EventFeedProps {
  events: SafetyEvent[];
  selectedEvent: SafetyEvent | null;
  onSelectEvent: (event: SafetyEvent) => void;
  onOpenSafetyProfile?: (location: string) => void;
}

export default function EventFeed({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenSafetyProfile,
}: EventFeedProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EARTHQUAKE':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'FIRE_HOTSPOT':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'FLOOD':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'TRAFFIC_ACCIDENT':
        return <Car className="w-4 h-4 text-rose-400" />;
      case 'VOLCANO':
        return <Mountain className="w-4 h-4 text-orange-400" />;
      case 'AIR_POLLUTION':
        return <Wind className="w-4 h-4 text-teal-400" />;
      case 'SEVERE_WEATHER':
        return <CloudLightning className="w-4 h-4 text-cyan-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
            KRITIS
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
            TINGGI
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            RENDAH
          </span>
        );
    }
  };

  const getTemporalBadge = (status: string) => {
    switch (status) {
      case 'REALTIME':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Realtime
          </span>
        );
      case 'NEAR_REALTIME':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Near Real-Time
          </span>
        );
      case 'HISTORICAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-950/60 text-blue-300 border border-blue-500/30">
            Historis
          </span>
        );
      case 'VERIFIED_REPORT':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-950/60 text-purple-300 border border-purple-500/30">
            Laporan Terverifikasi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[540px] shadow-xl">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Daftar Kejadian Terkini & Arsip</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-xs text-blue-400 font-semibold border border-gray-700">
              {events.length}
            </span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Klik entri untuk fokus peta dan melihat bukti sumber
          </p>
        </div>
      </div>

      {/* List Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 divide-y divide-gray-800/40">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <ShieldAlert className="w-10 h-10 text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-300">
              Tidak ada kejadian yang cocok dengan filter.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Coba atur ulang kata kunci pencarian atau kategori filter.
            </p>
          </div>
        ) : (
          events.map((event) => {
            const isSelected = selectedEvent?.id === event.id;
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`pt-2.5 first:pt-0 cursor-pointer rounded-lg p-2.5 transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border border-blue-500/60 shadow-md'
                    : 'hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                {/* Top Row: Category icon, Severity, Temporal Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gray-800 border border-gray-700">
                      {getCategoryIcon(event.category)}
                    </div>
                    {getSeverityBadge(event.severity)}
                  </div>
                  {getTemporalBadge(event.temporalStatus)}
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-gray-100 hover:text-blue-300 line-clamp-2 transition-colors">
                  {event.title}
                </h4>

                {/* Description snippet */}
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                  {event.description}
                </p>

                {/* Footer metadata */}
                <div className="mt-2 pt-1.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex items-center gap-1 text-gray-300 truncate">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">{event.locationName}</span>
                    </span>
                    <span>•</span>
                    <span className="text-gray-400 shrink-0">
                      {event.sourceName.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(event.occurredAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
