import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/db';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  LogOut, 
  Settings as SettingsIcon, 
  Phone, 
  Save,
  Bike,
  Shield,
  CreditCard,
  MapPin,
  ChevronRight,
  TrendingUp,
  Award,
  X,
  Banknote,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence } from 'motion/react';

export default function DriverProfilePage() {
  const { user, profile, logOut, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [vehicle, setVehicle] = useState(profile?.driverInfo?.vehicleType || 'Bike');
  const [isSaving, setIsSaving] = useState(false);

  // Payout State
  const [payoutType, setPayoutType] = useState<'bank' | 'momo'>(profile?.payoutInfo?.type || 'momo');
  
  // Bank fields
  const [bankName, setBankName] = useState(profile?.payoutInfo?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payoutInfo?.accountNumber || '');
  const [routingNumber, setRoutingNumber] = useState(profile?.payoutInfo?.routingNumber || '');
  const [accountHolder, setAccountHolder] = useState(profile?.payoutInfo?.accountHolder || '');
  
  // MoMo fields
  const [momoNumber, setMomoNumber] = useState(profile?.payoutInfo?.momoNumber || '');
  const [momoNetwork, setMomoNetwork] = useState<'mtn' | 'telecel' | 'at'>(profile?.payoutInfo?.momoNetwork || 'mtn');
  const [momoName, setMomoName] = useState(profile?.payoutInfo?.momoName || '');
  
  const [isSavingPayout, setIsSavingPayout] = useState(false);
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
      await dbService.updateUserProfile(user.uid, { 
        phone,
        driverInfo: {
          ...profile?.driverInfo,
          vehicleType: vehicle 
        }
      });
      await refreshProfile();
      setIsEditing(false);
      toast.success("Driver profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShift = async () => {
    if (!user || !profile) return;
    try {
      const next = !profile.isOnline;
      await dbService.updateDriverStatus(user.uid, next);
      await refreshProfile();
      toast.success(next ? "You are now online!" : "You are offline");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSavePayout = async () => {
    if (!user) return;

    // Validation
    if (payoutType === 'momo') {
      if (!momoNumber || momoNumber.length < 10) {
        toast.error("Please enter a valid 10-digit MoMo number");
        return;
      }
      if (!momoName) {
        toast.error("Wallet name is required for verification");
        return;
      }
    } else {
      if (!bankName || !accountNumber || !accountHolder) {
        toast.error("Please fill in all required bank details");
        return;
      }
      if (accountNumber.length < 5) {
        toast.error("Account number seems too short");
        return;
      }
    }

    setIsSavingPayout(true);
    try {
      const payoutData = payoutType === 'bank' ? {
        type: 'bank' as const,
        bankName,
        accountNumber,
        routingNumber,
        accountHolder
      } : {
        type: 'momo' as const,
        momoNumber,
        momoNetwork,
        momoName
      };

      await dbService.updateUserProfile(user.uid, {
        payoutInfo: payoutData
      });
      await refreshProfile();
      toast.success("Payout credentials updated");
    } catch (error) {
      toast.error("Failed to update payout settings");
    } finally {
      setIsSavingPayout(false);
    }
  };

  if (!user || !profile?.isDriver) {
    return (
      <div className="p-8 text-center bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
           <Shield className="w-16 h-16 text-gray-200 mx-auto mb-6" />
           <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Access Restricted</h2>
           <p className="text-gray-500 text-sm mb-8">This portal is strictly for registered fleet members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#191919] text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand opacity-10 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-3xl overflow-hidden mb-6 ring-4 ring-white/10">
                 <img 
                   src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=ff4b33&color=fff`} 
                   alt={user.displayName || 'Driver'} 
                   className="w-full h-full object-cover"
                 />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1 leading-none">{user.displayName}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand mb-6">Master Courier</p>
              
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl mb-8 border border-white/10 group-hover:border-brand/20 transition-all">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Logistics Status</p>
                   <h4 className={`text-xs font-black italic uppercase tracking-tight ${profile.isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                     {profile.isOnline ? 'Ready for Orders' : 'Shift Inactive'}
                   </h4>
                </div>
                
                <button 
                  onClick={toggleShift}
                  className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1 flex items-center ${
                    profile.isOnline ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <motion.div 
                    layout
                    className="w-6 h-6 bg-white rounded-full shadow-lg"
                    initial={false}
                    animate={{ 
                      x: profile.isOnline ? 30 : 0
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-8 px-1">
                <div className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Real-time visibility: {profile.isOnline ? 'Public' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-soft">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Account Summary</h3>
            <div className="space-y-2">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <Award className="w-4 h-4 text-brand" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Rating</span>
                 </div>
                 <span className="text-sm font-black italic text-[#191919]">4.9</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <TrendingUp className="w-4 h-4 text-brand" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Total Trips</span>
                 </div>
                 <span className="text-sm font-black italic text-[#191919]">1,284</span>
               </div>
            </div>
          </div>
        </div>

        {/* Main Settings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-soft">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#191919]">Delivery Profile</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-brand font-black uppercase tracking-widest text-[10px] hover:underline"
              >
                {isEditing ? 'Cancel Edit' : 'Modify Settings'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <div className="p-4 bg-gray-50 rounded-2xl text-sm font-bold text-[#191919] border border-transparent">
                  {user.displayName}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registered Email</label>
                <div className="p-4 bg-gray-50 rounded-2xl text-sm font-bold text-[#191919] border border-transparent">
                  {user.email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fleet Phone</label>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 bg-white border border-brand/20 rounded-2xl text-sm font-bold text-[#191919] outline-none focus:ring-2 ring-brand/10 transition-all"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl text-sm font-bold text-[#191919] border border-transparent">
                    {profile.phone || 'Enter phone...'}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vehicle Type</label>
                {isEditing ? (
                  <select 
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full p-4 bg-white border border-brand/20 rounded-2xl text-sm font-bold text-[#191919] outline-none focus:ring-2 ring-brand/10 transition-all appearance-none"
                  >
                    <option value="Bike">Bicycle</option>
                    <option value="E-Bike">Electric Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Sedan / Hatchback</option>
                  </select>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl text-sm font-bold text-[#191919] border border-transparent flex items-center justify-between">
                    <span>{profile.driverInfo?.vehicleType || 'Bike'}</span>
                    <Bike className="w-4 h-4 text-brand" />
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10"
              >
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full py-5 bg-[#191919] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Fleet Profile
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-soft">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#191919]">Payout Credentials</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">GHANA PAYMENT GATEWAY CONFIG</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Secure Storage</span>
              </div>
            </div>

            {/* Current Payout Snapshot */}
            {profile.payoutInfo && (
              <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-soft">
                    {profile.payoutInfo.type === 'momo' ? <Smartphone className="w-6 h-6 text-brand" /> : <CreditCard className="w-6 h-6 text-brand" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-0.5">Active Method</p>
                    <h4 className="text-sm font-black italic uppercase tracking-tight text-[#191919]">
                      {profile.payoutInfo.type === 'momo' 
                        ? `${profile.payoutInfo.momoNetwork?.toUpperCase()} - ${profile.payoutInfo.momoNumber}`
                        : `${profile.payoutInfo.bankName} - ${profile.payoutInfo.accountNumber?.slice(-4).padStart(profile.payoutInfo.accountNumber.length, '•')}`}
                    </h4>
                  </div>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            )}

            {/* Method Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 max-w-sm">
              <button 
                onClick={() => setPayoutType('momo')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${payoutType === 'momo' ? 'bg-white text-brand shadow-sm' : 'text-gray-400'}`}
              >
                Mobile Money
              </button>
              <button 
                onClick={() => setPayoutType('bank')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${payoutType === 'bank' ? 'bg-white text-brand shadow-sm' : 'text-gray-400'}`}
              >
                Bank Transfer
              </button>
            </div>

            <div className="space-y-6">
              {payoutType === 'momo' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[ 
                      { id: 'mtn', label: 'MTN', color: '#ffcc00' },
                      { id: 'telecel', label: 'Telecel', color: '#e60000' },
                      { id: 'at', label: 'AT', color: '#003399' }
                    ].map((net) => (
                      <button
                        key={net.id}
                        onClick={() => setMomoNetwork(net.id as any)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${momoNetwork === net.id ? 'border-brand bg-brand/5' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: net.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{net.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Wallet Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="tel"
                          value={momoNumber}
                          onChange={(e) => setMomoNumber(e.target.value)}
                          placeholder="0XX XXX XXXX"
                          className="w-full p-4 pl-12 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Wallet Name</label>
                      <input 
                        type="text"
                        value={momoName}
                        onChange={(e) => setMomoName(e.target.value)}
                        placeholder="Legal name on wallet"
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Bank Name</label>
                      <input 
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Ecobank, GCB"
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Holder</label>
                      <input 
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Account Name"
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Number</label>
                      <input 
                        type="password"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sort Code</label>
                      <input 
                        type="text"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="Routing number"
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-[#191919] outline-none focus:bg-white focus:border-brand/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  onClick={handleSavePayout}
                  disabled={isSavingPayout}
                  className="w-full sm:w-auto px-10 py-5 bg-[#191919] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand/10 disabled:opacity-50"
                >
                  {isSavingPayout ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Commit Payout Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-6 bg-red-50 text-red-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100 flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Terminate Driver Session
          </button>
        </div>
      </div>
    </div>
  );
}
