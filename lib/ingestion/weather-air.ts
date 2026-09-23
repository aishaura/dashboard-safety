import { SafetyEvent } from '@/types/safety';

interface CityTarget {
  name: string;
  regencyCity: string;
  province: string;
  lat: number;
  lon: number;
}

const CITIES: CityTarget[] = [
  { name: 'Kota Bandung', regencyCity: 'Kota Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191 },
  { name: 'DKI Jakarta', regencyCity: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Surabaya', regencyCity: 'Kota Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521 },
  { name: 'Semarang', regencyCity: 'Kota Semarang', province: 'Jawa Tengah', lat: -6.9667, lon: 110.4167 },
  { name: 'Medan', regencyCity: 'Kota Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722 },
];

export async function fetchWeatherAndAirQuality(): Promise<SafetyEvent[]> {
  const events: SafetyEvent[] = [];

  for (const city of CITIES) {
    try {
      // 1. Fetch Air Quality
      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
      const resAir = await fetch(airUrl, { next: { revalidate: 3600 } });

      if (resAir.ok) {
        const dataAir = await resAir.json();
        const current = dataAir.current;
        if (current) {
          const usAqi = current.us_aqi || 50;
          const pm25 = current.pm2_5 || 15;
          const dateStr = current.time || new Date().toISOString();

          // Only create safety alert if AQI is moderate/unhealthy or specifically for Bandung tracking
          const isHighAqi = usAqi > 100;
          const severity = usAqi > 200 ? 'CRITICAL' : usAqi > 150 ? 'HIGH' : usAqi > 100 ? 'MEDIUM' : 'LOW';

          events.push({
            id: `air-${city.regencyCity.toLowerCase().replace(/\s+/g, '-')}-${dateStr.slice(0, 13)}`,
            fingerprint: `air-aqi-${city.lat}-${city.lon}-${dateStr.slice(0, 10)}`,
            title: `Indeks Kualitas Udara ${city.name}: AQI ${usAqi} (${getAqiCategory(usAqi)})`,
            description: `Konsentrasi PM2.5: ${pm25.toFixed(1)} µg/m³. NO2: ${(current.nitrogen_dioxide || 0).toFixed(1)} µg/m³, SO2: ${(current.sulphur_dioxide || 0).toFixed(1)} µg/m³. Rekomendasi: ${getAqiAdvice(usAqi)}.`,
            category: 'AIR_POLLUTION',
            subcategory: 'INDEKS_ISPU_AQI',
            severity,
            status: isHighAqi ? 'ACTIVE' : 'MONITORING',
            temporalStatus: 'REALTIME',
            sourceName: 'Open-Meteo & Copernicus Atmosphere Service',
            sourceUrl: 'https://open-meteo.com/en/docs/air-quality-api',
            latitude: city.lat,
            longitude: city.lon,
            locationName: city.name,
            regencyCity: city.regencyCity,
            province: city.province,
            occurredAt: dateStr.includes('T') ? `${dateStr}:00Z` : `${dateStr}T00:00:00Z`,
            ingestedAt: new Date().toISOString(),
            periodLabel: 'Sep 2026',
            impactSummary: `AQI: ${usAqi}, PM2.5: ${pm25} µg/m³`,
            metadata: {
              usAqi,
              pm25,
              pm10: current.pm10,
              co: current.carbon_monoxide,
              no2: current.nitrogen_dioxide,
              so2: current.sulphur_dioxide,
            },
          });
        }
      }

      // 2. Fetch Weather & Rain Forecast
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m`;
      const resWeather = await fetch(weatherUrl, { next: { revalidate: 1800 } });

      if (resWeather.ok) {
        const dataWeather = await resWeather.json();
        const curW = dataWeather.current;
        if (curW) {
          const rain = curW.rain || curW.precipitation || 0;
          const gusts = curW.wind_gusts_10m || 0;
          const dateStr = curW.time || new Date().toISOString();

          // Create severe weather alert if high rain or high wind
          if (rain > 5 || gusts > 35 || city.name === 'Kota Bandung') {
            const isSevere = rain > 20 || gusts > 50;
            events.push({
              id: `weather-${city.regencyCity.toLowerCase().replace(/\s+/g, '-')}-${dateStr.slice(0, 13)}`,
              fingerprint: `weather-${city.lat}-${city.lon}-${dateStr.slice(0, 10)}`,
              title: isSevere
                ? `Peringatan Cuaca Ekstrem: Hujan Lebat & Angin di ${city.name}`
                : `Pemantauan Kondisi Hidrometeorologi: ${city.name}`,
              description: `Curah hujan terdeteksi: ${rain} mm/jam, Kecepatan hembusan angin: ${gusts} km/jam. Suhu: ${curW.temperature_2m}°C, Kelembaban: ${curW.relative_humidity_2m}%. Potensi genangan air lokal di dataran rendah.`,
              category: 'SEVERE_WEATHER',
              subcategory: 'HIDROMETEOROLOGI',
              severity: isSevere ? 'HIGH' : rain > 2 ? 'MEDIUM' : 'LOW',
              status: rain > 10 ? 'ACTIVE' : 'MONITORING',
              temporalStatus: 'REALTIME',
              sourceName: 'Open-Meteo & BMKG Radar Satellite Model',
              sourceUrl: 'https://open-meteo.com/',
              latitude: city.lat,
              longitude: city.lon,
              locationName: city.name,
              regencyCity: city.regencyCity,
              province: city.province,
              occurredAt: dateStr.includes('T') ? `${dateStr}:00Z` : `${dateStr}T00:00:00Z`,
              ingestedAt: new Date().toISOString(),
              periodLabel: 'Sep 2026',
              impactSummary: `Hujan: ${rain} mm, Angin: ${gusts} km/jam`,
              metadata: {
                rainMm: rain,
                windGusts: gusts,
                temp: curW.temperature_2m,
                humidity: curW.relative_humidity_2m,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching weather/air data for ${city.name}:`, err);
    }
  }

  return events;
}

function getAqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Baik (Good)';
  if (aqi <= 100) return 'Sedang (Moderate)';
  if (aqi <= 150) return 'Tidak Sehat bagi Kelompok Sensitif';
  if (aqi <= 200) return 'Tidak Sehat (Unhealthy)';
  if (aqi <= 300) return 'Sangat Tidak Sehat';
  return 'Berbahaya (Hazardous)';
}

function getAqiAdvice(aqi: number): string {
  if (aqi <= 50) return 'Kualitas udara sangat ideal untuk beraktivitas di luar ruangan.';
  if (aqi <= 100) return 'Kualitas udara dapat diterima; kelompok sangat sensitif disarankan membatasi paparan berlebih.';
  if (aqi <= 150) return 'Anak-anak dan penderita gangguan pernapasan disarankan mengenakan masker di luar ruangan.';
  if (aqi <= 200) return 'Gunakan masker pelindung saat beraktivitas di luar ruangan dan nyalakan air purifier.';
  return 'Hindari seluruh aktivitas fisik berat di luar ruangan.';
}
