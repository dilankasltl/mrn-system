import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    let mrn;
    if (id.startsWith('MRN-')) {
      mrn = await (MRN as any).findOne({ mrnNo: id }).lean();
    } else {
      mrn = await (MRN as any).findById(id).lean();
    }

    if (!mrn) {
      return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, mrn });
  } catch (error: any) {
    console.error('Fetch single MRN error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { role, items, generalRemarks, priority, shift } = body;

    const mrn = await (MRN as any).findById(id);
    if (!mrn) {
      return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    }

    // Protection rule: Once locked or issued, cannot edit unless admin!
    if (mrn.isLocked || mrn.status === 'ISSUED') {
      if (role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'This MRN is already issued and locked. Only Admin can modify it.',
          },
          { status: 403 }
        );
      }
    }

    // If supervisor approval is already completed, standard department cannot edit items
    if (mrn.supervisorApproval?.approved && role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'This MRN is already approved by supervisor. It cannot be modified by department.',
        },
        { status: 403 }
      );
    }

    if (priority) mrn.priority = priority;
    if (shift) mrn.shift = shift;
    if (generalRemarks !== undefined) mrn.generalRemarks = generalRemarks;

    if (items && Array.isArray(items)) {
      mrn.items = items.map((it: any, idx: number) => ({
        itemNo: idx + 1,
        description: it.description?.trim() || '',
        requestQty: Number(it.requestQty) || 0,
        unit: it.unit || 'Nos',
        issueQty: it.issueQty || 0,
        remarks: it.remarks || '',
        isIssued: it.isIssued || false,
      }));
    }

    await mrn.save();

    return NextResponse.json({
      success: true,
      message: 'MRN updated successfully',
      mrn,
    });
  } catch (error: any) {
    console.error('Update MRN error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const mrn = await (MRN as any).findById(id);
    if (!mrn) {
      return NextResponse.json({ success: false, error: 'MRN not found' }, { status: 404 });
    }

    // Protection: If issued or locked, only Admin can delete
    if ((mrn.isLocked || mrn.status === 'ISSUED') && role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Issued MRNs cannot be deleted. Admin authorization is required.',
        },
        { status: 403 }
      );
    }

    await MRN.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `MRN ${mrn.mrnNo} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete MRN error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
