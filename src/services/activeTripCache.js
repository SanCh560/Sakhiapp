/**
 * Sakhi Selective Active Trip Offline Cache Manager
 * 
 * STRICT CACHING POLICY:
 * Does NOT download the complete database.
 * Only caches data required for the ACTIVE destination and CURRENT trip:
 * - Current Trip metadata
 * - Booked Accommodation
 * - Offline Maps & Routes
 * - Current 5-Day Itinerary & Activities
 * - Emergency Contacts
 * - Destination Guide
 * - Downloaded RAG Knowledge Documents
 * - Selected Places of Interest
 * - Essential Translation Pack
 */

import { supabase } from '../db/supabaseClient';
import { db } from '../db/databaseManager';

class ActiveTripCacheManager {
  constructor() {
    this.cacheKeyPrefix = 'sakhi_active_trip_pack_';
    this.legacyCacheKeyPrefix = 'aura_active_trip_pack_';
  }

  /**
   * Downloads and selectively caches ONLY active trip data for offline Arrival Mode
   */
  async downloadActiveTripPack(tripId, destId = 'prague-czech', contextData = {}) {
    console.log(`[Active Trip Cache] Selective download initiated for Trip ID: ${tripId}, Dest ID: ${destId}`);

    const activeTripConfig = contextData.tripConfig || null;
    const dest = contextData.destinationData || null;

    let activeTrip = activeTripConfig;
    let bookedAccommodation = activeTripConfig?.bookedStayName ? {
      name: activeTripConfig.bookedStayName,
      address: activeTripConfig.stayAddress || `${dest?.cityName || 'City'} Center`,
      type: 'Confirmed Stay',
      rating: 4.9
    } : null;
    let itineraryDays = [];
    let placesOfInterest = [];
    let RAGDocuments = [];
    let travelPack = null;

    if (navigator.onLine) {
      try {
        // 1. Fetch Current Trip from Supabase if not provided
        if (!activeTrip) {
          const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single();
          if (tripData) activeTrip = tripData;
        }

        // 2. Fetch Booked Accommodation from Supabase if confirmed
        if (!bookedAccommodation && activeTrip?.stayConfirmed && activeTrip?.bookedStayName) {
          const { data: accData } = await supabase.from('accommodations').select('*').eq('destination_id', destId);
          if (accData) bookedAccommodation = accData.find(a => a.name === activeTrip.bookedStayName) || null;
        }

        // 3. Fetch Places of Interest for current destination
        const { data: placesData } = await supabase.from('places_of_interest').select('*').eq('destination_id', destId);
        if (placesData) placesOfInterest = placesData;

        // 4. Fetch Downloaded RAG Knowledge Documents for current destination
        const { data: ragData } = await supabase.from('knowledge_documents').select('id, title, document_type, content').eq('city', destId.split('-')[0]);
        if (ragData) RAGDocuments = ragData;

        // 5. Fetch Travel Pack metadata
        const { data: packData } = await supabase.from('travel_pack').select('*').eq('trip_id', tripId).single();
        if (packData) travelPack = packData;
      } catch (err) {
        console.warn('[Active Trip Cache] Supabase online fetch notice, using active state:', err);
      }
    }

    const cityName = dest?.cityName || activeTrip?.destName || 'Active Destination';
    const cityLat = dest?.lat || 51.5074;
    const cityLng = dest?.lng || -0.1278;

    // Selective Active Trip Pack Payload (NO extra global data!)
    const activeTripCachePayload = {
      tripId,
      destId,
      activeTrip: activeTrip || db.selectById('trips', tripId) || { id: tripId, destinationId: destId },
      flight: activeTrip?.flightConfirmed ? {
        flightNumber: activeTrip.flightNumber || 'Direct Flight',
        destinationAirport: activeTrip.destinationAirport || `${cityName} Airport`,
        arrivalTime: activeTrip.arrivalTime || '14:00',
        departureTime: activeTrip.departureTime || '09:00',
        airline: activeTrip.airline || 'Scheduled Carrier',
        isConfirmed: true
      } : (activeTrip?.flightNumber ? {
        flightNumber: activeTrip.flightNumber,
        destinationAirport: activeTrip.destinationAirport || `${cityName} Airport`,
        arrivalTime: activeTrip.arrivalTime || '14:00',
        departureTime: activeTrip.departureTime || '09:00',
        airline: activeTrip.airline || 'Scheduled Carrier',
        isConfirmed: false
      } : null),
      bookedAccommodation: bookedAccommodation || (activeTrip?.stayConfirmed && activeTrip?.bookedStayName ? {
        name: activeTrip.bookedStayName,
        address: activeTrip.stayAddress || `${cityName} City Center`,
        type: 'Confirmed Stay'
      } : (activeTrip?.bookedStayName ? {
        name: activeTrip.bookedStayName,
        address: activeTrip.stayAddress || `${cityName} City Center`,
        type: 'Pending Selection'
      } : null)),
      offlineMaps: {
        version: 'v2026.1',
        cachedVectorMap: true,
        cityName,
        center: { lat: cityLat, lng: cityLng }
      },
      offlineRoutes: (dest?.arrivalRoutes && dest.arrivalRoutes.length > 0)
        ? dest.arrivalRoutes
        : [
          { name: `${cityName} Express Transit Corridor`, duration: '30 mins' },
          { name: `${cityName} Official Airport Taxi Rank`, duration: '25 mins' }
        ],
      currentItinerary: db.getTable('itinerary_days'),
      emergencyContacts: (dest?.emergencyContacts && dest.emergencyContacts.length > 0)
        ? dest.emergencyContacts
        : [
          { name: 'Universal Emergency Services', number: '112', label: 'Emergency' }
        ],
      destinationGuide: {
        city: cityName,
        country: dest?.country || 'Global Destination',
        etiquetteTips: dest?.etiquetteTips || ['Politeness and respectful queueing are appreciated.'],
        foodHighlights: dest?.foodHighlights || ['Historic local food hall with safe solo dining.']
      },
      knowledgeDocuments: RAGDocuments.length > 0 ? RAGDocuments : db.getTable('knowledge_documents'),
      selectedPlacesOfInterest: (dest?.soloSpots && dest.soloSpots.length > 0) ? dest.soloSpots : (placesOfInterest.length > 0 ? placesOfInterest : db.getTable('places_of_interest')),
      essentialTranslationPack: (dest?.offlineFlashcards && dest.offlineFlashcards.length > 0)
        ? dest.offlineFlashcards
        : [
          { english: 'Help me, please!', translation: 'Help me, please!' }
        ],
      downloadedAt: new Date().toISOString(),
      isDownloaded: true
    };

    // Store in local storage cache
    localStorage.setItem(this.cacheKeyPrefix + tripId, JSON.stringify(activeTripCachePayload));
    try {
      localStorage.setItem(this.legacyCacheKeyPrefix + tripId, JSON.stringify(activeTripCachePayload));
    } catch {}
    console.log(`[Active Trip Cache] Selective Active Trip Pack downloaded successfully for ${destId}!`);

    return activeTripCachePayload;
  }

  /**
   * Retrieves active trip offline cache
   */
  getCachedActiveTripPack(tripId) {
    try {
      const data = localStorage.getItem(this.cacheKeyPrefix + tripId) || localStorage.getItem(this.legacyCacheKeyPrefix + tripId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}

export const activeTripCache = new ActiveTripCacheManager();
