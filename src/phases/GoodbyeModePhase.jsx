import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  PlaneTakeoff,
  Award,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Calendar,
  Image as ImageIcon,
  Share2,
  Plus,
  Bookmark,
  Edit3,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Check,
  Sun,
  Camera,
  Upload,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
import { getRecommendedReturnFlights } from '../services/flightService';
import MatchScoreBadge from '../components/MatchScoreBadge';
import { formatPrice } from '../services/budgetCalculatorService';

function calculateCorridorTimes(departureTimeStr = '18:30') {
  let hours = 18;
  let minutes = 30;
  if (departureTimeStr && departureTimeStr.includes(':')) {
    const parts = departureTimeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      hours = h;
      minutes = m;
    }
  }

  const formatTime = (totalMinutes) => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    return `${displayH}:${displayM} ${period}`;
  };

  const depTotalMinutes = hours * 60 + minutes;
  const boardingMinutes = depTotalMinutes - 45;
  const securityMinutes = depTotalMinutes - 120;
  const transitMinutes = depTotalMinutes - 210;
  const checkoutMinutes = depTotalMinutes - 240;

  return {
    depFormatted: formatTime(depTotalMinutes),
    boardingFormatted: formatTime(boardingMinutes),
    securityFormatted: formatTime(securityMinutes),
    transitFormatted: formatTime(transitMinutes),
    checkoutFormatted: formatTime(checkoutMinutes)
  };
}

export default function GoodbyeModePhase({
  destinationData,
  travellerProfile,
  authUser,
  tripConfig,
  onSaveTripConfig,
  onOpenMatchModal
}) {
  const homeCountry = travellerProfile?.homeCountry || authUser?.homeCountry || 'United States';
  const homeCurrencyCode = travellerProfile?.preferredCurrency || (homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(homeCountry) ? 'EUR' : 'USD'));

  // Journal entries & photos persistence (Issue #11)
  const journalStorageKey = `sakhi_journal_entries_${authUser?.id || 'default'}_${tripConfig?.id || destinationData?.id || 'default'}`;
  const photoStorageKey = `sakhi_journal_photos_${authUser?.id || 'default'}_${tripConfig?.id || destinationData?.id || 'default'}`;

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(journalStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return destinationData?.journalEntries || [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(journalStorageKey, JSON.stringify(entries));
    } catch (e) {}
  }, [entries, journalStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(journalStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
        }
      } else if (destinationData?.journalEntries) {
        setEntries(destinationData.journalEntries);
      }
    } catch (e) {}
  }, [journalStorageKey, destinationData?.journalEntries]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedPhotoForEntry, setSelectedPhotoForEntry] = useState(destinationData?.heroImage || '');

  // Photo Journal & Scrapbook State with Persistence
  const fileInputRef = useRef(null);
  const [tripPhotos, setTripPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem(photoStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    const initial = [];
    if (destinationData?.heroImage) {
      initial.push({
        id: 'photo-hero',
        url: destinationData.heroImage,
        caption: `${destinationData.cityName} Cityscape`,
        date: 'Day 1',
        isUserUploaded: false
      });
    }
    (destinationData?.journalEntries || []).forEach((entry, idx) => {
      if (entry.image) {
        initial.push({
          id: `photo-entry-${entry.id || idx}`,
          url: entry.image,
          caption: entry.title,
          date: entry.day || `Day ${idx + 1}`,
          isUserUploaded: false
        });
      }
    });
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(photoStorageKey, JSON.stringify(tripPhotos));
    } catch (e) {}
  }, [tripPhotos, photoStorageKey]);

  const [lightboxImage, setLightboxImage] = useState(null);
  const [isAddingUrlPhoto, setIsAddingUrlPhoto] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [customPhotoCaption, setCustomPhotoCaption] = useState('');

  const displayName = travellerProfile?.name?.split(' ')[0] || authUser?.name?.split(' ')[0] || 'Traveller';
  const actualStayName = tripConfig?.bookedStayName || destinationData?.accommodations?.[0]?.name || `${destinationData?.cityName || 'City'} Verified Stay`;

  // Departure Flight State
  const [activeFlightTab, setActiveFlightTab] = useState('ai-recommended'); // 'ai-recommended' | 'custom'
  const [depFlightNumber, setDepFlightNumber] = useState(tripConfig?.departureFlightNumber || '');
  const [depAirline, setDepAirline] = useState(tripConfig?.departureAirline || '');
  const [depDate, setDepDate] = useState(tripConfig?.departureDate || tripConfig?.endDate || '');
  const [depTime, setDepTime] = useState(tripConfig?.departureTime || '18:30');
  const [depAirport, setDepAirport] = useState(
    tripConfig?.departureAirport || (destinationData ? `${destinationData.cityName} International Airport` : '')
  );
  const [returnAirport, setReturnAirport] = useState(
    tripConfig?.returnAirport || travellerProfile?.homeCountry || 'Home Country'
  );
  const [isFlightConfirmed, setIsFlightConfirmed] = useState(!!tripConfig?.departureFlightConfirmed);
  const [isEditingFlight, setIsEditingFlight] = useState(!tripConfig?.departureFlightConfirmed);
  const [flightSavedToast, setFlightSavedToast] = useState(null);

  // Sync state if tripConfig changes externally
  useEffect(() => {
    if (tripConfig) {
      if (tripConfig.departureFlightNumber) setDepFlightNumber(tripConfig.departureFlightNumber);
      if (tripConfig.departureAirline) setDepAirline(tripConfig.departureAirline);
      if (tripConfig.departureDate) setDepDate(tripConfig.departureDate);
      if (tripConfig.departureTime) setDepTime(tripConfig.departureTime);
      if (tripConfig.departureAirport) setDepAirport(tripConfig.departureAirport);
      if (tripConfig.returnAirport) setReturnAirport(tripConfig.returnAirport);
      setIsFlightConfirmed(!!tripConfig.departureFlightConfirmed);
      if (tripConfig.departureFlightConfirmed) {
        setIsEditingFlight(false);
      }
    }
  }, [tripConfig]);

  // AI Recommended Return Flights
  const recommendedReturnFlights = destinationData ? getRecommendedReturnFlights({
    destinationData,
    tripConfig,
    travellerProfile
  }) : [];

  if (!destinationData) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">No Trip Memories Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Trip reflections, digital scrapbook entries, and memory journals become available as you complete your solo trips.
        </p>
      </div>
    );
  }

  const corridorTimes = calculateCorridorTimes(depTime);

  // Select AI Recommended Return Flight
  const handleSelectAiFlight = (flight) => {
    const updated = {
      ...tripConfig,
      departureFlightConfirmed: true,
      departureFlightNumber: flight.flightNumber,
      departureAirline: flight.airline,
      departureDate: depDate || tripConfig?.endDate || '',
      departureTime: flight.departureTime,
      departureAirport: flight.originAirport,
      returnAirport: flight.destinationAirport
    };

    setDepFlightNumber(flight.flightNumber);
    setDepAirline(flight.airline);
    setDepTime(flight.departureTime);
    setDepAirport(flight.originAirport);
    setReturnAirport(flight.destinationAirport);

    setIsFlightConfirmed(true);
    setIsEditingFlight(false);
    setFlightSavedToast(`Confirmed AI Recommended Flight ${flight.flightNumber} (${flight.airline}) departing at ${flight.departureTime}!`);
    setTimeout(() => setFlightSavedToast(null), 4500);

    if (onSaveTripConfig) {
      onSaveTripConfig(updated);
    }
  };

  // Confirm Custom Flight
  const handleConfirmCustomFlight = (e) => {
    e.preventDefault();
    const updated = {
      ...tripConfig,
      departureFlightConfirmed: true,
      departureFlightNumber: depFlightNumber,
      departureAirline: depAirline,
      departureDate: depDate,
      departureTime: depTime,
      departureAirport: depAirport,
      returnAirport: returnAirport
    };

    setIsFlightConfirmed(true);
    setIsEditingFlight(false);
    setFlightSavedToast('Custom departure flight confirmed! Your final day schedule has been calibrated.');
    setTimeout(() => setFlightSavedToast(null), 4500);

    if (onSaveTripConfig) {
      onSaveTripConfig(updated);
    }
  };

  // Photo Upload Handler (Device file upload)
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoUrl = event.target.result;
        const newPhotoObj = {
          id: `custom-photo-${Date.now()}-${index}`,
          url: photoUrl,
          caption: file.name.replace(/\.[^/.]+$/, '') || `${destinationData.cityName} Memory`,
          date: `Day ${Math.min(entries.length + 1, tripConfig?.durationDays || 5)}`,
          isUserUploaded: true
        };
        setTripPhotos(prev => [newPhotoObj, ...prev]);
        setSelectedPhotoForEntry(photoUrl);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    setFlightSavedToast('Trip photo(s) added to your photo journal!');
    setTimeout(() => setFlightSavedToast(null), 4000);
  };

  // Add Photo via URL
  const handleAddUrlPhoto = (e) => {
    e.preventDefault();
    if (!customPhotoUrl.trim()) return;
    const newPhotoObj = {
      id: `custom-url-photo-${Date.now()}`,
      url: customPhotoUrl.trim(),
      caption: customPhotoCaption.trim() || `${destinationData.cityName} Photo Moment`,
      date: `Day ${Math.min(entries.length + 1, tripConfig?.durationDays || 5)}`,
      isUserUploaded: true
    };
    setTripPhotos(prev => [newPhotoObj, ...prev]);
    setSelectedPhotoForEntry(customPhotoUrl.trim());
    setCustomPhotoUrl('');
    setCustomPhotoCaption('');
    setIsAddingUrlPhoto(false);
    setFlightSavedToast('Trip photo added to your scrapbook!');
    setTimeout(() => setFlightSavedToast(null), 4000);
  };

  const handleDeletePhoto = (photoId) => {
    setTripPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Add Memory Entry
  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const photoToUse = selectedPhotoForEntry || destinationData.heroImage;
    const newEntry = {
      id: `j-custom-${Date.now()}`,
      day: `Day ${entries.length + 1}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title: newTitle,
      location: destinationData.cityName,
      mood: 'Grateful & Inspired ✨',
      content: newContent || `Memorable moment during my solo trip to ${destinationData.cityName}.`,
      image: photoToUse,
      visitedPlaces: [destinationData.cityName],
      stats: { steps: '10,500', safetyRating: '10/10 Safe' }
    };
    setEntries([newEntry, ...entries]);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      {/* Goodbye Mode Hero Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-purple-200" /> Farewell {destinationData.cityName}
          </span>
          <span className="text-xs bg-slate-950/30 px-3 py-1 rounded-xl font-bold border border-white/20">
            Trip Accomplished 🎉
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Safely Journey Home, {displayName}!</h2>
        <p className="text-xs text-purple-100 mt-1 max-w-md font-medium">
          Sakhi has archived your safe solo travel journal & memories. Calibrate your departure flight and preserve your trip photo scrapbook.
        </p>
      </div>

      {/* Toast Banner */}
      {flightSavedToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{flightSavedToast}</span>
        </div>
      )}

      {/* 1. DEPARTURE FLIGHT DETAILS & RETURN CORRIDOR SECTION */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PlaneTakeoff className="w-4 h-4 text-purple-600" />
              Departure Flight Details & Return Corridor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an AI recommended return flight or enter custom flight details to calibrate hotel checkout and airport transit.
            </p>
          </div>
          {isFlightConfirmed && !isEditingFlight && (
            <span className="self-start sm:self-auto text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed Flight
            </span>
          )}
        </div>

        {/* View Mode: Confirmed Flight Summary & Dynamic Corridor Timeline */}
        {isFlightConfirmed && !isEditingFlight ? (
          <div className="space-y-4">
            {/* Confirmed Flight Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border border-purple-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-white/80 px-2 py-0.5 rounded-md border border-purple-200">
                    Departing Flight
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    {depAirline ? `${depAirline} ` : ''}{depFlightNumber || 'Flight Scheduled'}
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    {depAirport || `${destinationData.cityName} Airport`} → {returnAirport}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingFlight(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-purple-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Flight</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-purple-200/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Departure Date</span>
                  <span className="font-extrabold text-slate-800">{depDate || tripConfig?.endDate || 'Trip End Date'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Takeoff Time</span>
                  <span className="font-extrabold text-purple-900">{corridorTimes.depFormatted}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Boarding Gate</span>
                  <span className="font-extrabold text-slate-800">{corridorTimes.boardingFormatted}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Origin Terminal</span>
                  <span className="font-extrabold text-slate-800 truncate block">{depAirport || 'Main Terminal'}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Departure Corridor Milestones */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Calibrated Departure Schedule
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                      {corridorTimes.checkoutFormatted}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Checkout</span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 leading-tight">Stay Checkout</h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Check out of {actualStayName}. Front desk luggage storage available if departing later.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                      {corridorTimes.transitFormatted}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Transit</span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 leading-tight">Airport Rail Corridor</h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Board dedicated express train or vetted transfer corridor to {depAirport || 'Airport'}.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                      {corridorTimes.securityFormatted}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Terminal</span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 leading-tight">Security & Bag Drop</h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Drop checked bags and clear priority international departures security screening.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-800 bg-purple-200/80 px-1.5 py-0.5 rounded">
                      {corridorTimes.boardingFormatted}
                    </span>
                    <span className="text-[10px] font-bold text-purple-600">Gate</span>
                  </div>
                  <h5 className="text-xs font-black text-purple-950 leading-tight">Boarding Gate</h5>
                  <p className="text-[11px] text-purple-800/80 font-medium">
                    Board {depFlightNumber || 'flight'} for safe return journey to {returnAirport}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Selection / Edit Mode: Toggle between AI Recommended and Custom */
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 w-fit">
              <button
                onClick={() => setActiveFlightTab('ai-recommended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFlightTab === 'ai-recommended'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Recommended Return Flights</span>
              </button>

              <button
                onClick={() => setActiveFlightTab('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFlightTab === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Custom Flight Details</span>
              </button>
            </div>

            {/* TAB 1: AI Recommended Return Flights */}
            {activeFlightTab === 'ai-recommended' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    Curated safe return flights from <strong>{destinationData.cityName}</strong> to your home country (<strong>{travellerProfile?.homeCountry || 'Home'}</strong>). Ranked by daytime takeoff, terminal security, and rail links.
                  </span>
                </div>

                <div className="space-y-3">
                  {recommendedReturnFlights.map((flight) => (
                    <div
                      key={flight.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-purple-50/30 hover:border-purple-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{flight.airlineLogo || '✈️'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm">
                                {flight.airline} • {flight.flightNumber}
                              </h4>
                              {flight.daylightDeparture && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center gap-1">
                                  <Sun className="w-3 h-3 text-amber-600" /> Daylight Departure
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                              {flight.originAirport} → <strong>{flight.destinationAirport}</strong> ({flight.terminal})
                            </span>
                          </div>
                        </div>

                        {flight.matchScore && (
                          <MatchScoreBadge
                            score={flight.matchScore.overall}
                            onClick={() => onOpenMatchModal && onOpenMatchModal({
                              title: `${flight.airline} (${flight.flightNumber})`,
                              matchScore: flight.matchScore,
                              whyChosen: flight.whyChosen,
                              safetyFeatures: flight.safetyFeatures
                            })}
                          />
                        )}
                      </div>

                      {/* Flight Timings, Duration & Price */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Takeoff</span>
                            <span className="font-black text-purple-900 text-sm">{flight.departureTime}</span>
                          </div>
                          <span className="text-slate-300 font-light">→</span>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Lands</span>
                            <span className="font-black text-slate-800 text-sm">{flight.arrivalTime}</span>
                          </div>
                          <div className="hidden sm:block pl-2 border-l border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                            <span className="font-semibold text-slate-600">{flight.duration}</span>
                          </div>
                          <div className="hidden sm:block pl-2 border-l border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Fare</span>
                            <span className="font-extrabold text-emerald-700">
                              {flight.priceValue ? formatPrice(flight.priceValue, homeCurrencyCode) : (flight.price ? formatPrice(flight.price, homeCurrencyCode) : 'Included')}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectAiFlight(flight)}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlaneTakeoff className="w-3.5 h-3.5" />
                          <span>Select & Confirm Flight</span>
                        </button>
                      </div>

                      {/* Safety Highlights */}
                      {flight.safetyFeatures && flight.safetyFeatures.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {flight.safetyFeatures.map((feat, fIdx) => (
                            <div key={fIdx} className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Custom Flight Form */}
            {activeFlightTab === 'custom' && (
              <form onSubmit={handleConfirmCustomFlight} className="space-y-3.5 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Enter your custom departing flight details below. Once confirmed, your final day schedule automatically synchronizes with your checkout and airport corridor timing.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Flight Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NH 106, AF 022, JL 006"
                      value={depFlightNumber}
                      onChange={(e) => setDepFlightNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Operating Airline</label>
                    <input
                      type="text"
                      placeholder="e.g. All Nippon Airways, Air France, British Airways"
                      value={depAirline}
                      onChange={(e) => setDepAirline(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Departure Date</label>
                    <input
                      type="date"
                      value={depDate}
                      onChange={(e) => setDepDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Departure / Takeoff Time</label>
                    <input
                      type="time"
                      required
                      value={depTime}
                      onChange={(e) => setDepTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Departure Airport</label>
                    <input
                      type="text"
                      placeholder="e.g. Narita Airport (NRT)"
                      value={depAirport}
                      onChange={(e) => setDepAirport(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 block">Return Destination / Home Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. LAX / London Heathrow / Home"
                      value={returnAirport}
                      onChange={(e) => setReturnAirport(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlaneTakeoff className="w-4 h-4" />
                    <span>Confirm Departure Flight & Calibrate Plan</span>
                  </button>
                  {isFlightConfirmed && (
                    <button
                      type="button"
                      onClick={() => setIsEditingFlight(false)}
                      className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 2. Hotel Checkout Checklist (Referencing actualStayName) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Stay Checkout Checklist • {actualStayName}
          </h3>
          <span className="text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-xl">
            {isFlightConfirmed ? `Flight at ${corridorTimes.depFormatted}` : 'Flight Scheduled'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-800 font-bold">
            <span>Essential Departure Verifications</span>
            <span className="text-[10px] text-purple-700 font-extrabold">4 / 4 Items Ready</span>
          </div>
          <div className="space-y-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Passport & Travel Insurance Documents verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Room Key Returned at {actualStayName} Front Desk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Airport Rail / Shuttle scheduled for {corridorTimes.transitFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Luggage packed with power banks and essentials in carry-on</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PHOTO JOURNAL & TRIP MEMORIES SECTION */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-600" />
              {destinationData.cityName} Photo Journal & Scrapbook
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your solo travel photos, curate memories, and create lasting visual journals.
            </p>
          </div>

          {/* Photo Journal Action Buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Add Trip Photos</span>
            </button>

            <button
              onClick={() => setIsAddingUrlPhoto(!isAddingUrlPhoto)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Photo Link</span>
            </button>
          </div>
        </div>

        {/* Photo URL Input Bar (Collapsible) */}
        {isAddingUrlPhoto && (
          <form onSubmit={handleAddUrlPhoto} className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 animate-fade-in text-xs">
            <span className="font-extrabold text-purple-950 block">Add Photo via Web URL</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                required
                placeholder="Paste image link (https://...)"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-purple-600"
              />
              <input
                type="text"
                placeholder="Caption (e.g. Sunset view from Shibuya Sky)"
                value={customPhotoCaption}
                onChange={(e) => setCustomPhotoCaption(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-purple-600"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold transition-colors cursor-pointer"
              >
                Add Photo to Journal
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUrlPhoto(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TRIP PHOTO SCRAPBOOK GALLERY */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              Trip Photo Gallery ({tripPhotos.length} Photos)
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Click any photo to enlarge
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tripPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-100 aspect-4/3 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                onClick={() => setLightboxImage(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Trip Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-white bg-purple-600/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      {photo.date || 'Trip'}
                    </span>
                    {photo.isUserUploaded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white truncate drop-shadow-xs">
                    {photo.caption || destinationData.cityName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. AI Travel Journal & Custom Note Form */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-600" />
              Journal Notes & Travel Thoughts
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              {entries.length} Entries Archived
            </span>
          </div>

          {/* Add Memory Form */}
          <form onSubmit={handleAddMemory} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-3">
            <span className="text-xs font-extrabold text-slate-900 block flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-purple-600" /> Add Custom Memory Note with Photo
            </span>

            <input
              type="text"
              placeholder="Memory Title (e.g. Morning coffee in Old Town)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-600 bg-white"
            />

            <textarea
              placeholder="Write your thoughts..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-600 bg-white"
            />

            {/* Selected Photo Thumbnail & Photo Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block">Attach Photo to Note:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tripPhotos.slice(0, 6).map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhotoForEntry(photo.url)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedPhotoForEntry === photo.url
                        ? 'border-purple-600 ring-2 ring-purple-200 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt="thumbnail" className="w-full h-full object-cover" />
                    {selectedPhotoForEntry === photo.url && (
                      <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Journal Entry</span>
            </button>
          </form>

          {/* Journal Entries List */}
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-start gap-3">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    onClick={() => setLightboxImage({ url: entry.image, caption: entry.title, date: entry.day })}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl shrink-0 cursor-pointer hover:opacity-90 transition-opacity border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">
                        {entry.day} • {entry.date}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {entry.stats?.safetyRating || '10/10 Safe'}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight mt-1">{entry.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">{entry.content}</p>
                  </div>
                </div>

                {/* Visited Places Badges */}
                {entry.visitedPlaces && entry.visitedPlaces.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-slate-400">📍 Visited Places:</span>
                    {entry.visitedPlaces.map((place, pIdx) => (
                      <span key={pIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                        {place}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PHOTO LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900">{lightboxImage.caption || `${destinationData.cityName} Photo`}</h4>
                <span className="text-[11px] text-purple-700 font-bold">{lightboxImage.date || 'Solo Travel Memory'}</span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-slate-950 flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Enlarged photo'}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
