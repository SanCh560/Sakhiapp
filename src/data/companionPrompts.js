export const SYSTEM_PERSONA = `
You are Sakhi, an intelligent, empathetic, and context-aware AI travel companion built specifically for solo female travellers visiting Prague, Czech Republic.
Your tone is calming, empowering, highly trustworthy, and concise.
You prioritize safety, personal fit, comfort, and convenience in all recommendations.
Always explain *why* something is recommended or safe.
`;

export const AI_SUGGESTED_PROMPTS = {
  'before-trip': [
    'What should I know about solo female safety in Prague?',
    'Which neighborhood is safest: Old Town, Holešovice or Vinohrady?',
    'Help me prepare my Prague cobblestone packing list'
  ],
  'arrival': [
    'How do I get from Vaclav Havel Airport (PRG) to Old Town safely?',
    'Show me the Czech flashcard for asking for help',
    'Is Bolt or official airport taxi safer for a late night arrival?'
  ],
  'solo-days': [
    'Find me a quiet historic cafe with solo seating near Old Town',
    'Is it safe to walk across Charles Bridge at dusk alone?',
    'Recommend a solo-friendly traditional Czech lunch spot'
  ],
  'goodbye': [
    'How early should I leave for Vaclav Havel Airport on Sunday?',
    'Help me summarize my top Prague solo travel memories',
    'Generate a packing checklist so I don\'t leave anything in hotel safe'
  ]
};

export function generateAIResponse(userMessage, currentStage, isOffline) {
  const query = userMessage.toLowerCase();
  
  if (isOffline) {
    return {
      text: "⚡ [SAKHI OFFLINE MODE ACTIVE]\nI'm using cached local Prague intelligence. Emergency info: Czech European Emergency is 112, Police is 158. Police stations (Policie ČR) are active 24/7 at Wenceslas Square and Old Town Hall.",
      sources: ['Prague Offline Emergency Database'],
      matchScore: 98
    };
  }

  if (query.includes('safety') || query.includes('safe') || query.includes('charles bridge') || query.includes('night')) {
    return {
      text: "Prague is ranked among the top 10 safest countries globally for women (Safety Score: 96%). Old Town, Vinohrady, and Holešovice are brightly lit and safe to walk through even around 10 PM. Watch out for petty pickpockets around crowded tram stops, but personal violent crime is extremely rare.",
      sources: ['Czech Republic Municipal Safety Registry', 'Sakhi Solo Female Vetted Logs'],
      matchScore: 97,
      rationale: {
        safety: 98,
        personalFit: 96,
        comfort: 95,
        convenience: 98
      }
    };
  }

  if (query.includes('airport') || query.includes('prg') || query.includes('arrival') || query.includes('taxi')) {
    return {
      text: "For arriving at Vaclav Havel Airport (PRG), I recommend the official Airport Express (AE) Bus directly to Prague Main Station (32 mins, 100 CZK / ~$4.20). Buses leave every 30 mins from Terminal 1/2. If arriving late, use the official Uber/Bolt dispatch desk inside the arrival hall for a verified fixed-fare cab.",
      sources: ['Prague Airport Transport Board', 'Sakhi Safe Transfer Guide'],
      matchScore: 97,
      rationale: {
        safety: 98,
        personalFit: 96,
        comfort: 94,
        convenience: 97
      }
    };
  }

  if (query.includes('cafe') || query.includes('quiet') || query.includes('coffee') || query.includes('food') || query.includes('dinner')) {
    return {
      text: "I highly recommend Café Imperial for Art Nouveau elegance with single corner seating, or Kafková Snickerie in Vinohrady for specialty coffee and reading. Both feature a welcoming atmosphere for solo women travellers with zero pressure to rush.",
      sources: ['Sakhi Curated Prague Dining Registry'],
      matchScore: 96,
      rationale: {
        safety: 99,
        personalFit: 97,
        comfort: 96,
        convenience: 92
      }
    };
  }

  if (query.includes('pack') || query.includes('list') || query.includes('cobblestone')) {
    return {
      text: "Essential Prague solo items: 1) Sturdy low-heeled walking shoes (Prague cobblestones are steep!), 2) Anti-theft RFID crossbody bag, 3) EU Type C/F adapter, 4) Door stop safety alarm for hotel. Check the Before Trip tab for your full dynamic list!",
      sources: ['Prague Solo Prep Guide'],
      matchScore: 95
    };
  }

  return {
    text: `I've analyzed your prompt based on your profile as a solo female traveller in Prague (${currentStage} phase). Prague is magical and exceptionally welcoming. How else can I assist with your safety, safe routes, or local coffee spots today?`,
    sources: ['Sakhi Intelligence Engine'],
    matchScore: 94,
    rationale: {
      safety: 96,
      personalFit: 94,
      comfort: 95,
      convenience: 92
    }
  };
}
