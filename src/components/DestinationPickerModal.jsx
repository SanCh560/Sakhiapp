import React, { useState, useEffect } from 'react';
import { X, Globe, MapPin, ShieldCheck, Sparkles, Check, Plane, CalendarCheck, Compass, Hotel, Clock, Trash2, Search, Save, ChevronDown, Calendar, Luggage, Building, Clock3, Plus, Bell, Mail } from 'lucide-react';
import { GLOBAL_CITIES_CATALOGUE, generateDynamicDestination } from '../services/globalCitiesService';
import { getDestinationData } from '../data/tripData';
import { triggerBookedTripNotifications } from '../services/notificationService';

// Date helpers ensuring all calendar selections are today or future dates
const getTodayStr = () => new Date().toISOString().split('T')[0];
const getFutureDateStr = (daysAhead = 5, baseDateStr = null) => {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export default function DestinationPickerModal({
  isOpen,
  onClose,
  currentTripConfig,
  onSaveTripConfig,
  onResetTripConfig,
  profile,
  authUser,
  onDispatchNotifications
}) {
  const todayStr = getTodayStr();
  const [selectedDestId, setSelectedDestId] = useState(currentTripConfig?.destId || 'tokyo-global');
  const [selectedStatus, setSelectedStatus] = useState(currentTripConfig?.tripStatus || 'needs-planning');
  
  // Dates state strictly validated: today to future, future to future
  const [startDate, setStartDate] = useState(() => {
    if (currentTripConfig?.startDate && currentTripConfig.startDate >= todayStr) {
      return currentTripConfig.startDate;
    }
    return todayStr;
  });
  const [endDate, setEndDate] = useState(() => {
    if (currentTripConfig?.endDate && currentTripConfig.endDate >= todayStr) {
      return currentTripConfig.endDate;
    }
    return getFutureDateStr(5, todayStr);
  });

  // Booked Details State
  const [flightNumber, setFlightNumber] = useState(currentTripConfig?.flightNumber || '');
  const [arrivalTime, setArrivalTime] = useState(currentTripConfig?.arrivalTime || '14:30');
  const [bookedStayName, setBookedStayName] = useState(currentTripConfig?.bookedStayName || '');
  const [stayAddress, setStayAddress] = useState(currentTripConfig?.stayAddress || '');
  
  // Real-time city search & autocomplete dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dateError, setDateError] = useState(null);

  const currentDest = getDestinationData(selectedDestId);

  useEffect(() => {
    if (currentTripConfig && isOpen) {
      const today = getTodayStr();
      setSelectedDestId(currentTripConfig.destId || 'tokyo-global');
      setSelectedStatus(currentTripConfig.tripStatus || 'needs-planning');
      const validStart = (currentTripConfig.startDate && currentTripConfig.startDate >= today) ? currentTripConfig.startDate : today;
      const validEnd = (currentTripConfig.endDate && currentTripConfig.endDate >= validStart) ? currentTripConfig.endDate : getFutureDateStr(5, validStart);
      setStartDate(validStart);
      setEndDate(validEnd);
      setFlightNumber(currentTripConfig.flightNumber || '');
      setArrivalTime(currentTripConfig.arrivalTime || '14:30');
      setBookedStayName(currentTripConfig.bookedStayName || '');
      setStayAddress(currentTripConfig.stayAddress || '');
      setSearchQuery('');
    }
  }, [currentTripConfig, isOpen]);

  if (!isOpen) return null;

  // Calculate duration in days from start/end dates
  const calcDuration = () => {
    if (!startDate || !endDate) return 5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const calculatedDays = calcDuration();

  // Filter global cities catalogue by search query
  const filteredCities = GLOBAL_CITIES_CATALOGUE.filter((item) =>
    item.cityName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    item.country.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectKnownCity = (item) => {
    const destId = `${item.cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-global`;
    getDestinationData(destId);
    
    setSelectedDestId(destId);
    setSearchQuery(`${item.cityName}, ${item.country}`);
    setIsDropdownOpen(false);
  };

  const handleSelectCustomCity = (customName) => {
    if (!customName.trim()) return;
    const cleanName = customName.trim();
    const destId = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-global`;
    
    generateDynamicDestination(cleanName);
    getDestinationData(destId);

    setSelectedDestId(destId);
    setSearchQuery(cleanName);
    setIsDropdownOpen(false);
  };

  const handleStartDateChange = (val) => {
    setDateError(null);
    const today = getTodayStr();
    if (!val) {
      setStartDate(today);
      return;
    }
    const safeStart = val < today ? today : val;
    setStartDate(safeStart);
    if (endDate && safeStart > endDate) {
      setEndDate(safeStart);
    }
  };

  const handleEndDateChange = (val) => {
    setDateError(null);
    const today = getTodayStr();
    const effectiveStart = startDate || today;
    if (!val) {
      setEndDate(effectiveStart);
      return;
    }
    const safeEnd = val < effectiveStart ? effectiveStart : val;
    setEndDate(safeEnd);
  };

  const handleSave = () => {
    const today = getTodayStr();
    if (!startDate || startDate < today) {
      setDateError('Start date cannot be in the past. Please select today or a future date.');
      return;
    }
    if (!endDate || endDate < startDate) {
      setDateError('End date cannot be earlier than start date.');
      return;
    }

    const isAlreadyBookedStatus = selectedStatus === 'already-booked';
    const userEnteredFlight = flightNumber.trim();
    const userEnteredStay = bookedStayName.trim();

    const isFlightConfirmed = isAlreadyBookedStatus && Boolean(userEnteredFlight);
    const isStayConfirmed = isAlreadyBookedStatus && Boolean(userEnteredStay);

    const newTripConfig = {
      destId: selectedDestId,
      tripStatus: selectedStatus,
      startDate,
      endDate,
      durationDays: calculatedDays,
      flightNumber: userEnteredFlight,
      flightConfirmed: isFlightConfirmed,
      arrivalTime: userEnteredFlight ? (arrivalTime.trim() || '14:00') : '',
      bookedStayName: userEnteredStay,
      stayConfirmed: isStayConfirmed,
      stayAddress: userEnteredStay ? (stayAddress.trim() || `${currentDest.cityName} City Center`) : ''
    };

    onSaveTripConfig(newTripConfig);

    // If trip has confirmed bookings, trigger Push Notifications, Email Alerts & Calendar Sync based on user settings!
    if (isFlightConfirmed || isStayConfirmed) {
      triggerBookedTripNotifications({
        tripConfig: newTripConfig,
        destinationData: currentDest,
        profile,
        authUser,
        onNotify: onDispatchNotifications
      });
    }

    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete this trip configuration and start fresh?')) {
      const today = getTodayStr();
      onResetTripConfig();
      setSelectedDestId('');
      setSelectedStatus('needs-planning');
      setStartDate(today);
      setEndDate(getFutureDateStr(5, today));
      setBookedStayName('');
      setFlightNumber('');
      setSearchQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* MODAL HEADER: "Plan a Trip" */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">Plan a Trip</h3>
            <p className="text-xs text-slate-500 font-medium">Search ANY city worldwide, configure dates & booking details</p>
          </div>
        </div>

        {/* STEP 1: Search Any City Worldwide */}
        <div className="space-y-1.5 relative">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block flex items-center justify-between">
            <span>1. Choose Destination (Unlimited Global Cities)</span>
            <span className="text-[10px] text-violet-600 font-extrabold">{GLOBAL_CITIES_CATALOGUE.length}+ Featured Cities</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search ANY city in the world (e.g. Paris, Tokyo, Reykjavik, Sydney, Seoul...)"
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Currently Selected City Badge */}
          <div className="p-3 rounded-2xl bg-violet-50/90 border border-violet-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{currentDest.flag}</span>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">{currentDest.cityName}, {currentDest.country}</span>
                <span className="text-[10px] text-violet-800 font-bold">{currentDest.safetyBadge}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-violet-600 text-white font-extrabold text-[10px] shadow-2xs">
              Selected
            </span>
          </div>

          {/* Autocomplete Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-1 animate-fade-in">
              {filteredCities.map((item) => (
                <div
                  key={item.cityName}
                  onClick={() => handleSelectKnownCity(item)}
                  className="p-2.5 rounded-xl hover:bg-violet-50 transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{item.flag}</span>
                    <div>
                      <span className="font-extrabold text-slate-900 block">{item.cityName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.country}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {item.safetyRating} Safety
                  </span>
                </div>
              ))}

              {searchQuery.trim().length > 0 && (
                <div
                  onClick={() => handleSelectCustomCity(searchQuery)}
                  className="p-3 rounded-xl bg-violet-600 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-between hover:bg-violet-700 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-200" />
                    <span>Explore "{searchQuery.trim()}" with Sakhi AI</span>
                  </div>
                  <Plus className="w-4 h-4" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: Booking Status Toggle */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            2. Trip Status for {currentDest.cityName}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => setSelectedStatus('needs-planning')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                selectedStatus === 'needs-planning'
                  ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-violet-600 text-white font-bold shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900">Need AI Trip Planning</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-snug mt-0.5">
                  Not booked yet. Sakhi will recommend stays & itinerary.
                </p>
              </div>
            </div>

            <div
              onClick={() => setSelectedStatus('already-booked')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                selectedStatus === 'already-booked'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900">Already Have Booked Trip</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-snug mt-0.5">
                  Flights & stay booked. Auto-dispatches Push, Email & Calendar sync!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: INTERACTIVE CALENDAR DATE PICKER */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-violet-600" /> Select Trip Dates
            </label>
            <span className="text-[11px] font-black text-violet-950 bg-violet-100 px-2 py-0.5 rounded-lg">
              {calculatedDays} Days Duration
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Start Date (Arrival)</label>
              <input
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-900 focus:outline-none focus:border-violet-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">End Date (Departure)</label>
              <input
                type="date"
                value={endDate}
                min={startDate || todayStr}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-900 focus:outline-none focus:border-violet-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* STEP 4: BRANCHING DETAILS FORM */}
        {selectedStatus === 'already-booked' ? (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 space-y-3 animate-fade-in">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Luggage className="w-4 h-4 text-emerald-600" /> Your Booked Flight & Stay Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5 text-emerald-600" /> Flight No. / Airline
                </label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. NH 105, BA 116 or Direct Flight"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5 text-emerald-600" /> Expected Arrival Time
                </label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-emerald-600" /> Booked Stay / Hotel Name
                </label>
                <input
                  type="text"
                  value={bookedStayName}
                  onChange={(e) => setBookedStayName(e.target.value)}
                  placeholder={currentDest.accommodations?.[0]?.name || `${currentDest.cityName} Hotel`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Hotel Address / Neighborhood
                </label>
                <input
                  type="text"
                  value={stayAddress}
                  onChange={(e) => setStayAddress(e.target.value)}
                  placeholder={`e.g. ${currentDest.accommodations?.[0]?.neighborhood || 'City Center'}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notification Dispatch Indicator */}
            <div className="p-2.5 rounded-xl bg-white border border-emerald-300 text-[11px] text-emerald-900 font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Saving will trigger Push Notifications, Email Confirmation & Google Calendar Sync based on your settings.</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80 space-y-2 animate-fade-in text-xs">
            <h4 className="font-extrabold text-violet-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" /> AI Trip Planning Ready
            </h4>
            <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
              Sakhi will suggest vetted hostels, boutique hotels, and co-share apartments in <strong>{currentDest.cityName}</strong> matching your budget for {calculatedDays} days!
            </p>
          </div>
        )}

        {dateError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fade-in">
            ⚠️ {dateError}
          </div>
        )}

        {/* EXPLICIT PROMINENT SAVE & START FRESH BUTTONS */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          {currentTripConfig && (
            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors border border-rose-200 cursor-pointer"
              title="Delete trip configuration and start fresh"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Dispatch Notifications</span>
          </button>
        </div>
      </div>
    </div>
  );
}
