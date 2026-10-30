'use client';

import React, { useState } from 'react';
import { IDepartment, IMRN } from '@/types';
import { Plus, Trash2, Edit3, Shield, Users, Building, Check, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  departments: IDepartment[];
  onRefreshDepartments: () => void;
  mrns: IMRN[];
  onSelectMRN: (mrn: IMRN) => void;
}

export default function AdminPanel({
  departments,
  onRefreshDepartments,
  mrns,
  onSelectMRN,
}: AdminPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptCategory, setDeptCategory] = useState('Operations');
  const [supervisors, setSupervisors] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Add supervisor row in form
  const handleAddSupervisorField = () => {
    setSupervisors([...supervisors, '']);
  };

  const handleSupervisorChange = (index: number, val: string) => {
    const updated = [...supervisors];
    updated[index] = val;
    setSupervisors(updated);
  };

  const handleRemoveSupervisorField = (index: number) => {
    if (supervisors.length <= 1) return;
    setSupervisors(supervisors.filter((_, i) => i !== index));
  };

  // Submit new Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!deptName.trim()) return;

    setLoading(true);
    try {
      const validSupervisors = supervisors
        .filter((s) => s.trim() !== '')
        .map((s) => ({ name: s.trim() }));

      const res = await fetch('/api/departments', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create department');
      }

      setMsg(`Department ${deptName} created successfully with ${validSupervisors.length} supervisor(s)!`);
      setDeptName('');
      setDeptCode('');
      setSupervisors(['']);
      setShowAddModal(false);
      onRefreshDepartments();
    } catch (err: any) {
      setMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">Administrator Console</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure company departments, assign designated supervisors (1, 2, or 3+ per department), and oversee MRN activity.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Department & Supervisors
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
          {msg}
        </div>
      )}

      {/* Departments Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Configured Departments & Assigned Supervisors ({departments.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{dept.name}</h4>
                  {dept.code && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {dept.code}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{dept.category || 'Operations'}</div>

                {/* Supervisor badges */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Supervisors:
                  </span>
                  {dept.supervisors && dept.supervisors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {dept.supervisors.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No supervisor assigned</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add New Department</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixing Line 3"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MIX-3"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={deptCategory}
                    onChange={(e) => setDeptCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700">
                    Department Supervisors (1, 2, or 3+)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSupervisorField}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
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
                        className="flex-1 text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                      />
                      {supervisors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupervisorField(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition shadow"
                >
                  {loading ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
