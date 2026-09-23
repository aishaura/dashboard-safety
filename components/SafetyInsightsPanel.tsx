'use client';

import React from 'react';
import { SafetyInsight } from '@/types/safety';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Car,
  Activity,
  Flame,
  Mountain,
} from 'lucide-react';

interface SafetyInsightsPanelProps {
  insights: SafetyInsight[];
  onApplyInsightFilter: (filter: { category?: any; location?: string }) => void;
}

export default function SafetyInsightsPanel({
  insights,
  onApplyInsightFilter,
}: SafetyInsightsPanelProps) {
  if (insights.length === 0) return null;

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'EARTHQUAKE':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'FLOOD':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'TRAFFIC_ACCIDENT':
        return <Car className="w-4 h-4 text-rose-400" />;
      case 'FIRE_HOTSPOT':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'VOLCANO':
        return <Mountain className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900 border border-blue-900/40 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Safety Insights & Rekomendasi Terautomasi
            </h3>
            <p className="text-[11px] text-gray-400">
              Disintesis secara otomatis dari bukti empiris dataset keselamatan aktif
            </p>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          Traceable Evidence Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-3.5 bg-gray-850/80 hover:bg-gray-800 border border-gray-800 hover:border-blue-500/40 rounded-xl flex flex-col justify-between transition-all group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getInsightIcon(insight.category)}
                  <span className="text-xs font-bold text-gray-200">
                    {insight.title}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    insight.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : insight.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {insight.severity}
                </span>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed">
                {insight.narrative}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
              <span className="text-gray-400 truncate max-w-[150px]">
                Sumber: {insight.sourceName.split(' ')[0]}
              </span>
              <button
                onClick={() => onApplyInsightFilter(insight.filterPayload)}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Lihat {insight.evidenceCount} Data</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
