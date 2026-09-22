/**
 * Central AI Recommendation Engine (Delegates to Recommendation Service)
 * 
 * Uses 4D Metrics (Safety 40%, Personal Fit 30%, Comfort 15%, Convenience 15%),
 * traveller_memory preferences, and past user feedback.
 */

import { recommendationService } from '../services/recommendationService.js';

export function scoreRecommendationItem(item, travellerProfile, tripConfig, destinationData, energyLevel = '🌿 Moderate') {
  const matchScore = recommendationService.scoreItem({
    item,
    travellerProfile,
    tripConfig,
    destinationData,
    energyLevel
  });

  const whyChosen = item.whyChosen || item.whyChosenRationale || `Vetted for high safety rating, keycard access, and female-friendly amenities in ${destinationData?.cityName || 'city'}.`;

  return {
    item,
    matchScore,
    whyChosen,
    safetyHighlights: item.safetyFeatures || []
  };
}

export function scoreRecommendationList(itemList = [], travellerProfile, tripConfig, destinationData, energyLevel = '🌿 Moderate') {
  if (!Array.isArray(itemList)) return [];

  const scored = itemList.map((item) =>
    scoreRecommendationItem(item, travellerProfile, tripConfig, destinationData, energyLevel)
  );

  return scored.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
}
