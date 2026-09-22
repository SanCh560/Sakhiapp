import React, { useState, useEffect } from 'react';
import {
  Compass, Sparkles, CheckCircle2, ChevronRight, ShieldCheck, MapPin,
  Building, CreditCard, ExternalLink, Filter, CalendarCheck, Luggage,
  Plus, Trash2, Heart, Lock, KeyRound, BookmarkCheck, Calendar, Plane,
  Bell, Mail, RefreshCw, Utensils, Globe, BookOpen, CheckSquare, Square,
  Loader2, X, Sun, Clock, ArrowRight, Hotel, Edit3, PhoneCall, Volume2, Zap
} from 'lucide-react';
import MatchScoreBadge from '../components/MatchScoreBadge';
import { scoreRecommendationList } from '../engine/recommendationEngine';
import { triggerBookedTripNotifications } from '../services/notificationService';
import { generateRealTimeBookingLinks } from '../services/apiService';
import { AccommodationService } from '../services/AccommodationService';
import { TravellerMemoryService } from '../services/TravellerMemoryService';
import { activeTripCache } from '../services/activeTripCache';
import { createAccommodation } from '../models/entities';
import { getRecommendedFlights } from '../services/flightService';
import { calculateBudgetEstimation, formatPrice } from '../services/budgetCalculatorService';

export default function BeforeTripPhase({
  destinationData,
  tripConfig,
  travellerProfile,
  authUser,
  onOpenMatchModal,
  onOpenDestinationPicker,
  onSaveTripConfig,
  onResetTripConfig,
  onGoToArrivalMode,
  onDispatchNotifications
}) {
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  
  // Confirmed Bookings & AI Option States
  const [optedForAiHelp, setOptedForAiHelp] = useState(tripConfig?.tripStatus !== 'already-booked');
  const [isEditingFlights, setIsEditingFlights] = useState(false);
  const [isEditingStays, setIsEditingStays] = useState(false);
  const [isEditingBookings, setIsEditingBookings] = useState(false);

  // Custom User Booking Entry States
  const [showCustomFlightInput, setShowCustomFlightInput] = useState(false);
  const [customFlightNum, setCustomFlightNum] = useState('');
  const [customAirline, setCustomAirline] = useState('');
  const [customArrivalTime, setCustomArrivalTime] = useState('14:00');

  const [showCustomStayInput, setShowCustomStayInput] = useState(false);
  const [customStayName, setCustomStayName] = useState('');
  const [customStayAddress, setCustomStayAddress] = useState('');
  
  // Interactive Essential Items Packing Checklist State with Persistence (Issue #3)
  const packingStorageKey = `sakhi_packing_checklist_${authUser?.id || 'default'}_${tripConfig?.id || destinationData?.id || 'default'}`;
  const [packingChecklist, setPackingChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(packingStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 1, item: 'Passport & Copies (Physical & Cloud)', category: 'Essential', checked: true },
      { id: 2, item: 'Universal Power Adapter & Power Bank', category: 'Tech', checked: true },
      { id: 3, item: `${destinationData?.currencyCode || 'Local'} Emergency Cash Stash`, category: 'Money', checked: false },
      { id: 4, item: 'Offline Vector Maps Downloaded in Sakhi', category: 'Safety', checked: true },
      { id: 5, item: 'Comfortable Anti-Slip Walking Shoes', category: 'Clothing', checked: true },
      { id: 6, item: 'Personal Safety Whistle & Door Alarm', category: 'Safety', checked: false }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(packingStorageKey, JSON.stringify(packingChecklist));
    } catch (e) {}
  }, [packingChecklist, packingStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(packingStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPackingChecklist(parsed);
        }
      }
    } catch (e) {}
  }, [packingStorageKey]);

  const [newItemText, setNewItemText] = useState('');

  // Offline Travel Pack Download State
  const [isPackDownloaded, setIsPackDownloaded] = useState(() => {
    try {
      const cached = activeTripCache.getCachedActiveTripPack(tripConfig?.id || 'trip-1');
      return !!cached;
    } catch {
      return false;
    }
  });
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPackModal, setShowPackModal] = useState(false);
  const [bookingToast, setBookingToast] = useState(null);

  const handleDownloadPack = async () => {
    if (isDownloadingPack) return;
    setIsDownloadingPack(true);
    setDownloadProgress(15);

    try {
      const tripId = tripConfig?.id || 'trip-1';
      const destId = destinationData?.id || tripConfig?.destId || '';

      setDownloadProgress(40);
      // Synchronize full active tripConfig and live destinationData to offline pack
      await activeTripCache.downloadActiveTripPack(tripId, destId, { tripConfig, destinationData });

      setDownloadProgress(80);
      await new Promise(r => setTimeout(r, 300));
      setDownloadProgress(100);

      setTimeout(() => {
        setIsDownloadingPack(false);
        setIsPackDownloaded(true);
        setBookingToast(`✅ Offline Travel Pack for ${destinationData.cityName} (38 MB) downloaded! Flight ${tripConfig?.flightNumber || ''}, stay & vector maps stored locally.`);
        setTimeout(() => setBookingToast(null), 5000);
      }, 300);
    } catch (err) {
      console.error('Failed to download offline pack:', err);
      setIsDownloadingPack(false);
    }
  };

  const [userInstructionText, setUserInstructionText] = useState(TravellerMemoryService.getUserInstructions());
  const [isRefreshingStays, setIsRefreshingStays] = useState(false);

  // Fetch AI Scored Accommodation Recommendations asynchronously via AccommodationService
  const fetchStays = async (instructions = userInstructionText, forceRefresh = false) => {
    setIsLoadingRecs(true);
    try {
      if (instructions) {
        TravellerMemoryService.setUserInstructions(instructions);
      }
      const res = await AccommodationService.getRecommendations({
        userId: authUser?.id || 'usr-default-1',
        destinationData,
        tripConfig,
        userCustomInstructions: instructions,
        forceRefresh
      });

      if (res.recommendations && res.recommendations.length > 0) {
        // Format for UI MatchScoreBadge
        const formatted = res.recommendations.map(r => ({
          item: r.item,
          matchScore: {
            overall: r.aiMatchScore,
            safety: r.safetyScore,
            personalFit: r.personalFitScore,
            comfort: r.comfortScore,
            convenience: r.convenienceScore
          },
          whyChosen: r.explanation
        }));
        setAiRecommendations(formatted);
      }
    } catch (e) {
      console.warn('[BeforeTripPhase] AccommodationService fetch fallback:', e);
    } finally {
      setIsLoadingRecs(false);
      setIsRefreshingStays(false);
    }
  };

  useEffect(() => {
    fetchStays(userInstructionText);
  }, [destinationData?.id, tripConfig?.destId, tripConfig?.bookedStayName, authUser?.id]);

  const handleApplyInstructions = (e) => {
    e.preventDefault();
    if (isRefreshingStays) return;
    setIsRefreshingStays(true);
    fetchStays(userInstructionText, true);
  };

  const toggleChecklistItem = (id) => {
    setPackingChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setPackingChecklist(prev => [
      ...prev,
      { id: Date.now(), item: newItemText.trim(), category: 'Custom', checked: false }
    ]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (id) => {
    setPackingChecklist(prev => prev.filter(item => item.id !== id));
  };

  if (!destinationData || !tripConfig?.destId) {
    const checkedCount = packingChecklist.filter(i => i.checked).length;
    return (
      <div className="space-y-4 animate-fade-in">
        {/* 1. HERO PLACE-NEUTRAL SANCTUARY BANNER */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 text-white relative">
          <div className="h-44 sm:h-52 w-full relative">
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"
              alt="Solo Travel Sanctuary"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            {/* Top Floating Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20">
                <span className="text-lg">🌍</span> Global Sanctuary
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-black shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 9.8/10 Safety Standard
              </span>
            </div>

            {/* Bottom Hero Text Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                Pre-Trip Solo Preparation
              </h2>
              <p className="text-xs text-violet-200 font-semibold flex items-center gap-2">
                <span>Universal Currency Tools</span> • <span>Offline Safety Protocols</span> • <span>Verified Female Corridors</span>
              </p>
            </div>
          </div>

          {/* Status Callout Banner */}
          <div className="p-4 sm:p-5 bg-white text-slate-900 space-y-3">
            <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-black text-violet-950">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-violet-600" /> Planning Phase: No Destination Selected Yet
                </span>
                <span className="text-violet-800 font-extrabold text-[11px]">
                  Pristine Setup
                </span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Your pre-departure checklist and personal safety tools are active below. Choose a destination anytime to unlock city-specific arrival corridors, verified stays, and real-time flight matches.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onOpenDestinationPicker}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Choose Destination & Plan Trip</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                {checkedCount} of {packingChecklist.length} items packed
              </span>
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE PACKING CHECKLIST */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Luggage className="w-4 h-4 text-violet-600" />
                <span>Essential Solo Female Packing Checklist</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pre-configured with essential solo female safety gear, power adapters, and travel documents.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-900 font-black text-xs">
              {checkedCount} / {packingChecklist.length} Ready
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(checkedCount / (packingChecklist.length || 1)) * 100}%` }}
            ></div>
          </div>

          {/* Checklist Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {packingChecklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                  item.checked
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-bold'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-xs truncate ${item.checked ? 'line-through text-slate-500' : ''}`}>
                    {item.item}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold">
                    {item.category}
                  </span>
                  {item.category === 'Custom' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveChecklistItem(item.id); }}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Form */}
          <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              type="text"
              placeholder="+ Add a custom item to your packing list..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Add Item
            </button>
          </form>
        </div>

        {/* 3. SAFETY PROTOCOLS & OFFLINE ACCESS PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">4D Safety Match</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Tailored to your personal travel comfort level, budget tier, and solo transit preferences.
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Hotel className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Vetted Female Stays</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Properties verified for 24/7 staffed lobbies, secure keycard elevator locks, and well-lit boulevards.
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">100% Offline Access</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Zero signal anxiety. Your emergency contacts, offline phrase flashcards, and arrival maps work without data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const accommodationsList = (destinationData?.accommodations && destinationData.accommodations.length > 0)
    ? destinationData.accommodations.filter(a => !a.name.includes('Solo Female Boutique') && !a.name.includes('Co-Living Female Loft'))
    : [];

  // Dynamic entity scoring via Central Recommendation Engine!
  const scoredAccommodations = scoreRecommendationList(
    accommodationsList,
    travellerProfile || { budgetTier: 'Balanced ($$)', accPreference: 'Hostel / Female Pods' },
    tripConfig || { durationDays: 5, bookedStayName: 'Mama Shelter' },
    destinationData
  );

  // Primary list uses real hotels retrieved by AI/Places, fallback to curated
  const displayList = (aiRecommendations && aiRecommendations.length > 0)
    ? aiRecommendations
    : scoredAccommodations;

  const filterTypes = ['All', 'Hostel', 'Hotel', 'Co-share Apartment'];

  const filteredRecs = displayList.filter((rec) => {
    if (activeTypeFilter === 'All') return true;
    return rec.item.type.toLowerCase().includes(activeTypeFilter.toLowerCase());
  });

  // Status flags strictly decoupled: each requires explicit user confirmation
  const isStayConfirmed = Boolean(tripConfig?.stayConfirmed && tripConfig?.bookedStayName);
  const isFlightConfirmed = Boolean(tripConfig?.flightConfirmed && tripConfig?.flightNumber);
  const bothConfirmed = isStayConfirmed && isFlightConfirmed;
  const isAlreadyPlanned = tripConfig?.tripStatus === 'already-booked' && bothConfirmed && !optedForAiHelp;

  // Retrieve AI recommended safe flights for destination
  const recommendedFlights = getRecommendedFlights({
    destinationData,
    tripConfig,
    travellerProfile
  });

  // Handle direct flight confirmation (Decoupled: does NOT touch stay status)
  const handleConfirmFlight = (flight) => {
    const updatedTripConfig = {
      ...tripConfig,
      flightNumber: flight.flightNumber,
      destinationAirport: flight.destinationAirport,
      arrivalTime: flight.arrivalTime,
      departureTime: flight.departureTime,
      airline: flight.airline,
      flightConfirmed: true
    };
    onSaveTripConfig(updatedTripConfig);
    setIsEditingFlights(false);
    setBookingToast(`✅ Flight ${flight.flightNumber} (${flight.airline}) confirmed landing at ${flight.arrivalTime}!`);
    setTimeout(() => setBookingToast(null), 4500);
  };

  const handleClearFlight = () => {
    const updatedTripConfig = {
      ...tripConfig,
      flightNumber: '',
      airline: '',
      destinationAirport: '',
      arrivalTime: '',
      departureTime: '',
      flightConfirmed: false
    };
    onSaveTripConfig(updatedTripConfig);
    setIsEditingFlights(false);
    setBookingToast('Flight selection cleared.');
    setTimeout(() => setBookingToast(null), 3000);
  };

  const handleConfirmCustomFlight = (e) => {
    e.preventDefault();
    if (!customFlightNum.trim()) return;
    const updatedTripConfig = {
      ...tripConfig,
      flightNumber: customFlightNum.trim(),
      airline: customAirline.trim() || 'Booked Carrier',
      destinationAirport: `${destinationData.cityName} International Airport`,
      arrivalTime: customArrivalTime.trim() || '14:00',
      flightConfirmed: true
    };
    onSaveTripConfig(updatedTripConfig);
    setShowCustomFlightInput(false);
    setIsEditingFlights(false);
    setBookingToast(`✅ Flight ${customFlightNum.trim()} confirmed!`);
    setTimeout(() => setBookingToast(null), 4000);
  };

  // Handle direct booking confirmation from stays recommendations list (Decoupled: does NOT touch flight status)
  const handleConfirmBooking = (acc) => {
    const updatedTripConfig = {
      ...tripConfig,
      destId: destinationData.id,
      bookedStayName: acc.name,
      stayAddress: acc.neighborhood || `${destinationData.cityName} City Center`,
      stayConfirmed: true
    };

    onSaveTripConfig(updatedTripConfig);
    setIsEditingStays(false);

    triggerBookedTripNotifications({
      tripConfig: updatedTripConfig,
      destinationData,
      profile: travellerProfile,
      authUser,
      onNotify: onDispatchNotifications
    });

    setBookingToast(`✅ Confirmed stay at ${acc.name}! Push, Email & Calendar Sync dispatched.`);
    setTimeout(() => setBookingToast(null), 4500);
  };

  const handleClearStay = () => {
    const updatedTripConfig = {
      ...tripConfig,
      bookedStayName: '',
      stayAddress: '',
      stayConfirmed: false
    };
    onSaveTripConfig(updatedTripConfig);
    setIsEditingStays(false);
    setBookingToast('Stay selection cleared.');
    setTimeout(() => setBookingToast(null), 3000);
  };

  const handleConfirmCustomStay = (e) => {
    e.preventDefault();
    if (!customStayName.trim()) return;
    const updatedTripConfig = {
      ...tripConfig,
      destId: destinationData.id,
      bookedStayName: customStayName.trim(),
      stayAddress: customStayAddress.trim() || `${destinationData.cityName} City Center`,
      stayConfirmed: true
    };
    onSaveTripConfig(updatedTripConfig);
    setShowCustomStayInput(false);
    setIsEditingStays(false);
    setBookingToast(`✅ Confirmed stay at ${customStayName.trim()}!`);
    setTimeout(() => setBookingToast(null), 4000);
  };

  // Dynamic destination-aware & user-tailored budget estimation
  const budgetData = calculateBudgetEstimation({
    destinationData,
    tripConfig,
    travellerProfile,
    recommendedFlights
  });

  const {
    durationDays: totalDays,
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
    localEstimatedTotal
  } = budgetData;

  // Filter Stays: When stay is confirmed, isolate to ONLY the confirmed stay card (remove others)
  let finalStayCards = filteredRecs;
  if (isStayConfirmed && !isEditingStays) {
    const matching = displayList.filter(rec => rec.item.name === tripConfig.bookedStayName);
    if (matching.length > 0) {
      finalStayCards = matching;
    } else {
      finalStayCards = [{
        item: {
          id: 'confirmed-stay-card',
          name: tripConfig.bookedStayName,
          type: 'Hotel',
          neighborhood: tripConfig.stayAddress || `${destinationData.cityName} City Center`,
          pricePerNight: `${homeCurrencySymbol}85`,
          image: destinationData.heroImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
          reviewBadge: '★ 4.9 Verified Safe',
          safetyFeatures: ['24/7 Security Reception', 'Secure Keycard Access', 'Female Solo Highly Rated'],
          paymentMethod: 'Credit Card / Contactless'
        },
        matchScore: { overall: 98, safety: 99, personalFit: 97, comfort: 96, convenience: 98 },
        whyChosen: `Your confirmed booking at ${tripConfig.bookedStayName} in ${destinationData.cityName}.`
      }];
    }
  }

  // Filter Flights: When flight is confirmed, isolate to ONLY the confirmed flight card (remove others)
  let finalFlightCards = recommendedFlights;
  if (isFlightConfirmed && !isEditingFlights) {
    const matching = recommendedFlights.filter(f => f.flightNumber === tripConfig.flightNumber);
    if (matching.length > 0) {
      finalFlightCards = matching;
    } else {
      finalFlightCards = [{
        id: 'confirmed-flight-card',
        flightNumber: tripConfig.flightNumber || 'Direct Flight',
        airline: tripConfig.airline || 'Scheduled Carrier',
        airlineLogo: '✈️',
        originAirport: 'Departure Airport',
        destinationAirport: tripConfig.destinationAirport || `${destinationData.cityName} Airport`,
        terminal: 'Terminal 1',
        departureTime: tripConfig.departureTime || '09:00',
        arrivalTime: tripConfig.arrivalTime || '14:00',
        duration: 'Direct',
        price: 'Confirmed',
        priceValue: 0,
        daylightArrival: true,
        matchScore: { overall: 98, safety: 99, personalFit: 98, comfort: 97, convenience: 98 },
        safetyFeatures: [
          `Daylight arrival (${tripConfig.arrivalTime || '14:00'}) for safe daytime transit`,
          `Direct connection to ${destinationData.cityName} city center`
        ],
        whyChosen: `Your confirmed flight ${tripConfig.flightNumber} landing at ${tripConfig.destinationAirport || destinationData.cityName + ' Airport'}.`
      }];
    }
  }

  const checkedCount = packingChecklist.filter(i => i.checked).length;

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* 1. HERO CITY COVER IMAGE & DESTINATION HEADER BANNER */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 text-white relative">
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={destinationData.heroImage || 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80'}
            alt={destinationData.cityName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {/* Top Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20">
              <span className="text-lg">{destinationData.flag}</span> {destinationData.country}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-black shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {destinationData.overallSafetyRating} Safety Score
            </span>
          </div>

          {/* Bottom Hero Text Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              Preparing for {destinationData.cityName}
            </h2>
            <p className="text-xs text-violet-200 font-semibold flex items-center gap-2">
              <span>{destinationData.currency} ({destinationData.currencyCode})</span> • <span>{destinationData.timezone}</span> • <span>{destinationData.language}</span>
            </p>
          </div>
        </div>

        {/* Personalized Booking Status Banner */}
        <div className="p-4 sm:p-5 bg-white text-slate-900 space-y-3">
          {bothConfirmed ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between font-black text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" /> Flight & Stay Fully Confirmed
                </span>
                <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                  {totalDays} Days ({tripConfig?.startDate || 'Aug 10'} - {tripConfig?.endDate || 'Aug 15'})
                </span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Flight <strong>{tripConfig.flightNumber}</strong> ({tripConfig.airline || 'Airline'}, lands {tripConfig.arrivalTime || '14:00'}) • Stay: <strong>{tripConfig.bookedStayName}</strong> ({tripConfig.stayAddress || destinationData.cityName}). All arrival corridors are ready!
              </p>
            </div>
          ) : isStayConfirmed ? (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between font-black text-teal-950">
                <span className="flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-teal-600" /> Stay Confirmed ({tripConfig.bookedStayName})
                </span>
                <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                  Flight Pending Selection
                </span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Stay locked in at <strong>{tripConfig.bookedStayName}</strong>! Select and confirm your daytime flight below to complete your corridor.
              </p>
            </div>
          ) : isFlightConfirmed ? (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between font-black text-blue-950">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-blue-600" /> Flight Confirmed ({tripConfig.flightNumber})
                </span>
                <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                  Stay Pending Selection
                </span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Flight <strong>{tripConfig.flightNumber}</strong> confirmed landing at {tripConfig.arrivalTime || '14:00'}! Select and confirm your accommodation below.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between font-black text-violet-950">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-violet-600" /> Bookings Pending Your Selection
                </span>
                <span className="text-violet-800 font-extrabold">
                  {totalDays} Days Target
                </span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Nothing is confirmed until you decide! Explore recommended safe flights and stays below, or enter your own tickets.
              </p>
            </div>
          )}

          {bookingToast && (
            <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-2 animate-fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4" /> {bookingToast}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onOpenDestinationPicker}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Edit Trip Plan
            </button>

            <button
              onClick={onGoToArrivalMode}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>Launch Arrival Mode</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALREADY PLANNED TRIP CARD (User has existing booking without AI trip help) */}
      {isAlreadyPlanned && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 font-bold">
                <CalendarCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Planned Trip to {destinationData.cityName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {totalDays} Days ({tripConfig?.startDate || 'Aug 10'} - {tripConfig?.endDate || 'Aug 15'}) • Offline Arrival Ready
                </p>
              </div>
            </div>

            <button
              onClick={() => setOptedForAiHelp(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Explore AI Stays & Flights</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-violet-600" /> Planned Accommodation
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Self-Booked
                </span>
              </div>
              <p className="text-sm font-black text-slate-900">
                {tripConfig.bookedStayName || 'Self-Arranged Hotel / Stay'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {tripConfig.stayAddress || `${destinationData.cityName} City Center`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-blue-600" /> Planned Flight
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                  {tripConfig.airline || 'Scheduled'}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900">
                Flight {tripConfig.flightNumber || 'Direct Flight'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Lands {tripConfig.arrivalTime || '14:00'} at {tripConfig.destinationAirport || `${destinationData.cityName} Airport`}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-violet-50/80 border border-violet-200 text-xs text-violet-950 font-medium flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
              Planned details synced to Arrival Mode & ready for offline caching.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPack}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Luggage className="w-3.5 h-3.5" />
                <span>{isPackDownloaded ? '✓ Cached' : 'Download Pack'}</span>
              </button>

              <button
                onClick={onGoToArrivalMode}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Arrival Mode</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UNIFIED CONFIRMED TRIP BOOKINGS DASHBOARD (Shown when both Stay & Flight are Confirmed) */}
      {bothConfirmed && !isEditingBookings && !isAlreadyPlanned && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 rounded-3xl p-5 sm:p-6 border-2 border-emerald-300 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Confirmed Trip Bookings ({destinationData.cityName})
                  </h3>
                  <p className="text-xs text-emerald-800 font-semibold">
                    Both flight and accommodation are confirmed & locked in!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingBookings(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Change Bookings</span>
              </button>
            </div>
          </div>

          {/* Dual Confirmed Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Confirmed Flight Card */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-black flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-600" /> Confirmed Flight
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Daylight Arrival
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-slate-900">
                    {tripConfig.airline || 'British Airways'} • {tripConfig.flightNumber}
                  </h4>
                  <span className="text-xs font-bold text-slate-500">{tripConfig.departureTime || '09:00'} → {tripConfig.arrivalTime || '14:20'}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Destination: <strong>{tripConfig.destinationAirport || `${destinationData.cityName} Airport`}</strong></span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-950 font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Lands at <strong>{tripConfig.arrivalTime || '14:20'}</strong> with 4+ hours daylight for hassle-free check-in.</span>
              </div>
            </div>

            {/* Confirmed Stay Card */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[11px] font-black flex items-center gap-1.5">
                  <Hotel className="w-3.5 h-3.5 text-violet-600" /> Confirmed Stay
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ★ 4.9 Solo Safe
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 truncate">
                  {tripConfig.bookedStayName}
                </h4>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{tripConfig.stayAddress || `${destinationData.cityName} City Center`}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-950 font-medium flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>24/7 Staffed Reception • Direct Transit Corridor Synced</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-100">
            <span className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Synced to Arrival Mode & Offline Travel Pack
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPack}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Luggage className="w-3.5 h-3.5" />
                <span>{isPackDownloaded ? '✓ Pack Cached' : 'Download Pack'}</span>
              </button>

              <button
                onClick={onGoToArrivalMode}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Arrival Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI FLIGHTS PLANNING SECTION */}
      {(!isAlreadyPlanned && (!bothConfirmed || isEditingBookings)) && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-violet-600" />
                Discover Safe Flights with AI ({destinationData.cityName})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ranked by daylight arrival time, terminal safety & step-free transit corridors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomFlightInput(prev => !prev)}
                className="px-3 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                {showCustomFlightInput ? 'Close Manual Entry' : '+ Enter My Ticket'}
              </button>

              {isFlightConfirmed && !isEditingFlights ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditingFlights(true)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Change Flight</span>
                  </button>
                  <button
                    onClick={handleClearFlight}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : isEditingFlights ? (
                <button
                  onClick={() => setIsEditingFlights(false)}
                  className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Done
                </button>
              ) : null}
            </div>
          </div>

          {showCustomFlightInput && (
            <form onSubmit={handleConfirmCustomFlight} className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-violet-600" /> Enter Your Booked Flight Ticket
                </span>
                <span className="text-[11px] text-violet-700 font-semibold">Decoupled: Only confirms flight</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Airline Name</label>
                  <input
                    type="text"
                    value={customAirline}
                    onChange={(e) => setCustomAirline(e.target.value)}
                    placeholder="e.g. British Airways, Delta"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={customFlightNum}
                    onChange={(e) => setCustomFlightNum(e.target.value)}
                    placeholder="e.g. BA 116, AF 23"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Landing Time</label>
                  <input
                    type="time"
                    value={customArrivalTime}
                    onChange={(e) => setCustomArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomFlightInput(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  ✓ Confirm My Flight Ticket
                </button>
              </div>
            </form>
          )}

          {/* Flight Cards */}
          <div className="space-y-3">
            {finalFlightCards.map((flight) => {
              const isThisFlightConfirmed = tripConfig?.flightNumber === flight.flightNumber && tripConfig?.flightConfirmed;

              return (
                <div
                  key={flight.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isThisFlightConfirmed
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/90 hover:border-violet-300'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{flight.airlineLogo || '✈️'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {flight.airline} • {flight.flightNumber}
                          </h4>
                          {flight.daylightArrival && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-600" /> Daylight Arrival
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {flight.originAirport} → <strong>{flight.destinationAirport}</strong> ({flight.terminal})
                        </span>
                      </div>
                    </div>

                    {flight.matchScore && (
                      <MatchScoreBadge
                        score={flight.matchScore.overall}
                        onClick={() => onOpenMatchModal({
                          title: `${flight.airline} (${flight.flightNumber})`,
                          matchScore: flight.matchScore,
                          whyChosen: flight.whyChosen,
                          safetyFeatures: flight.safetyFeatures
                        })}
                      />
                    )}
                  </div>

                  {/* Flight Timings & Price Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Departs</span>
                      <span className="font-extrabold text-slate-900">{flight.departureTime}</span>
                    </div>
                    <div className="border-x border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                      <span className="font-extrabold text-slate-700">{flight.duration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Lands (Daylight)</span>
                      <span className="font-extrabold text-emerald-700">{flight.arrivalTime}</span>
                    </div>
                  </div>

                  {/* Safety Features Bullets */}
                  {flight.safetyFeatures && flight.safetyFeatures.length > 0 && (
                    <div className="space-y-1">
                      {flight.safetyFeatures.map((feat, fIdx) => (
                        <div key={fIdx} className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-xs font-black text-slate-900">
                      {flight.priceValue ? formatPrice(flight.priceValue, homeCurrencyCode) : (flight.price ? formatPrice(flight.price, homeCurrencyCode) : 'Included')} <span className="text-[10px] font-medium text-slate-400">/ estimated</span>
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {flight.googleFlightsUrl && (
                        <a
                          href={flight.googleFlightsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 bg-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <span>Google Flights</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}

                      {isThisFlightConfirmed ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Confirmed Flight</span>
                          </span>
                          <button
                            onClick={handleClearFlight}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmFlight(flight)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Select & Confirm Flight</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VETTED STAYS WITH BOOKING.COM & HOSTELWORLD INTEGRATION */}
      {(!isAlreadyPlanned && (!bothConfirmed || isEditingBookings)) && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Vetted Solo Female Stays & Recommendations ({destinationData.cityName})
              </h3>
              <p className="text-xs text-slate-500 font-medium">Ranked by Central Recommendation Engine</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomStayInput(prev => !prev)}
                className="px-3 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                {showCustomStayInput ? 'Close Manual Entry' : '+ Enter My Stay'}
              </button>

              {isStayConfirmed && !isEditingStays ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditingStays(true)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Browse Other Stays</span>
                  </button>
                  <button
                    onClick={handleClearStay}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : isEditingStays ? (
                <button
                  onClick={() => setIsEditingStays(false)}
                  className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Done
                </button>
              ) : (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {filterTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveTypeFilter(type)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                        activeTypeFilter === type
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showCustomStayInput && (
            <form onSubmit={handleConfirmCustomStay} className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-teal-600" /> Enter Your Booked Accommodation
                </span>
                <span className="text-[11px] text-teal-700 font-semibold">Decoupled: Only confirms stay</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Hotel / Hostel / Stay Name *</label>
                  <input
                    type="text"
                    required
                    value={customStayName}
                    onChange={(e) => setCustomStayName(e.target.value)}
                    placeholder="e.g. Mama Shelter, Generator Hostel, Airbnb"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Neighborhood / Address</label>
                  <input
                    type="text"
                    value={customStayAddress}
                    onChange={(e) => setCustomStayAddress(e.target.value)}
                    placeholder={`e.g. ${destinationData.cityName} City Center`}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomStayInput(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  ✓ Confirm My Stay
                </button>
              </div>
            </form>
          )}

          {/* CUSTOM INSTRUCTIONS & TRAVELLER MEMORY PANEL (Visible when browsing) */}
          {(!isStayConfirmed || isEditingStays) && (
            <div className="p-3.5 bg-violet-50/60 rounded-2xl border border-violet-200/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-violet-950">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>AI Hotel Discovery & Custom Instructions</span>
                </div>
                <span className="text-[10px] text-violet-800 bg-violet-200/60 px-2 py-0.5 rounded-md font-bold">
                  🧠 Active Memory: Budget {formatPrice(travellerProfile?.budgetLimit || 90, homeCurrencyCode)}/night • {travellerProfile?.accPreference || 'Female Pods / Boutique'}
                </span>
              </div>

              <form onSubmit={handleApplyInstructions} className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInstructionText}
                  onChange={(e) => setUserInstructionText(e.target.value)}
                  placeholder={`Give instructions for ${destinationData.cityName} (e.g. Under $60, quiet boutique hotel, near central station, only female dorms...)`}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isLoadingRecs || isRefreshingStays}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {(isLoadingRecs || isRefreshingStays) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Discovering...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Discover Real Stays</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {isLoadingRecs ? (
            <div className="p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Discovering Real Verified Accommodations in {destinationData.cityName}...
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Querying live places, verifying solo female safety criteria, and ranking with 4D AI match scoring.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {finalStayCards.map((rec) => {
                const acc = rec.item;
                const isThisStayBooked = tripConfig?.bookedStayName === acc.name;
                const realTimeLinks = generateRealTimeBookingLinks(
                  destinationData.cityName,
                  tripConfig?.startDate || '2026-09-10',
                  tripConfig?.endDate || '2026-09-15'
                );

                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isThisStayBooked
                        ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/50 border-slate-200/90 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={acc.image}
                        alt={acc.name}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate">{acc.name}</h4>
                          <MatchScoreBadge
                            score={rec.matchScore.overall}
                            onClick={() => onOpenMatchModal({
                              title: acc.name,
                              matchScore: rec.matchScore,
                              whyChosen: rec.whyChosen,
                              safetyFeatures: acc.safetyFeatures
                            })}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">{acc.neighborhood}</span>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white font-extrabold text-[10px]">
                            {acc.priceValue ? `${formatPrice(acc.priceValue, homeCurrencyCode)} / night` : (acc.pricePerNight ? `${formatPrice(acc.pricePerNight, homeCurrencyCode)} / night` : `${homeCurrencySymbol}85 / night`)}
                          </span>
                          <span className="text-[10px] text-slate-600 font-bold">{acc.reviewBadge}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium bg-white p-2 rounded-xl border border-slate-200/60 leading-relaxed">
                      💡 {rec.whyChosen}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">{acc.paymentMethod}</span>
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <a
                          href={realTimeLinks.bookingComLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Booking.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={realTimeLinks.hostelworldLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Hostelworld</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={realTimeLinks.googleHotelsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Google Hotels</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {isThisStayBooked ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>✓ Confirmed Stay</span>
                            </span>
                            <button
                              onClick={handleClearStay}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmBooking(acc)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Select & Confirm Stay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. ESSENTIAL ITEMS PACKING CHECKLIST */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-violet-600" />
              Essential Packing Checklist ({checkedCount}/{packingChecklist.length} Packed)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Essential items curated for solo female travel safety</p>
          </div>
          <span className="text-xs font-black text-violet-950 px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200">
            {Math.round((checkedCount / packingChecklist.length) * 100)}% Ready
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-violet-600 h-full transition-all duration-300"
            style={{ width: `${(checkedCount / packingChecklist.length) * 100}%` }}
          ></div>
        </div>

        {/* Checklist Items List */}
        <div className="space-y-2 pt-1">
          {packingChecklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                item.checked
                  ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 font-bold hover:border-violet-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={`text-xs ${item.checked ? 'line-through text-slate-400 font-medium' : 'font-extrabold'}`}>
                  {item.item}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {item.category}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveChecklistItem(item.id); }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Packing Item Form */}
        <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add custom item to packing list..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* 7. CITY CULTURE, LOCAL ETIQUETTE & FOOD HIGHLIGHTS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-violet-600" />
            {destinationData.cityName} Culture, Local Etiquette & Culinary Delights
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Essential cultural tips & female-friendly dining guide</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Local Etiquette Card */}
          <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-2">
            <h4 className="font-extrabold text-violet-950 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-violet-600" /> Local Customs & Etiquette
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-700 font-medium">
              {(destinationData.etiquetteTips && destinationData.etiquetteTips.length > 0 ? destinationData.etiquetteTips : [
                `Greeting: A polite greeting when entering small artisan shops is customary in ${destinationData.cityName}.`,
                `Payment: Cards and contactless payments are widely accepted across ${destinationData.cityName}.`,
                `Transit Safety: Keep your belongings zipped and secured during peak transit hours in ${destinationData.cityName}.`
              ]).map((tip, idx) => {
                const colonIdx = typeof tip === 'string' ? tip.indexOf(':') : -1;
                const prefix = colonIdx > -1 ? tip.slice(0, colonIdx + 1) : '';
                const rest = colonIdx > -1 ? tip.slice(colonIdx + 1) : tip;
                return (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-violet-600 font-bold shrink-0">•</span>
                    <span>{prefix ? <strong>{prefix}</strong> : null}{rest}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Local Culinary Highlights Card */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-600" /> Must-Try Foods & Solo Dining
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-700 font-medium">
              {(destinationData.foodHighlights && destinationData.foodHighlights.length > 0 ? destinationData.foodHighlights : [
                `Local Specialties: Artisanal bakeries and authentic street food in central ${destinationData.cityName}.`,
                `Solo Dining Friendly: Single-diner counters and relaxed window seats at central markets in ${destinationData.cityName}.`,
                `Café Culture: Cozy third-wave cafes with complimentary Wi-Fi and safe solo traveler ambiance.`
              ]).map((food, idx) => {
                const colonIdx = typeof food === 'string' ? food.indexOf(':') : -1;
                const prefix = colonIdx > -1 ? food.slice(0, colonIdx + 1) : '';
                const rest = colonIdx > -1 ? food.slice(colonIdx + 1) : food;
                return (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span>{prefix ? <strong>{prefix}</strong> : null}{rest}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 8. AI BUDGET ESTIMATION BREAKDOWN */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" />
              AI Budget Estimation ({totalDays} Days in {destinationData.cityName})
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Tailored for your {travellerProfile?.budgetTier || 'Balanced ($$)'} tier • Departing from {travellerProfile?.homeCountry || 'your home country'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-black text-slate-900 px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200 inline-block sm:block">
              Est. Total: {homeCurrencySymbol || '$'}{totalEstimatedCost}
            </span>
            {currencyCode !== (homeCurrencyCode || 'USD') && (
              <span className="text-[10px] text-violet-700 font-bold block mt-0.5">
                ≈ {localEstimatedTotal.toLocaleString()} {currencyCode} ({currencySymbol})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block text-[10px]">Flights (Est.)</span>
            <span className="font-extrabold text-slate-900 text-sm">{homeCurrencySymbol || '$'}{flightEstCost}</span>
            <span className="text-[10px] text-slate-400 block truncate">{tripConfig?.flightNumber ? `Flight ${tripConfig.flightNumber}` : `From ${travellerProfile?.homeCountry || 'Home Hub'}`}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block text-[10px]">Accommodations</span>
            <span className="font-extrabold text-slate-900 text-sm">{homeCurrencySymbol || '$'}{totalStayCost}</span>
            <span className="text-[10px] text-slate-400 block">{homeCurrencySymbol || '$'}{stayCostPerNight}/night</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block text-[10px]">Meals & Dining</span>
            <span className="font-extrabold text-slate-900 text-sm">{homeCurrencySymbol || '$'}{totalFoodCost}</span>
            <span className="text-[10px] text-slate-400 block">{homeCurrencySymbol || '$'}{foodCostPerDay}/day</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block text-[10px]">Local Transit</span>
            <span className="font-extrabold text-slate-900 text-sm">{homeCurrencySymbol || '$'}{totalTransitCost}</span>
            <span className="text-[10px] text-slate-400 block">{homeCurrencySymbol || '$'}{transitCostPerDay}/day</span>
          </div>
        </div>
      </div>

      {/* 9. OFFLINE TRAVEL PACK DOWNLOADER */}
      <div className="bg-violet-50/90 border border-violet-200 rounded-3xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-violet-950 flex items-center gap-1.5">
              <Luggage className="w-4 h-4 text-violet-600" />
              Offline Travel Pack ({destinationData.cityName})
            </h3>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Vector maps, arrival corridors, flight & stay vouchers, emergency contacts (38 MB)
            </p>
          </div>
          
          <button
            onClick={handleDownloadPack}
            disabled={isDownloadingPack}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0 ${
              isPackDownloaded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : isDownloadingPack
                ? 'bg-violet-400 text-white cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {isDownloadingPack ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading {downloadProgress}%...</span>
              </>
            ) : isPackDownloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✓ Pack Cached (38 MB)</span>
              </>
            ) : (
              <>
                <Luggage className="w-3.5 h-3.5" />
                <span>Download Pack</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Animated Download Progress Bar */}
        {isDownloadingPack && (
          <div className="w-full bg-violet-200/70 h-2 rounded-full overflow-hidden">
            <div
              className="bg-violet-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        )}

        {isPackDownloaded && (
          <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-200">
            <span>🛡️ Offline Arrival Mode Ready: 100% accessible with 0% cellular data.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPackModal(true)}
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer shadow-2xs text-[10px]"
              >
                👁️ View Pack Data
              </button>
              <button
                onClick={handleDownloadPack}
                className="underline hover:text-emerald-950 font-bold cursor-pointer text-[10px]"
              >
                Re-sync Pack
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OFFLINE TRAVEL PACK INSPECTOR MODAL */}
      {showPackModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Luggage className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Cached Travel Pack ({destinationData.cityName})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Interactive Offline Data Payload (38 MB)</p>
                </div>
              </div>
              <button
                onClick={() => setShowPackModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-medium">
              {/* 1. BOOKED FLIGHT & STAY CORRIDOR */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-emerald-600" /> ✈️ Synchronized Flight & Stay Corridors
                  </span>
                  <button
                    onClick={() => {
                      setShowPackModal(false);
                      if (onGoToArrivalMode) onGoToArrivalMode();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>Launch Arrival</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Flight: <strong>{tripConfig?.flightNumber || 'Direct Flight'}</strong> ({tripConfig?.airline || 'Scheduled Carrier'})</span>
                    <span className="text-emerald-700">Lands {tripConfig?.arrivalTime || '14:00'}</span>
                  </div>
                  <div className="text-slate-600">
                    Stay: <strong>{tripConfig?.bookedStayName || `${destinationData.cityName} Hotel`}</strong> ({tripConfig?.stayAddress || `${destinationData.cityName} City Center`})
                  </div>
                </div>
              </div>

              {/* 2. MAPS & NAVIGATION */}
              <div
                onClick={() => {
                  const airportName = tripConfig?.destinationAirport || `${destinationData.cityName} Airport`;
                  const stayName = tripConfig?.bookedStayName || `${destinationData.cityName} Stay`;
                  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(airportName)}&destination=${encodeURIComponent(stayName + ', ' + destinationData.cityName)}&travelmode=transit`;
                  window.open(routeUrl, '_blank');
                }}
                className="p-3.5 rounded-2xl bg-violet-50/60 hover:bg-violet-100/80 border border-violet-200/80 transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-violet-950 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-violet-600" /> 🗺️ Google Maps Offline Safe Route Corridor
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-violet-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Pre-calibrated route: <strong>{tripConfig?.destinationAirport || `${destinationData.cityName} Airport`}</strong> → <strong>{tripConfig?.bookedStayName || `${destinationData.cityName} Stay`}</strong>. Tap to open turn-by-turn navigation in Google Maps (works 100% offline with zero cellular data once city area is saved).
                </p>
              </div>

              {/* 3. LOCAL EMERGENCY CONTACTS */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
                <span className="font-extrabold text-rose-950 text-xs flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-rose-600" /> 🚨 Local Emergency Speed-Dial ({destinationData.cityName})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(destinationData.emergencyContacts || [
                    { name: 'Universal Emergency', number: '112' },
                    { name: 'Local Police', number: '110' }
                  ]).map((contact, idx) => (
                    <a
                      key={idx}
                      href={`tel:${contact.number}`}
                      className="p-2 rounded-xl bg-white hover:bg-rose-100 border border-rose-200 text-rose-900 flex items-center justify-between font-bold text-[11px] transition-colors shadow-2xs"
                    >
                      <span className="truncate">{contact.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px]">
                        📞 {contact.number}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 4. ESSENTIAL LANGUAGE PACK */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                <span className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-600" /> 🗣️ Essential Offline Language Pack
                </span>
                <div className="space-y-1.5 pt-1">
                  {(destinationData.offlineFlashcards || [
                    { english: 'Help me, please!', translation: 'Pomoc, prosím!', phonetic: 'Help me please' }
                  ]).map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const u = new SpeechSynthesisUtterance(card.translation || card.english);
                          u.rate = 0.85;
                          window.speechSynthesis.speak(u);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 text-[11px] block">{card.english}</span>
                        <span className="text-[11px] font-bold text-purple-900">{card.translation}</span>
                        {card.phonetic && (
                          <span className="text-[10px] text-slate-400 italic block">({card.phonetic})</span>
                        )}
                      </div>
                      <Volume2 className="w-4 h-4 text-purple-600 shrink-0 hover:scale-110 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPackModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-2xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
