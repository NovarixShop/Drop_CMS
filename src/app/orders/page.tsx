'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  RefreshCw,
  Edit3,
  Copy,
  MapPin,
  Calendar,
  DollarSign,
  X,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

interface Order {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    grandTotal: number;
  };
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  orderStatus: OrderStatus;
  trackingNumber?: string;
  statusHistory?: OrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Update Status Modal
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('processing');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders', {
        params: {
          limit: 100,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      const data = res.data.data?.orders || [];
      setOrders(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch customer orders.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;
    setUpdating(true);
    try {
      const res = await api.put(`/orders/${statusModalOrder._id}/status`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });

      const updatedOrder = res.data.data?.order;
      toast.success(`Order status updated to "${newStatus.toUpperCase()}"`);

      // Update state in place
      setOrders((prev) =>
        prev.map((o) => (o._id === statusModalOrder._id ? { ...o, ...updatedOrder } : o))
      );

      if (activeOrder?._id === statusModalOrder._id) {
        setActiveOrder((prev) => (prev ? { ...prev, ...updatedOrder } : null));
      }

      setStatusModalOrder(null);
      setStatusNote('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const idMatch = o._id.toLowerCase().includes(q);
      const trackingMatch = o.trackingNumber?.toLowerCase().includes(q);
      const nameMatch = o.user?.name?.toLowerCase().includes(q);
      const emailMatch = o.user?.email?.toLowerCase().includes(q);
      const cityMatch = o.shippingAddress?.city?.toLowerCase().includes(q);
      const itemMatch = o.items.some((i) => i.name.toLowerCase().includes(q));
      return idMatch || trackingMatch || nameMatch || emailMatch || cityMatch || itemMatch;
    });
  }, [orders, search]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === 'pending').length,
      processing: orders.filter((o) => o.orderStatus === 'processing').length,
      shipped: orders.filter((o) => o.orderStatus === 'shipped').length,
      delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
    };
  }, [orders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <RefreshCw className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: PaymentStatus) => {
    const isPaid = status === 'paid';
    const isCod = method.toLowerCase() === 'cod';

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          {isCod ? 'Cash on Delivery' : 'Online / Razorpay'}
        </span>
        <span
          className={`inline-block w-fit text-[11px] font-medium px-2 py-0.5 rounded ${
            isPaid
              ? 'bg-emerald-500/15 text-emerald-400'
              : status === 'failed'
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isPaid ? 'PAID' : status === 'failed' ? 'FAILED' : 'AWAITING PAYMENT'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-indigo-400" />
              Customer Orders
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review placed orders, update fulfillment status, and monitor customer cancellations
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Orders
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'all'
                ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold">All Orders</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.total}</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold text-amber-400">Pending</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.pending}</span>
          </button>

          <button
            onClick={() => setStatusFilter('processing')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'processing'
                ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold text-sky-400">Processing</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.processing}</span>
          </button>

          <button
            onClick={() => setStatusFilter('shipped')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'shipped'
                ? 'bg-purple-500/15 border-purple-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold text-purple-400">Shipped</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.shipped}</span>
          </button>

          <button
            onClick={() => setStatusFilter('delivered')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'delivered'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold text-emerald-400">Delivered</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.delivered}</span>
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === 'cancelled'
                ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider font-semibold text-rose-400">Cancelled</span>
            <span className="block text-2xl font-bold mt-1 text-white">{stats.cancelled}</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, customer name, email, or item..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs text-slate-400">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading customer orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-semibold text-slate-400">No orders found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {search ? 'Try modifying your search keywords.' : 'Orders placed by customers will appear here.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const shortId = order._id.slice(-8).toUpperCase();
                    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Order ID & Tracking */}
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span>#{shortId}</span>
                            <button
                              onClick={() => copyToClipboard(order._id, 'Order ID')}
                              title="Copy full ID"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="block text-[11px] text-slate-500 mt-1">{dateFormatted}</span>
                          {order.trackingNumber && (
                            <span className="block text-[10px] text-indigo-400 font-medium mt-0.5">
                              {order.trackingNumber}
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-200">
                            {order.user?.name || 'Customer'}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">
                            {order.user?.email || order.shippingAddress.city}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-xs font-semibold text-slate-200 mb-1">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]" title={order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}>
                            {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                          </p>
                        </td>

                        {/* Total Amount & Payment */}
                        <td className="px-6 py-4">
                          <p className="text-base font-bold text-emerald-400">
                            ₹{order.totals.grandTotal.toFixed(2)}
                          </p>
                          {getPaymentBadge(order.paymentMethod, order.paymentStatus)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {getStatusBadge(order.orderStatus)}
                          {order.orderStatus === 'cancelled' && (
                            <span className="block text-[10px] text-rose-400 mt-1 font-medium">
                              Restocked
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setStatusModalOrder(order);
                                setNewStatus(order.orderStatus);
                                setStatusNote('');
                              }}
                              title="Update Status"
                              className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setActiveOrder(order)}
                              title="View Details"
                              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
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

        {/* 1. UPDATE STATUS MODAL */}
        {statusModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
              <button
                onClick={() => setStatusModalOrder(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-400" />
                Update Fulfillment Status
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-mono">
                Order #{statusModalOrder._id.slice(-8).toUpperCase()} • Tracking: {statusModalOrder.trackingNumber || 'N/A'}
              </p>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    New Order Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="pending">PENDING (Awaiting review or payment)</option>
                    <option value="processing">PROCESSING (Packing & preparing)</option>
                    <option value="shipped">SHIPPED (Handed over to courier)</option>
                    <option value="delivered">DELIVERED (Fulfilled & received)</option>
                    <option value="cancelled">CANCELLED (Cancel order & restore inventory)</option>
                  </select>
                </div>

                {newStatus === 'cancelled' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Cancelling this order will automatically restore reserved product inventory back to your catalog.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Status Note / Tracking Update (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Dispatched with BlueDart express courier, expected delivery Tuesday."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatusModalOrder(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Save Status Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. ORDER DETAILS MODAL */}
        {activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
              <button
                onClick={() => setActiveOrder(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">
                    Order Details
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    #{activeOrder._id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(activeOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(activeOrder.orderStatus)}
                  <span className="block text-xs font-mono text-slate-400 mt-1">
                    Tracking: {activeOrder.trackingNumber || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Customer & Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider block mb-2">
                    Customer Information
                  </span>
                  <p className="text-sm font-bold text-white">{activeOrder.user?.name || 'Customer'}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{activeOrder.user?.email || 'No email provided'}</p>
                  <span className="inline-block mt-3 text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                    User ID: {typeof activeOrder.user === 'object' ? activeOrder.user?._id : activeOrder.user}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider block mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    Shipping Address
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {activeOrder.shippingAddress.street}
                    <br />
                    {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.state} {activeOrder.shippingAddress.postalCode}
                    <br />
                    {activeOrder.shippingAddress.country}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Purchased Items ({activeOrder.items.length})
                </h3>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 divide-y divide-slate-800 overflow-hidden">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          ₹{item.price.toFixed(2)} × {item.quantity} units
                        </p>
                      </div>
                      <span className="font-bold text-slate-200">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200">₹{activeOrder.totals.subtotal.toFixed(2)}</span>
                </div>
                {activeOrder.totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-₹{activeOrder.totals.discount.toFixed(2)}</span>
                  </div>
                )}
                {activeOrder.totals.tax > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax</span>
                    <span className="text-slate-200">₹{activeOrder.totals.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="text-slate-200">
                    {activeOrder.totals.shipping === 0 ? 'Free Shipping' : `₹${activeOrder.totals.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">₹{activeOrder.totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Status History */}
              {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Order Timeline & Cancellation Log
                  </h3>
                  <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-2">
                    {activeOrder.statusHistory.map((hist, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div
                          className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            hist.status === 'cancelled'
                              ? 'bg-rose-500'
                              : hist.status === 'delivered'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white uppercase">{hist.status}</span>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(hist.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {hist.note && <p className="text-slate-400 mt-0.5">{hist.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setStatusModalOrder(activeOrder);
                    setNewStatus(activeOrder.orderStatus);
                    setStatusNote('');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Change Status
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
