import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';
import mongoose from 'mongoose';
import {
  sendSupervisorApprovalNotification,
  sendNiranjanApprovalNotification,
} from '@/lib/email';

async function findMRN(id) {
  if (!id) return null;
  const cleanId = decodeURIComponent(id).trim();
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    const doc = await MRN.findById(cleanId);
    if (doc) return doc;
  }
  return await MRN.findOne({ mrnNo: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
}

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { approvalType, approvedBy, comments } = body;
    const mrn = await findMRN(id);
    if (!mrn) return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    if (mrn.isLocked || mrn.status === 'ISSUED') return NextResponse.json({ success: false, error: 'Cannot modify approval: MRN is already issued and locked.' }, { status: 400 });
    const now = new Date();
    if (approvalType === 'supervisor') {
      if (body.items && Array.isArray(body.items)) {
        mrn.items = body.items.filter((it) => it.description && it.description.trim() !== '').map((it, idx) => ({
          itemNo: idx + 1,
          itemCode: it.itemCode ? it.itemCode.trim() : (mrn.items[idx]?.itemCode || ''),
          description: it.description.trim(),
          requestQty: Number(it.requestQty) || 0,
          unit: it.unit ? it.unit.trim().toUpperCase() : 'Nos',
          issueQty: it.issueQty || 0,
          remarks: it.remarks ? it.remarks.trim() : '',
          isIssued: false,
        }));
      }
      mrn.supervisorApproval = { approved: true, approvedBy: approvedBy || 'Supervisor', approvedAt: now, comments: comments || '' };
      mrn.status = 'SUPERVISOR_APPROVED';
      // Automated background email notification to Mr. Niranjan
      sendSupervisorApprovalNotification({
        mrn,
        supervisorName: approvedBy || 'Supervisor',
      }).catch((err) => console.error('Automated email send failed:', err));
    } else if (approvalType === 'niranjan') {
      if (!mrn.supervisorApproval?.approved) return NextResponse.json({ success: false, error: 'Supervisor approval must be completed first.' }, { status: 400 });
      mrn.niranjanApproval = { approved: true, approvedBy: approvedBy || 'Mr. Niranjan', approvedAt: now, comments: comments || '' };
      mrn.status = mrn.vinodApproval?.approved ? 'APPROVED' : 'NIRANJAN_APPROVED';
      // Automated background email notification to Mr. Vinod (Final Approval)
      sendNiranjanApprovalNotification({
        mrn,
        approverName: approvedBy || 'Mr. Niranjan',
        comments: comments || '',
      }).catch((err) => console.error('Automated email to Mr. Vinod failed:', err));
    } else if (approvalType === 'vinod') {
      if (!mrn.supervisorApproval?.approved) return NextResponse.json({ success: false, error: 'Supervisor approval must be completed first.' }, { status: 400 });
      const niranjanDone = Boolean(mrn.niranjanApproval?.approved);
      mrn.vinodApproval = { approved: true, approvedBy: approvedBy || 'Mr. Vinod', approvedAt: now, comments: comments || '', withoutNiranjan: !niranjanDone };
      mrn.status = 'APPROVED';
    } else if (approvalType === 'reject') {
      mrn.status = 'REJECTED';
      if (comments) mrn.generalRemarks = `${mrn.generalRemarks ? mrn.generalRemarks + ' | ' : ''}Rejected by ${approvedBy || 'Management'}: ${comments}`;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid approval type' }, { status: 400 });
    }
    await mrn.save();
    return NextResponse.json({ success: true, message: `Approval recorded successfully for ${mrn.mrnNo}`, mrn });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
