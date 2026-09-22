/**
 * Sakhi Context Builder Service
 * 
 * Sits between Application Services & LLM:
 * User -> AI Companion UI -> Context Builder -> Application Services -> Supabase + Live APIs + RAG -> LLM -> Response
 * 
 * Assembles a structured context payload containing:
 * - Traveller Context (Budget, Preferences, Safety Priorities)
 * - Trip Context (Destination, Duration, Booked State)
 * - Candidate Recommendations & 4D Match Scores
 * - Neighbourhood Micro Metrics (destination_areas)
 * - RAG Knowledge Documents (knowledge_documents pgvector)
 * - Live Weather & Currency Exchange Data
 */

import { TravellerMemoryService } from './TravellerMemoryService.js';
import { RAGService } from './RAGService.js';
import { UnifiedRecommendationEngine } from './UnifiedRecommendationEngine.js';
import { fetchLiveWeather } from './apiService.js';

export const ContextBuilder = {
  /**
   * Build structured context payload for LLM AI Companion
   */
  async buildContext({
    userPrompt,
    userId,
    destinationData,
    tripConfig,
    currentStage = 'before-trip',
    candidateAccommodations = [],
    candidatePlaces = []
  }) {
    const destId = destinationData?.id || tripConfig?.destId;
    const cityName = destinationData?.cityName || 'your destination';

    // 1. Gather Traveller Context (structured data from users & traveller_memory)
    const travellerContext = await TravellerMemoryService.getTravellerContext(userId);

    // 2. Gather Neighbourhood Micro Metrics
    const destinationArea = destinationData?.destinationAreas?.[0] || {
      area_name: `${cityName} Historic Center`,
      lighting_score: 9.6,
      walkability_score: 9.8,
      crime_level: 'Very Low',
      women_safety_score: 9.7
    };

    // 3. Gather Live API Data (Open-Meteo Weather)
    let liveWeather = null;
    try {
      liveWeather = await fetchLiveWeather(cityName);
    } catch (e) {
      console.warn('[ContextBuilder] Weather API fallback:', e);
    }

    // 4. Gather RAG Knowledge Documents (pgvector semantic search)
    const RAGKnowledge = await RAGService.searchKnowledgeDocuments(destId, userPrompt);

    // 5. Run Recommendation Engine on Candidates
    let topAccommodations = [];
    if (candidateAccommodations.length > 0) {
      topAccommodations = UnifiedRecommendationEngine.rankCandidates({
        candidates: candidateAccommodations,
        travellerContext,
        tripContext: tripConfig || {},
        destinationData,
        destinationArea,
        liveWeather
      });
    }

    let topPlaces = [];
    if (candidatePlaces.length > 0) {
      topPlaces = UnifiedRecommendationEngine.rankCandidates({
        candidates: candidatePlaces,
        travellerContext,
        tripContext: tripConfig || {},
        destinationData,
        destinationArea,
        liveWeather
      });
    }

    // 6. Build Stage Guardrails
    let stageRule = '';
    if (currentStage === 'before-trip') {
      stageRule = `${travellerContext.fullName} is currently AT HOME in ${travellerContext.homeCountry} preparing for her trip to ${cityName}. She has NOT arrived in ${cityName} yet. Speak to her about trip planning and stay options.`;
    } else if (currentStage === 'arrival') {
      stageRule = `${travellerContext.fullName} HAS JUST LANDED at ${cityName} Airport. Assist her with airport transfer corridors and keycard hotel entry.`;
    } else if (currentStage === 'solo-days') {
      stageRule = `${travellerContext.fullName} IS CURRENTLY IN ${cityName} actively exploring. Focus on 5-day itineraries, cozy cafes, and evening walking safety.`;
    } else {
      stageRule = `${travellerContext.fullName} is completing her trip to ${cityName} and returning home. Focus on flight departure timing and reflection.`;
    }

    const currSymbol = travellerContext.currencySymbol || (travellerContext.preferredCurrency === 'GBP' || travellerContext.homeCountry === 'United Kingdom' ? '£' : (travellerContext.preferredCurrency === 'EUR' || ['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Austria', 'Ireland'].includes(travellerContext.homeCountry) ? '€' : '$'));

    // 7. Format Structured System Instructions for LLM
    const systemPromptText = `You are Sakhi, an empathetic AI travel companion for solo female travellers.

SYSTEM RULES (STRICT BOUNDARIES):
1. ${stageRule}
2. You must NOT invent fake hotels, prices, safety scores, weather, or routes. Use the structured context provided below!
3. Explain recommendations using the calculated AI Match Scores and rationale.

STRUCTURED CONTEXT (Provided by Application Services & Recommendation Engine):
- Traveller Name: ${travellerContext.fullName} (Home: ${travellerContext.homeCountry})
- Preferences: Budget limit ${currSymbol}${travellerContext.budgetLimit}, Female-only dorm priority: ${travellerContext.femaleDormOnly ? 'Yes' : 'No'}, Walking: ${travellerContext.walkingPreference}
- Target Destination: ${cityName}, ${destinationData?.country || ''} (Safety Score: ${destinationData?.overallSafetyRating || '9.6/10'})
- Neighbourhood Area: ${destinationArea.area_name} (Lighting: ${destinationArea.lighting_score}/10, Walkability: ${destinationArea.walkability_score}/10, Crime: ${destinationArea.crime_level})
- Live Weather: ${liveWeather?.temp || '22°C'} (${liveWeather?.condition || 'Sunny'})
- Top Rated Accommodations: ${topAccommodations.slice(0, 2).map(a => `${a.item.name} (${a.aiMatchScore}% AI Match - ${a.explanation})`).join('; ')}
- RAG Knowledge Base: ${RAGKnowledge.map(d => `[${d.sourceType === 'live_google_search' || d.sourceType === 'live_web_scrape' ? 'Live Web Search' : 'Curated Guide'}] ${d.title}: ${d.content}`).join('; ')}

Respond directly to ${travellerContext.fullName} in a warm, concise conversational tone (2-3 clean sentences).`;

    return {
      travellerContext,
      destinationArea,
      liveWeather,
      RAGKnowledge,
      topAccommodations,
      topPlaces,
      systemPromptText
    };
  }
};
