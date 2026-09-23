'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsChartsProps {
  categoryDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  monthlyTrend: Record<string, number>;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  EARTHQUAKE: 'Gempa',
  FLOOD: 'Banjir',
  TRAFFIC_ACCIDENT: 'Kecelakaan',
  FIRE_HOTSPOT: 'Titik Api',
  VOLCANO: 'Gunung Api',
  LANDSLIDE: 'Longsor',
  AIR_POLLUTION: 'Udara',
  SEVERE_WEATHER: 'Cuaca',
  INDUSTRIAL_ACCIDENT: 'Industri',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#10B981',
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Kritis (Lvl 4)',
  HIGH: 'Tinggi (Lvl 3)',
  MEDIUM: 'Sedang (Lvl 2)',
  LOW: 'Rendah (Lvl 1)',
};

export default function AnalyticsCharts({
  categoryDistribution,
  severityDistribution,
  monthlyTrend,
  onSelectCategory,
}: AnalyticsChartsProps) {
  // Transform category data
  const barData = Object.entries(categoryDistribution || {})
    .map(([cat, count]) => ({
      rawCategory: cat,
      name: CATEGORY_LABELS[cat] || cat,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Transform severity data
  const pieData = Object.entries(severityDistribution || {})
    .filter(([_, count]) => count > 0)
    .map(([sev, count]) => ({
      name: SEVERITY_LABELS[sev] || sev,
      value: count,
      color: SEVERITY_COLORS[sev] || '#3B82F6',
    }));

  // Transform trend data
  const trendData = Object.entries(monthlyTrend || {})
    .map(([month, count]) => ({
      month,
      count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: Distribusi Kategori */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Distribusi Kejadian per Kategori
          </h4>
          <span className="text-[10px] text-gray-400">Total Jenis Insiden</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={10}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis stroke="#6B7280" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Bar
                dataKey="count"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  if (onSelectCategory && data?.rawCategory) {
                    onSelectCategory(data.rawCategory);
                  }
                }}
                className="cursor-pointer hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Proporsi Tingkat Keparahan */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Proporsi Tingkat Keparahan (Severity)
          </h4>
          <span className="text-[10px] text-gray-400">Level Risiko</span>
        </div>
        <div className="h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[10px]">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-300">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3: Tren Kejadian Temporal */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Tren Kejadian & Pemantauan Waktu
          </h4>
          <span className="text-[10px] text-gray-400">Dinamika Temporal</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#6B7280" fontSize={10} />
              <YAxis stroke="#6B7280" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
