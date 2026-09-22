/**
 * Sakhi Database Manager & Client ORM Layer
 * 
 * Provides type-safe relational database operations (SELECT, INSERT, UPDATE, DELETE)
 * matching the Enhanced Domain Architecture:
 * 
 * BUSINESS DOMAIN:
 * 1. users
 * 2. trips
 * 3. destinations
 * 4. destination_areas
 * 5. accommodations
 * 6. trip_accommodations
 * 7. itineraries
 * 8. itinerary_days
 * 9. activities
 * 10. places_of_interest
 * 11. travel_pack
 * 12. chat_conversations
 * 13. chat_messages
 * 14. api_cache
 * 15. arrival_sessions
 * 
 * AI DOMAIN:
 * 16. traveller_memory
 * 17. recommendations
 * 18. recommendation_sources
 * 19. knowledge_documents
 */

import { pragueDestination } from '../data/tripData.js';
import { EUROPEAN_KNOWLEDGE_DOCUMENTS, EUROPEAN_DESTINATIONS_SEED } from '../data/europeanKnowledgeDataset.js';

class DatabaseManager {
  constructor() {
    this.storageKeyPrefix = 'sakhi_db_table_';
    this.legacyStorageKeyPrefix = 'aura_db_table_';
    this.initDatabase();
  }

  // Initialize Database Tables & Seed Baseline Records
  initDatabase() {
    // 1. Users Table Seed
    if (!this.getTable('users').length) {
      this.insert('users', {
        id: 'usr-default-1',
        email: 'sarah.jenkins@example.com',
        fullName: 'Sarah Jenkins',
        homeCountry: 'United States',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isVerified: true,
        passportNumberEncrypted: 'US-98421048',
        passportExpiry: '2030-05-15',
        licenseNumberEncrypted: 'DL-44810294-CA',
        licenseExpiry: '2028-11-20',
        emergencyContactPerson: 'Emma Jenkins (Sister) - +1 555 0192',
        pushNotificationsEnabled: true,
        emailAlertsEnabled: true,
        calendarSynced: true
      });
    }

    // 2. Destinations Table Seed (Static Info Only - No Weather)
    if (!this.getTable('destinations').length) {
      this.insert('destinations', {
        id: pragueDestination?.id || 'prague-czech',
        cityName: pragueDestination?.cityName || 'Prague',
        country: pragueDestination?.country || 'Czech Republic',
        heroImageUrl: pragueDestination?.heroImage || 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
        flagEmoji: pragueDestination?.flag || '🇨🇿',
        currencyCode: pragueDestination?.currencyCode || 'CZK',
        currencyName: pragueDestination?.currency || 'CZK (Kč)',
        exchangeRateToUsd: pragueDestination?.exchangeRateToUSD || 23.5,
        language: pragueDestination?.language || 'Czech',
        timezone: pragueDestination?.timezone || 'CET (GMT+1)',
        cultureSummary: 'Polite greetings entering shops, 10% tipping, stand right on escalators.',
        transportOverview: 'Integrated Metro Lines A, B, C & 24h Night Trams.',
        emergencyContacts: pragueDestination?.emergencyContacts || [],
        etiquetteTips: pragueDestination?.etiquetteTips || [],
        foodHighlights: pragueDestination?.foodHighlights || []
      });
    }

    // 3. Destination Areas Table Seed (Neighbourhood Safety & Micro Metrics)
    if (!this.getTable('destination_areas').length) {
      this.insert('destination_areas', {
        id: 'area-prague-1',
        destinationId: 'prague-czech',
        areaName: 'Old Town & Holešovice',
        latitude: 50.0875,
        longitude: 14.4214,
        lightingScore: 9.6,
        walkabilityScore: 9.8,
        transportScore: 9.5,
        crowdLevel: 'Moderate',
        crimeLevel: 'Very Low',
        womenSafetyScore: 9.7
      });
    }

    // 4. Trips Table Seed
    if (!this.getTable('trips').length) {
      this.insert('trips', {
        id: 'trip-prague-1',
        userId: 'usr-default-1',
        destinationId: 'prague-czech',
        tripStatus: 'already-booked',
        startDate: '2026-10-10',
        endDate: '2026-10-15',
        durationDays: 5,
        flightNumber: 'OK 534 (Czech Airlines)',
        arrivalTime: '14:30'
      });
    }

    // 5. Travel Pack Table Seed (Expanded for Arrival Mode)
    if (!this.getTable('travel_pack').length) {
      this.insert('travel_pack', {
        id: 'pack-prague-1',
        tripId: 'trip-prague-1',
        destinationId: 'prague-czech',
        offlineMapVersion: 'v2026.1',
        offlineRoutes: [{ name: 'Airport Express to City Center', duration: '25 mins' }],
        offlineDestinationGuide: { title: 'Prague Solo Travel Guide', verified: true },
        offlineTranslationPack: [{ text: 'Dobrý den', translation: 'Hello / Good day' }],
        vectorMapCached: true,
        emergencyContacts: pragueDestination?.emergencyContacts || [],
        downloadedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

    // 6. Accommodations Table Seed
    if (!this.getTable('accommodations').length) {
      const defaultAccs = (pragueDestination && Array.isArray(pragueDestination.accommodations))
        ? pragueDestination.accommodations
        : [
            {
              id: 'acc-prague-1',
              name: 'Mama Shelter Prague',
              type: 'Hotel',
              neighborhood: 'Holešovice, Prague 7',
              pricePerNight: '$85',
              priceValue: 85,
              rating: 4.9,
              reviewsCount: 1240,
              reviewBadge: '★ 4.9 Superhost Verified (1,240 Reviews)',
              paymentMethod: '💳 Cards & Contactless Accepted',
              image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
              bookingLink: 'https://www.booking.com',
              gmapsQuery: 'Mama Shelter Prague',
              providerName: 'Booking.com',
              safetyFeatures: ['24/7 security desk', 'Keycard elevator locks']
            }
          ];

      defaultAccs.forEach(acc => {
        this.insert('accommodations', {
          id: acc.id,
          destinationId: 'prague-czech',
          name: acc.name,
          type: acc.type,
          neighborhood: acc.neighborhood,
          pricePerNight: acc.pricePerNight,
          priceValue: acc.priceValue,
          rating: acc.rating,
          reviewsCount: acc.reviewsCount,
          reviewBadge: acc.reviewBadge,
          paymentMethod: acc.paymentMethod,
          imageUrl: acc.image || acc.imageUrl,
          bookingLink: acc.bookingLink,
          gmapsQuery: acc.gmapsQuery,
          providerName: acc.providerName,
          safetyFeatures: acc.safetyFeatures,
          hasFemaleDorm: true,
          has247Reception: true
        });
      });
    }

    // 7. Traveller Memory Table Seed (AI Domain - Explainable Provenance)
    if (!this.getTable('traveller_memory').length) {
      this.insert('traveller_memory', {
        userId: 'usr-default-1',
        tripId: 'trip-prague-1',
        preferenceKey: 'coffee',
        preferenceValue: 'Independent Cafes & Single Window Seating',
        confidenceScore: 0.94,
        learnedFrom: 'User selected Old Town single-diner cafe in Trip 1',
        source: 'User Interaction'
      });
    }

    // 8. Knowledge Documents Table Seed (AI Domain - RAG)
    const existingKnowledge = this.getTable('knowledge_documents');
    EUROPEAN_KNOWLEDGE_DOCUMENTS.forEach(doc => {
      if (!existingKnowledge.some(d => d.id === doc.id || (d.city === doc.city && d.category === doc.category))) {
        this.insert('knowledge_documents', {
          id: doc.id,
          destinationId: doc.destinationId,
          destination_id: doc.destinationId,
          title: doc.title,
          documentType: doc.category,
          document_type: doc.category,
          category: doc.category,
          city: doc.city,
          country: doc.country,
          source: doc.source,
          sourceType: doc.sourceType,
          language: doc.language,
          content: doc.content,
          metadata: doc.metadata
        });
      }
    });

    // Ensure all European destinations are present in destinations table
    const existingDests = this.getTable('destinations');
    EUROPEAN_DESTINATIONS_SEED.forEach(dest => {
      if (!existingDests.some(d => d.id === dest.id)) {
        this.insert('destinations', dest);
      }
    });
  }

  // Get table rows
  getTable(tableName) {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.storageKeyPrefix + tableName) || localStorage.getItem(this.legacyStorageKeyPrefix + tableName);
        return data ? JSON.parse(data) : [];
      }
      return this._memStore ? (this._memStore[this.storageKeyPrefix + tableName] || this._memStore[this.legacyStorageKeyPrefix + tableName] || []) : [];
    } catch {
      return [];
    }
  }

  // Save table rows
  saveTable(tableName, rows) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeyPrefix + tableName, JSON.stringify(rows));
      } else {
        this._memStore = this._memStore || {};
        this._memStore[this.storageKeyPrefix + tableName] = rows;
      }
    } catch (e) {
      console.error(`Database error saving table ${tableName}:`, e);
    }
  }

  // SELECT query with optional filter condition function
  select(tableName, filterFn = null) {
    const rows = this.getTable(tableName);
    if (!filterFn) return rows;
    return rows.filter(filterFn);
  }

  // SELECT ONE BY ID
  selectById(tableName, id) {
    const rows = this.getTable(tableName);
    return rows.find((r) => r.id === id) || null;
  }

  // INSERT INTO table
  insert(tableName, recordData) {
    const rows = this.getTable(tableName);
    const newRecord = {
      id: recordData.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...recordData
    };
    rows.unshift(newRecord);
    this.saveTable(tableName, rows);
    return newRecord;
  }

  // UPDATE record by ID
  update(tableName, id, updateFields) {
    const rows = this.getTable(tableName);
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return null;

    rows[index] = {
      ...rows[index],
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    this.saveTable(tableName, rows);
    return rows[index];
  }

  // DELETE record by ID
  delete(tableName, id) {
    const rows = this.getTable(tableName);
    const filtered = rows.filter((r) => r.id !== id);
    this.saveTable(tableName, filtered);
    return true;
  }

  // UPSERT record by ID or unique key (update if exists, insert if not)
  upsert(tableName, recordData) {
    const rows = this.getTable(tableName);
    const id = recordData.id;
    const index = id ? rows.findIndex((r) => r.id === id || (tableName === 'users' && r.email && recordData.email && r.email.toLowerCase() === recordData.email.toLowerCase())) : -1;
    if (index !== -1) {
      rows[index] = {
        ...rows[index],
        ...recordData,
        updatedAt: new Date().toISOString()
      };
      this.saveTable(tableName, rows);
      return rows[index];
    } else {
      return this.insert(tableName, recordData);
    }
  }
}

export const db = new DatabaseManager();
