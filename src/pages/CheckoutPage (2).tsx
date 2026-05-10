import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, CreditCard, ShieldCheck, CheckCircle2, DoorOpen, User, Bike, Clock, ShoppingBag, ChevronRight, Lock, Info } from 'lucide-react';
import { DeliveryOption } from '../types';
import { toast } from 'sonner';

export function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, profile, signIn, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState(profile?.addresses?.[0] || '');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('Hand to me');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (items.length > 0) {
      dbService.getRestaurant(items[0].restaurantId).then(setRestaurant);
    }
  }, [items]);

  if (items.length === 0 && !orderId) {
    return <Navigate to="/" />;
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to place your order.",
      });
      navigate('/auth', { state: { from: location } });
      return;
    }

    if (!address || !address.trim()) {
      toast.error("Missing Address", {
        description: "Please enter a valid delivery location.",
      });
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing your order...");
    
    try {
      const restaurantId = items[0]?.restaurantId || 'unknown';
      const finalTotal = total + (restaurant?.deliveryFee || 0);
      const id = await dbService.createOrder(
        user.uid, 
        restaurantId, 
        items, 
        finalTotal, 
        address, 
        deliveryOption, 
        instructions,
        restaurant?.name,
        restaurant?.address,
        restaurant?.lat,
        restaurant?.lng
      );
      
      // Save address if not already saved
      if (!profile?.addresses?.includes(address)) {
        const currentAddresses = profile?.addresses || [];
        await dbService.updateUserProfile(user.uid, { 
          addresses: [...currentAddresses, address]
        });
        await refreshProfile();
      }

      toast.success("Order Placed!", {
        id: loadingToast,
        description: "Enjoy your meal!",
      });
      setOrderId(id);
      clearCart();
    } catch (error) {
      toast.error("Order failed", {
        id: loadingToast,
        description: "There was an issue processing your payment.",
      });
      console.error('Order placement failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed!</h1>
        <p className="text-gray-500 mb-12 text-lg">Your delicious meal is on its way. You can track its status in real-time.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(`/track/${orderId}`)}
            className="bg-orange-500 text-white px-12 py-4 rounded-3xl font-bold hover:bg-orange-600 transition-all text-lg shadow-xl"
          >
            Track Order
          </button>
          <button 
            onClick={() => navigate('/orders')}
            className="bg-gray-100 text-gray-600 px-8 py-4 rounded-3xl font-bold hover:bg-gray-200 transition-all text-lg"
          >
            Order History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <section className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-xs border border-orange-100">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#191919] uppercase tracking-tighter italic">Delivery Address</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Where are we heading?</p>
              </div>
            </div>
            <div className="relative group">
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full street address, apartment number, and city..."
                className="w-full min-h-[140px] p-6 bg-gray-50/50 rounded-[2rem] border-2 border-gray-100 focus:border-brand focus:bg-white transition-all outline-hidden text-gray-900 font-bold placeholder:text-gray-300 placeholder:font-medium text-sm leading-relaxed"
              />
              <div className="absolute top-6 right-6 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <MapPin className="w-5 h-5 text-brand animate-bounce" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-6 sm:mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-xs border border-orange-100">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#191919] uppercase tracking-tighter italic">Delivery Instructions</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Help our riders find you</p>
              </div>
            </div>
            <div className="relative group">
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please call upon arrival, leave with neighbor if not home, or ring bell #4..."
                className="w-full min-h-[100px] p-6 bg-gray-50/50 rounded-[2rem] border-2 border-gray-100 focus:border-brand focus:bg-white transition-all outline-hidden text-gray-900 font-bold placeholder:text-gray-300 placeholder:font-medium text-sm leading-relaxed"
              />
            </div>
          </section>

          <section className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-xs border border-orange-100">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#191919] uppercase tracking-tighter italic">Delivery Method</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">How should we drop it off?</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              <button
                onClick={() => setDeliveryOption('Hand to me')}
                className={`group/btn relative p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 overflow-hidden ${
                  deliveryOption === 'Hand to me'
                    ? 'border-brand bg-orange-50/50 ring-4 ring-brand/5'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover/btn:scale-110 duration-500 ${
                  deliveryOption === 'Hand to me' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-gray-50 text-gray-400'
                }`}>
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-[#191919] uppercase tracking-tight italic text-sm sm:text-base">Hand to me</p>
                    {deliveryOption === 'Hand to me' && (
                      <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Direct Exchange</p>
                </div>
              </button>

              <button
                onClick={() => setDeliveryOption('Leave at door')}
                className={`group/btn relative p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 overflow-hidden ${
                  deliveryOption === 'Leave at door'
                    ? 'border-brand bg-orange-50/50 ring-4 ring-brand/5'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover/btn:scale-110 duration-500 ${
                  deliveryOption === 'Leave at door' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-gray-50 text-gray-400'
                }`}>
                  <DoorOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-[#191919] uppercase tracking-tight italic text-sm sm:text-base">Leave at door</p>
                    {deliveryOption === 'Leave at door' && (
                      <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Contactless Drop</p>
                </div>
              </button>
            </div>

            {/* Hint overlay */}
            <div className="mt-8 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="p-2 bg-white rounded-xl shadow-xs">
                  <CreditCard className="w-4 h-4 text-brand" />
               </div>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Riders follow strict hygiene protocols for both methods</p>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Payment Method</h3>
            </div>
            <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-8 bg-black rounded-md flex items-center justify-center font-bold text-white text-[10px]">VISA</div>
                <div>
                  <p className="font-bold text-gray-900">•••• 4242</p>
                  <p className="text-sm text-orange-600">Secure default card</p>
                </div>
              </div>
              <button className="text-sm font-bold text-orange-500 hover:underline">Change</button>
            </div>
          </section>

          <section className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-xs border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#191919] uppercase tracking-tighter italic">Secure Checkout</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-emerald-600/60">Verified & Encrypted</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">SSL Secure</span>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1">Encrypted Payment</h4>
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">Your credit card details are never stored on our servers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1">Buyer Protection</h4>
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">Funds are only released once the restaurant accepts your order.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-gray-100 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                  <span className="text-[8px] font-black uppercase tracking-widest">PCI DSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Mastercard ID Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Visa Secure</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#191919] text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 sticky top-24 shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                Order Summary
              </h3>
              
              <div className="space-y-6 mb-10 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                       <span className="text-[10px] font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center italic shrink-0">
                         {item.quantity}x
                       </span>
                       <span className="text-sm font-bold text-white/80 leading-tight">{item.name}</span>
                    </div>
                    <span className="text-sm font-black tabular-nums italic">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8 pt-8 border-t border-white/10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">${restaurant?.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pt-6 flex justify-between items-baseline">
                  <span className="text-lg sm:text-xl font-black italic uppercase tracking-tighter">Total</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl sm:text-3xl font-black text-brand tabular-nums italic">
                      ${(total + (restaurant?.deliveryFee || 0)).toFixed(2)}
                    </span>
                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Incl. VAT & delivery</span>
                  </div>
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full scale-150 animate-pulse" />
                <div className="relative bg-brand text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </div>
              </button>

              <div className="mt-8 flex items-center justify-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Verified Secure Connection</span>
              </div>
            </div>

            {/* Decorative BG */}
            <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
              <ShoppingBag className="w-64 h-64" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
