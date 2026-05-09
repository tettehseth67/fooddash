import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Utensils, MessageSquare, BrainCircuit } from 'lucide-react';
import { Restaurant } from '../types';

interface AIAssistantProps {
  restaurants: Restaurant[];
}

export function AIAssistant({ restaurants }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your Awaa Express AI assistant. Tell me what you're craving, and I'll suggest the best spots!" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
      
      const restaurantContext = restaurants.map(r => 
        `- ${r.name}: ${r.category} (${r.description}). Rating: ${r.rating}, Delivery: ${r.deliveryTime}`
      ).join('\n');

      const prompt = `You are a food recommendation assistant for "Awaa Express". 
      Here is the list of available restaurants:
      ${restaurantContext}

      The user says: "${userMessage}"
      
      Recommend 1-3 specific restaurants from the list above that match their request. 
      Be friendly, brief, and use high-energy language. 
      If nothing matches, suggest something close or just be honest.
      Use emojis.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const aiResponse = response.text || "Sorry, I couldn't process that. Try asking about a specific cuisine!";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, my taste buds are malfunctioning. Please try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 sm:right-8 z-40 bg-[#191919] text-white p-4 rounded-full shadow-2xl flex items-center space-x-2 border border-white/10 group"
      >
        <div className="relative">
          <BrainCircuit className="w-6 h-6 text-brand" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full border-2 border-[#191919]" 
          />
        </div>
        <span className="hidden sm:inline font-black text-xs uppercase tracking-widest pl-1">Ask AI</span>
      </motion.button>

      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
            >
              {/* Header */}
              <div className="bg-[#191919] p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg leading-none mb-1 uppercase tracking-tight">AI Assistant</h3>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Powered by Gemini</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gray-50/30"
              >
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none font-medium text-sm leading-relaxed'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div className="flex justify-start">
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex space-x-2">
                       <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="I want something spicy for under $15..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand/20 transition-all font-medium"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#191919] text-white rounded-xl flex items-center justify-center hover:bg-brand transition-all disabled:opacity-20 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
