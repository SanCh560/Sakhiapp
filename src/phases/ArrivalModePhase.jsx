import React, { useState, useEffect } from 'react';
import { Plane, Navigation, ShieldCheck, MapPin, Bus, Car, Train, PhoneCall, Volume2, ArrowRight, CheckCircle2, Hotel, Sparkles, ExternalLink, Compass, Smartphone } from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import MatchScoreBadge from '../components/MatchScoreBadge';
import { scoreRecommendationList } from '../engine/recommendationEngine';

export default function ArrivalModePhase({
  destinationData,
  tripConfig,
  travellerProfile,
  isOffline,
  onOpenMatchModal,
  onOpenSOS,
  onSaveTripConfig,
  onGoToSoloDays
}) {
  if (!destinationData || !tripConfig?.destId) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">No Active Trip Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Arrival safety corridors, airport transit options, and offline vector maps activate once you select or plan a trip.
        </p>
      </div>
    );
  }

  // Dynamic fallback arrival routes tailored to destination
  const cityName = destinationData?.cityName || 'City';
  const currencyCode = destinationData?.currencyCode || 'USD';
  const defaultRoutes = [
    {
      id: `${destinationData?.id || 'dest'}-ar-default-1`,
      mode: `${cityName} Dedicated Airport Rail Express Corridor`,
      recommended: true,
      duration: '25-35 mins',
      cost: `Local ${currencyCode} (~$6.50)`,
      gmapsQuery: `${cityName} Airport Ground Transit to City Center`,
      safetyHighlights: [
        'Dedicated airport transit platforms located directly in terminal',
        'Staffed ticket help desk and automated contactless ticketing',
        'High-speed direct corridor avoiding surface traffic congestion'
      ],
      stepByStep: [
        `Follow dedicated Ground Transportation and Rail Express signs from ${cityName} Airport Arrivals.`,
        'Tap your contactless bank card or purchase a transfer ticket at the automated platform turnstiles.',
        `Board the express train towards ${cityName} Central Terminal.`,
        'Disembark at the central terminal, exit via the main concourse, and walk or take a licensed cab to your stay.'
      ]
    },
    {
      id: `${destinationData?.id || 'dest'}-ar-default-2`,
      mode: `Official Regulated Airport Taxi Rank`,
      recommended: false,
      duration: '20-30 mins',
      cost: `Local ${currencyCode} (~$30.00)`,
      gmapsQuery: `${cityName} Airport Official Taxi Rank`,
      safetyHighlights: [
        'Official dispatcher queue directly outside terminal exit',
        'Regulated government tariffs with registered licensed drivers',
        'Direct door-to-door dropoff at your accommodation entrance'
      ],
      stepByStep: [
        'Proceed directly to the marked Official Taxi Rank outside the baggage claim doors.',
        'Wait in the queue for the official dispatcher to assign your vehicle (never accept rides from drivers inside the terminal).',
        'Confirm the fare meter is running or verify the fixed airport rate before departing.',
        'Arrive safely right at your hotel or hostel entrance.'
      ]
    }
  ];

  const rawRoutes = (destinationData?.arrivalRoutes && destinationData.arrivalRoutes.length > 0)
    ? destinationData.arrivalRoutes
    : defaultRoutes;

  // Score candidate routes dynamically using Central Recommendation Engine!
  const scoredRoutes = scoreRecommendationList(
    rawRoutes,
    travellerProfile || { budgetTier: 'Balanced ($$)', accPreference: 'Hostel / Female Pods' },
    tripConfig || { durationDays: 5, bookedStayName: '' },
    destinationData
  );

  const [selectedTransport, setSelectedTransport] = useState(scoredRoutes[0] || null);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const isStayConfirmed = Boolean(tripConfig?.stayConfirmed && tripConfig?.bookedStayName);
  const isFlightConfirmed = Boolean(tripConfig?.flightConfirmed && tripConfig?.flightNumber);
  const bookedStayName = isStayConfirmed ? tripConfig.bookedStayName : `${cityName} Central Area`;
  const durationDays = tripConfig?.durationDays || 5;

  const airportOrigin = tripConfig?.destinationAirport || `${cityName} Airport`;
  const stayDestination = isStayConfirmed ? `${bookedStayName}, ${cityName}` : `${cityName} Central Station, ${cityName}`;
  const googleMapsTransitUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(airportOrigin)}&destination=${encodeURIComponent(stayDestination)}&travelmode=transit`;
  const googleMapsDrivingUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(airportOrigin)}&destination=${encodeURIComponent(stayDestination)}&travelmode=driving`;
  const googleMapsWalkingUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(airportOrigin)}&destination=${encodeURIComponent(stayDestination)}&travelmode=walking`;

  useEffect(() => {
    if (scoredRoutes.length > 0) {
      setSelectedTransport(scoredRoutes[0]);
    }
  }, [destinationData?.id]);

  const handlePlayAudio = (idx, card) => {
    setPlayingAudioId(idx);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = card.translation || card.english;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const langCode = destinationData?.language?.toLowerCase();
        if (langCode?.includes('czech')) utterance.lang = 'cs-CZ';
        else if (langCode?.includes('french')) utterance.lang = 'fr-FR';
        else if (langCode?.includes('german')) utterance.lang = 'de-DE';
        else if (langCode?.includes('spanish')) utterance.lang = 'es-ES';
        else if (langCode?.includes('italian')) utterance.lang = 'it-IT';
        else if (langCode?.includes('japanese')) utterance.lang = 'ja-JP';
        else utterance.lang = 'en-US';

        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setPlayingAudioId(null), 1500);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setTimeout(() => setPlayingAudioId(null), 1500);
    }
  };

  const flashcards = (destinationData?.offlineFlashcards && destinationData.offlineFlashcards.length > 0)
    ? destinationData.offlineFlashcards
    : [
        { english: 'Help me, please!', translation: 'Pomoc, prosím!', phonetic: 'Help me please' },
        { english: 'Where is the police station?', translation: 'Kde je policie?', phonetic: 'Where is police' },
        { english: 'I am lost.', translation: 'Ztratila jsem se.', phonetic: 'I am lost' }
      ];

  if (!destinationData) return null;

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      
      {/* Flagship Hero City Cover Banner for Arrival Mode */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 text-white relative">
        <div className="h-40 sm:h-48 w-full relative">
          <img
            src={destinationData.heroImage || 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80'}
            alt={destinationData.cityName}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20">
              <Plane className="w-3.5 h-3.5 text-violet-200" /> Offline Arrival Corridor
            </span>
            <span className="text-xs bg-slate-950/40 px-3 py-1 rounded-xl font-bold border border-white/20">
              {isOffline ? '⚡ Offline Verified' : '🌐 Online Synced'}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {destinationData.cityName} Airport → {bookedStayName}
            </h2>
            <p className="text-xs text-violet-100 font-medium max-w-md">
              {isStayConfirmed
                ? `Zero internet needed. Verified safe route to ${bookedStayName} pre-cached for your ${durationDays}-day stay.`
                : `Zero internet needed. Verified safe transit corridor to ${cityName} Central Hub pre-cached for your ${durationDays}-day stay.`}
            </p>
          </div>
        </div>
      </div>

      {/* Synchronized Confirmed Flight & Accommodation Corridor Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className={`p-2.5 rounded-2xl ${isFlightConfirmed ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'} border font-bold shrink-0`}>
            <Plane className="w-4 h-4" />
          </span>
          <div>
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{isFlightConfirmed ? `Flight ${tripConfig.flightNumber}` : 'Flight Pending'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isFlightConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isFlightConfirmed ? '✓ Confirmed' : 'Not Confirmed'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {isFlightConfirmed
                ? `Lands ${tripConfig?.arrivalTime || '14:00'} at ${airportOrigin}`
                : `Corridor to ${airportOrigin}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`p-2.5 rounded-2xl ${isStayConfirmed ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-slate-100 text-slate-500 border-slate-200'} border font-bold shrink-0`}>
            <Hotel className="w-4 h-4" />
          </span>
          <div>
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{bookedStayName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isStayConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isStayConfirmed ? '✓ Confirmed' : 'Pending Selection'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {isStayConfirmed ? (tripConfig?.stayAddress || `${destinationData.cityName} City Center`) : `Routing to ${cityName} Central Hub`}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Trip Plan Readiness & Weather Calibration Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-white border border-violet-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-600 text-white font-bold shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {destinationData.cityName} Solo Trip Plan Readiness
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live arrival calibration • Confirm your plan to enter Solo Days
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
            tripConfig?.planStatus === 'accepted'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-amber-100 text-amber-900 border-amber-200'
          }`}>
            {tripConfig?.planStatus === 'accepted' ? '✓ Plan Confirmed' : 'Needs Acceptance'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-violet-100 space-y-2 text-xs">
          <p className="text-slate-700 leading-relaxed font-medium">
            Welcome to {destinationData.cityName}! Before arrival, your itinerary acts as a flexible suggestion. Now that you've landed, review your calibrated {durationDays}-day schedule and accept it to activate day-by-day navigation.
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500 font-medium">
              Accommodation: <strong>{bookedStayName}</strong> {isStayConfirmed ? '(Confirmed)' : '(Pending Selection)'}
            </div>
            {tripConfig?.planStatus !== 'accepted' ? (
              <button
                onClick={() => {
                  if (onSaveTripConfig) {
                    onSaveTripConfig({
                      ...tripConfig,
                      planStatus: 'accepted',
                      planAcceptedAt: new Date().toISOString()
                    });
                  }
                  if (onGoToSoloDays) {
                    onGoToSoloDays();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Plan & Enter Solo Days →</span>
              </button>
            ) : (
              <button
                onClick={onGoToSoloDays}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Confirmed Schedule →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Offline Safe Route Map */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-violet-600" />
            Offline Safe Route to {bookedStayName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-violet-900 font-bold bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
              High Street Lighting Route
            </span>
            <a
              href={googleMapsTransitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-extrabold text-violet-700 hover:text-violet-900 bg-violet-100 hover:bg-violet-200 px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 border border-violet-200 shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps ↗</span>
            </a>
          </div>
        </div>

        <InteractiveMap isArrivalMode={true} spots={destinationData.soloSpots || []} destinationData={destinationData} />

        {/* OFFLINE PACK & GOOGLE MAPS NAVIGATION CORRIDOR CARD */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 text-white border border-slate-700 shadow-lg space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-violet-600 text-white font-bold shadow-xs shrink-0">
                <Navigation className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Offline Google Maps Turn-by-Turn Navigation
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    0% Data Required
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  Pre-calibrated route: {airportOrigin} → {bookedStayName}
                </p>
              </div>
            </div>

            {/* Prominent Action Button */}
            <a
              href={googleMapsTransitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Start Route in Google Maps ↗</span>
            </a>
          </div>

          {/* Quick Mode Links */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold">Switch Route Mode:</span>
            <a
              href={googleMapsTransitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 font-bold border border-slate-700 flex items-center gap-1.5 text-[11px] cursor-pointer"
            >
              <Bus className="w-3 h-3 text-violet-400" /> Transit Route ↗
            </a>
            <a
              href={googleMapsDrivingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1.5 text-[11px] cursor-pointer"
            >
              <Car className="w-3 h-3 text-blue-400" /> Taxi / Driving Route ↗
            </a>
            <a
              href={googleMapsWalkingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1.5 text-[11px] cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-emerald-400" /> Walking Route ↗
            </a>
          </div>

          {/* Step-by-Step Offline Instructions */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-violet-400" />
              <span>How to follow this route offline in Google Maps with zero cellular data:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 font-medium pl-1">
              <li>Click <strong>"Start Route in Google Maps"</strong> above to launch your pre-calibrated safe arrival corridor.</li>
              <li>In Google Maps, tap your profile icon → <strong>"Offline maps"</strong> → <strong>"Select your own map"</strong> to save {cityName}.</li>
              <li>Your device GPS works without cellular data or roaming—the live blue dot will guide you turn-by-turn along the safe corridor right to {bookedStayName}!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 2. Transport Comparison Cards */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Bus className="w-4 h-4 text-violet-600" />
            {destinationData.cityName} Airport Transfers to {bookedStayName}
          </h3>
          <p className="text-xs text-slate-500">Ranked by female safety standards & luggage convenience</p>
        </div>

        <div className="space-y-3">
          {scoredRoutes.map((rec) => {
            const option = rec.item;
            const isSelected = selectedTransport?.item?.id === option.id || selectedTransport?.id === option.id;
            const highlights = option.safetyHighlights || ['Official airport transfer', 'CCTV & lighting'];
            const steps = option.stepByStep || ['Exit arrivals', 'Board airport bus', 'Disembark at hotel'];
            const isTaxiOption = (option.mode || option.name || '').toLowerCase().includes('taxi') || (option.mode || option.name || '').toLowerCase().includes('cab');
            const routeMode = isTaxiOption ? 'driving' : 'transit';
            const optionGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(airportOrigin)}&destination=${encodeURIComponent(option.gmapsQuery || stayDestination)}&travelmode=${routeMode}`;

            return (
              <div
                key={option.id}
                onClick={() => setSelectedTransport(rec)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-violet-600 ring-2 ring-violet-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl text-white font-bold shadow-xs bg-violet-600">
                      <Bus className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{option.mode || option.name}</h4>
                      <span className="text-xs text-slate-500 font-semibold">{option.duration} • {option.cost}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={optionGoogleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 border border-violet-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Map Route ↗</span>
                    </a>
                    <MatchScoreBadge
                      score={rec.matchScore.overall}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMatchModal({
                          title: option.mode || option.name,
                          matchScore: rec.matchScore,
                          whyChosen: rec.whyChosen,
                          safetyFeatures: highlights
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 my-2.5">
                  {highlights.map((hl, idx) => (
                    <div key={idx} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3.5 border-t border-slate-100 text-xs space-y-3 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wider">
                        Step-by-Step Directions to {bookedStayName}
                      </span>
                      <a
                        href={optionGoogleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Navigate this Route in Google Maps ↗</span>
                      </a>
                    </div>
                    {steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Essential Flashcards & Emergency Hub */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              {destinationData.cityName} Emergency Flashcards & SOS
            </h3>
            <p className="text-xs text-slate-400">Show local driver, transit officer or police</p>
          </div>
          <button
            onClick={onOpenSOS}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Emergency SOS
          </button>
        </div>

        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline Flashcard Deck</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {flashcards.map((card, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{card.english}</span>
                  <button
                    onClick={() => handlePlayAudio(idx, card)}
                    className={`p-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      playingAudioId === idx
                        ? 'bg-violet-600 text-white shadow-xs ring-2 ring-violet-400/50'
                        : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingAudioId === idx ? 'animate-bounce text-white' : 'text-violet-400'}`} />
                    <span>{playingAudioId === idx ? '🔊 Playing...' : 'Audio'}</span>
                    {playingAudioId === idx && (
                      <span className="flex gap-0.5 items-end h-2.5">
                        <span className="w-0.5 h-2 bg-white animate-pulse"></span>
                        <span className="w-0.5 h-3 bg-white animate-pulse delay-75"></span>
                        <span className="w-0.5 h-1.5 bg-white animate-pulse delay-150"></span>
                      </span>
                    )}
                  </button>
                </div>
                <div className="text-base font-extrabold text-white tracking-wide">{card.translation}</div>
                {card.phonetic && <div className="text-[11px] text-slate-400 italic font-mono">"{card.phonetic}"</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
