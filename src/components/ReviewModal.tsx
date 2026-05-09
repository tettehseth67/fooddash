import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, Check } from 'lucide-react';
import { dbService } from '../services/db';
import { Order } from '../types';

interface ReviewModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ order, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [driverHover, setDriverHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await dbService.submitReview(
        order.userId,
        order.restaurantId,
        rating,
        order.id,
        order.driverId,
        driverRating > 0 ? driverRating : undefined,
        comment
      );
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {status === 'success' ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-[#191919] uppercase italic tracking-tighter mb-2">Review Submitted!</h2>
                <p className="text-gray-500 font-medium italic">Thank you for sharing your experience.</p>
              </div>
            ) : (
              <>
                <div className="p-8 sm:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-[#191919] uppercase italic tracking-tighter">Rate Your Order</h2>
                      <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Order #{order.id.slice(-4).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">How was the food?</p>
                      <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            className="p-1 transition-transform active:scale-90"
                          >
                            <Star
                              className={`w-10 h-10 transition-colors ${
                                star <= (hover || rating) 
                                  ? 'fill-brand text-brand' 
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {order.driverId && (
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">How was the delivery?</p>
                        <div className="flex justify-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setDriverRating(star)}
                              onMouseEnter={() => setDriverHover(star)}
                              onMouseLeave={() => setDriverHover(0)}
                              className="p-1 transition-transform active:scale-90"
                            >
                              <Star
                                className={`w-10 h-10 transition-colors ${
                                  star <= (driverHover || driverRating) 
                                    ? 'fill-brand text-brand' 
                                    : 'text-gray-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Tell us more (optional)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you love or what could be improved?"
                        className="w-full h-32 px-6 py-4 bg-gray-50 rounded-[1.5rem] border-2 border-transparent focus:border-brand/20 focus:bg-white transition-all resize-none text-sm font-medium italic outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={rating === 0 || submitting}
                      className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center space-x-2 transition-all ${
                        rating === 0 || submitting
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-brand text-white hover:bg-red-600 active:scale-95 shadow-brand/20'
                      }`}
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Experience</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
