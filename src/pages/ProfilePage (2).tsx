import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  LogOut, 
  Settings as SettingsIcon, 
  Package as PackageIcon, 
  MapPin, 
  ChevronRight, 
  Navigation as NavIcon, 
  Heart, 
  CreditCard, 
  Clock, 
  Star, 
  Phone, 
  Save,
  Flame,
  Bike,
  Landmark,
  Smartphone,
  Building2,
  Wallet
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { toast } from 'sonner';
import { Restaurant } from '../types';

export function ProfilePage() {
  const { user, profile, logOut, refreshProfile } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, lastOrderDate: '' });
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  
  // Payout states
  const [payoutType, setPayoutType] = useState<'bank' | 'momo'>(profile?.payoutInfo?.type || 'momo');
  const [bankName, setBankName] = useState(profile?.payoutInfo?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payoutInfo?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(profile?.payoutInfo?.accountHolder || '');
  const [routingNumber, setRoutingNumber] = useState(profile?.payoutInfo?.routingNumber || '');
  const [momoNumber, setMomoNumber] = useState(profile?.payoutInfo?.momoNumber || '');
  const [momoNetwork, setMomoNetwork] = useState(profile?.payoutInfo?.momoNetwork || 'mtn');
  const [momoName, setMomoName] = useState(profile?.payoutInfo?.momoName || '');

  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setPayoutType(profile.payoutInfo?.type || 'momo');
      setBankName(profile.payoutInfo?.bankName || '');
      setAccountNumber(profile.payoutInfo?.accountNumber || '');
      setAccountHolder(profile.payoutInfo?.accountHolder || '');
      setRoutingNumber(profile.payoutInfo?.routingNumber || '');
      setMomoNumber(profile.payoutInfo?.momoNumber || '');
      setMomoNetwork(profile.payoutInfo?.momoNetwork || 'mtn');
      setMomoName(profile.payoutInfo?.momoName || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = dbService.subscribeToUserOrders(user.uid, (orders) => {
      const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);
      const lastOrder = orders[0];
      setStats({
        totalOrders: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt?.toDate ? lastOrder.createdAt.toDate().toLocaleDateString() : 'N/A'
      });
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    async function loadFavorites() {
      if (profile?.favorites && profile.favorites.length > 0) {
        setLoadingFavorites(true);
        const data = await dbService.getFavoriteRestaurants(profile.favorites);
        setFavorites(data);
        setLoadingFavorites(false);
      } else {
        setFavorites([]);
      }
    }
    loadFavorites();
  }, [profile?.favorites]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updateData: any = { phone };
      
      if (profile?.isDriver) {
        updateData.payoutInfo = {
          type: payoutType,
          ...(payoutType === 'bank' ? {
            bankName,
            accountNumber,
            accountHolder,
            routingNumber
          } : {
            momoNumber,
            momoNetwork,
            momoName
          })
        };
      }

      await dbService.updateUserProfile(user.uid, updateData);
      await refreshProfile();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-surface p-12 rounded-[3rem] border border-gray-100 shadow-soft">
          <UserIcon className="w-16 h-16 mx-auto text-gray-200 mb-6" />
          <h2 className="text-3xl font-black text-[#191919] uppercase tracking-tighter italic mb-4">Account Access</h2>
          <p className="text-gray-500 font-medium mb-8">Please sign in to view your profile and manage your orders.</p>
          <Link to="/" className="btn-primary w-full inline-block">Back to Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Profile Header */}
      <div className="bg-gray-50 border-b border-gray-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-brand/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=ff4b33&color=fff`} 
                alt={user.displayName || 'User'} 
                className="w-40 h-40 rounded-[2.5rem] object-cover ring-8 ring-white shadow-2xl relative z-10"
              />
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="absolute -bottom-2 -right-2 p-4 bg-[#191919] text-white rounded-2xl shadow-xl hover:bg-brand transition-all active:scale-95 z-20"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-5xl font-black text-[#191919] tracking-tighter italic uppercase">{user.displayName || 'Foodie'}</h1>
                {profile?.isAdmin && (
                  <span className="inline-block bg-brand/10 text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand/20 w-fit mx-auto md:mx-0">Admin</span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 font-black tracking-widest text-[10px] uppercase">
                <div className="flex items-center space-x-1.5 px-3 py-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand" />
                  <span className="text-[#191919] normal-case tracking-normal">{user.email}</span>
                </div>
                <div className="hidden sm:block text-brand/20">•</div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand" />
                  <span>Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2024'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
            {/* Account Details / Editing View */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic">Account Details</h2>
                <div className="h-px flex-1 bg-gray-100 mx-6" />
              </div>
              
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-12"
                  >
                    <div className="bg-[#191919] text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative">
                      <div className="absolute top-8 right-8">
                        <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                          <LogOut className="w-6 h-6 rotate-180" />
                        </button>
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3 text-white">
                        <SettingsIcon className="w-6 h-6 text-brand" />
                        Update Profile
                      </h3>
                      
                      <div className="space-y-12">
                        {/* Section: Basic Settings */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand mb-6">Basic Information</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">Phone Number</label>
                                <div className="relative">
                                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                  <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section: Payout Information (Only for Drivers) */}
                        {profile?.isDriver && (
                          <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-8">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Secure Payout Settings</p>
                                <h4 className="text-xl font-black italic uppercase tracking-tight mt-1">Earnings Withdrawal</h4>
                              </div>
                              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => setPayoutType('momo')}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    payoutType === 'momo' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-white'
                                  }`}
                                >
                                  Mobile Money
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPayoutType('bank')}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    payoutType === 'bank' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-white'
                                  }`}
                                >
                                  Bank Account
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {payoutType === 'momo' ? (
                                <>
                                  <div className="space-y-6">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">MoMo Network</label>
                                      <div className="grid grid-cols-3 gap-3">
                                        {(['mtn', 'telecel', 'at'] as const).map((net) => (
                                          <button
                                            key={net}
                                            type="button"
                                            onClick={() => setMomoNetwork(net)}
                                            className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                              momoNetwork === net 
                                                ? 'bg-brand/10 border-brand text-brand' 
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                            }`}
                                          >
                                            {net === 'telecel' ? 'Telecel' : net === 'at' ? 'AT' : 'MTN'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">MoMo Number</label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="tel"
                                          value={momoNumber}
                                          onChange={(e) => setMomoNumber(e.target.value)}
                                          placeholder="054 000 0000"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-6">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2 italic">Registered Name (MoMo)</label>
                                      <div className="relative">
                                        <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="text"
                                          value={momoName}
                                          onChange={(e) => setMomoName(e.target.value)}
                                          placeholder="Full Name as on ID"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                    <div className="p-6 bg-brand/5 border border-brand/10 rounded-2xl">
                                      <p className="text-[10px] text-brand font-bold italic leading-relaxed">
                                        Make sure the name matches your official ID to avoid delays in processing your weekly payouts.
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="space-y-6">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">Bank Name</label>
                                      <div className="relative">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="text"
                                          value={bankName}
                                          onChange={(e) => setBankName(e.target.value)}
                                          placeholder="e.g. EcoBank, GCB"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">Account Number</label>
                                      <div className="relative">
                                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="text"
                                          value={accountNumber}
                                          onChange={(e) => setAccountNumber(e.target.value)}
                                          placeholder="000000000000"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-6">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">Account Holder Name</label>
                                      <div className="relative">
                                        <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="text"
                                          value={accountHolder}
                                          onChange={(e) => setAccountHolder(e.target.value)}
                                          placeholder="Full Name as on ID"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2 italic">Routing / Swift Code</label>
                                      <div className="relative">
                                        <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                                        <input
                                          type="text"
                                          value={routingNumber}
                                          onChange={(e) => setRoutingNumber(e.target.value)}
                                          placeholder="Optional"
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-brand/50 outline-none text-white transition-all"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-6 pt-8 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="bg-brand text-white py-5 px-12 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand/20"
                          >
                            {isSaving ? (
                              <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                <span>Save All Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</p>
                        <p className="text-sm font-bold text-[#191919]">{user.email}</p>
                      </div>
                    </div>
                    <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Phone className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone Number</p>
                        <p className="text-sm font-bold text-[#191919]">{profile?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    {profile?.isDriver && profile?.payoutInfo && (
                      <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 flex items-center gap-6 col-span-1 sm:col-span-2">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          {profile.payoutInfo.type === 'bank' ? (
                            <Landmark className="w-5 h-5 text-brand" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-brand" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payout Method</p>
                          <p className="text-sm font-bold text-[#191919]">
                            {profile.payoutInfo.type === 'bank' 
                              ? `${profile.payoutInfo.bankName} Account`
                              : `${profile.payoutInfo.momoNetwork?.toUpperCase()} Wallet`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">ID Target</p>
                          <p className="text-sm font-bold text-[#191919]">
                            {profile.payoutInfo.type === 'bank'
                              ? `•••• ${profile.payoutInfo.accountNumber?.slice(-4)}`
                              : profile.payoutInfo.momoNumber}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            {/* Quick Stats */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic">Personal Dashboard</h2>
                <div className="h-px flex-1 bg-gray-100 mx-6" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 hover:shadow-soft transition-all group">
                   <PackageIcon className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Orders</p>
                   <p className="text-2xl font-black text-[#191919] italic">{stats.totalOrders}</p>
                </div>
                <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 hover:shadow-soft transition-all group">
                   <CreditCard className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Spent</p>
                   <p className="text-2xl font-black text-[#191919] italic">${stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="p-8 bg-surface rounded-[2rem] border border-gray-100 hover:shadow-soft transition-all group">
                   <Clock className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Order</p>
                   <p className="text-2xl font-black text-[#191919] italic">{stats.lastOrderDate === 'N/A' ? 'No orders yet' : stats.lastOrderDate}</p>
                </div>
              </div>
            </section>

            {/* Account Hub */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic">Account Hub</h2>
                <div className="h-px flex-1 bg-gray-100 mx-6" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-soft hover:border-brand/30 transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-brand/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-all">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Payment Methods</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Securely manage your credit cards and digital wallets</p>
                  <button className="text-brand font-black uppercase tracking-widest text-[10px] flex items-center group-hover:translate-x-1 transition-transform">
                    CONFIGURE <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-soft hover:border-brand/30 transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-brand/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-all">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Saved Addresses</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Manage your home, office and recurring delivery spots</p>
                  <button className="text-brand font-black uppercase tracking-widest text-[10px] flex items-center group-hover:translate-x-1 transition-transform">
                    MANAGE {profile?.addresses?.length || 0} PLACES <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </section>

            {/* Favorite Restaurants */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic">Liked Hubs</h2>
                <Heart className="w-5 h-5 text-brand fill-brand" />
              </div>
              
              {loadingFavorites ? (
                <div className="py-20 flex flex-col items-center justify-center bg-gray-50 rounded-[2.5rem]">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading your taste profile...</p>
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favorites.map(restaurant => (
                    <Link 
                      key={restaurant.id} 
                      to={`/restaurant/${restaurant.id}`}
                      className="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:border-brand/10 transition-all group shadow-soft"
                    >
                      <img src={restaurant.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                      <div className="min-w-0">
                        <h4 className="font-black text-xl text-[#191919] uppercase tracking-tighter group-hover:text-brand transition-colors mb-1 truncate italic">{restaurant.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">{restaurant.category}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-1.5 px-3 py-1 bg-brand/5 rounded-full">
                            <Star className="w-3.5 h-3.5 text-brand fill-brand" />
                            <span className="text-xs font-black text-brand italic">{restaurant.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1 px-3 py-1 bg-gray-50 rounded-full text-gray-400 group-hover:text-brand transition-colors">
                             <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-surface rounded-[2.5rem] p-16 text-center border border-gray-100 border-dashed">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Heart className="w-8 h-8 text-gray-200" />
                   </div>
                   <p className="text-gray-400 font-medium italic mb-6">You haven't added any favorites yet.</p>
                   <Link to="/" className="btn-primary inline-flex items-center gap-2">
                     EXPLORE MENU
                   </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Account Settings List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft p-4">
              <div className="p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Management</h3>
                <div className="space-y-2">
                  <Link to="/orders" className="flex items-center justify-between p-5 hover:bg-surface rounded-2xl transition-all group font-black uppercase tracking-widest text-[10px]">
                    <div className="flex items-center space-x-4">
                      <PackageIcon className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
                      <span>Order History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-200" />
                  </Link>

                  <div className="flex items-center justify-between p-5 hover:bg-surface rounded-2xl transition-all group font-black uppercase tracking-widest text-[10px] cursor-not-allowed opacity-50">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="w-5 h-5 text-gray-300 transition-colors" />
                      <span>Payment Methods</span>
                    </div>
                    <Shield className="w-4 h-4 text-gray-100" />
                  </div>

                  <div className="flex items-center justify-between p-5 hover:bg-surface rounded-2xl transition-all group font-black uppercase tracking-widest text-[10px]">
                    <div className="flex items-center space-x-4">
                      <MapPin className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
                      <span>Saved Locations</span>
                    </div>
                    <span className="bg-surface px-2 py-0.5 rounded text-[8px] text-gray-400 font-black">{profile?.addresses?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-50 my-2" />

              <div className="p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">System Access</h3>
                <div className="space-y-4">
                  {profile?.isAdmin ? (
                    <Link to="/admin" className="block w-full p-6 bg-gray-900 border border-gray-100 rounded-3xl hover:bg-brand transition-all shadow-xl group text-center relative overflow-hidden">
                       <div className="relative z-10 flex flex-col items-center text-white">
                         <Shield className="w-8 h-8 mb-3 text-brand group-hover:text-white" />
                         <span className="font-black uppercase tracking-widest text-[10px]">Switch to Admin Mode</span>
                       </div>
                    </Link>
                  ) : null}

                  {profile?.isDriver || profile?.isAdmin ? (
                    <Link 
                      to="/driver"
                      className="w-full py-6 bg-emerald-500 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest text-center shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all group"
                    >
                      <Bike className="w-5 h-5 group-hover:animate-bounce" />
                      Switch to Driver Mode
                    </Link>
                  ) : (
                    <div className="p-8 bg-brand/5 border border-brand/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="relative z-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Earn with us</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Join our fleet and start delivering today.</p>
                        <button 
                          onClick={async () => {
                            try {
                              await dbService.setUserDriver(user.uid, user.displayName || 'Rider');
                              await refreshProfile();
                              toast.success("Welcome to the fleet!");
                            } catch (error) {
                              toast.error("Failed to join fleet");
                            }
                          }}
                          className="w-full py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Become a Driver
                        </button>
                      </div>
                      <Bike className="absolute -bottom-4 -right-4 w-24 h-24 text-brand/5 rotate-12 group-hover:text-brand/10 transition-colors" />
                    </div>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 p-6 text-[#191919] hover:text-white font-black uppercase tracking-[0.2em] text-[10px] bg-red-50 border border-red-50 hover:bg-red-500 hover:border-red-500 rounded-3xl transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Terminate Session</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Referral / Promo Card */}
            <div className="bg-[#191919] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand opacity-10 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <Flame className="w-10 h-10 text-brand mb-6" />
                <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-tight">Spread the <span className="text-brand">Fire</span></h4>
                <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed italic">Refer a friend and get $0.00 off your next order. Every flame matters.</p>
                <button className="w-full bg-white text-[#191919] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand hover:text-white transition-all">
                  GET YOUR CODE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
