'use client';

import { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { UserPlus, Mail, Lock, Shield, User } from 'lucide-react';

interface AdminUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State is only set after the request returns, so this is safe to call from an effect
  const fetchAdmins = async () => {
    try {
      // /users is paginated, so filter by role server-side instead of on a single page
      const res = await api.get('/users', { params: { role: 'admin', limit: 100 } });
      setAdmins(res.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      setError('Failed to load administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/auth/register-admin', {
        name,
        email,
        password,
      });
      
      setName('');
      setEmail('');
      setPassword('');
      setShowAddForm(false);
      fetchAdmins();
    } catch (err) {
      console.error('Failed to add admin:', err);
      setError(getErrorMessage(err, 'Failed to create new admin account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Administrators</h1>
          <p className="text-slate-400">Manage CMS access and staff accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showAddForm ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAddForm ? 'View Admins' : 'Add New Admin'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showAddForm ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Create Admin Account
          </h2>
          
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="John Doe"
                  required
                  minLength={2}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
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
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading administrators...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No administrators found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="p-4 text-sm font-semibold text-slate-400">Name</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Email</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Role</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Joined</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id || admin.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-200 font-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{admin.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
