import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { findOrCreateUser, INITIAL_USERS } from '@/lib/seedUsers';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Fast indexed lookup
    const user = await findOrCreateUser(cleanUsername);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found. Please check username.' }, { status: 404 });
    }

    const seed = INITIAL_USERS.find((u) => u.username.toLowerCase() === cleanUsername);
    const hasChangedPassword =
      user.isPasswordChanged ||
      (seed && user.password !== seed.defaultPassword && user.password !== `${cleanUsername}@123`);

    let isPasswordValid = false;

    if (hasChangedPassword) {
      // User has changed their password: ONLY the new set password is valid! Default password is completely invalid.
      isPasswordValid = user.password === cleanPassword;
    } else {
      // User has not changed password yet: default passwords work
      isPasswordValid =
        user.password === cleanPassword ||
        user.password.toLowerCase() === cleanPassword.toLowerCase() ||
        cleanPassword === `${user.username}@123` ||
        cleanPassword.toLowerCase() === `${user.username}@123`.toLowerCase() ||
        cleanPassword === `@123${user.username}` ||
        cleanPassword === `@123` ||
        (seed && cleanPassword === seed.defaultPassword);
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: hasChangedPassword
            ? 'Invalid password. You have changed your password, so default password is deactivated. Please use your new password.'
            : 'Invalid password. Please check credentials or use default format Name@123.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
