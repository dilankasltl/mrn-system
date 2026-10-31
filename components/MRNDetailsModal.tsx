'use client';

import React, { useState } from 'react';
import { IMRN, CurrentUser } from '@/types';
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

interface MRNDetailsModalProps {
  mrn: IMRN | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onMRNUpdated: (updatedMRN: IMRN) => void;
  onMRNDeleted?: (mrnId: string) => void;
  onOpenLogin?: () => void;
}

export default function MRNDetailsModal({
  mrn,
  isOpen,
  onClose,
  currentUser,
  onMRNUpdated,
  onMRNDeleted,
  onOpenLogin,
}: MRNDetailsModalProps) {
  if (!isOpen || !mrn) return null;

  // Local state for stores issue form
  const [storeItems, setStoreItems] = useState(
    (mrn.items || []).map((it) => ({
      _id: it._id,
      itemNo: it.itemNo,
      description: it.description,
      requestQty: it.requestQty,
      unit: it.unit || 'Nos',
      issueQty: it.issueQty !== undefined && it.issueQty > 0 ? it.issueQty : it.requestQty,
      remarks: it.remarks || '',
      isIssued: it.isIssued || false,
    }))
  );

  // Local state for supervisor editable items (before approval)
  const [supervisorItems, setSupervisorItems] = useState(
    (mrn.items || []).map((it) => ({
      _id: it._id,
      itemNo: it.itemNo,
      description: it.description,
      requestQty: it.requestQty,
      unit: it.unit || 'Nos',
      remarks: it.remarks || '',
    }))
  );

  const [storesRemarks, setStoresRemarks] = useState(mrn.storesIssue?.storesRemarks || '');
  const [issuedByName, setIssuedByName] = useState(
    currentUser.role === 'stores' ? currentUser.name : 'Stores Officer'
  );
  const [supervisorApproverName, setSupervisorApproverName] = useState(
    currentUser.role === 'supervisor' ? currentUser.name : 'Supervisor'
  );
  const [approvalComments, setApprovalComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Stores Qty Change
  const handleStoreQtyChange = (index: number, val: number) => {
    const updated = [...storeItems];
    updated[index].issueQty = val;
    setStoreItems(updated);
  };

  const handleStoreRemarksChange = (index: number, val: string) => {
    const updated = [...storeItems];
    updated[index].remarks = val;
    setStoreItems(updated);
  };

  // Perform Approval Action
  const handleApprovalAction = async (actionType: 'supervisor' | 'niranjan' | 'vinod' | 'reject') => {
    setError('');
    setSuccess('');
    setLoading(true);

    let approver = currentUser.name;
    if (actionType === 'supervisor') approver = supervisorApproverName;
    if (actionType === 'niranjan') approver = 'Mr. Niranjan';
    if (actionType === 'vinod') approver = 'Mr. Vinod';

    try {
      const payload: any = {
        approvalType: actionType,
        approvedBy: approver,
        comments: approvalComments,
      };

      // If supervisor is approving, include possibly edited items
      if (actionType === 'supervisor') {
        payload.items = supervisorItems;
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
    } catch (err: any) {
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

      setSuccess(`Materials for ${mrn.mrnNo} have been issued and permanently locked!`);
      onMRNUpdated(data.mrn);
    } catch (err: any) {
      setError(err.message || 'Error occurred while issuing');
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

      if (onMRNDeleted) onMRNDeleted(mrn._id as string);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const isIssued = mrn.isLocked || mrn.status === 'ISSUED';
  const supervisorApproved = mrn.supervisorApproval?.approved;
  const niranjanApproved = mrn.niranjanApproval?.approved;
  const vinodApproved = mrn.vinodApproval?.approved;

  // Can this user perform supervisor approval?
  const canApproveAsSupervisor =
    !isIssued &&
    !supervisorApproved &&
    (currentUser.role === 'admin' ||
      (currentUser.role === 'supervisor' && currentUser.department === mrn.department));

  // Can Niranjan approve?
  const canApproveAsNiranjan =
    !isIssued &&
    supervisorApproved &&
    !niranjanApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'management_niranjan');

  // Can Vinod approve?
  // Note: Mr. Vinod can approve EVEN IF Niranjan has not approved yet!
  const canApproveAsVinod =
    !isIssued &&
    supervisorApproved &&
    !vinodApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'management_vinod');

  // Can Stores issue?
  const canStoresIssue =
    !isIssued &&
    supervisorApproved &&
    (currentUser.role === 'admin' || currentUser.role === 'stores');

  const hasAnyAction =
    canApproveAsSupervisor || canApproveAsNiranjan || canApproveAsVinod || canStoresIssue;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 print:shadow-none print:border-none transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TVS SUN-TWS" className="h-10 w-auto object-contain bg-white px-2 py-0.5 rounded-lg" />
            <div>
              <div className="text-xs font-bold uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                Sundaram Lanka Tyres LTD.
              </div>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {mrn.mrnNo}
                </h2>
                {isIssued ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                    <Lock className="w-3.5 h-3.5" /> ISSUED & LOCKED
                  </span>
                ) : mrn.status === 'APPROVED' ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> APPROVED (Stores Ready)
                  </span>
                ) : mrn.status === 'SUPERVISOR_APPROVED' || mrn.status === 'NIRANJAN_APPROVED' ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" /> PENDING MANAGEMENT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold">
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
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Special Banner if Mr. Vinod approved without Mr. Niranjan */}
        {vinodApproved && mrn.vinodApproval?.withoutNiranjan && (
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200 font-bold shadow-sm">
            <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              Notice: Approved by Mr. Vinod (Without Mr. Niranjan&apos;s approval)
            </span>
          </div>
        )}

        {/* MRN Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Department</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{mrn.department}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Requested By</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{mrn.requestedBy}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Date & Shift</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {new Date(mrn.date).toLocaleDateString()} ({mrn.shift || 'General'})
            </span>
          </div>
        </div>

        {/* Workflow Approval Stepper */}
        <div className="mt-5 p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
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
                    <div className="font-semibold">Approved by Mr. Niranjan</div>
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
                    {vinodApproved || (supervisorApproved && niranjanApproved)
                      ? 'Ready to Issue'
                      : 'Pending Approvals'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-5">
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
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">NO.</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 w-32">Material Request QTY</th>
                  <th className="py-2.5 px-3 w-36">Material Issue QTY</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {storeItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {item.itemNo}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.requestQty} {item.unit}
                    </td>

                    {/* Stores Material Issue QTY input */}
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
                            ? `${item.issueQty} ${item.unit}`
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stores Remarks */}
        {mrn.storesIssue?.storesRemarks && (
          <div className="mt-4 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
              Stores Remarks:
            </span>
            <p className="text-emerald-800 dark:text-emerald-200">{mrn.storesIssue.storesRemarks}</p>
          </div>
        )}

        {/* Interactive Action Control Section based on Role */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 print:hidden">
          {/* Action sections below - only show relevant ones */}

          {/* 1. Supervisor Approval Action - WITH EDITABLE ITEMS */}
          {canApproveAsSupervisor && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Supervisor Sign-Off — Review & Edit Items
                </h4>
              </div>

              {/* Editable items table for Supervisor */}
              <div className="mb-3 border border-amber-200 dark:border-amber-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-semibold">
                    <tr>
                      <th className="py-2 px-2 w-10 text-center">#</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 w-24">Qty</th>
                      <th className="py-2 px-2 w-20">Unit</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-amber-800 bg-white dark:bg-slate-900">
                    {supervisorItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2 text-center text-amber-500 font-bold">{idx + 1}</td>
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
                            value={item.requestQty}
                            onChange={(e) => {
                              const updated = [...supervisorItems];
                              updated[idx].requestQty = Number(e.target.value) || 0;
                              setSupervisorItems(updated);
                            }}
                            className="w-full text-xs p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
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
                            className="w-full text-xs p-1.5 border border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
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

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => {
                  setSupervisorItems([
                    ...supervisorItems,
                    {
                      _id: undefined,
                      itemNo: supervisorItems.length + 1,
                      description: '',
                      requestQty: 0,
                      unit: 'Nos',
                      remarks: '',
                    },
                  ]);
                }}
                className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline mb-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Item
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
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve as Supervisor
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
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                  Mr. Niranjan - Plant Approval
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Mr. Niranjan comments / note (optional)"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => handleApprovalAction('niranjan')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve as Mr. Niranjan
                </button>
              </div>
            </div>
          )}

          {/* 3. Mr. Vinod Approval Action */}
          {canApproveAsVinod && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                    Mr. Vinod - Final Authorization
                  </h4>
                </div>
                {!niranjanApproved && (
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
                    Mr. Niranjan has not approved yet
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 mb-3">
                {niranjanApproved
                  ? 'Mr. Niranjan has approved. You can give the final authorization.'
                  : 'You have full authorization to approve even if Mr. Niranjan has not approved yet.'}
              </p>
              <div className="flex items-center gap-3">
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
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Final Approval by Mr. Vinod
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
                Please verify Material Issue QTY above. Once issued, this MRN cannot be reversed or
                re-edited.
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
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Issue Materials & Lock MRN
              </button>
            </div>
          )}

          {/* Locked Notification if already issued */}
          {isIssued && (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>
                This MRN has been permanently issued by Stores. Editing and deleting are locked.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
