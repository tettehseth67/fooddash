import { useState, useEffect } from 'react';
import { Promotion } from '../types';
import { dbService } from '../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PromoBanners() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await dbService.getPromotions();
      setPromos(data);
    }
    load();
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos]);

  if (promos.length === 0) return null;

  const current = promos[currentIndex];

  return (
    <div className="relative group overflow-hidden rounded-[3rem] mb-16 shadow-2xl shadow-orange-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative h-[28rem] md:h-96 ${current.color || 'bg-orange-500'} text-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between overflow-hidden`}
        >
          <div className="relative z-10 max-w-xl text-center md:text-left flex flex-col justify-center h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest mb-6">
                Limited Time Offer
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter">
                {current.title}
              </h2>
              <p className="text-white/80 text-lg md:text-xl font-medium mb-10 max-w-sm">
                {current.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl transition-all active:scale-95 hover:-translate-y-1">
                  Claim Offer Now
                </button>
                <button className="bg-black/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block relative z-10 w-[40%] aspect-square">
            <motion.div
              initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
              animate={{ opacity: 1, rotate: -3, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="w-full h-full relative"
            >
              <div className="absolute inset-0 bg-white/10 rounded-[3rem] blur-3xl transform translate-x-4 translate-y-4" />
              <img 
                src={current.imageUrl} 
                alt={current.title} 
                className="w-full h-full object-cover rounded-[3rem] shadow-2xl relative z-10 border-4 border-white/10"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </motion.div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 scale-150 pointer-events-none">
             <h2 className="text-[20rem] leading-none font-black select-none uppercase tracking-tighter">DASH</h2>
          </div>
        </motion.div>
      </AnimatePresence>

      {promos.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-2xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-gray-900 shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % promos.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-2xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-gray-900 shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
            {promos.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'bg-white w-12 shadow-sm' : 'bg-white/30 w-3 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
