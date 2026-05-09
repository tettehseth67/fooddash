import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  ChevronRight, 
  Smartphone, 
  Building2, 
  Landmark,
  ArrowRight,
  ShieldCheck,
  Bike
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type OnboardingStep = 1 | 2 | 3 | 4;

export default function DriverOnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Profile
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Step 2: Vehicle
  const [vehicleType, setVehicleType] = useState<'bike' | 'motorcycle' | 'car'>(
    (profile?.driverInfo?.vehicleType as any) || 'motorcycle'
  );
  const [licensePlate, setLicensePlate] = useState(profile?.driverInfo?.licensePlate || '');

  // Step 3: Payout
  const [payoutType, setPayoutType] = useState<'bank' | 'momo'>(profile?.payoutInfo?.type || 'momo');
  const [bankName, setBankName] = useState(profile?.payoutInfo?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payoutInfo?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(profile?.payoutInfo?.accountHolder || '');
  const [momoNumber, setMomoNumber] = useState(profile?.payoutInfo?.momoNumber || '');
  const [momoNetwork, setMomoNetwork] = useState(profile?.payoutInfo?.momoNetwork || 'mtn');
  const [momoName, setMomoName] = useState(profile?.payoutInfo?.momoName || '');

  const handleNext = () => {
    if (step === 1 && (!displayName || !phone)) {
      toast.error("Please fill in your basic details");
      return;
    }
    if (step === 2 && !licensePlate) {
      toast.error("Please provide your license plate");
      return;
    }
    if (step === 3) {
      if (payoutType === 'bank' && (!bankName || !accountNumber || !accountHolder)) {
        toast.error("Please fill in all bank details");
        return;
      }
      if (payoutType === 'momo' && (!momoNumber || !momoName)) {
        toast.error("Please fill in all mobile money details");
        return;
      }
      completeOnboarding();
      return;
    }
    setStep((s) => (s + 1) as OnboardingStep);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updateData = {
        displayName,
        phone,
        driverInfo: {
          vehicleType,
          licensePlate,
          rating: 5.0,
          tripsCount: 0
        },
        payoutInfo: {
          type: payoutType,
          ...(payoutType === 'bank' ? {
            bankName,
            accountNumber,
            accountHolder
          } : {
            momoNumber,
            momoNetwork,
            momoName
          })
        }
      };

      await dbService.updateUserProfile(user.uid, updateData);
      
      // Also ensure driver document exists for marketplace
      await dbService.setUserDriver(user.uid, displayName);

      await refreshProfile();
      setStep(4);
      toast.success("Onboarding complete!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const vehicleOptions = [
    { id: 'bike', label: 'Bicycle', icon: Bike },
    { id: 'motorcycle', label: 'Motorcycle', icon: Truck },
    { id: 'car', label: 'Car', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-xl w-full">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === i ? 'w-8 bg-brand' : i < step ? 'w-4 bg-emerald-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-[3rem] p-10 lg:p-14 shadow-2xl shadow-gray-200/50 border border-gray-100"
        >
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-brand">
                  <User className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Welcome Aboard</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Let's set up your delivery profile</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Kwesi Mensah"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Contact Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233 24 000 0000"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <Truck className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Vehicle Gear</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">What will you be using for logistics?</p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  {vehicleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setVehicleType(opt.id as any)}
                      className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-2 transition-all ${
                        vehicleType === opt.id 
                          ? 'border-brand bg-orange-50 text-brand shadow-lg shadow-brand/10' 
                          : 'border-slate-100 bg-white text-gray-400 hover:border-slate-200'
                      }`}
                    >
                      <opt.icon className="w-8 h-8" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">License Plate / ID</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="GW-1234-23"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-emerald-500">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Secure Payouts</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Where should we send your earnings?</p>
              </div>

              <div className="space-y-8">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setPayoutType('momo')}
                    className={`flex-1 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      payoutType === 'momo' ? 'bg-white shadow-md text-brand' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Mobile Money
                  </button>
                  <button 
                    onClick={() => setPayoutType('bank')}
                    className={`flex-1 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      payoutType === 'bank' ? 'bg-white shadow-md text-brand' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>

                {payoutType === 'momo' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      {(['mtn', 'telecel', 'at'] as const).map((net) => (
                        <button
                          key={net}
                          onClick={() => setMomoNetwork(net)}
                          className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            momoNetwork === net 
                              ? 'bg-brand/5 border-brand text-brand shadow-sm' 
                              : 'bg-white border-slate-100 text-gray-400'
                          }`}
                        >
                          {net === 'telecel' ? 'Telecel' : net === 'at' ? 'AT' : 'MTN'}
                        </button>
                      ))}
                    </div>
                    <div className="relative group">
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                      <input 
                        type="tel"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="Wallet Number (054...)"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                      />
                    </div>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                      <input 
                        type="text"
                        value={momoName}
                        onChange={(e) => setMomoName(e.target.value)}
                        placeholder="Registered Wallet Name"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative group">
                      <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                      <input 
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                      />
                    </div>
                    <div className="relative group">
                      <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                      <input 
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account Number"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                      />
                    </div>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                      <input 
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Account Holder Name"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold transition-all outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 py-6 text-center">
              <div className="relative mb-12">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
                >
                  <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 animate-ping bg-emerald-500/20 rounded-[3rem]" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter italic">Mission Ready</h1>
                <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Your profile is fully verified. You access to the live marketplace is now active.
                </p>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => navigate('/driver')}
                  className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 hover:bg-brand transition-all shadow-xl shadow-black/10 group active:scale-95"
                >
                  Enter Marketplace
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="mt-12 flex flex-col gap-4">
              <button 
                onClick={handleNext}
                disabled={loading}
                className="w-full py-6 bg-brand text-white rounded-[2rem] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{step === 3 ? 'Complete Setup' : 'Next Step'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {step > 1 && (
                <button 
                  onClick={() => setStep((s) => (s - 1) as OnboardingStep)}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          )}
        </motion.div>

        {step < 4 && (
          <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Data</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
