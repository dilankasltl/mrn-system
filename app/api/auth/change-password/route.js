import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { INITIAL_USERS } from '@/lib/seedUsers';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { username, currentPassword, newPassword, isAdminReset } = body;

    if (!username || !newPassword) {
      return NextResponse.json({ success: false, error: 'Username and new password are required' }, { status: 400 });
    }
    if (newPassword.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'New password must be at least 4 characters long' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const seed = INITIAL_USERS.find((u) => u.username.toLowerCase() === cleanUsername);
    const hasAlreadyChanged =
      user.isPasswordChanged ||
      (seed && user.password !== seed.defaultPassword && user.password !== `${cleanUsername}@123`);

    if (!isAdminReset) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password is required to change password' }, { status: 400 });
      }
      const cleanCurrPass = currentPassword.trim();

      let isCurrValid = false;
      if (hasAlreadyChanged) {
        // If password was already changed, only their current set password is accepted
        isCurrValid = user.password === cleanCurrPass;
      } else {
        // If still default password
        isCurrValid =
          user.password === cleanCurrPass ||
          cleanCurrPass === `${user.username}@123` ||
          cleanCurrPass.toLowerCase() === `${user.username}@123`.toLowerCase() ||
          cleanCurrPass === `@123${user.username}` ||
          cleanCurrPass === `@123` ||
          (seed && cleanCurrPass === seed.defaultPassword);
      }

      if (!isCurrValid) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
      }
    }

    // Set new password and mark password as changed
    user.password = newPassword.trim();
    user.isPasswordChanged = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name} has been updated successfully. Default password is now completely disabled.`,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
