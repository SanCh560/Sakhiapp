/**
 * Sakhi Intelligent Multi-Currency Budget Calculator Service
 * 
 * Calculates realistic, destination-aware, and user-tailored travel budgets:
 * - Factors in the specific destination's cost-of-living tier
 * - Factors in travellerProfile.budgetTier ('Budget ($)', 'Balanced ($$)', 'Luxury ($$$)')
 * - Sourced directly from actual booked or vetted accommodation prices
 * - Sourced from route-specific flights (homeCountry -> destinationCountry)
 * - Converts seamlessly to local destination currency via live exchange rates
 */

// City Cost-of-Living Tiers
const CITY_TIERS = {
  // Tier 1: Premium / High Cost
  'reykjavik': 'premium',
  'tokyo': 'premium',
  'london': 'premium',
  'paris': 'premium',
  'new york': 'premium',
  'zurich': 'premium',
  'oslo': 'premium',
  'sydney': 'premium',
  'copenhagen': 'premium',

  // Tier 2: Moderate / European Average
  'florence': 'moderate',
  'rome': 'moderate',
  'madrid': 'moderate',
  'barcelona': 'moderate',
  'lisbon': 'moderate',
  'prague': 'moderate',
  'berlin': 'moderate',
  'vienna': 'moderate',
  'amsterdam': 'premium',
  'edinburgh': 'moderate',
  'dublin': 'premium',

  // Tier 3: Value / Emerging Solo Safe
  'budapest': 'value',
  'krakow': 'value',
  'bangkok': 'value',
  'chiang mai': 'value',
  'bali': 'value',
  'seoul': 'moderate',
  'taipei': 'moderate',
  'mexico city': 'value'
};

function getCityCostTier(cityName = '') {
  const clean = cityName.toLowerCase().trim();
  for (const [key, tier] of Object.entries(CITY_TIERS)) {
    if (clean.includes(key) || key.includes(clean)) return tier;
  }
  return 'moderate';
}

/**
 * Estimate Flight Cost based on route distance between Home Country and Destination
 */
export function estimateFlightCost({ homeCountry = 'United States', destinationCountry = '', recommendedFlights = [], tripConfig = {} }) {
  // If user has a confirmed flight with a known price in recommendedFlights
  if (tripConfig?.flightNumber && recommendedFlights.length > 0) {
    const matched = recommendedFlights.find(f => f.flightNumber === tripConfig.flightNumber);
    if (matched && matched.priceValue) {
      return matched.priceValue;
    }
  }

  // If recommended flights are provided, use the lowest/top recommendation price
  if (recommendedFlights.length > 0 && recommendedFlights[0].priceValue) {
    return recommendedFlights[0].priceValue;
  }

  const cleanHome = (homeCountry || '').toLowerCase().trim();
  const cleanDest = (destinationCountry || '').toLowerCase().trim();

  // Domestic travel
  if (cleanHome && cleanDest && (cleanHome === cleanDest || cleanHome.includes(cleanDest) || cleanDest.includes(cleanHome))) {
    return 220;
  }

  // Common continental regions
  const isEurope = (country) => ['united kingdom', 'france', 'germany', 'italy', 'spain', 'czech republic', 'iceland', 'portugal', 'netherlands', 'austria', 'ireland'].some(c => country.includes(c));
  const isNorthAmerica = (country) => ['united states', 'canada', 'mexico'].some(c => country.includes(c));
  const isAsia = (country) => ['japan', 'india', 'thailand', 'south korea', 'taiwan', 'singapore', 'indonesia'].some(c => country.includes(c));

  if (isEurope(cleanHome) && isEurope(cleanDest)) return 180;
  if (isNorthAmerica(cleanHome) && isNorthAmerica(cleanDest)) return 280;
  if (isAsia(cleanHome) && isAsia(cleanDest)) return 290;

  // Transatlantic (North America <-> Europe)
  if ((isNorthAmerica(cleanHome) && isEurope(cleanDest)) || (isEurope(cleanHome) && isNorthAmerica(cleanDest))) {
    return 560;
  }

  // Transpacific (North America <-> Asia)
  if ((isNorthAmerica(cleanHome) && isAsia(cleanDest)) || (isAsia(cleanHome) && isNorthAmerica(cleanDest))) {
    return 880;
  }

  // Europe <-> Asia
  if ((isEurope(cleanHome) && isAsia(cleanDest)) || (isAsia(cleanHome) && isEurope(cleanDest))) {
    return 720;
  }

  // Australia / Oceania long haul
  if (cleanHome.includes('australia') || cleanDest.includes('australia')) {
    return 950;
  }

  // Global default international flight estimate
  return 620;
}

/**
 * Calculate Comprehensive Budget Estimation
 */
export const HOME_CURRENCY_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 154.5,
  INR: 83.5,
  CHF: 0.90,
  NZD: 1.65
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
  CHF: 'CHF',
  NZD: 'NZ$',
  CZK: 'Kč'
};

/**
 * Format a price value (given in USD base) into the user's home currency.
 * @param {number|string} amountUSD - The amount in USD
 * @param {string} homeCurrencyCode - e.g. 'GBP', 'EUR', 'USD'
 * @returns {string} - Formatted price string e.g. "£320" or "€377" or "$410"
 */
export function formatPrice(amountUSD, homeCurrencyCode = 'USD') {
  if (amountUSD === undefined || amountUSD === null) return '';
  const num = typeof amountUSD === 'number' ? amountUSD : parseFloat(String(amountUSD).replace(/[^0-9.]/g, '')) || 0;
  const rate = HOME_CURRENCY_RATES[homeCurrencyCode] || 1.0;
  const symbol = CURRENCY_SYMBOLS[homeCurrencyCode] || '$';
  const converted = Math.round(num * rate);
  return `${symbol}${converted}`;
}

export function calculateBudgetEstimation({
  destinationData,
  tripConfig,
  travellerProfile,
  recommendedFlights = []
}) {
  const durationDays = tripConfig?.durationDays || 5;
  const cityName = destinationData?.cityName || 'Destination';
  const countryName = destinationData?.country || '';
  const tier = getCityCostTier(cityName);
  const userBudgetTier = travellerProfile?.budgetTier || 'Balanced ($$)';
  const homeCountry = travellerProfile?.homeCountry || 'United States';

  // Determine user's home/preferred currency
  const homeCurrencyCode = travellerProfile?.preferredCurrency || (homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(homeCountry) ? 'EUR' : 'USD'));
  const homeRate = HOME_CURRENCY_RATES[homeCurrencyCode] || 1.0;
  const homeCurrencySymbol = CURRENCY_SYMBOLS[homeCurrencyCode] || '$';

  // 1. Accommodation Cost in USD base
  let stayCostPerNightUSD = 80;
  if (tripConfig?.bookedStayName && destinationData?.accommodations?.length > 0) {
    const bookedStay = destinationData.accommodations.find(a => a.name === tripConfig.bookedStayName);
    if (bookedStay && bookedStay.priceValue) {
      stayCostPerNightUSD = bookedStay.priceValue;
    } else if (bookedStay && bookedStay.pricePerNight) {
      const parsed = parseInt(bookedStay.pricePerNight.replace(/[^0-9]/g, ''), 10);
      if (parsed) stayCostPerNightUSD = parsed;
    }
  } else if (destinationData?.accommodations?.length > 0) {
    // Average price of vetted accommodations
    const prices = destinationData.accommodations
      .map(a => a.priceValue || parseInt((a.pricePerNight || '').replace(/[^0-9]/g, ''), 10))
      .filter(p => !isNaN(p) && p > 0);

    if (prices.length > 0) {
      const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      if (userBudgetTier.includes('Budget')) {
        stayCostPerNightUSD = Math.min(...prices);
      } else if (userBudgetTier.includes('Luxury')) {
        stayCostPerNightUSD = Math.max(...prices);
      } else {
        stayCostPerNightUSD = avg;
      }
    }
  } else {
    // Dynamic fallback based on city cost tier and user profile tier
    if (userBudgetTier.includes('Budget')) {
      stayCostPerNightUSD = tier === 'premium' ? 55 : tier === 'moderate' ? 40 : 25;
    } else if (userBudgetTier.includes('Luxury')) {
      stayCostPerNightUSD = tier === 'premium' ? 240 : tier === 'moderate' ? 180 : 120;
    } else {
      stayCostPerNightUSD = tier === 'premium' ? 110 : tier === 'moderate' ? 80 : 50;
    }
  }

  // 2. Food & Meals Cost per Day in USD base
  let foodCostPerDayUSD = 40;
  if (userBudgetTier.includes('Budget')) {
    foodCostPerDayUSD = tier === 'premium' ? 35 : tier === 'moderate' ? 25 : 15;
  } else if (userBudgetTier.includes('Luxury')) {
    foodCostPerDayUSD = tier === 'premium' ? 130 : tier === 'moderate' ? 95 : 60;
  } else {
    foodCostPerDayUSD = tier === 'premium' ? 60 : tier === 'moderate' ? 45 : 30;
  }

  // 3. Local Transit Cost per Day in USD base
  let transitCostPerDayUSD = 12;
  if (tier === 'premium') transitCostPerDayUSD = 16;
  else if (tier === 'moderate') transitCostPerDayUSD = 10;
  else transitCostPerDayUSD = 6;

  // 4. Flight Cost in USD base
  const flightEstCostUSD = estimateFlightCost({
    homeCountry,
    destinationCountry: countryName,
    recommendedFlights,
    tripConfig
  });

  // 5. Compute Totals in USD base
  const totalStayCostUSD = stayCostPerNightUSD * durationDays;
  const totalFoodCostUSD = foodCostPerDayUSD * durationDays;
  const totalTransitCostUSD = transitCostPerDayUSD * durationDays;
  const totalEstimatedCostUSD = totalStayCostUSD + totalFoodCostUSD + totalTransitCostUSD + flightEstCostUSD;

  // 6. Convert to User's Home Currency
  const stayCostPerNight = Math.round(stayCostPerNightUSD * homeRate);
  const totalStayCost = Math.round(totalStayCostUSD * homeRate);
  const foodCostPerDay = Math.round(foodCostPerDayUSD * homeRate);
  const totalFoodCost = Math.round(totalFoodCostUSD * homeRate);
  const transitCostPerDay = Math.round(transitCostPerDayUSD * homeRate);
  const totalTransitCost = Math.round(totalTransitCostUSD * homeRate);
  const flightEstCost = Math.round(flightEstCostUSD * homeRate);
  const totalEstimatedCost = Math.round(totalEstimatedCostUSD * homeRate);

  // 7. Destination Local Currency Conversion
  const exchangeRate = destinationData?.exchangeRateToUSD || 1;
  const currencyCode = destinationData?.currencyCode || 'USD';
  const currencySymbol = destinationData?.currency || '$';
  const localEstimatedTotal = Math.round(totalEstimatedCostUSD * exchangeRate);

  return {
    durationDays,
    cityName,
    homeCurrencyCode,
    homeCurrencySymbol,
    stayCostPerNight,
    totalStayCost,
    foodCostPerDay,
    totalFoodCost,
    transitCostPerDay,
    totalTransitCost,
    flightEstCost,
    totalEstimatedCost,
    currencyCode,
    currencySymbol,
    exchangeRate,
    localEstimatedTotal
  };
}
