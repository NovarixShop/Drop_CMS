'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { api, getErrorMessage } from '@/lib/api';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Folder,
  CornerDownRight,
  RefreshCw,
  Search,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
  children?: CategoryNode[];
}

export interface FlatCategory {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
  parentName?: string;
  level: number;
}

export default function CategoriesPage() {
  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Add category state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');

  // Edit category state
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatParent, setEditCatParent] = useState('');

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      const list = res.data.data?.categories || res.data.data || [];
      setCategoriesTree(list);
    } catch (err) {
      console.error('Failed to load categories', err);
      toast.error(getErrorMessage(err, 'Failed to fetch categories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Helper to flatten tree into list with level indentation
  const flattenTree = (
    nodes: CategoryNode[],
    level = 0,
    parentName?: string
  ): FlatCategory[] => {
    let result: FlatCategory[] = [];
    for (const node of nodes) {
      result.push({
        _id: node._id,
        name: node.name,
        slug: node.slug,
        parentCategory: node.parentCategory,
        parentName,
        level,
      });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children, level + 1, node.name));
      }
    }
    return result;
  };

  const flatCategories = flattenTree(categoriesTree);
  const filteredCategories = flatCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/categories', {
        name: newCatName.trim(),
        parentCategory: newCatParent || null,
      });
      toast.success(`Category "${newCatName.trim()}" created successfully!`);
      setNewCatName('');
      setNewCatParent('');
      setShowAddModal(false);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create category.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (cat: FlatCategory) => {
    setEditingCategory({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      parentCategory: cat.parentCategory,
    });
    setEditCatName(cat.name);
    setEditCatParent(cat.parentCategory || '');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    setSubmitting(true);
    try {
      await api.put(`/categories/${editingCategory._id}`, {
        name: editCatName.trim(),
        parentCategory: editCatParent || null,
      });
      toast.success(`Category "${editCatName.trim()}" updated successfully!`);
      setEditingCategory(null);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update category.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success(`Category "${name}" deleted.`);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category.'));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Categories</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Organize and manage catalog categories and subcategories
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadCategories();
                }}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Refresh Categories"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Categories
              </p>
              <p className="text-2xl font-bold text-white mt-1">{flatCategories.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Top-Level Categories
              </p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">
                {categoriesTree.length}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Subcategories
              </p>
              <p className="text-2xl font-bold text-slate-300 mt-1">
                {Math.max(0, flatCategories.length - categoriesTree.length)}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name or slug..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Categories Table / List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-500" />
                <p className="text-sm">Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {search ? 'No matching categories' : 'No categories created yet'}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                  {search
                    ? 'Try searching with a different keyword.'
                    : 'Create your first custom category to start organizing products.'}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Category</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">Hierarchy / Parent</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCategories.map((cat) => (
                      <tr
                        key={cat._id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: `${cat.level * 20}px` }}
                          >
                            {cat.level > 0 ? (
                              <CornerDownRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-white">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-400">
                            {cat.slug}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {cat.parentName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                              <span className="text-slate-400">Parent:</span> {cat.parentName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Top-Level</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat._id, cat.name)}
                              className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Add Category */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Create Custom Category</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Footwear, Electronics, Watches"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Parent Category (Optional)
                </label>
                <select
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">None (Top-Level Category)</option>
                  {flatCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.level > 0 ? `— `.repeat(c.level) : ''} {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a parent if this is a subcategory (e.g. Shoes under Fashion).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Edit Category</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Parent Category
                </label>
                <select
                  value={editCatParent}
                  onChange={(e) => setEditCatParent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">None (Top-Level Category)</option>
                  {flatCategories
                    .filter((c) => c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.level > 0 ? `— `.repeat(c.level) : ''} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Update Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

