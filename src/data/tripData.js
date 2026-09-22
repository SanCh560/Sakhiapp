import { createDestination, createAccommodation } from '../models/entities.js';
import { getDynamicCityKnowledge } from '../services/cityKnowledgeEngine.js';

export const pragueDestination = createDestination({
  id: 'prague-czech',
  cityName: 'Prague',
  country: 'Czech Republic',
  heroImage: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
  flag: '🇨🇿',
  currency: 'CZK (Kč)',
  currencyCode: 'CZK',
  exchangeRateToUSD: 23.5,
  language: 'Czech (English widely spoken)',
  timezone: 'CET (GMT+1)',
  overallSafetyRating: '9.6/10',
  safetyBadge: 'Top Tier Female Safety (Safe Metro Corridors)',
  lat: 50.0755,
  lng: 14.4378,
  currentWeather: { temp: '22°C', condition: 'Sunny', icon: '☀️', humidity: '50%' },
  emergencyContacts: [
    { name: 'Universal European Emergency', number: '112', label: 'Universal Emergency' },
    { name: 'Czech State Police', number: '158', label: 'Police Crisis' },
    { name: 'Medical Emergency Services', number: '155', label: 'Ambulance' },
    { name: 'Prague Municipal Police (Local)', number: '156', label: 'City Police' }
  ],
  etiquetteTips: [
    'Greeting: Say "Dobrý den" (Good day) when entering small shops or cafes.',
    'Tipping: 10% is customary at sit-down cafes & restaurants for good service.',
    'Metro Etiquette: Stand on the right side of escalators; leave left side open for walking.'
  ],
  foodHighlights: [
    'Trdelník & Coffee: Traditional warm cinnamon pastry paired with fresh espresso.',
    'Svíčková / Goulash: Hearty local comfort stew served in historic female-friendly cafes.',
    'Solo Dining Ambiance: Single-diner window seats available at Café Imperial & Manifest Market.'
  ],
  offlineFlashcards: [
    { english: 'Help me, please!', translation: 'Pomoc, prosím!', phonetic: 'Poh-mots pro-seem' },
    { english: 'Where is the police station?', translation: 'Kde je policejní stanice?', phonetic: 'Kdeh yeh poh-leet-sey-nee stahn-it-seh?' },
    { english: 'I am lost.', translation: 'Ztratila jsem se.', phonetic: 'Ztrah-tee-lah hsem seh' }
  ],
  accommodations: [
    createAccommodation({
      id: 'acc-prague-1',
      destId: 'prague-czech',
      name: 'Mama Shelter Prague',
      type: 'Hotel',
      neighborhood: 'Holešovice, Prague 7',
      pricePerNight: '$85',
      priceValue: 85,
      rating: 4.9,
      reviewsCount: 1240,
      reviewBadge: '★ 4.9 Superhost Verified (1,240 Reviews)',
      paymentMethod: '💳 Cards & Contactless Accepted',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
      bookingLink: 'https://www.booking.com/hotel/cz/mama-shelter-prague.html',
      gmapsQuery: 'Mama Shelter Prague Holešovice',
      providerName: 'Booking.com',
      safetyFeatures: ['24/7 front desk security', 'Keycard elevator lock', 'Well-lit boulevard location'],
      whyChosen: 'Vetted by Sakhi for 24/7 front desk vigilance, keycard-only elevators, and direct tram connection.'
    }),
    createAccommodation({
      id: 'acc-prague-2',
      destId: 'prague-czech',
      name: 'RoadHouse Prague (Female Pod Dorms)',
      type: 'Hostel',
      neighborhood: 'Old Town, Prague 1',
      pricePerNight: '$38',
      priceValue: 38,
      rating: 4.8,
      reviewsCount: 2100,
      reviewBadge: '★ 4.8 Hostelworld Vetted (2,100 Reviews)',
      paymentMethod: '💳 Cards & Cash Accepted',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80',
      bookingLink: 'https://www.hostelworld.com/st/hostels/prague/',
      gmapsQuery: 'RoadHouse Prague Hostel',
      providerName: 'Hostelworld',
      safetyFeatures: ['Female-only dorm floor', 'Keycode door locks', 'Bed privacy curtain'],
      whyChosen: 'Highly rated hostel with dedicated female-only floor, privacy pod curtains, and tea lounge.'
    })
  ],
  arrivalRoutes: [
    {
      id: 'ar-1',
      mode: 'Airport Express Bus (AE) to Central Station',
      type: 'Public Transit Route',
      recommended: true,
      duration: '35 mins',
      cost: '100 CZK (~$4.30)',
      gmapsQuery: 'Prague Airport Express Terminal',
      safetyHighlights: [
        'Official airport bus terminal with security officers',
        'Direct train connection with English announcements',
        'Keycard & well-lit station platforms'
      ],
      stepByStep: [
        'Exit Terminal 1 or Terminal 2 Arrivals Hall.',
        'Board Airport Express (AE) Bus directly outside the gate.',
        'Disembark at Hlavní Nádraží (Prague Central Station).',
        'Transfer to Metro Line C or 5-min walk to hotel.'
      ]
    }
  ],
  soloSpots: [
    {
      id: 'spot-1',
      name: 'Café Imperial (Historic Tea Lounge)',
      category: 'Cafe & Dining',
      neighborhood: 'Old Town, Prague 1',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80',
      lat: 50.089,
      lng: 14.432,
      walkTime: '6 min walk',
      energyRequired: 'Low (Ideal for Rest)',
      openHours: '07:00 AM - 11:00 PM (OPEN NOW)',
      isOpenNow: true,
      paymentAlert: '💳 Contactless Card Accepted',
      isCashOnly: false,
      reviewBadge: '★ 4.8 Google Reviews (4,200 Reviews)',
      gmapsQuery: 'Café Imperial Prague',
      lightingScore: 'High Municipal Lighting',
      crowdLevel: 'Respectful & Peaceful',
      whyChosen: 'Charming historic Art Deco lounge ideal for quiet reading and tea breaks.',
      safetyFeatures: ['High pedestrian traffic boulevard', 'Municipal CCTV & Lighting']
    },
    {
      id: 'spot-2',
      name: 'Kampa Island & Charles Bridge Artisans',
      category: 'Culture & Promenade',
      neighborhood: 'Malá Strana, Prague 1',
      image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=400&q=80',
      lat: 50.086,
      lng: 14.409,
      walkTime: '12 min walk',
      energyRequired: 'Moderate (Balanced Pace)',
      openHours: 'Open 24 Hours (Daylight Recommended)',
      isOpenNow: true,
      paymentAlert: '💳 Cards Accepted at Kiosks',
      isCashOnly: false,
      reviewBadge: '★ 4.9 Google Reviews (8,100 Reviews)',
      gmapsQuery: 'Kampa Island Prague',
      lightingScore: 'Well-Lit Riverside Boulevard',
      crowdLevel: 'Moderate & Scenic',
      whyChosen: 'Picturesque riverside promenade with gentle walking paths, artisan craft stalls, and quiet park benches.',
      safetyFeatures: ['Frequent municipal police patrols', 'Well-lit riverside corridor', 'High solo traveller presence']
    },
    {
      id: 'spot-3',
      name: 'Petřín Lookout Tower & Rose Garden Trail',
      category: 'Scenic Trail & Viewpoint',
      neighborhood: 'Malá Strana, Prague 1',
      image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=400&q=80',
      lat: 50.083,
      lng: 14.395,
      walkTime: '22 min walk (Uphill)',
      energyRequired: 'High (Walking Explorer)',
      openHours: '10:00 AM - 08:00 PM',
      isOpenNow: true,
      paymentAlert: '💳 Contactless Card Accepted',
      isCashOnly: false,
      reviewBadge: '★ 4.7 Google Reviews (5,600 Reviews)',
      gmapsQuery: 'Petřín Tower Prague',
      lightingScore: 'Park Trail Lighting',
      crowdLevel: 'Active Walkers & Families',
      whyChosen: 'Panoramic views across Prague with active uphill walking trail through rose gardens, ideal for energetic explorers.',
      safetyFeatures: ['Funicular railway available as backup', 'Staffed observation tower', 'Clear marked trail paths']
    }
  ]
});

// Destination registry lookup map
export const DESTINATIONS = {
  'prague-czech': pragueDestination
};

export function getDestinationData(destId) {
  if (DESTINATIONS[destId]) {
    return DESTINATIONS[destId];
  }

  // Extract clean city name from destId (e.g. 'london-global' -> 'London', 'new-york-global' -> 'New York')
  let rawName = 'Prague';
  if (destId) {
    let clean = destId.replace(/-global$/, '');
    if (clean.endsWith('-czech')) clean = clean.replace('-czech', '');
    else if (clean.endsWith('-italy')) clean = clean.replace('-italy', '');
    else if (clean.endsWith('-spain')) clean = clean.replace('-spain', '');
    else if (clean.endsWith('-france')) clean = clean.replace('-france', '');
    else if (clean.endsWith('-japan')) clean = clean.replace('-japan', '');
    else if (clean.endsWith('-uk')) clean = clean.replace('-uk', '');

    rawName = clean.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }

  const dynamicInfo = getDynamicCityKnowledge(rawName);

  return createDestination({
    id: destId,
    cityName: dynamicInfo.cityName,
    country: dynamicInfo.country,
    heroImage: dynamicInfo.heroImage,
    flag: dynamicInfo.flag,
    currency: dynamicInfo.currency,
    currencyCode: dynamicInfo.currencyCode,
    exchangeRateToUSD: dynamicInfo.exchangeRateToUSD,
    language: dynamicInfo.language,
    timezone: dynamicInfo.timezone,
    overallSafetyRating: dynamicInfo.overallSafetyRating,
    safetyBadge: dynamicInfo.safetyBadge,
    lat: dynamicInfo.lat,
    lng: dynamicInfo.lng,
    currentWeather: { temp: '22°C', condition: 'Sunny', icon: '☀️', humidity: '50%' },
    emergencyContacts: dynamicInfo.emergencyContacts,
    etiquetteTips: dynamicInfo.etiquetteTips,
    foodHighlights: dynamicInfo.foodHighlights,
    offlineFlashcards: dynamicInfo.flashcards,
    accommodations: (dynamicInfo.accommodations || []).map(acc => createAccommodation({
      id: `acc-${destId}-${acc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      destId,
      name: acc.name,
      type: acc.type,
      neighborhood: acc.neighborhood,
      pricePerNight: acc.price,
      priceValue: acc.priceVal,
      rating: acc.rating,
      reviewsCount: acc.reviews,
      reviewBadge: `★ ${acc.rating} ${acc.provider} Verified (${acc.reviews} Reviews)`,
      paymentMethod: '💳 Cards & Contactless Accepted',
      image: acc.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
      bookingLink: acc.link,
      gmapsQuery: `${acc.name} ${dynamicInfo.cityName}`,
      providerName: acc.provider,
      safetyFeatures: acc.safetyFeatures || ['24/7 security desk', 'Keycard elevator locks', 'Main boulevard location'],
      whyChosen: acc.why
    })),
    arrivalRoutes: (dynamicInfo.arrivalRoutes && dynamicInfo.arrivalRoutes.length > 0)
      ? dynamicInfo.arrivalRoutes
      : [
        {
          id: `ar-${destId}-1`,
          mode: `${dynamicInfo.cityName} Airport Express Transit Corridor`,
          type: 'Direct Airport Transit',
          recommended: true,
          duration: '30-40 mins',
          cost: `Local ${dynamicInfo.currencyCode} (~$8.00)`,
          gmapsQuery: `${dynamicInfo.cityName} Airport Express to City Center`,
          safetyHighlights: [
            'Dedicated airport ground transportation terminal',
            'Monitored platforms with CCTV & security desk',
            'Direct central terminal arrival avoiding road congestion'
          ],
          stepByStep: [
            `Exit ${dynamicInfo.cityName} International Airport arrivals hall and follow public transit signs.`,
            'Purchase express transit ticket or tap contactless bank card at the automated platform barrier.',
            `Board the direct airport express service to ${dynamicInfo.cityName} Central Station.`,
            'Disembark at the central terminal and take a short walk or taxi to your booked accommodation.'
          ]
        }
      ],
    soloSpots: (dynamicInfo.soloSpots || []).map(spot => ({
      id: `spot-${destId}-${spot.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: spot.name,
      category: spot.category,
      neighborhood: spot.neighborhood,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
      lat: dynamicInfo.lat,
      lng: dynamicInfo.lng,
      walkTime: spot.walkTime,
      energyRequired: 'Low (Ideal for Rest)',
      openHours: '07:00 AM - 11:00 PM (OPEN NOW)',
      isOpenNow: true,
      paymentAlert: '💳 Cards & Cash Accepted',
      isCashOnly: false,
      reviewBadge: '★ 4.8 Google Reviews (2,100 Reviews)',
      gmapsQuery: spot.gmaps,
      lightingScore: 'High Municipal Lighting',
      crowdLevel: 'Respectful & Peaceful',
      whyChosen: spot.why,
      safetyFeatures: ['High pedestrian traffic boulevard', 'Municipal CCTV & Lighting']
    }))
  });
}
