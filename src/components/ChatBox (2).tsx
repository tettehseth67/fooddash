import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, User, Bike } from 'lucide-react';
import { format } from 'date-fns';

interface ChatBoxProps {
  orderId: string;
  driverName?: string;
  onClose: () => void;
}

export function ChatBox({ orderId, driverName, onClose }: ChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToChatMessages(orderId, (data) => {
      setMessages(data);
    });
    return unsubscribe;
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      await dbService.sendChatMessage(orderId, user.uid, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110]"
    >
      {/* Header */}
      <div className="bg-[#191919] p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black italic uppercase tracking-tighter text-sm">Chat with {driverName || 'Rider'}</h3>
            <p className="text-[8px] font-bold text-brand uppercase tracking-widest leading-none">Order Chat Active</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-orange-50/20"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale space-y-4 px-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
               <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secure connection established. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-brand text-white rounded-tr-none italic' 
                    : 'bg-white text-[#191919] border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1.5 px-1">
                  {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : 'Just now'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-brand transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="bg-brand text-white w-12 h-12 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
