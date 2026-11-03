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
    const limit = parseInt(searchParams.get('limit') || '250', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const approvedBy = searchParams.get('approvedBy');
    const approvalFilter = searchParams.get('approvalFilter'); // 'my_approvals', 'pending_me', etc.

    const andConditions = [];

    // Department isolation
    if (role === 'department') {
      const lockedDept = userDept || department;
      if (lockedDept && lockedDept !== 'ALL') {
        andConditions.push({ department: lockedDept });
      }
    } else if (role === 'supervisor') {
      const supervisorDepts = searchParams.get('supervisorDepts');
      if (department && department !== 'ALL') {
        andConditions.push({ department });
      } else if (supervisorDepts) {
        const depts = supervisorDepts.split(',').map((s) => s.trim()).filter(Boolean);
        if (depts.length > 0) {
          andConditions.push({ department: { $in: depts } });
        }
      } else if (userDept && userDept !== 'ALL') {
        andConditions.push({ department: userDept });
      }
    } else {
      if (department && department !== 'ALL') {
        andConditions.push({ department });
      }
    }

    // Management Isolation: Mr. Niranjan and Mr. Vinod can ONLY view MRNs after Supervisor has approved them!
    if (role === 'management_niranjan' || role === 'management_vinod') {
      andConditions.push({ 'supervisorApproval.approved': true });
    }

    // Date filtering (day, date range, or month)
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

    // Role-specific Approval Filters
    if (approvalFilter === 'my_approvals') {
      if (role === 'supervisor' && approvedBy) {
        andConditions.push({
          'supervisorApproval.approved': true,
          'supervisorApproval.approvedBy': { $regex: new RegExp(approvedBy, 'i') },
        });
      } else if (role === 'management_niranjan') {
        andConditions.push({ 'niranjanApproval.approved': true });
      } else if (role === 'management_vinod') {
        andConditions.push({ 'vinodApproval.approved': true });
      } else if (role === 'stores') {
        andConditions.push({ 'storesIssue.issued': true });
      }
    }

    // Status filter
    if (status && status !== 'ALL') {
      if (status === 'PENDING_MANAGEMENT') {
        andConditions.push({
          status: { $in: ['SUPERVISOR_APPROVED', 'NIRANJAN_APPROVED', 'VINOD_APPROVED'] },
          'storesIssue.issued': { $ne: true },
        });
      } else if (status === 'ISSUED') {
        andConditions.push({
          $or: [{ status: 'ISSUED' }, { isLocked: true }],
        });
      } else if (status === 'READY_TO_ISSUE' || status === 'APPROVED') {
        andConditions.push({
          'supervisorApproval.approved': true,
          $or: [{ 'vinodApproval.approved': true }, { status: 'APPROVED' }],
          'storesIssue.issued': { $ne: true },
        });
      } else {
        andConditions.push({ status });
      }
    }

    // Role-specific status conveniences
    if (role === 'management_niranjan' && status === 'PENDING_MY_APPROVAL') {
      andConditions.push({
        'supervisorApproval.approved': true,
        'niranjanApproval.approved': false,
        status: { $nin: ['REJECTED', 'ISSUED'] },
      });
    } else if (role === 'management_vinod' && status === 'PENDING_MY_APPROVAL') {
      andConditions.push({
        'supervisorApproval.approved': true,
        'vinodApproval.approved': false,
        status: { $nin: ['REJECTED', 'ISSUED'] },
      });
    } else if (role === 'stores') {
      if (status === 'READY_TO_ISSUE') {
        andConditions.push({
          'supervisorApproval.approved': true,
          $or: [{ 'vinodApproval.approved': true }, { status: 'APPROVED' }],
          'storesIssue.issued': { $ne: true },
        });
      }
    }

    // Search query
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      andConditions.push({
        $or: [
          { mrnNo: regex },
          { department: regex },
          { requestedBy: regex },
          { 'items.description': regex },
        ],
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

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
    const { department, requestedBy, date, generalRemarks, items } = body;

    if (!department || !department.trim()) {
      return NextResponse.json({ success: false, error: 'Department is required' }, { status: 400 });
    }
    if (!requestedBy || !requestedBy.trim()) {
      return NextResponse.json({ success: false, error: 'Requester name is required' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required in MRN' }, { status: 400 });
    }

    const sanitizedItems = items
      .filter((item) => item.description && item.description.trim())
      .map((item, idx) => ({
        itemNo: item.itemNo || idx + 1,
        description: item.description.trim(),
        requestQty: Number(item.requestQty) || 0,
        unit: item.unit ? item.unit.trim() : 'Nos',
        issueQty: 0,
        remarks: item.remarks ? item.remarks.trim() : '',
        isIssued: false,
      }));

    if (sanitizedItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Please enter a description for at least one item' }, { status: 400 });
    }

    const mrnNo = await generateUniqueMRNNo(department.trim());

    const newMRN = await MRN.create({
      mrnNo,
      department: department.trim(),
      requestedBy: requestedBy.trim(),
      date: date ? new Date(date) : new Date(),
      generalRemarks: generalRemarks ? generalRemarks.trim() : '',
      items: sanitizedItems,
      status: 'PENDING_SUPERVISOR',
      supervisorApproval: { approved: false },
      niranjanApproval: { approved: false },
      vinodApproval: { approved: false, withoutNiranjan: false },
      storesIssue: { issued: false },
      isLocked: false,
    });

    return NextResponse.json({
      success: true,
      message: `MRN ${mrnNo} generated successfully`,
      mrn: newMRN,
    });
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
    if (role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only System Admin can delete all MRNs.' }, { status: 403 });
    }
    const result = await MRN.deleteMany({});
    return NextResponse.json({
      success: true,
      message: `Successfully deleted all MRNs (${result.deletedCount} items removed)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete all MRNs error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
