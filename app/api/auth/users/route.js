import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { ensureUsersSeeded } from '@/lib/seedUsers';

export async function GET() {
  try {
    await connectToDatabase();
    await ensureUsersSeeded();
    const rawUsers = await User.find({}).select('username name role department').sort({ role: 1, name: 1 }).lean();
    const users = rawUsers.filter((u) => u.username !== 'admin');
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
