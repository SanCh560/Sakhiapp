/**
 * Research-Backed 5-Day Draft Itinerary Generator
 * 
 * Generates comprehensive day-by-day itineraries tailored to specific world destinations,
 * factoring in local landmarks, female safety standards, and venue opening hours.
 */

const CITY_SPECIFIC_ITINERARIES = {
  'tokyo': [
    {
      day: 1,
      title: 'Day 1: Arrival, Shibuya Crossing & Harajuku Sanctuary Walk',
      theme: 'Orientation & Rest',
      energyRequired: 'Low (Ideal after travel)',
      items: [
        { time: '15:00', title: 'Check-in at Nadeshiko Hotel Shibuya (Female Capsule)', notes: 'Store luggage, collect yukata robe & keycard' },
        { time: '17:30', title: 'Shibuya Crossing Sky Deck View', notes: 'Top floor observatory, safe pedestrian crowds' },
        { time: '19:00', title: 'Solo Ramen Pod Dinner at Ichiran Shinjuku', notes: 'Private dining booth, zero awkwardness' }
      ]
    },
    {
      day: 2,
      title: 'Day 2: Historic Asakusa, Senso-ji Temple & Sumida River',
      theme: 'History & Architecture',
      energyRequired: '⚡ High Energy',
      items: [
        { time: '09:30', title: 'Morning Blessing at Senso-ji Temple Asakusa', notes: 'Traditional incense courtyard & Nakamise street' },
        { time: '12:30', title: 'Tsukiji Outer Market Fresh Tamagoyaki & Seafood', notes: 'Solo food stalls & fresh green tea' },
        { time: '15:00', title: 'Edo-Tokyo Museum & Quiet Gardens', notes: 'Indoor air-conditioned cultural exhibits' }
      ]
    },
    {
      day: 3,
      title: 'Day 3: Daikanyama Bookstore Cafe & Meiji Shrine Forest',
      theme: 'Culture & Tranquility',
      energyRequired: '🌿 Moderate',
      items: [
        { time: '10:00', title: 'Specialty Matcha Latte at Daikanyama T-Site Books', notes: 'Voted world\'s best bookstore lounge' },
        { time: '13:00', title: 'Meiji Jingu Sacred Forest Walk', notes: 'Gated peaceful forest in center of Tokyo' },
        { time: '17:00', title: 'Shinjuku Gyoen National Greenhouse Rest', notes: 'Municipal security protected botanical lawns' }
      ]
    },
    {
      day: 4,
      title: 'Day 4: Traditional Onsen Bathhouse & TeamLab Planets',
      theme: 'Wellness & Digital Art',
      energyRequired: '😴 Need Rest',
      items: [
        { time: '10:30', title: 'TeamLab Planets Digital Art Immersion', notes: 'Water-walking sensory rooms (wear shorts)' },
        { time: '14:00', title: 'Female-Only Hot Spring Bath at Thermae-Yu', notes: 'Mineral thermal baths, sauna & relaxation lounge' },
        { time: '18:30', title: 'Depachika (Department Store Basement) Dinner', notes: 'Gourmet bento boxes at Isetan Shinjuku' }
      ]
    },
    {
      day: 5,
      title: 'Day 5: Ginza Souvenirs, Matcha Ceremony & Haneda / Narita Departure',
      theme: 'Souvenirs & Farewell',
      energyRequired: 'Low (Departure Prep)',
      items: [
        { time: '10:00', title: 'Japanese Stationery & Craft Shopping at Itoya Ginza', notes: '9 floors of hand-made paper & pens' },
        { time: '12:30', title: 'Traditional Tea Ceremony Experience', notes: 'Serene single-diner matcha bowl' },
        { time: '15:00', title: 'Board Keisei Skyliner / Haneda Express to Airport', notes: 'Luggage lockers & direct terminal gates' }
      ]
    }
  ],

  'paris': [
    {
      day: 1,
      title: 'Day 1: Arrival, Le Marais Promenade & Seine Sunset View',
      theme: 'Orientation & Rest',
      energyRequired: 'Low (Ideal after travel)',
      items: [
        { time: '15:00', title: 'Check-in at Hotel Caron de Beaumarchais (Le Marais)', notes: 'Keycard security, unpack & refresh' },
        { time: '17:30', title: 'Sunset Stroll along Place des Vosges', notes: 'Gated historic square, well-lit arcades' },
        { time: '19:00', title: 'Dinner at Marché des Enfants Rouges Food Market', notes: 'Oldest covered food market in Paris with solo counters' }
      ]
    },
    {
      day: 2,
      title: 'Day 2: Louvre Museum Treasures & Palais Royal Gardens',
      theme: 'Art & History',
      energyRequired: '⚡ High Energy',
      items: [
        { time: '09:30', title: 'Louvre Museum Priority Entry (Denon Wing)', notes: 'Mona Lisa & Winged Victory galleries' },
        { time: '12:30', title: 'Crêpe Lunch at Breizh Café Le Marais', notes: 'Artisanal buckwheat galettes & cider' },
        { time: '15:00', title: 'Palais-Royal Courtyard & Buren Columns Walk', notes: 'Peaceful arcades & shaded park chairs' }
      ]
    },
    {
      day: 3,
      title: 'Day 3: Montmartre Artist Quarter & Sacré-Cœur Panorama',
      theme: 'Culture & Views',
      energyRequired: '🌿 Moderate',
      items: [
        { time: '10:00', title: 'Funicular Ride to Sacré-Cœur Basilica', notes: 'Panoramic views over Paris rooftops' },
        { time: '13:00', title: 'Musée de la Vie Romantique Garden Cafe', notes: 'Hidden greenhouse tea lounge in Pigalle' },
        { time: '17:00', title: 'Boulevard Haussmann Rooftop Terrace View', notes: 'Free sunset view from Galeries Lafayette roof' }
      ]
    },
    {
      day: 4,
      title: 'Day 4: Musée d\'Orsay Impressionists & Jardin du Luxembourg',
      theme: 'Relaxation & Masterpieces',
      energyRequired: '😴 Need Rest',
      items: [
        { time: '10:30', title: 'Musée d\'Orsay Clock Tower & Monet Gallery', notes: 'Former railway station museum' },
        { time: '14:00', title: 'Reading & Tea Break in Jardin du Luxembourg', notes: 'Shaded green chairs near Medici Fountain' },
        { time: '18:30', title: 'Acoustic Organ Concert at Saint-Sulpice', notes: 'Peaceful evening chapel music' }
      ]
    },
    {
      day: 5,
      title: 'Day 5: French Bakery Shopping & Departure via RoissyBus',
      theme: 'Souvenirs & Farewell',
      energyRequired: 'Low (Departure Prep)',
      items: [
        { time: '10:00', title: 'Macaron & Tea Gift Shopping at Ladurée', notes: 'Gift boxes & French biscuits' },
        { time: '12:30', title: 'Final Bistro Lunch near Opéra Garnier', notes: 'Outdoor street-facing terrace table' },
        { time: '15:00', title: 'Board RoissyBus Direct to CDG Airport', notes: 'Nonstop express to Terminal 2' }
      ]
    }
  ],

  'reykjavik': [
    {
      day: 1,
      title: 'Day 1: Arrival, Rainbow Street Stroll & Hallgrímskirkja View',
      theme: 'Orientation & Geothermal Rest',
      energyRequired: 'Low (Ideal after travel)',
      items: [
        { time: '15:00', title: 'Check-in at Kex Hostel (Ocean View Female Dorm)', notes: 'Keycard security & cozy vintage lounge' },
        { time: '17:30', title: 'Walk along Skólavörðustígur (Rainbow Street)', notes: 'Safe lit pedestrian avenue with local boutiques' },
        { time: '19:00', title: 'Hot Soup & Geothermal Bread at Kaffi Loki', notes: 'Traditional Icelandic rye bread & salmon' }
      ]
    },
    {
      day: 2,
      title: 'Day 2: Sky Lagoon 7-Step Geothermal Ocean Ritual',
      theme: 'Thermal Wellness & Nature',
      energyRequired: '🌿 Moderate',
      items: [
        { time: '10:00', title: 'Sky Lagoon Geothermal Ocean Infinity Pool', notes: 'Ocean cliff views, warm geothermal water & sauna' },
        { time: '13:30', title: 'Seafood Soup Lunch at Reykjavik Old Harbor', notes: 'Fresh lobster soup at Seabaron (Sægreifinn)' },
        { time: '16:00', title: 'Harpa Glass Concert Hall Architectural Tour', notes: 'Futuristic glass atrium overlooking harbor' }
      ]
    },
    {
      day: 3,
      title: 'Day 3: Golden Circle Waterfall & Geysir Day Excursion',
      theme: 'Natural Wonders',
      energyRequired: '⚡ High Energy',
      items: [
        { time: '08:30', title: 'Small Group Golden Circle Tour Departure', notes: 'Vetted mini-bus pickup at Bus Stop 1' },
        { time: '11:00', title: 'Þingvellir National Park Continental Divide', notes: 'UNESCO World Heritage rift valley walk' },
        { time: '14:00', title: 'Gullfoss Waterfall & Strokkur Geysir Eruption', notes: 'Glacial roaring waterfall & hot spring eruptions' }
      ]
    },
    {
      day: 4,
      title: 'Day 4: Perlan Museum Ice Cave & Northern Lights Planetarium',
      theme: 'Science & Northern Lights',
      energyRequired: '😴 Need Rest',
      items: [
        { time: '10:30', title: 'Perlan Real Man-Made Ice Cave Walk', notes: 'Indoor -10°C glacier ice cave experience' },
        { time: '14:00', title: 'Northern Lights 8K Planetarium Show', notes: '360-degree aurora boreal simulation' },
        { time: '18:30', title: 'Quiet Craft Beer / Cider at MicroBar Reykjavik', notes: 'Cozy female-friendly local tavern' }
      ]
    },
    {
      day: 5,
      title: 'Day 5: Icelandic Wool Shopping & Flybus Airport Transfer',
      theme: 'Souvenirs & Farewell',
      energyRequired: 'Low (Departure Prep)',
      items: [
        { time: '10:00', title: 'Handknitting Association Wool Sweater (Lopapeysa) Shop', notes: 'Authentic handmade Icelandic wool' },
        { time: '12:30', title: 'Bæjarins Beztu Hot Dog Stand Lunch', notes: 'Famous Icelandic hot dog with crispy onions' },
        { time: '15:00', title: 'Board Flybus Express at BSÍ Terminal to KEF Airport', notes: 'Direct connection to airport terminal' }
      ]
    }
  ],

  'london': [
    {
      day: 1,
      title: 'Day 1: Elizabeth Line Arrival, Covent Garden & Seven Dials Stroll',
      theme: 'Orientation & Rest',
      energyRequired: 'Low (Ideal after travel)',
      items: [
        { time: '15:00', title: 'Check-in at The Hoxton Holborn / Wombat\'s City Hostel', notes: 'Store luggage, collect keycard, test Wi-Fi' },
        { time: '17:00', title: 'Walk through Neal\'s Yard & Seven Dials', notes: 'Pedestrianized colorful courtyard, lively and safe' },
        { time: '19:00', title: 'Solo Dinner at Seven Dials Market or Dishoom Covent Garden', notes: 'Walk-ins welcome, vibrant single-diner bar counter' }
      ]
    },
    {
      day: 2,
      title: 'Day 2: South Bank Cultural Walk, Tate Modern & Borough Market',
      theme: 'History & Culture',
      energyRequired: '⚡ High Energy',
      items: [
        { time: '09:30', title: 'South Bank Riverside Walk & Tate Modern Galleries', notes: 'Free entry, spacious and safe public galleries' },
        { time: '12:30', title: 'Solo Street Food Exploration at Borough Market', notes: 'Fresh artisan bread, cheeses, and hot street food' },
        { time: '15:00', title: 'Cross Millennium Bridge to St. Paul\'s Cathedral', notes: 'Iconic London skyline view with heavy pedestrian traffic' }
      ]
    },
    {
      day: 3,
      title: 'Day 3: Marylebone Boutiques, Daunt Books & Regent\'s Park',
      theme: 'Literature & Tranquility',
      energyRequired: '🌿 Moderate',
      items: [
        { time: '10:00', title: 'Browse Oak Galleries at Daunt Books Marylebone', notes: 'World-famous travel bookshop with skylit balconies' },
        { time: '12:30', title: 'Lunch at The Ivy Café Marylebone or Monocle Café', notes: 'Cozy single-seat window tables' },
        { time: '15:00', title: 'Stroll through Queen Mary\'s Rose Gardens in Regent\'s Park', notes: 'Peaceful manicured gardens with park police' }
      ]
    },
    {
      day: 4,
      title: 'Day 4: British Museum Treasures & Traditional Afternoon Tea',
      theme: 'Art & Heritage',
      energyRequired: '😴 Need Rest',
      items: [
        { time: '10:00', title: 'Great Court & Antiquities at British Museum', notes: 'Stunning glass-roofed court, free entry' },
        { time: '14:00', title: 'Afternoon Tea with Scones & Clotted Cream in Bloomsbury', notes: 'Relaxed seated luxury experience' },
        { time: '18:00', title: 'West End Theatre Solo Matinee / Evening Show', notes: 'Single stall seats, safe crowds at Leicester Square' }
      ]
    },
    {
      day: 5,
      title: 'Day 5: Sky Garden Skyline View & Elizabeth Line Airport Departure',
      theme: 'Panoramas & Farewell',
      energyRequired: 'Low (Departure Prep)',
      items: [
        { time: '10:00', title: 'Sky Garden 360° Observation Walkway', notes: 'Security screened indoor garden overlooking Thames' },
        { time: '12:30', title: 'Farewell Lunch at Leadenhall Market', notes: 'Historic Victorian covered market' },
        { time: '15:00', title: 'Board Elizabeth Line Express to Heathrow Terminal 2/3/5', notes: 'Direct high-speed train to departure gates' }
      ]
    }
  ]
};

/**
 * Helper to calculate time offsets (e.g. "18:30" minus 3 hours -> "15:30")
 */
function subtractHours(timeStr, hoursToSubtract) {
  if (!timeStr || !timeStr.includes(':')) return '14:00';
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  let newH = h - hoursToSubtract;
  if (newH < 0) newH += 24;
  return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}

/**
 * Generate Dynamic Multi-Day Itinerary (1 to N Days)
 * 
 * - Day 1: Uses user's actual booked stay (tripConfig.bookedStayName) or destination accommodation
 * - Days 2 to N-1: Solo exploration, cultural landmarks, cafes & rest stops
 * - Day N (Final Day): Dynamic departure day calibrated to confirmed departure flight details
 */
export function generateDynamicItinerary(destinationData, travellerProfile, tripConfig) {
  const cityName = destinationData?.cityName || 'Destination';
  const lowerCity = cityName.trim().toLowerCase();
  const durationDays = Math.max(1, parseInt(tripConfig?.durationDays || 5, 10));
  
  // Real booked stay name from tripConfig if confirmed, otherwise sensible placeholder
  const hasConfirmedStay = Boolean(tripConfig?.stayConfirmed && tripConfig?.bookedStayName);
  const actualStayName = hasConfirmedStay
    ? tripConfig.bookedStayName
    : (tripConfig?.bookedStayName || `${cityName} Boutique Stay`);

  // Check if departure flight is confirmed
  const isDepartureConfirmed = !!tripConfig?.departureFlightConfirmed;
  const departureTime = tripConfig?.departureTime || '17:00';
  const departureFlightNumber = tripConfig?.departureFlightNumber || 'Scheduled Flight';
  const departureAirline = tripConfig?.departureAirline || 'Flag Carrier';
  const departureAirport = tripConfig?.departureAirport || `${cityName} International Airport`;

  // Predefined templates for major cities
  const cityTemplates = CITY_SPECIFIC_ITINERARIES[lowerCity] || [];

  const itineraryDays = [];

  for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
    // -----------------------------------------------------------------------
    // CASE A: DAY 1 (ARRIVAL & ORIENTATION)
    // -----------------------------------------------------------------------
    if (dayNum === 1) {
      let day1Items = [];
      const checkinTime = tripConfig?.arrivalTime ? '15:00' : '15:00';

      if (cityTemplates.length > 0 && cityTemplates[0]?.items) {
        day1Items = cityTemplates[0].items.map((item, idx) => {
          if (idx === 0) {
            return {
              time: checkinTime,
              title: `Check-in at ${actualStayName}`,
              notes: 'Store luggage, collect keycard & verify 24/7 reception security'
            };
          }
          return item;
        });
      } else {
        const firstSpot = destinationData?.soloSpots?.[0]?.name || `${cityName} Central Boulevard`;
        day1Items = [
          { time: checkinTime, title: `Check-in at ${actualStayName}`, notes: 'Store luggage, verify 24/7 reception security' },
          { time: '17:30', title: `Sunset Walk along ${cityName} Main Boulevard`, notes: 'High street lighting & heavy pedestrian traffic' },
          { time: '19:00', title: `Dinner near ${firstSpot}`, notes: 'Solo-friendly seating & contactless payment' }
        ];
      }

      itineraryDays.push({
        day: 1,
        title: `Day 1: ${cityName} Arrival & Check-in at ${actualStayName}`,
        theme: 'Arrival & Orientation',
        energyRequired: 'Low (Ideal after travel)',
        items: day1Items
      });
      continue;
    }

    // -----------------------------------------------------------------------
    // CASE B: FINAL DAY (DAY N DEPARTURE)
    // -----------------------------------------------------------------------
    if (dayNum === durationDays) {
      let dayNItems = [];

      if (isDepartureConfirmed && departureTime) {
        const [depH] = departureTime.split(':').map(n => parseInt(n, 10));
        const isEveningFlight = depH >= 14;

        if (isEveningFlight) {
          const transitTime = subtractHours(departureTime, 3.5);
          const securityTime = subtractHours(departureTime, 2.5);

          dayNItems = [
            { time: '11:00', title: `Check out from ${actualStayName} & store luggage`, notes: 'Collect luggage tags and verify airport train tickets' },
            { time: '12:30', title: `Farewell lunch & souvenir shopping in ${cityName}`, notes: 'Single-counter dining & local artisan gifts' },
            { time: transitTime, title: `Board Airport Express Train to ${departureAirport}`, notes: 'Direct daylight transit corridor to departure terminal' },
            { time: securityTime, title: `Airport check-in & priority security for ${departureAirline} ${departureFlightNumber}`, notes: 'Bag drop, VAT tax refund & gate arrival' },
            { time: departureTime, title: `Boarding & Departure on Flight ${departureFlightNumber}`, notes: `Confirmed flight departing ${departureAirport} at ${departureTime}` }
          ];
        } else {
          // Morning / Early afternoon flight
          const checkoutTime = subtractHours(departureTime, 4);
          const transitTime = subtractHours(departureTime, 3.5);
          const securityTime = subtractHours(departureTime, 2.5);

          dayNItems = [
            { time: checkoutTime, title: `Early checkout from ${actualStayName}`, notes: 'Settle bill, return keycard & retrieve luggage' },
            { time: transitTime, title: `Express Airport Corridor to ${departureAirport}`, notes: 'Direct morning train or pre-booked licensed taxi' },
            { time: securityTime, title: `Bag drop & security check for ${departureAirline} ${departureFlightNumber}`, notes: 'Proceed to departure gate' },
            { time: departureTime, title: `Boarding & Departure on Flight ${departureFlightNumber}`, notes: `Confirmed flight departing ${departureAirport} at ${departureTime}` }
          ];
        }
      } else {
        // Standard flexible departure day when flight details not yet confirmed
        dayNItems = [
          { time: '10:00', title: `Check out from ${actualStayName} & store luggage`, notes: 'Baggage storage at front desk' },
          { time: '12:30', title: `Farewell lunch at solo-friendly cafe in ${cityName}`, notes: 'Organize travel documents & relax' },
          { time: '15:00', title: `Airport Express Transfer to ${departureAirport}`, notes: 'Direct connection to departure terminal' },
          { time: '17:00', title: 'Airport check-in & departure flight boarding', notes: 'Provide flight details in Goodbye Mode to customize timings' }
        ];
      }

      itineraryDays.push({
        day: dayNum,
        title: `Day ${dayNum}: Souvenirs, Farewell ${cityName} & Airport Departure`,
        theme: 'Souvenirs & Farewell',
        energyRequired: 'Low (Departure Prep)',
        items: dayNItems
      });
      continue;
    }

    // -----------------------------------------------------------------------
    // CASE C: INTERMEDIATE EXPLORATION DAYS (DAYS 2 to N - 1)
    // -----------------------------------------------------------------------
    const templateIdx = (dayNum - 1) % Math.max(1, cityTemplates.length);
    const template = cityTemplates[templateIdx];

    if (template && dayNum < cityTemplates.length) {
      itineraryDays.push({
        day: dayNum,
        title: `Day ${dayNum}: ${template.title.replace(/^Day \d+:\s*/, '')}`,
        theme: template.theme,
        energyRequired: template.energyRequired,
        items: template.items
      });
    } else {
      // Dynamic day generation based on destination spots & culture
      const spotIdx = (dayNum * 2) % (destinationData?.soloSpots?.length || 1);
      const spot = destinationData?.soloSpots?.[spotIdx] || { name: `${cityName} Landmark Gallery`, neighborhood: 'Old Town' };

      itineraryDays.push({
        day: dayNum,
        title: `Day ${dayNum}: ${cityName} Cultural Exploration & Hidden Cafes`,
        theme: 'Culture & Discovery',
        energyRequired: dayNum % 2 === 0 ? '⚡ High Energy' : '🌿 Moderate',
        items: [
          { time: '09:30', title: `Morning visit to ${spot.name}`, notes: `Solo-friendly visit in ${spot.neighborhood || cityName}` },
          { time: '13:00', title: `Lunch at artisan cafe & local bakery`, notes: 'Quiet window seating for single diners' },
          { time: '16:00', title: `Afternoon scenic park stroll & photography`, notes: 'High street lighting and safe pedestrian promenade' }
        ]
      });
    }
  }

  return itineraryDays;
}

// Backward-compatible alias for existing consumers
export function generate5DayDraftItinerary(destinationData, travellerProfile, tripConfig) {
  return generateDynamicItinerary(destinationData, travellerProfile, tripConfig);
}
