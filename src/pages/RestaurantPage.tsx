import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import { Restaurant, MenuItem, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Clock as ClockIcon, ChevronLeft, Plus, Check, ShoppingBag, Heart, MapPin, Copy, Calendar, SortDesc, Minus, Flame, Leaf, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [loading, setLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newDriverRating, setNewDriverRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  const loadReviews = async () => {
    if (!id) return;
    const rv = await dbService.getRestaurantReviews(id);
    setReviews(rv);
  };

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [r, m] = await Promise.all([
        dbService.getRestaurant(id),
        dbService.getMenuItems(id)
      ]);
      setRestaurant(r);
      setMenuItems(m);
      await loadReviews();
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!user || !id) {
       toast.error("Please sign in to leave a review.");
       return;
    }
    if (newRating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await dbService.submitReview(
        user.uid, 
        id, 
        newRating, 
        undefined, 
        undefined, 
        newDriverRating > 0 ? newDriverRating : undefined, 
        newComment
      );
      toast.success("Review submitted! Thank you.");
      setNewRating(0);
      setNewDriverRating(0);
      setNewComment('');
      setShowReviewForm(false);
      await loadReviews();
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredReviews = reviews.filter(rev => {
    if (filterRating === 'all') return true;
    return rev.rating === filterRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB - dateA;
  });
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showVegetarianOnly, setShowVegetarianOnly] = useState(false);
  const [showSpicyOnly, setShowSpicyOnly] = useState(false);
  const [flyingItems, setFlyingItems] = useState<{ id: number; x: number; y: number; imageUrl: string }[]>([]);
  const { addItem, updateQuantity, items, total, isCartOpen, setIsCartOpen } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  
  const isFavorite = profile?.favorites?.includes(id || '') || false;
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setLocalIsFavorite(isFavorite);
  }, [isFavorite]);

  const handleToggleFavorite = async () => {
    if (!user || !id) {
      toast.error("Please sign in to save favorites.");
      return;
    }
    setIsToggling(true);
    const newStatus = !localIsFavorite;
    setLocalIsFavorite(newStatus);
    try {
      await dbService.toggleFavorite(user.uid, id, newStatus);
      await refreshProfile();
      toast.success(newStatus ? "Added to favorites!" : "Removed from favorites.");
    } catch (error) {
      setLocalIsFavorite(!newStatus);
      toast.error("Failed to update favorites.");
    } finally {
      setIsToggling(false);
    }
  };

  const copyAddress = () => {
    if (restaurant?.address) {
      navigator.clipboard.writeText(restaurant.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))];
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesVegetarian = !showVegetarianOnly || item.isVegetarian;
    const matchesSpicy = !showSpicyOnly || item.isSpicy;
    return matchesSearch && matchesCategory && matchesVegetarian && matchesSpicy;
  });

  const getItemQuantity = (itemId: string) => {
    return items.find(i => i.id === itemId)?.quantity || 0;
  };

  const handleFlyAnimation = (item: MenuItem, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setFlyingItems(prev => [...prev, { id: Date.now() + Math.random(), x, y, imageUrl: item.imageUrl }]);
  };

  const handleAddToCart = (item: MenuItem, e: React.MouseEvent) => {
    handleFlyAnimation(item, e);
    addItem({ ...item, quantity: 1 });
    toast.success(`${item.name} added to cart`, {
      description: `$${item.price.toFixed(2)} added to your order`,
      duration: 2000,
    });
    setAddedItem(item.name);
    setTimeout(() => setAddedItem(null), 2000);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!restaurant) return <div>Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <motion.img 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          src={restaurant.imageUrl} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20" />
        <Link 
          to="/"
          className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full text-[#191919] flex items-center justify-center hover:bg-gray-100 transition-all shadow-md active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/5 border border-gray-100 mb-16 overflow-hidden relative">
          {/* Decorative Background Icon */}
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <ShoppingBag className="w-64 h-64" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {restaurant.category}
                  </span>
                  {restaurant.isFeatured && (
                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                  <span className="flex items-center space-x-1.5 bg-[#191919] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Tracking</span>
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-[#191919] leading-tight mb-4 tracking-tighter italic uppercase">{restaurant.name}</h1>
                
                {/* Address & Quick Info Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 w-full bg-white rounded-[2rem] p-4 flex items-center gap-4 border border-gray-100 shadow-soft group hover:border-brand/20 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">Physical Location</p>
                      <h4 className="text-sm font-black text-[#191919] uppercase italic truncate tracking-tight">{restaurant.address || '123 Gourmet Way, Culinary District'}</h4>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                      <button 
                        onClick={copyAddress}
                        className="p-2.5 bg-gray-50 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-brand relative group/btn active:scale-90 border border-transparent hover:border-gray-100"
                        title="Copy Address"
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                            </motion.div>
                          ) : (
                            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Copy className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {copied && (
                            <motion.span 
                              initial={{ opacity: 0, y: 10, x: '-50%' }}
                              animate={{ opacity: 1, y: 0, x: '-50%' }}
                              exit={{ opacity: 0, y: 10, x: '-50%' }}
                              className="absolute -top-12 left-1/2 bg-[#191919] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl z-50 pointer-events-none"
                            >
                              Copied to Clipboard!
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address || restaurant.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-gray-50 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-brand active:scale-90 border border-transparent hover:border-gray-100"
                        title="Open in Maps"
                      >
                        <ShoppingBag className="w-4 h-4 rotate-45" />
                      </a>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] px-6 py-4 flex items-center justify-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Pure Gourmet</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-3xl border border-gray-100/50 shadow-soft">
                    <Star className="w-5 h-5 text-brand fill-brand" />
                    <span className="text-xl text-[#191919] -mt-0.5 font-black">{restaurant.rating}</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Rating</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-red-50 px-5 py-3 rounded-3xl border border-brand/10 shadow-sm">
                    <ClockIcon className="w-6 h-6 text-brand" />
                    <span className="text-2xl text-brand -mt-0.5 font-black italic tracking-tighter">{restaurant.deliveryTime}</span>
                    <div className="flex flex-col -space-y-1">
                      <span className="text-[8px] text-brand font-black uppercase tracking-widest">Delivery</span>
                      <span className="text-[10px] text-[#191919] font-black uppercase tracking-widest italic">Fast</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-3xl border border-gray-100/50 shadow-soft">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                    <span className="text-xl text-[#191919] -mt-0.5 font-black">${restaurant.deliveryFee}</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Fee</span>
                  </div>
                </div>
                {reviews.length > 0 && (
                  <div className="mt-6 flex items-center space-x-3 text-xs font-black uppercase tracking-widest text-emerald-600 italic">
                    <div className="flex -space-x-2">
                       {[...Array(Math.min(3, reviews.length))].map((_, i) => (
                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 overflow-hidden">
                            {reviews[i].comment ? '🍕' : '✨'}
                         </div>
                       ))}
                    </div>
                    <span>Loved by {reviews.length * 12}+ locals this week</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleToggleFavorite}
                disabled={isToggling || !user}
                className={`p-5 rounded-2xl transition-all shadow-sm border group ${
                  localIsFavorite 
                    ? 'bg-brand text-white border-brand' 
                    : 'bg-surface text-gray-400 hover:bg-red-50 hover:text-brand border-transparent hover:border-brand/10'
                } ${!user ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
              >
                <Heart className={`w-6 h-6 ${localIsFavorite ? 'fill-current' : 'group-hover:fill-current'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Find Us Section */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100 relative overflow-hidden group shadow-soft"
        >
          {/* Decorative Background Icon */}
          <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <MapPin className="w-96 h-96" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-brand rounded-full" />
              <div>
                <h2 className="text-3xl font-black text-[#191919] uppercase tracking-tighter italic leading-none">Find Us</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 italic">Visit our primary kitchen location</p>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Official Location</p>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#191919] uppercase italic tracking-tighter leading-tight max-w-xl">
                  {restaurant.address || '123 Gourmet Way, Culinary District, State 45678'}
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <button 
                  onClick={copyAddress}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border border-gray-100 px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:border-brand/30 hover:shadow-card transition-all active:scale-95 group/btn"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" className="flex items-center gap-2 text-emerald-500" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Check className="w-4 h-4 stroke-[3px]" />
                        <span>Address Copied!</span>
                      </motion.div>
                    ) : (
                      <motion.div key="copy" className="flex items-center gap-2 text-[#191919] group-hover/btn:text-brand" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address || restaurant.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-[#191919] text-white px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all hover:shadow-xl active:scale-95 shadow-lg shadow-black/10"
                >
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-black text-[#191919] uppercase tracking-tighter italic mr-4 inline-block">The Menu</h2>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic block mt-1">Crafted with passion by {restaurant.name}</span>
            </div>
            
            <div className="flex-1 max-w-md w-full">
               <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
               </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-20 py-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                    activeCategory === cat 
                      ? 'bg-[#191919] text-white border-[#191919] shadow-lg shadow-black/10' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-brand/20 hover:text-[#191919]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowVegetarianOnly(!showVegetarianOnly)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                  showVegetarianOnly 
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10' 
                    : 'bg-white text-emerald-500 border-emerald-100 hover:border-emerald-500/20'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Veg Only</span>
              </button>
              <button
                onClick={() => setShowSpicyOnly(!showSpicyOnly)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                  showSpicyOnly 
                    ? 'bg-brand text-white border-brand shadow-lg shadow-brand/10' 
                    : 'bg-white text-brand border-red-100 hover:border-brand/20'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Spicy Only</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => {
                const quantity = getItemQuantity(item.id);
                return (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`bg-white p-6 rounded-[2.5rem] border flex items-start space-x-6 hover:shadow-card transition-all group relative cursor-pointer ${
                      quantity > 0 ? 'border-brand/30 shadow-soft' : 'border-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="font-black text-[#191919] text-xl group-hover:text-brand transition-colors uppercase italic tracking-tighter truncate">{item.name}</h3>
                        <div className="flex items-center gap-1.5">
                          {idx < 2 && searchQuery === '' && activeCategory === 'All' && (
                            <span className="bg-[#191919] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">Top Pick</span>
                          )}
                          {item.isSpicy && (
                            <span className="bg-red-100 text-brand text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center">
                              <Flame className="w-2.5 h-2.5 mr-1" />
                              Spicy
                            </span>
                          )}
                          {item.isVegetarian && (
                            <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center">
                              <Leaf className="w-2.5 h-2.5 mr-1" />
                              Veg
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2 mb-4 italic">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xl font-black text-[#191919]">${item.price}</span>
                        
                        {/* Quantity Controls */}
                        {quantity > 0 ? (
                          <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, -1);
                              }}
                              className="p-1.5 hover:bg-white rounded-xl text-gray-500 hover:text-brand transition-all active:scale-90"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-black italic">{quantity}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFlyAnimation(item, e);
                                updateQuantity(item.id, 1);
                              }}
                              className="p-1.5 hover:bg-white rounded-xl text-gray-500 hover:text-brand transition-all active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item, e);
                            }}
                            className="bg-[#191919] text-white p-3 rounded-2xl hover:bg-brand transition-all active:scale-90 shadow-lg shadow-black/10"
                          >
                            <Plus className="w-5 h-5 stroke-[3px]" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden flex-shrink-0 relative shadow-soft">
                      <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" loading="lazy" />
                      {quantity > 0 && (
                        <div className="absolute inset-0 bg-brand/10 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-brand text-white w-10 h-10 rounded-full flex items-center justify-center font-black italic shadow-xl border-2 border-white">
                            {quantity}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {filteredItems.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                <ShoppingBag className="w-96 h-96 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white rounded-full shadow-soft flex items-center justify-center mx-auto mb-8 border border-gray-50">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                
                {menuItems.length === 0 ? (
                  <>
                    <h3 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic mb-4">Menu Coming Soon</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10 max-w-xs mx-auto leading-loose">
                      {restaurant.name} hasn't uploaded their gourmet menu yet. Check back soon for amazing treats!
                    </p>
                    <Link 
                      to="/seed"
                      className="bg-brand text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#191919] transition-all hover:shadow-xl active:scale-95 inline-block"
                    >
                      Seed Sample Data
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic mb-4">Nothing on the menu?</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10 max-w-xs mx-auto leading-loose">
                      Our chef is waiting, but your search "{searchQuery}" didn't return any treats.
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                      className="bg-[#191919] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all hover:shadow-xl active:scale-95"
                    >
                      Reset Selection
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="mt-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-black text-[#191919] uppercase tracking-tighter italic mr-4 inline-block">Customer Reviews</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic mt-1">Shared by our verified gourmet community ({reviews.length})</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  showReviewForm ? 'bg-[#191919] text-white' : 'bg-brand text-white shadow-lg shadow-brand/20'
                }`}
              >
                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
              </button>

              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <button 
                  onClick={() => setSortBy('date')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === 'date' ? 'bg-[#191919] text-white shadow-lg' : 'text-gray-400 hover:text-[#191919]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  Latest
                </button>
                <button 
                  onClick={() => setSortBy('rating')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === 'rating' ? 'bg-[#191919] text-white shadow-lg' : 'text-gray-400 hover:text-[#191919]'
                  }`}
                >
                  <SortDesc className="w-3 h-3" />
                  Top Rated
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-16 overflow-hidden"
              >
                <div className="bg-orange-50 rounded-[2.5rem] p-8 sm:p-10 border border-brand/10">
                  <h3 className="text-xl font-black text-[#191919] uppercase tracking-tighter italic mb-8">Share your Experience</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-3">Rate the Kitchen</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              onClick={() => setNewRating(star)}
                              className="transition-transform active:scale-90"
                            >
                              <Star className={`w-8 h-8 ${newRating >= star ? 'text-brand fill-brand' : 'text-gray-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-3">Rate the Delivery (Optional)</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              onClick={() => setNewDriverRating(star)}
                              className="transition-transform active:scale-90"
                            >
                              <Star className={`w-6 h-6 ${newDriverRating >= star ? 'text-emerald-500 fill-emerald-500' : 'text-gray-200'}`} />
                            </button>
                          ))}
                          {newDriverRating > 0 && (
                            <button 
                              onClick={() => setNewDriverRating(0)}
                              className="ml-2 text-[8px] font-black text-gray-400 uppercase tracking-widest hover:text-brand"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-3">Your Feedback</label>
                        <textarea 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Tell others about your amazing meal..."
                          className="w-full bg-white rounded-2xl p-6 text-sm font-bold border-2 border-transparent focus:border-brand transition-all outline-none min-h-[120px] shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white/50 rounded-3xl p-8 border border-white flex flex-col justify-center text-center">
                       <Sparkles className="w-12 h-12 text-brand mx-auto mb-4" />
                       <h4 className="text-lg font-black text-[#191919] uppercase italic tracking-tighter mb-2">Verified Feedback</h4>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">
                         Your reviews help {restaurant.name} improve and assist other foodies in finding the best meals!
                       </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => setShowReviewForm(false)}
                      className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#191919] transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || newRating === 0}
                      className="bg-[#191919] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                    >
                      {isSubmittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rating Filters */}
          <div className="flex items-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={() => setFilterRating('all')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all ${
                filterRating === 'all' ? 'bg-[#191919] text-white border-[#191919]' : 'bg-white text-gray-400 border-gray-100 hover:border-brand/20'
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map(stars => (
              <button 
                key={stars}
                onClick={() => setFilterRating(stars)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all ${
                  filterRating === stars ? 'bg-brand text-white border-brand' : 'bg-white text-gray-400 border-gray-100 hover:border-brand/20'
                }`}
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-current' : 'opacity-20'}`} />
                  ))}
                </div>
                <span>{stars} Stars</span>
              </button>
            ))}
          </div>
          
          {sortedReviews.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {sortedReviews.map((review) => (
                  <motion.div 
                    layout
                    key={review.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-card hover:border-brand/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-1.5 text-brand">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 transition-colors ${i < review.rating ? 'fill-current' : 'text-gray-100'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-lg font-black text-[#191919] italic leading-tight mb-8 tracking-tighter uppercase line-clamp-3">
                        "{review.comment}"
                      </p>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-surface border border-gray-100 flex items-center justify-center text-[10px] font-black text-brand uppercase tracking-widest italic">
                        {review.userId.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#191919] uppercase tracking-widest block">Verified Gourmet</span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                          <Check className="w-3 h-3 mr-0.5 stroke-[3px]" />
                          Verified Purchase
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                <MessageSquare className="w-80 h-80 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white rounded-full shadow-soft flex items-center justify-center mx-auto mb-8 border border-gray-50 text-gray-300">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic mb-4">No reviews yet</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10 max-w-xs mx-auto leading-loose">
                  Be the trendsetter! Order now and be the first to share your gourmet experience with {restaurant.name}.
                </p>
                <Link 
                  to="/orders"
                  className="bg-[#191919] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all hover:shadow-xl active:scale-95 inline-block"
                >
                  Rate a Past Order
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Floating Cart Bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-[#191919] text-white p-4 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between border border-white/10 cursor-pointer group hover:border-brand/30 transition-colors"
          >
            <div className="flex items-center space-x-4 ml-3">
              <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-sm font-black italic shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Order Total</p>
                <p className="text-xl font-black italic tracking-tighter">${total.toFixed(2)}</p>
              </div>
              <div className="sm:hidden">
                <p className="text-lg font-black italic tracking-tighter">${total.toFixed(2)}</p>
              </div>
            </div>
            <div 
              className="bg-brand hover:bg-red-600 text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center"
            >
              {isCartOpen ? 'Hide Items' : 'View Order'}
              <ChevronLeft className={`w-4 h-4 ml-1.5 transition-transform ${isCartOpen ? '-rotate-90' : 'rotate-180'}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Flying items animation */}
      <AnimatePresence>
        {flyingItems.map((item) => {
          const cartElement = document.getElementById('navbar-cart');
          const cartRect = cartElement?.getBoundingClientRect();
          const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth / 2;
          const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 50;

          return (
            <motion.div
              key={item.id}
              initial={{ 
                position: 'fixed', 
                left: item.x, 
                top: item.y, 
                x: '-50%',
                y: '-50%',
                width: 60,
                height: 60,
                zIndex: 9999,
                scale: 1,
                opacity: 1
              }}
              animate={{
                left: [item.x, item.x - 50, targetX],
                top: [item.y, item.y - 100, targetY],
                scale: [1, 1.2, 0.1],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.4, 1],
                ease: "easeInOut"
              }}
              onAnimationComplete={() => {
                setFlyingItems(prev => prev.filter(fi => fi.id !== item.id));
              }}
              className="pointer-events-none"
            >
              <img 
                src={item.imageUrl} 
                className="w-full h-full object-cover rounded-2xl shadow-2xl ring-2 ring-white" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
