import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  Package as PackageIcon, 
  DollarSign, 
  Award, 
  Power, 
  User as UserIcon,
  ChevronLeft,
  Settings,
  Bell
} from 'lucide-react';
import { Toaster } from 'sonner';

interface DriverLayoutProps {
  children: React.ReactNode;
}

export function DriverLayout({ children }: DriverLayoutProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-full flex items-center justify-center font-black uppercase italic tracking-tighter bg-slate-50">Loading Logistics...</div>;
  if (!user || (!profile?.isDriver && !profile?.isAdmin)) return <Navigate to="/auth" />;

  const isNewDriver = profile?.isDriver && !profile?.driverInfo?.vehicleType;
  const isOnboarding = location.pathname === '/driver/onboarding';

  if (isNewDriver && !isOnboarding && !profile?.isAdmin) {
    return <Navigate to="/driver/onboarding" />;
  }

  const navItems = [
    { icon: PackageIcon, label: 'Jobs', path: '/driver' },
    { icon: DollarSign, label: 'Earnings', path: '/driver/earnings' },
    { icon: UserIcon, label: 'Profile', path: '/driver/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col lg:flex-row">
      <Toaster position="top-center" expand={true} richColors />
      
      {/* Desktop Sidebar */}
      {!isOnboarding && (
        <aside className="w-72 bg-[#191919] text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
          <div className="p-8">
            <Link to="/driver" className="flex items-center gap-3 group mb-12">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all">
                <span className="text-white font-black text-xl italic drop-shadow-sm">L</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter uppercase italic leading-none">Logistics</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-brand mt-1">Driver Nexus</span>
              </div>
            </Link>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    location.pathname === item.path 
                      ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-white/5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Shift</span>
              </div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                Receiving live job updates from your region.
              </p>
            </div>

            <Link to="/driver/profile" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl border-2 border-white/10 overflow-hidden group-hover:border-brand transition-all bg-white/5 shadow-inner">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-brand" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1 line-clamp-1">{user.displayName || 'Driver'}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <p className="text-[8px] font-bold text-white/30 tracking-widest uppercase">PRO GOLD</p>
                </div>
              </div>
            </Link>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {!isOnboarding && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#191919] text-white px-6 py-4 flex items-center justify-between border-b border-white/5">
          <Link to="/driver" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs italic">L</span>
            </div>
            <span className="text-xs font-black uppercase italic tracking-tighter">Logistics</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-white/60">
               <Bell className="w-5 h-5" />
               <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-[#191919]" />
            </button>
            <Link to="/driver/profile" className="w-8 h-8 rounded-xl border border-white/10 overflow-hidden shadow-inner">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-brand" />
                </div>
              )}
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isOnboarding ? 'lg:ml-72 pt-20 lg:pt-0 pb-28 lg:pb-12' : 'pt-0 pb-0'} min-h-screen px-6 lg:px-12 transition-all`}>
        <div className={`max-w-6xl mx-auto ${!isOnboarding ? 'py-8 lg:py-12' : 'py-0'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isOnboarding && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#191919]/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2.5rem] shadow-2xl shadow-black/40 flex items-center justify-between">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                location.pathname === item.path ? 'text-brand scale-110' : 'text-white/30 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
          <Link 
            to="/"
            className="flex flex-col items-center gap-1 text-white/30 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
          </Link>
        </div>
      </div>
      )}
    </div>
  );
}
