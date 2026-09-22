/**
 * Sakhi Supabase Client Configuration
 * 
 * Provides native PostgreSQL connectivity, Realtime Subscriptions,
 * Row Level Security (RLS), and pgvector RAG search via Supabase Cloud.
 */

import { createClient } from '@supabase/supabase-js';

// Read credentials safely from Vite env or Node process.env
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const SUPABASE_URL = env?.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = env?.VITE_SUPABASE_ANON_KEY || 'public-anon-key-placeholder';

// Create Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Utility helper to test live connection to Supabase cloud database
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('destinations').select('id, city_name').limit(1);
    if (error) {
      console.warn('[Supabase Cloud] Connection Notice:', error.message);
      return { isConnected: false, error: error.message };
    }
    console.log('[Supabase Cloud] Connected successfully to PostgreSQL database!');
    return { isConnected: true, data };
  } catch (err) {
    console.warn('[Supabase Cloud] Offline / Local fallback active:', err.message);
    return { isConnected: false, error: err.message };
  }
}
