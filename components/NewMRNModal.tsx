'use client';

import React, { useState } from 'react';
import { CurrentUser, IDepartment } from '@/types';
import { Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface NewMRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  departments: IDepartment[];
  onMRNCreated: (mrn: any) => void;
}

interface ItemRow {
  itemNo: number;
  description: string;
  requestQty: number | '';
  unit: string;
  remarks: string;
}

export default function NewMRNModal({
  isOpen,
  onClose,
  currentUser,
  departments,
  onMRNCreated,
}: NewMRNModalProps) {
  const [department, setDepartment] = useState(currentUser.department || 'Engineering');
  const [requestedBy, setRequestedBy] = useState(currentUser.name || '');
  const [shift, setShift] = useState('General');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [generalRemarks, setGeneralRemarks] = useState('');

  // Default 3 rows as explicitly required: "defult rule 3k thynna ona madi unoth add krgnna plwn wenna ona"
  const [items, setItems] = useState<ItemRow[]>([
    { itemNo: 1, description: '', requestQty: '', unit: 'Nos', remarks: '' },
    { itemNo: 2, description: '', requestQty: '', unit: 'Nos', remarks: '' },
    { itemNo: 3, description: '', requestQty: '', unit: 'Nos', remarks: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemNo: items.length + 1,
        description: '',
        requestQty: '',
        unit: 'Nos',
        remarks: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, itemNo: idx + 1 }));
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Filter filled items
    const validItems = items.filter((it) => it.description.trim() !== '');

    if (validItems.length === 0) {
      setError('Please add at least one material description.');
      return;
    }

    for (const it of validItems) {
      if (!it.requestQty || Number(it.requestQty) <= 0) {
        setError(`Please enter a valid Material Request QTY for item: ${it.description}`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/mrn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          requestedBy: requestedBy.trim() || 'Department User',
          shift,
          priority,
          generalRemarks,
          items: validItems.map((it, idx) => ({
            itemNo: idx + 1,
            description: it.description,
            requestQty: Number(it.requestQty),
            unit: it.unit,
            remarks: it.remarks,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate MRN');
      }

      setSuccessMsg(`MRN ${data.mrn.mrnNo} generated successfully!`);
      onMRNCreated(data.mrn);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving MRN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold uppercase text-sky-600 tracking-wider">
              Sundaram Lanka Tyres LTD.
            </div>
            <h2 className="text-xl font-bold text-slate-800">Generate New Material Request Note (MRN)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-semibold p-1.5 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Top Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              >
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Employee / Officer Name"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift / Line</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="General">General / Day</option>
                <option value="Shift A">Shift A</option>
                <option value="Shift B">Shift B</option>
                <option value="Shift C">Shift C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Table of Material Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Material Items (Default 3 Rows, add more as needed)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">NO.</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-32">Material Request QTY</th>
                    <th className="py-2.5 px-3 w-24">Unit</th>
                    <th className="py-2.5 px-3">Remarks (Ona kenekta danna plwn)</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                        {row.itemNo}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Material description / part number"
                          value={row.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          placeholder="QTY"
                          min="0.1"
                          step="any"
                          value={row.requestQty}
                          onChange={(e) => handleItemChange(idx, 'requestQty', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Nos, Kg, Pcs..."
                          value={row.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Special requirement or note"
                          value={row.remarks}
                          onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 transition p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Note / Reason for Request (Optional)
            </label>
            <textarea
              rows={2}
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              placeholder="e.g. Urgent machine breakdown spare parts for Line 2"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Unique MRN Number will be auto-generated upon submission.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 rounded-lg shadow transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating MRN...
                  </>
                ) : (
                  'Generate MRN & Send for Approval'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
