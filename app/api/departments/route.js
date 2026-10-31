import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Department from '@/models/Department';
import { INITIAL_DEPARTMENTS } from '@/lib/seedData';

export async function GET() {
  try {
    await connectToDatabase();
    let departments = await Department.find({ active: { $ne: false } }).sort({ name: 1 });
    if (!departments || departments.length === 0) {
      await Department.insertMany(INITIAL_DEPARTMENTS);
      departments = await Department.find({ active: { $ne: false } }).sort({ name: 1 });
    }
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, code, category, supervisors } = body;
    if (!name || !name.trim()) return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return NextResponse.json({ success: false, error: 'Department already exists' }, { status: 400 });
    const newDept = await Department.create({ name: name.trim(), code: code ? code.trim() : undefined, category: category ? category.trim() : 'Operations', supervisors: Array.isArray(supervisors) ? supervisors : [], active: true });
    return NextResponse.json({ success: true, department: newDept });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
