'use client';

import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totals: {
    revenue: number;
    orders: number;
    products: number;
    customers: number;
  };
  salesTrend: { _id: string; totalSales: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/analytics/dashboard');
      setStats(response.data.data.stats);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load revenue analytics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Revenue & Analytics Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time revenue tracking and performance metrics</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              ₹{stats?.totals.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> From paid customer orders
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              {stats?.totals.orders || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">All time customer purchases</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Products</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              {stats?.totals.products || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">Products available in storefront</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customers</span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              {stats?.totals.customers || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">Registered buyer accounts</p>
          </div>
        </div>

        {/* Charts & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-white mb-1">Sales Trend (Last 30 Days)</h2>
            <p className="text-xs text-slate-400 mb-6">Revenue earned per day from completed sales</p>
            <div className="h-72 w-full">
              {stats?.salesTrend && stats.salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="_id" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="totalSales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No sales recorded in the past 30 days yet.
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-white mb-1">Top Selling Products</h2>
            <p className="text-xs text-slate-400 mb-6">Best sellers ranked by total units sold</p>
            <div className="flex-1 space-y-4">
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                    <div className="truncate pr-2">
                      <p className="text-sm font-medium text-slate-200 truncate">{prod.name}</p>
                      <p className="text-xs text-slate-500">{prod.quantity} units sold</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
                      ₹{prod.revenue.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No sales data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
