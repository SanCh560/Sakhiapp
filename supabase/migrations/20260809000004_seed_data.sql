-- ====================================================================
-- SUPABASE MIGRATION 000004: BASELINE SEED DATA
-- File: supabase/migrations/20260809000004_seed_data.sql
-- ====================================================================

-- 1. BASELINE PRAGUE DESTINATION SEED
INSERT INTO public.destinations (
    id, city_name, country, hero_image_url, flag_emoji, currency_code, currency_name, language, timezone, culture_summary, transport_overview
) VALUES (
    'prague-czech', 'Prague', 'Czech Republic', 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80', '🇨🇿', 'CZK', 'CZK (Kč)', 'Czech', 'CET (GMT+1)', 'Polite greetings entering shops, 10% tipping, stand right on escalators.', 'Integrated Metro Lines A, B, C & 24h Night Trams.'
) ON CONFLICT (id) DO NOTHING;

-- 2. BASELINE DESTINATION AREA SEED
INSERT INTO public.destination_areas (
    destination_id, area_name, lighting_score, walkability_score, transport_score, crowd_level, crime_level, women_safety_score
) VALUES (
    'prague-czech', 'Old Town & Holešovice', 9.6, 9.8, 9.5, 'Moderate', 'Very Low', 9.7
) ON CONFLICT DO NOTHING;
