import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Clock, 
  MapPin,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  Landmark,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';

export function DriverEarningsPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = dbService.subscribeToDriverOrders(user.uid, (updatedOrders) => {
      setOrders(updatedOrders.filter(o => o.status === 'completed'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const totalEarnings = orders.reduce((acc, order) => acc + (order.total * 0.15), 0); // Assuming 15% commission
  const todayEarnings = orders
    .filter(o => {
        const date = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any)?.toDate?.() || new Date();
        return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    })
    .reduce((acc, order) => acc + (order.total * 0.15), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 pb-12">
      {/* Earnings Overview */}
      <div className="mb-12">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-8">Earnings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#191919] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-white/40 mb-4">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Available Balance</span>
              </div>
              <p className="text-5xl font-black tracking-tighter mb-2">${totalEarnings.toFixed(2)}</p>
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">+12.5% vs last week</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-3xl -mr-32 -mt-32 group-hover:bg-brand/20 transition-all duration-700" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Today</p>
              <p className="text-2xl font-black tracking-tighter">${todayEarnings.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Deliveries</p>
              <p className="text-2xl font-black tracking-tighter">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Destination Info */}
      {profile?.payoutInfo && (
        <div className="mb-12 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-200/40 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand/5 rounded-[2rem] flex items-center justify-center">
                 {profile.payoutInfo.type === 'bank' ? (
                   <Landmark className="w-7 h-7 text-brand" />
                 ) : (
                   <Smartphone className="w-7 h-7 text-brand" />
                 )}
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Primary Settlement Method</p>
                 <h4 className="text-xl font-black italic uppercase tracking-tight">
                   {profile.payoutInfo.type === 'bank' 
                     ? `${profile.payoutInfo.bankName} Account` 
                     : `${profile.payoutInfo.momoNetwork?.toUpperCase()} Wallet`}
                 </h4>
              </div>
           </div>
           <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">ID / Destination</p>
              <p className="text-lg font-black text-[#191919] tracking-tight">
                {profile.payoutInfo.type === 'bank'
                  ? `•••• ${profile.payoutInfo.accountNumber?.slice(-4)}`
                  : profile.payoutInfo.momoNumber}
              </p>
           </div>
        </div>
      )}

      {/* History */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Recent Payouts</h2>
        <button className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No earnings history yet.</p>
           </div>
        ) : (
          orders.sort((a,b) => (b.createdAt as any)?.seconds - (a.createdAt as any)?.seconds).map((order) => {
            const date = order.createdAt instanceof Date ? order.createdAt : (order.createdAt as any)?.toDate?.() || new Date();
            return (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/20 flex items-center justify-between group hover:border-brand/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-brand/5 transition-colors">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Delivery Fee</p>
                    <p className="text-[10px] text-gray-400 font-medium">{format(date, 'MMM d, h:mm a')} • #{order.id.slice(-4).toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tracking-tighter text-emerald-600">+${(order.total * 0.15).toFixed(2)}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">Settled</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
