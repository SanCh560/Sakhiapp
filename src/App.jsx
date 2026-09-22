import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import MatchBreakdownModal from './components/MatchBreakdownModal';
import AICompanionChat from './components/AICompanionChat';
import ProfileModal from './components/ProfileModal';
import EmergencyModal from './components/EmergencyModal';
import DestinationPickerModal from './components/DestinationPickerModal';
import CurrencyCalculatorModal from './components/CurrencyCalculatorModal';
import InspirationalWomenModal from './components/InspirationalWomenModal';
import AuthScreen from './components/AuthScreen';
import EditTripModal from './components/EditTripModal';

import BeforeTripPhase from './phases/BeforeTripPhase';
import ArrivalModePhase from './phases/ArrivalModePhase';
import SoloDaysPhase from './phases/SoloDaysPhase';
import GoodbyeModePhase from './phases/GoodbyeModePhase';
import { getDestinationData } from './data/tripData';
import { createTraveller, createTrip } from './models/entities';
import { fetchLiveWeather, fetchLiveExchangeRate, fetchLiveStays } from './services/apiService';
import { generateLLMCompanionResponse } from './services/llmService';
import { ChatService } from './services/ChatService';
import { TripService, ProfileService, TravelPackService, syncUserToDatabase, getUserStorageKey } from './services/appServices';
import { supabase } from './db/supabaseClient';
import { generate5DayDraftItinerary, generateDynamicItinerary } from './services/itineraryGeneratorService';
import { Sparkles, Coins, PhoneCall, ShieldCheck, Send, MessageCircle, CloudSun, Heart, Bell, Mail, Calendar, CheckCircle2, X, Compass, Hotel, Plane, Clock, ChevronDown, ChevronRight, ArrowRight, Star, ExternalLink, Sliders, User, MapPin, Zap, Lock, Shield, ArrowUpRight, Plus } from 'lucide-react';

// Check if current user is the dedicated Sarah Jenkins demo account
function isDemoUser(user) {
  if (!user) return false;
  return user.id === 'usr-demo-sarah' || user.email === 'sarah.jenkins@example.com';
}

// Pre-seeded Demo Data for Sarah Jenkins
const DEMO_SARAH_PROFILE = {
  id: 'usr-demo-sarah',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@example.com',
  homeCountry: 'United States',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  isVerified: true,
  passportNumber: 'US-98421048',
  passportExpiry: '2030-05-15',
  emergencyContactPerson: 'Emma Jenkins (Sister) - +1 555 0192',
  emergencyContactPhone: '+1 555 0192',
  licenseNumber: 'DL-44810294-CA',
  licenseExpiry: '2028-11-20',
  pushNotifications: true,
  emailAlerts: true,
  calendarSynced: true,
  experienceLevel: 'First-Time Solo Female Traveller',
  budgetTier: 'Balanced ($$)',
  accPreference: 'Hostel / Female Pods',
  transportPref: 'Public Transit & Metro',
  adventureVibe: 'Calm, Quiet & Traditional',
  aiAdaptiveLearning: true,
  joinedDate: 'Aug 2026'
};

const DEMO_SARAH_PLANNED_TRIPS = [
  {
    id: 'trip-japan-1',
    destId: 'tokyo-global',
    destName: 'Tokyo, Japan',
    startDate: '2026-10-10',
    endDate: '2026-10-15',
    durationDays: 5,
    tripStatus: 'needs-planning',
    bookedStayName: '',
    flightNumber: '',
    flightConfirmed: false,
    stayConfirmed: false
  },
  {
    id: 'trip-italy-2',
    destId: 'florence-global',
    destName: 'Florence, Italy',
    startDate: '2026-10-17',
    endDate: '2026-10-22',
    durationDays: 5,
    tripStatus: 'needs-planning',
    bookedStayName: '',
    flightNumber: '',
    flightConfirmed: false,
    stayConfirmed: false
  }
];

const DEMO_SARAH_TRIP_CONFIG = {
  destId: 'tokyo-global',
  tripStatus: 'needs-planning',
  startDate: '2026-10-10',
  endDate: '2026-10-15',
  durationDays: 5,
  flightNumber: '',
  arrivalTime: '',
  airline: '',
  flightConfirmed: false,
  bookedStayName: '',
  stayAddress: '',
  stayConfirmed: false
};

const DEMO_SARAH_TRIP_HISTORY = [
  {
    id: 'hist-1',
    cityName: 'Prague',
    country: 'Czech Republic',
    visitedPlaces: ['Charles Bridge', 'Old Town Square', 'Café Imperial', 'Clementinum Library'],
    year: '2026',
    isAutoSynced: true
  },
  {
    id: 'hist-2',
    cityName: 'Reykjavik',
    country: 'Iceland',
    visitedPlaces: ['Sky Lagoon', 'Harpa Concert Hall', 'Hallgrímskirkja Church'],
    year: '2025',
    isAutoSynced: false
  }
];

// Helper to load user profile:
function loadInitialProfile(user) {
  if (!user) {
    return createTraveller({
      id: 'guest',
      name: '',
      email: '',
      homeCountry: 'United States',
      passportNumber: '',
      licenseNumber: '',
      emergencyContactPerson: ''
    });
  }
  const userKey = getUserStorageKey(user);
  const key = `sakhi_profile_${userKey}`;
  const legacyKey = `aura_profile_${userKey}`;
  try {
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) return createTraveller(JSON.parse(saved));
  } catch (e) {}

  if (isDemoUser(user)) {
    return createTraveller(DEMO_SARAH_PROFILE);
  }

  // Brand new clean profile for real registered user
  return createTraveller({
    id: user.id,
    name: user.name || (user.email ? user.email.split('@')[0] : 'Traveller'),
    email: user.email || '',
    homeCountry: user.homeCountry || 'United States',
    isVerified: !!user.isVerified,
    passportNumber: '',
    passportExpiry: '',
    emergencyContactPerson: '',
    emergencyContactPhone: '',
    licenseNumber: '',
    licenseExpiry: '',
    pushNotifications: true,
    emailAlerts: true,
    calendarSynced: false,
    joinedDate: user.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  });
}

// Helper to load planned trips:
function loadInitialPlannedTrips(user) {
  if (!user) return [];
  const userKey = getUserStorageKey(user);
  const key = `sakhi_trips_${userKey}`;
  const legacyKey = `aura_trips_${userKey}`;
  try {
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  if (isDemoUser(user)) {
    return DEMO_SARAH_PLANNED_TRIPS;
  }

  return []; // Clean empty trips for real users!
}

// Helper to load trip config:
function loadInitialTripConfig(user, tripsList) {
  if (!user) return null;
  if (isDemoUser(user)) {
    return createTrip(DEMO_SARAH_TRIP_CONFIG);
  }

  // Pure clean state for real users:
  // A real user CAN ONLY have a tripConfig if they have at least one trip in plannedTrips!
  const trips = tripsList !== undefined ? tripsList : loadInitialPlannedTrips(user);
  const userKey = getUserStorageKey(user);
  if (!trips || trips.length === 0) {
    // Purge any stale/leaked config from localStorage!
    try {
      localStorage.removeItem(`sakhi_config_${userKey}`);
      localStorage.removeItem(`aura_config_${userKey}`);
      localStorage.removeItem('sakhi_config_guest');
      localStorage.removeItem('aura_config_guest');
    } catch (e) {}
    return null;
  }

  const key = `sakhi_config_${userKey}`;
  const legacyKey = `aura_config_${userKey}`;
  try {
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.destId && trips.some(t => t.destId === parsed.destId || t.id === parsed.id)) {
        return createTrip(parsed);
      }
    }
  } catch (e) {}

  // Default to the first actual planned trip
  return createTrip(trips[0]);
}

// Helper to load trip history:
function loadInitialTripHistory(user) {
  if (!user) return [];
  const userKey = getUserStorageKey(user);
  const key = `sakhi_history_${userKey}`;
  const legacyKey = `aura_history_${userKey}`;
  try {
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  if (isDemoUser(user)) {
    return DEMO_SARAH_TRIP_HISTORY;
  }

  return []; // Clean empty past trips for real users!
}

export default function App() {
  const [activeStage, setActiveStage] = useState('before-trip');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Live Dispatched Notifications Log State
  const [notificationFeed, setNotificationFeed] = useState([]);

  // Registered Auth User Session State
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sakhi_auth_user') || localStorage.getItem('aura_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // MULTI-PLANNED TRIPS PARENT STATE (Scoped to Auth User)
  const [plannedTrips, setPlannedTrips] = useState(() => loadInitialPlannedTrips(authUser));

  // Saved Active Trip Configuration State (Scoped to Auth User)
  const [tripConfig, setTripConfig] = useState(() => {
    const initialTrips = loadInitialPlannedTrips(authUser);
    return loadInitialTripConfig(authUser, initialTrips);
  });

  // Traveller Entity State (Scoped to Auth User)
  const [profile, setProfile] = useState(() => loadInitialProfile(authUser));

  // Trip History State (Scoped to Auth User)
  const [tripHistory, setTripHistory] = useState(() => loadInitialTripHistory(authUser));

  // Desktop AI Companion Chat State inside Sidebar (Scoped to Auth User)
  const [desktopChatMessages, setDesktopChatMessages] = useState(() => 
    ChatService.getConversationMessages(authUser?.id || 'guest', tripConfig?.destId || 'prague-czech')
  );
  const [desktopInput, setDesktopInput] = useState('');

  // Synchronize desktop chat messages whenever user or trip destination changes
  useEffect(() => {
    const msgs = ChatService.getConversationMessages(authUser?.id || 'guest', tripConfig?.destId || 'prague-czech');
    setDesktopChatMessages(msgs);
  }, [authUser?.id, tripConfig?.destId]);

  // Live API States (Weather, Exchange Rates, Stays)
  const [liveWeatherData, setLiveWeatherData] = useState(null);
  const [liveExchangeRate, setLiveExchangeRate] = useState(null);

  const baseDestinationData = tripConfig?.destId ? getDestinationData(tripConfig.destId) : null;

  // Fetch Live Weather & Live Exchange Rates whenever destination changes!
  useEffect(() => {
    let isMounted = true;
    async function loadLiveApiFeeds() {
      if (!baseDestinationData) {
        setLiveWeatherData(null);
        setLiveExchangeRate(null);
        return;
      }

      // 1. Fetch live weather
      const weather = await fetchLiveWeather(
        baseDestinationData.lat,
        baseDestinationData.lng,
        baseDestinationData.currentWeather
      );
      if (isMounted) setLiveWeatherData(weather);

      // 2. Fetch live exchange rates
      const rate = await fetchLiveExchangeRate(
        baseDestinationData.currencyCode,
        baseDestinationData.exchangeRateToUSD
      );
      if (isMounted) setLiveExchangeRate(rate);
    }

    loadLiveApiFeeds();
    return () => { isMounted = false; };
  }, [tripConfig?.destId]);

  // Construct dynamic destination object merged with live API feeds
  const destinationData = baseDestinationData ? {
    ...baseDestinationData,
    currentWeather: liveWeatherData || baseDestinationData.currentWeather,
    exchangeRateToUSD: liveExchangeRate || baseDestinationData.exchangeRateToUSD
  } : null;

  // Listen to browser network connectivity events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save user-scoped data to localStorage
  useEffect(() => {
    if (!authUser) return;
    const userKey = getUserStorageKey(authUser);
    try {
      localStorage.setItem(`sakhi_trips_${userKey}`, JSON.stringify(plannedTrips));
    } catch (e) {
      console.error('Failed to save planned trips:', e);
    }
  }, [plannedTrips, authUser]);

  useEffect(() => {
    if (!authUser) return;
    const userKey = getUserStorageKey(authUser);
    try {
      if (tripConfig) {
        localStorage.setItem(`sakhi_config_${userKey}`, JSON.stringify(tripConfig));
      } else {
        localStorage.removeItem(`sakhi_config_${userKey}`);
        localStorage.removeItem(`aura_config_${userKey}`);
      }
    } catch (e) {
      console.error('Failed to save trip config:', e);
    }
  }, [tripConfig, authUser]);

  // Clean State Guard: Ensure real users with 0 planned trips NEVER retain any active trip config!
  useEffect(() => {
    if (authUser && !isDemoUser(authUser)) {
      if (plannedTrips.length === 0 && tripConfig !== null) {
        console.log('[Clean State Guard] Real user has 0 planned trips. Purging stale tripConfig.');
        setTripConfig(null);
        try {
          const userKey = getUserStorageKey(authUser);
          localStorage.removeItem(`sakhi_config_${userKey}`);
          localStorage.removeItem(`aura_config_${userKey}`);
          localStorage.removeItem('sakhi_config_guest');
          localStorage.removeItem('aura_config_guest');
        } catch (e) {}
      }
    }
  }, [plannedTrips, authUser, tripConfig]);

  useEffect(() => {
    if (!authUser) return;
    const userKey = getUserStorageKey(authUser);
    try {
      localStorage.setItem(`sakhi_profile_${userKey}`, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }, [profile, authUser]);

  useEffect(() => {
    if (!authUser) return;
    const userKey = getUserStorageKey(authUser);
    try {
      localStorage.setItem(`sakhi_history_${userKey}`, JSON.stringify(tripHistory));
    } catch (e) {
      console.error('Failed to save trip history:', e);
    }
  }, [tripHistory, authUser]);

  useEffect(() => {
    try {
      if (authUser) {
        localStorage.setItem('sakhi_auth_user', JSON.stringify(authUser));
      } else {
        localStorage.removeItem('sakhi_auth_user');
        localStorage.removeItem('aura_auth_user');
      }
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }
  }, [authUser]);

  // Synchronize Live Supabase Cloud Auth State (Email Confirmation, Session Restoral, Magic Links)
  useEffect(() => {
    // 1. Listen to real-time Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Supabase Auth Event]:', event, session?.user?.email);
      if (session?.user) {
        const userObj = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split('@')[0] : 'Traveller'),
          email: session.user.email,
          homeCountry: session.user.user_metadata?.home_country || 'United States',
          isVerified: !!session.user.confirmed_at,
          joinedDate: new Date(session.user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
        setAuthUser(userObj);
        try {
          localStorage.setItem('sakhi_auth_user', JSON.stringify(userObj));
        } catch (e) {}

        const loadedProfile = loadInitialProfile(userObj);
        const loadedTrips = loadInitialPlannedTrips(userObj);
        const loadedConfig = loadInitialTripConfig(userObj, loadedTrips);
        const loadedHistory = loadInitialTripHistory(userObj);

        setProfile(loadedProfile);
        setPlannedTrips(loadedTrips);
        setTripConfig(loadedConfig);
        setTripHistory(loadedHistory);

        // Rehydrate chat messages for signed-in user (Issue #5)
        const userChatMsgs = ChatService.getConversationMessages(userObj.id, loadedConfig?.destId || null);
        setDesktopChatMessages(userChatMsgs);

        await syncUserToDatabase(userObj, loadedProfile);

        // Clean up URL hash / token params from email confirmation link
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        try {
          localStorage.removeItem('sakhi_auth_user');
          localStorage.removeItem('aura_auth_user');
        } catch (e) {}
        setProfile(createTraveller({ id: 'guest', name: '', email: '', passportNumber: '', licenseNumber: '', emergencyContactPerson: '' }));
        setPlannedTrips([]);
        setTripHistory([]);
        setTripConfig(null);
        setDesktopChatMessages(ChatService.getConversationMessages('guest', null));
      }
    });

    // 2. Check for existing active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userObj = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split('@')[0] : 'Traveller'),
          email: session.user.email,
          homeCountry: session.user.user_metadata?.home_country || 'United States',
          isVerified: !!session.user.confirmed_at,
          joinedDate: new Date(session.user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
        setAuthUser(userObj);
        try {
          localStorage.setItem('aura_auth_user', JSON.stringify(userObj));
        } catch (e) {}

        const loadedProfile = loadInitialProfile(userObj);
        const loadedTrips = loadInitialPlannedTrips(userObj);
        const loadedConfig = loadInitialTripConfig(userObj, loadedTrips);
        const loadedHistory = loadInitialTripHistory(userObj);

        setProfile(loadedProfile);
        setPlannedTrips(loadedTrips);
        setTripConfig(loadedConfig);
        setTripHistory(loadedHistory);
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleDispatchNotifications = (newEvents) => {
    setNotificationFeed((prev) => [...newEvents, ...prev]);
  };

  const handleSelectTripFromPlanned = (trip) => {
    setTripConfig(createTrip(trip));
  };

  // Modals state
  const [matchModalData, setMatchModalData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isDestinationPickerOpen, setIsDestinationPickerOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isInspirationalWomenOpen, setIsInspirationalWomenOpen] = useState(false);

  const handleOpenMatchModal = (data) => {
    setMatchModalData(data);
  };

  const handleSaveTripConfig = (newConfig) => {
    const newTrip = createTrip(newConfig);
    setTripConfig(newTrip);

    // Upsert into plannedTrips array
    setPlannedTrips(prev => {
      const destData = getDestinationData(newTrip.destId);
      const existsIndex = prev.findIndex(t => t.destId === newTrip.destId);
      const updatedTripObj = {
        id: newTrip.id || `trip-${Date.now()}`,
        destId: newTrip.destId,
        destName: `${destData.cityName}, ${destData.country}`,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        durationDays: newTrip.durationDays,
        tripStatus: newTrip.tripStatus,
        bookedStayName: newTrip.bookedStayName,
        stayAddress: newTrip.stayAddress,
        flightNumber: newTrip.flightNumber,
        arrivalTime: newTrip.arrivalTime,
        departureTime: newTrip.departureTime,
        destinationAirport: newTrip.destinationAirport,
        airline: newTrip.airline,
        flightConfirmed: newTrip.flightConfirmed,
        stayConfirmed: newTrip.stayConfirmed,
        departureFlightConfirmed: newTrip.departureFlightConfirmed,
        departureFlightNumber: newTrip.departureFlightNumber,
        departureAirline: newTrip.departureAirline,
        departureDate: newTrip.departureDate,
        departureAirport: newTrip.departureAirport,
        returnAirport: newTrip.returnAirport,
        planStatus: newTrip.planStatus
      };

      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = updatedTripObj;
        return copy;
      }
      return [updatedTripObj, ...prev];
    });
  };

  const handleResetTripConfig = () => {
    setTripConfig(null);
    setIsDestinationPickerOpen(true);
  };

  const handleQuickPlanCity = (destId) => {
    const today = new Date();
    const start = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];
    const end = new Date(today.getTime() + 19 * 86400000).toISOString().split('T')[0];
    const newTrip = createTrip({
      destId,
      tripStatus: 'needs-planning',
      startDate: start,
      endDate: end,
      durationDays: 5,
      flightNumber: '',
      arrivalTime: '14:00',
      bookedStayName: '',
      stayAddress: '',
      flightConfirmed: false,
      stayConfirmed: false
    });
    handleSaveTripConfig(newTrip);
  };

  const handleAddTripHistory = (newTripObj) => {
    setTripHistory((prev) => [newTripObj, ...prev]);
  };

  const handleRemoveTripHistory = (histId) => {
    setTripHistory((prev) => prev.filter((item) => item.id !== histId));
  };

  const handleSaveProfile = async (newProf) => {
    const updated = createTraveller(newProf);
    setProfile(updated);
    if (authUser) {
      const userKey = getUserStorageKey(authUser);
      try {
        localStorage.setItem(`sakhi_profile_${userKey}`, JSON.stringify(updated));
      } catch (e) {}
      await syncUserToDatabase(authUser, updated);
    }
  };

  const handleAuthSuccess = async (userObj) => {
    setAuthUser(userObj);
    try {
      localStorage.setItem('sakhi_auth_user', JSON.stringify(userObj));
    } catch (e) {}

    const userProfile = loadInitialProfile(userObj);
    const userTrips = loadInitialPlannedTrips(userObj);
    const userConfig = loadInitialTripConfig(userObj, userTrips);
    const userHistory = loadInitialTripHistory(userObj);

    setProfile(userProfile);
    setPlannedTrips(userTrips);
    setTripConfig(userConfig);
    setTripHistory(userHistory);

    // Load isolated chat messages for this user
    const userMsgs = ChatService.getConversationMessages(userObj.id, userConfig?.destId || 'prague-czech');
    setDesktopChatMessages(userMsgs);

    await syncUserToDatabase(userObj, userProfile);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
    setAuthUser(null);
    try {
      localStorage.removeItem('sakhi_auth_user');
      localStorage.removeItem('aura_auth_user');
    } catch (e) {}

    // Reset to pristine empty in-memory state so zero dummy data persists
    setProfile(createTraveller({ id: 'guest', name: '', email: '', passportNumber: '', licenseNumber: '', emergencyContactPerson: '' }));
    setPlannedTrips([]);
    setTripHistory([]);
    setTripConfig(null);

    // Reset chat messages to guest / clean welcome so previous user messages never bleed!
    setDesktopChatMessages(ChatService.getConversationMessages('guest', null));

    setIsProfileOpen(false);
    setIsChatOpen(false);
    setIsSOSOpen(false);
    setIsDestinationPickerOpen(false);
    setIsCurrencyModalOpen(false);
    setIsInspirationalWomenOpen(false);
    setIsEditTripModalOpen(false);
    setMatchModalData(null);
  };

  const handleSendDesktopMessage = async (e) => {
    e.preventDefault();
    if (!desktopInput.trim()) return;
    const userMsg = desktopInput.trim();
    const currentUserId = authUser?.id || 'guest';
    const currentDestId = destinationData?.id || tripConfig?.destId || null;

    ChatService.saveMessage(currentUserId, currentDestId, { sender: 'user', text: userMsg });
    setDesktopChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setDesktopInput('');

    // Offline Mode Gating (Issue #7)
    if (isOffline) {
      const offlineMsg = destinationData
        ? `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts, offline maps, and travel pack details for ${destinationData.cityName} remain accessible.`
        : `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts and offline maps remain accessible.`;
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: offlineMsg });
      setDesktopChatMessages((prev) => [...prev, { sender: 'sakhi', text: offlineMsg }]);
      return;
    }

    try {
      const llmReply = await generateLLMCompanionResponse({
        userPrompt: userMsg,
        destinationData,
        tripConfig,
        travellerProfile: profile,
        currentStage: activeStage,
        conversationHistory: desktopChatMessages
      });
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: llmReply });
      setDesktopChatMessages((prev) => [...prev, { sender: 'sakhi', text: llmReply }]);
    } catch (err) {
      const fallback = destinationData ? `In ${destinationData.cityName}, always stick to well-lit main boulevards after dusk.` : 'Always stick to well-lit main boulevards and vetted safe corridors after dusk.';
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: fallback });
      setDesktopChatMessages((prev) => [
        ...prev,
        { sender: 'sakhi', text: fallback }
      ]);
    }
  };

  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  const handleOpenEditTrip = (trip) => {
    setEditingTrip(trip || tripConfig);
    setIsEditTripModalOpen(true);
  };

  const handleSaveTrip = async (tripId, updates) => {
    await TripService.updateTrip(tripId, updates);
    setPlannedTrips(prev => prev.map(t => (t.id === tripId ? { ...t, ...updates } : t)));
    if (tripConfig?.id === tripId) {
      setTripConfig(prev => ({ ...prev, ...updates }));
    }
  };

  const handleDeleteTrip = async (tripId) => {
    await TripService.deleteTrip(tripId);
    const remaining = plannedTrips.filter(t => t.id !== tripId);
    setPlannedTrips(remaining);
    if (tripConfig?.id === tripId || tripConfig?.destId === editingTrip?.destId) {
      if (remaining.length > 0) {
        handleSaveTripConfig(remaining[0]);
      } else {
        setTripConfig(null);
      }
    }
  };

  const [isTripNavExpanded, setIsTripNavExpanded] = useState(true);
  const [isAiCompanionMinimized, setIsAiCompanionMinimized] = useState(false);

  const handleQuickPrompt = async (promptText) => {
    setDesktopInput('');
    const currentUserId = authUser?.id || 'guest';
    const currentDestId = destinationData?.id || tripConfig?.destId || null;

    ChatService.saveMessage(currentUserId, currentDestId, { sender: 'user', text: promptText });
    setDesktopChatMessages((prev) => [...prev, { sender: 'user', text: promptText }]);

    // Offline Mode Gating (Issue #7)
    if (isOffline) {
      const offlineMsg = destinationData
        ? `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts, offline maps, and travel pack details for ${destinationData.cityName} remain accessible.`
        : `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts and offline maps remain accessible.`;
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: offlineMsg });
      setDesktopChatMessages((prev) => [...prev, { sender: 'sakhi', text: offlineMsg }]);
      return;
    }

    try {
      const llmReply = await generateLLMCompanionResponse({
        userPrompt: promptText,
        destinationData,
        tripConfig,
        travellerProfile: profile,
        currentStage: activeStage,
        conversationHistory: desktopChatMessages
      });
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: llmReply });
      setDesktopChatMessages((prev) => [...prev, { sender: 'sakhi', text: llmReply }]);
    } catch (err) {
      const fallback = destinationData ? `In ${destinationData.cityName}, always stick to well-lit main boulevards after dusk.` : 'Always stick to well-lit main boulevards and vetted safe corridors after dusk.';
      ChatService.saveMessage(currentUserId, currentDestId, { sender: 'sakhi', text: fallback });
      setDesktopChatMessages((prev) => [
        ...prev,
        { sender: 'sakhi', text: fallback }
      ]);
    }
  };

  // Strict Full-Page Auth Gate: If not authenticated, render only the standalone AuthScreen
  if (!authUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const dynamicItinerary = destinationData ? generateDynamicItinerary(destinationData, profile, tripConfig) : [];
  const day1Schedule = dynamicItinerary[0]?.items || [];

  return (
    <div className="min-h-screen bg-[#f8f6fd] flex flex-col justify-between selection:bg-violet-200 font-sans">
      <div>
        {/* Offline Banner */}
        <OfflineBanner
          isOffline={isOffline}
          onToggle={() => setIsOffline(!isOffline)}
          onOpenSOS={() => setIsSOSOpen(true)}
        />

        {/* Global Responsive Website Header */}
        <Header
          destinationData={destinationData}
          tripConfig={tripConfig}
          plannedTrips={plannedTrips}
          onSelectTrip={handleSelectTripFromPlanned}
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          authUser={authUser}
          travellerProfile={profile}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAuth={() => {}}
          onOpenDestinationPicker={() => setIsDestinationPickerOpen(true)}
          onOpenCurrencyCalculator={() => setIsCurrencyModalOpen(true)}
          onOpenInspirationalWomen={() => setIsInspirationalWomenOpen(true)}
          onOpenEditTrip={handleOpenEditTrip}
          onSignOut={handleSignOut}
        />

        {/* Live Dispatched Notification Feed Banner */}
        {notificationFeed.length > 0 && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 space-y-2 animate-fade-in">
            {notificationFeed.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {evt.type === 'push' && <Bell className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
                  {evt.type === 'email' && <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {evt.type === 'calendar' && <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="font-extrabold text-white leading-snug">{evt.title}</h4>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{evt.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationFeed(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3-COLUMN SAKHI DASHBOARD LAYOUT */}
        <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* COLUMN 1: LEFT NAVIGATION SIDEBAR (Option A Prototype) */}
            <aside className="hidden xl:block xl:col-span-2 space-y-3 sticky top-20">
              <div className="bg-white rounded-3xl p-3.5 border border-violet-100/90 shadow-2xs space-y-3">
                
                {/* Dashboard Main Active Pill */}
                <button
                  onClick={() => setActiveStage('before-trip')}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-violet-100 text-violet-950 font-black text-xs flex items-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-violet-600" />
                  <span>Dashboard</span>
                </button>

                {/* Trip Dropdown Accordion or Plan Trip CTA */}
                {destinationData ? (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => setIsTripNavExpanded(!isTripNavExpanded)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50/70 border border-slate-200/80 transition-all flex items-center justify-between text-xs font-black text-slate-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Calendar className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span className="truncate">{destinationData.cityName} Trip</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTripNavExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isTripNavExpanded && (
                      <div className="pl-2.5 pr-1 space-y-1 text-xs font-bold text-slate-600 animate-fade-in pt-1 border-l-2 border-violet-100 ml-3">
                        <button
                          onClick={() => setActiveStage('solo-days')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                            activeStage === 'solo-days'
                              ? 'bg-violet-100/80 text-violet-950 font-black'
                              : 'hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-violet-600" />
                          <span>Itinerary</span>
                        </button>

                        <button
                          onClick={() => setActiveStage('before-trip')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                            activeStage === 'before-trip'
                              ? 'bg-violet-100/80 text-violet-950 font-black'
                              : 'hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Hotel className="w-3.5 h-3.5 text-violet-600" />
                          <span>Accommodations</span>
                        </button>

                        <button
                          onClick={() => setIsDestinationPickerOpen(true)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Compass className="w-3.5 h-3.5 text-violet-600" />
                          <span>Explore Cities</span>
                        </button>

                        <button
                          onClick={() => setActiveStage('arrival')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                            activeStage === 'arrival'
                              ? 'bg-violet-100/80 text-violet-950 font-black'
                              : 'hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Safety Corridor</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      onClick={() => setIsDestinationPickerOpen(true)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-violet-600" />
                      <span>Plan Your First Trip</span>
                    </button>
                  </div>
                )}

                {/* Section Tools Divider */}
                <div className="border-t border-violet-50/90 pt-2 space-y-1 text-xs font-bold text-slate-700">
                  <button
                    onClick={() => setIsCurrencyModalOpen(true)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-violet-50 hover:text-violet-950 transition-colors flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <Coins className="w-4 h-4 text-violet-600" />
                    <span>Currency Tools</span>
                  </button>

                  <button
                    onClick={() => setIsInspirationalWomenOpen(true)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-violet-50 hover:text-violet-950 transition-colors flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-purple-600" />
                    <span>Female Pioneers</span>
                  </button>

                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-violet-50 hover:text-violet-950 transition-colors flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-violet-600" />
                    <span>Profile & Vault</span>
                  </button>
                </div>

                {/* Emergency SOS Shortcut in Sidebar */}
                <div className="pt-2 border-t border-violet-50/90">
                  <button
                    onClick={() => setIsSOSOpen(true)}
                    className="w-full p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition-colors flex items-center justify-between border border-rose-200 shadow-2xs cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                      <span>SOS Emergency</span>
                    </span>
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-black">
                      112
                    </span>
                  </button>
                </div>
              </div>
            </aside>

            {/* COLUMN 2: CENTER TRIP DASHBOARD WORKSPACE (Option A Prototype) */}
            <div className="col-span-1 lg:col-span-8 xl:col-span-7 space-y-5">
              
              {/* 1. WELCOME HERO GREETING */}
              <div className="space-y-1 animate-fade-in">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Welcome, {authUser?.name?.split(' ')[0] || 'Traveller'}!</span>
                  <span className="text-violet-600">✨</span>
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  {destinationData
                    ? `Your ${destinationData.cityName} Adventure (${tripConfig?.startDate || 'Upcoming'} – ${tripConfig?.endDate || 'Upcoming'})`
                    : 'Your Solo Travel Planning Sanctuary • No destination selected yet'}
                </p>
              </div>

              {/* 2. WIDESCREEN PANORAMIC CITY OR SANCTUARY BANNER */}
              <div className="h-44 sm:h-52 rounded-3xl overflow-hidden shadow-sm relative group border border-slate-200/80 animate-fade-in">
                <img
                  src={destinationData
                    ? (destinationData.heroImage || 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80')
                    : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={destinationData ? destinationData.cityName : 'Solo Travel Sanctuary'}
                  className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>

                {/* Top Overlay Badges */}
                <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-10">
                  <span className="px-3 py-1 rounded-full bg-slate-950/50 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {destinationData ? 'Verified Solo Safe Destination' : 'Solo Female Travel Sanctuary'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-950/50 backdrop-blur-md text-xs font-black text-white border border-white/20 flex items-center gap-1.5">
                    {destinationData ? (
                      <>
                        <span>{destinationData.currentWeather?.icon || '☀️'}</span>
                        <span>{destinationData.currentWeather?.temp || '22°C'}</span>
                        <span className="text-violet-300 font-medium hidden sm:inline">({destinationData.currentWeather?.condition || 'Clear'})</span>
                      </>
                    ) : (
                      <span className="text-violet-200 text-[11px]">Select Destination for Weather</span>
                    )}
                  </span>
                </div>

                {/* Bottom Overlay Destination Typography */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black text-white tracking-wider uppercase drop-shadow-md">
                      {destinationData ? `${destinationData.cityName}, ${destinationData.country}` : 'Where would you like to travel solo?'}
                    </h3>
                    <p className="text-xs text-violet-100 font-medium max-w-lg mt-0.5 drop-shadow-xs">
                      {destinationData
                        ? 'Pre-cached daylight arrivals, vetted female accommodations, and 24/7 emergency response corridors active.'
                        : 'Select a destination to unlock verified daylight walking corridors, female-rated stays, and 24/7 emergency protection.'}
                    </p>
                  </div>

                  {!destinationData && (
                    <button
                      onClick={() => setIsDestinationPickerOpen(true)}
                      className="px-4 py-2 rounded-2xl bg-white text-violet-950 hover:bg-violet-50 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <Compass className="w-3.5 h-3.5 text-violet-700" />
                      <span>Choose Destination</span>
                      <ArrowRight className="w-3.5 h-3.5 text-violet-700" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. MODULAR 3-CARD DASHBOARD GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-fade-in">
                
                {/* CARD 1: FLIGHT DETAILS & CORRIDORS */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Flight Details</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tripConfig?.flightNumber
                          ? 'bg-blue-50 text-blue-800 border border-blue-100'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {tripConfig?.flightNumber ? (tripConfig.airline ? `${tripConfig.airline} ${tripConfig.flightNumber}` : tripConfig.flightNumber) : 'Not Booked Yet'}
                      </span>
                    </div>

                    {tripConfig?.flightNumber && destinationData ? (
                      <>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {tripConfig.originAirport || 'DEP'} → {tripConfig.destinationAirport || (destinationData.cityName.slice(0, 3).toUpperCase())}
                        </h4>

                        <div className="flex items-center justify-between text-xs py-2 text-slate-700 font-bold border-y border-slate-100 my-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Departure</span>
                            <span>{tripConfig.departureTime || '09:30'}</span>
                          </div>
                          <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                            <span>---</span>
                            <Plane className="w-3.5 h-3.5 text-violet-600 rotate-90" />
                            <span>---</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Arrival</span>
                            <span className="text-emerald-700">{tripConfig.arrivalTime || '18:30'}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">
                          <span>Confirmation: </span>
                          <strong className="text-slate-900 font-mono font-bold">
                            AX{tripConfig.flightNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-3) || '4Y7'}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <div className="py-2 space-y-2">
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">
                          {destinationData ? `Flight to ${destinationData.cityName}` : 'Departure Airport → Destination Airport'}
                        </h4>
                        <div className="flex items-center justify-between text-xs py-1.5 text-slate-400 font-bold border-y border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Departure</span>
                            <span>--:--</span>
                          </div>
                          <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                            <span>---</span>
                            <Plane className="w-3.5 h-3.5 text-slate-300 rotate-90" />
                            <span>---</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Arrival</span>
                            <span>--:--</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {destinationData
                            ? `No flight booked yet for ${destinationData.cityName}. Add your flight details to enable arrival corridors.`
                            : 'Direct daytime flight corridors, airport express transit paths, and mobile boarding passes appear here once you plan a trip.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => tripConfig?.flightNumber ? setActiveStage('arrival') : setIsDestinationPickerOpen(true)}
                    className="w-full py-2 px-3 rounded-2xl bg-[#240b4a] hover:bg-violet-950 text-white font-black text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{tripConfig?.flightNumber ? 'View Boarding Pass' : '+ Plan Trip / Add Flight'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 2: SAFE ACCOMMODATIONS */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-0.5">Safe Accommodations</h3>
                    <p className="text-[10px] text-slate-500 font-medium mb-2.5">Curated with female safety scores</p>

                    <div className="space-y-2">
                      {destinationData && destinationData.accommodations?.length > 0 ? (
                        destinationData.accommodations.slice(0, 2).map((stay, idx) => (
                          <div key={stay.id || idx} className="p-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-2.5">
                            <img
                              src={stay.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=120&q=80"}
                              alt={stay.name}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-900 truncate">
                                {tripConfig?.bookedStayName && idx === 0 ? tripConfig.bookedStayName : stay.name}
                              </h4>
                              <span className="text-[10px] text-emerald-700 font-extrabold block">
                                Safety: {stay.rating ? `${stay.rating}/10 ★★★★` : '9.6/10 ★★★★'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium block truncate">
                                {stay.safetyFeatures?.[0] || 'Female staff, solo safe'}
                              </span>
                            </div>
                            <button
                              onClick={() => setActiveStage('before-trip')}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer shadow-2xs shrink-0 ${
                                tripConfig?.bookedStayName && idx === 0
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-violet-100 hover:bg-violet-200 text-violet-900'
                              }`}
                            >
                              {tripConfig?.bookedStayName && idx === 0 ? 'Booked' : 'Action'}
                            </button>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="p-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                              <Hotel className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-800 truncate">
                                Female-Only Stays & Boutique Lodging
                              </h4>
                              <span className="text-[10px] text-emerald-700 font-extrabold block">
                                Safety: 9.6/10 Standard
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium block truncate">
                                24/7 staffed lobby, keycard elevators
                              </span>
                            </div>
                            <button
                              onClick={() => setIsDestinationPickerOpen(true)}
                              className="px-2.5 py-1 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 text-[10px] font-black cursor-pointer shadow-2xs shrink-0"
                            >
                              Select City
                            </button>
                          </div>

                          <div className="p-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-800 truncate">
                                Verified Solo Pods & Secure Hostels
                              </h4>
                              <span className="text-[10px] text-emerald-700 font-extrabold block">
                                Safety: 9.4/10 Verified Safe
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium block truncate">
                                Female staff, personal lockers
                              </span>
                            </div>
                            <button
                              onClick={() => setIsDestinationPickerOpen(true)}
                              className="px-2.5 py-1 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 text-[10px] font-black cursor-pointer shadow-2xs shrink-0"
                            >
                              Select City
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => destinationData ? setActiveStage('before-trip') : setIsDestinationPickerOpen(true)}
                    className="w-full text-center text-[10px] font-black text-violet-700 hover:text-violet-950 underline pt-1 cursor-pointer"
                  >
                    {destinationData ? `View All Vetted Stays in ${destinationData.cityName} →` : 'Explore All 30+ Vetted Destinations →'}
                  </button>
                </div>

                {/* CARD 3: INTERACTIVE ITINERARY TIMELINE */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Interactive Timeline</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-900">
                        {tripConfig?.startDate ? `Day 1 • ${tripConfig.startDate}` : 'Day 1 • Upcoming'}
                      </span>
                    </div>

                    {/* Vertical Timeline with Connected Violet Node Line */}
                    <div className="space-y-2.5 relative pl-4 border-l-2 border-violet-200 my-2">
                      {destinationData && day1Schedule.length > 0 ? (
                        day1Schedule.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="relative">
                            <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-violet-600 ring-2 ring-violet-200' : idx === 3 ? 'bg-purple-600 ring-2 ring-purple-200' : 'bg-violet-500 ring-2 ring-violet-200'} absolute -left-[21px] top-1`}></span>
                            <div className="text-[11px] leading-tight">
                              <strong className="text-slate-900 block font-extrabold">{item.time}</strong>
                              <span className="text-slate-600 font-medium">{item.title}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="relative">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 ring-2 ring-violet-200 absolute -left-[21px] top-1"></span>
                            <div className="text-[11px] leading-tight">
                              <strong className="text-slate-900 block font-extrabold">09:30 AM</strong>
                              <span className="text-slate-600 font-medium">Daylight Arrival & Airport Corridor Transit</span>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-200 absolute -left-[21px] top-1"></span>
                            <div className="text-[11px] leading-tight">
                              <strong className="text-slate-900 block font-extrabold">12:30 PM</strong>
                              <span className="text-slate-600 font-medium">Solo-Friendly Dining (Single counter seats & cafes)</span>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-200 absolute -left-[21px] top-1"></span>
                            <div className="text-[11px] leading-tight">
                              <strong className="text-slate-900 block font-extrabold">03:00 PM</strong>
                              <span className="text-slate-600 font-medium">Cultural Landmark & Safe Pedestrian Exploration</span>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-200 absolute -left-[21px] top-1"></span>
                            <div className="text-[11px] leading-tight">
                              <strong className="text-slate-900 block font-extrabold">06:30 PM</strong>
                              <span className="text-slate-600 font-medium">Sunset Safe Corridor & Neighborhood Rest Stop</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => destinationData ? setActiveStage('solo-days') : setIsDestinationPickerOpen(true)}
                    className="w-full text-center text-[10px] font-black text-violet-700 hover:text-violet-950 underline pt-1 cursor-pointer"
                  >
                    {destinationData ? 'Open Full 5-Day Schedule →' : 'Pick Destination to Generate Schedule →'}
                  </button>
                </div>

              </div>

              {/* 4. COMPREHENSIVE PHASE WORKFLOWS & INTERACTIVE TOOLS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-violet-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span>Interactive Trip Workflows {destinationData ? `(${destinationData.cityName})` : '(Planning Stage)'}</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Stage {activeStage === 'before-trip' ? '1 of 4' : activeStage === 'arrival' ? '2 of 4' : activeStage === 'solo-days' ? '3 of 4' : '4 of 4'}
                  </span>
                </div>

                {activeStage === 'before-trip' && (
                  <BeforeTripPhase
                    destinationData={destinationData}
                    tripConfig={tripConfig}
                    travellerProfile={profile}
                    authUser={authUser}
                    onOpenMatchModal={handleOpenMatchModal}
                    onOpenDestinationPicker={() => setIsDestinationPickerOpen(true)}
                    onSaveTripConfig={handleSaveTripConfig}
                    onResetTripConfig={handleResetTripConfig}
                    onGoToArrivalMode={() => setActiveStage('arrival')}
                    onDispatchNotifications={handleDispatchNotifications}
                  />
                )}

                {activeStage === 'arrival' && (
                  <ArrivalModePhase
                    destinationData={destinationData}
                    tripConfig={tripConfig}
                    travellerProfile={profile}
                    isOffline={isOffline}
                    onOpenMatchModal={handleOpenMatchModal}
                    onOpenSOS={() => setIsSOSOpen(true)}
                    onSaveTripConfig={handleSaveTripConfig}
                    onGoToSoloDays={() => setActiveStage('solo-days')}
                  />
                )}

                {activeStage === 'solo-days' && (
                  <SoloDaysPhase
                    destinationData={destinationData}
                    travellerProfile={profile}
                    tripConfig={tripConfig}
                    activeStage={activeStage}
                    onSaveTripConfig={handleSaveTripConfig}
                    onGoToArrivalMode={() => setActiveStage('arrival')}
                    onOpenMatchModal={handleOpenMatchModal}
                    onOpenChat={() => setIsChatOpen(true)}
                  />
                )}

                {activeStage === 'goodbye' && (
                  <GoodbyeModePhase
                    destinationData={destinationData}
                    travellerProfile={profile}
                    authUser={authUser}
                    tripConfig={tripConfig}
                    onSaveTripConfig={handleSaveTripConfig}
                    onOpenMatchModal={handleOpenMatchModal}
                  />
                )}
              </div>

            </div>

            {/* COLUMN 3: RIGHT DOCKED "SAKHI ✨ AI COMPANION" DRAWER (Option A Signature) */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20 space-y-4">
              
              {/* Option A Docked AI Companion Card */}
              <div className="rounded-3xl border border-violet-200/90 shadow-md bg-white overflow-hidden transition-all">
                
                {/* Royal Purple Header with Brand Circle */}
                <div className="p-4 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-sm shadow-xs ring-1 ring-white/30">
                      S
                    </div>
                    <div>
                      <h3 className="text-sm font-black flex items-center gap-1">
                        <span>Sakhi</span>
                        <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                      </h3>
                      <span className="text-[10px] text-violet-200 font-semibold block">
                        AI Companion • Online
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAiCompanionMinimized(!isAiCompanionMinimized)}
                    className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title={isAiCompanionMinimized ? 'Expand' : 'Minimize'}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isAiCompanionMinimized ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {!isAiCompanionMinimized && (
                  <div className="p-3.5 space-y-3 bg-[#faf9ff]">
                    
                    {/* Option A Signature Speech Bubble from Sakhi */}
                    <div className="p-3 rounded-2xl bg-violet-100/70 border border-violet-200/80 text-xs text-slate-800 font-medium space-y-1 relative">
                      <div className="flex items-center justify-between font-bold text-violet-950 text-[11px]">
                        <span className="flex items-center gap-1">
                          <strong>Sakhi</strong>
                          <Sparkles className="w-3 h-3 text-violet-600" />
                        </span>
                        <span className="text-[10px] text-violet-700">12:48 PM</span>
                      </div>
                      <p className="leading-relaxed">
                        {destinationData
                          ? `Hello ${authUser?.name?.split(' ')[0] || 'Explorer'}! Can I help you with solo-friendly places in ${destinationData.cityName}? ✨`
                          : `Hello ${authUser?.name?.split(' ')[0] || 'Explorer'}! Where are you dreaming of travelling solo? Ask me anything about safe cities, female solo corridors, or packing! ✨`
                        }
                      </p>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Quick Suggestions</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleQuickPrompt(destinationData ? `Recommend safe solo dining places with single counters in ${destinationData.cityName}` : 'What are the safest destinations for first-time solo female travelers?')}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-violet-50 text-violet-900 border border-violet-200/80 font-bold text-[10px] transition-colors shadow-2xs cursor-pointer"
                        >
                          🍜 {destinationData ? 'Solo Dining' : 'Safest Cities'}
                        </button>
                        <button
                          onClick={() => handleQuickPrompt(destinationData ? `What is the safest way to get from airport to hotel in ${destinationData.cityName}?` : 'What essential safety items should I pack for solo travel?')}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-violet-50 text-violet-900 border border-violet-200/80 font-bold text-[10px] transition-colors shadow-2xs cursor-pointer"
                        >
                          🚕 {destinationData ? 'Airport Transit' : 'Packing Safety'}
                        </button>
                        <button
                          onClick={() => handleQuickPrompt(destinationData ? `What are essential emergency phrases I should know in ${destinationData.cityName}?` : 'How do I choose safe female-only accommodations?')}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-violet-50 text-violet-900 border border-violet-200/80 font-bold text-[10px] transition-colors shadow-2xs cursor-pointer"
                        >
                          🗣️ {destinationData ? 'Safe Phrases' : 'Lodging Tips'}
                        </button>
                      </div>
                    </div>

                    {/* Conversation Message History List */}
                    {desktopChatMessages.length > 1 && (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 border-t border-violet-100 pt-2">
                        {desktopChatMessages.slice(1).map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-violet-600 text-white ml-6 font-semibold shadow-2xs'
                                : 'bg-white text-slate-800 border border-slate-200/90 font-medium shadow-2xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Option A Input Bar: "Ask Sakhi..." */}
                    <form onSubmit={handleSendDesktopMessage} className="flex items-center gap-1.5 pt-1.5 border-t border-violet-100">
                      <input
                        type="text"
                        placeholder="Ask Sakhi..."
                        value={desktopInput}
                        onChange={(e) => setDesktopInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-violet-500 shadow-2xs"
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Secondary Mini Companion Widgets */}
              <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-violet-600" /> Currency Quick View
                  </span>
                  <span className="text-[10px] font-black text-violet-800 bg-violet-50 px-2 py-0.5 rounded-md">
                    {destinationData ? (() => {
                      const userCurr = profile?.preferredCurrency || (profile?.homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(profile?.homeCountry) ? 'EUR' : 'USD'));
                      const homeRates = { USD: 1.0, EUR: 0.92, GBP: 0.78, CAD: 1.36, AUD: 1.52, JPY: 154.5 };
                      const userRate = homeRates[userCurr] || 1.0;
                      const destRate = destinationData.exchangeRateToUSD || 1.0;
                      const converted = Math.round((destRate / userRate) * 100) / 100;
                      return `1 ${userCurr} = ${converted} ${destinationData.currencyCode}`;
                    })() : 'Select Destination'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCurrencyModalOpen(true)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors text-center cursor-pointer block"
                >
                  Open Currency Calculator →
                </button>
              </div>

            </aside>

          </div>
        </main>
      </div>

      {/* Global Mobile Bottom Navigation Bar */}
      <div className="lg:hidden">
        <BottomNav
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          onOpenChat={() => setIsChatOpen(true)}
        />
      </div>

      {/* Modals & Drawers */}
      <MatchBreakdownModal
        isOpen={!!matchModalData}
        onClose={() => setMatchModalData(null)}
        title={matchModalData?.title}
        matchScore={matchModalData?.matchScore}
        whyChosen={matchModalData?.whyChosen}
        safetyFeatures={matchModalData?.safetyFeatures}
      />

      <AICompanionChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentStage={activeStage}
        isOffline={isOffline}
        destinationData={destinationData}
        tripConfig={tripConfig}
        travellerProfile={profile}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        authUser={authUser}
        onSaveProfile={handleSaveProfile}
        onSignOut={handleSignOut}
        tripHistory={tripHistory}
        onAddTripHistory={handleAddTripHistory}
        onRemoveTripHistory={handleRemoveTripHistory}
        onOpenInspirationalWomen={() => { setIsProfileOpen(false); setIsInspirationalWomenOpen(true); }}
      />

      <EmergencyModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        destinationData={destinationData}
      />

      <DestinationPickerModal
        isOpen={isDestinationPickerOpen}
        onClose={() => setIsDestinationPickerOpen(false)}
        currentTripConfig={tripConfig}
        onSaveTripConfig={handleSaveTripConfig}
        onResetTripConfig={handleResetTripConfig}
        profile={profile}
        authUser={authUser}
        onDispatchNotifications={handleDispatchNotifications}
      />

      <CurrencyCalculatorModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        destinationData={destinationData}
        travellerProfile={profile}
      />

      <InspirationalWomenModal
        isOpen={isInspirationalWomenOpen}
        onClose={() => setIsInspirationalWomenOpen(false)}
      />

      <EditTripModal
        isOpen={isEditTripModalOpen}
        onClose={() => setIsEditTripModalOpen(false)}
        activeTrip={editingTrip}
        onSaveTrip={handleSaveTrip}
        onDeleteTrip={handleDeleteTrip}
      />
    </div>
  );
}
