import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Department from '@/models/Department';
import User from '@/models/User';
import MRN from '@/models/MRN';
import { INITIAL_DEPARTMENTS } from '@/lib/seedData';
import { ensureUsersSeeded } from '@/lib/seedUsers';
import { ensureCatalogSeeded } from '@/lib/seedCatalog';

let hasInitRun = false;

export async function GET() {
  try {
    await connectToDatabase();
    if (hasInitRun) {
      return NextResponse.json({ success: true, message: 'Already initialized in this worker.' });
    }

    // Auto-migrate Purchasing -> Procurement
    await Department.updateMany({ name: 'Purchasing' }, { $set: { name: 'Procurement', code: 'PROC', category: 'Procurement' } });
    await User.updateMany({ department: 'Purchasing' }, { $set: { department: 'Procurement' } });
    await MRN.updateMany({ department: 'Purchasing' }, { $set: { department: 'Procurement' } });

    const validNames = INITIAL_DEPARTMENTS.map((d) => d.name);
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany(INITIAL_DEPARTMENTS);
    } else {
      // Sync supervisors & upsert valid departments
      for (const dept of INITIAL_DEPARTMENTS) {
        await Department.findOneAndUpdate(
          { name: dept.name },
          { $set: dept },
          { upsert: true, new: true }
        );
      }
      // Remove departments no longer in the list
      await Department.deleteMany({ name: { $nin: validNames } });
    }

    await ensureUsersSeeded();
    await ensureCatalogSeeded();
    const newCount = await Department.countDocuments();
    hasInitRun = true;
    return NextResponse.json({
      success: true,
      message: `Database synced. ${newCount} departments available.`,
      count: newCount,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to connect to database' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    for (const dept of INITIAL_DEPARTMENTS) {
      await Department.findOneAndUpdate({ name: dept.name }, { $set: dept }, { upsert: true, new: true });
    }
    await ensureUsersSeeded();
    await ensureCatalogSeeded();
    const count = await Department.countDocuments();
    return NextResponse.json({ success: true, message: `Successfully synchronized ${count} departments and supervisors.`, count });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
