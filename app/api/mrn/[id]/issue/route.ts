import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { items, issuedBy, storesRemarks } = body;

    const mrn = await (MRN as any).findById(id);
    if (!mrn) {
      return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    }

    // Protection rule 1: Once issued and locked, stores cannot undo or re-issue!
    if (mrn.isLocked || mrn.status === 'ISSUED') {
      return NextResponse.json(
        {
          success: false,
          error: 'This MRN has already been issued. Issued status cannot be reversed or modified.',
        },
        { status: 400 }
      );
    }

    // Verify supervisor approval at minimum
    if (!mrn.supervisorApproval?.approved) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot issue materials: Supervisor approval has not been granted yet.',
        },
        { status: 400 }
      );
    }

    // Update items: Stores can only update issueQty, isIssued, and remarks!
    // Description, ItemNo, and RequestQty CANNOT be changed by Stores.
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided for issuance.' },
        { status: 400 }
      );
    }

    const now = new Date();
    let allIssued = true;
    let anyIssued = false;

    // Match and update existing items safely
    for (let i = 0; i < mrn.items.length; i++) {
      const origItem = mrn.items[i];
      const incomingItem = items.find(
        (it: any) =>
          (it._id && it._id.toString() === origItem._id?.toString()) ||
          it.itemNo === origItem.itemNo
      );

      if (incomingItem) {
        const issueQty = Number(incomingItem.issueQty) || 0;
        origItem.issueQty = issueQty;
        origItem.isIssued = incomingItem.isIssued !== undefined ? Boolean(incomingItem.isIssued) : issueQty > 0;
        if (incomingItem.remarks) {
          origItem.remarks = incomingItem.remarks.trim();
        }
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

    // Record stores issue metadata
    mrn.storesIssue = {
      issued: true,
      issuedBy: issuedBy || 'Stores Officer',
      issuedAt: now,
      storesRemarks: storesRemarks || '',
    };

    // Set status to ISSUED (or PARTIALLY_ISSUED if some remain)
    mrn.status = allIssued ? 'ISSUED' : anyIssued ? 'PARTIALLY_ISSUED' : 'ISSUED';

    // Lock MRN permanently so no one (except Admin) can edit/delete
    mrn.isLocked = true;

    await mrn.save();

    return NextResponse.json({
      success: true,
      message: `Materials for MRN ${mrn.mrnNo} have been successfully issued and recorded.`,
      mrn,
    });
  } catch (error: any) {
    console.error('Stores issue error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
