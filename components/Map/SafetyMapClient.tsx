'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SafetyEvent } from '@/types/safety';

interface SafetyMapClientProps {
  events: SafetyEvent[];
  selectedEvent: SafetyEvent | null;
  onSelectEvent: (event: SafetyEvent) => void;
  center?: [number, number];
  zoom?: number;
}

export default function SafetyMapClient({
  events,
  selectedEvent,
  onSelectEvent,
  center = [-2.5, 118.0],
  zoom = 5,
}: SafetyMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update Center & Zoom when props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedEvent) {
      mapInstanceRef.current.flyTo(
        [selectedEvent.latitude, selectedEvent.longitude],
        13,
        { duration: 1.5 }
      );
    } else if (center && zoom) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, selectedEvent]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const group = markersLayerRef.current;
    group.clearLayers();

    events.forEach((event) => {
      const isCritical = event.severity === 'CRITICAL';
      const isHigh = event.severity === 'HIGH';
      const isSelected = selectedEvent?.id === event.id;

      let bgColor = 'bg-blue-500';
      let iconSvg = '●';

      switch (event.category) {
        case 'EARTHQUAKE':
          bgColor = isCritical ? 'bg-red-600' : 'bg-purple-600';
          iconSvg = '⚡';
          break;
        case 'FIRE_HOTSPOT':
          bgColor = 'bg-amber-500';
          iconSvg = '🔥';
          break;
        case 'FLOOD':
          bgColor = 'bg-blue-600';
          iconSvg = '🌊';
          break;
        case 'TRAFFIC_ACCIDENT':
          bgColor = isCritical ? 'bg-red-600' : 'bg-rose-500';
          iconSvg = '🚗';
          break;
        case 'VOLCANO':
          bgColor = 'bg-orange-600';
          iconSvg = '🌋';
          break;
        case 'AIR_POLLUTION':
          bgColor = 'bg-teal-500';
          iconSvg = '💨';
          break;
        case 'SEVERE_WEATHER':
          bgColor = 'bg-cyan-500';
          iconSvg = '⛈️';
          break;
        default:
          bgColor = 'bg-gray-500';
          iconSvg = '⚠️';
      }

      const pulseClass = isCritical ? 'pulse-critical' : isHigh ? 'pulse-high' : '';
      const size = isSelected
        ? 'w-9 h-9 text-base'
        : isCritical
        ? 'w-8 h-8 text-sm'
        : 'w-7 h-7 text-xs';

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
            <div class="${size} rounded-full ${bgColor} ${pulseClass} border-2 border-white shadow-xl flex items-center justify-center text-white font-bold leading-none">
              <span>${iconSvg}</span>
            </div>
          </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([event.latitude, event.longitude], {
        icon: customIcon,
      });

      const popupHtml = `
        <div class="p-1 space-y-2 text-gray-100 max-w-xs">
          <div class="flex items-start justify-between gap-2 border-b border-gray-700 pb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isCritical
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }">
              ${event.severity}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-300">
              ${event.temporalStatus}
            </span>
          </div>

          <h4 class="font-bold text-xs text-white leading-tight">${event.title}</h4>
          <p class="text-[11px] text-gray-300 line-clamp-2">${event.description}</p>

          <div class="pt-1 border-t border-gray-700/60 text-[10px] text-gray-400 space-y-0.5">
            <div>📍 ${event.locationName}</div>
            <div>⏰ ${new Date(event.occurredAt).toLocaleString('id-ID')}</div>
            <div class="font-semibold text-gray-300">Sumber: ${event.sourceName}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectEvent(event);
      });

      marker.addTo(group);
    });
  }, [events, selectedEvent, onSelectEvent]);

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-gray-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-md p-2.5 rounded-lg border border-gray-800 text-[11px] text-gray-300 shadow-xl space-y-1.5 pointer-events-auto max-w-xs">
        <div className="font-semibold text-white text-xs border-b border-gray-700/80 pb-1 flex items-center justify-between">
          <span>Legenda Spasial</span>
          <span className="text-[9px] text-gray-400 font-normal">{events.length} Titik</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>Gempa BMKG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Titik Api FIRMS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Banjir & Genangan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Kecelakaan Lalu Lintas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span>Gunung Api</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 pulse-critical" />
            <span>Kritis (Level 4)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
