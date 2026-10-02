'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { SafetyEvent } from '@/types/safety';

export interface SearchedLocation {
  name: string;
  coordinates: [number, number];
  zoom?: number;
  province?: string;
}

interface SafetyMapProps {
  events: SafetyEvent[];
  selectedEvent: SafetyEvent | null;
  onSelectEvent: (event: SafetyEvent) => void;
  center?: [number, number];
  zoom?: number;
  searchedLocation?: SearchedLocation | null;
  onClearSearchedLocation?: () => void;
  onOpenCityProfile?: (cityName: string) => void;
}

const DynamicSafetyMapClient = dynamic(
  () => import('./SafetyMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-xl bg-gray-950 border border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Memuat Peta Spasial Keselamatan...</span>
      </div>
    ),
  }
);

export default function SafetyMap(props: SafetyMapProps) {
  return <DynamicSafetyMapClient {...props} />;
}
