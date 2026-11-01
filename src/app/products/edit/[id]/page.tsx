'use client';

import { useEffect, useState, use } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ProductForm, { ProductFormData } from '@/components/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data.data.product);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch product details.'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Loading product details...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        ) : (
          <ProductForm initialData={product ?? undefined} productId={productId} />
        )}
      </main>
    </div>
  );
}
