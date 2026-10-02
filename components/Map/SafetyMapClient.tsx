'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SafetyEvent } from '@/types/safety';
import { Layers, Map as MapIcon, Globe, Moon } from 'lucide-react';

export interface SearchedLocation {
  name: string;
  coordinates: [number, number];
  zoom?: number;
  province?: string;
}

interface SafetyMapClientProps {
  events: SafetyEvent[];
  selectedEvent: SafetyEvent | null;
  onSelectEvent: (event: SafetyEvent) => void;
  center?: [number, number];
  zoom?: number;
  searchedLocation?: SearchedLocation | null;
  onClearSearchedLocation?: () => void;
  onOpenCityProfile?: (cityName: string) => void;
}

type BasemapKey = 'voyager' | 'osm' | 'satellite' | 'dark';

interface BasemapOption {
  id: BasemapKey;
  label: string;
  shortLabel: string;
  getUrl: (cartoKey?: string) => string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'voyager',
    label: 'Berwarna (Alami)',
    shortLabel: 'Berwarna',
    getUrl: (key) =>
      key
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${key}`
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    shortLabel: 'OSM',
    getUrl: () => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  {
    id: 'satellite',
    label: 'Satelit Bumi',
    shortLabel: 'Satelit',
    getUrl: () =>
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics',
    subdomains: 'abc',
    maxZoom: 18,
  },
  {
    id: 'dark',
    label: 'Mode Gelap',
    shortLabel: 'Gelap',
    getUrl: (key) =>
      key
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${key}`
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
];

export default function SafetyMapClient({
  events,
  selectedEvent,
  onSelectEvent,
  center = [-2.5, 118.0],
  zoom = 5,
  searchedLocation,
  onClearSearchedLocation,
  onOpenCityProfile,
}: SafetyMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const searchedMarkerRef = useRef<L.Marker | null>(null);
  const prevSearchedLocationRef = useRef<SearchedLocation | null>(null);
  const isProgrammaticCloseRef = useRef<boolean>(false);

  // Default to 'voyager' for full color map (green land, blue water, colored roads)
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>('voyager');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    const markerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
      searchedMarkerRef.current = null;
    };
  }, []);

  // Handle auto zoom-out when searchedLocation is exited / transitions to null
  useEffect(() => {
    if (prevSearchedLocationRef.current && !searchedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-2.5, 118.0], 5, { duration: 1.5 });
    }
    prevSearchedLocationRef.current = searchedLocation || null;
  }, [searchedLocation]);

  // Handle Basemap Layer Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
    const selectedOption =
      BASEMAP_OPTIONS.find((b) => b.id === activeBasemap) || BASEMAP_OPTIONS[0];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(selectedOption.getUrl(cartoKey), {
      attribution: selectedOption.attribution,
      subdomains: selectedOption.subdomains,
      maxZoom: selectedOption.maxZoom,
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [activeBasemap]);

  // Update Searched Location Marker & Animated Pointer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (searchedMarkerRef.current) {
      isProgrammaticCloseRef.current = true;
      searchedMarkerRef.current.off('popupclose');
      map.removeLayer(searchedMarkerRef.current);
      searchedMarkerRef.current = null;
      setTimeout(() => {
        isProgrammaticCloseRef.current = false;
      }, 100);
    }

    if (!searchedLocation) return;

    const [lat, lng] = searchedLocation.coordinates;
    const targetZoom = searchedLocation.zoom || 12;

    map.flyTo([lat, lng], targetZoom, { duration: 1.5 });

    // Custom glowing pointer pin with bouncing label and radar wave rings
    const searchPinIcon = L.divIcon({
      html: `
        <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto select-none group">
          <!-- Floating Badge -->
          <div class="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-2xl border-2 border-white flex items-center gap-2 whitespace-nowrap transition-transform transform group-hover:scale-110">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>📍 ${searchedLocation.name}</span>
          </div>
          <!-- Pin Pointer Stem -->
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-purple-600 -mt-0.5 drop-shadow-lg"></div>
          <!-- Ground Target Beacon & Rings -->
          <div class="relative -mt-1 flex items-center justify-center">
            <span class="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping"></span>
            <span class="absolute w-7 h-7 rounded-full bg-indigo-500/40 animate-pulse"></span>
            <span class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white block shadow-xl"></span>
          </div>
        </div>
      `,
      className: 'searched-location-pin',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -42],
    });

    const marker = L.marker([lat, lng], {
      icon: searchPinIcon,
      zIndexOffset: 2000,
    }).addTo(map);

    const popupHtml = `
      <div class="p-2 space-y-2 text-gray-100 max-w-xs">
        <div class="flex items-center justify-between border-b border-gray-700/80 pb-1.5">
          <span class="font-bold text-sm text-blue-400 flex items-center gap-1">
            📍 ${searchedLocation.name}
          </span>
          <span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 uppercase">
            Wilayah Terpilih
          </span>
        </div>
        <p class="text-[11px] text-gray-300 leading-relaxed">
          Peta difokuskan ke wilayah <strong>${searchedLocation.name}</strong>${
            searchedLocation.province ? ` (${searchedLocation.province})` : ''
          }. Menampilkan potensi risiko dan data keselamatan sekitar.
        </p>
        <div class="text-[10px] text-gray-400 pt-1 border-t border-gray-700/60 flex items-center justify-between">
          <span>Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>
          <span class="text-blue-300 font-medium">Zoom ${targetZoom}x</span>
        </div>
        <div class="pt-2 flex flex-col gap-1.5 border-t border-gray-700/60">
          <button id="btn-zoomout-national" class="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer">
            <span>🌐 Zoom Out ke Pantauan Nasional</span>
          </button>
          <button id="btn-open-city-profile" class="w-full py-1 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-blue-300 font-medium text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer">
            <span>📋 Buka Profil Keselamatan Kota</span>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on('popupopen', () => {
      const btnZoom = document.getElementById('btn-zoomout-national');
      if (btnZoom) {
        btnZoom.onclick = (e) => {
          e.stopPropagation();
          onClearSearchedLocation?.();
        };
      }
      const btnProfile = document.getElementById('btn-open-city-profile');
      if (btnProfile) {
        btnProfile.onclick = (e) => {
          e.stopPropagation();
          onOpenCityProfile?.(searchedLocation.name);
        };
      }
    });

    marker.on('popupclose', () => {
      if (!isProgrammaticCloseRef.current) {
        onClearSearchedLocation?.();
      }
    });

    const timer = setTimeout(() => {
      marker.openPopup();
    }, 900);

    searchedMarkerRef.current = marker;

    return () => {
      clearTimeout(timer);
      if (searchedMarkerRef.current) {
        isProgrammaticCloseRef.current = true;
        searchedMarkerRef.current.off('popupclose');
        map.removeLayer(searchedMarkerRef.current);
        searchedMarkerRef.current = null;
        setTimeout(() => {
          isProgrammaticCloseRef.current = false;
        }, 100);
      }
    };
  }, [searchedLocation]);

  // Update Center & Zoom when props change (only if no searchedLocation taking priority)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedEvent) {
      mapInstanceRef.current.flyTo(
        [selectedEvent.latitude, selectedEvent.longitude],
        13,
        { duration: 1.5 }
      );
    } else if (searchedLocation) {
      // handled by searchedLocation effect
    } else if (center && zoom) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, selectedEvent, searchedLocation]);

  // When events update and there is no specific searched location or selected event,
  // auto-adjust viewport if events are outside current viewport (e.g. switching to Titik Api)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (searchedLocation || selectedEvent) return;
    if (events.length === 0) return;

    const map = mapInstanceRef.current;
    const currentBounds = map.getBounds();
    const hasVisibleEvent = events.some((e) =>
      currentBounds.contains([e.latitude, e.longitude])
    );

    // If none of the events are within current viewport, fit bounds so markers appear
    if (!hasVisibleEvent) {
      const bounds = L.latLngBounds(events.map((e) => [e.latitude, e.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 7,
          animate: true,
          duration: 1.2,
        });
      }
    }
  }, [events, searchedLocation, selectedEvent]);

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
    <div className="relative isolate z-0 w-full h-[540px] rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-gray-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Basemap Style Switcher (Top-Right) */}
      <div className="absolute top-3 right-3 z-20 bg-gray-900/90 backdrop-blur-md p-1 rounded-lg border border-gray-800 shadow-xl flex items-center gap-1 text-xs pointer-events-auto">
        <span className="text-[10px] text-gray-400 px-2 font-medium hidden sm:flex items-center gap-1">
          <Layers className="w-3 h-3 text-blue-400" />
          <span>Tema:</span>
        </span>
        {BASEMAP_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setActiveBasemap(option.id)}
            title={option.label}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
              activeBasemap === option.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            {option.id === 'voyager' && <MapIcon className="w-3 h-3" />}
            {option.id === 'osm' && <Globe className="w-3 h-3" />}
            {option.id === 'satellite' && <Layers className="w-3 h-3" />}
            {option.id === 'dark' && <Moon className="w-3 h-3" />}
            <span>{option.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Active Search Focus Indicator Banner on Map */}
      {searchedLocation && (
        <div className="absolute top-14 right-3 z-20 bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/40 text-xs shadow-2xl flex items-center gap-2 animate-fadeIn pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-gray-300">Fokus:</span>
            <span className="font-semibold text-blue-300">📍 {searchedLocation.name}</span>
          </div>
          {onClearSearchedLocation && (
            <button
              onClick={onClearSearchedLocation}
              title="Kembali ke Pantauan Nasional (Zoom Out)"
              className="ml-1 text-blue-200 hover:text-white text-xs px-2 py-0.5 bg-blue-600/40 hover:bg-blue-600/70 rounded border border-blue-500/50 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>✕</span>
              <span>Zoom Out</span>
            </button>
          )}
        </div>
      )}

      {/* Map Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-gray-900/90 backdrop-blur-md p-2.5 rounded-lg border border-gray-800 text-[11px] text-gray-300 shadow-xl space-y-1.5 pointer-events-auto max-w-xs">
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
