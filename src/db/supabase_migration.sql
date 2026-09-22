-- ====================================================================
-- SAKHI SOLO FEMALE TRAVEL PLATFORM - COMPLETE PRODUCTION SUPABASE MIGRATION
-- Copy & paste this entire script into Supabase Dashboard -> SQL Editor and click RUN
-- ====================================================================

-- 1. ENABLE EXTENSIONS (pgvector for RAG Search & UUID generation)
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

-- PLACES OF INTEREST TABLE (Normalized Foreign Key to destination_areas)
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

-- CHAT CONVERSATIONS & MESSAGES (Extended with tool_used & context_snapshot)
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

-- ARRIVAL SESSIONS TABLE (Extended with transport_used, route_type, arrival_success)
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

-- RECOMMENDATIONS TABLE (Extended with reasoning_json)
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

-- KNOWLEDGE DOCUMENTS TABLE (Normalized Foreign Key to destinations)
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

-- ====================================================================
-- PERFORMANCE B-TREE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination_id ON public.trips(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_areas_destination_id ON public.destination_areas(destination_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_destination_id ON public.accommodations(destination_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_area_id ON public.accommodations(destination_area_id);
CREATE INDEX IF NOT EXISTS idx_places_of_interest_destination_id ON public.places_of_interest(destination_id);
CREATE INDEX IF NOT EXISTS idx_places_of_interest_area_id ON public.places_of_interest(destination_area_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary_id ON public.itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_activities_day_id ON public.activities(day_id);
CREATE INDEX IF NOT EXISTS idx_traveller_memory_user_id ON public.traveller_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_travel_pack_trip_id ON public.travel_pack(trip_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_destination_id ON public.knowledge_documents(destination_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_pack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveller_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own travel packs" ON public.travel_pack FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = travel_pack.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users access own memory" ON public.traveller_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recommendations" ON public.recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own chat conversations" ON public.chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own chat messages" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid())
);

CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read destination_areas" ON public.destination_areas FOR SELECT USING (true);
CREATE POLICY "Public read accommodations" ON public.accommodations FOR SELECT USING (true);
CREATE POLICY "Public read places_of_interest" ON public.places_of_interest FOR SELECT USING (true);
CREATE POLICY "Public read knowledge_documents" ON public.knowledge_documents FOR SELECT USING (true);

-- SEED BASELINE DATA
INSERT INTO public.destinations (
    id, city_name, country, hero_image_url, flag_emoji, currency_code, currency_name, language, timezone, culture_summary, transport_overview
) VALUES 
('lisbon-portugal', 'Lisbon', 'Portugal', 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=800&q=80', '🇵🇹', 'EUR', 'EUR (€)', 'Portuguese', 'WET (GMT+0)', 'Warm hospitality, vibrant cafe culture, hilly cobbled streets.', 'Metro Red/Blue/Green/Yellow lines, vintage trams, and bus network.'),
('prague-czech', 'Prague', 'Czech Republic', 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80', '🇨🇿', 'CZK', 'CZK (Kč)', 'Czech', 'CET (GMT+1)', 'Polite greetings entering shops, 10% tipping, stand right on escalators.', 'Integrated Metro Lines A, B, C & 24h Night Trams.'),
('barcelona-spain', 'Barcelona', 'Spain', 'https://images.unsplash.com/photo-1583422409516-2895a771deda?auto=format&fit=crop&w=800&q=80', '🇪🇸', 'EUR', 'EUR (€)', 'Spanish / Catalan', 'CET (GMT+1)', 'Late dining culture, vibrant pedestrian avenues, courteous shop greetings.', 'TMB Metro, buses, and direct airport Aerobus links.'),
('amsterdam-netherlands', 'Amsterdam', 'Netherlands', 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80', '🇳🇱', 'EUR', 'EUR (€)', 'Dutch', 'CET (GMT+1)', 'Direct communication, world-class cycling etiquette, contactless payments.', 'GVB Trams, Metro, ferries across the IJ, and dedicated cycling paths.'),
('paris-france', 'Paris', 'France', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', '🇫🇷', 'EUR', 'EUR (€)', 'French', 'CET (GMT+1)', 'Always say "Bonjour" when entering shops and "Merci, au revoir" upon leaving.', 'Extensive RATP Metro network, RER commuter trains, and night buses.'),
('rome-italy', 'Rome', 'Italy', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', '🇮🇹', 'EUR', 'EUR (€)', 'Italian', 'CET (GMT+1)', 'Modest dress required for churches (shoulders and knees covered).', 'ATAC Metro Lines A & B, comprehensive bus network, and suburban rail.'),
('vienna-austria', 'Vienna', 'Austria', 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80', '🇦🇹', 'EUR', 'EUR (€)', 'German', 'CET (GMT+1)', 'Traditional coffee house culture, quiet residential evenings.', 'Wiener Linien U-Bahn (U1-U6), Strassenbahn trams, and City Airport Train.'),
('budapest-hungary', 'Budapest', 'Hungary', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80', '🇭🇺', 'HUF', 'HUF (Ft)', 'Hungarian', 'CET (GMT+1)', 'Thermal bath relaxation, scenic Danube river promenades.', 'BKK Metro (M1 historic line, M2, M3, M4), scenic tram line 2, and trolleybuses.'),
('copenhagen-denmark', 'Copenhagen', 'Denmark', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80', '🇩🇰', 'DKK', 'DKK (kr)', 'Danish', 'CET (GMT+1)', 'Hygge lifestyle, high digital payment adoption, exceptional cycling culture.', '24/7 Driverless Metro (M1-M4), S-trains, and Harbour buses.'),
('dublin-ireland', 'Dublin', 'Ireland', 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=800&q=80', '🇮🇪', 'EUR', 'EUR (€)', 'English / Irish', 'GMT (UTC+0)', 'Warm social atmosphere, live traditional music, compact walkable center.', 'Luas Light Rail (Red & Green lines), Dublin Bus, and DART coastal train.'),
('edinburgh-united kingdom', 'Edinburgh', 'United Kingdom', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80', '🇬🇧', 'GBP', 'GBP (£)', 'English', 'GMT (UTC+0)', 'Historic Old Town and Georgian New Town, literary heritage, courteous queuing.', 'Edinburgh Trams connecting airport to Newhaven, and Lothian Buses.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_areas (
    destination_id, area_name, lighting_score, walkability_score, transport_score, crowd_level, crime_level, women_safety_score
) VALUES (
    'prague-czech', 'Old Town & Holešovice', 9.6, 9.8, 9.5, 'Moderate', 'Very Low', 9.7
) ON CONFLICT DO NOTHING;

INSERT INTO public.knowledge_documents (
    destination_id, title, document_type, source, language, content, metadata
) VALUES
('lisbon-portugal', 'Lisbon Solo Traveller Safety Guide', 'safety', 'Official European Tourism & Solo Safety Bureau', 'en', 'Lisbon is a major European tourist destination. Use normal urban precautions, particularly in crowded tourist areas and on busy public transport. Keep phones, wallets and passports secure. For solo evening travel, prefer established transport and routes appropriate to the traveller''s comfort. If uncomfortable, move to a staffed, populated place such as a hotel, transport station, café or major commercial area. Emergency number in Portugal: 112.', '{"category": "safety", "city": "Lisbon", "country": "Portugal"}'::jsonb),
('lisbon-portugal', 'Lisbon Public Transport and Getting Around', 'transport', 'Lisbon Municipal Transport Authority', 'en', 'Lisbon has metro, tram, bus, train and ferry services. Historic trams can be crowded on popular routes, so keep belongings secure. The city has steep hills and uneven or cobbled surfaces; route recommendations should consider terrain, not only distance. Arrival recommendations should consider luggage, time of day, walking tolerance and comfort.', '{"category": "transport", "city": "Lisbon"}'::jsonb),
('lisbon-portugal', 'Lisbon Local Etiquette', 'culture', 'Portuguese Cultural & Heritage Institute', 'en', 'Portuguese is the local language. Be respectful in residential neighbourhoods, cafés, restaurants and historic areas. Avoid excessive noise and blocking doorways. Food recommendations should reflect the traveller''s actual preferences rather than assumptions.', '{"category": "culture", "city": "Lisbon"}'::jsonb),
('lisbon-portugal', 'Lisbon Tourist Scam Awareness', 'scams', 'European Consumer Protection & Safety Registry', 'en', 'Be cautious with unsolicited approaches involving donations, purchases, distractions or unexpected assistance. Use official ticketing and transport channels, keep valuables secure and check prices before accepting services. Scam guidance is risk awareness, not evidence that every person or business is unsafe.', '{"category": "scams", "city": "Lisbon"}'::jsonb),
('prague-czech', 'Prague Solo Traveller Safety Guide', 'safety', 'Czech Ministry of Interior & Tourist Police', 'en', 'Prague is a major tourist destination. Use normal urban precautions, especially in crowded central areas and public transport. Keep phones, wallets and passports secure. At night, consider established transport and well-used routes appropriate to personal comfort. If uncomfortable, move to a staffed, populated location. Emergency number in the Czech Republic: 112.', '{"category": "safety", "city": "Prague"}'::jsonb),
('prague-czech', 'Prague Public Transport and Getting Around', 'transport', 'Prague Integrated Transport (PID)', 'en', 'Prague has metro, tram, bus and rail services. Trams are useful for many central areas. Follow official ticketing rules and use official ticketing channels. Route recommendations should consider walking distance, transfers, luggage and time of day rather than only the shortest route.', '{"category": "transport", "city": "Prague"}'::jsonb),
('prague-czech', 'Prague Local Etiquette', 'culture', 'Prague Tourism & City Guides', 'en', 'Czech is the local language. English is common in tourist areas. Respect residential streets and avoid unnecessary noise. Recommendations involving nightlife or alcohol should never assume the traveller drinks.', '{"category": "culture", "city": "Prague"}'::jsonb),
('prague-czech', 'Prague Tourist Scam Awareness', 'scams', 'Prague Municipal Police Scam Prevention Unit', 'en', 'Travellers should be cautious with unsolicited currency-exchange offers, unexpected assistance and unclear prices. Use official exchange or payment channels and check prices before agreeing to services. Keep valuables secure in crowded tourist areas.', '{"category": "scams", "city": "Prague"}'::jsonb),
('barcelona-spain', 'Barcelona Solo Traveller Safety Guide', 'safety', 'Mossos d’Esquadra & Barcelona Turisme', 'en', 'Barcelona is a large, heavily visited city where petty theft can occur in crowded tourist areas and on public transport. Keep phones, wallets and bags secure and avoid leaving belongings unattended. Evening recommendations should consider route, transport and personal comfort. Emergency number in Spain: 112.', '{"category": "safety", "city": "Barcelona"}'::jsonb),
('barcelona-spain', 'Barcelona Public Transport', 'transport', 'Transports Metropolitans de Barcelona (TMB)', 'en', 'Barcelona has metro, bus, tram and rail services. Public transport can efficiently connect central neighbourhoods. Recommendations should consider crowding, transfers, walking distance, luggage and time of day. The geographically shortest route is not always the most comfortable.', '{"category": "transport", "city": "Barcelona"}'::jsonb),
('amsterdam-netherlands', 'Amsterdam Solo Traveller Safety Guide', 'safety', 'Amsterdam Police & Netherlands Tourist Board', 'en', 'Amsterdam is a busy tourist city. Use normal precautions against petty theft and pay close attention around cycle lanes. Visitors unfamiliar with cycling infrastructure should be particularly careful when crossing roads and cycle paths. Evening recommendations should reflect personal comfort. Emergency number in the Netherlands: 112.', '{"category": "safety", "city": "Amsterdam"}'::jsonb),
('amsterdam-netherlands', 'Amsterdam Getting Around', 'transport', 'GVB Amsterdam Urban Transit', 'en', 'Amsterdam has trains, trams, buses, metro and extensive cycling infrastructure. Do not assume cycling is the best option for every traveller. Consider walking ability, luggage, weather and familiarity with cycle traffic when recommending routes.', '{"category": "transport", "city": "Amsterdam"}'::jsonb),
('paris-france', 'Paris Solo Traveller Safety Guide', 'safety', 'Prefecture de Police Paris & Atout France', 'en', 'Paris is a large tourist city where normal urban precautions are appropriate, particularly around crowded attractions and public transport. Keep valuables secure. Evening route recommendations should consider lighting, activity levels, transport and personal comfort rather than relying on one city-wide safety label. Emergency number in France: 112.', '{"category": "safety", "city": "Paris"}'::jsonb),
('paris-france', 'Paris Public Transport', 'transport', 'RATP Paris Transport Authority', 'en', 'Paris has metro, RER, train, bus and tram services. Public transport can reduce long walks. Recommendations should account for transfers, stairs, luggage and accessibility. Use official ticketing information for current fares and rules.', '{"category": "transport", "city": "Paris"}'::jsonb),
('rome-italy', 'Rome Solo Traveller Safety Guide', 'safety', 'Polizia di Stato & Rome Tourism Office', 'en', 'Rome is a major tourist destination with busy historic areas and public transport. Use normal precautions against petty theft, especially in crowded areas. Keep passports and valuables secure and avoid leaving bags unattended. Evening recommendations should consider route and personal comfort. Emergency number in Italy: 112.', '{"category": "safety", "city": "Rome"}'::jsonb),
('rome-italy', 'Rome Local Etiquette', 'culture', 'Ministero della Cultura & Rome Heritage Guide', 'en', 'Italian is the local language. Visitors should respect religious sites and posted dress and behaviour requirements. Historic areas can involve uneven paving and substantial walking, so recommendations should consider footwear, weather, mobility and rest needs.', '{"category": "culture", "city": "Rome"}'::jsonb),
('vienna-austria', 'Vienna Solo Traveller Safety Guide', 'safety', 'Vienna Tourist Board & Austrian Police', 'en', 'Vienna has many well-used central areas and extensive public transport. Solo travellers should still use normal precautions against theft and keep valuables secure in crowded places. Evening recommendations should consider time, transport and personal comfort. Emergency number in Austria: 112.', '{"category": "safety", "city": "Vienna"}'::jsonb),
('vienna-austria', 'Vienna Public Transport', 'transport', 'Wiener Linien Transport', 'en', 'Vienna has metro, tram, bus and rail services. Public transport can reduce unnecessary walking. Consider walking distance, transfers, luggage, weather and accessibility. Use official transport information for current journey details.', '{"category": "transport", "city": "Vienna"}'::jsonb),
('budapest-hungary', 'Budapest Solo Traveller Safety Guide', 'safety', 'Budapest Police & Hungarian Tourism Agency', 'en', 'Budapest is a major tourist destination. Use normal urban precautions, especially in crowded areas and nightlife districts. Keep valuables secure and verify prices before accepting services. Evening recommendations should consider transport and personal comfort. Emergency number in Hungary: 112.', '{"category": "safety", "city": "Budapest"}'::jsonb),
('budapest-hungary', 'Budapest Local Etiquette', 'culture', 'Budapest Thermal Baths & Culture Board', 'en', 'Hungarian is the local language. Respect residential areas and local rules. Budapest has a strong thermal-bath culture, but current opening hours, prices and booking requirements should come from current official sources rather than static knowledge.', '{"category": "culture", "city": "Budapest"}'::jsonb),
('copenhagen-denmark', 'Copenhagen Solo Traveller Safety Guide', 'safety', 'Copenhagen Police & VisitDenmark', 'en', 'Copenhagen has extensive cycling infrastructure and public transport. Use normal precautions against petty theft and pay close attention around cycle lanes. Recommendations should consider weather, daylight, walking and cycling comfort. Emergency number in Denmark: 112.', '{"category": "safety", "city": "Copenhagen"}'::jsonb),
('dublin-ireland', 'Dublin Solo Traveller Safety Guide', 'safety', 'An Garda Síochána & Fáilte Ireland', 'en', 'Dublin has busy central areas and an active evening economy. Use normal urban precautions, keep valuables secure and choose evening routes and transport appropriate to personal comfort. Avoid blanket claims about entire neighbourhoods; check current local information when safety is material. Emergency numbers in Ireland: 112 or 999.', '{"category": "safety", "city": "Dublin"}'::jsonb),
('edinburgh-united kingdom', 'Edinburgh Solo Traveller Safety Guide', 'safety', 'Police Scotland & VisitScotland', 'en', 'Edinburgh has a compact historic centre and substantial pedestrian activity. Use normal urban precautions and take care on steep streets, uneven historic surfaces and during poor weather. Evening route recommendations should consider lighting, activity, transport and personal comfort. Emergency numbers in the UK: 999 or 112.', '{"category": "safety", "city": "Edinburgh"}'::jsonb)
ON CONFLICT DO NOTHING;
