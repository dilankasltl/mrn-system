import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';
import { generateUniqueMRNNo } from '@/lib/generateMrnNo';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const userDept = searchParams.get('userDept');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const query = {};
    if (role === 'department' || role === 'supervisor') {
      const lockedDept = userDept || department;
      if (lockedDept) query.department = lockedDept;
      if (search && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, 'i');
        query.$and = [{ department: lockedDept }, { $or: [{ mrnNo: regex }, { requestedBy: regex }, { 'items.description': regex }] }];
        delete query.department;
      }
    } else {
      if (department && department !== 'ALL') query.department = department;
      if (search && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, 'i');
        query.$or = [{ mrnNo: regex }, { department: regex }, { requestedBy: regex }, { 'items.description': regex }];
      }
    }
    if (status && status !== 'ALL') {
      if (status === 'PENDING_MANAGEMENT') {
        query.status = { $in: ['SUPERVISOR_APPROVED', 'NIRANJAN_APPROVED', 'VINOD_APPROVED'] };
      } else {
        query.status = status;
      }
    }
    if (role === 'management_niranjan' && status === 'PENDING_MY_APPROVAL') {
      query['supervisorApproval.approved'] = true;
      query['niranjanApproval.approved'] = false;
      query.status = { $nin: ['REJECTED', 'ISSUED'] };
    } else if (role === 'management_vinod' && status === 'PENDING_MY_APPROVAL') {
      query['supervisorApproval.approved'] = true;
      query['vinodApproval.approved'] = false;
      query.status = { $nin: ['REJECTED', 'ISSUED'] };
    } else if (role === 'stores') {
      if (status === 'READY_TO_ISSUE') {
        query['supervisorApproval.approved'] = true;
        query['storesIssue.issued'] = { $ne: true };
      } else if (status === 'ISSUED') {
        query['storesIssue.issued'] = true;
      }
    }
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [{ mrnNo: regex }, { department: regex }, { requestedBy: regex }, { 'items.description': regex }];
    }
    const mrns = await MRN.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json({ success: true, count: mrns.length, mrns });
  } catch (error) {
    console.error('Fetch MRNs error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { department, requestedBy, shift, date, generalRemarks, items } = body;
    if (!department || !department.trim()) return NextResponse.json({ success: false, error: 'Department is required' }, { status: 400 });
    if (!requestedBy || !requestedBy.trim()) return NextResponse.json({ success: false, error: 'Requester name is required' }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: 'At least one item is required in MRN' }, { status: 400 });
    const sanitizedItems = items.filter((item) => item.description && item.description.trim()).map((item, idx) => ({
      itemNo: item.itemNo || idx + 1,
      description: item.description.trim(),
      requestQty: Number(item.requestQty) || 0,
      unit: item.unit ? item.unit.trim() : 'Nos',
      issueQty: 0,
      remarks: item.remarks ? item.remarks.trim() : '',
      isIssued: false,
    }));
    if (sanitizedItems.length === 0) return NextResponse.json({ success: false, error: 'Please enter a description for at least one item' }, { status: 400 });
    const mrnNo = await generateUniqueMRNNo(department.trim());
    const newMRN = await MRN.create({
      mrnNo, department: department.trim(), requestedBy: requestedBy.trim(), shift: shift || 'General',
      date: date ? new Date(date) : new Date(), generalRemarks: generalRemarks ? generalRemarks.trim() : '',
      items: sanitizedItems, status: 'PENDING_SUPERVISOR',
      supervisorApproval: { approved: false }, niranjanApproval: { approved: false },
      vinodApproval: { approved: false, withoutNiranjan: false }, storesIssue: { issued: false }, isLocked: false,
    });
    return NextResponse.json({ success: true, message: `MRN ${mrnNo} generated successfully`, mrn: newMRN });
  } catch (error) {
    console.error('Create MRN error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    if (role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized: Only System Admin can delete all MRNs.' }, { status: 403 });
    const result = await MRN.deleteMany({});
    return NextResponse.json({ success: true, message: `Successfully deleted all MRNs (${result.deletedCount} items removed)`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Delete all MRNs error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
