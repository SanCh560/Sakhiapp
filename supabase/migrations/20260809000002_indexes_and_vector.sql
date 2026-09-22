-- ====================================================================
-- SUPABASE MIGRATION 000002: PERFORMANCE B-TREE INDEXES & PGVECTOR
-- File: supabase/migrations/20260809000002_indexes_and_vector.sql
-- ====================================================================

-- 1. FOREIGN KEY B-TREE PERFORMANCE INDEXES
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

-- 2. PGVECTOR COSINE SIMILARITY INDEX (FAST SEMANTIC RAG SEARCH)
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_embedding 
ON public.knowledge_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
