import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/db';
import { motion } from 'motion/react';
import { 
  Shield, 
  Mail, 
  LogOut, 
  Settings as SettingsIcon, 
  Phone, 
  Save,
  Lock,
  Activity,
  Server,
  Key,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { user, profile, logOut, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await dbService.updateUserProfile(user.uid, { phone });
      await refreshProfile();
      setIsEditing(false);
      toast.success("Admin profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !profile?.isAdmin) {
    return (
      <div className="p-8 text-center bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
           <Lock className="w-16 h-16 text-gray-200 mx-auto mb-6" />
           <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Unauthorised Access</h2>
           <p className="text-gray-500 text-sm mb-8">This portal requires elevated administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#191919]">Admin Profile</h1>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Administrator Control Panel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#191919] text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand opacity-10 rounded-full -translate-y-20 translate-x-20 blur-[100px]" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden mb-8 ring-8 ring-white/5 shadow-2xl">
                 <img 
                   src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=000&color=fff`} 
                   alt={user.displayName || 'Admin'} 
                   className="w-full h-full object-cover"
                 />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none">{user.displayName}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand text-white text-[8px] font-black uppercase tracking-widest rounded-full mb-8">
                <Shield className="w-3 h-3" />
                Root Administrator
              </div>
              
              <div className="w-full h-px bg-white/10 mb-8" />
              
              <div className="w-full space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                   <span>Admin Status</span>
                   <span className="text-emerald-500">Verified</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                   <span>Access Level</span>
                   <span className="text-white">Tier 1</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-soft">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">Security Metrics</h3>
            <div className="space-y-6">
               <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
                    <Key className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">2FA Status</p>
                   <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Enabled</p>
                 </div>
                 <ChevronRight className="w-4 h-4 ml-auto text-gray-200" />
               </div>
               
               <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
                    <Activity className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Audit Logs</p>
                   <p className="text-xs font-bold text-[#191919] uppercase tracking-widest">24 New Events</p>
                 </div>
                 <ChevronRight className="w-4 h-4 ml-auto text-gray-200" />
               </div>
            </div>
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-soft">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#191919]">Credential Hub</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="btn-primary py-3 px-6 text-[10px]"
              >
                {isEditing ? 'Discard Changes' : 'Update Credentials'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Admin Email</label>
                <div className="p-5 bg-gray-50 rounded-2xl flex items-center gap-4 border border-transparent">
                  <Mail className="w-5 h-5 text-brand" />
                  <span className="text-sm font-bold text-[#191919]">{user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Emergency Phone</label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-5 pl-14 bg-white border border-brand/20 rounded-2xl text-sm font-bold text-[#191919] outline-none focus:ring-4 ring-brand/5 transition-all"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-2xl flex items-center gap-4 border border-transparent">
                    <Phone className="w-5 h-5 text-brand" />
                    <span className="text-sm font-bold text-[#191919]">{profile.phone || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-12"
              >
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full py-6 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all shadow-2xl shadow-brand/20 flex items-center justify-center gap-4"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Commit Administrative Changes
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] group hover:border-brand/20 transition-all">
               <Server className="w-10 h-10 text-gray-300 mb-6 group-hover:text-brand transition-colors" />
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Backend Control</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Manage Cloud Functions, Webhooks, and API keys linked to AI services.</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] text-left group hover:bg-red-500 transition-all"
            >
               <LogOut className="w-10 h-10 text-red-300 mb-6 group-hover:text-white transition-colors" />
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-white">Admin Logout</h3>
               <p className="text-[10px] text-red-400 group-hover:text-white/80 font-bold uppercase tracking-widest">End authenticated admin session across all zones.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
