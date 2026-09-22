-- ====================================================================
-- SUPABASE MIGRATION 000001: INITIAL DOMAIN SCHEMA
-- File: supabase/migrations/20260809000001_initial_schema.sql
-- ====================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ====================================================================
-- BUSINESS DOMAIN TABLES
-- ====================================================================

-- USERS PROFILE TABLE (References auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    home_country VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    passport_number_encrypted TEXT,
    passport_expiry DATE,
    license_number_encrypted TEXT,
    license_expiry DATE,
    emergency_contact_person VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    email_alerts_enabled BOOLEAN DEFAULT TRUE,
    calendar_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DESTINATIONS TABLE (Static Destination Info Only)
CREATE TABLE IF NOT EXISTS public.destinations (
    id VARCHAR(100) PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    hero_image_url TEXT,
    flag_emoji VARCHAR(10),
    currency_code VARCHAR(10) NOT NULL,
    currency_name VARCHAR(50) NOT NULL,
    language VARCHAR(100),
    timezone VARCHAR(50),
    culture_summary TEXT,
    transport_overview TEXT,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    etiquette_tips JSONB DEFAULT '[]'::jsonb,
    food_highlights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DESTINATION AREAS TABLE (Neighbourhood Safety & Micro Metrics)
CREATE TABLE IF NOT EXISTS public.destination_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id VARCHAR(100) REFERENCES public.destinations(id) ON DELETE CASCADE,
    area_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    lighting_score DECIMAL(3, 1) DEFAULT 9.6,
    walkability_score DECIMAL(3, 1) DEFAULT 9.8,
    transport_score DECIMAL(3, 1) DEFAULT 9.5,
    crowd_level VARCHAR(50) DEFAULT 'Moderate',
    crime_level VARCHAR(50) DEFAULT 'Very Low',
    women_safety_score DECIMAL(3, 1) DEFAULT 9.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    destination_id VARCHAR(100) REFERENCES public.destinations(id),
    trip_status VARCHAR(50) DEFAULT 'needs-planning',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INT NOT NULL DEFAULT 5,
    flight_number VARCHAR(100),
    arrival_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACCOMMODATIONS TABLE (Normalized Foreign Key to destination_areas)
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id VARCHAR(100) REFERENCES public.destinations(id) ON DELETE CASCADE,
    destination_area_id UUID REFERENCES public.destination_areas(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_per_night VARCHAR(50),
    price_value DECIMAL(8, 2),
    rating DECIMAL(2, 1),
    reviews_count INT DEFAULT 0,
    review_badge VARCHAR(150),
    payment_method VARCHAR(100),
    image_url TEXT,
    booking_link TEXT,
    gmaps_query VARCHAR(255),
    provider_name VARCHAR(50),
    safety_features JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    has_female_dorm BOOLEAN DEFAULT TRUE,
    has_247_reception BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIP ACCOMMODATIONS TABLE
CREATE TABLE IF NOT EXISTS public.trip_accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE CASCADE,
    check_in_date DATE,
    check_out_date DATE,
    confirmation_number VARCHAR(100),
    booking_status VARCHAR(50) DEFAULT 'booked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    is_saved_draft BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITINERARY DAYS TABLE
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    day_title VARCHAR(200) NOT NULL,
    theme VARCHAR(100),
    energy_required VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    time_slot VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    place_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLACES OF INTEREST TABLE
CREATE TABLE IF NOT EXISTS public.places_of_interest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id VARCHAR(100) REFERENCES public.destinations(id) ON DELETE CASCADE,
    destination_area_id UUID REFERENCES public.destination_areas(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_hours VARCHAR(100),
    rating DECIMAL(2, 1) DEFAULT 4.8,
    price_level VARCHAR(10) DEFAULT '$$',
    tags JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    walk_time VARCHAR(50),
    energy_required VARCHAR(50),
    is_open_now BOOLEAN DEFAULT TRUE,
    payment_alert VARCHAR(100),
    is_cash_only BOOLEAN DEFAULT FALSE,
    review_badge VARCHAR(150),
    gmaps_query VARCHAR(255),
    lighting_score VARCHAR(100),
    crowd_level VARCHAR(100),
    why_chosen_rationale TEXT,
    safety_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRAVEL PACK TABLE
CREATE TABLE IF NOT EXISTS public.travel_pack (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    destination_id VARCHAR(100) REFERENCES public.destinations(id),
    offline_map_version VARCHAR(50) DEFAULT 'v2026.1',
    offline_routes JSONB DEFAULT '[]'::jsonb,
    offline_destination_guide JSONB DEFAULT '{}'::jsonb,
    offline_translation_pack JSONB DEFAULT '[]'::jsonb,
    vector_map_cached BOOLEAN DEFAULT TRUE,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHAT CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    assistant_context VARCHAR(100) DEFAULT 'before-trip',
    conversation_type VARCHAR(50) DEFAULT 'safety_companion',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    tool_used VARCHAR(100),
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API CACHE TABLE
CREATE TABLE IF NOT EXISTS public.api_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    response JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ARRIVAL SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.arrival_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    airport VARCHAR(100) NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE,
    transport_used VARCHAR(100),
    route_type VARCHAR(100),
    navigation_started BOOLEAN DEFAULT FALSE,
    navigation_completed BOOLEAN DEFAULT FALSE,
    emergency_accessed BOOLEAN DEFAULT FALSE,
    offline_mode_used BOOLEAN DEFAULT TRUE,
    arrival_success BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- AI DOMAIN TABLES
-- ====================================================================

-- TRAVELLER MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.traveller_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NOT NULL,
    confidence_score DECIMAL(3, 2) DEFAULT 0.90,
    learned_from TEXT,
    source VARCHAR(100) DEFAULT 'User Interaction',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    ai_match_score INT NOT NULL,
    safety_score INT NOT NULL,
    personal_fit_score INT NOT NULL,
    comfort_score INT NOT NULL,
    convenience_score INT NOT NULL,
    explanation TEXT NOT NULL,
    reasoning_json JSONB DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(3, 2) DEFAULT 0.92,
    interaction_status VARCHAR(50) DEFAULT 'shown',
    feedback_tag VARCHAR(100),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECOMMENDATION SOURCES TABLE
CREATE TABLE IF NOT EXISTS public.recommendation_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    source_reference TEXT NOT NULL,
    weight DECIMAL(3, 2) DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KNOWLEDGE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id VARCHAR(100) REFERENCES public.destinations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    source VARCHAR(150) DEFAULT 'Official Tourist Board & Safety Vetting',
    language VARCHAR(10) DEFAULT 'en',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
