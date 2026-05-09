import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShoppingBag, 
  Users, 
  Settings as SettingsIcon, 
  BarChart3,
  Bell,
  User as UserIcon,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-full flex items-center justify-center font-black uppercase italic tracking-tighter bg-gray-50 text-gray-400">Initialising Superuser Mode...</div>;
  if (!user || !profile?.isAdmin) return <Navigate to="/auth" />;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: UserIcon, label: 'Admin Profile', path: '/admin/profile' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: SettingsIcon, label: 'System Settings', path: '/seed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 flex flex-col lg:flex-row">
      <Toaster position="top-center" expand={true} richColors />
      
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-[#191919] text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-8">
          <Link to="/admin" className="flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all shadow-lg shadow-brand/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter uppercase italic leading-none">Command</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-brand mt-1">Admin Nexus</span>
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

        <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">System Online</span>
          </div>

          <Link to="/admin/profile" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl border-2 border-white/10 overflow-hidden group-hover:border-brand transition-all bg-white/5">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-brand" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1 truncate">{user.displayName || 'Admin'}</p>
              <p className="text-[8px] font-bold text-brand tracking-widest uppercase">Root Access</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#191919] text-white px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase italic tracking-tighter">Command</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-2 text-white/60">
             <Bell className="w-5 h-5" />
          </button>
          <Link to="/admin/profile" className="w-8 h-8 rounded-xl border border-white/10 overflow-hidden">
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

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen pt-20 lg:pt-0">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#191919]/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
          {navItems.slice(0, 3).map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                location.pathname === item.path ? 'text-brand scale-110' : 'text-white/30 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
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
    </div>
  );
}
