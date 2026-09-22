/**
 * Sakhi AI Chat Service
 * 
 * Orchestrates AI companion chat interactions following strict data flow:
 * User -> ChatService -> ContextBuilder -> RecommendationEngine -> LLM -> Response
 * 
 * Full multi-turn conversation memory, automatic preference extraction,
 * and user-isolated database storage.
 */

import { ContextBuilder } from './ContextBuilder.js';
import { generateLLMCompanionResponse } from './llmService.js';
import { TravellerMemoryService } from './TravellerMemoryService.js';
import { db } from '../db/databaseManager.js';

let chatMessageSequence = 0;

export const ChatService = {
  /**
   * Retrieve user-scoped conversation messages from DB and local storage
   */
  getConversationMessages(userId = 'guest', destinationId = null) {
    const destKey = destinationId || 'default';
    const storageKey = `sakhi_chat_messages_${userId}_${destKey}`;
    const legacyKey = `aura_chat_messages_${userId}_${destKey}`;

    try {
      // 1. Check local relational DB table
      let dbMessages = db.select('chat_messages', (m) => m.userId === userId && (!destinationId || m.destinationId === destinationId));
      if ((!dbMessages || dbMessages.length === 0) && destinationId) {
        const anyUserMsgs = db.select('chat_messages', (m) => m.userId === userId);
        if (anyUserMsgs && anyUserMsgs.length > 0) {
          dbMessages = anyUserMsgs;
        }
      }

      if (dbMessages && dbMessages.length > 0) {
        const sorted = [...dbMessages].sort((a, b) => {
          if (a.sequence && b.sequence) return a.sequence - b.sequence;
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });
        return sorted.map(m => ({
          sender: m.sender,
          text: m.text,
          time: m.time || 'Just now'
        }));
      }

      // 2. Check user-scoped localStorage
      if (typeof localStorage !== 'undefined') {
        let saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
        if (!saved && destinationId) {
          saved = localStorage.getItem(`sakhi_chat_messages_${userId}_default`) || localStorage.getItem(`aura_chat_messages_${userId}_default`);
        }
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[ChatService] Error retrieving messages:', e);
    }

    // Default initial greeting for new conversation
    return [
      {
        sender: 'sakhi',
        text: "Hi! I'm Sakhi, your AI travel companion. Ask me anything about safe routes, local etiquette, or rest stops!",
        time: 'Just now'
      }
    ];
  },

  /**
   * Persist a message to user-scoped DB and local storage
   */
  saveMessage(userId = 'guest', destinationId = null, message = {}) {
    const destKey = destinationId || 'default';
    chatMessageSequence += 1;
    const msgRecord = {
      id: `msg-${Date.now()}-${chatMessageSequence}`,
      userId,
      destinationId: destKey,
      sender: message.sender || 'user',
      text: message.text || '',
      time: message.time || 'Just now',
      sequence: Date.now() * 1000 + (chatMessageSequence % 1000),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save to relational DB
      db.insert('chat_messages', msgRecord);
      db.upsert('chat_conversations', {
        id: `conv-${userId}-${destKey}`,
        userId,
        destinationId: destKey,
        lastMessage: message.text || '',
        updatedAt: new Date().toISOString()
      });

      // 2. Save to user-scoped localStorage
      if (typeof localStorage !== 'undefined') {
        const storageKey = `sakhi_chat_messages_${userId}_${destKey}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push({
          sender: msgRecord.sender,
          text: msgRecord.text,
          time: msgRecord.time
        });
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('[ChatService] Error saving message:', e);
    }

    return msgRecord;
  },

  /**
   * Clear conversation history for a user
   */
  clearConversation(userId = 'guest', destinationId = null) {
    const destKey = destinationId || 'default';
    try {
      const allMsgs = db.getTable('chat_messages');
      const filtered = allMsgs.filter(m => !(m.userId === userId && (!destinationId || m.destinationId === destinationId)));
      db.saveTable('chat_messages', filtered);

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`sakhi_chat_messages_${userId}_${destKey}`);
        localStorage.removeItem(`aura_chat_messages_${userId}_${destKey}`);
      }
    } catch (e) {
      console.warn('[ChatService] Error clearing conversation:', e);
    }
  },

  /**
   * Process user chat message through AI Context Builder & LLM Reasoning Engine with memory
   */
  async sendMessage({
    userPrompt,
    userId = 'usr-default-1',
    destinationData,
    tripConfig,
    currentStage = 'before-trip',
    conversationHistory = []
  }) {
    const destId = destinationData?.id || tripConfig?.destId || null;

    // 1. Persist user message to DB & scoped storage
    this.saveMessage(userId, destId, {
      sender: 'user',
      text: userPrompt,
      time: 'Just now'
    });

    // 2. Learn any user preferences or constraints stated in this message
    TravellerMemoryService.extractAndLearnFromMessage(userPrompt);

    // 3. Build structured context via ContextBuilder
    const context = await ContextBuilder.buildContext({
      userPrompt,
      userId,
      destinationData,
      tripConfig,
      currentStage,
      candidateAccommodations: destinationData?.accommodations || [],
      candidatePlaces: destinationData?.soloSpots || []
    });

    // 4. Generate LLM companion response with multi-turn conversation history
    const responseText = await generateLLMCompanionResponse({
      userPrompt,
      destinationData,
      tripConfig,
      travellerProfile: context.travellerContext,
      currentStage,
      conversationHistory
    });

    // 5. Persist AI response to DB & scoped storage
    this.saveMessage(userId, destId, {
      sender: 'sakhi',
      text: responseText,
      time: 'Just now'
    });

    return {
      sender: 'sakhi',
      text: responseText,
      contextSnapshot: {
        stage: currentStage,
        topMatchScore: context.topAccommodations[0]?.aiMatchScore || 95,
        weather: context.liveWeather?.temp || '22°C',
        activeInstructions: TravellerMemoryService.getUserInstructions()
      }
    };
  }
};
