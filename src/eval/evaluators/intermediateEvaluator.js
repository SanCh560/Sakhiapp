/**
 * Sakhi AI Evaluation Framework: Intermediate System Behaviour Evaluator (A)
 * 
 * Assesses internal system state, data flow scoping, algorithms, and services:
 * - Context Builder payload assembly & Stage Guardrail enforcement
 * - 4D Recommendation Engine scoring metrics & sorting
 * - RAG semantic retrieval precision & cross-city isolation
 * - Traveller Memory preference extraction & persistence
 * - Adaptive Itinerary generator scaling (1 to N days)
 * - Offline cache readiness & mutation queueing
 * - Emergency routing & local dispatch contact resolution
 */

import { aiContextBuilder } from '../../services/aiContextBuilder.js';
import { scoreRecommendationList } from '../../engine/recommendationEngine.js';
import { RAGService } from '../../services/RAGService.js';
import { TravellerMemoryService } from '../../services/TravellerMemoryService.js';
import { generateDynamicItinerary } from '../../services/itineraryGeneratorService.js';
import { syncService } from '../../services/syncService.js';
import { getDestinationData } from '../../data/tripData.js';
import { db } from '../../db/databaseManager.js';

export async function evaluateIntermediateBehaviour(testCase) {
  const result = {
    testId: testCase.id,
    category: testCase.category,
    passed: true,
    score: 100,
    failures: [],
    details: {}
  };

  const { id, travellerContext, tripContext, expectedRetrieval, expectedRecommendation } = testCase;
  const destinationData = tripContext.destId ? getDestinationData(tripContext.destId) : null;

  try {
    // -----------------------------------------------------------------------
    // Dimension 1 & 7: Context Builder & Stage Guardrail Checks
    // -----------------------------------------------------------------------
    if (id === 'eval-01-personalisation' || id === 'eval-07-context-awareness' || id === 'eval-02-safety') {
      const context = await aiContextBuilder.buildLLMContext({
        userPrompt: testCase.input,
        travellerProfile: travellerContext,
        tripConfig: tripContext.tripConfig,
        destinationData,
        currentStage: tripContext.activeStage
      });

      result.details.contextPayload = {
        firstName: context.firstName,
        stageGuardrail: context.stageGuardrail,
        placesToVisit: context.placesToVisit,
        preferredTransport: context.preferredTransport,
        tripEnergyMotivation: context.tripEnergyMotivation
      };

      // Check home country and personal preference injection
      if (id === 'eval-01-personalisation') {
        if (!context.systemInstructionText.includes(travellerContext.homeCountry)) {
          result.failures.push(`Context builder failed to inject homeCountry '${travellerContext.homeCountry}'`);
        }
        if (!context.systemInstructionText.includes('bookshop') && !context.systemInstructionText.includes('tea garden')) {
          result.failures.push('Context builder failed to inject natural language preferences into system prompt');
        }
      }

      // Check stage guardrail
      if (id === 'eval-07-context-awareness') {
        if (!context.stageGuardrail.includes('BEFORE TRIP') || !context.stageGuardrail.includes('AT HOME')) {
          result.failures.push(`Stage guardrail failed to assert that traveller is AT HOME in ${travellerContext.homeCountry}`);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 3 & 4: Recommendation Engine & 4D Scoring
    // -----------------------------------------------------------------------
    if (id === 'eval-03-ranking' || id === 'eval-04-match-scores' || id === 'eval-12-explainability') {
      const accommodations = destinationData?.accommodations || [];
      const scored = scoreRecommendationList(
        accommodations,
        travellerContext,
        tripContext.tripConfig,
        destinationData
      );

      result.details.scoredCount = scored.length;
      result.details.topItem = scored[0]?.item?.name;
      result.details.topScores = scored[0]?.matchScore;

      if (scored.length === 0) {
        result.failures.push('Recommendation engine returned 0 scored items');
      } else {
        // Validate 4D score integrity
        const top = scored[0];
        const scores = top.matchScore;
        if (!scores || typeof scores.overall !== 'number' || isNaN(scores.overall)) {
          result.failures.push('Overall match score is invalid or NaN');
        }
        if (typeof scores.safety !== 'number' || typeof scores.personalFit !== 'number' ||
            typeof scores.comfort !== 'number' || typeof scores.convenience !== 'number') {
          result.failures.push('4D sub-scores (safety, personalFit, comfort, convenience) are incomplete');
        }

        // Validate sorting order
        for (let i = 0; i < scored.length - 1; i++) {
          if (scored[i].matchScore.overall < scored[i + 1].matchScore.overall) {
            result.failures.push(`Items are not sorted descending by overall match score (index ${i} < ${i + 1})`);
            break;
          }
        }

        // Validate ranking constraint (budget & female dorm priority)
        if (id === 'eval-03-ranking') {
          const topItem = scored[0].item;
          const isFemaleHostel = (topItem.type || '').toLowerCase().includes('hostel') ||
                                (topItem.name || '').toLowerCase().includes('capsule') ||
                                (topItem.name || '').toLowerCase().includes('female');
          if (!isFemaleHostel && topItem.priceValue > 80) {
            result.failures.push(`Top ranked stay '${topItem.name}' ($${topItem.priceValue}) exceeds budget ceiling for budget solo traveller`);
          }
        }

        // Validate explainability fields
        if (id === 'eval-12-explainability') {
          if (!top.whyChosen || top.whyChosen.length < 10) {
            result.failures.push("Scored recommendation missing transparent 'whyChosen' rationale");
          }
          if (!Array.isArray(top.safetyHighlights) || top.safetyHighlights.length === 0) {
            result.failures.push("Scored recommendation missing 'safetyHighlights' array");
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 5 & 6: RAG Semantic Retrieval & Groundedness
    // -----------------------------------------------------------------------
    if (id === 'eval-05-rag-retrieval' || id === 'eval-06-groundedness') {
      const retrievedDocs = await RAGService.searchKnowledgeDocuments(
        tripContext.destId,
        testCase.input
      );

      result.details.retrievedDocsCount = retrievedDocs.length;
      result.details.docTitles = retrievedDocs.map(d => d.title);

      if (retrievedDocs.length === 0) {
        result.failures.push(`RAG retrieval returned 0 knowledge documents for ${tripContext.destId}`);
      }

      // Check cross-city leakage in RAG docs
      if (id === 'eval-05-rag-retrieval' || id === 'eval-06-groundedness') {
        const hasPragueLeak = retrievedDocs.some(d =>
          (d.content || '').includes('Clementinum') ||
          (d.title || '').includes('Prague') ||
          (d.city || '').toLowerCase() === 'prague'
        );
        if (tripContext.destId === 'tokyo-global' && hasPragueLeak) {
          result.failures.push("RAG retrieval leaked Prague Clementinum knowledge documents into Tokyo context");
        }
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 8: Traveller Memory Multi-Turn Learning
    // -----------------------------------------------------------------------
    if (id === 'eval-08-traveller-memory') {
      // Test automated preference extraction from user message
      TravellerMemoryService.extractAndLearnFromMessage(testCase.input);
      const learnedMemories = TravellerMemoryService.getAllMemories();

      result.details.learnedMemories = learnedMemories;
      const hasBudgetMemory = learnedMemories.some(m => 
        m.preference_key === 'preferred_budget_limit' && m.preference_value.includes('80')
      );
      const hasAtmosphere = learnedMemories.some(m => 
        m.preference_key === 'atmosphere_preference' && m.preference_value.includes('Quiet')
      );
      const hasFemalePriority = learnedMemories.some(m => 
        m.preference_key === 'female_only_priority' || m.preference_key === 'stay_style'
      );

      if (!hasBudgetMemory) {
        result.failures.push("TravellerMemoryService failed to extract budget limit ($80) from user message");
      }
      if (!hasAtmosphere) {
        result.failures.push("TravellerMemoryService failed to extract quiet atmosphere preference from user message");
      }
      if (!hasFemalePriority) {
        result.failures.push("TravellerMemoryService failed to extract female-only priority from user message");
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 9: Adaptive Itinerary 1-to-N Scaling & Calibration
    // -----------------------------------------------------------------------
    if (id === 'eval-09-adaptive-itinerary') {
      const itinerary = generateDynamicItinerary(
        destinationData,
        travellerContext,
        tripContext.tripConfig
      );

      result.details.itineraryDaysCount = itinerary.length;
      result.details.day1Title = itinerary[0]?.title;
      result.details.finalDayTitle = itinerary[itinerary.length - 1]?.title;

      if (itinerary.length !== 3) {
        result.failures.push(`Adaptive itinerary expected exactly 3 days, got ${itinerary.length}`);
      }

      // Check Day 1 check-in reflects actualStayName
      const day1Items = itinerary[0]?.items || [];
      const day1Checkin = day1Items.find(i => i.title.includes('Check-in'));
      if (!day1Checkin || !day1Checkin.title.includes('Sakura Female Sanctuary Pods')) {
        result.failures.push(`Day 1 check-in does not reflect booked stay 'Sakura Female Sanctuary Pods' (got "${day1Checkin?.title}")`);
      }

      // Check Day 3 departure reflects confirmed flight
      const day3Items = itinerary[2]?.items || [];
      const hasFlight = day3Items.some(i => (i.title && i.title.includes('IB 6801')) || (i.notes && i.notes.includes('IB 6801')));
      if (!hasFlight) {
        result.failures.push("Day 3 final day itinerary failed to calibrate to departure flight 'IB 6801'");
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 11: Offline Behaviour & Sync Queue
    // -----------------------------------------------------------------------
    if (id === 'eval-11-offline-behaviour') {
      const travelPackResult = await syncService.getTravelPack('trip-flo-offline-1');
      result.details.isOffline = travelPackResult.isOffline;
      result.details.hasOfflineData = !!travelPackResult.data;

      if (!travelPackResult.data) {
        result.failures.push('Offline travel pack retrieval returned null in offline mode');
      }

      // Queue an offline mutation
      syncService.queueMutation('trips', 'update', { id: 'trip-flo-offline-1', status: 'offline-saved' });
      const queue = syncService.getPendingQueue();
      const hasQueued = queue.some(item => item.tableName === 'trips' && item.record.id === 'trip-flo-offline-1');
      if (!hasQueued) {
        result.failures.push('SyncService failed to queue offline mutation into pending sync queue');
      }
    }

    // -----------------------------------------------------------------------
    // Dimension 10 & 13: Emergency & Arrival Routing
    // -----------------------------------------------------------------------
    if (id === 'eval-13-emergency') {
      const emergencyContacts = destinationData?.emergencyContacts || [];
      result.details.emergencyContacts = emergencyContacts;
      const has112 = emergencyContacts.some(c => c.number === '112' || c.number.includes('112'));
      if (!has112 && destinationData?.country === 'Italy') {
        result.failures.push("Emergency contacts for Italy destination missing emergency number 112");
      }
    }
  } catch (err) {
    result.failures.push(`Intermediate evaluation uncaught exception: ${err.message}`);
  }

  if (result.failures.length > 0) {
    result.passed = false;
    result.score = Math.max(0, 100 - result.failures.length * 35);
  }

  return result;
}
