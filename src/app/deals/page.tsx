'use client';

import { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Tag, Plus, Trash2, Calendar, Percent } from 'lucide-react';

interface Deal {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  discountPercentage: number;
  startTime: string;
  endTime: string;
}

interface DealProduct {
  _id?: string;
  id?: string;
  name: string;
  price: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<DealProduct[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State is only set after the request returns, so these are safe to call from an effect
  const fetchDeals = async () => {
    try {
      const res = await api.get('/deals');
      setDeals(res.data.data.deals);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setError('Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/deals', {
        name,
        description,
        discountPercentage: parseInt(discountPercentage),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        products: [selectedProduct],
      });
      
      // Reset form
      setName('');
      setDescription('');
      setDiscountPercentage('');
      setStartTime('');
      setEndTime('');
      setSelectedProduct('');
      setShowAddForm(false);
      
      fetchDeals();
    } catch (err) {
      console.error('Failed to add deal:', err);
      setError(getErrorMessage(err, 'Failed to create deal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await api.delete(`/deals/${id}`);
      fetchDeals();
    } catch (err) {
      console.error('Failed to delete deal:', err);
      alert('Failed to delete deal');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Exclusive Deals</h1>
          <p className="text-slate-400">Manage promotional offers and flash sales</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showAddForm ? <Tag className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'View Deals' : 'Add New Deal'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showAddForm ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Create Promotional Deal</h2>
          
          <form onSubmit={handleAddDeal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Deal Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Summer Flash Sale"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                placeholder="Describe the deal..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Discount %</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number" 
                    min="1"
                    max="99"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Select Product</label>
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose a product --</option>
                  {products.map(p => {
                    const productId = p._id || p.id;
                    return (
                      <option key={productId} value={productId}>{p.name}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                <input 
                  type="datetime-local" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? 'Saving...' : 'Save Deal'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading deals...</div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No active deals found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="p-4 text-sm font-semibold text-slate-400">Deal Info</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Discount</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Status</th>
                  <th className="p-4 text-sm font-semibold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const isActive = new Date(deal.startTime) <= new Date() && new Date(deal.endTime) > new Date();
                  const isExpired = new Date(deal.endTime) <= new Date();
                  
                  return (
                    <tr key={deal._id || deal.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{deal.name}</div>
                        <div className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(deal.startTime).toLocaleDateString()} - {new Date(deal.endTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                          {deal.discountPercentage}% OFF
                        </span>
                      </td>
                      <td className="p-4">
                        {isActive ? (
                          <span className="text-emerald-400 text-xs font-medium">Active</span>
                        ) : isExpired ? (
                          <span className="text-slate-500 text-xs font-medium">Expired</span>
                        ) : (
                          <span className="text-amber-400 text-xs font-medium">Scheduled</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(deal._id || deal.id)}
                          className="text-slate-400 hover:text-rose-400 p-2 transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
