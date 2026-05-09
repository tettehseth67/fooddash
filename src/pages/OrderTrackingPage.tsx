import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import { Order, OrderStatus, Driver } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock as ClockIcon, MapPin, Package as PackageIcon, Bike, ChevronLeft, Phone, Star, MessageSquare, AlertCircle, Trash2, Navigation as NavIcon, Send } from 'lucide-react';
import { format } from 'date-fns';
import { getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { ChatBox } from '../components/ChatBox';

const STAGES: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  { status: 'pending', label: 'Order Received', icon: PackageIcon, description: 'We have received your order' },
  { status: 'preparing', label: 'Preparing', icon: ClockIcon, description: 'The restaurant is preparing your food' },
  { status: 'assigned', label: 'Rider Assigned', icon: Bike, description: 'A rider is heading to the restaurant' },
  { status: 'delivering', label: 'On the Way', icon: NavIcon, description: 'Your rider is on their way to you' },
  { status: 'completed', label: 'Delivered', icon: CheckCircle2, description: 'Enjoy your meal!' }
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = dbService.subscribeToOrder(id, async (data) => {
      setOrder(data);
      if (data?.driverId) {
        const driverData = await dbService.getDriver(data.driverId);
        setDriver(driverData);
      } else {
        setDriver(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [id]);

  const handleSimulateNext = async () => {
    if (!order) return;
    const currentIdx = STAGES.findIndex(s => s.status === order.status);
    if (currentIdx < STAGES.length - 1) {
      const nextStatus = STAGES[currentIdx + 1].status;
      
      // If moving to delivering, auto-assign a driver for demo purposes
      if (nextStatus === 'delivering' && !order.driverId) {
        const driversSnap = await getDocs(collection(db, 'drivers'));
        if (!driversSnap.empty) {
          const driverId = driversSnap.docs[0].id;
          const orderRef = doc(db, 'orders', order.id);
          await updateDoc(orderRef, { driverId });
        }
      }
      
      await dbService.updateOrderStatus(order.id, nextStatus);
    }
  };

  const handleReset = async () => {
    if (!order) return;
    await dbService.updateOrderStatus(order.id, 'pending');
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!order) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Order not found</h1>
      <Link to="/orders" className="text-orange-500 hover:underline">Back to orders</Link>
    </div>
  );

  const currentStageIdx = STAGES.findIndex(s => s.status === order.status);
  const isPending = order.status === 'pending';
  
  // Calculate if order is within 5 minutes of creation
  const isRecentlyCreated = order.createdAt?.toDate 
    ? (Date.now() - order.createdAt.toDate().getTime()) < 5 * 60 * 1000 
    : true;

  const canCancel = isPending && isRecentlyCreated; 
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const showRating = isCompleted && !order.isRated && !ratingDismissed;

  const getEstimatedMinutes = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '45-55';
      case 'preparing': return '30-45';
      case 'assigned': return '20-30';
      case 'delivering': return '10-15';
      case 'completed': return 'Delivered';
      case 'cancelled': return '--';
      default: return '25-35';
    }
  };

  const handleCancelOrder = async () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    try {
      await dbService.updateOrderStatus(order.id, 'cancelled');
      setShowCancelConfirm(false);
      toast.success("Order cancelled successfully");
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error('Could not cancel order', {
        description: 'It might already be in preparation.'
      });
    }
  };

  const handleDeleteOrder = async () => {
    toast.error('Danger Zone', {
      description: 'Are you sure you want to delete this order record?',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await dbService.deleteOrder(order.id);
            toast.success('Order deleted');
            window.location.href = '/orders';
          } catch (error) {
            console.error('Deletion failed:', error);
            toast.error('Failed to delete order');
          }
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AnimatePresence>
        {showRating && (
          <ReviewForm 
            order={order} 
            driver={driver} 
            onComplete={() => setOrder(prev => prev ? { ...prev, isRated: true } : null)} 
            onClose={() => setRatingDismissed(true)}
          />
        )}
        {showCancelConfirm && (
          <CancelConfirmationModal 
            onConfirm={confirmCancel} 
            onClose={() => setShowCancelConfirm(false)} 
          />
        )}
        {showChat && (
          <ChatBox 
            orderId={order.id} 
            driverName={driver?.name} 
            onClose={() => setShowChat(false)} 
          />
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/orders" className="text-gray-400 hover:text-orange-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">ID: #{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            {(isCancelled || isPending) && (
              <button 
                onClick={handleDeleteOrder}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Order Record"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {canCancel && (
              <button 
                onClick={handleCancelOrder}
                className="text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 transition-all shadow-sm active:scale-95"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 mb-8 overflow-hidden relative">
          {/* Top Horizontal Progress Bar - Enhanced */}
          {order.status !== 'cancelled' && (
            <div className="px-8 pt-10">
              <div className="flex justify-between mb-4 relative px-2">
                {STAGES.map((s, idx) => {
                  const isDone = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  const Icon = s.icon;
                  
                  return (
                    <div key={s.status} className="flex flex-col items-center relative z-10">
                      <motion.div 
                        initial={false}
                        animate={{ 
                          backgroundColor: isDone || isCurrent ? '#ff4b33' : '#f3f4f6',
                          scale: isCurrent ? 1.2 : 1,
                          borderColor: isCurrent ? 'rgba(255, 75, 51, 0.2)' : 'transparent'
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all shadow-sm ${
                          isDone || isCurrent ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter mt-2 transition-colors ${
                        isCurrent ? 'text-brand' : isDone ? 'text-gray-900' : 'text-gray-300'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}

                {/* Background Connecting Lines */}
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-100 -z-0" />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                  className="absolute top-5 left-10 h-0.5 bg-brand -z-0"
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          <div className="p-8 relative z-10">
            {order.status === 'cancelled' ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Order Cancelled</h2>
                <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">This order has been cancelled and is no longer being processed. If you didn't request this, please contact support.</p>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                  START NEW ORDER
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div className="flex gap-8">
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Estimated Arrival</h2>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-black text-[#191919] tabular-nums">
                          {getEstimatedMinutes(order.status)}
                        </span>
                        {order.status !== 'completed' && order.status !== 'cancelled' && <span className="text-lg font-black text-gray-400 italic">min</span>}
                      </div>
                    </div>
                    <div className="w-px h-12 bg-gray-100 hidden sm:block" />
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Current Status</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-brand uppercase italic tracking-tighter">
                          {order.status === 'assigned' ? 'Rider at Restaurant' : order.status.replace('_', ' ')}
                        </span>
                      </div>
                      {driver && order.status !== 'completed' && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          Assigned: {driver.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="bg-brand p-4 rounded-[1.5rem] text-white relative z-10 shadow-lg shadow-brand/40">
                      {order.status === 'delivering' ? <Bike className="w-8 h-8" /> : <PackageIcon className="w-8 h-8" />}
                    </div>
                  </div>
                </div>

                <div className="relative pl-2">
                  {/* Vertical Progress Line */}
                  <div className="absolute left-[23px] top-6 bottom-6 w-1 bg-gray-100 rounded-full" />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute left-[23px] top-6 w-1 bg-brand rounded-full transition-all origin-top" 
                    style={{ maxHeight: 'calc(100% - 48px)' }}
                  />

                  <div className="space-y-12">
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIdx;
                      const isActive = idx === currentStageIdx;
                      const Icon = stage.icon;

                      return (
                        <div key={stage.status} className="flex items-start space-x-8 relative group">
                          <div className="relative">
                            {isActive && (
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                className="absolute inset-0 bg-brand/20 rounded-full"
                              />
                            )}
                            <div className={`relative z-10 w-12 h-12 rounded-[1.25rem] border-4 border-white flex items-center justify-center transition-all duration-500 shadow-md ${
                              isCompleted ? 'bg-brand text-white scale-110 shadow-brand/20' : 'bg-gray-50 text-gray-300 ring-1 ring-gray-100'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                          
                          <div className={`flex-1 pt-1 transition-all duration-500 ${isActive ? 'translate-x-2' : ''}`}>
                            <h3 className={`text-lg font-black italic uppercase tracking-tighter transition-colors ${
                              isCompleted ? 'text-[#191919]' : 'text-gray-300'
                            } ${isActive ? 'text-brand' : ''}`}>
                              {stage.label}
                            </h3>
                            <p className={`text-xs font-bold leading-relaxed transition-colors ${
                              isCompleted ? 'text-gray-500' : 'text-gray-300'
                            }`}>
                              {stage.description}
                            </p>
                          </div>

                          {isActive && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-brand/10 text-brand rounded-full border border-brand/20"
                            >
                              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest">In Progress</span>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-[2]">
             <PackageIcon className="w-96 h-96" />
          </div>
        </div>

        {/* Live Map Mock */}
        {order.status === 'delivering' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 h-80 relative"
          >
            <div className="absolute inset-0 bg-slate-50">
              {/* Fake Map Grid */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              
              {/* Fake Route */}
              <svg className="absolute inset-0 w-full h-full">
                <motion.path
                  d="M 100 100 Q 200 150 400 100 T 700 200"
                  fill="none"
                  stroke="#E4E4E7"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M 100 100 Q 200 150 400 100 T 700 200"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.6 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
              </svg>

              {/* Rider Pin */}
              <motion.div 
                animate={{ 
                  x: [400, 420, 400],
                  y: [100, 110, 100]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute left-[400px] top-[100px] -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-brand rounded-full"
                  />
                  <div className="bg-brand text-white p-3 rounded-full shadow-2xl relative z-10">
                    <Bike className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              {/* Destination Pin */}
              <div className="absolute left-[700px] top-[200px] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-emerald-500 text-white p-3 rounded-full shadow-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              {/* Top Banner */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Live Tracking Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

          <div className="mb-8">
            {driver ? (
              <div className="bg-[#191919] text-white rounded-[2.5rem] p-8 shadow-2xl shadow-black/20 flex flex-col sm:flex-row items-center sm:items-stretch gap-8 relative overflow-hidden group">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand/20 transition-colors" />
                
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/5 group-hover:ring-brand/20 transition-all">
                    <img src={driver.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={driver.name} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-brand text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest border-2 border-[#191919]">
                    Active
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Your Rider</p>
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-brand transition-colors">{driver.name}</h4>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:border-brand/30 transition-colors">
                      <Star className="w-4 h-4 text-brand fill-current" />
                      <span className="text-sm font-black italic">{driver.rating}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Rating</span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                      <Bike className="w-4 h-4 text-brand" />
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">E-Bike Specialist</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => window.location.href = `tel:${driver.phone || '5550000000'}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-[#191919] px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand hover:text-white transition-all shadow-xl active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Rider</span>
                  </button>
                  <button 
                    id="order-message-rider-btn"
                    onClick={() => setShowChat(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-brand/10 text-brand border border-brand/20 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand hover:text-white transition-all active:scale-95 shadow-lg shadow-brand/5 relative group/msg"
                  >
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full border-2 border-[#191919] z-20" />
                    <MessageSquare className="w-4 h-4 group-hover/msg:rotate-12 transition-transform" />
                    <span>Live Chat</span>
                  </button>
                </div>
              </div>
            ) : order.status !== 'cancelled' && order.status !== 'completed' && (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  <Bike className="w-8 h-8 text-gray-300 animate-bounce" />
                </div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter text-gray-400">Finding a rider...</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Expected shortly</p>
              </div>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Delivery Instructions</span>
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Option</p>
                <p className="text-sm font-bold text-gray-900">{order.deliveryOption}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Address</p>
                <p className="text-sm text-gray-600 leading-relaxed font-medium mb-4">
                  {order.address}
                </p>
              </div>
              {order.instructions && (
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex gap-3">
                  <div className="shrink-0 text-orange-500 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Rider Instructions</p>
                    <p className="text-sm text-[#191919] font-bold leading-relaxed italic">"{order.instructions}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4">Order Summary</h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.quantity}x {item.name}</span>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-50 flex justify-between font-bold text-orange-500">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Simulation Controls */}
        <div className="bg-gray-900 rounded-3xl p-6 text-white text-center">
          <h4 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-widest">Demo Sandbox (Tester)</h4>
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleSimulateNext}
              className="bg-orange-500 px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors"
              disabled={currentStageIdx >= STAGES.length - 1}
            >
              Advance Step
            </button>
            <button 
              onClick={handleReset}
              className="bg-gray-800 px-6 py-2 rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              Reset Status
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-4">
            * This panel is for demonstration. It uses real-time Firestore updates to simulate a restaurant/rider changing status.
          </p>
        </div>
      </div>
    </div>
  );
}

function CancelConfirmationModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-[#191919] uppercase tracking-tighter italic mb-3">Cancel Order?</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
            Are you sure you want to cancel this order? This action cannot be undone once processed.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all shadow-xs"
            >
              Go Back
            </button>
            <button 
              onClick={onConfirm}
              className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-100 active:scale-95"
            >
              Cancel Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewForm({ order, driver, onComplete, onClose }: { order: Order; driver: Driver | null; onComplete: () => void; onClose: () => void }) {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (restaurantRating === 0) {
      toast.error('Rating required', {
        description: 'Please rate the restaurant to continue.'
      });
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting your review...");
    try {
      await dbService.submitReview(
        order.userId,
        order.restaurantId,
        restaurantRating,
        order.id,
        driver?.id,
        driverRating > 0 ? driverRating : undefined,
        comment
      );
      toast.success("Review submitted!", {
        id: loadingToast,
        description: "Thank you for your feedback."
      });
      onComplete();
    } catch (error) {
      console.error('Review failed:', error);
      toast.error("Submission failed", {
        id: loadingToast
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl shadow-black/20"
      >
        <div className="bg-orange-500 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2 leading-tight">Yum! How was it?</h2>
            <p className="text-orange-100 font-bold opacity-90">Help us improve your next meal</p>
          </div>
          <Star className="absolute right-0 top-0 w-48 h-48 -mr-12 -mt-12 text-white/5" />
        </div>

        <div className="p-8 space-y-8">
          {/* Restaurant Rating */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Rate the Food</label>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl border border-gray-100">
              <span className="font-bold text-gray-700">Kitchen</span>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRestaurantRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 ${restaurantRating >= star ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Driver Rating */}
          {driver && (
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Rate your Rider</label>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <img src={driver.photoURL} className="w-8 h-8 rounded-full object-cover" />
                  <span className="font-bold text-gray-700">{driver.name}</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setDriverRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star className={`w-8 h-8 ${driverRating >= star ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Any feedback? (Optional)</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made it great? Or what could be better?"
              className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-2 border-transparent focus:border-orange-500 transition-all outline-none min-h-[100px]"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || restaurantRating === 0}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-100"
          >
            {isSubmitting ? 'Sending...' : 'Submit Rating'}
          </button>

          <button 
            onClick={onClose}
            className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
