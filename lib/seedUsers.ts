import User from '@/models/User';
import Department from '@/models/Department';

export interface InitialUser {
  username: string;
  name: string;
  role: 'admin' | 'management_niranjan' | 'management_vinod' | 'stores' | 'supervisor';
  department?: string;
  defaultPassword: string;
}

export const INITIAL_USERS: InitialUser[] = [
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
  // Supervisors
  {
    username: 'vidura',
    name: 'Mr. Vidura',
    role: 'supervisor',
    department: 'Finance & Accounting',
    defaultPassword: 'Vidura@123',
  },
  {
    username: 'pavithra',
    name: 'Mrs. Pavithra',
    role: 'supervisor',
    department: 'Finance & Accounting',
    defaultPassword: 'Pavithra@123',
  },
  {
    username: 'rohitha',
    name: 'Mr. Rohitha',
    role: 'supervisor',
    department: 'HRD & Admin',
    defaultPassword: 'Rohitha@123',
  },
  {
    username: 'tharindu',
    name: 'Mr. Tharindu',
    role: 'supervisor',
    department: 'IT',
    defaultPassword: 'Tharindu@123',
  },
  {
    username: 'wickrama',
    name: 'Mr. Wickrama',
    role: 'supervisor',
    department: 'Quality Assurance',
    defaultPassword: 'Wickrama@123',
  },
  {
    username: 'dulan',
    name: 'Mr. Dulan',
    role: 'supervisor',
    department: 'Quality Assurance',
    defaultPassword: 'Dulan@123',
  },
  {
    username: 'ravimal',
    name: 'Mr. Ravimal',
    role: 'supervisor',
    department: 'Production',
    defaultPassword: 'Ravimal@123',
  },
  {
    username: 'dhammika',
    name: 'Mr. Dhammika',
    role: 'supervisor',
    department: 'Production',
    defaultPassword: 'Dhammika@123',
  },
  {
    username: 'avishka',
    name: 'Mr. Avishka',
    role: 'supervisor',
    department: 'Planning',
    defaultPassword: 'Avishka@123',
  },
  {
    username: 'hasula',
    name: 'Mr. Hasula',
    role: 'supervisor',
    department: 'Laboratory',
    defaultPassword: 'Hasula@123',
  },
  {
    username: 'dilanka',
    name: 'Mr. Dilanka',
    role: 'supervisor',
    department: 'Engineering',
    defaultPassword: 'Dilanka@123',
  },
  {
    username: 'shemba',
    name: 'Mr. Shemba',
    role: 'supervisor',
    department: 'Engineering',
    defaultPassword: 'Shemba@123',
  },
  {
    username: 'thiwanka',
    name: 'Mr. Thiwanka',
    role: 'supervisor',
    department: 'Engineering Stores',
    defaultPassword: 'Thiwanka@123',
  },
  {
    username: 'subash',
    name: 'Mr. Subash',
    role: 'supervisor',
    department: 'Engineering Stores',
    defaultPassword: 'Subash@123',
  },
  {
    username: 'dimuthu',
    name: 'Mr. Dimuthu',
    role: 'supervisor',
    department: 'Finished Goods Store',
    defaultPassword: 'Dimuthu@123',
  },
  {
    username: 'manjula',
    name: 'Mr. Manjula',
    role: 'supervisor',
    department: 'Purchasing',
    defaultPassword: 'Manjula@123',
  },
  {
    username: 'gayashan',
    name: 'Mr. Gayashan',
    role: 'supervisor',
    department: 'Purchasing',
    defaultPassword: 'Gayashan@123',
  },
  {
    username: 'thushara',
    name: 'Mr. Thushara',
    role: 'supervisor',
    department: 'Shift A',
    defaultPassword: 'Thushara@123',
  },
  {
    username: 'rusiru',
    name: 'Mr. Rusiru',
    role: 'supervisor',
    department: 'Shift A',
    defaultPassword: 'Rusiru@123',
  },
  {
    username: 'rathnayake',
    name: 'Mr. Rathnayake',
    role: 'supervisor',
    department: 'Shift B',
    defaultPassword: 'Rathnayake@123',
  },
  {
    username: 'viraj',
    name: 'Mr. Viraj',
    role: 'supervisor',
    department: 'Shift C',
    defaultPassword: 'Viraj@123',
  },
];

export async function ensureUsersSeeded() {
  for (const u of INITIAL_USERS) {
    const existing = await User.findOne({ username: u.username.toLowerCase() });
    if (!existing) {
      await User.create({
        username: u.username.toLowerCase(),
        name: u.name,
        role: u.role,
        department: u.department,
        password: u.defaultPassword,
      });
    } else {
      // Fix name if it contains (Management) or needs update
      let changed = false;
      if (existing.name !== u.name) {
        existing.name = u.name;
        changed = true;
      }
      if (existing.role !== u.role) {
        existing.role = u.role;
        changed = true;
      }
      if (u.department && existing.department !== u.department) {
        existing.department = u.department;
        changed = true;
      }
      if (changed) {
        await existing.save();
      }
    }
  }
}
