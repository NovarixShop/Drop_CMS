'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
}

export interface ProductFormData {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  category?: Category | string;
  images?: string[];
  stock?: number;
  lowStockThreshold?: number;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: string;
}

export default function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice || '');
  const [categoryId, setCategoryId] = useState(
    typeof initialData?.category === 'object' ? initialData.category._id : initialData?.category || ''
  );
  const [imagesText, setImagesText] = useState(
    Array.isArray(initialData?.images) ? initialData.images.join(', ') : ''
  );
  const [stock, setStock] = useState<number | string>(initialData?.stock ?? 10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(initialData?.lowStockThreshold ?? 5);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        const list = res.data.data?.categories || res.data.data || [];
        setCategories(list);
        if (!categoryId && list.length > 0) {
          setCategoryId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setFetchingCategories(false);
      }
    };
    loadCategories();
    // Only load categories once; categoryId is read just to pick a default
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const imageUrls = imagesText
      .split(',')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);

    const payload = {
      name,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      category: categoryId,
      images: imageUrls,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
    };

    try {
      if (productId) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      router.push('/products');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save product. Please check form values.'));
    } finally {
      setLoading(false);
    }
  };

  const previewImages = imagesText
    .split(',')
    .map((url: string) => url.trim())
    .filter((url: string) => url.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">Configure details, pricing, and stock levels</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3">Basic Information</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Product Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Noise-Canceling Headphones"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a clear and engaging product description (min 10 chars)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Category *</label>
            {fetchingCategories ? (
              <p className="text-xs text-slate-500">Loading categories...</p>
            ) : (
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Original Price (₹) (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="129.99"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Available Quantity (Stock) *</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3">Product Media (Images)</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Image URLs (Comma separated)
            </label>
            <textarea
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder="https://images.unsplash.com/photo-1..., https://images.unsplash.com/photo-2..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">Provide direct HTTP/HTTPS links to product images.</p>
          </div>

          {previewImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Live Image Previews</p>
              <div className="flex flex-wrap gap-3">
                {previewImages.map((url: string, idx: number) => (
                  <div key={idx} className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/products"
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
