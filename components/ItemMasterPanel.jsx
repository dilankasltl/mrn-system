'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function ItemMasterPanel({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const isStores = currentUser?.role === 'stores';
  const canAdd = isAdmin || isStores;
  const canEditOrDelete = isAdmin;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemNo, setItemNo] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('NOS');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Items
  const fetchItems = useCallback(
    async (currentPage = 1, currentSearch = '') => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          search: currentSearch.trim(),
        });

        const res = await fetch(`/api/items?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success) {
          setItems(data.items || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setTotalPages(data.totalPages || 1);
        } else {
          throw new Error(data.error || 'Failed to fetch items');
        }
      } catch (err) {
        console.error('Fetch items error:', err);
        setStatusMsg({ type: 'error', text: err.message || 'Error loading items' });
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchItems(page, search);
  }, [fetchItems, page, search]);

  // Handle Search Debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItemId(null);
    setItemNo('');
    setDescription('');
    setUom('NOS');
    setModalError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    if (!canEditOrDelete) return;
    setModalMode('edit');
    setEditingItemId(item._id);
    setItemNo(item.itemNo || '');
    setDescription(item.description || '');
    setUom(item.uom || 'NOS');
    setModalError('');
    setShowModal(true);
  };

  // Delete Item
  const handleDeleteItem = async (item) => {
    if (!canEditOrDelete) return;
    if (!confirm(`Are you sure you want to delete item "${item.itemNo} - ${item.description}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${item._id}?userRole=${currentUser.role}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete item');
      }

      setStatusMsg({ type: 'success', text: `Item "${item.itemNo}" deleted successfully!` });
      fetchItems(page, search);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Error deleting item' });
    }
  };

  // Submit Modal Form (Add or Edit)
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!itemNo.trim()) {
      setModalError('Please enter an Item Number / Code.');
      return;
    }
    if (!description.trim()) {
      setModalError('Please enter a Description.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemNo: itemNo.trim(),
            description: description.trim(),
            uom: uom.trim().toUpperCase() || 'NOS',
            userRole: currentUser.role,
            userName: currentUser.name || (isAdmin ? 'Admin' : 'Stores'),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to add item');
        }

        setStatusMsg({ type: 'success', text: `Item "${itemNo.trim()}" added to catalog!` });
        setShowModal(false);
        fetchItems(1, search);
      } else {
        const res = await fetch(`/api/items/${editingItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemNo: itemNo.trim(),
            description: description.trim(),
            uom: uom.trim().toUpperCase() || 'NOS',
            userRole: currentUser.role,
            userName: currentUser.name || 'Admin',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update item');
        }

        setStatusMsg({ type: 'success', text: `Item "${itemNo.trim()}" updated successfully!` });
        setShowModal(false);
        fetchItems(page, search);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const commonUOMs = ['NOS', 'MTR', 'KG', 'SET', 'ROLL', 'LTR', 'BOX', 'PKT', 'CAN', 'PAIR', 'PAC', 'DRUM'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Sundaram Lanka Tyres LTD.
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                  {total.toLocaleString()} Items in Master List
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                Item Master Catalog
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {isAdmin
                  ? 'Admin Access: You have full permissions to Add, Edit, and Delete catalog items. All updates sync instantly with the MRN creation search.'
                  : 'Stores Access: You can Add new items to the catalog. Item editing and deletion are strictly maintained by System Admin.'}
              </p>
            </div>
          </div>

          {canAdd && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-amber-600/30 transition self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs flex items-center justify-between transition ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span className="font-semibold">{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Item No (e.g. STM20384, MOW) or Description (e.g. O RING, BOLT)..."
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition"
          >
            Search Catalog
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-2xl transition"
            >
              Reset Search
            </button>
          )}
        </form>

        {search && (
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Showing results for:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">"{search}"</span>
            <span>({total.toLocaleString()} found)</span>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-44">Item No. / Code</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 w-28 text-center">Inventory UoM</th>
                <th className="py-3.5 px-4 w-32">Source / Created By</th>
                <th className="py-3.5 px-4 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Searching Master Item Catalog...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No items found</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Try searching with different keywords or add a new item to catalog.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group"
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg">
                        {item.itemNo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                        {item.uom || 'NOS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.createdBy || 'System Seed'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canEditOrDelete ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                            title="Edit Item (Admin only)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            title="Delete Item (Admin only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-800 dark:text-white">{items.length}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-white">{total.toLocaleString()}</span> items
            (Page {page} of {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-40"
            >
              Previous
            </button>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {modalMode === 'add' ? 'Add New Catalog Item' : 'Edit Catalog Item'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {modalMode === 'add'
                      ? 'Item will be available for autocomplete in all MRN forms'
                      : 'Update item details across system'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitItem} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item No. / Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. STM20384, MOW_1004, BOLT-M12"
                  value={itemNo}
                  onChange={(e) => setItemNo(e.target.value)}
                  className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Full material description, specifications, dimension, grade..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inventory UoM (Unit of Measure)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    list="uom-options"
                    placeholder="e.g. NOS, MTR, KG, SET"
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="flex-1 text-xs font-mono font-bold p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                  />
                  <datalist id="uom-options">
                    {commonUOMs.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {commonUOMs.slice(0, 6).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setUom(unit)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                        uom.toUpperCase() === unit
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl shadow-md shadow-amber-600/30 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : modalMode === 'add' ? (
                    'Add to Catalog'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
