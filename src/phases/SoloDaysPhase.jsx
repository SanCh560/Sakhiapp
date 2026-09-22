import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Zap, Coffee, Moon, ExternalLink, ShieldCheck, Clock, CreditCard, AlertTriangle, ArrowRight, MessageCircle, Newspaper, CloudSun, ThumbsUp, RefreshCw, CheckCircle2, Sliders, Calendar, Save, AlertCircle, X, ChevronDown, ChevronUp, Check, Info, Plane, Hotel } from 'lucide-react';
import MatchScoreBadge from '../components/MatchScoreBadge';
import { scoreRecommendationList } from '../engine/recommendationEngine';
import { generateDynamicItinerary } from '../services/itineraryGeneratorService';
import { fetchMultiDayForecast } from '../services/weatherForecastService';

export default function SoloDaysPhase({
  destinationData,
  travellerProfile,
  tripConfig,
  onOpenMatchModal,
  onOpenChat,
  activeStage = 'solo-days',
  onSaveTripConfig,
  onGoToArrivalMode
}) {
  const [energyLevel, setEnergyLevel] = useState('🌿 Moderate'); // '⚡ High Energy' | '🌿 Moderate' | '😴 Need Rest'
  const durationDays = Math.max(1, parseInt(tripConfig?.durationDays || 5, 10));

  // Dynamic N-Day Itinerary State
  const [itineraryDays, setItineraryDays] = useState(() => {
    return destinationData ? generateDynamicItinerary(destinationData, travellerProfile, tripConfig) : [];
  });

  // Dynamic Weather Forecast State
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  // Plan Acceptance State: 'suggested' | 'needs-acceptance' | 'accepted'
  const planStatus = tripConfig?.planStatus || (activeStage === 'before-trip' ? 'suggested' : 'needs-acceptance');

  // AI Change Advisory State (Weather & Mood Change Detection)
  const [aiAdvisory, setAiAdvisory] = useState({
    active: false,
    dayAffected: 3,
    reasonCategory: '🌧️ Weather Alert',
    rationale: '',
    proposedSwapTitle: ''
  });

  const [userAdvisoryChoice, setUserAdvisoryChoice] = useState(null); // null | 'accepted' | 'rejected'

  // Fetch live weather and synchronize itinerary when destination, duration, or tripConfig changes
  useEffect(() => {
    if (!destinationData?.id) return;

    // 1. Regenerate itinerary dynamically
    setItineraryDays(generateDynamicItinerary(destinationData, travellerProfile, tripConfig));
    setUserAdvisoryChoice(null);

    // 2. Fetch multi-day weather forecast
    let isMounted = true;
    fetchMultiDayForecast({
      lat: destinationData.lat,
      lng: destinationData.lng,
      cityName: destinationData.cityName,
      durationDays
    }).then((forecast) => {
      if (!isMounted) return;
      setWeatherForecast(forecast);

      // Check if any day has adverse weather to trigger explainable AI advisory
      const adverseDay = forecast.find(f => f.isAdverse);
      if (adverseDay) {
        setAiAdvisory({
          active: true,
          dayAffected: adverseDay.day,
          reasonCategory: '🌧️ Weather Alert',
          rationale: adverseDay.advisoryRationale,
          proposedSwapTitle: adverseDay.proposedSwapTitle
        });
      } else {
        setAiAdvisory({
          active: false,
          dayAffected: null,
          reasonCategory: '☀️ Favorable Weather',
          rationale: `Clear & pleasant conditions forecasted across all ${durationDays} days in ${destinationData.cityName}.`,
          proposedSwapTitle: null
        });
      }
    });

    return () => { isMounted = false; };
  }, [destinationData?.id, destinationData?.cityName, durationDays, tripConfig?.bookedStayName, tripConfig?.departureFlightConfirmed, tripConfig?.departureTime]);

  if (!destinationData || !tripConfig?.destId) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">No Active Trip Itinerary</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your day-by-day solo itineraries, safe rest stops, and weather alerts will appear here once you plan or select a trip.
        </p>
      </div>
    );
  }

  // Score candidate spots dynamically using the Central Recommendation Engine
  const scoredSpots = scoreRecommendationList(
    destinationData.soloSpots || [],
    travellerProfile || { budgetTier: 'Balanced ($$)', accPreference: 'Hostel / Female Pods' },
    tripConfig || { durationDays, bookedStayName: '' },
    destinationData,
    energyLevel
  );

  // Dynamic spot filtering by traveller energy level (Issue #10)
  const energyFilteredSpots = scoredSpots.filter(rec => {
    const spotEnergy = rec.item?.energyRequired || '';
    if (energyLevel.includes('High')) {
      return spotEnergy.includes('High') || spotEnergy.includes('Walking');
    }
    if (energyLevel.includes('Rest')) {
      return spotEnergy.includes('Low') || spotEnergy.includes('Rest');
    }
    // Moderate
    return spotEnergy.includes('Moderate') || spotEnergy.includes('Balanced') || !spotEnergy;
  });

  const spotsToDisplay = energyFilteredSpots.length > 0 ? energyFilteredSpots : scoredSpots;

  const handleAcceptPlan = () => {
    if (onSaveTripConfig) {
      onSaveTripConfig({
        ...tripConfig,
        planStatus: 'accepted',
        planAcceptedAt: new Date().toISOString()
      });
    }
    setToastMessage(`✓ ${durationDays}-Day Trip Plan for ${destinationData.cityName} accepted & confirmed!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRecalibrateWeather = async () => {
    const forecast = await fetchMultiDayForecast({
      lat: destinationData.lat,
      lng: destinationData.lng,
      cityName: destinationData.cityName,
      durationDays
    });
    setWeatherForecast(forecast);
    setItineraryDays(generateDynamicItinerary(destinationData, travellerProfile, tripConfig));
    setToastMessage(`🔄 Itinerary recalibrated with live weather conditions for ${destinationData.cityName}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAcceptAiChange = () => {
    setUserAdvisoryChoice('accepted');
    setItineraryDays(prev => prev.map(dayObj => {
      if (dayObj.day === aiAdvisory.dayAffected) {
        return {
          ...dayObj,
          items: dayObj.items.map((item, idx) => idx === 1 ? { ...item, title: aiAdvisory.proposedSwapTitle, notes: 'Indoor quiet rest, 100% rain protected' } : item)
        };
      }
      return dayObj;
    }));

    setToastMessage(`✅ AI Update Accepted: Swapped Day ${aiAdvisory.dayAffected} afternoon to indoor ${aiAdvisory.proposedSwapTitle}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRejectAiChange = () => {
    setUserAdvisoryChoice('rejected');
    setToastMessage('❌ Original plan retained unchanged as requested.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeDayWeather = weatherForecast.find(w => w.day === activeDayTab);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* 1. TOP HEADER & ITINERARY STATUS / ACCEPTANCE BANNER */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-violet-600 text-white font-bold shadow-2xs shrink-0">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {durationDays}-Day Itinerary ({destinationData.cityName})
                </h2>
                {/* Plan Status Badges */}
                {planStatus === 'accepted' ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plan Accepted & Locked
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-600" /> Suggested Recommendation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {planStatus === 'accepted'
                  ? `Confirmed by ${travellerProfile?.name?.split(' ')[0] || 'Traveller'} • Calibrated to live weather`
                  : 'Pre-arrival suggestions • Accept and lock your final plan once you land in Arrival Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {planStatus !== 'accepted' ? (
              <button
                onClick={handleAcceptPlan}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept & Lock Plan</span>
              </button>
            ) : (
              <button
                onClick={handleRecalibrateWeather}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
                <span>Recalibrate with Weather</span>
              </button>
            )}
          </div>
        </div>

        {/* Informational Guidance Banner if Plan is still in Recommendation mode */}
        {planStatus !== 'accepted' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
              <CloudSun className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Dynamic Weather Advisory: Pre-Arrival Suggestion Mode</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Because destination weather changes dynamically, this itinerary acts as a flexible suggestion before departure. You can review recommendations now, and click <strong>"Accept & Lock Plan"</strong> once you land in {destinationData.cityName}.
            </p>
          </div>
        )}

        {toastMessage && (
          <div className="p-3 rounded-2xl bg-slate-900 text-white text-xs font-extrabold flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. DYNAMIC AI WEATHER RE-PLANNING ADVISORY */}
        {aiAdvisory.active && userAdvisoryChoice === null && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between font-black text-amber-950">
              <span className="flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                AI Weather Re-Planning Advisory (Day {aiAdvisory.dayAffected})
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {aiAdvisory.reasonCategory}
              </span>
            </div>

            {/* Explainable Rationale */}
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-slate-700 font-medium leading-relaxed">
              <strong className="text-amber-950 font-extrabold block mb-0.5">Why Sakhi recommends this update:</strong>
              {aiAdvisory.rationale}
              {aiAdvisory.proposedSwapTitle && (
                <span className="block mt-1 text-violet-800 font-bold">
                  Proposed Indoor Sanctuary: {aiAdvisory.proposedSwapTitle}
                </span>
              )}
            </div>

            {/* User Approval Gate Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAcceptAiChange}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Update Day {aiAdvisory.dayAffected}</span>
              </button>

              <button
                onClick={handleRejectAiChange}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Keep Original Plan</span>
              </button>
            </div>
          </div>
        )}

        {userAdvisoryChoice === 'accepted' && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Updated Day {aiAdvisory.dayAffected} itinerary to indoor {aiAdvisory.proposedSwapTitle}.
            </span>
            <button onClick={() => setUserAdvisoryChoice(null)} className="text-[10px] underline text-emerald-800">Re-evaluate</button>
          </div>
        )}

        {userAdvisoryChoice === 'rejected' && (
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-600" /> Original Day {aiAdvisory.dayAffected} itinerary retained as requested.
            </span>
            <button onClick={() => setUserAdvisoryChoice(null)} className="text-[10px] underline text-slate-600">Re-evaluate</button>
          </div>
        )}
      </div>

      {/* 3. DYNAMIC N-DAY ITINERARY TABS & DAILY TIMELINE */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Day Selector Tabs with Daily Weather Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2">
          {itineraryDays.map((d) => {
            const dayWeather = weatherForecast.find(w => w.day === d.day);
            const isSelected = activeDayTab === d.day;
            return (
              <button
                key={d.day}
                onClick={() => setActiveDayTab(d.day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-2xs scale-102'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Day {d.day}</span>
                {dayWeather && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {dayWeather.icon} {dayWeather.temp}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Timeline View */}
        {itineraryDays.filter(d => d.day === activeDayTab).map((dayObj) => (
          <div key={dayObj.day} className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{dayObj.title}</h3>
                <span className="text-xs text-slate-500 font-medium">Theme: {dayObj.theme}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeDayWeather && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                    <span>{activeDayWeather.icon}</span>
                    <span>{activeDayWeather.condition} ({activeDayWeather.temp})</span>
                    <span className="text-slate-500">• {activeDayWeather.rainProb}% rain</span>
                  </span>
                )}
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-violet-50 text-violet-950 border border-violet-200">
                  {dayObj.energyRequired}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {dayObj.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 hover:border-violet-200 transition-colors"
                >
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-[11px] shrink-0">
                    {item.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4. ENERGY LEVEL PACING SELECTOR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-violet-600" />
              Traveller Energy Pacing Engine
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Adapt recommendations to your current energy level</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: '⚡ High Energy', label: '⚡ High', sub: 'Walking Explorer' },
            { id: '🌿 Moderate', label: '🌿 Moderate', sub: 'Balanced Pace' },
            { id: '😴 Need Rest', label: '😴 Need Rest', sub: 'Low Walk & Tea' }
          ].map((level) => {
            const isActive = energyLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setEnergyLevel(level.id)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white border-violet-600 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold'
                }`}
              >
                <span className="text-xs block font-black">{level.label}</span>
                <span className={`text-[10px] block mt-0.5 ${isActive ? 'text-violet-100' : 'text-slate-500'}`}>
                  {level.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. SOLO DAYS CURATED SPOTS LIST (Scored by Recommendation Engine) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Curated Solo Spots in {destinationData.cityName}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                {energyLevel} ({spotsToDisplay.length})
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Scored by Central Recommendation Engine for your pacing</p>
          </div>
          <button
            onClick={onOpenChat}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask Sakhi</span>
          </button>
        </div>

        <div className="space-y-3">
          {spotsToDisplay.map((rec) => {
            const spot = rec.item;
            return (
              <div
                key={spot.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-violet-300 transition-all bg-slate-50/50 space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 text-xs truncate">{spot.name}</h4>
                      <MatchScoreBadge
                        score={rec.matchScore.overall}
                        onClick={() => onOpenMatchModal({
                          title: spot.name,
                          matchScore: rec.matchScore,
                          whyChosen: rec.whyChosen,
                          safetyFeatures: spot.safetyFeatures
                        })}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">{spot.neighborhood} • {spot.walkTime}</span>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-600 font-bold">{spot.reviewBadge}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 font-medium bg-white p-2 rounded-xl border border-slate-200/60 leading-relaxed">
                  💡 {rec.whyChosen}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">{spot.openHours}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.gmapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>📍 Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
