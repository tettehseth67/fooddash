import { Star, Clock as ClockIcon, Heart } from 'lucide-react';
import { Restaurant, MenuItem } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import React, { useState } from 'react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { user, profile, refreshProfile } = useAuth();
  const isFavorite = profile?.favorites?.includes(restaurant.id) || false;
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);
  const [isToggling, setIsToggling] = useState(false);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  React.useEffect(() => {
    async function loadMenu() {
      setIsLoadingMenu(true);
      try {
        const items = await dbService.getMenuItems(restaurant.id);
        setPopularItems(items.slice(0, 3));
      } catch (error) {
        console.error("Failed to load menu preview:", error);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenu();
  }, [restaurant.id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setIsToggling(true);
    const newStatus = !localIsFavorite;
    setLocalIsFavorite(newStatus);

    try {
      await dbService.toggleFavorite(user.uid, restaurant.id, newStatus);
      await refreshProfile();
    } catch (error) {
      setLocalIsFavorite(!newStatus);
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <motion.div 
      className={`group cursor-pointer relative rounded-[2.5rem] transition-all duration-300 ${
        restaurant.isFeatured 
          ? 'bg-linear-to-b from-brand/10 to-transparent p-1 shadow-2xl shadow-brand/10 ring-2 ring-brand/20' 
          : ''
      }`}
      whileHover={{ y: -8 }}
    >
      {restaurant.isFeatured && (
        <div className="absolute inset-0 rounded-[2.5rem] bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none z-30" />
      )}
      <Link to={`/restaurant/${restaurant.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] mb-4 shadow-soft group-hover:shadow-card transition-all duration-500">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Order Now Overlay Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <motion.div 
              whileHover={{ scale: 1.1, backgroundColor: '#ff4b33' }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#191919] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
            >
               Order Now <Star className="w-3 h-3 fill-white" />
            </motion.div>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button 
              onClick={handleToggleFavorite}
              disabled={isToggling || !user}
              className={`p-3 rounded-2xl shadow-xl transition-all duration-300 ${
                localIsFavorite 
                  ? 'bg-brand text-white' 
                  : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-brand'
              } ${!user ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
            >
              <Heart className={`w-5 h-5 ${localIsFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
            <div className="flex gap-2">
              <span className="bg-[#191919] text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {restaurant.category}
              </span>
              {restaurant.deliveryFee === 0 && (
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-emerald-500/30">
                  Free Delivery
                </span>
              )}
              {restaurant.isFeatured && (
                <motion.span 
                  animate={{ 
                    boxShadow: ["0 0 0px var(--color-brand)", "0 0 15px var(--color-brand)", "0 0 0px var(--color-brand)"],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-brand text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-brand/30"
                >
                  <Star className="w-2.5 h-2.5 mr-1 fill-white" />
                  Featured
                </motion.span>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 pb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-black text-xl text-[#191919] tracking-tight group-hover:text-brand transition-colors uppercase italic tracking-tighter flex items-center gap-2">
                {restaurant.name}
                {restaurant.isFeatured && (
                  <motion.div 
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="bg-brand/10 p-1 rounded-md"
                  >
                    <Star className="w-3 h-3 text-brand fill-brand" />
                  </motion.div>
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold line-clamp-1 mt-0.5">{restaurant.description}</p>
            </div>
            <div className="flex items-center text-brand font-black italic text-lg bg-red-50 px-3 py-1 rounded-2xl">
               {restaurant.rating}
               <Star className="w-3.5 h-3.5 ml-1 fill-current" />
            </div>
          </div>
          
          {/* Quick Menu Preview */}
          {popularItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-3 ml-1">Popular Picks</p>
              <div className="space-y-2">
                {popularItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" loading="lazy" />
                      </div>
                      <span className="text-[10px] font-bold text-[#191919] uppercase italic truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-brand italic">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-gray-500 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-brand" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center">
              <span className="text-emerald-600">${restaurant.deliveryFee === 0 ? 'FREE' : restaurant.deliveryFee}</span>
              <span className="ml-1">Delivery</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
