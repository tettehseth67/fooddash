import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    activeDrivers: 0
  });

  const [revenueData, setRevenueData] = useState([
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ]);

  const [categoryData] = useState([
    { name: 'Burgers', value: 400 },
    { name: 'Sushi', value: 300 },
    { name: 'Pizza', value: 300 },
    { name: 'Healthy', value: 200 },
  ]);

  const COLORS = ['#ff4b33', '#191919', '#6366f1', '#10b981'];

  useEffect(() => {
    // In a real app, we'd fetch actual aggregated metrics
    // For now, let's keep the mock data for visualization but try to get some real counts
    async function loadStats() {
      // Logic to get counts would go here
    }
    loadStats();
  }, []);

  return (
    <div className="p-8 lg:p-12 space-y-12 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#191919] mb-2 leading-none">System Intelligence</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Real-time platform performance & logistics data</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
            <Calendar className="w-4 h-4 text-brand" />
            Last 7 Days
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#191919] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-lg shadow-black/10">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value="$128,430.00" 
          change="+12.5%" 
          isPositive={true} 
          icon={DollarSign}
        />
        <KPICard 
          title="Total Orders" 
          value="4,284" 
          change="+18.2%" 
          isPositive={true} 
          icon={ShoppingBag}
        />
        <KPICard 
          title="Active Users" 
          value="18,920" 
          change="-2.4%" 
          isPositive={false} 
          icon={Users}
        />
        <KPICard 
          title="Delivery Fleet" 
          value="156" 
          change="+4.1%" 
          isPositive={true} 
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-soft">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-[#191919]">Revenue Velocity</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-brand rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Sales</span>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4b33" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff4b33" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#191919', 
                    border: 'none', 
                    borderRadius: '16px', 
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ff4b33" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-soft">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-[#191919] mb-10">Popular Cuisines</h3>
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#191919]">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-gray-400">{Math.round(item.value / 1200 * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, isPositive, icon: Icon }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-soft group hover:border-brand/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black tracking-widest ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-[#191919] leading-none">{value}</h4>
    </div>
  );
}
