import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, ChevronRight, Sparkles, ShieldCheck, User as UserIcon, Flame, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AuthPage() {
  const { user, signIn, signInWithEmail, resetPassword, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<'selection' | 'customer-email'>('selection');
  const from = (location.state as any)?.from?.pathname || "/";

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error('Email auth error:', error);
      let errorMessage = 'Invalid email or password.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password combination.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network connection failed. Please check your internet connection or disable any ad-blockers that might be blocking Firebase.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 sm:p-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl h-full min-h-[750px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100"
      >
        {/* Left Side: Cinematic Branding */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-[#0a0a0a] text-white relative overflow-hidden group">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#FF6321,transparent_70%)] opacity-20" />
          <motion.div 
            animate={{ 
              rotate: [0, 5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -bottom-20 w-[600px] h-[600px] bg-brand/10 blur-[120px] rounded-full" 
          />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center rotate-[-8deg] shadow-lg shadow-brand/20 group-hover:rotate-0 transition-all duration-500">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-black italic tracking-tighter text-white uppercase tracking-[-0.05em] leading-none">Awaa <br/> Express</span>
            </Link>
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_10px_rgba(255,99,33,0.5)]" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Logistics Engine v2.04</span>
            </motion.div>
            
            <h1 className="text-[100px] font-black text-white italic leading-[0.82] tracking-tighter mb-10 select-none">
              SPEED <br /> 
              IS OUR <br />
              <span className="text-brand">EDGE.</span>
            </h1>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">Active Fleet</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black italic tabular-nums">42</span>
                  <span className="text-xs font-bold text-white/30 uppercase italic">Couriers</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Avg. Time</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black italic tabular-nums">28</span>
                  <span className="text-xs font-bold text-white/30 uppercase italic">Minutes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-xs text-white/40 font-bold max-w-[200px] leading-relaxed italic">
              Empowering Ghanaian commerce through high-performance delivery.
            </p>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-brand hover:border-brand/40 transition-colors cursor-help">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Right Side: Auth UI */}
        <div className="p-8 sm:p-20 flex flex-col justify-center relative overflow-hidden bg-white">
          <div className="max-w-md mx-auto w-full relative z-10">
            <div className="mb-12 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-4 py-1.5 bg-brand/5 border border-brand/10 rounded-full mb-6"
              >
                <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Biometric Grade Security
                </p>
              </motion.div>
              <h2 className="text-5xl font-black text-[#0a0a0a] uppercase tracking-tighter italic mb-4 leading-none">Authentication</h2>
              <p className="text-gray-500 font-medium text-lg">Secure access to the logistics network.</p>
            </div>

            <AnimatePresence mode="wait">
              {view === 'selection' ? (
                <motion.div 
                  key="selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4 px-2">Primary Access</p>
                      <button
                        onClick={() => setView('customer-email')}
                        className="w-full group relative flex items-center justify-between bg-white border-2 border-brand/20 p-6 rounded-[2.5rem] hover:border-brand hover:shadow-2xl hover:shadow-brand/10 transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-brand/5 rounded-2xl flex items-center justify-center shadow-sm border border-brand/10 group-hover:scale-110 transition-all">
                            <UserIcon className="w-7 h-7 text-brand" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-black uppercase tracking-tight italic text-base text-[#191919]">Order Food</h4>
                            <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Customer Portal</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    </div>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-6 text-[9px] font-black text-gray-300 tracking-[0.5em]">Logistics Network</span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        className="w-full group relative flex items-center justify-between bg-[#0a0a0a] p-6 rounded-[2.5rem] hover:bg-[#111] hover:shadow-2xl hover:shadow-black/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-brand/40 transition-all">
                            <Lock className="w-7 h-7 text-brand" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-black uppercase tracking-tight italic text-base text-white">Fleet Terminal</h4>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Courier & Admin Entry</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="customer-email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setView('selection')}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand flex items-center gap-2 mb-4 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to selection
                  </button>

                  <form onSubmit={handleEmailAuth} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Registered Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="your@email.com"
                          className="w-full bg-zinc-50 border-2 border-gray-100 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold focus:border-brand focus:bg-white outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Account Password</label>
                        <button 
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline"
                        >
                          Recover Password
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="••••••••"
                          className="w-full bg-zinc-50 border-2 border-gray-100 rounded-[1.5rem] py-4 pl-14 pr-14 text-sm font-bold focus:border-brand focus:bg-white outline-none transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {(error || message) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                      >
                        {error ? <AlertCircle className="w-5 h-5 shrink-0" /> : <ShieldCheck className="w-5 h-5 shrink-0" />}
                        <p className="text-[11px] font-bold">{error || message}</p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] italic hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Authorizing...' : 'Sign In Now'}
                    </button>
                  </form>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-6 text-[9px] font-black text-gray-300 tracking-[0.5em]">Other Options</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full group flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 rounded-[1.5rem] hover:border-brand/20 transition-all font-bold text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8 border-t border-gray-50 flex flex-col gap-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand/5 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic">
                  Logistics access requires a verified email. By signing in, you agree to our centralized <span className="text-[#191919]">terms and conditions</span>.
                </p>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                <span>© {new Date().getFullYear()} Awaa Express</span>
                <div className="flex gap-4">
                  <span className="hover:text-brand cursor-pointer transition-colors">Privacy</span>
                  <span className="hover:text-brand cursor-pointer transition-colors">Safety</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

