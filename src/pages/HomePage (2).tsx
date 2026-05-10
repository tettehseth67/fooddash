import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { PromoBanners } from '../components/PromoBanners';
import { AIAssistant } from '../components/AIAssistant';
import { RestaurantSkeleton, CategorySkeleton } from '../components/Skeletons';
import { dbService } from '../services/db';
import { Restaurant, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Pizza, Sandwich, Coffee, IceCream, Flame, Search, SearchSlash, Star, Clock as ClockIcon } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: Utensils },
  { name: 'Pizza', icon: Pizza },
  { name: 'Burger', icon: Sandwich },
  { name: 'Sushi', icon: Flame }, // Reusing Flame for Sushi as I don't have a Sushi icon
  { name: 'Healthy', icon: Coffee },
  { name: 'Asian', icon: Flame },
  { name: 'Desserts', icon: IceCream },
];

export function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [maxDeliveryFee, setMaxDeliveryFee] = useState<number | 'Any'>('Any');
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number | 'Any'>('Any');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const handleClearFilters = () => {
    setMaxDeliveryFee('Any');
    setMaxDeliveryTime('Any');
    setActiveCategory('All');
    setSearchParams({});
  };

  useEffect(() => {
    async function load() {
      const data = await dbService.getRestaurants();
      if (data.length === 0 && user?.email === 'tettehseth67@gmail.com') {
        console.log("Empty restaurants detected on web, seeding...");
        await dbService.seedDatabase();
        const refreshed = await dbService.getRestaurants();
        setRestaurants(refreshed);
      } else {
        setRestaurants(data);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setActiveOrders([]);
      return;
    }
    return dbService.subscribeToUserOrders(user.uid, (orders) => {
      setActiveOrders(orders.filter(o => ['pending', 'preparing', 'delivering'].includes(o.status)));
    });
  }, [user]);

  const filtered = restaurants.filter(r => {
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
    const matchesSearch = !searchQuery || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFee = true;
    if (maxDeliveryFee !== 'Any') {
      matchesFee = r.deliveryFee <= maxDeliveryFee;
    }

    let matchesTime = true;
    if (maxDeliveryTime !== 'Any') {
      // Extract the first number from "20-30 min" or "25 min"
      const timeMatch = r.deliveryTime.match(/\d+/);
      const time = timeMatch ? parseInt(timeMatch[0]) : 0;
      matchesTime = time <= maxDeliveryTime;
    }

    return matchesCategory && matchesSearch && matchesFee && matchesTime;
  });

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse mb-16" />
      <CategorySkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {[1, 2, 3, 4, 5, 6].map(i => <RestaurantSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Active Order Tracker */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <Link 
              to={`/track/${activeOrders[0].id}`}
              className="block bg-gray-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-brand rounded-3xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                    <Flame className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Your order is {activeOrders[0].status}!</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Track in real-time</p>
                  </div>
                </div>
                <div className="flex-1 max-w-md w-full px-4">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: activeOrders[0].status === 'pending' ? '25%' : activeOrders[0].status === 'preparing' ? '50%' : '75%' }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                <div className="btn-primary !py-3 !px-8 !rounded-full !text-xs group-hover:scale-105 transition-transform">
                  TRACK NOW
                </div>
              </div>
              {/* Background Decoration */}
              <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
                <Search className="w-64 h-64 text-white" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Result Info */}
      <AnimatePresence>
        {(searchQuery || maxDeliveryFee !== 'Any' || maxDeliveryTime !== 'Any' || activeCategory !== 'All') && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-surface p-8 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex-1">
              <span className="text-xs font-black text-brand uppercase tracking-widest mb-1 block">
                {searchQuery ? 'Search Results' : 'Filtered Results'}
              </span>
              <h1 className="text-2xl font-black text-[#191919]">
                Found {filtered.length} results
                {searchQuery && <> for <span className="text-brand">"{searchQuery}"</span></>}
                {(maxDeliveryFee !== 'Any' || maxDeliveryTime !== 'Any' || activeCategory !== 'All') && (
                  <span className="text-gray-400 text-lg font-medium ml-2">
                    ({activeCategory !== 'All' ? activeCategory : ''}
                    {activeCategory !== 'All' && (maxDeliveryFee !== 'Any' || maxDeliveryTime !== 'Any') ? ' • ' : ''}
                    {maxDeliveryFee !== 'Any' ? `$${maxDeliveryFee} fee` : ''}
                    {maxDeliveryFee !== 'Any' && maxDeliveryTime !== 'Any' ? ' • ' : ''}
                    {maxDeliveryTime !== 'Any' ? `${maxDeliveryTime}m max` : ''})
                  </span>
                )}
              </h1>
            </div>
            <button 
              onClick={handleClearFilters}
              className="bg-[#191919] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all flex items-center gap-2 shadow-xl shadow-black/10 group"
            >
              Clear All Filters
              <SearchSlash className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!searchQuery && (
        <>
          <section className="mb-16">
            <PromoBanners />
          </section>

          {/* Featured Section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-brand p-2 rounded-xl text-white shadow-lg shadow-brand/20">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <h2 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic">Top Recommended</h2>
              </div>
              <div className="h-px flex-1 bg-linear-to-r from-gray-100 to-transparent mx-6"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#191919] bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">Premium Selection</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {restaurants.filter(r => r.isFeatured).slice(0, 2).map((r) => (
                <Link to={`/restaurant/${r.id}`} key={r.id} className="group relative h-72 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-brand/20 hover:-translate-y-1 animate-pulsing-glow ring-2 ring-brand/10 hover:ring-brand/30">
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" loading="lazy" />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center shadow-lg">
                      <Flame className="w-3 h-3 mr-2 text-brand animate-pulse" />
                      Must Try
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-brand/30">FEATURED</span>
                      <div className="h-0.5 w-8 bg-brand/50 rounded-full" />
                    </div>
                    <h3 className="text-4xl font-black text-white mb-3 tracking-tighter italic uppercase group-hover:text-brand transition-colors">{r.name}</h3>
                    <p className="text-white/70 text-sm font-medium line-clamp-1 max-w-sm mb-4">{r.description}</p>
                    <div className="flex items-center gap-4 text-white/60 text-xs font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5 text-brand" /> {r.deliveryTime}</span>
                       <div className="w-1 h-1 bg-white/20 rounded-full" />
                       <span className="text-brand italic">${r.deliveryFee === 0 ? 'FREE' : r.deliveryFee} Delivery</span>
                    </div>
                  </div>
                  
                  {/* Hover Decoration */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white rotate-12">
                      <Utensils className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mb-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end mb-8">
          <div className="flex-1 w-full overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center space-x-4 min-w-max pb-2">
              {CATEGORIES.map((cat, idx) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-[2rem] border transition-all shrink-0 group ${
                    activeCategory === cat.name 
                      ? 'bg-[#191919] border-[#191919] shadow-xl shadow-gray-200' 
                      : 'bg-white border-gray-100 hover:border-brand/30 shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeCategory === cat.name ? 'bg-brand' : 'bg-surface group-hover:bg-red-50'}`}>
                    <cat.icon className={`w-4 h-4 ${activeCategory === cat.name ? 'text-white' : 'text-gray-400 group-hover:text-brand'}`} />
                  </div>
                  <span className={`text-sm font-black uppercase tracking-widest ${activeCategory === cat.name ? 'text-white' : 'text-[#494949]'}`}>
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            {/* Delivery Fee Filter */}
            <div className="flex-1 sm:flex-none">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Delivery Fee</label>
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-sm">
                {[
                  { label: 'Any', value: 'Any' },
                  { label: 'Free', value: 0 },
                  { label: '< $2', value: 1.99 },
                  { label: '< $5', value: 4.99 },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setMaxDeliveryFee(option.value as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      maxDeliveryFee === option.value
                        ? 'bg-[#191919] text-white shadow-lg'
                        : 'text-gray-400 hover:text-[#191919] hover:bg-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Time Filter */}
            <div className="flex-1 sm:flex-none">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Max Time</label>
              <select 
                value={maxDeliveryTime}
                onChange={(e) => setMaxDeliveryTime(e.target.value === 'Any' ? 'Any' : Number(e.target.value))}
                className="w-full bg-white border border-gray-100 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest outline-hidden focus:border-brand hover:border-brand/30 transition-all cursor-pointer shadow-sm appearance-none"
              >
                <option value="Any">Any Time</option>
                <option value="20">Under 20m</option>
                <option value="30">Under 30m</option>
                <option value="45">Under 45m</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(maxDeliveryFee !== 'Any' || maxDeliveryTime !== 'Any' || activeCategory !== 'All' || searchQuery) && (
              <div className="flex items-end self-end sm:self-auto">
                <button 
                  onClick={handleClearFilters}
                  className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand hover:bg-red-50 rounded-2xl transition-all flex items-center gap-2"
                >
                  <SearchSlash className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#191919] tracking-tight">
              {searchQuery ? 'Top matches' : 'Best in your area'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-[#494949] cursor-pointer hover:text-brand transition-colors">
            <span>Price</span>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>Delivery Time</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-12 gap-x-6">
          {filtered.length > 0 ? (
            filtered.map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <RestaurantCard restaurant={restaurant} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchSlash className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium italic">We couldn't find any restaurants matching your selection. Try exploring other categories!</p>
              <button 
                onClick={handleClearFilters}
                className="bg-[#191919] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all shadow-xl shadow-black/10 flex items-center gap-3 mx-auto"
              >
                <SearchSlash className="w-5 h-5" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI Assistant */}
      <AIAssistant restaurants={restaurants} />
    </div>
  );
}
