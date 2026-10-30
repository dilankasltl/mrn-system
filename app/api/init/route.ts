import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Department from '@/models/Department';
import { INITIAL_DEPARTMENTS } from '@/lib/seedData';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check if departments exist
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany(INITIAL_DEPARTMENTS);
      return NextResponse.json({
        success: true,
        message: `Database initialized and seeded with ${INITIAL_DEPARTMENTS.length} departments and supervisors.`,
        seeded: true,
        count: INITIAL_DEPARTMENTS.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Database connected. ${count} departments available.`,
      seeded: false,
      count,
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    // Force reseed / upsert departments
    for (const dept of INITIAL_DEPARTMENTS) {
      await Department.findOneAndUpdate(
        { name: dept.name },
        { $set: dept },
        { upsert: true, new: true }
      );
    }
    const count = await Department.countDocuments();
    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${count} departments and supervisors.`,
      count,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
