import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Department from '@/models/Department';
import { INITIAL_DEPARTMENTS } from '@/lib/seedData';

export async function GET() {
  try {
    await connectToDatabase();
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany(INITIAL_DEPARTMENTS);
      return NextResponse.json({ success: true, message: `Database initialized and seeded with ${INITIAL_DEPARTMENTS.length} departments and supervisors.`, seeded: true, count: INITIAL_DEPARTMENTS.length });
    }
    // Always sync supervisors from seed data so they stay up to date
    for (const dept of INITIAL_DEPARTMENTS) {
      await Department.findOneAndUpdate(
        { name: dept.name },
        { $set: { supervisors: dept.supervisors } },
        { upsert: false }
      );
    }
    return NextResponse.json({ success: true, message: `Database connected. ${count} departments available. Supervisors synced.`, seeded: false, count });
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
    const count = await Department.countDocuments();
    return NextResponse.json({ success: true, message: `Successfully synchronized ${count} departments and supervisors.`, count });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
