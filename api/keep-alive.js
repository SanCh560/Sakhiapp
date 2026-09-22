/**
 * Vercel Serverless Function: Supabase Keep-Alive Ping
 * 
 * Scheduled via Vercel Cron (vercel.json) every 24 hours.
 * Executes multiple database queries against Supabase PostgreSQL
 * to keep PostgREST and the Postgres database active, preventing
 * the 7-day inactivity pause on Supabase free tier.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const startTime = Date.now();

  // 1. Optional Cron Secret verification (if configured in Vercel)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers?.authorization || (typeof req.headers?.get === 'function' ? req.headers.get('authorization') : null);

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const errorPayload = {
      success: false,
      error: 'Unauthorized: Invalid or missing Bearer token in Authorization header'
    };
    if (res && typeof res.status === 'function') {
      return res.status(401).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // 2. Resolve Supabase credentials (supporting VITE_ or standard naming)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktfzbykgegbxbkupiohn.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ejw_bZVPU80rlOXXPm_Q0A_5mStKw6u';

  if (!supabaseUrl || !supabaseKey) {
    const missingCredsPayload = {
      success: false,
      error: 'Missing Supabase credentials'
    };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(missingCredsPayload);
    }
    return new Response(JSON.stringify(missingCredsPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const queryResults = {
    destinations: null,
    accommodations: null,
    placesOfInterest: null,
    trips: null
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query 1: Destinations
    const dRes = await supabase.from('destinations').select('id, city_name').limit(3);
    queryResults.destinations = {
      count: dRes.data?.length ?? 0,
      status: dRes.error ? `Error: ${dRes.error.message}` : 'OK'
    };

    // Query 2: Accommodations
    const aRes = await supabase.from('accommodations').select('id, name').limit(3);
    queryResults.accommodations = {
      count: aRes.data?.length ?? 0,
      status: aRes.error ? `Error: ${aRes.error.message}` : 'OK'
    };

    // Query 3: Places of Interest
    const pRes = await supabase.from('places_of_interest').select('id, name').limit(3);
    queryResults.placesOfInterest = {
      count: pRes.data?.length ?? 0,
      status: pRes.error ? `Error: ${pRes.error.message}` : 'OK'
    };

    // Query 4: Trips
    const tRes = await supabase.from('trips').select('id').limit(3);
    queryResults.trips = {
      count: tRes.data?.length ?? 0,
      status: tRes.error ? `Error: ${tRes.error.message}` : 'OK'
    };

    const durationMs = Date.now() - startTime;

    const payload = {
      success: true,
      message: 'Supabase keep-alive ping executed successfully. Database is warm and active.',
      timestamp: new Date().toISOString(),
      executionDurationMs: durationMs,
      targetSupabaseHost: new URL(supabaseUrl).host,
      queries: queryResults
    };

    console.log(`[Keep-Alive] Ping succeeded in ${durationMs}ms: ${JSON.stringify(queryResults)}`);

    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('[Keep-Alive] Execution error:', err);

    const errorPayload = {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
      executionDurationMs: durationMs
    };

    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
