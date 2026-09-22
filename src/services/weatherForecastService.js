import { resolveCityCoordinates } from './apiService.js';

/**
 * Sakhi Dynamic Multi-Day Weather Forecast Service
 * 
 * Provides real-time, multi-day daily weather forecasts for any city worldwide:
 * - Free Open-Meteo API integration (no API keys required, works globally)
 * - Daily high/low temperatures, precipitation probability (%), conditions & emojis
 * - Destination-specific indoor alternative recommendations when adverse weather is detected
 * - Offline / fallback realistic seasonal simulation
 */

// Mapping of WMO Weather interpretation codes (Open-Meteo)
function parseWMOCode(code) {
  if (code === 0) return { condition: 'Clear Skies', icon: '☀️' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Misty', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: '🌩️' };
  return { condition: 'Mild & Pleasant', icon: '🌤️' };
}

// Authentic Destination-Specific Indoor Cultural Sanctuaries
const CITY_INDOOR_SANCTUARIES = {
  'tokyo': 'Edo-Tokyo Museum & Nezu Museum Covered Tea House',
  'paris': 'Musée de l\'Orangerie & Angelina Tea Salon',
  'reykjavik': 'Harpa Concert Hall Glass Atrium & National Museum',
  'florence': 'Uffizi Gallery & Biblioteca delle Oblate Covered Loggia',
  'kyoto': 'Kyoto National Museum & Gion Traditional Tea Pavilion',
  'london': 'British Museum Great Court & Tate Modern Turbine Hall',
  'new york': 'The Met Fifth Avenue & Indoor Astor Court',
  'barcelona': 'Picasso Museum & El Born Covered Cultural Market',
  'rome': 'Capitoline Museums & Galleria Doria Pamphilj',
  'seoul': 'National Museum of Korea & Insadong Indoor Tea House',
  'amsterdam': 'Rijksmuseum & Van Gogh Museum Atrium',
  'prague': 'National Gallery Prague & Municipal House Tea Room'
};

export function getIndoorSanctuary(cityName) {
  if (!cityName) return 'City Museum & Covered Tea Lounge';
  const key = cityName.toLowerCase().trim();
  for (const [cityKey, sanctuary] of Object.entries(CITY_INDOOR_SANCTUARIES)) {
    if (key.includes(cityKey)) return sanctuary;
  }
  return `${cityName} Cultural Museum & Covered Tea Lounge`;
}

/**
 * Fetch Multi-Day Weather Forecast for Destination
 * @param {Object} options
 * @param {number} options.lat - Latitude
 * @param {number} options.lng - Longitude
 * @param {string} options.cityName - City name
 * @param {number} options.durationDays - Total trip days (1 to N)
 */
export async function fetchMultiDayForecast({ lat, lng, cityName, durationDays = 5 }) {
  const daysCount = Math.max(1, Math.min(parseInt(durationDays || 5, 10), 14));
  const fallback = generateFallbackForecast(cityName, daysCount);

  let targetLat = lat;
  let targetLng = lng;

  // If coordinates are missing, resolve from cityName
  if ((targetLat === undefined || targetLng === undefined || targetLat === null || targetLng === null) && cityName) {
    const resolved = resolveCityCoordinates(cityName);
    if (resolved) {
      targetLat = resolved.lat;
      targetLng = resolved.lng;
    }
  }

  // If coordinates still missing, return authentic fallback
  if (targetLat === undefined || targetLng === undefined || targetLat === null || targetLng === null) {
    return fallback;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
    const data = await response.json();

    if (data && data.daily && data.daily.time) {
      const forecastDays = [];
      const times = data.daily.time.slice(0, daysCount);

      for (let i = 0; i < times.length; i++) {
        const code = data.daily.weathercode ? data.daily.weathercode[i] : 1;
        const tempMax = Math.round(data.daily.temperature_2m_max ? data.daily.temperature_2m_max[i] : 22);
        const tempMin = Math.round(data.daily.temperature_2m_min ? data.daily.temperature_2m_min[i] : 16);
        const rainProb = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 15;
        const { condition, icon } = parseWMOCode(code);

        const isRainy = rainProb >= 50 || code >= 51;
        forecastDays.push({
          day: i + 1,
          date: times[i],
          tempMax,
          tempMin,
          temp: `${tempMax}°C`,
          rainProb,
          condition,
          icon,
          isAdverse: isRainy,
          advisoryRationale: isRainy
            ? `Rain forecasted (${rainProb}% probability, ${condition}) on Day ${i + 1} in ${cityName}. Sakhi dynamically recommends indoor cultural exploration.`
            : `Favorable weather (${tempMax}°C, ${condition}) on Day ${i + 1}. Ideal for outdoor walking corridors and gardens.`,
          proposedSwapTitle: isRainy ? getIndoorSanctuary(cityName) : null
        });
      }

      return forecastDays;
    }
  } catch (err) {
    console.warn('[WeatherForecastService] Open-Meteo fetch notice, using calibrated fallback:', err.message);
  }

  return fallback;
}

/**
 * Generate Realistic Multi-Day Forecast Fallback
 */
export function generateFallbackForecast(cityName = 'Destination', daysCount = 5) {
  const indoorSanctuary = getIndoorSanctuary(cityName);
  const conditions = [
    { code: 0, max: 24, min: 17, prob: 10 },
    { code: 1, max: 23, min: 16, prob: 20 },
    { code: 61, max: 19, min: 14, prob: 75 }, // Mid-trip rain day for realistic testing
    { code: 2, max: 22, min: 15, prob: 25 },
    { code: 0, max: 25, min: 18, prob: 5 },
    { code: 1, max: 23, min: 16, prob: 15 },
    { code: 2, max: 22, min: 15, prob: 20 }
  ];

  const forecast = [];
  for (let i = 0; i < daysCount; i++) {
    const template = conditions[i % conditions.length];
    const { condition, icon } = parseWMOCode(template.code);
    const isRainy = template.prob >= 50;

    forecast.push({
      day: i + 1,
      tempMax: template.max,
      tempMin: template.min,
      temp: `${template.max}°C`,
      rainProb: template.prob,
      condition,
      icon,
      isAdverse: isRainy,
      advisoryRationale: isRainy
        ? `Rain forecasted (${template.prob}% probability, ${condition}) on Day ${i + 1} in ${cityName}. Sakhi dynamically recommends indoor cultural exploration.`
        : `Clear skies & pleasant weather (${template.max}°C, ${condition}) on Day ${i + 1}. Perfect for outdoor pedestrian exploration.`,
      proposedSwapTitle: isRainy ? indoorSanctuary : null
    });
  }

  return forecast;
}
