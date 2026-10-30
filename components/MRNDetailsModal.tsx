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
} from 'lucide-react';

interface MRNDetailsModalProps {
  mrn: IMRN | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onMRNUpdated: (updatedMRN: IMRN) => void;
  onMRNDeleted?: (mrnId: string) => void;
}

export default function MRNDetailsModal({
  mrn,
  isOpen,
  onClose,
  currentUser,
  onMRNUpdated,
  onMRNDeleted,
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
      const res = await fetch(`/api/mrn/${mrn._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalType: actionType,
          approvedBy: approver,
          comments: approvalComments,
        }),
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 my-8 print:shadow-none print:border-none">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold uppercase text-sky-600 tracking-wider">
              Sundaram Lanka Tyres LTD.
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{mrn.mrnNo}</h2>
              {isIssued ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" /> ISSUED & LOCKED
                </span>
              ) : mrn.status === 'APPROVED' ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> APPROVED (Ready for Stores)
                </span>
              ) : mrn.status === 'SUPERVISOR_APPROVED' || mrn.status === 'NIRANJAN_APPROVED' ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" /> PENDING MANAGEMENT
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" /> PENDING SUPERVISOR
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Print MRN"
            >
              <Printer className="w-4 h-4" />
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="Delete MRN (Admin only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Special Banner if Mr. Vinod approved without Mr. Niranjan */}
        {vinodApproved && mrn.vinodApproval?.withoutNiranjan && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-300 rounded-xl flex items-center gap-2 text-xs text-purple-900 font-semibold shadow-sm">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Notice: Approved by Mr. Vinod (Without Mr. Niranjan&apos;s approval)
            </span>
          </div>
        )}

        {/* MRN Metadata Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="font-bold text-slate-800 text-sm">{mrn.department}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Requested By</span>
            <span className="font-bold text-slate-800 text-sm">{mrn.requestedBy}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Date & Shift</span>
            <span className="font-bold text-slate-800">
              {new Date(mrn.date).toLocaleDateString()} ({mrn.shift || 'General'})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Priority</span>
            <span
              className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                mrn.priority === 'Urgent'
                  ? 'bg-red-100 text-red-800'
                  : mrn.priority === 'High'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {mrn.priority || 'Normal'}
            </span>
          </div>
        </div>

        {/* Workflow Approval Stepper */}
        <div className="mt-5 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Approval & Issuance Lifecycle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Supervisor */}
            <div
              className={`p-3 rounded-lg border transition ${
                supervisorApproved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">1. Supervisor Approval</span>
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
                    <div className="text-emerald-700 text-[10px]">
                      {mrn.supervisorApproval?.approvedAt &&
                        new Date(mrn.supervisorApproval.approvedAt).toLocaleString()}
                    </div>
                  </>
                ) : (
                  <span className="text-amber-600 font-medium">Pending Approval</span>
                )}
              </div>
            </div>

            {/* 2. Mr. Niranjan */}
            <div
              className={`p-3 rounded-lg border transition ${
                niranjanApproved
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-white border-slate-200 text-slate-600'
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
                    <div className="text-blue-700 text-[10px]">
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
              className={`p-3 rounded-lg border transition ${
                vinodApproved
                  ? 'bg-purple-50 border-purple-200 text-purple-900'
                  : 'bg-white border-slate-200 text-slate-600'
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
                      <span className="text-[10px] text-purple-700 font-semibold block">
                        (Without Niranjan Approval)
                      </span>
                    )}
                    <div className="text-purple-700 text-[10px]">
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
              className={`p-3 rounded-lg border transition ${
                isIssued
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
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
                    <div className="text-emerald-700 text-[10px]">
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
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Material Items Breakdown
            </h3>
            {isIssued && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Locked & Issued
              </span>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">NO.</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 w-32">Material Request QTY</th>
                  <th className="py-2.5 px-3 w-36">Material Issue QTY</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {storeItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      {item.itemNo}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
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
                          className="w-full text-xs font-bold p-1.5 border border-emerald-300 bg-emerald-50/40 rounded focus:border-emerald-600 focus:outline-none"
                        />
                      ) : (
                        <span
                          className={`font-bold ${
                            item.issueQty > 0 ? 'text-emerald-700' : 'text-slate-400'
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
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-slate-600">{item.remarks || '-'}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.isIssued || isIssued ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
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

        {/* Stores Remarks / Issuance Information */}
        {mrn.storesIssue?.storesRemarks && (
          <div className="mt-4 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs">
            <span className="font-bold text-emerald-900 block mb-0.5">Stores Remarks:</span>
            <p className="text-emerald-800">{mrn.storesIssue.storesRemarks}</p>
          </div>
        )}

        {/* Interactive Action Control Section based on Role */}
        <div className="mt-6 pt-5 border-t border-slate-200 print:hidden">
          {/* 1. Supervisor Approval Action */}
          {canApproveAsSupervisor && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Supervisor Sign-Off Required
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Supervisor Name"
                  value={supervisorApproverName}
                  onChange={(e) => setSupervisorApproverName(e.target.value)}
                  className="text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Approval comments / notes (optional)"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprovalAction('supervisor')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve as Supervisor
                </button>
                <button
                  onClick={() => handleApprovalAction('reject')}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition"
                >
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {/* 2. Mr. Niranjan Approval Action */}
          {canApproveAsNiranjan && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Mr. Niranjan - Plant Approval
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Mr. Niranjan comments / note (optional)"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="flex-1 text-xs p-2 bg-white border border-blue-300 rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => handleApprovalAction('niranjan')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve as Mr. Niranjan
                </button>
              </div>
            </div>
          )}

          {/* 3. Mr. Vinod Approval Action */}
          {canApproveAsVinod && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Mr. Vinod - Final Authorization
                  </h4>
                </div>
                {!niranjanApproved && (
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                    Mr. Niranjan has not approved yet
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-800 mb-3">
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
                  className="flex-1 text-xs p-2 bg-white border border-purple-300 rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => handleApprovalAction('vinod')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Final Approval by Mr. Vinod
                </button>
              </div>
            </div>
          )}

          {/* 4. Stores Issuance Action */}
          {canStoresIssue && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Stores Department - Issue Materials
                </h4>
              </div>
              <p className="text-xs text-emerald-800 mb-3">
                Please verify Material Issue QTY above. Once issued, this MRN cannot be reversed or
                re-edited.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Issued By (Stores Officer Name)"
                  value={issuedByName}
                  onChange={(e) => setIssuedByName(e.target.value)}
                  className="text-xs p-2 bg-white border border-emerald-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Stores Remarks / Batch / Rack No (optional)"
                  value={storesRemarks}
                  onChange={(e) => setStoresRemarks(e.target.value)}
                  className="text-xs p-2 bg-white border border-emerald-300 rounded-lg focus:outline-none"
                />
              </div>
              <button
                onClick={handleStoresIssue}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Issue Materials & Lock MRN
              </button>
            </div>
          )}

          {/* Locked Notification if already issued */}
          {isIssued && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-600 flex items-center justify-center gap-2">
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
