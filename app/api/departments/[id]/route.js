import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Department from '@/models/Department';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { name, code, category, supervisors, active } = body;
    const dept = await Department.findById(id);
    if (!dept) return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    if (name !== undefined) dept.name = name.trim();
    if (code !== undefined) dept.code = code.trim();
    if (category !== undefined) dept.category = category.trim();
    if (supervisors !== undefined) dept.supervisors = supervisors;
    if (active !== undefined) dept.active = active;
    await dept.save();
    return NextResponse.json({ success: true, department: dept });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const dept = await Department.findById(id);
    if (!dept) return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    await Department.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Department removed successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
