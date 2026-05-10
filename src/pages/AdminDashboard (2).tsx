import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { Order, Restaurant, Promotion, MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Plus, 
  Settings, 
  BarChart3,
  ExternalLink,
  PackageCheck,
  Trash2,
  Star,
  Clock as ClockIcon,
  Edit3,
  ChevronLeft,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'restaurants' | 'drivers'>('orders');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState({ totalSales: 0, ordersCount: 0, totalUsers: 0, activePromos: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null);

  const loadData = async () => {
    if (!profile?.isAdmin) return;

    try {
      const [ordersSnap, restaurantsSnap, usersSnap, promosSnap, driversSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'restaurants')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'promotions')),
        getDocs(collection(db, 'drivers'))
      ]);

      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);

      setStats({
        totalSales,
        ordersCount: orders.length,
        totalUsers: usersSnap.size,
        activePromos: promosSnap.size
      });

      setRecentOrders(orders.slice(0, 5));
      setRestaurants(restaurantsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant)));
      setDrivers(driversSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Dashboard load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleDeleteRestaurant = async (id: string) => {
    try {
      await dbService.deleteRestaurant(id);
      setRestaurants(prev => prev.filter(r => r.id !== id));
      setRestaurantToDelete(null);
      toast.success("Restaurant hub decommissioned successfully.");
    } catch (error) {
      toast.error('Failed to delete restaurant');
    }
  };

  const handleClearOrders = async () => {
    toast.warning("Confirm Action", {
      description: "Permanently clear all platform orders?",
      action: {
        label: "Clear All",
        onClick: async () => {
          setLoading(true);
          try {
            await dbService.clearAllOrders();
            loadData();
            toast.success("Platform orders purged.");
          } catch (error) {
            toast.error('Failed to clear orders');
          } finally {
            setLoading(false);
          }
        },
      },
    });
  };

  if (authLoading) return null; // Handled by AdminLayout
  if (!profile?.isAdmin) return null; // Handled by AdminLayout

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="bg-white border-b border-gray-100 shadow-xs mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-[#191919] mb-1 tracking-tighter uppercase italic">Control Panel</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Operational Overview & Assets</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/seed" className="p-3 bg-surface text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-brand transition-all shadow-sm" title="Init Tools">
              <Settings className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setIsAddingRestaurant(true)}
              className="btn-primary !px-6 !py-3 flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              NEW HUB
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
         <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Platform Growth</h3>
                  <p className="text-xs text-gray-400 font-medium">Revenue across all active hubs</p>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">+12% vs LY</div>
                  <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                    <BarChart3 className="w-5 h-5" />
                  </div>
               </div>
            </div>
            
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={restaurants.map(r => ({ name: r.name.length > 8 ? r.name.slice(0, 8) + '..' : r.name, sales: Math.floor(Math.random() * 500) + 100 }))}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                     <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 800 }} 
                     />
                     <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                        {restaurants.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ff4b2b' : '#ff7a18'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="space-y-6">
            <StatCard label="Total Revenue" value={`$${stats.totalSales.toFixed(2)}`} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
            <StatCard label="System Orders" value={stats.ordersCount.toString()} icon={ShoppingBag} color="bg-red-50 text-brand" />
            <StatCard label="Live Fleet" value={drivers.length.toString()} icon={Users} color="bg-emerald-50 text-emerald-600" />
            <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center">
                     <PieChartIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand">Business Pulse</h4>
               </div>
               <p className="text-sm font-medium leading-relaxed italic text-white/70 mb-6">"Operational efficiency is currently at 94% across all regions."</p>
               <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-brand" />
               </div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 mb-8 border-b border-gray-100 pb-px">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-2 font-bold text-sm tracking-tight transition-all relative ${activeTab === 'orders' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Activity Log
          {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('restaurants')}
          className={`pb-4 px-2 font-bold text-sm tracking-tight transition-all relative ${activeTab === 'restaurants' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Restaurants
          {activeTab === 'restaurants' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('drivers')}
          className={`pb-4 px-2 font-bold text-sm tracking-tight transition-all relative ${activeTab === 'drivers' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Fleet
          {activeTab === 'drivers' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'orders' ? (
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <PackageCheck className="w-5 h-5 text-brand" />
                  <span>Recent Platform Activity</span>
                </h3>
                {recentOrders.length > 0 && (
                  <button 
                    onClick={handleClearOrders}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 group"
                    title="Clear All Orders"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline group-hover:block transition-all">Clear All</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                         #{order.id.slice(-4).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 capitalize font-medium">{order.status}</p>
                          <div className="flex gap-1">
                            {['preparing', 'delivering', 'completed'].includes(order.status) === false && (
                               <button 
                                 onClick={() => dbService.updateOrderStatus(order.id, 'preparing').then(loadData)}
                                 className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-black"
                               >
                                 Prep
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Link to={`/track/${order.id}`} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-500 transition-colors" title="Track/Manage">
                         <ExternalLink className="w-4 h-4" />
                       </Link>
                       <button 
                         onClick={async () => {
                           toast.error('Purge Order', {
                             description: `Delete order #${order.id.slice(-4).toUpperCase()} permanently?`,
                             action: {
                               label: 'Purge',
                               onClick: async () => {
                                 try {
                                   await dbService.deleteOrder(order.id);
                                   loadData();
                                   toast.success("Order record purged.");
                                 } catch (error) {
                                   toast.error("Failed to purge order.");
                                 }
                               }
                             }
                           });
                         }}
                         className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                         title="Delete Record"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && <p className="text-center text-gray-500 py-10">No orders found.</p>}
              </div>
            </div>
          ) : activeTab === 'restaurants' ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-900 flex items-center space-x-3 italic uppercase tracking-tighter">
                  <ShoppingBag className="w-6 h-6 text-brand" />
                  <span>Restaurant Inventory</span>
                </h3>
                <span className="bg-red-50 text-brand px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{restaurants.length} Registered</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {restaurants.map(restaurant => (
                  <motion.div 
                    layout
                    key={restaurant.id} 
                    className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-soft hover:shadow-card transition-all duration-500 group relative"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img src={restaurant.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90" />
                      <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 to-transparent" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900">
                        {restaurant.category}
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center space-x-1.5 text-white">
                          <Star className="w-3.5 h-3.5 text-brand fill-current" />
                          <span className="text-sm font-black italic">{restaurant.rating} Rating</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">{restaurant.name}</h4>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <ClockIcon className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{restaurant.deliveryTime} delivery</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex -space-x-3">
                           <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                             ON
                           </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setEditingRestaurant(restaurant)}
                            className="p-2.5 text-gray-400 hover:text-brand hover:bg-red-50 rounded-xl transition-all"
                            title="Edit Info"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setRestaurantToDelete(restaurant.id)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedRestaurantId(restaurant.id)}
                            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand transition-all shadow-xl shadow-gray-200 hover:shadow-red-200"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Menu</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-8">
                <Users className="w-5 h-5 text-brand" />
                <span>Delivery Fleet ({drivers.length})</span>
              </h3>
              <div className="space-y-4">
                {drivers.map(driver => (
                  <div key={driver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-brand uppercase italic">
                        {driver.id.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">User ID: {driver.id}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Partner</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#494949]">Online</span>
                    </div>
                  </div>
                ))}
                {drivers.length === 0 && <p className="text-center text-gray-500 py-10">No drivers registered yet.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Menu Manager Overlay */}
        <AnimatePresence>
          {restaurantToDelete && (
            <ConfirmDeleteModal 
              name={restaurants.find(r => r.id === restaurantToDelete)?.name || 'this restaurant'}
              onConfirm={() => handleDeleteRestaurant(restaurantToDelete)}
              onCancel={() => setRestaurantToDelete(null)}
            />
          )}
          {selectedRestaurantId && (
            <MenuManager 
              restaurantId={selectedRestaurantId} 
              restaurantName={restaurants.find(r => r.id === selectedRestaurantId)?.name || ''}
              onClose={() => setSelectedRestaurantId(null)} 
            />
          )}
          {(isAddingRestaurant || editingRestaurant) && (
            <RestaurantModal 
              restaurant={editingRestaurant || undefined}
              onClose={() => {
                setIsAddingRestaurant(false);
                setEditingRestaurant(null);
                loadData();
              }}
            />
          )}
        </AnimatePresence>

        {/* Quick Links / Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
            <h3 className="text-lg font-bold mb-6">Manage Entities</h3>
            <div className="space-y-3">
              <SidebarLink label="Restaurants" count={restaurants.length} />
              <SidebarLink label="Drivers" count={1} />
              <SidebarLink label="Categories" count={6} />
              <SidebarLink label="Promotions" count={stats.activePromos} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center space-x-4"
    >
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</h4>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
}

function SidebarLink({ label, count }: any) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group">
      <span className="text-gray-300 group-hover:text-white transition-colors">{label}</span>
      <span className="bg-brand text-white text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

function ConfirmDeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden p-10 text-center"
      >
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand shadow-lg shadow-brand/5">
          <Trash2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Confirm Deletion</h2>
        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10">
          Are you sure you want to remove <span className="text-brand font-black italic">"{name}"</span>? 
          This action will permanently delete the restaurant hub. Menu items will remain but will be orphaned.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onCancel}
            className="bg-gray-50 border border-gray-100 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 text-gray-400 transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={onConfirm}
            className="bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all"
          >
            Delete Hub
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RestaurantModal({ restaurant, onClose }: { restaurant?: Restaurant; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Restaurant>>(restaurant || {
    name: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    rating: 4.5,
    deliveryTime: '20-30 min',
    category: 'Burger',
    isFeatured: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (restaurant?.id) {
        await dbService.updateRestaurant(restaurant.id, formData);
      } else {
        await dbService.createRestaurant(formData as Omit<Restaurant, 'id'>);
      }
      onClose();
    } catch (error) {
      alert('Failed to save restaurant');
    } finally {
      setLoading(false);
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
        className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
            {restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Restaurant Name</label>
              <input 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
              <textarea 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none h-20"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {['Burger', 'Pizza', 'Asian', 'Healthy', 'Desserts', 'Sushi', 'Pasta'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Delivery Time</label>
              <input 
                placeholder="20-30 min"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                value={formData.deliveryTime}
                onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
              <input 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input 
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
              className="w-5 h-5 rounded accent-brand"
            />
            <label htmlFor="isFeatured" className="text-sm font-bold text-gray-700">Recommend this restaurant (Featured)</label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-50 border border-transparent py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand shadow-xl disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Details'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function MenuManager({ restaurantId, restaurantName, onClose }: { restaurantId: string; restaurantName: string; onClose: () => void }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const items = await dbService.getMenuItems(restaurantId);
      setMenu(items);
    } catch (error) {
      console.error("Failed to load menu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  const handleDelete = async (itemId: string) => {
    toast.error('Delete Item', {
      description: 'Remove this dish from the menu permanently?',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await dbService.deleteMenuItem(itemId);
            loadMenu();
            toast.success("Menu item removed.");
          } catch (error) {
            toast.error("Failed to delete item.");
          }
        }
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      if (editingItem.id) {
        await dbService.updateMenuItem(editingItem.id, editingItem);
      } else {
        await dbService.createMenuItem({
          ...editingItem as Omit<MenuItem, 'id'>,
          restaurantId
        });
      }
      setEditingItem(null);
      loadMenu();
    } catch (error) {
      alert('Failed to save item');
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
        className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Menu Manager</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 shadow-sm">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Current Dishes</h3>
                <button 
                  onClick={() => setEditingItem({ name: '', description: '', price: 0, imageUrl: '', category: '', isVegetarian: false, isSpicy: false, restaurantId })}
                  className="bg-red-50 text-brand px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100"
                >
                  New Item
                </button>
              </div>
              
              {loading ? (
                <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">Loading Menu...</div>
              ) : (
                menu.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center space-x-4">
                      <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-black text-gray-900 text-sm uppercase">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">${item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setEditingItem(item)} className="p-2 text-gray-400 hover:text-brand hover:bg-red-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form */}
            <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
              {editingItem ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-brand mb-8">
                    {editingItem.id ? 'Edit Dish' : 'Create Dish'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dish Name</label>
                      <input 
                        required
                        className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                        value={editingItem.name}
                        onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
                      <textarea 
                        className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none h-24"
                        value={editingItem.description}
                        onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Price ($)</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                          value={editingItem.price}
                          onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                        <input 
                          required
                          placeholder="Main, Appetizer, etc"
                          className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                          value={editingItem.category || ''}
                          onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
                      <input 
                        required
                        className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none"
                        value={editingItem.imageUrl}
                        onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={editingItem.isVegetarian || false}
                          onChange={e => setEditingItem({...editingItem, isVegetarian: e.target.checked})}
                          className="w-4 h-4 rounded accent-emerald-500"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-emerald-600 transition-colors">Vegetarian</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={editingItem.isSpicy || false}
                          onChange={e => setEditingItem({...editingItem, isSpicy: e.target.checked})}
                          className="w-4 h-4 rounded accent-red-500"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-600 transition-colors">Spicy</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setEditingItem(null)}
                      className="flex-1 bg-white border border-gray-100 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand shadow-xl"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 bg-white rounded-[1.25rem] border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
                    <Plus className="w-6 h-6 text-gray-200" />
                  </div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tight mb-2">No Dish Selected</h4>
                  <p className="text-gray-400 text-xs font-medium italic">Click an item to edit or create a new one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
