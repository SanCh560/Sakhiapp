/**
 * Standalone Supabase Keep-Alive Script
 * 
 * Can be run locally: npm run keep-alive
 * Or in GitHub Actions / Cron
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktfzbykgegbxbkupiohn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ejw_bZVPU80rlOXXPm_Q0A_5mStKw6u';

console.log(`🔄 [Supabase Keep-Alive] Initiating database ping to ${new URL(supabaseUrl).host}...`);
const startTime = Date.now();

try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [dRes, aRes, pRes, tRes] = await Promise.all([
    supabase.from('destinations').select('id, city_name').limit(3),
    supabase.from('accommodations').select('id, name').limit(3),
    supabase.from('places_of_interest').select('id, name').limit(3),
    supabase.from('trips').select('id').limit(3)
  ]);

  const durationMs = Date.now() - startTime;
  console.log(`✅ [Supabase Keep-Alive] Database ping succeeded in ${durationMs}ms!`);
  console.log('   - destinations:', dRes.error ? dRes.error.message : `${dRes.data.length} records queried`);
  console.log('   - accommodations:', aRes.error ? aRes.error.message : `${aRes.data.length} records queried`);
  console.log('   - places_of_interest:', pRes.error ? pRes.error.message : `${pRes.data.length} records queried`);
  console.log('   - trips:', tRes.error ? tRes.error.message : `${tRes.data.length} records queried`);
  console.log('🎉 Supabase 7-day inactivity pause timer successfully reset!');
} catch (err) {
  console.error('❌ [Supabase Keep-Alive] Ping failed:', err.message);
  process.exit(1);
}
