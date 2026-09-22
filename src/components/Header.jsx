import React, { useState, useRef, useEffect } from 'react';
import { Shield, Wifi, WifiOff, User, Sparkles, MapPin, ChevronDown, Coins, Calendar, Users, LogIn, LogOut, Sliders, Lock, ShieldCheck, Mail, Heart, Plus, Compass, Bell } from 'lucide-react';

export default function Header({
  destinationData,
  tripConfig,
  plannedTrips = [],
  onSelectTrip,
  activeStage,
  setActiveStage,
  isOffline,
  setIsOffline,
  authUser,
  travellerProfile,
  onOpenProfile,
  onOpenAuth,
  onOpenDestinationPicker,
  onOpenCurrencyCalculator,
  onOpenInspirationalWomen,
  onOpenEditTrip,
  onSignOut
}) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isTripsDropdownOpen, setIsTripsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const profileRef = useRef(null);
  const tripsRef = useRef(null);
  const notificationsRef = useRef(null);

  const stages = [
    { id: 'before-trip', label: '1. Before Trip' },
    { id: 'arrival', label: '2. Arrival Mode' },
    { id: 'solo-days', label: '3. Solo Days' },
    { id: 'goodbye', label: '4. Goodbye Mode' }
  ];

  // Auto-scroll viewport to top on phase selection (Issue #6)
  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (tripsRef.current && !tripsRef.current.contains(event.target)) {
        setIsTripsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tripDays = tripConfig?.durationDays || 5;

  return (
    <header className="bg-[#1c0836] text-white border-b border-violet-950/60 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Top Desktop & Mobile Header Bar */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title (Option A Signature Typography) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md ring-1 ring-white/20">
              S
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleStageSelect('before-trip')}>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                <span>Sakhi</span>
                <Sparkles className="w-4 h-4 text-violet-300 inline" />
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/80 text-violet-200 font-extrabold uppercase tracking-wider border border-violet-500/30 hidden sm:inline-block">
                Solo Safe AI
              </span>
            </div>
          </div>

          {/* Top Center Navigation Links (Option A Prototype Header Navigation) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-violet-200">
            <button
              onClick={() => handleStageSelect('before-trip')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeStage === 'before-trip'
                  ? 'bg-white/20 text-white font-black shadow-2xs'
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={onOpenDestinationPicker}
              className="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hover:text-white hover:bg-white/10"
            >
              Explore
            </button>
            <button
              onClick={() => handleStageSelect('arrival')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeStage === 'arrival'
                  ? 'bg-white/20 text-white font-black shadow-2xs'
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Safety
            </button>
            <button
              onClick={() => handleStageSelect('solo-days')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeStage === 'solo-days'
                  ? 'bg-white/20 text-white font-black shadow-2xs'
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={onOpenInspirationalWomen}
              className="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hover:text-white hover:bg-white/10"
            >
              Community
            </button>
            <button
              onClick={onOpenProfile}
              className="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hover:text-white hover:bg-white/10"
            >
              Profile
            </button>
          </nav>

          {/* Header Action Tools & Profile Bar */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* MULTI-TRIP SWITCHER DROPDOWN (My Planned Trips) */}
            <div className="relative" ref={tripsRef}>
              {destinationData && tripConfig?.destId ? (
                <div
                  onClick={() => setIsTripsDropdownOpen(!isTripsDropdownOpen)}
                  className="hidden md:flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{destinationData.flag}</span>
                    <div className="truncate text-left">
                      <span className="font-extrabold text-white text-xs block truncate">
                        {destinationData.cityName}
                      </span>
                      <span className="text-[10px] text-violet-300 font-bold block">
                        {tripConfig?.startDate || 'Aug 10'} • {tripDays}D
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-violet-600 text-white font-extrabold text-[9px]">
                      {plannedTrips.length}
                    </span>
                    <ChevronDown className="w-3 h-3 text-violet-300" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenDestinationPicker}
                  className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-violet-600/90 hover:bg-violet-600 border border-violet-400/40 text-white font-black text-xs transition-all cursor-pointer shadow-2xs"
                  title="Plan a new trip"
                >
                  <Compass className="w-3.5 h-3.5 text-violet-200" />
                  <span>Plan a Trip</span>
                  <Plus className="w-3 h-3 text-violet-200" />
                </button>
              )}

              {/* Planned Trips Dropdown */}
              {isTripsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl p-2.5 z-50 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-violet-600" /> My Planned Trips ({plannedTrips.length})
                    </span>
                    <button
                      onClick={() => { setIsTripsDropdownOpen(false); onOpenDestinationPicker(); }}
                      className="p-1 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New Trip
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {plannedTrips.length === 0 ? (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-500 font-medium">No planned trips yet.</p>
                        <button
                          onClick={() => { setIsTripsDropdownOpen(false); onOpenDestinationPicker(); }}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Explore Destinations
                        </button>
                      </div>
                    ) : (
                      plannedTrips.map((trip, idx) => {
                        const isActive = trip.destId === tripConfig?.destId || trip.id === tripConfig?.id;
                        return (
                          <div
                            key={`${trip.id || 'trip'}-${trip.destId || 'dest'}-${idx}`}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                              isActive
                                ? 'bg-violet-50 border-violet-400 font-extrabold text-violet-950 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div
                              className="cursor-pointer flex-1"
                              onClick={() => {
                                setIsTripsDropdownOpen(false);
                                if (onSelectTrip) onSelectTrip(trip);
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold block text-xs">{trip.destName || trip.destId}</span>
                                {isActive && (
                                  <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block">
                                {trip.startDate} - {trip.endDate} ({trip.durationDays} Days)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTripsDropdownOpen(false);
                                if (onOpenEditTrip) onOpenEditTrip(trip);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-white transition-colors"
                              title="Edit or Delete Trip"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Currency Calculator Button */}
            {(() => {
              const homeCurrency = travellerProfile?.preferredCurrency || (travellerProfile?.homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(travellerProfile?.homeCountry) ? 'EUR' : 'USD'));
              const destCurrency = destinationData?.currencyCode || 'USD';
              return (
                <button
                  onClick={onOpenCurrencyCalculator}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title={`Home Currency: ${homeCurrency} • Click for live conversion to ${destCurrency}`}
                >
                  <Coins className="w-3.5 h-3.5 text-violet-300" />
                  <span>{homeCurrency !== destCurrency ? `${homeCurrency} ⇄ ${destCurrency}` : homeCurrency}</span>
                </button>
              );
            })()}

            {/* Offline Mode Toggle */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center border transition-all cursor-pointer ${
                isOffline
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white/10 text-violet-200 border-white/15 hover:bg-white/20'
              }`}
              title="Toggle simulated offline mode"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Notification Bell Icon & Dropdown Panel (Issue #12) */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-violet-200 hover:text-white transition-all relative cursor-pointer"
                title="Notifications & Community Updates"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                    <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                      <Bell className="w-4 h-4 text-violet-600" />
                      <span>Trip Notifications</span>
                    </div>
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 text-xs">
                    {/* Active trip alerts */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                      <div className="flex items-center justify-between font-extrabold text-emerald-950 text-[11px]">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Safety Corridors Active
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">Just now</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        {destinationData ? `Arrival mode & turn-by-turn safe routes are synced for ${destinationData.cityName}.` : 'Global safety corridors are ready.'}
                      </p>
                    </div>

                    {tripConfig?.flightConfirmed && (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                        <div className="flex items-center justify-between font-extrabold text-blue-950 text-[11px]">
                          <span>✈️ Flight Confirmed</span>
                          <span className="text-[9px] text-blue-700 font-semibold">Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug">
                          Flight {tripConfig.flightNumber} landing at {tripConfig.arrivalTime || '14:00'}.
                        </p>
                      </div>
                    )}

                    <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 space-y-1">
                      <div className="flex items-center justify-between font-extrabold text-violet-950 text-[11px]">
                        <span>🛡️ Emergency Contacts Synced</span>
                        <span className="text-[9px] text-violet-700 font-semibold">Offline</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Consular and local police dispatch numbers cached on device.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onOpenInspirationalWomen();
                      }}
                      className="text-[11px] font-extrabold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Pioneers & Inspiration →</span>
                    </button>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE / AUTH DROPDOWN MENU (Option A Avatar circle) */}
            {authUser ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                  title="Account & Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-black flex items-center justify-center text-xs shadow-xs">
                    {authUser.name ? authUser.name[0] : 'S'}
                  </div>
                  <span className="hidden sm:inline text-xs">{authUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-violet-300" />
                </button>

                {/* Profile Dropdown Popup Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {authUser.name ? authUser.name[0] : 'S'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-900 truncate">{authUser.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium truncate block">{authUser.email}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-bold text-slate-700">
                      <button
                        onClick={() => { setIsProfileDropdownOpen(false); onOpenProfile(); }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-left transition-colors cursor-pointer"
                      >
                        <Sliders className="w-4 h-4 text-violet-600" />
                        <span>Travel Preferences</span>
                      </button>

                      <button
                        onClick={() => { setIsProfileDropdownOpen(false); onOpenProfile(); }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-left transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>Account & Privacy</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => { setIsProfileDropdownOpen(false); onSignOut(); }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-colors border border-rose-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Sign In / Register"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Trigger */}
        <div
          onClick={onOpenDestinationPicker}
          className="md:hidden mt-2 p-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all cursor-pointer flex items-center justify-between text-xs text-white group"
        >
          {destinationData ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{destinationData.flag}</span>
              <div className="truncate">
                <span className="font-extrabold text-white text-xs block truncate">
                  {destinationData.cityName}, {destinationData.country}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-violet-300 font-medium">
                  <span>{tripDays} Days</span> • <span>Solo Female Safe</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">🧭</span>
              <div className="truncate">
                <span className="font-extrabold text-white text-xs block truncate">
                  Where to next?
                </span>
                <div className="text-[10px] text-violet-300 font-medium">
                  Select a destination to plan your solo trip
                </div>
              </div>
            </div>
          )}
          <span className="px-2 py-1 rounded-lg bg-violet-600 text-white font-extrabold text-[10px] shrink-0 shadow-2xs">
            Plan a Trip
          </span>
        </div>

        {/* Stage Switcher Tabs Row (Translucent Glass Bar) */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5 border-t border-white/10 pt-2 text-xs">
          {stages.map((stg) => {
            const isActive = activeStage === stg.id;
            const isFlagshipArrival = stg.id === 'arrival';
            return (
              <button
                key={stg.id}
                onClick={() => handleStageSelect(stg.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 font-black shadow-xs'
                    : isFlagshipArrival
                    ? 'bg-violet-900/60 text-violet-200 border border-violet-500/30 hover:bg-violet-800/60 font-bold'
                    : 'bg-white/10 text-violet-200 hover:bg-white/15 hover:text-white'
                }`}
              >
                {isFlagshipArrival && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping"></span>}
                {stg.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
