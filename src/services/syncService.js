/**
 * Sakhi Offline Cache & Automatic Synchronization Engine
 * 
 * Manages local offline caching for:
 * - Travel Pack (Offline Maps, Flashcards, Emergency Contacts)
 * - Offline Itineraries & Activities
 * - Offline Destination Guides
 * 
 * Automatically detects connection status (navigator.onLine) and synchronizes
 * queued offline mutations to Supabase PostgreSQL when internet is restored!
 */

import { supabase } from '../db/supabaseClient.js';
import { db } from '../db/databaseManager.js';

class SyncService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.pendingSyncQueueKey = 'sakhi_pending_sync_queue';
    this.legacyPendingSyncQueueKey = 'aura_pending_sync_queue';
    this.initListeners();
  }

  // Listen to network status changes
  initListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Sakhi Sync Engine] Connection restored! Triggering automatic background sync to Supabase...');
        this.isOnline = true;
        this.flushPendingSyncQueue();
      });

      window.addEventListener('offline', () => {
        console.log('[Sakhi Sync Engine] Connection lost. Switching to Local Offline Travel Pack mode.');
        this.isOnline = false;
      });
    }
  }

  // Force Manual Synchronization
  async forceSync() {
    this.isOnline = navigator.onLine;
    const initialQueue = this.getPendingQueue();
    await this.flushPendingSyncQueue();
    const remainingQueue = this.getPendingQueue();
    
    return {
      success: true,
      syncedCount: initialQueue.length - remainingQueue.length,
      remainingCount: remainingQueue.length
    };
  }

  // Fetch Travel Pack (Tries Supabase Cloud first; falls back to local cache)
  async getTravelPack(tripId) {
    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('travel_pack')
          .select('*')
          .eq('trip_id', tripId)
          .single();

        if (!error && data) {
          // Cache locally for offline usage
          db.saveTable('cached_travel_pack_' + tripId, [data]);
          return { data, isOffline: false };
        }
      } catch (err) {
        console.warn('[Sakhi Sync Engine] Supabase fetch failed, resorting to local offline travel pack:', err);
      }
    }

    // Local Offline Cache Fallback
    const cached = db.getTable('cached_travel_pack_' + tripId);
    if (cached && cached.length > 0) {
      return { data: cached[0], isOffline: true };
    }

    // Default fallback pack
    const defaultPack = {
      trip_id: tripId,
      destination_id: 'prague-czech',
      vector_map_cached: true,
      emergency_contacts: [
        { title: 'Integrated Emergency Services', number: '112' },
        { title: 'Czech Medical Emergency', number: '155' }
      ],
      offline_flashcards: [
        { text: 'Dobrý den', translation: 'Hello / Good day' },
        { text: 'Děkuji', translation: 'Thank you' }
      ],
      is_downloaded: true,
      last_updated_at: new Date().toISOString()
    };

    return { data: defaultPack, isOffline: true };
  }

  // Queue an offline mutation
  queueMutation(tableName, action, record) {
    const queue = this.getPendingQueue();
    queue.push({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tableName,
      action, // 'insert' | 'update' | 'delete'
      record,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(this.pendingSyncQueueKey, JSON.stringify(queue));
    
    if (this.isOnline) {
      this.flushPendingSyncQueue();
    }
  }

  getPendingQueue() {
    try {
      const data = localStorage.getItem(this.pendingSyncQueueKey) || localStorage.getItem(this.legacyPendingSyncQueueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Flush and sync queued mutations to Supabase PostgreSQL
  async flushPendingSyncQueue() {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    console.log(`[Sakhi Sync Engine] Processing ${queue.length} queued offline mutations...`);
    const remaining = [];

    for (const item of queue) {
      try {
        if (item.action === 'insert') {
          const { error } = await supabase.from(item.tableName).insert(item.record);
          if (error) remaining.push(item);
        } else if (item.action === 'update') {
          const { error } = await supabase.from(item.tableName).update(item.record).eq('id', item.record.id);
          if (error) remaining.push(item);
        } else if (item.action === 'delete') {
          const { error } = await supabase.from(item.tableName).delete().eq('id', item.record.id);
          if (error) remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    localStorage.setItem(this.pendingSyncQueueKey, JSON.stringify(remaining));
    if (remaining.length === 0) {
      localStorage.removeItem(this.legacyPendingSyncQueueKey);
      console.log('[Sakhi Sync Engine] All offline queued mutations successfully synced to Supabase PostgreSQL!');
    }
  }
}

export const syncService = new SyncService();
