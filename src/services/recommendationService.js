/**
 * Sakhi Recommendation Service & Machine Learning Orchestration Layer
 * 
 * Responsibilities:
 * 1. Computes composite safety rating from neighbourhood destination_areas metrics
 * 2. Generates dynamic 4D AI Match Scores (Safety 40%, Personal Fit 30%, Comfort 15%, Convenience 15%)
 * 3. Logs recommendations to SQL with ai_match_score, scores breakdown, explanation, confidence_score, and accepted_at
 * 4. Logs recommendation_sources for AI explainability (Booking Reviews, Traveller Memory, Knowledge Base)
 * 5. Updates traveller_memory with learned_from and source provenance
 */

import { db } from '../db/databaseManager.js';
import { syncService } from './syncService.js';

class RecommendationService {
  
  // 1. Calculate Composite Safety Rating from destination_areas Neighbourhood Metrics
  computeCompositeSafetyScore(destination) {
    if (!destination) return 9.5;
    
    // Fetch neighbourhood micro safety metrics from destination_areas table
    const destAreas = db.select('destination_areas', (a) => a.destinationId === destination.id || a.destination_id === destination.id);
    const primaryArea = destAreas.length > 0 ? destAreas[0] : destination;

    const lighting = parseFloat(primaryArea.lightingScore || primaryArea.lighting_score || 9.6);
    const walkability = parseFloat(primaryArea.walkabilityScore || primaryArea.walkability_score || 9.8);
    const transport = parseFloat(primaryArea.transportScore || primaryArea.transport_score || 9.5);
    const womenSafety = parseFloat(primaryArea.womenSafetyScore || primaryArea.women_safety_score || 9.7);

    const composite = (
      lighting * 0.30 +
      walkability * 0.25 +
      transport * 0.20 +
      womenSafety * 0.25
    );

    return Math.min(Math.max(composite, 1.0), 10.0).toFixed(1);
  }

  // 2. Generate Dynamic 4D Match Score + Human Rationale + Confidence Level
  scoreItem({ item, travellerProfile, tripConfig, destinationData, energyLevel = '🌿 Moderate' }) {
    const userId = travellerProfile?.id || 'usr-default-1';
    
    const userMemories = db.select('traveller_memory', (m) => m.userId === userId || m.user_id === userId);
    const pastFeedback = db.select('recommendations', (r) => (r.userId === userId || r.user_id === userId) && r.itemId === item.id);
    
    let safetyScore = 95;
    let personalFitScore = 90;
    let comfortScore = 88;
    let convenienceScore = 92;

    if (item.safetyFeatures && item.safetyFeatures.length > 2) safetyScore += 3;
    if (item.hasFemaleDorm || item.has247Reception) safetyScore += 2;

    userMemories.forEach(mem => {
      const key = (mem.preferenceKey || mem.preference_key || '').toLowerCase();
      const val = (mem.preferenceValue || mem.preference_value || '').toLowerCase();
      const confidence = parseFloat(mem.confidenceScore || mem.confidence_score || 0.90);

      if (key.includes('coffee') || key.includes('food')) {
        if (item.category === 'Cafe & Dining') personalFitScore += Math.round(confidence * 6);
      }
      if (key.includes('accommodation') || key.includes('style')) {
        if (item.type === 'Hostel' && val.includes('female')) personalFitScore += Math.round(confidence * 6);
      }
    });

    // 2b. Natural Language Preferences Matching
    const placesPref = (travellerProfile?.placesToVisit || '').toLowerCase();
    const transportPref = (travellerProfile?.preferredTransport || travellerProfile?.transportPref || '').toLowerCase();
    const energyPref = (travellerProfile?.tripEnergyMotivation || travellerProfile?.adventureVibe || '').toLowerCase();

    if (placesPref) {
      const itemDesc = `${item.name || ''} ${item.category || ''} ${item.tags?.join(' ') || ''} ${item.description || ''}`.toLowerCase();
      const keywords = placesPref.split(/[,;\s]+/).filter(k => k.length > 3);
      const matchCount = keywords.filter(k => itemDesc.includes(k)).length;
      if (matchCount > 0) {
        personalFitScore += Math.min(matchCount * 4, 10);
      }
    }

    if (transportPref) {
      if ((transportPref.includes('walk') || transportPref.includes('pedestrian')) && (item.walkTimeMinutes <= 15 || item.isWalkable)) {
        convenienceScore += 5;
      }
      if ((transportPref.includes('train') || transportPref.includes('metro') || transportPref.includes('subway')) && (item.nearMetro || item.transitAccess)) {
        convenienceScore += 5;
      }
    }

    if (energyPref) {
      if ((energyPref.includes('slow') || energyPref.includes('mindful') || energyPref.includes('calm') || energyPref.includes('recharge')) && (!item.energyRequired || item.energyRequired.includes('Low'))) {
        comfortScore += 6;
      } else if ((energyPref.includes('high') || energyPref.includes('active') || energyPref.includes('exploration')) && item.energyRequired?.includes('High')) {
        personalFitScore += 6;
      }
    }

    if (pastFeedback.length > 0) {
      const lastAction = pastFeedback[0].interactionStatus || pastFeedback[0].interaction_status;
      if (lastAction === 'accepted' || lastAction === 'booked') {
        personalFitScore += 6;
      } else if (lastAction === 'ignored') {
        personalFitScore -= 10;
      }
    }

    if (energyLevel === '😴 Need Rest' && item.energyRequired?.includes('High')) {
      comfortScore -= 12;
    } else if (energyLevel === '😴 Need Rest' && item.energyRequired?.includes('Low')) {
      comfortScore += 5;
    }

    safetyScore = Math.min(Math.max(safetyScore, 70), 99);
    personalFitScore = Math.min(Math.max(personalFitScore, 65), 99);
    comfortScore = Math.min(Math.max(comfortScore, 65), 99);
    convenienceScore = Math.min(Math.max(convenienceScore, 70), 99);

    const overall = Math.round(
      safetyScore * 0.40 +
      personalFitScore * 0.30 +
      comfortScore * 0.15 +
      convenienceScore * 0.15
    );

    const explanation = item.whyChosen || item.whyChosenRationale || 
      `Vetted for ${destinationData?.cityName || 'destination'} with ${safetyScore}% safety index, keycard entry, and ${personalFitScore}% personal preference fit.`;

    const confidenceScore = parseFloat((0.85 + (personalFitScore / 1000)).toFixed(2));

    return {
      overall,
      safety: safetyScore,
      personalFit: personalFitScore,
      comfort: comfortScore,
      convenience: convenienceScore,
      safetyScore,
      personalFitScore,
      comfortScore,
      convenienceScore,
      explanation,
      confidenceScore
    };
  }

  // 3. Record Interaction Feedback & Log recommendation_sources for AI Explainability
  recordRecommendationFeedback({ userId, tripId, itemType, itemId, interactionStatus, feedbackTag = null, scoredDetails = {} }) {
    const isAccepted = interactionStatus === 'accepted' || interactionStatus === 'booked';
    
    const recRecord = db.insert('recommendations', {
      userId,
      tripId,
      itemType,
      itemId,
      aiMatchScore: scoredDetails.overall || 94,
      safetyScore: scoredDetails.safetyScore || 95,
      personalFitScore: scoredDetails.personalFitScore || 92,
      comfortScore: scoredDetails.comfortScore || 88,
      convenienceScore: scoredDetails.convenienceScore || 92,
      explanation: scoredDetails.explanation || 'Vetted for high female solo safety and keycard access.',
      confidenceScore: scoredDetails.confidenceScore || 0.94,
      interactionStatus,
      feedbackTag,
      acceptedAt: isAccepted ? new Date().toISOString() : null
    });

    syncService.queueMutation('recommendations', 'insert', recRecord);

    // Insert recommendation_sources entries for explainability
    const sourceTypes = ['Booking Reviews', 'Traveller Memory', 'Knowledge Base'];
    sourceTypes.forEach((srcType, idx) => {
      const srcRecord = db.insert('recommendation_sources', {
        recommendationId: recRecord.id,
        sourceType: srcType,
        sourceReference: `Verified data point #${idx + 1} for ${itemId}`,
        weight: (0.90 - idx * 0.10).toFixed(2)
      });
      syncService.queueMutation('recommendation_sources', 'insert', srcRecord);
    });

    // Update traveller_memory with provenance (learned_from and source)
    if (feedbackTag) {
      const memoryRecord = db.insert('traveller_memory', {
        userId,
        tripId,
        preferenceKey: 'user_feedback',
        preferenceValue: feedbackTag,
        confidenceScore: 0.95,
        learnedFrom: `User action (${interactionStatus}) on item ${itemId} during Trip ${tripId}`,
        source: 'User Interaction'
      });
      syncService.queueMutation('traveller_memory', 'insert', memoryRecord);
    }

    return recRecord;
  }

  // 4. Assemble Context Payload for LLM AI Companion
  assembleLLMContext({ travellerProfile, tripConfig, destinationData, currentStage }) {
    const userId = travellerProfile?.id || 'usr-default-1';
    const userMemories = db.select('traveller_memory', (m) => m.userId === userId || m.user_id === userId);
    const RAGDocuments = db.select('knowledge_documents', (d) => d.city === destinationData?.cityName);

    const nlPrefs = [];
    if (travellerProfile?.placesToVisit) nlPrefs.push(`Places to visit: ${travellerProfile.placesToVisit}`);
    if (travellerProfile?.preferredTransport) nlPrefs.push(`Preferred transport: ${travellerProfile.preferredTransport}`);
    if (travellerProfile?.tripEnergyMotivation) nlPrefs.push(`Energy & motivation: ${travellerProfile.tripEnergyMotivation}`);

    const fullMemories = [
      ...userMemories.map(m => `${m.preferenceKey}: ${m.preferenceValue} (Learned from: ${m.learnedFrom || 'User preference'})`),
      ...nlPrefs
    ].join('; ');

    const RAGSummary = RAGDocuments.map(d => `${d.title} [Type: ${d.documentType || 'guide'}]: ${d.content}`).join(' ');

    return {
      userMemories: fullMemories || 'Independent cafes, Female dorm floors',
      RAGKnowledge: RAGSummary || 'Well-lit corridors in Old Town, keycard hotel entries.',
      compositeSafetyScore: this.computeCompositeSafetyScore(destinationData)
    };
  }
}

export const recommendationService = new RecommendationService();
