/**
 * Sakhi AI Context Builder & Orchestration Layer
 * 
 * ENFORCES STRICT DATA FLOW SCOPING:
 * User -> AI Companion UI -> Context Builder -> Application Services -> Supabase + APIs + RAG -> LLM -> Response
 * 
 * The LLM NEVER accesses the database directly!
 * The Context Builder retrieves structured data from Supabase via Application Services,
 * combines it with live API data (Open-Meteo weather) and RAG vector search results,
 * and formats a clean structured context payload for the LLM.
 */

import { ProfileService, DestinationService, TravelPackService } from './appServices.js';
import { recommendationService } from './recommendationService.js';
import { fetchLiveWeather } from './apiService.js';

class AIContextBuilder {
  /**
   * Builds context payload for LLM AI Companion
   */
  async buildLLMContext({
    userPrompt,
    travellerProfile,
    tripConfig,
    destinationData,
    currentStage = 'before-trip'
  }) {
    const userId = travellerProfile?.id;
    const destId = destinationData?.id || tripConfig?.destId;
    const cityName = destinationData?.cityName || 'your destination';
    const country = destinationData?.country || '';

    // 1. Retrieve user profile & traveller_memory learned preferences from Supabase (via Application Services)
    const fetchedProfile = userId ? await ProfileService.getProfile(userId) : null;
    const profile = fetchedProfile || travellerProfile || {};
    const travellerName = profile?.fullName || profile?.name || travellerProfile?.name || 'Explorer';
    const firstName = travellerName.split(' ')[0];
    const homeCountry = profile?.homeCountry || travellerProfile?.homeCountry || 'your home country';

    // 2. Fetch destination & neighbourhood safety micro metrics (destination_areas)
    const destAreas = destId ? await DestinationService.getDestinationAreas(destId) : [];
    const primaryArea = destAreas.length > 0 ? destAreas[0] : null;

    // 3. Calculate dynamic composite safety score
    const compositeSafetyScore = destinationData ? recommendationService.computeCompositeSafetyScore(primaryArea || destinationData) : '9.6';

    // 4. Fetch live weather via External API (Open-Meteo)
    let liveWeatherText = destinationData ? '22°C (Clear)' : 'N/A';
    if (destinationData?.cityName) {
      try {
        const weatherData = await fetchLiveWeather(destinationData.cityName);
        if (weatherData && weatherData.temp) {
          liveWeatherText = `${weatherData.temp} (${weatherData.condition})`;
        }
      } catch (e) {
        console.warn('[AI Context Builder] Weather API fallback:', e);
      }
    }

    // 5. Fetch RAG Knowledge & User Memories from Recommendation Service
    const placesToVisit = profile?.placesToVisit || travellerProfile?.placesToVisit || '';
    const preferredTransport = profile?.preferredTransport || travellerProfile?.preferredTransport || profile?.transportPref || travellerProfile?.transportPref || '';
    const tripEnergyMotivation = profile?.tripEnergyMotivation || travellerProfile?.tripEnergyMotivation || profile?.adventureVibe || travellerProfile?.adventureVibe || '';

    const { userMemories, RAGKnowledge } = recommendationService.assembleLLMContext({
      travellerProfile: { ...profile, homeCountry, placesToVisit, preferredTransport, tripEnergyMotivation },
      tripConfig,
      destinationData,
      currentStage
    });

    // 6. Construct Stage Guardrail Directives
    let stageGuardrail = '';
    if (currentStage === 'before-trip') {
      stageGuardrail = `STAGE: BEFORE TRIP (PREPARATION & PLANNING AT HOME).
GUARDRAIL RULE: ${firstName} is currently AT HOME in ${homeCountry} preparing for her upcoming trip to ${cityName}. She has NOT arrived in ${cityName} yet. Do NOT speak as if she is currently walking around ${cityName} today!`;
    } else if (currentStage === 'arrival') {
      stageGuardrail = `STAGE: ARRIVAL MODE (AIRPORT & HOTEL CORRIDOR).
GUARDRAIL RULE: ${firstName} HAS JUST LANDED at ${cityName} Airport. Help her with airport transfer and hotel keycard entry.`;
    } else if (currentStage === 'solo-days') {
      stageGuardrail = `STAGE: SOLO DAYS (ACTIVE EXPLORATION IN ${cityName}).
GUARDRAIL RULE: ${firstName} IS CURRENTLY IN ${cityName} actively exploring. Focus on 5-day itineraries, cozy cafes, and nighttime walking safety.`;
    } else {
      stageGuardrail = `STAGE: GOODBYE MODE (DEPARTURE & REFLECTION).
GUARDRAIL RULE: ${firstName} is completing her trip to ${cityName} and preparing to return home to ${homeCountry}. Focus on airport departure timing and trip reflection.`;
    }

    // Return structured payload ready for LLM
    return {
      firstName,
      cityName,
      country,
      liveWeatherText,
      compositeSafetyScore,
      userMemories,
      RAGKnowledge,
      placesToVisit,
      preferredTransport,
      tripEnergyMotivation,
      stageGuardrail,
      systemInstructionText: `You are Sakhi, an empathetic, knowledgeable AI travel companion for solo female travellers.
${stageGuardrail}

STRUCTURED CONTEXT (Provided by AI Context Builder):
- Traveller Name: ${firstName}
- Home Country: ${homeCountry}
- Target Destination: ${cityName}${country ? `, ${country}` : ''} (Dynamic Safety Index: ${compositeSafetyScore}/10)
- Current Weather (Live API): ${liveWeatherText}
- Booked Stay: ${tripConfig?.bookedStayName || 'Not Booked Yet (Vetted Female Stays Available)'}
- Stated Places of Interest: ${placesToVisit || 'Not specified (flexible)'}
- Preferred Transport: ${preferredTransport || 'Public transit & safe walking'}
- Trip Energy & Motivation: ${tripEnergyMotivation || 'Balanced exploration'}
- Learned Preferences (traveller_memory): ${userMemories}
- RAG Knowledge Documents (knowledge_documents): ${RAGKnowledge}

GUIDANCE: Tailor your suggestions to match ${firstName}'s desired places (${placesToVisit || 'curated sights'}), transit preferences (${preferredTransport || 'walkable/metro'}), and energy level (${tripEnergyMotivation || 'balanced'}).

Respond directly to ${firstName} in a warm, conversational tone. Answer her question in 2-3 clean sentences.`
    };
  }
}

export const aiContextBuilder = new AIContextBuilder();
