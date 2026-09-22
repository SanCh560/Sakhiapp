/**
 * Sakhi Solo Female Travel Companion - Domain Entities & Models
 * 
 * Includes:
 * 1. Traveller
 * 2. Trip
 * 3. Destination
 * 4. Accommodation
 * 5. Itinerary
 * 6. Recommendation
 * 7. Travel Memory
 * 8. Offline Travel Pack
 */

/**
 * 1. Traveller Entity
 */
export function createTraveller(data = {}) {
  return {
    id: data.id || 'traveller-default',
    name: data.name || '',
    email: data.email || '',
    homeCountry: data.homeCountry || 'United States',
    preferredCurrency: data.preferredCurrency || (data.homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(data.homeCountry) ? 'EUR' : 'USD')),
    avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isVerified: data.isVerified ?? false,
    passportNumber: data.passportNumber !== undefined ? data.passportNumber : '',
    passportExpiry: data.passportExpiry !== undefined ? data.passportExpiry : '',
    emergencyContactPerson: data.emergencyContactPerson !== undefined ? data.emergencyContactPerson : '',
    emergencyContactPhone: data.emergencyContactPhone !== undefined ? data.emergencyContactPhone : '',
    licenseNumber: data.licenseNumber !== undefined ? data.licenseNumber : '',
    licenseExpiry: data.licenseExpiry !== undefined ? data.licenseExpiry : '',
    pushNotifications: data.pushNotifications ?? true,
    emailAlerts: data.emailAlerts ?? true,
    calendarSynced: data.calendarSynced ?? false,
    experienceLevel: data.experienceLevel || 'First-Time Solo Female Traveller',
    budgetTier: data.budgetTier || 'Balanced ($$)',
    accPreference: data.accPreference || 'Hostel / Female Pods',
    transportPref: data.transportPref || 'Public Transit & Metro',
    adventureVibe: data.adventureVibe || 'Calm, Quiet & Traditional',
    placesToVisit: data.placesToVisit || '',
    preferredTransport: data.preferredTransport || '',
    tripEnergyMotivation: data.tripEnergyMotivation || '',
    naturalLanguagePreferences: data.naturalLanguagePreferences || '',
    aiAdaptiveLearning: data.aiAdaptiveLearning ?? true,
    joinedDate: data.joinedDate || 'Aug 2026'
  };
}

/**
 * 2. Trip Entity
 */
export function createTrip(data = {}) {
  const isBooked = data.tripStatus === 'already-booked';
  return {
    id: data.id || 'trip-default',
    travellerId: data.travellerId || 'traveller-default',
    destId: data.destId || null,
    tripStatus: data.tripStatus || 'needs-planning', // 'needs-planning' | 'already-booked'
    startDate: data.startDate || '2026-08-10',
    endDate: data.endDate || '2026-08-15',
    durationDays: data.durationDays || 5,
    flightNumber: data.flightNumber || '',
    arrivalTime: data.arrivalTime || '14:00',
    departureTime: data.departureTime || '',
    destinationAirport: data.destinationAirport || '',
    airline: data.airline || '',
    flightConfirmed: data.flightConfirmed ?? (isBooked && !!data.flightNumber),
    departureFlightConfirmed: data.departureFlightConfirmed ?? false,
    departureFlightNumber: data.departureFlightNumber || '',
    departureAirline: data.departureAirline || '',
    departureDate: data.departureDate || '',
    departureAirport: data.departureAirport || '',
    returnAirport: data.returnAirport || '',
    planStatus: data.planStatus || 'suggested',
    bookedStayName: data.bookedStayName || '',
    stayAddress: data.stayAddress || '',
    stayConfirmed: data.stayConfirmed ?? (isBooked && !!data.bookedStayName),
    isActive: data.isActive ?? true
  };
}

/**
 * 3. Destination Entity
 */
export function createDestination(data = {}) {
  return {
    id: data.id,
    cityName: data.cityName,
    country: data.country,
    heroImage: data.heroImage,
    flag: data.flag,
    currency: data.currency,
    currencyCode: data.currencyCode,
    exchangeRateToUSD: data.exchangeRateToUSD,
    language: data.language,
    timezone: data.timezone,
    overallSafetyRating: data.overallSafetyRating,
    safetyBadge: data.safetyBadge,
    lat: data.lat,
    lng: data.lng,
    currentWeather: data.currentWeather || { temp: '22°C', condition: 'Sunny', icon: '☀️' },
    emergencyContacts: data.emergencyContacts || [],
    offlineFlashcards: data.offlineFlashcards || [],
    accommodations: data.accommodations || [],
    arrivalRoutes: data.arrivalRoutes || [],
    soloSpots: data.soloSpots || [],
    etiquetteTips: data.etiquetteTips || [],
    foodHighlights: data.foodHighlights || [],
    journalEntries: data.journalEntries || []
  };
}

/**
 * 4. Accommodation Entity
 */
export function createAccommodation(data = {}) {
  return {
    id: data.id,
    destId: data.destId,
    name: data.name,
    type: data.type, // 'Hostel' | 'Hotel' | 'Co-share Apartment'
    neighborhood: data.neighborhood,
    pricePerNight: data.pricePerNight,
    priceValue: data.priceValue || 45,
    rating: data.rating,
    reviewsCount: data.reviewsCount,
    reviewBadge: data.reviewBadge,
    paymentMethod: data.paymentMethod,
    image: data.image,
    bookingLink: data.bookingLink,
    gmapsQuery: data.gmapsQuery,
    providerName: data.providerName,
    safetyFeatures: data.safetyFeatures || [],
    rawWhyChosen: data.whyChosen
  };
}

/**
 * 5. Itinerary Entity
 */
export function createItinerary(data = {}) {
  return {
    id: data.id || `itinerary-${data.tripId}`,
    tripId: data.tripId,
    dayNumber: data.dayNumber || 1,
    title: data.title || 'Day 1 Exploration',
    scheduledItems: data.scheduledItems || [],
    energyTarget: data.energyTarget || 'Moderate'
  };
}

/**
 * 6. Recommendation Entity (Unified Structure across Stays, Restaurants, Routes, Activities)
 */
export function createRecommendation(item, matchMetrics) {
  return {
    item,
    matchScore: {
      overall: matchMetrics.overall,
      safety: matchMetrics.safety,
      personalFit: matchMetrics.personalFit,
      comfort: matchMetrics.comfort,
      convenience: matchMetrics.convenience
    },
    whyChosen: matchMetrics.whyChosen,
    safetyHighlights: matchMetrics.safetyHighlights || item.safetyFeatures || [item.lightingScore]
  };
}

/**
 * 7. Travel Memory Entity
 */
export function createTravelMemory(data = {}) {
  return {
    id: data.id || `mem-${Date.now()}`,
    tripId: data.tripId,
    cityName: data.cityName,
    country: data.country,
    day: data.day || 'Day 1',
    date: data.date || new Date().toLocaleDateString(),
    title: data.title || 'Golden Hour Walk',
    location: data.location || 'City Center',
    mood: data.mood || 'Empowered ✨',
    content: data.content || '',
    image: data.image || '',
    visitedPlaces: data.visitedPlaces || [],
    stats: data.stats || { steps: '10,000', safetyRating: '10/10 Safe' }
  };
}

/**
 * 8. Offline Travel Pack Entity
 */
export function createOfflineTravelPack(data = {}) {
  return {
    id: data.id || `pack-${data.destId}`,
    destId: data.destId,
    cityName: data.cityName,
    sizeMB: data.sizeMB || 38,
    isDownloaded: data.isDownloaded ?? false,
    vectorMapTileCount: data.vectorMapTileCount || 1420,
    offlineCorridors: data.offlineCorridors || [],
    emergencyContacts: data.emergencyContacts || [],
    audioFlashcards: data.audioFlashcards || [],
    lastCachedTimestamp: data.lastCachedTimestamp || new Date().toISOString()
  };
}
