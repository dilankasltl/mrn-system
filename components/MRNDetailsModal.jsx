'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Printer,
  X,
  PackageCheck,
  UserCheck,
  ShieldAlert,
  Loader2,
  Trash2,
  LogIn,
  Plus,
  Trash,
} from 'lucide-react';
import seedItems from '@/lib/seedItems.json';

export default function MRNDetailsModal({
  mrn,
  isOpen,
  onClose,
  currentUser,
  departments = [],
  onMRNUpdated,
  onMRNDeleted,
  onOpenLogin,
}) {
  // Helper to resolve Item No / Code if missing
  const resolveItemCode = (it) => {
    if (it?.itemCode && String(it.itemCode).trim() !== '' && it.itemCode !== '-') {
      return String(it.itemCode).trim();
    }
    if (!it?.description) return '-';
    const descLower = it.description.toLowerCase().trim();
    const match = (seedItems || []).find(
      (s) => s.description && s.description.toLowerCase().trim() === descLower
    );
    return match ? match.itemNo : '-';
  };

  // Local state for stores issue form
  const [storeItems, setStoreItems] = useState([]);
  // Local state for supervisor editable items (before approval)
  const [supervisorItems, setSupervisorItems] = useState([]);

  const [storesRemarks, setStoresRemarks] = useState('');
  const [issuedByName, setIssuedByName] = useState('Stores Officer');
  const [supervisorApproverName, setSupervisorApproverName] = useState('Supervisor');
  const [approvalComments, setApprovalComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Synchronize modal state whenever mrn changes
  useEffect(() => {
    if (!mrn) return;
    setStoreItems(
      (mrn.items || []).map((it) => ({
        _id: it._id,
        itemNo: it.itemNo,
        itemCode: resolveItemCode(it),
        description: it.description,
        requestQty: it.requestQty,
        unit: it.unit || 'Nos',
        issueQty: it.issueQty !== undefined && it.issueQty > 0 ? it.issueQty : it.requestQty,
        remarks: it.remarks || '',
        isIssued: it.isIssued || false,
      }))
    );
    setSupervisorItems(
      (mrn.items || []).map((it) => ({
        _id: it._id,
        itemNo: it.itemNo,
        itemCode: resolveItemCode(it),
        description: it.description,
        requestQty: it.requestQty,
        unit: it.unit || 'Nos',
        remarks: it.remarks || '',
      }))
    );
    setStoresRemarks(mrn.storesIssue?.storesRemarks || '');
    setIssuedByName(
      currentUser?.role === 'stores' ? currentUser.name : 'Stores Officer'
    );
    setSupervisorApproverName(
      currentUser?.role === 'supervisor' ? currentUser.name : 'Supervisor'
    );
    setApprovalComments('');
    setError('');
    setSuccess('');
  }, [mrn?._id, mrn?.status, currentUser]);

  // Global keydown listener for Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mrn) return null;

  // Handle Stores Qty Change
  const handleStoreQtyChange = (index, val) => {
    const updated = [...storeItems];
    updated[index].issueQty = val;
    setStoreItems(updated);
  };

  const handleStoreRemarksChange = (index, val) => {
    const updated = [...storeItems];
    updated[index].remarks = val;
    setStoreItems(updated);
  };

  // Perform Approval Action
  const handleApprovalAction = async (actionType) => {
    setError('');
    setSuccess('');
    setLoading(true);

    let approver = currentUser.name;
    if (actionType === 'supervisor') approver = supervisorApproverName;
    if (actionType === 'niranjan') approver = 'Mr. Niranjan';
    if (actionType === 'vinod') approver = 'Mr. Vinod';

    try {
      const payload = {
        approvalType: actionType,
        approvedBy: approver,
        comments: approvalComments,
      };

      // If supervisor is approving, include possibly edited items
      if (actionType === 'supervisor') {
        payload.items = supervisorItems.map((it) => ({
          ...it,
          itemCode: it.itemCode || resolveItemCode(it),
        }));
      }

      const res = await fetch(`/api/mrn/${mrn._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update approval');
      }

      setSuccess(`Action ${actionType.toUpperCase()} completed successfully!`);
      onMRNUpdated(data.mrn);
    } catch (err) {
      setError(err.message || 'Error occurred during approval');
    } finally {
      setLoading(false);
    }
  };

  // Stores Issue Action
  const handleStoresIssue = async () => {
    setError('');
    setSuccess('');

    // Validation: make sure issueQty is entered
    for (const it of storeItems) {
      if (it.issueQty === undefined || it.issueQty === null || Number(it.issueQty) < 0) {
        setError(`Please enter a valid Material Issue QTY for item #${it.itemNo}: ${it.description}`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/mrn/${mrn._id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: storeItems.map((it) => ({
            _id: it._id,
            itemNo: it.itemNo,
            itemCode: it.itemCode || resolveItemCode(it),
            issueQty: Number(it.issueQty),
            remarks: it.remarks,
            isIssued: Number(it.issueQty) > 0,
          })),
          issuedBy: issuedByName || 'Stores Officer',
          storesRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue materials');
      }

      setSuccess('Materials issued successfully! MRN is now locked.');
      onMRNUpdated(data.mrn);
    } catch (err) {
      setError(err.message || 'Error issuing materials');
    } finally {
      setLoading(false);
    }
  };

  // Delete Action (Admin only or pending draft)
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete MRN ${mrn.mrnNo}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/mrn/${mrn._id}?role=${currentUser.role}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete MRN');
      }

      if (onMRNDeleted) onMRNDeleted(mrn._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const isIssued = mrn.isLocked || mrn.status === 'ISSUED';
  const supervisorApproved = mrn.supervisorApproval?.approved;
  const niranjanApproved = mrn.niranjanApproval?.approved;
  const vinodApproved = mrn.vinodApproval?.approved;

  // Check if supervisor is authorized for this department:
  const isAuthorizedSupervisor = () => {
    if (currentUser?.role !== 'supervisor') return false;
    // Direct match with user's primary department
    if (currentUser.department && currentUser.department === mrn.department) return true;
    
    // Match via departments configuration (e.g. Mr. Ravimal / Mr. Dhammika for Shift A, B, C, Production, etc.)
    const supName = currentUser.name?.toLowerCase().trim();
    const deptObj = (departments || []).find((d) => d.name === mrn.department);
    if (deptObj && deptObj.supervisors) {
      return deptObj.supervisors.some((s) => {
        const sName = s.name?.toLowerCase().trim();
        return sName && (sName === supName || sName.includes(supName) || supName.includes(sName));
      });
    }
    return false;
  };

  // Can this user perform supervisor approval?
  const canApproveAsSupervisor =
    !isIssued &&
    !supervisorApproved &&
    (currentUser.role === 'admin' || isAuthorizedSupervisor());

  const canApproveAsNiranjan =
    !isIssued &&
    supervisorApproved &&
    !niranjanApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'management_niranjan');

  const canApproveAsVinod =
    !isIssued &&
    supervisorApproved &&
    !vinodApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'management_vinod');

  const isManagementApproved = vinodApproved || mrn.status === 'APPROVED';

  const canStoresIssue =
    !isIssued &&
    supervisorApproved &&
    isManagementApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'stores');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto print:shadow-none print:border-none transition-colors duration-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Sticky Header with Unmissable Close Buttons */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 px-5 sm:px-7 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TVS SUN-TWS" className="h-9 w-auto object-contain bg-white px-2 py-0.5 rounded-lg" />
            <div>
              <div className="text-[11px] font-bold uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                Sundaram Lanka Tyres LTD.
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {mrn.mrnNo}
                </h2>
                {isIssued ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] font-bold">
                    <Lock className="w-3.5 h-3.5" /> ISSUED & LOCKED
                  </span>
                ) : mrn.status === 'APPROVED' ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-[11px] font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> APPROVED (Stores Ready)
                  </span>
                ) : mrn.status === 'SUPERVISOR_APPROVED' || mrn.status === 'NIRANJAN_APPROVED' ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" /> PENDING MANAGEMENT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" /> PENDING SUPERVISOR
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Print MRN"
            >
              <Printer className="w-4 h-4" />
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                title="Delete MRN (Admin only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {/* Top Close Button (Labeled & Clickable) */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-sm active:scale-95"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Special Banner if Mr. Vinod approved without Mr. Niranjan */}
          {vinodApproved && mrn.vinodApproval?.withoutNiranjan && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200 font-bold shadow-sm">
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Notice: Approved by Mr. Vinod (Without Mr. Niranjan&apos;s approval)</span>
            </div>
          )}

          {/* MRN Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Department</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{mrn.department}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Requested By</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{mrn.requestedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(mrn.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Workflow Approval Stepper */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Approval & Issuance Lifecycle
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* 1. Supervisor */}
              <div
                className={`p-3 rounded-xl border transition ${
                  supervisorApproved
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">1. Supervisor</span>
                  {supervisorApproved ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px]">
                  {supervisorApproved ? (
                    <>
                      <div className="font-semibold">{mrn.supervisorApproval?.approvedBy}</div>
                      <div className="text-emerald-700 dark:text-emerald-400 text-[10px]">
                        {mrn.supervisorApproval?.approvedAt &&
                          new Date(mrn.supervisorApproval.approvedAt).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Approval</span>
                  )}
                </div>
              </div>

              {/* 2. Mr. Niranjan */}
              <div
                className={`p-3 rounded-xl border transition ${
                  niranjanApproved
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">2. Mr. Niranjan</span>
                  {niranjanApproved ? (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px]">
                  {niranjanApproved ? (
                    <>
                      <div className="font-semibold">{mrn.niranjanApproval?.approvedBy || 'Approved'}</div>
                      <div className="text-blue-700 dark:text-blue-400 text-[10px]">
                        {mrn.niranjanApproval?.approvedAt &&
                          new Date(mrn.niranjanApproval.approvedAt).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      {supervisorApproved ? 'Pending Sign-off' : 'Waiting for Supervisor'}
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Mr. Vinod */}
              <div
                className={`p-3 rounded-xl border transition ${
                  vinodApproved
                    ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">3. Mr. Vinod (Final)</span>
                  {vinodApproved ? (
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px]">
                  {vinodApproved ? (
                    <>
                      <div className="font-semibold">Approved by Mr. Vinod</div>
                      {mrn.vinodApproval?.withoutNiranjan && (
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">
                          (Without Mr. Niranjan Approval)
                        </span>
                      )}
                      <div className="text-purple-700 dark:text-purple-400 text-[10px]">
                        {mrn.vinodApproval?.approvedAt &&
                          new Date(mrn.vinodApproval.approvedAt).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      {supervisorApproved ? 'Pending Sign-off' : 'Waiting for Supervisor'}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Stores */}
              <div
                className={`p-3 rounded-xl border transition ${
                  isIssued
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">4. Stores Issuance</span>
                  {isIssued ? (
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px]">
                  {isIssued ? (
                    <>
                      <div className="font-semibold">{mrn.storesIssue?.issuedBy || 'Issued'}</div>
                      <div className="text-emerald-700 dark:text-emerald-400 text-[10px]">
                        {mrn.storesIssue?.issuedAt &&
                          new Date(mrn.storesIssue.issuedAt).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      {isManagementApproved ? 'Ready to Issue' : 'Pending Approvals'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table with Clear Item No, Description, UoM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Material Items Breakdown
              </h3>
              {isIssued && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked & Issued
                </span>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-40">Item No. / Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 w-32">Material Request QTY</th>
                      <th className="py-2.5 px-3 w-36">Material Issued QTY</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      <th className="py-2.5 px-3 w-28 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {storeItems.map((item, idx) => {
                      const displayCode = item.itemCode || resolveItemCode(item);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {item.itemNo}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded">
                              {displayCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100 break-words">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.requestQty} <span className="font-mono font-bold text-slate-500">{item.unit || 'NOS'}</span>
                          </td>
                          <td className="py-2 px-3">
                            {canStoresIssue ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.issueQty}
                                onChange={(e) => handleStoreQtyChange(idx, Number(e.target.value))}
                                placeholder="Issue Qty"
                                className="w-full text-xs font-bold p-1.5 border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 rounded-lg focus:outline-none"
                              />
                            ) : (
                              <span
                                className={`font-bold ${
                                  item.issueQty > 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {item.issueQty !== undefined && item.issueQty > 0
                                  ? `${item.issueQty} ${item.unit || 'NOS'}`
                                  : '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {canStoresIssue ? (
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={(e) => handleStoreRemarksChange(idx, e.target.value)}
                                placeholder="Stores remarks"
                                className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                              />
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400">{item.remarks || '-'}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.isIssued || isIssued ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Issued
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                                Pending
                              </span>
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

          {/* Stores Remarks */}
          {mrn.storesIssue?.storesRemarks && (
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                Stores Remarks:
              </span>
              <p className="text-emerald-800 dark:text-emerald-200">{mrn.storesIssue.storesRemarks}</p>
            </div>
          )}

          {/* Interactive Action Control Section based on Role */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 print:hidden space-y-4">
            {/* Stores Warning if awaiting Management */}
            {currentUser.role === 'stores' && !isIssued && supervisorApproved && !isManagementApproved && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-4 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-0.5">Management Authorization Required</span>
                  <span>
                    Supervisor has approved this MRN, but it is currently awaiting Management authorization (Mr. Vinod).
                    Stores cannot issue materials until Management approval is granted.
                  </span>
                </div>
              </div>
            )}

            {/* 1. Supervisor Approval Action - WITH EDITABLE ITEMS & ITEM NO */}
            {canApproveAsSupervisor && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                    Supervisor Sign-Off — Review & Edit Items
                  </h4>
                </div>

                <div className="mb-3 border border-amber-200 dark:border-amber-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[620px]">
                      <thead className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-semibold">
                        <tr>
                          <th className="py-2 px-2 w-8 text-center">#</th>
                          <th className="py-2 px-2 w-32">Item No. / Code</th>
                          <th className="py-2 px-2">Description</th>
                          <th className="py-2 px-2 w-20">Qty</th>
                          <th className="py-2 px-2 w-20">Unit</th>
                          <th className="py-2 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 dark:divide-amber-800 bg-white dark:bg-slate-900">
                        {supervisorItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 text-center text-amber-500 font-bold">{idx + 1}</td>
                            <td className="py-1.5 px-1">
                              <input
                                type="text"
                                placeholder="Item Code"
                                value={item.itemCode || ''}
                                onChange={(e) => {
                                  const updated = [...supervisorItems];
                                  updated[idx].itemCode = e.target.value;
                                  setSupervisorItems(updated);
                                }}
                                className="w-full text-xs font-mono font-bold p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none uppercase"
                              />
                            </td>
                            <td className="py-1.5 px-1">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...supervisorItems];
                                  updated[idx].description = e.target.value;
                                  setSupervisorItems(updated);
                                }}
                                className="w-full text-xs p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.requestQty}
                                onChange={(e) => {
                                  const updated = [...supervisorItems];
                                  updated[idx].requestQty = Number(e.target.value) || 0;
                                  setSupervisorItems(updated);
                                }}
                                className="w-full text-xs p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none text-center"
                              />
                            </td>
                            <td className="py-1.5 px-1">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => {
                                  const updated = [...supervisorItems];
                                  updated[idx].unit = e.target.value;
                                  setSupervisorItems(updated);
                                }}
                                className="w-full text-xs p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none uppercase text-center"
                              />
                            </td>
                            <td className="py-1.5 px-1 text-center">
                              {supervisorItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSupervisorItems(supervisorItems.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-400 hover:text-red-600 transition"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSupervisorItems([
                      ...supervisorItems,
                      {
                        _id: undefined,
                        itemNo: supervisorItems.length + 1,
                        itemCode: '',
                        description: '',
                        requestQty: 0,
                        unit: 'NOS',
                        remarks: '',
                      },
                    ]);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline mb-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Item
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Supervisor Name"
                    value={supervisorApproverName}
                    onChange={(e) => setSupervisorApproverName(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-700 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Approval comments / notes (optional)"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-700 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovalAction('supervisor')}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve as Supervisor
                  </button>
                  <button
                    onClick={() => handleApprovalAction('reject')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}

            {/* 2. Mr. Niranjan Approval Action */}
            {canApproveAsNiranjan && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                    Mr. Niranjan - Plant Approval
                  </h4>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Comments / note (optional)"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none"
                  />
                  <button
                    onClick={() => handleApprovalAction('niranjan')}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow shrink-0"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve as Mr. Niranjan
                  </button>
                </div>
              </div>
            )}

            {/* 3. Mr. Vinod Approval Action */}
            {canApproveAsVinod && (
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                    Mr. Vinod - Final Plant Authorization
                  </h4>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 mb-3">
                  {niranjanApproved
                    ? 'Mr. Niranjan has approved. You can give the final authorization.'
                    : 'You have full authorization to approve even if Mr. Niranjan has not approved yet.'}
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Mr. Vinod comments (optional)"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-purple-300 dark:border-purple-700 rounded-xl focus:outline-none"
                  />
                  <button
                    onClick={() => handleApprovalAction('vinod')}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition shadow shrink-0"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Final Approval by Mr. Vinod
                  </button>
                </div>
              </div>
            )}

            {/* 4. Stores Issuance Action */}
            {canStoresIssue && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                    Stores Department - Issue Materials
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-3">
                  Please verify Material Issue QTY above. Once issued, this MRN cannot be reversed or re-edited.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Issued By (Stores Officer Name)"
                    value={issuedByName}
                    onChange={(e) => setIssuedByName(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Stores Remarks / Batch / Rack No (optional)"
                    value={storesRemarks}
                    onChange={(e) => setStoresRemarks(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStoresIssue}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Issue Materials & Lock MRN
                </button>
              </div>
            )}

            {/* Locked Notification if already issued */}
            {isIssued && (
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>This MRN has been permanently issued by Stores. Editing and deleting are locked.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Modal Bottom Footer with Close Window Button */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 px-5 sm:px-7 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            MRN: <span className="font-mono font-bold text-slate-800 dark:text-white">{mrn.mrnNo}</span> ({mrn.department})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold rounded-xl shadow-md transition"
          >
            <X className="w-4 h-4" />
            <span>Close Window</span>
          </button>
        </div>
      </div>
    </div>
  );
}
