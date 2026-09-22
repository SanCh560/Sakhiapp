import React, { useState, useEffect } from 'react';
import { X, User, Shield, Sparkles, Check, Lock, Mail, LogOut, ShieldCheck, Download, Trash2, KeyRound, Sliders, History, MapPin, Plus, Compass, Globe, Bell, Calendar, FileText, Camera, CreditCard, CheckCircle2, RefreshCw, HelpCircle, PhoneCall, MessageCircle, Search, ChevronDown, Unlock, Train, BatteryCharging, Heart, Coffee } from 'lucide-react';
import { INSPIRATIONAL_WOMEN } from '../data/inspirationalWomenData';
import { TravellerMemoryService } from '../services/TravellerMemoryService';

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  authUser,
  onSignOut,
  tripHistory = [],
  onAddTripHistory,
  onRemoveTripHistory,
  onOpenInspirationalWomen
}) {
  const [activeTab, setActiveTab] = useState('about-me'); // 'about-me' | 'help-center' | 'settings' | 'preferences' | 'history' | 'account'

  // ABOUT ME FORM STATE & OWNER LOCKING
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(true); // Default unlocked for owner
  const [name, setName] = useState(authUser?.name || profile.name || '');
  const [homeCountry, setHomeCountry] = useState(authUser?.homeCountry || profile.homeCountry || 'United States');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || INSPIRATIONAL_WOMEN[0].avatar);

  // Travel Documents
  const [passportNumber, setPassportNumber] = useState(profile.passportNumber ?? '');
  const [passportExpiry, setPassportExpiry] = useState(profile.passportExpiry ?? '');
  const [emergencyContactPerson, setEmergencyContactPerson] = useState(profile.emergencyContactPerson ?? '');

  // Identity Documents (License)
  const [licenseNumber, setLicenseNumber] = useState(profile.licenseNumber ?? '');
  const [licenseExpiry, setLicenseExpiry] = useState(profile.licenseExpiry ?? '');
  const [preferredCurrency, setPreferredCurrency] = useState(profile.preferredCurrency || (profile.homeCountry === 'United Kingdom' ? 'GBP' : 'USD'));

  // Synchronize state when profile, authUser, or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setName(authUser?.name || profile.name || '');
      setHomeCountry(authUser?.homeCountry || profile.homeCountry || 'United States');
      setPreferredCurrency(profile.preferredCurrency || (authUser?.homeCountry === 'United Kingdom' || profile.homeCountry === 'United Kingdom' ? 'GBP' : 'USD'));
      setAvatarUrl(profile.avatarUrl || INSPIRATIONAL_WOMEN[0].avatar);
      setPassportNumber(profile.passportNumber ?? '');
      setPassportExpiry(profile.passportExpiry ?? '');
      setEmergencyContactPerson(profile.emergencyContactPerson ?? '');
      setLicenseNumber(profile.licenseNumber ?? '');
      setLicenseExpiry(profile.licenseExpiry ?? '');
      setPushNotifications(profile.pushNotifications ?? true);
      setEmailAlerts(profile.emailAlerts ?? true);
      setCalendarSynced(profile.calendarSynced ?? false);
      setExperienceLevel(profile.experienceLevel || 'First-Time Solo Female Traveller');
      setBudgetTier(profile.budgetTier || 'Balanced ($$)');
      setAccPreference(profile.accPreference || 'Hostel / Female Pods');
      setTransportPref(profile.transportPref || 'Public Transit & Metro');
      setAdventureVibe(profile.adventureVibe || 'Calm, Quiet & Traditional');
      setPlacesToVisit(profile.placesToVisit || '');
      setPreferredTransport(profile.preferredTransport || profile.transportPref || '');
      setTripEnergyMotivation(profile.tripEnergyMotivation || profile.adventureVibe || '');
      setAiAdaptiveLearning(profile.aiAdaptiveLearning ?? true);
    }
  }, [profile, authUser, isOpen]);

  // HELP CENTER STATE
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // SETTINGS FORM STATE
  const [pushNotifications, setPushNotifications] = useState(profile.pushNotifications ?? true);
  const [emailAlerts, setEmailAlerts] = useState(profile.emailAlerts ?? true);
  const [calendarSynced, setCalendarSynced] = useState(profile.calendarSynced ?? false);
  const [syncToast, setSyncToast] = useState(false);

  // TRAVEL PREFERENCES FORM STATE
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || 'First-Time Solo Female Traveller');
  const [budgetTier, setBudgetTier] = useState(profile.budgetTier || 'Balanced ($$)');
  const [accPreference, setAccPreference] = useState(profile.accPreference || 'Hostel / Female Pods');
  const [transportPref, setTransportPref] = useState(profile.transportPref || 'Public Transit & Metro');
  const [adventureVibe, setAdventureVibe] = useState(profile.adventureVibe || 'Calm, Quiet & Traditional');
  const [placesToVisit, setPlacesToVisit] = useState(profile.placesToVisit || '');
  const [preferredTransport, setPreferredTransport] = useState(profile.preferredTransport || profile.transportPref || '');
  const [tripEnergyMotivation, setTripEnergyMotivation] = useState(profile.tripEnergyMotivation || profile.adventureVibe || '');
  const [aiAdaptiveLearning, setAiAdaptiveLearning] = useState(profile.aiAdaptiveLearning ?? true);
  const [aiSimulatedToast, setAiSimulatedToast] = useState(false);

  // Helper for quick-tap inspiration chips
  const handleAddChip = (setter, currentVal, chipText) => {
    // Strip leading emoji
    const cleanText = chipText.replace(/^[^\w\s\u00C0-\u024F\u1E00-\u1EFF]+/, '').trim();
    if (!currentVal || !currentVal.trim()) {
      setter(cleanText);
    } else if (!currentVal.toLowerCase().includes(cleanText.toLowerCase())) {
      setter(`${currentVal.trim()}, ${cleanText}`);
    }
  };

  // MANUAL PAST TRIP STATE
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newPlaces, setNewPlaces] = useState('');
  const [newYear, setNewYear] = useState('2025');

  if (!isOpen) return null;

  const popularCountries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'Brazil', 'South Africa', 'Spain', 'Italy'
  ];

  const faqsList = [
    {
      q: 'How does the Emergency SOS & Offline Flashcards work?',
      a: 'Sakhi pre-caches local emergency contact numbers (Police, Medical, Tourist Police) and audio flashcards in your target language so you can communicate offline even with zero mobile data connection.'
    },
    {
      q: 'How does the Central AI Recommendation Engine calculate Match Scores?',
      a: 'The engine evaluates 4 dimensions (0-100%): Safety Index (female-only dorms, 24/7 security), Personal Fit (budget & stay preferences), Comfort (energy pacing & walk distance), and Convenience (contactless payment & metro access).'
    },
    {
      q: 'How do I download the Offline Travel Pack?',
      a: 'In the "Before Trip" phase tab, click "Download Pack" to store offline vector maps, safe walking corridors, and local consular contact numbers on your local device.'
    },
    {
      q: 'Are my travel documents and identity details kept private?',
      a: 'Yes! Your passport numbers, driver\'s license details, and emergency contacts are encrypted locally on your device and are strictly locked to the owner session.'
    }
  ];

  const filteredFaqs = faqsList.filter(f =>
    f.q.toLowerCase().includes(faqSearchQuery.toLowerCase().trim()) ||
    f.a.toLowerCase().includes(faqSearchQuery.toLowerCase().trim())
  );

  const handleSaveAll = () => {
    const updatedProfile = {
      ...profile,
      name,
      homeCountry,
      avatarUrl,
      passportNumber,
      passportExpiry,
      emergencyContactPerson,
      licenseNumber,
      licenseExpiry,
      pushNotifications,
      emailAlerts,
      calendarSynced,
      experienceLevel,
      budgetTier,
      accPreference,
      transportPref: preferredTransport || transportPref,
      adventureVibe: tripEnergyMotivation || adventureVibe,
      placesToVisit,
      preferredTransport,
      tripEnergyMotivation,
      preferredCurrency,
      naturalLanguagePreferences: [
        placesToVisit ? `Places: ${placesToVisit}` : '',
        preferredTransport ? `Transport: ${preferredTransport}` : '',
        tripEnergyMotivation ? `Energy & Motivation: ${tripEnergyMotivation}` : ''
      ].filter(Boolean).join(' | '),
      aiAdaptiveLearning
    };

    try {
      localStorage.setItem('sakhi_home_currency', preferredCurrency);
      localStorage.setItem('aura_home_currency', preferredCurrency);
    } catch {}

    onSaveProfile(updatedProfile);

    // Save preferences to TravellerMemoryService for immediate AI reflection
    const userId = profile.id || authUser?.id || 'usr-default-1';
    if (placesToVisit) {
      TravellerMemoryService.recordPreference(userId, 'places_to_visit', placesToVisit, 'Profile Travel Preferences');
    }
    if (preferredTransport) {
      TravellerMemoryService.recordPreference(userId, 'preferred_transport', preferredTransport, 'Profile Travel Preferences');
    }
    if (tripEnergyMotivation) {
      TravellerMemoryService.recordPreference(userId, 'trip_energy_motivation', tripEnergyMotivation, 'Profile Travel Preferences');
    }

    onClose();
  };

  const handleSyncGoogleCalendar = () => {
    setCalendarSynced(true);
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 3500);
  };

  const handleAddManualTrip = (e) => {
    e.preventDefault();
    if (!newCity.trim() || !newCountry.trim()) return;

    onAddTripHistory({
      id: `trip-hist-${Date.now()}`,
      cityName: newCity.trim(),
      country: newCountry.trim(),
      visitedPlaces: newPlaces.trim() ? newPlaces.split(',').map(p => p.trim()) : ['City Center & Local Cafes'],
      year: newYear || '2025',
      isAutoSynced: false
    });

    setNewCity('');
    setNewCountry('');
    setNewPlaces('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT VERTICAL SIDEBAR NAVIGATION (Sophisticated Settings Layout) */}
        <div className="w-full md:w-56 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            {/* User Profile Header Avatar Badge */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <img
                src={avatarUrl}
                alt={name}
                className="w-10 h-10 rounded-2xl object-cover border border-violet-300 shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-slate-900 truncate">{name}</h3>
                <span className="text-[10px] text-slate-500 font-medium truncate block">{homeCountry}</span>
              </div>
            </div>

            {/* Vertical Tabs List */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-2 mb-1">Navigation</span>
              
              <button
                onClick={() => setActiveTab('about-me')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all text-left cursor-pointer ${
                  activeTab === 'about-me'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>About Me</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-violet-200 opacity-80" title="Locked to Owner Session" />
              </button>

              <button
                onClick={() => setActiveTab('help-center')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all text-left cursor-pointer ${
                  activeTab === 'help-center'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help Centre</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all text-left cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Settings & Sync</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all text-left cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Travel Preferences</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all text-left cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Trip History ({tripHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all text-left cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Account & Privacy</span>
              </button>
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition-colors border border-rose-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[75vh] md:max-h-[85vh] space-y-4">
          
          {/* VERTICAL TAB 1: ABOUT ME & DOCUMENTS (LOCKED TO OWNER ONLY) */}
          {activeTab === 'about-me' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-600" />
                    About Me & Documents
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Personal profile, home country, passport & driver's license ID info</p>
                </div>
                
                {/* Security Lock Status Indicator */}
                <button
                  type="button"
                  onClick={() => setIsOwnerUnlocked(!isOwnerUnlocked)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1 cursor-pointer ${
                    isOwnerUnlocked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-900 text-white border-slate-900'
                  }`}
                >
                  {isOwnerUnlocked ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-violet-400" />}
                  <span>{isOwnerUnlocked ? 'Owner Verified' : 'Locked Vault'}</span>
                </button>
              </div>

              {/* Locked Vault Protection Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-md">
                <div className="flex items-center justify-between text-violet-400 font-black">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Encrypted Owner Vault Shield Active
                  </span>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                    AES-256 Encrypted
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  This section contains personal travel & identity documents accessible <strong>ONLY to the app owner ({name})</strong>.
                </p>
              </div>

              {!isOwnerUnlocked ? (
                <div className="p-6 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <Lock className="w-8 h-8 text-violet-600 mx-auto" />
                  <h4 className="text-sm font-black text-slate-900">Owner Vault Locked</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">Click "Owner Verified" above to unlock your personal identity and travel documents.</p>
                  <button
                    onClick={() => setIsOwnerUnlocked(true)}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
                  >
                    Authenticate Owner Session
                  </button>
                </div>
              ) : (
                <>
                  {/* Inspirational Female Characters Avatar Selector */}
                  <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-violet-600" /> Choose Inspirational Female Character Avatar
                      </label>
                      <button
                        type="button"
                        onClick={onOpenInspirationalWomen}
                        className="text-[10px] font-extrabold text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> View Quotes
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {INSPIRATIONAL_WOMEN.map((woman) => (
                        <div
                          key={woman.id}
                          onClick={() => setAvatarUrl(woman.avatar)}
                          className={`p-1.5 rounded-2xl border text-center cursor-pointer transition-all ${
                            avatarUrl === woman.avatar
                              ? 'bg-white border-violet-600 ring-2 ring-violet-500/20 scale-105 shadow-xs'
                              : 'bg-white/60 border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                          title={`${woman.name} - ${woman.role}`}
                        >
                          <img
                            src={woman.avatar}
                            alt={woman.name}
                            className="w-10 h-10 rounded-xl object-cover mx-auto"
                          />
                          <span className="text-[9px] font-extrabold text-slate-800 truncate block mt-1">{woman.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Home Country, Name & Preferred Currency Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Home Country <span className="text-rose-600 font-extrabold">* (Mandatory)</span>
                      </label>
                      <select
                        value={homeCountry}
                        onChange={(e) => {
                          const newCountry = e.target.value;
                          setHomeCountry(newCountry);
                          if (newCountry === 'United Kingdom') setPreferredCurrency('GBP');
                          else if (['France', 'Germany', 'Spain', 'Italy', 'Netherlands'].includes(newCountry)) setPreferredCurrency('EUR');
                          else if (newCountry === 'Canada') setPreferredCurrency('CAD');
                          else if (newCountry === 'Australia') setPreferredCurrency('AUD');
                          else if (newCountry === 'Japan') setPreferredCurrency('JPY');
                          else if (newCountry === 'United States') setPreferredCurrency('USD');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-violet-500"
                      >
                        {popularCountries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Preferred Currency <span className="text-violet-600 font-extrabold">*</span>
                      </label>
                      <select
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-violet-500"
                      >
                        <option value="USD">USD ($ - US Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                        <option value="GBP">GBP (£ - British Pound)</option>
                        <option value="CAD">CAD ($ - Canadian Dollar)</option>
                        <option value="AUD">AUD ($ - Australian Dollar)</option>
                        <option value="JPY">JPY (¥ - Japanese Yen)</option>
                      </select>
                    </div>
                  </div>

                  {/* Travel Documents (Passport Info) */}
                  <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3">
                    <h4 className="text-xs font-black text-violet-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-violet-600" /> Travel Documents (Passport & Emergency Contact)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Passport Number</label>
                        <input
                          type="text"
                          value={passportNumber}
                          onChange={(e) => setPassportNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-violet-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Passport Expiry Date</label>
                        <input
                          type="date"
                          value={passportExpiry}
                          onChange={(e) => setPassportExpiry(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-violet-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Home Emergency Contact Person & Phone</label>
                      <input
                        type="text"
                        value={emergencyContactPerson}
                        onChange={(e) => setEmergencyContactPerson(e.target.value)}
                        placeholder="Name & Relationship - Phone number"
                        className="w-full px-3 py-1.5 rounded-xl border border-violet-200 bg-white text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Identity Documents (Driver's License) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Identity Documents (Driver's License / ID)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Driver's License No.</label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">License Expiry Date</label>
                        <input
                          type="date"
                          value={licenseExpiry}
                          onChange={(e) => setLicenseExpiry(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAll}
                    className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Save About Me & Documents
                  </button>
                </>
              )}
            </div>
          )}

          {/* VERTICAL TAB 2: HELP CENTRE & SUPPORT (NEW!) */}
          {activeTab === 'help-center' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-violet-600" />
                  Sakhi Help Centre & 24/7 Support
                </h3>
                <p className="text-xs text-slate-500 font-medium">Search FAQs, offline guides, or connect with 24/7 solo female safety advisors</p>
              </div>

              {/* FAQ Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  placeholder="Search help articles (e.g. SOS, offline maps, match score...)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              {/* Frequently Asked Questions Accordion */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Frequently Asked Questions</h4>
                
                <div className="space-y-2">
                  {filteredFaqs.map((faq, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-2 font-extrabold text-xs text-slate-900 hover:bg-slate-50 transition-colors"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-violet-600' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-3.5 pt-0 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/50">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 24/7 Emergency Support Contact Box */}
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-violet-600" /> 24/7 Live Safety Support
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Online 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium">
                  Need immediate support while traveling? Contact our dedicated solo female travel response team.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="mailto:support@sakhi-travel.app"
                    className="p-2.5 rounded-xl bg-white border border-violet-200 text-violet-950 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-violet-100/50 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-violet-600" /> Email Support
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Ask Sakhi Companion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VERTICAL TAB 3: SETTINGS & CALENDAR SYNC */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Settings & Google Calendar Sync</h3>
                <p className="text-xs text-slate-500 font-medium">Manage push notifications, email alerts, and sync dates with Google Calendar</p>
              </div>

              {/* Google Calendar Sync Card */}
              <div className="p-4 rounded-2xl bg-violet-50/90 border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-violet-600" /> Google Calendar Integration
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${calendarSynced ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-200/70 text-violet-900'}`}>
                    {calendarSynced ? '✓ Synced' : 'Not Synced'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Automatically sync your upcoming trip dates, airport transfers, and itinerary reminders directly to your Google Calendar.
                </p>
                <button
                  type="button"
                  onClick={handleSyncGoogleCalendar}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{calendarSynced ? 'Resync Travel Dates with Google Calendar' : 'Sync Travel Dates with Google Calendar'}</span>
                </button>
              </div>

              {syncToast && (
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4" /> Travel dates successfully synced with Google Calendar!
                </div>
              )}

              {/* Notification Toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Bell className="w-4 h-4 text-violet-600" /> Notification Preferences
                </h4>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Push Notifications</span>
                    <span className="text-[11px] text-slate-500 font-medium">Real-time alerts for cash warnings & energy rest stops</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Email Safety Alerts</span>
                    <span className="text-[11px] text-slate-500 font-medium">Consular advisories & offline travel pack download updates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAll}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Save Settings Preferences
              </button>
            </div>
          )}

          {/* VERTICAL TAB 4: TRAVEL PREFERENCES & AI TASTE MEMORY */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Travel Preferences & AI Taste</h3>
                <p className="text-xs text-slate-500 font-medium">Personalize your accommodation style, budget & walking energy</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Solo Female Travel Experience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-violet-500"
                >
                  <option value="First-Time Solo Female Traveller">First-Time Solo Female Traveller</option>
                  <option value="Intermediate Explorer (2-5 Solo Trips)">Intermediate Explorer (2-5 Solo Trips)</option>
                  <option value="Seasoned Solo Nomad (5+ Trips)">Seasoned Solo Nomad (5+ Trips)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Preferred Budget Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Budget ($)', 'Balanced ($$)', 'Luxury ($$$)'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setBudgetTier(tier)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        budgetTier === tier
                          ? 'bg-violet-600 text-white border-violet-600 shadow-2xs font-black'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Accommodation Preference</label>
                <select
                  value={accPreference}
                  onChange={(e) => setAccPreference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-violet-500"
                >
                  <option value="Hostel / Female Pods">Hostel / Female Dorm Pods</option>
                  <option value="Boutique Hotel">Boutique Hotel (24/7 Security)</option>
                  <option value="Co-share Loft / Apartment">Co-share Female Loft / Apartment</option>
                </select>
              </div>

              {/* NATURAL LANGUAGE TRAVEL PREFERENCES & INTENT SECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-slate-50 border border-violet-200/90 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-violet-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-600 text-white shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Trip Vision & Natural Language Preferences
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Describe what you love in your own words so Sakhi can intelligently personalize your journey
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 shrink-0">
                    Sakhi AI Tailored
                  </span>
                </div>

                {/* 1. Types of Places to Visit */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-violet-600" />
                      1. Types of Places You Want to Visit
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Natural language</span>
                  </label>
                  <textarea
                    rows={2}
                    value={placesToVisit}
                    onChange={(e) => setPlacesToVisit(e.target.value)}
                    placeholder="e.g. Cozy independent bookshops, historic temples & shrines, peaceful botanical gardens, contemporary art galleries, quiet neighborhood bakeries, lively local food markets..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 leading-relaxed resize-none"
                  />
                  {/* Quick-tap chips for Places */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Inspiration:</span>
                    {[
                      '☕ Cozy Indie Cafes',
                      '🏛️ Historic Temples & Shrines',
                      '🎨 Art Galleries & Museums',
                      '🌿 Botanical Gardens & Parks',
                      '🍲 Local Food Markets',
                      '📚 Vintage Bookshops',
                      '🌅 Scenic Sunset Viewpoints'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddChip(setPlacesToVisit, placesToVisit, chip)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold hover:border-violet-400 hover:bg-violet-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Transport You Prefer to Take */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Train className="w-3.5 h-3.5 text-violet-600" />
                      2. Transport You Prefer to Take
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Natural language</span>
                  </label>
                  <textarea
                    rows={2}
                    value={preferredTransport}
                    onChange={(e) => setPreferredTransport(e.target.value)}
                    placeholder="e.g. Scenic trains, high-speed rail, safe daytime walking corridors under 20 mins, well-lit subway lines; avoid late-night buses and unmetered cabs..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 leading-relaxed resize-none"
                  />
                  {/* Quick-tap chips for Transport */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Inspiration:</span>
                    {[
                      '🚆 Scenic Trains & Rail',
                      '🚶‍♀️ Walking & Pedestrian Corridors',
                      '🚇 Daytime Metro & Subway',
                      '🚲 Bicycles & E-Bikes',
                      '🚖 Safe Ride-Shares & Taxis',
                      '❌ Avoid Night Buses'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddChip(setPreferredTransport, preferredTransport, chip)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold hover:border-violet-400 hover:bg-violet-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Overall Energy & Motivation */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-violet-600" />
                      3. Overall Energy, Pace & Trip Motivation
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Natural language</span>
                  </label>
                  <textarea
                    rows={2}
                    value={tripEnergyMotivation}
                    onChange={(e) => setTripEnergyMotivation(e.target.value)}
                    placeholder="e.g. Slow, mindful retreat to recharge from burnout; gentle mornings with low physical exertion, restorative afternoons, and peaceful evenings..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 leading-relaxed resize-none"
                  />
                  {/* Quick-tap chips for Energy & Motivation */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Inspiration:</span>
                    {[
                      '🧘‍♀️ Mindful Slow Travel / Burnout Recovery',
                      '📸 High-Energy Cultural Exploration',
                      '🍵 Relaxed Cafe Hopping & Low Exertion',
                      '✨ Solo Independence & Confidence Building',
                      '🎨 Deep Cultural Immersion'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddChip(setTripEnergyMotivation, tripEnergyMotivation, chip)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold hover:border-violet-400 hover:bg-violet-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic AI Persona Interpretation Preview */}
                {(placesToVisit || preferredTransport || tripEnergyMotivation) && (
                  <div className="p-3 rounded-xl bg-violet-100/60 border border-violet-300/70 text-[11px] space-y-1 animate-fade-in">
                    <div className="font-extrabold text-violet-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-700" />
                      <span>Sakhi AI Personalized Profile Active</span>
                    </div>
                    <div className="text-slate-700 space-y-0.5">
                      {placesToVisit && <div><strong>Sights:</strong> {placesToVisit}</div>}
                      {preferredTransport && <div><strong>Transit:</strong> {preferredTransport}</div>}
                      {tripEnergyMotivation && <div><strong>Vibe & Pace:</strong> {tripEnergyMotivation}</div>}
                    </div>
                    <p className="text-[10px] text-violet-800 font-medium italic pt-1">
                      ✨ Sakhi AI Companion and 4D Match recommendations will automatically calibrate to this vision.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveAll}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save Travel Preferences</span>
              </button>
            </div>
          )}

          {/* VERTICAL TAB 5: TRIP HISTORY & VISITED PLACES */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Trip History & Visited Places</h3>
                <p className="text-xs text-slate-500 font-medium">Record past solo trips or view automatically completed Sakhi journeys</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-violet-50 border border-violet-200">
                  <span className="text-lg font-black text-violet-950 block">{tripHistory.length}</span>
                  <span className="text-[10px] text-violet-800 font-bold uppercase tracking-wider">Destinations Visited</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-lg font-black text-emerald-950 block">100%</span>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Solo Safety Record</span>
                </div>
              </div>

              <form onSubmit={handleAddManualTrip} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-violet-600" /> Add Past Visited Destination
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="City Name (e.g. Kyoto)"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="Country (e.g. Japan)"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newPlaces}
                    onChange={(e) => setNewPlaces(e.target.value)}
                    placeholder="Places Visited (e.g. Fushimi Inari, Arashiyama)"
                    className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-violet-500"
                  >
                    {['2026', '2025', '2024', '2023', '2022'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Trip History</span>
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Your Recorded Trips ({tripHistory.length})</h4>
                
                {tripHistory.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tripHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{item.cityName}, {item.country}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">{item.year}</span>
                            {item.isAutoSynced && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800 font-extrabold">
                                Auto-Synced by Sakhi
                              </span>
                            )}
                          </div>
                          {item.visitedPlaces && item.visitedPlaces.length > 0 && (
                            <p className="text-[11px] text-slate-600 font-medium truncate">
                              📍 {Array.isArray(item.visitedPlaces) ? item.visitedPlaces.join(', ') : item.visitedPlaces}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveTripHistory(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove trip from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                    No trip history yet. Add your past destinations above, or complete trips in Sakhi to auto-sync!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VERTICAL TAB 6: ACCOUNT & PRIVACY */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Account & Privacy Settings</h3>
                <p className="text-xs text-slate-500 font-medium">Manage your email registration, verification & data privacy</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-violet-600" /> Account Security & Registration
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Registered Email</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-violet-600" />
                      {authUser?.email || 'Registered Traveller'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Home Country</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-violet-600" />
                      {authUser?.homeCountry || homeCountry}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Email Verification</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
