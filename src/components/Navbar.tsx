import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { dbService } from '../services/db';
import { ShoppingBag, User as UserIcon, LogOut, Search, Sparkles, CheckCircle, Navigation as NavIcon, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { toast } from 'sonner';

export function Navbar() {
  const { user, profile, logOut } = useAuth();
  const { items, isCartOpen, setIsCartOpen } = useCart();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [lastItemCount, setLastItemCount] = useState(totalItems);

  useEffect(() => {
    if (totalItems > lastItemCount) {
      setShowAddedToast(true);
      toast.success('Added to cart', {
        duration: 2000,
        icon: <ShoppingBag className="w-4 h-4" />
      });
      const timer = setTimeout(() => setShowAddedToast(false), 2000);
      return () => clearTimeout(timer);
    }
    setLastItemCount(totalItems);
  }, [totalItems, lastItemCount]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');
  const isAuth = location.pathname === '/auth';

  if (isAuth) return null;

  if (isDashboard) {
    return (
      <nav className="sticky top-0 z-50 bg-[#191919] text-white border-b border-white/5 h-16 sm:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/admin" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all">
                 <span className="text-white font-black text-sm italic">A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter text-white uppercase italic leading-none">Nexus</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-brand mt-1 leading-none">System Console</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-12">
            <div className="flex items-center space-x-6 text-[11px] font-black uppercase tracking-widest">
               <Link to="/" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
                 <CheckCircle className="w-3.5 h-3.5" />
                 Exit to Client
               </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Core Connected</span>
               <span className="text-[8px] text-white/30 font-bold tabular-nums">ID: {user?.uid.slice(0, 8).toUpperCase()}</span>
             </div>
             <Link to="/profile" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden hover:border-brand/50 transition-all shadow-2xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-brand font-black text-sm uppercase">{user?.displayName?.[0] || user?.email?.[0] || 'U'}</span>
                )}
             </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 h-16 sm:h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-md shadow-brand/10">
             <span className="text-white font-black text-lg italic mt-0.5">A</span>
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-brand hidden sm:block">Awaa Express</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 sm:mx-12">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for restaurants, cuisines..." 
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-surface border border-transparent rounded-full text-sm font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-500 text-[#191919]"
            />
          </div>
        </form>

        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <div className="hidden md:flex items-center space-x-6 mr-4">
            {profile?.isAdmin && (
              <Link to="/admin" className="text-sm font-bold text-brand hover:opacity-80 transition-opacity flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Admin
              </Link>
            )}
            {(profile?.isDriver || profile?.isAdmin) && (
              <Link to="/driver" className="text-sm font-bold text-[#191919] hover:text-brand transition-colors flex items-center">
                <Bike className="w-4 h-4 mr-1.5" />
                Driver App
              </Link>
            )}
            <Link to="/orders" className="text-sm font-bold text-[#494949] hover:text-brand transition-colors">
              Orders
            </Link>
          </div>

          <div className="relative">
            <motion.div 
              id="navbar-cart"
              onClick={() => setIsCartOpen(!isCartOpen)}
              animate={showAddedToast ? { scale: [1, 1.2, 1] } : {}}
              className={`relative p-2.5 rounded-full transition-colors cursor-pointer group ${
                isCartOpen ? 'bg-[#191919] text-white' : 'bg-surface text-[#494949] hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-5 h-5 group-hover:text-brand transition-colors" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-brand text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </motion.div>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#191919]">{profile?.displayName || user.displayName || 'Customer'}</span>
                <span className="text-[8px] text-brand font-black uppercase tracking-tighter">Premium Rewards</span>
              </div>
              
              <Link to="/profile" className="relative group">
                <div className="w-10 h-10 rounded-full bg-surface border border-gray-100 p-0.5 flex items-center justify-center text-brand font-black overflow-hidden hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-brand/5 flex items-center justify-center rounded-full">
                      <span className="text-[10px] uppercase font-black tracking-tighter italic text-brand">{user.displayName?.[0] || user.email?.[0] || 'U'}</span>
                    </div>
                  )}
                </div>
                {profile?.isDriver && (
                  <div className="absolute -bottom-1 -right-1 bg-brand text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-brand/20">
                    <Bike className="w-3 h-3" />
                  </div>
                )}
              </Link>

              <button 
                onClick={handleLogout}
                className="hidden md:flex p-2.5 rounded-full bg-surface text-[#494949] hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link 
                to="/auth"
                className="btn-primary !px-5 !py-2 !text-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
