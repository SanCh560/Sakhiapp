import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, ShieldCheck, MapPin, Volume2, HelpCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { ChatService } from '../services/ChatService';

export default function AICompanionChat({ isOpen, onClose, currentStage, isOffline, destinationData, tripConfig, travellerProfile }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firstName = travellerProfile?.name ? travellerProfile.name.split(' ')[0] : 'there';
  const userId = travellerProfile?.id || 'guest';
  const destId = destinationData?.id || tripConfig?.destId || null;

  const [messages, setMessages] = useState(() => 
    ChatService.getConversationMessages(userId, destId)
  );

  const chatEndRef = useRef(null);

  // Synchronize messages whenever modal opens or user/destination changes
  useEffect(() => {
    if (isOpen) {
      setMessages(ChatService.getConversationMessages(userId, destId));
    }
  }, [isOpen, userId, destId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newMsg = { sender: 'user', text: userText, time: 'Just now' };
    
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    if (isOffline) {
      const offlineMsg = destinationData
        ? `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts, offline maps, and travel pack details for ${destinationData.cityName} remain accessible.`
        : `[Offline Mode] Sakhi is offline. All your downloaded emergency contacts and offline maps remain accessible.`;
      ChatService.saveMessage(userId, destId, newMsg);
      ChatService.saveMessage(userId, destId, { sender: 'sakhi', text: offlineMsg, time: 'Just now' });
      setMessages((prev) => [...prev, { sender: 'sakhi', text: offlineMsg, time: 'Just now' }]);
      setIsLoading(false);
      return;
    }

    try {
      const responseObj = await ChatService.sendMessage({
        userPrompt: userText,
        userId,
        destinationData: destinationData || null,
        tripConfig,
        currentStage,
        conversationHistory: [...messages, newMsg]
      });

      setMessages((prev) => [
        ...prev,
        { sender: 'sakhi', text: responseObj.text, time: 'Just now' }
      ]);
    } catch (err) {
      const fallbackText = "Sakhi is currently operating in offline safety mode. Stick to main boulevards and keep emergency contacts handy!";
      ChatService.saveMessage(userId, destId, { sender: 'sakhi', text: fallbackText, time: 'Just now' });
      setMessages((prev) => [
        ...prev,
        { sender: 'sakhi', text: fallbackText, time: 'Just now' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[85vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative">
        
        {/* CHAT HEADER */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center font-bold text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                Sakhi AI Companion
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  🧠 Multi-Turn Memory Active
                </span>
              </h3>
              <span className="text-[10px] text-slate-400 block font-medium">
                Remembering Context • {destinationData?.cityName || 'Solo Travel'} Female Safety Guide
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK SUGGESTION CHIPS */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            'Is it safe to walk at 9 PM?',
            'Find cozy cafes for solo reading',
            'How to get to my hotel safely?'
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(chip)}
              className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-extrabold hover:border-violet-400 hover:bg-violet-50 transition-all whitespace-nowrap shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* CHAT MESSAGES LIST */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {(msg.sender === 'sakhi' || msg.sender === 'aura') && (
                <div className="w-7 h-7 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white font-semibold rounded-tr-none shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 font-medium rounded-tl-none shadow-2xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white p-3 rounded-2xl w-fit border border-slate-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
              Sakhi is generating context advice...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask Sakhi about ${destinationData?.cityName || 'Prague'} safety, routes, or cafes...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
