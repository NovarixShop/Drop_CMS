'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Users,
  Search,
  Download,
  Filter,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  X,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses?: Address[];
  isActive?: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Detail Modal
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 50,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await api.get('/users', { params });
      const data = res.data.data;
      setUsers(data?.users || []);
      setTotalPages(data?.pages || 1);
      setTotalUsersCount(data?.total || data?.users?.length || 0);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch registered users.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Helper to extract default address
  const getDefaultAddress = (u: UserData): Address | null => {
    if (!u.addresses || u.addresses.length === 0) return null;
    return u.addresses.find((a) => a.isDefault) || u.addresses[0];
  };

  // CSV Export Functionality
  const downloadUsersCSV = () => {
    if (users.length === 0) {
      toast.error('No users available to export.');
      return;
    }

    const headers = [
      'User ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Default Street Address',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Role',
      'Email Verified',
      'Account Active',
      'Registration Date',
    ];

    const escapeCSV = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = users.map((u) => {
      const addr = getDefaultAddress(u);
      return [
        escapeCSV(u._id),
        escapeCSV(u.name || 'N/A'),
        escapeCSV(u.email),
        escapeCSV(u.phone || 'N/A'),
        escapeCSV(addr?.street || 'N/A'),
        escapeCSV(addr?.city || 'N/A'),
        escapeCSV(addr?.state || 'N/A'),
        escapeCSV(addr?.postalCode || 'N/A'),
        escapeCSV(addr?.country || 'India'),
        escapeCSV(u.role),
        escapeCSV(u.isVerified ? 'Yes' : 'No'),
        escapeCSV(u.isActive !== false ? 'Active' : 'Inactive'),
        escapeCSV(new Date(u.createdAt).toLocaleString('en-IN')),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `novarix_users_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${users.length} users to CSV successfully!`, {
      description: 'You can open this file directly in Microsoft Excel, Numbers, or Google Sheets.',
      icon: '📊',
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalUsersCount || users.length;
    const customers = users.filter((u) => u.role === 'customer').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const withPhone = users.filter((u) => Boolean(u.phone && u.phone.trim())).length;
    return { total, customers, admins, withPhone };
  }, [users, totalUsersCount]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Users & Customers</h1>
                <p className="text-sm text-slate-400">
                  Manage registered store customers, inspect delivery credentials, and export user records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={downloadUsersCSV}
              disabled={users.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Platform user accounts</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customers</span>
              <UserIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.customers}</p>
            <p className="text-xs text-slate-500 mt-1">Shopper accounts</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Available</span>
              <Phone className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-sky-400 mt-2">{stats.withPhone}</p>
            <p className="text-xs text-slate-500 mt-1">Ready for delivery & OTP</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admins</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-2">{stats.admins}</p>
            <p className="text-xs text-slate-500 mt-1">CMS portal access</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['all', 'customer', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Default Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading user accounts and credentials...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-600" />
                        <span className="text-base font-semibold text-slate-300">No users found</span>
                        <span className="text-xs text-slate-500">
                          {search ? 'Try clearing your search query.' : 'Registered users will appear here.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const addr = getDefaultAddress(u);
                    return (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{u.name || 'Anonymous User'}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {u.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                              <Phone className="w-3 h-3" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not provided</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {addr ? (
                            <div className="max-w-xs">
                              <p className="text-xs text-slate-300 line-clamp-1">{addr.street}</p>
                              <p className="text-[11px] text-slate-500">
                                {addr.city}, {addr.state} {addr.postalCode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No saved address</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              u.role === 'admin'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-lg border border-indigo-500/30">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedUser.name || 'Anonymous User'}</h2>
                    <p className="text-xs text-slate-400">ID: {selectedUser._id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Credentials Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Customer Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Email Address</span>
                    <span className="font-semibold text-white break-all">{selectedUser.email}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Phone Number</span>
                    <span className="font-semibold text-white">
                      {selectedUser.phone || <span className="text-slate-500 italic">Not provided</span>}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Account Role</span>
                    <span className="font-semibold text-indigo-400 capitalize">{selectedUser.role}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Joined Date</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(selectedUser.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saved Addresses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Shipping & Delivery Addresses ({selectedUser.addresses?.length || 0})
                  </h3>
                </div>

                {!selectedUser.addresses || selectedUser.addresses.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No saved addresses on file.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedUser.addresses.map((a, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs ${
                          a.isDefault
                            ? 'bg-indigo-950/20 border-indigo-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            Address #{idx + 1}
                          </span>
                          {a.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300">{a.street}</p>
                        <p className="text-slate-400 mt-0.5">
                          {a.city}, {a.state} - {a.postalCode}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{a.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

