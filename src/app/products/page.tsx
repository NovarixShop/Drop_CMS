'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Plus, Search, Trash2, Edit, AlertCircle, RefreshCw } from 'lucide-react';

interface Category {
  _id: string;
  name: string;

}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: Category | string;
  images: string[];
  stock: number;
  isActive: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // State is only set after the request returns, so this is safe to call from an effect
  const loadProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      const data = res.data.data;
      setProducts(data.products || data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch products.'));
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    setLoading(true);
    setError('');
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the store?`)) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete product.'));
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Product Catalog Management</h1>
            <p className="text-sm text-slate-400 mt-1">Add, update, or remove products live on the storefront</p>
          </div>
          <Link
            href="/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={refreshProducts}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Available Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No products found. Click &quot;Add New Product&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const categoryName = typeof product.category === 'object' ? product.category?.name : 'Uncategorized';
                    const mainImg = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                    return (
                      <tr key={product._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden relative flex-shrink-0 border border-slate-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={mainImg}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-white truncate max-w-xs">{product.name}</p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700/60 rounded-md text-xs font-medium text-slate-300">
                            {categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">
                          ₹{product.price.toFixed(2)}
                          {product.compareAtPrice && (
                            <span className="text-xs text-slate-500 line-through ml-2">
                              ₹{product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${product.stock <= 5 ? 'text-amber-400' : 'text-slate-200'}`}>
                              {product.stock} units
                            </span>
                            {product.stock <= 5 && (
                              <span className="text-xs text-amber-400 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <AlertCircle className="w-3 h-3" /> Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/products/edit/${product._id}`}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product._id, product.name)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
