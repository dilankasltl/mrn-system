'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Search,
  Package,
} from 'lucide-react';

export default function NewMRNModal({
  isOpen,
  onClose,
  currentUser,
  departments,
  onMRNCreated,
}) {
  const [department, setDepartment] = useState(currentUser.department || 'Engineering');
  const [requestedBy, setRequestedBy] = useState(currentUser.name || '');
  const [generalRemarks, setGeneralRemarks] = useState('');

  // Default 3 rows with Item No, Description, UoM, etc.
  const [items, setItems] = useState([
    { itemNo: 1, itemCode: '', description: '', requestQty: '', unit: 'NOS', remarks: '' },
    { itemNo: 2, itemCode: '', description: '', requestQty: '', unit: 'NOS', remarks: '' },
    { itemNo: 3, itemCode: '', description: '', requestQty: '', unit: 'NOS', remarks: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autocomplete search state
  const [activeDropdown, setActiveDropdown] = useState(null); // { rowIndex: number, field: 'itemCode' | 'description' }
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser.department) {
        setDepartment(currentUser.department);
      }
      setRequestedBy(currentUser.name || '');
      setError('');
      setSuccessMsg('');
      setActiveDropdown(null);
      setSearchResults([]);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemNo: items.length + 1,
        itemCode: '',
        description: '',
        requestQty: '',
        unit: 'NOS',
        remarks: '',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    const newItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, itemNo: idx + 1 }));
    setItems(newItems);
    if (activeDropdown?.rowIndex === index) {
      setActiveDropdown(null);
    }
  };

  const triggerCatalogSearch = (text, rowIndex, field) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!text || text.trim().length === 0) {
      setActiveDropdown(null);
      setSearchResults([]);
      return;
    }

    setActiveDropdown({ rowIndex, field });
    setSearchLoading(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?search=${encodeURIComponent(text.trim())}&limit=12`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.items || []);
        }
      } catch (err) {
        console.error('Error fetching catalog search:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);

    if (field === 'itemCode' || field === 'description') {
      triggerCatalogSearch(value, index, field);
    }
  };

  const handleSelectItem = (rowIndex, selectedItem) => {
    const newItems = [...items];
    newItems[rowIndex] = {
      ...newItems[rowIndex],
      itemCode: selectedItem.itemNo || '',
      description: selectedItem.description || '',
      unit: selectedItem.uom ? selectedItem.uom.toUpperCase() : 'NOS',
    };
    setItems(newItems);
    setActiveDropdown(null);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
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
          generalRemarks,
          items: validItems.map((it, idx) => ({
            itemNo: idx + 1,
            itemCode: it.itemCode ? it.itemCode.trim() : '',
            description: it.description.trim(),
            requestQty: Number(it.requestQty),
            unit: it.unit ? it.unit.trim().toUpperCase() : 'NOS',
            remarks: it.remarks ? it.remarks.trim() : '',
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
    } catch (err) {
      setError(err.message || 'Error occurred while saving MRN');
    } finally {
      setLoading(false);
    }
  };

  const commonUOMs = ['NOS', 'MTR', 'KG', 'SET', 'ROLL', 'LTR', 'BOX', 'PKT', 'CAN', 'PAIR', 'PAC', 'DRUM'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 transition-colors duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="TVS SUN-TWS"
              className="h-9 w-auto object-contain bg-white px-2 py-0.5 rounded-lg"
            />
            <div>
              <div className="text-xs font-bold uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                Sundaram Lanka Tyres LTD.
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Generate Material Request Note (MRN)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Top Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="w-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold flex items-center justify-between">
                <span>{department}</span>
                <span className="text-[10px] text-slate-400 font-normal">Department Locked</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Requested By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Employee / Officer Name"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Table of Material Items with Autocomplete & Custom Input */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Material Items
                </label>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Search by <strong>Item No.</strong> or <strong>Description</strong> from the catalog of 16,000+ items, or freely type custom items if not in list.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 transition self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Row
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-visible shadow-sm">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                      <th className="py-2.5 px-2.5 w-40">Item No. / Code</th>
                      <th className="py-2.5 px-2.5">Description</th>
                      <th className="py-2.5 px-2.5 w-24 text-center">Inventory UoM</th>
                      <th className="py-2.5 px-2.5 w-28">Material Request QTY</th>
                      <th className="py-2.5 px-2.5 w-28 text-center">Material Issued QTY</th>
                      <th className="py-2.5 px-2.5 w-40">Remarks</th>
                      <th className="py-2.5 px-1.5 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {items.map((row, idx) => {
                      const isDropdownActive = activeDropdown?.rowIndex === idx;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2 px-2 text-center font-bold text-slate-400">
                            {row.itemNo}
                          </td>

                          {/* Item No. / Code (with autocomplete) */}
                          <td className="py-2 px-2 relative">
                            <input
                              type="text"
                              placeholder="e.g. STM20384"
                              value={row.itemCode}
                              onFocus={() => {
                                if (row.itemCode.trim().length >= 1) {
                                  triggerCatalogSearch(row.itemCode, idx, 'itemCode');
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (activeDropdown?.rowIndex === idx && activeDropdown?.field === 'itemCode') {
                                    setActiveDropdown(null);
                                  }
                                }, 250);
                              }}
                              onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                              className="w-full text-xs font-mono font-bold p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none uppercase"
                            />

                            {/* Autocomplete Dropdown anchored on Item Code */}
                            {isDropdownActive && activeDropdown.field === 'itemCode' && (
                              <div className="absolute left-0 top-full mt-1 w-96 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                  <span>Item Master Matches</span>
                                  {searchLoading && <Loader2 className="w-3 h-3 animate-spin text-sky-500" />}
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                                  {searchResults.length === 0 && !searchLoading ? (
                                    <div className="text-[11px] text-slate-400 p-2 text-center italic">
                                      Not found in master catalog. You can continue typing to use custom item.
                                    </div>
                                  ) : (
                                    searchResults.map((item, sIdx) => (
                                      <div
                                        key={sIdx}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSelectItem(idx, item);
                                        }}
                                        className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer transition text-left"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                                            {item.itemNo}
                                          </span>
                                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-slate-300">
                                            {item.uom || 'NOS'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                                          {item.description}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Description (with autocomplete) */}
                          <td className="py-2 px-2 relative">
                            <input
                              type="text"
                              placeholder="Material description / search catalog"
                              value={row.description}
                              onFocus={() => {
                                if (row.description.trim().length >= 1) {
                                  triggerCatalogSearch(row.description, idx, 'description');
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (activeDropdown?.rowIndex === idx && activeDropdown?.field === 'description') {
                                    setActiveDropdown(null);
                                  }
                                }, 250);
                              }}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full text-xs p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none"
                            />

                            {/* Autocomplete Dropdown anchored on Description */}
                            {isDropdownActive && activeDropdown.field === 'description' && (
                              <div className="absolute left-0 top-full mt-1 w-96 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                  <span>Catalog Suggestions</span>
                                  {searchLoading && <Loader2 className="w-3 h-3 animate-spin text-sky-500" />}
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                                  {searchResults.length === 0 && !searchLoading ? (
                                    <div className="text-[11px] text-slate-400 p-2 text-center italic">
                                      Not found in master catalog. You can continue typing to use custom item.
                                    </div>
                                  ) : (
                                    searchResults.map((item, sIdx) => (
                                      <div
                                        key={sIdx}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSelectItem(idx, item);
                                        }}
                                        className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer transition text-left"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                                            {item.itemNo}
                                          </span>
                                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-slate-300">
                                            {item.uom || 'NOS'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-800 dark:text-slate-200 font-medium truncate mt-0.5">
                                          {item.description}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Inventory UoM */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="text"
                              list={`uom-list-${idx}`}
                              placeholder="UoM"
                              value={row.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full text-xs font-mono font-bold p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none uppercase text-center"
                            />
                            <datalist id={`uom-list-${idx}`}>
                              {commonUOMs.map((u) => (
                                <option key={u} value={u} />
                              ))}
                            </datalist>
                          </td>

                          {/* Material Request QTY */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              placeholder="QTY"
                              min="0.01"
                              step="any"
                              value={row.requestQty}
                              onChange={(e) => handleItemChange(idx, 'requestQty', e.target.value)}
                              className="w-full text-xs font-bold p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none text-center"
                            />
                          </td>

                          {/* Material Issued QTY */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              disabled
                              value="Stores"
                              className="w-full text-xs p-2 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg cursor-not-allowed italic text-center font-medium"
                              title="Filled exclusively by Stores when issued"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={row.remarks}
                              onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                              className="w-full text-xs p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none"
                            />
                          </td>

                          {/* Remove Row Button */}
                          <td className="py-2 px-1 text-center">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* General Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              General Note / Reason for Request (Optional)
            </label>
            <textarea
              rows={2}
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              placeholder="e.g. Urgent machine breakdown spare parts for Line 2"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Unique MRN Number will be auto-generated upon submission.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 rounded-xl shadow-md shadow-sky-600/30 transition disabled:opacity-50"
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
