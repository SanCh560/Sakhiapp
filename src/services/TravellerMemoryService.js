/**
 * Sakhi Traveller Memory Service
 * 
 * Manages structured traveller preferences, learned historical behaviour,
 * and user custom instructions with real persistence (LocalStorage + Supabase):
 * - Budget Tier & custom budget limits
 * - Accommodation preferences (Female-only dorms, Boutique hotel, Private room)
 * - Custom instructions given to the AI across sessions
 * - Travel pace, walking style, safety priorities
 * - Conversation context & extracted user intents
 */

import { supabase } from '../db/supabaseClient.js';
import { db } from '../db/databaseManager.js';

export const TravellerMemoryService = {
  /**
   * Fetch structured traveller profile & active memories from LocalStorage & Supabase
   */
  async getTravellerContext(userId = 'usr-default-1') {
    let profile = null;
    let memories = [];
    let customInstructions = '';

    // 1. Check LocalStorage for saved user profile & custom instructions
    try {
      if (typeof localStorage !== 'undefined') {
        const authUserStr = localStorage.getItem('sakhi_auth_user') || localStorage.getItem('aura_auth_user');
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          if (authUser) {
            profile = { ...profile, ...authUser };
            const userKey = String(authUser.id || authUser.email || '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const savedScopedProfile = localStorage.getItem(`sakhi_profile_${userKey}`) || localStorage.getItem(`aura_profile_${userKey}`);
            if (savedScopedProfile) {
              profile = { ...profile, ...JSON.parse(savedScopedProfile) };
            }
          }
        }
        const localProfileStr = localStorage.getItem('sakhi_user_profile') || localStorage.getItem('aura_user_profile');
        if (localProfileStr) {
          profile = { ...JSON.parse(localProfileStr), ...profile };
        }
        customInstructions = localStorage.getItem('sakhi_custom_instructions') || localStorage.getItem('aura_custom_instructions') || '';
        const localMemories = localStorage.getItem('sakhi_traveller_memory') || localStorage.getItem('aura_traveller_memory');
        if (localMemories) {
          memories = JSON.parse(localMemories);
        }
      }
    } catch (err) {
      console.warn('[TravellerMemoryService] LocalStorage read notice:', err);
    }

    // 2. Fetch from Supabase if online
    if (navigator.onLine && userId && userId !== 'guest') {
      try {
        const { data: userProfile } = await supabase.from('users').select('*').eq('id', userId).single();
        if (userProfile) {
          profile = { ...profile, ...userProfile };
        }

        const { data: memData } = await supabase.from('traveller_memory').select('*').eq('user_id', userId);
        if (memData && memData.length > 0) {
          memories = memData;
        }
      } catch (e) {
        console.warn('[TravellerMemoryService] Supabase fetch fallback:', e);
      }
    }

    if (!profile || !profile.fullName) {
      const dbUser = db.selectById('users', userId);
      if (dbUser) {
        profile = { ...dbUser, ...profile };
      } else {
        profile = {
          id: userId,
          fullName: profile?.name || profile?.fullName || 'Explorer',
          homeCountry: profile?.homeCountry || profile?.home_country || 'your home country'
        };
      }
    }

    // Parse budget limit from user profile or custom instructions
    let budgetLimit = 90;
    const tier = profile.budgetTier || 'Balanced ($$)';
    if (tier.includes('Budget') || tier.includes('$') && !tier.includes('$$')) {
      budgetLimit = 50;
    } else if (tier.includes('Luxury') || tier.includes('$$$')) {
      budgetLimit = 220;
    } else {
      budgetLimit = 95;
    }

    // If custom instructions specify a budget, override it
    const budgetMatch = customInstructions.match(/(?:under|max|budget of|less than|\$|£|€)\s*(\d{2,4})/i);
    if (budgetMatch) {
      budgetLimit = parseInt(budgetMatch[1], 10);
    }

    // Check female dorm preference
    const accPref = profile.accPreference || 'Hostel / Female Pods';
    const femaleDormOnly = accPref.toLowerCase().includes('female') || 
                           accPref.toLowerCase().includes('hostel') ||
                           customInstructions.toLowerCase().includes('female');

    const homeCountry = profile.homeCountry || profile.home_country || 'your home country';
    const preferredCurrency = profile.preferredCurrency || (homeCountry === 'United Kingdom' ? 'GBP' : (['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(homeCountry) ? 'EUR' : 'USD'));
    const currencySymbol = preferredCurrency === 'GBP' ? '£' : (preferredCurrency === 'EUR' ? '€' : '$');

    const structuredContext = {
      userId,
      fullName: profile.name || profile.fullName || profile.full_name || 'Explorer',
      homeCountry,
      preferredCurrency,
      currencySymbol,
      budgetTier: tier,
      budgetLimit,
      femaleDormOnly,
      accPreference: accPref,
      placesToVisit: profile.placesToVisit || '',
      preferredTransport: profile.preferredTransport || profile.transportPref || '',
      tripEnergyMotivation: profile.tripEnergyMotivation || profile.adventureVibe || '',
      walkingPreference: profile.walkingPreference || 'Enthusiastic Walker (< 25 min walk)',
      travelPace: profile.tripEnergyMotivation || profile.adventureVibe || '🌿 Moderate & Relaxed',
      safetyPriority: 'Maximum (Keycard Elevators, 24/7 Front Desk, High Street Lighting)',
      foodPreferences: ['Specialty Coffee', 'Artisanal Bakeries', 'Solo-friendly Food Halls'],
      customInstructions,
      previousChoices: memories.map(m => m.preference_value || m.preferenceValue),
      memoriesList: memories
    };

    return structuredContext;
  },

  /**
   * Get custom instructions stored for the traveller
   */
  getUserInstructions() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('sakhi_custom_instructions') || localStorage.getItem('aura_custom_instructions') || '';
      }
    } catch {}
    return '';
  },

  /**
   * Save new user instructions (e.g. "prefer boutique hotels under $80 near metro")
   */
  setUserInstructions(instructions) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sakhi_custom_instructions', instructions || '');
        localStorage.setItem('aura_custom_instructions', instructions || '');
      }
    } catch {}
    this.recordPreference('usr-default-1', 'user_custom_instructions', instructions, 'User Prompt Input');
  },

  /**
   * Automatically extract and store preferences from natural language user input
   */
  extractAndLearnFromMessage(text) {
    if (!text || typeof text !== 'string') return;
    const lower = text.toLowerCase();

    // 1. Budget extraction
    const budgetMatch = lower.match(/(?:budget|spend|cost|under|max)\s*(?:is|of|around)?\s*(?:\$|£|€)?\s*(\d{2,4})/i);
    if (budgetMatch) {
      const amount = budgetMatch[1];
      this.recordPreference('usr-default-1', 'preferred_budget_limit', `$${amount}`, 'AI Chat Extraction');
    }

    // 2. Accommodation style extraction
    if (lower.includes('female only') || lower.includes('female-only') || lower.includes('women only')) {
      this.recordPreference('usr-default-1', 'female_only_priority', 'Strictly Female Only', 'AI Chat Extraction');
    }
    if (lower.includes('boutique') || lower.includes('hotel instead') || lower.includes('private room')) {
      this.recordPreference('usr-default-1', 'stay_style', 'Boutique Hotel / Private Room', 'AI Chat Extraction');
    } else if (lower.includes('hostel') || lower.includes('pod')) {
      this.recordPreference('usr-default-1', 'stay_style', 'Social Hostel / Privacy Pod', 'AI Chat Extraction');
    }

    // 3. Noise / Vibe extraction
    if (lower.includes('quiet') || lower.includes('calm') || lower.includes('peaceful')) {
      this.recordPreference('usr-default-1', 'atmosphere_preference', 'Quiet & Restful', 'AI Chat Extraction');
    } else if (lower.includes('social') || lower.includes('meet people') || lower.includes('party')) {
      this.recordPreference('usr-default-1', 'atmosphere_preference', 'Social & Community Events', 'AI Chat Extraction');
    }

    // 4. Neighborhood / Transit
    if (lower.includes('near metro') || lower.includes('near train') || lower.includes('central') || lower.includes('walkable')) {
      this.recordPreference('usr-default-1', 'location_priority', 'Central Walkable / Transit Accessible', 'AI Chat Extraction');
    }
  },

  /**
   * Save a newly learned preference into traveller_memory
   */
  async recordPreference(userId = 'usr-default-1', preferenceKey, preferenceValue, source = 'User Selection') {
    const memoryRecord = {
      id: `mem-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      user_id: userId,
      preference_key: preferenceKey,
      preference_value: preferenceValue,
      confidence_score: 0.95,
      source,
      created_at: new Date().toISOString()
    };

    // Save in local databaseManager
    db.insert('traveller_memory', memoryRecord);

    // Save in localStorage
    try {
      const existingStr = localStorage.getItem('sakhi_traveller_memory') || localStorage.getItem('aura_traveller_memory');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      // Replace if key exists, otherwise append
      const updated = existing.filter(m => m.preference_key !== preferenceKey);
      updated.push(memoryRecord);
      localStorage.setItem('sakhi_traveller_memory', JSON.stringify(updated));
      localStorage.setItem('aura_traveller_memory', JSON.stringify(updated));
    } catch (e) {
      console.warn('[TravellerMemoryService] Local storage write warning:', e);
    }

    // Sync with Supabase if online
    if (navigator.onLine) {
      try {
        await supabase.from('traveller_memory').upsert([memoryRecord]);
      } catch (e) {
        console.warn('[TravellerMemoryService] Supabase memory record failed:', e);
      }
    }

    return memoryRecord;
  },

  /**
   * Get all active memory records for inspection or UI display
  */
  getAllMemories() {
    try {
      const existingStr = localStorage.getItem('sakhi_traveller_memory') || localStorage.getItem('aura_traveller_memory');
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  },

  /**
   * Clear all memories (for reset / privacy)
   */
  clearMemories() {
    localStorage.removeItem('sakhi_traveller_memory');
    localStorage.removeItem('aura_traveller_memory');
    localStorage.removeItem('sakhi_custom_instructions');
    localStorage.removeItem('aura_custom_instructions');
  }
};
