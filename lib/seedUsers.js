import User from '@/models/User';

export const INITIAL_USERS = [
  {
    username: 'admin',
    name: 'System Admin',
    role: 'admin',
    defaultPassword: 'Admin@123',
  },
  {
    username: 'stores',
    name: 'Stores Department',
    role: 'stores',
    defaultPassword: 'Stores@123',
  },
  {
    username: 'niranjan',
    name: 'Mr. Niranjan',
    role: 'management_niranjan',
    defaultPassword: 'Niranjan@123',
  },
  {
    username: 'vinod',
    name: 'Mr. Vinod',
    role: 'management_vinod',
    defaultPassword: 'Vinod@123',
  },
  { username: 'vidura', name: 'Mr. Vidura', role: 'supervisor', department: 'Finance & Accounting', defaultPassword: 'Vidura@123' },
  { username: 'pavithra', name: 'Mrs. Pavithra', role: 'supervisor', department: 'Finance & Accounting', defaultPassword: 'Pavithra@123' },
  { username: 'rohitha', name: 'Mr. Rohitha', role: 'supervisor', department: 'HRD & Admin', defaultPassword: 'Rohitha@123' },
  { username: 'tharidu', name: 'Mr. Tharidu', role: 'supervisor', department: 'IT', defaultPassword: 'Tharidu@123' },
  { username: 'wickrama', name: 'Mr. Wickrama', role: 'supervisor', department: 'Quality Assurance', defaultPassword: 'Wickrama@123' },
  { username: 'dulan', name: 'Mr. Dulan', role: 'supervisor', department: 'Quality Assurance', defaultPassword: 'Dulan@123' },
  { username: 'ravimal', name: 'Mr. Ravimal', role: 'supervisor', department: 'Production', defaultPassword: 'Ravimal@123' },
  { username: 'dhammika', name: 'Mr. Dhammika', role: 'supervisor', department: 'Production', defaultPassword: 'Dhammika@123' },
  { username: 'avishka', name: 'Mr. Avishka', role: 'supervisor', department: 'Planning', defaultPassword: 'Avishka@123' },
  { username: 'hasula', name: 'Mr. Hasula', role: 'supervisor', department: 'Laboratory', defaultPassword: 'Hasula@123' },
  { username: 'dilanka', name: 'Mr. Dilanka', role: 'supervisor', department: 'Engineering', defaultPassword: 'Dilanka@123' },
  { username: 'shemba', name: 'Mr. Shemba', role: 'supervisor', department: 'Engineering', defaultPassword: 'Shemba@123' },
  { username: 'thiwanka', name: 'Mr. Thiwanka', role: 'supervisor', department: 'Engineering Stores', defaultPassword: 'Thiwanka@123' },
  { username: 'subash', name: 'Mr. Subash', role: 'supervisor', department: 'Engineering Stores', defaultPassword: 'Subash@123' },
  { username: 'dimuthu', name: 'Mr. Dimuthu', role: 'supervisor', department: 'Finished Goods Store', defaultPassword: 'Dimuthu@123' },
  { username: 'manjula', name: 'Mr. Manjula', role: 'supervisor', department: 'Procurement', defaultPassword: 'Manjula@123' },
  { username: 'gayashan', name: 'Mr. Gayashan', role: 'supervisor', department: 'Procurement', defaultPassword: 'Gayashan@123' },
  { username: 'basker', name: 'Mr. Basker', role: 'supervisor', department: 'Raw Material Store', defaultPassword: 'Basker@123' },
  { username: 'thushara', name: 'Mr. Thushara', role: 'supervisor', department: 'Shift A', defaultPassword: 'Thushara@123' },
  { username: 'rusiru', name: 'Mr. Rusiru', role: 'supervisor', department: 'Shift A', defaultPassword: 'Rusiru@123' },
  { username: 'rathnayake', name: 'Mr. Rathnayake', role: 'supervisor', department: 'Shift B', defaultPassword: 'Rathnayake@123' },
  { username: 'viraj', name: 'Mr. Viraj', role: 'supervisor', department: 'Shift C', defaultPassword: 'Viraj@123' },
  { username: 'manju', name: 'Mr. Manju', role: 'supervisor', department: 'EDC', defaultPassword: 'Manju@123' },
  { username: 'chathuranga', name: 'Mr. Chathuranga', role: 'supervisor', department: 'Mould', defaultPassword: 'Chathuranga@123' },
  { username: 'jinendra', name: 'Mr. Jinendra', role: 'supervisor', department: 'Logistic', defaultPassword: 'Jinendra@123' },
  { username: 'nilantha', name: 'Mr. Nilantha', role: 'supervisor', department: 'Logistic', defaultPassword: 'Nilantha@123' },
];

let usersSeeded = false;

export async function ensureUsersSeeded() {
  if (usersSeeded) return;
  try {
    const existingCount = await User.countDocuments();
    if (existingCount >= INITIAL_USERS.length) {
      usersSeeded = true;
      return;
    }

    // Bulk upsert missing users
    const ops = INITIAL_USERS.map((u) => ({
      updateOne: {
        filter: { username: u.username.toLowerCase() },
        update: {
          $setOnInsert: {
            username: u.username.toLowerCase(),
            name: u.name,
            role: u.role,
            department: u.department,
            password: u.defaultPassword,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await User.bulkWrite(ops);
    }
    usersSeeded = true;
  } catch (err) {
    console.error('ensureUsersSeeded error:', err);
  }
}

// Fast on-demand user resolver for instant login
export async function findOrCreateUser(username) {
  const cleanUsername = username.trim().toLowerCase();
  let user = await User.findOne({ username: cleanUsername });
  if (!user) {
    const seed = INITIAL_USERS.find((u) => u.username.toLowerCase() === cleanUsername);
    if (seed) {
      user = await User.create({
        username: seed.username.toLowerCase(),
        name: seed.name,
        role: seed.role,
        department: seed.department,
        password: seed.defaultPassword,
      });
    }
  }
  return user;
}
