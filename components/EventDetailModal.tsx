'use client';

import React from 'react';
import { SafetyEvent } from '@/types/safety';
import {
  X,
  MapPin,
  Clock,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Activity,
  Users,
} from 'lucide-react';

interface EventDetailModalProps {
  event: SafetyEvent | null;
  onClose: () => void;
  onFocusMap: (event: SafetyEvent) => void;
}

export default function EventDetailModal({
  event,
  onClose,
  onFocusMap,
}: EventDetailModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-start justify-between gap-4 sticky top-0 bg-gray-900/95 backdrop-blur z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                  event.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : event.severity === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                Severity: {event.severity}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.temporalStatus === 'REALTIME'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : event.temporalStatus === 'NEAR_REALTIME'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                Status Data: {event.temporalStatus}
              </span>

              <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 font-medium">
                {event.category}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-snug">
              {event.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Deskripsi / Kronologi Kejadian</span>
            </h4>
            <p className="text-sm text-gray-200 leading-relaxed bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
              {event.description}
            </p>
          </div>

          {/* Spatial & Temporal Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-gray-800/40 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Informasi Lokasi</span>
              </div>
              <p className="text-xs font-medium text-white">
                {event.locationName}
              </p>
              <p className="text-[11px] text-gray-400">
                {event.district ? `${event.district}, ` : ''}{event.regencyCity}, {event.province}
              </p>
              <div className="text-[11px] font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded inline-block">
                Lat: {event.latitude.toFixed(4)}, Lon: {event.longitude.toFixed(4)}
              </div>
            </div>

            <div className="p-3.5 bg-gray-800/40 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Waktu Kejadian & Sinkronisasi</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Waktu Kejadian Sebenarnya:</p>
                <p className="text-xs font-medium text-white">
                  {new Date(event.occurredAt).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Waktu Masuk Sistem:</p>
                <p className="text-[11px] text-gray-300">
                  {new Date(event.ingestedAt).toLocaleString('id-ID')} ({event.periodLabel})
                </p>
              </div>
            </div>
          </div>

          {/* Impact & Casualties */}
          {(event.casualtiesFatal !== undefined || event.impactSummary) && (
            <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
                <Users className="w-4 h-4 text-red-400" />
                <span>Dampak & Korban Tercatat</span>
              </div>
              {event.casualtiesFatal !== undefined && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-300">
                    Meninggal: <strong className="text-red-400">{event.casualtiesFatal}</strong> jiwa
                  </span>
                  <span className="text-gray-300">
                    Luka-luka: <strong className="text-amber-400">{event.casualtiesInjured || 0}</strong> orang
                  </span>
                </div>
              )}
              {event.impactSummary && (
                <p className="text-xs text-red-200/90 font-medium">
                  {event.impactSummary}
                </p>
              )}
            </div>
          )}

          {/* Metadata parameters (magnitude, depth, shakemap, frp, aqi) */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Parameter Teknis Sensor / Bukti Data</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(event.metadata).map(([key, val]) => {
                  if (key === 'shakemapUrl' && typeof val === 'string') return null;
                  return (
                    <div key={key} className="bg-gray-800/60 p-2 rounded-lg border border-gray-800">
                      <span className="text-[10px] text-gray-400 block uppercase font-mono">{key}</span>
                      <span className="font-semibold text-gray-200 truncate block">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shakemap Preview if BMKG */}
              {event.metadata.shakemapUrl && (
                <div className="mt-3 bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300 block mb-2">
                    Peta Guncangan BMKG (Shakemap):
                  </span>
                  <img
                    src={event.metadata.shakemapUrl}
                    alt="Shakemap BMKG"
                    className="max-h-64 rounded-lg mx-auto border border-gray-700 shadow"
                  />
                </div>
              )}
            </div>
          )}

          {/* Provenance Box: Source & Legal Transparency */}
          <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                Verifikasi Sumber Data (Data Provenance)
              </span>
              <p className="text-xs text-gray-200 font-semibold mt-0.5">
                {event.sourceName}
              </p>
              <p className="text-[10px] text-gray-400">
                Integritas data terjamin dengan pencatatan timestamp dan identitas sumber rujukan.
              </p>
            </div>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-blue-500/30 shrink-0"
              >
                <span>Buka Portal Resmi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={() => {
              onFocusMap(event);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <MapPin className="w-4 h-4" />
            <span>Tampilkan di Peta</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
