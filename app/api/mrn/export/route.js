import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const approvedBy = searchParams.get('approvedBy');

    const andConditions = [];

    if (department && department !== 'ALL') {
      andConditions.push({ department });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      andConditions.push({ date: { $gte: start, $lte: end } });
    } else if (startDate) {
      const start = new Date(startDate);
      andConditions.push({ date: { $gte: start } });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      andConditions.push({ date: { $lte: end } });
    }

    if (approvedBy) {
      andConditions.push({
        'supervisorApproval.approved': true,
        'supervisorApproval.approvedBy': { $regex: new RegExp(approvedBy, 'i') },
      });
    }

    if (status && status !== 'ALL') {
      if (status === 'ISSUED') {
        andConditions.push({ $or: [{ status: 'ISSUED' }, { isLocked: true }] });
      } else {
        andConditions.push({ status });
      }
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const mrns = await MRN.find(query).sort({ createdAt: -1 }).lean();

    const rows = [];
    mrns.forEach((m) => {
      const formattedDate = m.date ? new Date(m.date).toLocaleDateString() : '';
      if (m.items && m.items.length > 0) {
        m.items.forEach((it) => {
          rows.push({
            'MRN Number': m.mrnNo,
            'Date': formattedDate,
            'Department': m.department,
            'Requested By': m.requestedBy,
            'Shift': m.shift || 'General',
            'Overall Status': m.status?.replace(/_/g, ' '),
            'Line No': it.itemNo,
            'Item No / Code': it.itemCode || '-',
            'Item Description': it.description,
            'Inventory UoM': it.unit || 'NOS',
            'Material Request Qty': it.requestQty,
            'Material Issued QTY': it.issueQty || 0,
            'Supervisor Approved': m.supervisorApproval?.approved ? 'YES' : 'NO',
            'Supervisor Name': m.supervisorApproval?.approvedBy || '',
            'Mr. Niranjan Approved': m.niranjanApproval?.approved ? 'YES' : 'NO',
            'Mr. Vinod Approved': m.vinodApproval?.approved ? 'YES' : 'NO',
            'Stores Issued': m.storesIssue?.issued || m.isLocked ? 'YES' : 'NO',
            'Stores Remarks': m.storesIssue?.storesRemarks || '',
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MRN History');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MRN_Export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
