import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MRN from '@/models/MRN';
import Department from '@/models/Department';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [totalMrns, pendingSupervisor, pendingNiranjan, pendingVinod, readyToIssue, issued, departments] =
      await Promise.all([
        MRN.countDocuments(),
        MRN.countDocuments({ status: 'PENDING_SUPERVISOR' }),
        MRN.countDocuments({
          'supervisorApproval.approved': true,
          'niranjanApproval.approved': false,
          status: { $nin: ['REJECTED', 'ISSUED'] },
        }),
        MRN.countDocuments({
          'supervisorApproval.approved': true,
          'vinodApproval.approved': false,
          status: { $nin: ['REJECTED', 'ISSUED'] },
        }),
        MRN.countDocuments({
          'supervisorApproval.approved': true,
          'storesIssue.issued': false,
          status: { $nin: ['REJECTED'] },
        }),
        MRN.countDocuments({ status: 'ISSUED' }),
        Department.find({ active: { $ne: false } }).select('name code category').lean(),
      ]);

    // Department-wise aggregation
    const deptStats = await MRN.aggregate([
      {
        $group: {
          _id: '$department',
          totalCount: { $sum: 1 },
          issuedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'ISSUED'] }, 1, 0] },
          },
          pendingCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['PENDING_SUPERVISOR', 'SUPERVISOR_APPROVED', 'NIRANJAN_APPROVED', 'VINOD_APPROVED', 'APPROVED'],
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalItemsRequested: { $sum: { $size: '$items' } },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    // Material requests vs issued item quantities
    const itemQuantities = await MRN.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$department',
          totalRequestedQty: { $sum: '$items.requestQty' },
          totalIssuedQty: { $sum: '$items.issueQty' },
        },
      },
      { $sort: { totalRequestedQty: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalMrns,
        pendingSupervisor,
        pendingNiranjan,
        pendingVinod,
        readyToIssue,
        issued,
      },
      departmentStats: deptStats,
      itemQuantities,
      totalDepartments: departments.length,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
