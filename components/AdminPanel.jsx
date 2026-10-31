'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Shield, Users, Building, Check, Loader2, X } from 'lucide-react';

export default function AdminPanel({
  departments,
  onRefreshDepartments,
  mrns,
  onSelectMRN,
  onRefreshMRNs,
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptCategory, setDeptCategory] = useState('Operations');
  const [supervisors, setSupervisors] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Delete all MRNs (Admin only)
  const handleDeleteAllMRNs = async () => {
    if (!confirm('⚠️ Are you sure you want to DELETE ALL MRNs? This action CANNOT be undone!')) return;
    if (!confirm('This will permanently remove ALL Material Request Notes from the system. Type OK to confirm.')) return;

    setDeletingAll(true);
    setMsg('');
    try {
      const res = await fetch('/api/mrn?role=admin', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete all MRNs');
      }
      setMsg(`✅ ${data.message}`);
      if (onRefreshMRNs) onRefreshMRNs();
    } catch (err) {
      setMsg(`❌ ${err.message || 'Error deleting MRNs'}`);
    } finally {
      setDeletingAll(false);
    }
  };

  // Open modal for creating new department
  const handleOpenAddModal = () => {
    setEditingDeptId(null);
    setDeptName('');
    setDeptCode('');
    setDeptCategory('Operations');
    setSupervisors(['']);
    setShowModal(true);
  };

  // Open modal for editing existing department & supervisors
  const handleOpenEditModal = (dept) => {
    setEditingDeptId(dept._id);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptCategory(dept.category || 'Operations');
    const existingSups = (dept.supervisors || []).map((s) => s.name);
    setSupervisors(existingSups.length > 0 ? existingSups : ['']);
    setShowModal(true);
  };

  // Add supervisor row in form
  const handleAddSupervisorField = () => {
    setSupervisors([...supervisors, '']);
  };

  const handleSupervisorChange = (index, val) => {
    const updated = [...supervisors];
    updated[index] = val;
    setSupervisors(updated);
  };

  const handleRemoveSupervisorField = (index) => {
    if (supervisors.length <= 1) return;
    setSupervisors(supervisors.filter((_, i) => i !== index));
  };

  // Submit Department (Create or Update)
  const handleSubmitDepartment = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!deptName.trim()) return;

    setLoading(true);
    try {
      const validSupervisors = supervisors
        .filter((s) => s.trim() !== '')
        .map((s) => ({ name: s.trim() }));

      const url = editingDeptId ? `/api/departments/${editingDeptId}` : '/api/departments';
      const method = editingDeptId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deptName.trim(),
          code: deptCode.trim() || undefined,
          category: deptCategory,
          supervisors: validSupervisors,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Operation failed');
      }

      setMsg(
        editingDeptId
          ? `Department ${deptName} updated with ${validSupervisors.length} supervisor(s)!`
          : `Department ${deptName} created with ${validSupervisors.length} supervisor(s)!`
      );
      setShowModal(false);
      onRefreshDepartments();
    } catch (err) {
      setMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TVS SUN-TWS" className="h-10 w-auto object-contain bg-white px-2 py-0.5 rounded-xl border border-slate-700" />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-lg">
                <Shield className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administrator Console</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage departments and assign supervisors (1, 2, or 3+ per department).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteAllMRNs}
            disabled={deletingAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            {deletingAll ? 'Deleting...' : 'Delete All MRNs'}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-2xl font-semibold">
          {msg}
        </div>
      )}

      {/* Departments Grid */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Departments & Assigned Supervisors ({departments.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{dept.name}</h4>
                  {dept.code && (
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-mono">
                      {dept.code}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{dept.category || 'Operations'}</div>

                {/* Supervisor badges */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-1">
                    Supervisors:
                  </span>
                  {dept.supervisors && dept.supervisors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {dept.supervisors.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 italic">No supervisor assigned</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                <button
                  onClick={() => handleOpenEditModal(dept)}
                  className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Supervisors
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDeptId ? 'Edit Department & Supervisors' : 'Add New Department'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDepartment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixing Line 3"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MIX-3"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={deptCategory}
                    onChange={(e) => setDeptCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Production Line">Production Line</option>
                    <option value="Stores">Stores</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Quality">Quality</option>
                    <option value="Shift Production">Shift Production</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Supervisors Inputs: 1, 2, or 3+ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Department Supervisors (1, 2, or 3+)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSupervisorField}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Another
                  </button>
                </div>

                <div className="space-y-2">
                  {supervisors.map((sup, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Supervisor ${idx + 1} Name (e.g. Mr. Kamal)`}
                        value={sup}
                        onChange={(e) => handleSupervisorChange(idx, e.target.value)}
                        className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      {supervisors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupervisorField(idx)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition shadow"
                >
                  {loading ? 'Saving...' : 'Save Department & Supervisors'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
