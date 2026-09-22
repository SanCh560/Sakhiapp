/**
 * Sakhi Unified Services Hub
 * 
 * High-level business logic services encapsulating:
 * - TripService (Multi-trip CRUD)
 * - ProfileService (User identity, preferences)
 * - DestinationService (Static destination metadata & destination_areas micro metrics)
 * - TravelPackService (Offline Travel Pack manager)
 * - ArrivalSessionService (Flagship Arrival Mode Session Analytics)
 */

import { supabase } from '../db/supabaseClient.js';
import { db } from '../db/databaseManager.js';
import { syncService } from './syncService.js';

// 1. TRIP SERVICE
export const TripService = {
  async getPlannedTrips(userId = 'usr-default-1') {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          db.saveTable('trips', data);
          return data;
        }
      } catch (e) {
        console.warn('[TripService] Supabase fetch failed, using local DB:', e);
      }
    }

    return db.select('trips', (t) => t.userId === userId || t.user_id === userId);
  },

  async createTrip(tripData) {
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newTrip = {
      id: `trip-${Date.now()}`,
      userId: tripData.userId || 'usr-default-1',
      destinationId: tripData.destinationId || tripData.destId || '',
      destName: tripData.destName || '',
      tripStatus: tripData.tripStatus || 'needs-planning',
      startDate: (tripData.startDate && tripData.startDate >= today) ? tripData.startDate : today,
      endDate: (tripData.endDate && tripData.endDate >= (tripData.startDate || today)) ? tripData.endDate : defaultEnd,
      durationDays: tripData.durationDays || 5,
      flightNumber: tripData.flightNumber || '',
      bookedStayName: tripData.bookedStayName || ''
    };

    db.insert('trips', newTrip);
    syncService.queueMutation('trips', 'insert', newTrip);
    return newTrip;
  },

  async updateTrip(tripId, updates) {
    // Ensure destination_id remains immutable as required
    const safeUpdates = {
      startDate: updates.startDate,
      endDate: updates.endDate,
      durationDays: updates.durationDays,
      flightNumber: updates.flightNumber,
      bookedStayName: updates.bookedStayName
    };

    const updated = db.update('trips', tripId, safeUpdates);
    syncService.queueMutation('trips', 'update', { id: tripId, ...safeUpdates });
    return updated;
  },

  async deleteTrip(tripId) {
    db.delete('trips', tripId);
    syncService.queueMutation('trips', 'delete', { id: tripId });
    return true;
  }
};

// Helper to get sanitized per-user storage key
export function getUserStorageKey(user) {
  if (!user) return 'guest';
  const raw = user.id || user.email || 'guest';
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Synchronize User Record into both local Database ORM and Supabase PostgreSQL
export async function syncUserToDatabase(userObj, profileData = {}) {
  if (!userObj || !userObj.id) return null;

  const fullName = userObj.name || userObj.fullName || profileData.name || '';
  const email = userObj.email || '';
  const homeCountry = userObj.homeCountry || profileData.homeCountry || 'United States';
  const isVerified = userObj.isVerified !== undefined ? userObj.isVerified : false;
  const preferredCurrency = profileData.preferredCurrency || (homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(homeCountry) ? 'EUR' : 'USD'));

  // 1. Record in local DatabaseManager ORM
  try {
    db.upsert('users', {
      id: userObj.id,
      email,
      fullName,
      homeCountry,
      preferredCurrency,
      isVerified,
      avatarUrl: profileData.avatarUrl || userObj.avatarUrl || '',
      passportNumberEncrypted: profileData.passportNumber || '',
      passportExpiry: profileData.passportExpiry || null,
      licenseNumberEncrypted: profileData.licenseNumber || '',
      licenseExpiry: profileData.licenseExpiry || null,
      emergencyContactPerson: profileData.emergencyContactPerson || '',
      emergencyContactPhone: profileData.emergencyContactPhone || '',
      pushNotificationsEnabled: profileData.pushNotifications ?? true,
      emailAlertsEnabled: profileData.emailAlerts ?? true,
      calendarSynced: profileData.calendarSynced ?? false,
      placesToVisit: profileData.placesToVisit || '',
      preferredTransport: profileData.preferredTransport || profileData.transportPref || '',
      tripEnergyMotivation: profileData.tripEnergyMotivation || profileData.adventureVibe || '',
      naturalLanguagePreferences: profileData.naturalLanguagePreferences || ''
    });
    console.log('[Database] User saved to local users table:', userObj.id);
  } catch (err) {
    console.warn('[Database] Local DB users upsert error:', err);
  }

  // 2. Synchronize to Supabase Cloud public.users if online and session is active
  if (navigator.onLine) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      const payload = {
        id: userObj.id,
        full_name: fullName || (email ? email.split('@')[0] : 'Traveller'),
        home_country: homeCountry,
        preferred_currency: preferredCurrency,
        is_verified: isVerified,
        avatar_url: profileData.avatarUrl || null,
        passport_number_encrypted: profileData.passportNumber || null,
        passport_expiry: profileData.passportExpiry || null,
        license_number_encrypted: profileData.licenseNumber || null,
        license_expiry: profileData.licenseExpiry || null,
        emergency_contact_person: profileData.emergencyContactPerson || null,
        emergency_contact_phone: profileData.emergencyContactPhone || null,
        push_notifications_enabled: profileData.pushNotifications ?? true,
        email_alerts_enabled: profileData.emailAlerts ?? true,
        calendar_synced: profileData.calendarSynced ?? false
      };

      let { data, error } = await supabase.from('users').upsert(payload).select();
      if (error && (error.message?.includes('preferred_currency') || error.code === 'PGRST204')) {
        console.warn('[Supabase Cloud] Schema cache missing preferred_currency, retrying without column...');
        delete payload.preferred_currency;
        const retry = await supabase.from('users').upsert(payload).select();
        data = retry.data;
        error = retry.error;
      }
      if (error) {
        console.warn('[Supabase Cloud] public.users upsert notice:', error.message);
      } else {
        console.log('[Supabase Cloud] public.users recorded successfully:', data);
      }
    } catch (cloudErr) {
      console.warn('[Supabase Cloud] Cloud sync error:', cloudErr);
    }
  }
}

// 2. PROFILE SERVICE
export const ProfileService = {
  async getProfile(userId = 'usr-default-1') {
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          db.upsert('users', data);
          return data;
        }
      } catch (e) {
        console.warn('[ProfileService] Supabase fetch failed:', e);
      }
    }

    const users = db.getTable('users');
    const matched = users.find(u => u.id === userId || (u.email && userId && u.email.toLowerCase() === userId.toLowerCase()));
    if (matched) return matched;

    if (userId === 'usr-demo-sarah' || userId === 'usr-default-1' || userId === 'sarah.jenkins@example.com') {
      return {
        id: 'usr-demo-sarah',
        fullName: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.com',
        homeCountry: 'United States',
        isVerified: true
      };
    }

    return null;
  },

  async updateProfile(userId, profileUpdates) {
    const updated = db.update('users', userId, profileUpdates);
    syncService.queueMutation('users', 'update', { id: userId, ...profileUpdates });
    return updated;
  }
};

// 3. DESTINATION SERVICE
export const DestinationService = {
  async getDestination(destId) {
    if (!destId) return null;
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('destinations')
          .select('*')
          .eq('id', destId)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('[DestinationService] Supabase fetch failed:', e);
      }
    }

    return db.selectById('destinations', destId);
  },

  async getDestinationAreas(destId) {
    if (!destId) return [];
    return db.select('destination_areas', (a) => a.destinationId === destId || a.destination_id === destId);
  }
};

// 4. TRAVEL PACK SERVICE
export const TravelPackService = {
  async getTravelPack(tripId = 'trip-prague-1') {
    return await syncService.getTravelPack(tripId);
  }
};

// 5. ARRIVAL SESSION SERVICE (Flagship Arrival Mode Analytics)
export const ArrivalSessionService = {
  async startSession(tripId = 'trip-prague-1', airportName = 'Václav Havel Airport Prague (PRG)') {
    const sessionRecord = {
      id: `arr-${Date.now()}`,
      tripId,
      airport: airportName,
      arrivalTime: new Date().toISOString(),
      navigationStarted: true,
      navigationCompleted: false,
      emergencyAccessed: false,
      offlineModeUsed: !navigator.onLine
    };

    db.insert('arrival_sessions', sessionRecord);
    syncService.queueMutation('arrival_sessions', 'insert', sessionRecord);
    return sessionRecord;
  },

  async completeSession(sessionId) {
    const update = { navigationCompleted: true, completedAt: new Date().toISOString() };
    db.update('arrival_sessions', sessionId, update);
    syncService.queueMutation('arrival_sessions', 'update', { id: sessionId, ...update });
  }
};
