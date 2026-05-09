import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { Order, Driver } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Package as PackageIcon, MapPin, CheckCircle, Navigation as NavIcon, Clock, TrendingUp, DollarSign, Award, Power, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DriverMap } from '../components/DriverMap';

export function DriverDashboard() {
  const { user } = useAuth();
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEarned: 0, totalDeliveries: 0 });

  useEffect(() => {
    if (!user) return;
    dbService.getDriver(user.uid).then(d => {
      setDriverProfile(d);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Available orders
    const unsubscribeAvailable = dbService.subscribeToAvailableOrders((orders) => {
      setAvailableOrders(orders);
      setLoading(false);
    });

    // My active orders
    const unsubscribeActive = dbService.subscribeToActiveDriverOrders(user.uid, (orders) => {
      setActiveOrders(orders);
    });

    // Stats and completed orders
    const unsubscribeStats = dbService.subscribeToDriverOrders(user.uid, (orders) => {
      const completed = orders
        .filter(o => o.status === 'completed')
        .sort((a, b) => {
          const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      const earned = completed.length * 5.50;
      setCompletedOrders(completed);
      setStats({
        totalEarned: earned,
        totalDeliveries: completed.length
      });
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeActive();
      unsubscribeStats();
    };
  }, [user]);

  const handleClaimJob = async (orderId: string) => {
    if (!driverProfile?.isOnline) {
      toast.error("You are currently OFFLINE", {
        description: "Go online to claim delivery jobs."
      });
      return;
    }
    try {
      await dbService.assignDriverToOrder(orderId, user?.uid || '');
      toast.success("Job claimed! Navigate to restaurant.");
    } catch (error) {
      toast.error("Failed to claim job. Might be taken.");
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      await dbService.updateOrderStatus(orderId, status);
      toast.success(`Success`, { description: `Order status updated to ${status}` });
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleToggleStatus = async () => {
    if (!user || !driverProfile) return;
    const newStatus = !driverProfile.isOnline;
    try {
      await dbService.updateDriverStatus(user.uid, newStatus);
      setDriverProfile({ ...driverProfile, isOnline: newStatus });
      toast.success(newStatus ? "Online" : "Offline", {
        description: newStatus ? "Get ready for jobs!" : "Shift ended.",
      });
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleConfirmPickup = (id: string) => handleUpdateStatus(id, 'delivering');
  const handleComplete = (id: string) => handleUpdateStatus(id, 'completed');

  const handleNavigate = (destination: string) => {
    const encodedDest = encodeURIComponent(destination);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`, '_blank');
  };

  const [driverPos, setDriverPos] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const calculateETA = (targetLat: number, targetLng: number) => {
    if (!driverPos) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (targetLat - driverPos.lat) * Math.PI / 180;
    const dLng = (targetLng - driverPos.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverPos.lat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Urban factoring: 1.4x road multiplier
    const roadDistance = distance * 1.4;
    const avgSpeedKmh = 25; // 25km/h avg urban speed
    const timeHours = roadDistance / avgSpeedKmh;
    const timeMinutes = Math.max(2, Math.round(timeHours * 60)); // Minimum 2 mins

    return {
      distance: roadDistance.toFixed(1),
      minutes: timeMinutes
    };
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      await dbService.clearDriverOrders(user.uid);
      setShowClearConfirm(false);
      toast.success("History cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await dbService.deleteOrder(orderId);
      setOrderToDelete(null);
      toast.success("Order removed from history");
    } catch (error) {
      toast.error("Failed to remove order");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">Live Marketplace</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scan and accept deliveries in your area</p>
        </div>

        <button 
          onClick={handleToggleStatus}
          className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${
            driverProfile?.isOnline 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-[1.02]' 
              : 'bg-red-500 text-white shadow-red-500/20 hover:scale-[1.02]'
          }`}
        >
          <Power className="w-4 h-4" />
          {driverProfile?.isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Map Integration */}
      <DriverMap availableOrders={availableOrders} activeOrders={activeOrders} />

      {/* Overview Cards Carousel */}
      {completedOrders.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Recent Success
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Your 3 latest completed deliveries</p>
            </div>
            <Link 
              to="/driver/earnings" 
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
            >
              Full History →
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory -mx-2 px-2">
            {completedOrders.slice(0, 3).map((order, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={order.id} 
                className="min-w-[320px] sm:min-w-[350px] bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex-shrink-0 group hover:border-brand/30 transition-all snap-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <PackageIcon className="w-24 h-24 rotate-12" />
                </div>

                <div className="flex items-center gap-5 mb-8 relative z-10">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Delivered</p>
                    <h4 className="text-lg font-black italic uppercase tracking-tight text-[#191919] truncate leading-none">{order.restaurantName}</h4>
                  </div>
                </div>
                
                <div className="flex items-end justify-between border-t border-gray-100 pt-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payout</p>
                    <p className="text-2xl font-black text-[#191919] tracking-tighter">${order.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed</p>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date((order.updatedAt?.seconds || order.createdAt?.seconds || 0) * 1000).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />
              </motion.div>
            ))}
            
            {/* Carousel End Cap / Hint */}
            <div className="min-w-[60px] flex-shrink-0" />
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Available', value: availableOrders.length, icon: PackageIcon, color: 'brand' },
          { label: 'Active Jobs', value: activeOrders.length, icon: NavIcon, color: 'blue' },
          { label: 'Total Earnings', value: `$${stats.totalEarned.toFixed(2)}`, icon: DollarSign, color: 'emerald' },
          { label: 'Completed', value: stats.totalDeliveries, icon: Award, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Active & Current Jobs (Left 2/3) */}
        <div className="xl:col-span-2 space-y-10">
          {activeOrders.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                  Active Mission
                </h2>
              </div>
              
              {activeOrders.map(order => (
                <motion.div 
                  layout
                  key={order.id}
                  className="bg-gray-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group"
                >
                  {/* ETA Badge */}
                  {(() => {
                    const target = order.status === 'assigned' 
                      ? { lat: order.restaurantLat, lng: order.restaurantLng } 
                      : { lat: order.lat, lng: order.lng };
                    
                    if (!target.lat || !target.lng) return null;
                    const eta = calculateETA(target.lat, target.lng);
                    if (!eta) return null;

                    return (
                      <div className="absolute top-10 right-10 z-20 flex flex-col items-end">
                         <div className="bg-brand text-white px-6 py-2 rounded-2xl flex items-center gap-2 shadow-xl shadow-brand/20 border border-white/10">
                            <Clock className="w-4 h-4 animate-pulse" />
                            <span className="text-sm font-black italic uppercase tracking-tight">{eta.minutes} MINS</span>
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#ff4b33]/60 mt-2 mr-2">≈ {eta.distance} km away</p>
                      </div>
                    );
                  })()}

                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                    <div className="flex-1 space-y-8">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full mb-3 inline-block">
                          {order.status}
                        </span>
                        <h3 className="text-3xl font-black tracking-tighter italic uppercase">#{order.id.slice(-6).toUpperCase()}</h3>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4 group/loc">
                          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-brand" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Pick up at</p>
                            <p className="font-bold text-lg">{order.restaurantName}</p>
                            <p className="text-[10px] text-white/50 font-medium mb-3">{order.restaurantAddress}</p>
                            {order.status === 'assigned' && (
                              <button 
                                onClick={() => handleNavigate(order.restaurantAddress || '')}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand hover:text-white transition-colors"
                              >
                                <NavIcon className="w-3 h-3" />
                                Launch GPS
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-4 group/loc">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <NavIcon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Deliver to</p>
                            <p className="font-bold text-lg">{order.address}</p>
                            {order.instructions && (
                              <div className="mt-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand mb-1">Rider Notes</p>
                                <p className="text-[11px] text-white/70 italic leading-relaxed">"{order.instructions}"</p>
                              </div>
                            )}
                            {order.status === 'delivering' && (
                              <button 
                                onClick={() => handleNavigate(order.address)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors"
                              >
                                <NavIcon className="w-3 h-3" />
                                Launch GPS
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64 flex flex-col gap-3">
                      {order.status === 'assigned' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'delivering')}
                          className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
                        >
                          Confirm Pickup
                        </button>
                      )}
                      {order.status === 'delivering' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="w-full py-5 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand/20 hover:scale-105 transition-all"
                        >
                          Confirm Final Delivery
                        </button>
                      )}
                      <Link 
                        to={`/track/${order.id}`}
                        className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2"
                      >
                         View Details
                      </Link>
                    </div>
                  </div>
                  <PackageIcon className="absolute bottom-[-20%] right-[-10%] w-64 h-64 text-white/5 -rotate-12" />
                </motion.div>
              ))}
            </section>
          )}

          {/* Available Jobs Pipeline */}
          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              Available Opportunities
            </h2>

            {!driverProfile?.isOnline ? (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-16 text-center shadow-xl shadow-gray-200/20">
                <Power className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Network Disconnected</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">Go online to start receiving work.</p>
                <button 
                  onClick={handleToggleStatus}
                  className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  Enter Marketplace
                </button>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-16 text-center shadow-xl shadow-gray-200/20">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-6 h-6 text-brand animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scanning for live jobs...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableOrders.map(order => (
                  <motion.div 
                    layout
                    key={order.id}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 group hover:border-brand/40 transition-all"
                  >
                    <div className="flex justify-between items-start mb-8">
                       <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-brand" />
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Payout</p>
                          <p className="text-xl font-black text-emerald-600">+$5.50</p>
                          {order.restaurantLat && order.restaurantLng && (
                            <div className="mt-1">
                              {(() => {
                                const eta = calculateETA(order.restaurantLat, order.restaurantLng);
                                return eta ? (
                                  <p className="text-[8px] font-black uppercase tracking-widest text-brand">
                                    {eta.distance} km • {eta.minutes}m away
                                  </p>
                                ) : null;
                              })()}
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                       <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Restaurant</p>
                         <p className="font-bold text-sm line-clamp-1">{order.restaurantName}</p>
                         <p className="text-[10px] text-gray-400 line-clamp-1 italic">{order.restaurantAddress}</p>
                       </div>
                       <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Items</p>
                         <p className="font-bold text-sm">{order.items.length} Packages</p>
                       </div>
                       {order.instructions && (
                         <div className="pt-3 border-t border-gray-50">
                           <p className="text-[10px] text-gray-400 line-clamp-1 italic italic">
                             <span className="font-black uppercase tracking-widest text-[8px] mr-1">Note:</span> 
                             "{order.instructions}"
                           </p>
                         </div>
                       )}
                    </div>

                    <button 
                      onClick={() => handleClaimJob(order.id)}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-all shadow-xl shadow-black/10"
                    >
                      Accept Job
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar (Analytics/History) */}
        <aside className="space-y-10">
          <div className="bg-[#191919] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
               <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-brand" />
                 Performance
               </h3>
               
               <div className="space-y-6">
                 <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Shift Earned</p>
                   <p className="text-3xl font-black tracking-tighter text-emerald-400">${stats.totalEarned.toFixed(2)}</p>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="w-3/4 h-full bg-brand" />
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-white/30">Target: $100</span>
                   <span className="text-brand">75%</span>
                 </div>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl -mr-16 -mt-16 group-hover:bg-brand/20 transition-all duration-700" />
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Recent Shifts</h3>
               {completedOrders.length > 0 && (
                 <button 
                   onClick={() => setShowClearConfirm(true)}
                   className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                   title="Clear History"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
             </div>
             {completedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-100">
                  <Clock className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">No recent data</p>
                </div>
             ) : (
                <div className="space-y-4">
                  {completedOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/20 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                         </div>
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{order.restaurantName}</p>
                           <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-emerald-600">+$5.50</p>
                         <button 
                           onClick={() => setOrderToDelete(order.id)}
                           className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                           title="Delete Order"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  ))}
                  <Link 
                    to="/driver/earnings"
                    className="block text-center py-3 text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                  >
                    View Earnings Dashboard
                  </Link>
                </div>
             )}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {(showClearConfirm || orderToDelete) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowClearConfirm(false);
                setOrderToDelete(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 italic">
                {orderToDelete ? 'Delete Order?' : 'Wipe Shift Data?'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 leading-relaxed">
                {orderToDelete 
                  ? "This will permanently remove this order record from your history. This action cannot be undone."
                  : "This will permanently delete your local shift history. Earnings totals will remain in the main database."}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => orderToDelete ? handleDeleteOrder(orderToDelete) : handleClearHistory()}
                  className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  {orderToDelete ? 'Confirm Delete' : 'Confirm Wipe'}
                </button>
                <button 
                  onClick={() => {
                    setShowClearConfirm(false);
                    setOrderToDelete(null);
                  }}
                  className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                >
                  Nevermind
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

