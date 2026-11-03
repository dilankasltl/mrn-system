import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';
import mongoose from 'mongoose';

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
    const { items, issuedBy, storesRemarks } = body;

    const mrn = await findMRN(id);
    if (!mrn) {
      return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    }

    if (mrn.isLocked || mrn.status === 'ISSUED') {
      return NextResponse.json(
        { success: false, error: 'This MRN has already been issued. Issued status cannot be reversed or modified.' },
        { status: 400 }
      );
    }

    // 1. Must have supervisor approval
    if (!mrn.supervisorApproval?.approved) {
      return NextResponse.json(
        { success: false, error: 'Cannot issue materials: Supervisor approval has not been granted yet.' },
        { status: 400 }
      );
    }

    // 2. CRITICAL: Supervisor approval alone is NOT enough! Must have Management approval (Mr. Vinod / APPROVED status)
    const isManagementApproved = mrn.vinodApproval?.approved || mrn.status === 'APPROVED';
    if (!isManagementApproved) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot issue materials: Management authorization (Mr. Vinod) is required. Supervisor approval alone is not authorized for Stores issuance.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided for issuance.' }, { status: 400 });
    }

    const now = new Date();
    let allIssued = true;
    let anyIssued = false;

    for (let i = 0; i < mrn.items.length; i++) {
      const origItem = mrn.items[i];
      const incomingItem = items.find(
        (it) => (it._id && it._id.toString() === origItem._id?.toString()) || it.itemNo === origItem.itemNo
      );

      if (incomingItem) {
        const issueQty = Number(incomingItem.issueQty) || 0;
        origItem.issueQty = issueQty;
        origItem.isIssued = incomingItem.isIssued !== undefined ? Boolean(incomingItem.isIssued) : issueQty > 0;
        if (incomingItem.remarks) origItem.remarks = incomingItem.remarks.trim();
        if (origItem.isIssued) {
          origItem.issuedAt = now;
          anyIssued = true;
        } else {
          allIssued = false;
        }
      } else {
        allIssued = false;
      }
    }

    mrn.storesIssue = {
      issued: true,
      issuedBy: issuedBy || 'Stores Officer',
      issuedAt: now,
      storesRemarks: storesRemarks || '',
    };

    mrn.status = allIssued ? 'ISSUED' : anyIssued ? 'PARTIALLY_ISSUED' : 'ISSUED';
    mrn.isLocked = true;
    await mrn.save();

    return NextResponse.json({
      success: true,
      message: `Materials for MRN ${mrn.mrnNo} have been successfully issued and recorded.`,
      mrn,
    });
  } catch (error) {
    console.error('Stores issue error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
