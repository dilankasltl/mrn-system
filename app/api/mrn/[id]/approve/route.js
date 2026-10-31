import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { approvalType, approvedBy, comments } = body;
    const mrn = await MRN.findById(id);
    if (!mrn) return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    if (mrn.isLocked || mrn.status === 'ISSUED') return NextResponse.json({ success: false, error: 'Cannot modify approval: MRN is already issued and locked.' }, { status: 400 });
    const now = new Date();
    if (approvalType === 'supervisor') {
      if (body.items && Array.isArray(body.items)) {
        mrn.items = body.items.filter((it) => it.description && it.description.trim() !== '').map((it, idx) => ({
          itemNo: idx + 1, description: it.description.trim(), requestQty: Number(it.requestQty) || 0,
          unit: it.unit ? it.unit.trim() : 'Nos', issueQty: it.issueQty || 0, remarks: it.remarks ? it.remarks.trim() : '', isIssued: false,
        }));
      }
      mrn.supervisorApproval = { approved: true, approvedBy: approvedBy || 'Supervisor', approvedAt: now, comments: comments || '' };
      mrn.status = 'SUPERVISOR_APPROVED';
    } else if (approvalType === 'niranjan') {
      if (!mrn.supervisorApproval?.approved) return NextResponse.json({ success: false, error: 'Supervisor approval must be completed first.' }, { status: 400 });
      mrn.niranjanApproval = { approved: true, approvedBy: approvedBy || 'Mr. Niranjan', approvedAt: now, comments: comments || '' };
      mrn.status = mrn.vinodApproval?.approved ? 'APPROVED' : 'NIRANJAN_APPROVED';
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
