-- ====================================================================
-- SUPABASE MIGRATION 000003: ROW LEVEL SECURITY (RLS) POLICIES
-- File: supabase/migrations/20260809000003_row_level_security.sql
-- ====================================================================

-- 1. ENABLE ROW LEVEL SECURITY
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

-- 2. OWNER ACCESS POLICIES
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

-- 3. PUBLIC CATALOGUE ACCESS POLICIES
CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read destination_areas" ON public.destination_areas FOR SELECT USING (true);
CREATE POLICY "Public read accommodations" ON public.accommodations FOR SELECT USING (true);
CREATE POLICY "Public read places_of_interest" ON public.places_of_interest FOR SELECT USING (true);
CREATE POLICY "Public read knowledge_documents" ON public.knowledge_documents FOR SELECT USING (true);
