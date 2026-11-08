'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { ArrowLeft, Save, Loader2, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import ProductImageManager from '@/components/ProductImageManager';

interface Category {
  _id: string;
  name: string;
  level?: number;
}

interface CategoryTreeNode {
  _id: string;
  name: string;
  children?: CategoryTreeNode[];
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
  tax?: number;
  shippingCost?: number;
  isCodAvailable?: boolean;
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
  const [images, setImages] = useState<string[]>(Array.isArray(initialData?.images) ? initialData.images : []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stock, setStock] = useState<number | string>(initialData?.stock ?? 10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(initialData?.lowStockThreshold ?? 5);
  const [tax, setTax] = useState<number | string>(initialData?.tax ?? 0);
  const [shippingCost, setShippingCost] = useState<number | string>(initialData?.shippingCost ?? 0);
  const [isCodAvailable, setIsCodAvailable] = useState<boolean>(initialData?.isCodAvailable ?? true);

  // Quick Add Category state
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickCatParent, setQuickCatParent] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const flattenCategoryTree = (nodes: CategoryTreeNode[], level = 0): Category[] => {
    let result: Category[] = [];
    for (const node of nodes) {
      result.push({ _id: node._id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenCategoryTree(node.children, level + 1));
      }
    }
    return result;
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      const list = res.data.data?.categories || res.data.data || [];
      const flat = flattenCategoryTree(list);
      setCategories(flat);
      if (!categoryId && flat.length > 0) {
        setCategoryId(flat[0]._id);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setFetchingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // Only load categories once; categoryId is read just to pick a default
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await api.post('/categories', {
        name: quickCatName.trim(),
        parentCategory: quickCatParent || null,
      });
      const newCat = res.data.data?.category;
      toast.success(`Category "${quickCatName.trim()}" created!`);
      setQuickCatName('');
      setQuickCatParent('');
      setShowQuickAddCat(false);
      
      // Reload categories and automatically select the newly created one
      const catRes = await api.get('/categories');
      const list = catRes.data.data?.categories || catRes.data.data || [];
      const flat = flattenCategoryTree(list);
      setCategories(flat);
      if (newCat?._id) {
        setCategoryId(newCat._id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create category.'));
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImages) {
      setError('Please wait for the image uploads to finish.');
      return;
    }
    setError('');
    setLoading(true);

    const payload = {
      name,
      description,
      price: Number(price),
      // null tells the API to clear the original price when the field is emptied
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      category: categoryId,
      images,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      tax: tax !== '' ? Number(tax) : 0,
      shippingCost: shippingCost !== '' ? Number(shippingCost) : 0,
      isCodAvailable: Boolean(isCodAvailable),
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddCat(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>
            {fetchingCategories ? (
              <p className="text-xs text-slate-500">Loading categories...</p>
            ) : categories.length === 0 ? (
              <div className="p-4 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-400">No categories found in store.</p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCat(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Category</span>
                </button>
              </div>
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
                    {cat.level && cat.level > 0 ? `— `.repeat(cat.level) : ''}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Tax (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Tax per item. Default is 0 (tax-inclusive or zero tax).</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Shipping Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Delivery fee for this item. Default is 0 (Free Shipping).</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isCodAvailable}
                onChange={(e) => setIsCodAvailable(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <div>
                <span className="block text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                  Cash on Delivery (COD) Available
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Allow customers to pay upon delivery for this item (checked by default).
                </span>
              </div>
            </label>
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
          <ProductImageManager images={images} onChange={setImages} onUploadingChange={setUploadingImages} />
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
            disabled={loading || uploadingImages}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading || uploadingImages ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {uploadingImages ? 'Uploading images...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Product
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Add Category Modal */}
      {showQuickAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Add New Category</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddCat(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickCatName}
                  onChange={(e) => setQuickCatName(e.target.value)}
                  placeholder="e.g. Footwear, Electronics, Accessories"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Parent Category (Optional)
                </label>
                <select
                  value={quickCatParent}
                  onChange={(e) => setQuickCatParent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.level && c.level > 0 ? `— `.repeat(c.level) : ''} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCat(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {creatingCat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Create & Select</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
