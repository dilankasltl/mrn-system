'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Lock,
  UserCheck,
  Warehouse,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sun,
  Moon,
  ArrowRight,
  Users,
  ChevronDown,
  X,
} from 'lucide-react';

export const SUPERVISORS_DATA = [
  { username: 'dilanka', name: 'Mr. Dilanka', department: 'Engineering', defaultPass: 'Dilanka@123' },
  { username: 'shemba', name: 'Mr. Shemba', department: 'Engineering', defaultPass: 'Shemba@123' },
  { username: 'vidura', name: 'Mr. Vidura', department: 'Finance & Accounting', defaultPass: 'Vidura@123' },
  { username: 'pavithra', name: 'Mrs. Pavithra', department: 'Finance & Accounting', defaultPass: 'Pavithra@123' },
  { username: 'rohitha', name: 'Mr. Rohitha', department: 'HRD & Admin', defaultPass: 'Rohitha@123' },
  { username: 'tharindu', name: 'Mr. Tharindu', department: 'IT', defaultPass: 'Tharindu@123' },
  { username: 'wickrama', name: 'Mr. Wickrama', department: 'Quality Assurance', defaultPass: 'Wickrama@123' },
  { username: 'dulan', name: 'Mr. Dulan', department: 'Quality Assurance', defaultPass: 'Dulan@123' },
  { username: 'ravimal', name: 'Mr. Ravimal', department: 'Production', defaultPass: 'Ravimal@123' },
  { username: 'dhammika', name: 'Mr. Dhammika', department: 'Production', defaultPass: 'Dhammika@123' },
  { username: 'avishka', name: 'Mr. Avishka', department: 'Planning', defaultPass: 'Avishka@123' },
  { username: 'hasula', name: 'Mr. Hasula', department: 'Laboratory', defaultPass: 'Hasula@123' },
  { username: 'thiwanka', name: 'Mr. Thiwanka', department: 'Engineering Stores', defaultPass: 'Thiwanka@123' },
  { username: 'subash', name: 'Mr. Subash', department: 'Engineering Stores', defaultPass: 'Subash@123' },
  { username: 'dimuthu', name: 'Mr. Dimuthu', department: 'Finished Goods Store', defaultPass: 'Dimuthu@123' },
  { username: 'manjula', name: 'Mr. Manjula', department: 'Purchasing', defaultPass: 'Manjula@123' },
  { username: 'gayashan', name: 'Mr. Gayashan', department: 'Purchasing', defaultPass: 'Gayashan@123' },
  { username: 'thushara', name: 'Mr. Thushara', department: 'Shift A', defaultPass: 'Thushara@123' },
  { username: 'rusiru', name: 'Mr. Rusiru', department: 'Shift A', defaultPass: 'Rusiru@123' },
  { username: 'rathnayake', name: 'Mr. Rathnayake', department: 'Shift B', defaultPass: 'Rathnayake@123' },
  { username: 'viraj', name: 'Mr. Viraj', department: 'Shift C', defaultPass: 'Viraj@123' },
];

export default function LandingPortal({
  departments,
  onSelectDepartment,
  onLoginSuccess,
  onSearchMRN,
  theme,
  onToggleTheme,
}) {
  // Portal navigation tab: Only Department Access OR Office Sign In
  const [activePortalTab, setActivePortalTab] = useState('departments');
  const [deptSearch, setDeptSearch] = useState('');
  const [trackInput, setTrackInput] = useState('');

  // Selected Office Sign In category
  const [selectedRoleCategory, setSelectedRoleCategory] = useState(null);
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Inline Change Password state (subtle under login form)
  const [showInlineChangePassword, setShowInlineChangePassword] = useState(false);
  const [changeUsername, setChangeUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const passwordInputRef = useRef(null);

  // Filter departments by search
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  // Build supervisor list from departments data (each dept has its own supervisors)
  const allSupervisorsFromDepts = departments.flatMap((dept) =>
    (dept.supervisors || []).map((sup) => {
      // Match with SUPERVISORS_DATA for username/credentials
      const match = SUPERVISORS_DATA.find(
        (sd) => sd.name === sup.name && sd.department === dept.name
      ) || SUPERVISORS_DATA.find((sd) => sd.name === sup.name);
      return {
        name: sup.name,
        department: dept.name,
        username: match?.username || sup.name.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, '').toLowerCase(),
        defaultPass: match?.defaultPass || `${sup.name.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, '').split(' ')[0]}@123`,
      };
    })
  );

  // Deduplicate (same supervisor may appear in multiple depts, keep per-dept entries)
  const uniqueSupervisors = allSupervisorsFromDepts.filter(
    (s, i, arr) => arr.findIndex((x) => x.username === s.username && x.department === s.department) === i
  );

  // Filter supervisors by search
  const filteredSupervisors = uniqueSupervisors.filter((s) =>
    s.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    s.department.toLowerCase().includes(supervisorSearch.toLowerCase())
  );

  // Group filtered supervisors by department
  const groupedSupervisors = filteredSupervisors.reduce((acc, s) => {
    if (!acc[s.department]) acc[s.department] = [];
    acc[s.department].push(s);
    return acc;
  }, {});

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onSearchMRN(trackInput.trim());
    }
  };

  // Handle clicking on one of the 4 Office Sign In categories
  const handleSelectRoleCategory = (category) => {
    setSelectedRoleCategory(category);
    setLoginError('');

    if (category === 'supervisors') {
      if (selectedSupervisor) {
        setUsername(selectedSupervisor.username);
        setChangeUsername(selectedSupervisor.username);
      } else {
        setUsername('');
      }
    } else if (category === 'niranjan') {
      setSelectedSupervisor(null);
      setUsername('niranjan');
      setChangeUsername('niranjan');
      setPassword('');
      passwordInputRef.current?.focus();
    } else if (category === 'vinod') {
      setSelectedSupervisor(null);
      setUsername('vinod');
      setChangeUsername('vinod');
      setPassword('');
      passwordInputRef.current?.focus();
    } else if (category === 'stores') {
      setSelectedSupervisor(null);
      setUsername('stores');
      setChangeUsername('stores');
      setPassword('');
      passwordInputRef.current?.focus();
    }
  };

  // Handle picking a supervisor from the list
  const handleSelectSupervisor = (sup) => {
    setSelectedSupervisor(sup);
    setUsername(sup.username);
    setChangeUsername(sup.username);
    setPassword('');
    setLoginError('');
    passwordInputRef.current?.focus();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const loggedUser = {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
        department: data.user.department,
        isAuthenticated: true,
      };

      localStorage.setItem('sundaram_mrn_user', JSON.stringify(loggedUser));
      onLoginSuccess(loggedUser);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    const targetUser = changeUsername.trim() || username.trim();
    if (!targetUser || !currentPassword.trim() || !newPassword.trim()) {
      setChangeError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 4) {
      setChangeError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    setChangeLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUser,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      setChangeSuccess('Password updated successfully! You can now log in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowInlineChangePassword(false);
        setChangeSuccess('');
      }, 2000);
    } catch (err) {
      setChangeError(err.message || 'Error updating password');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-2xl shadow-md border border-slate-700 flex items-center justify-center">
            <img src="/logo.png" alt="TVS SUN-TWS" className="h-8 sm:h-9 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              Sundaram Lanka Tyres LTD.
            </h1>
            <p className="text-xs text-sky-400 font-medium tracking-wide">
              Material Request Note (MRN) Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Track Input */}
          <form onSubmit={handleTrackSubmit} className="hidden sm:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Track any MRN #..."
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                className="w-48 lg:w-64 text-xs bg-slate-800/80 text-slate-200 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="ml-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 text-slate-200 transition"
            >
              Track
            </button>
          </form>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-300" />
            )}
          </button>
        </div>
      </header>

      {/* Main Entrance Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 z-10 flex-1 flex flex-col justify-center">
        {/* Title & Introduction with Logo */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white p-3 rounded-2xl shadow-xl mb-3 border border-slate-700">
            <img src="/logo.png" alt="TVS SUN-TWS" className="h-12 sm:h-14 w-auto object-contain" />
          </div>
          <div>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mb-2">
              Plant Requisition & Authorization Gateway
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sundaram Lanka Tyres LTD. - MRN System
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1.5">
            Departments can raise material notes without a password. Authorized Supervisors, Mr. Niranjan, Mr. Vinod, and Stores sign in below.
          </p>
        </div>

        {/* Portal Mode Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl max-w-md mx-auto w-full mb-6 border border-slate-700 shadow-xl">
          <button
            type="button"
            onClick={() => setActivePortalTab('departments')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activePortalTab === 'departments'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Department Requisitions
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('login')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activePortalTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Office Sign In
          </button>
        </div>

        {/* TAB 1: DEPARTMENT ACCESS (No Login Required) */}
        {activePortalTab === 'departments' && (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  Select Your Department
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose your department below to create new MRNs or track your department requests.
                </p>
              </div>

              {/* Department Search Filter */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search department..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full text-xs bg-slate-900/90 text-slate-200 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredDepartments.map((dept) => (
                <button
                  key={dept.name}
                  onClick={() => onSelectDepartment(dept.name)}
                  className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-sky-500 rounded-2xl text-left transition group flex flex-col justify-between active:scale-[0.98]"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition line-clamp-1">
                      {dept.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{dept.category || 'Operations'}</div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-sky-400 font-semibold opacity-0 group-hover:opacity-100 transition">
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OFFICE SIGN IN */}
        {activePortalTab === 'login' && (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl max-w-xl mx-auto w-full animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Office Sign In
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your role below: Supervisors, Mr. Niranjan, Mr. Vinod, or Stores.
              </p>
            </div>

            {/* 4 Official Roles */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Select Sign In Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectRoleCategory('supervisors')}
                  className={`p-3 rounded-2xl border text-xs text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    selectedRoleCategory === 'supervisors'
                      ? 'border-amber-500 bg-amber-950/60 text-amber-300 font-bold shadow-md shadow-amber-500/20'
                      : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Users className="w-5 h-5 text-amber-400" />
                  <span className="block truncate font-semibold">Supervisors</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRoleCategory('niranjan')}
                  className={`p-3 rounded-2xl border text-xs text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    selectedRoleCategory === 'niranjan'
                      ? 'border-blue-500 bg-blue-950/60 text-blue-300 font-bold shadow-md shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  <span className="block truncate font-semibold">Mr. Niranjan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRoleCategory('vinod')}
                  className={`p-3 rounded-2xl border text-xs text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    selectedRoleCategory === 'vinod'
                      ? 'border-purple-500 bg-purple-950/60 text-purple-300 font-bold shadow-md shadow-purple-500/20'
                      : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span className="block truncate font-semibold">Mr. Vinod</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRoleCategory('stores')}
                  className={`p-3 rounded-2xl border text-xs text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    selectedRoleCategory === 'stores'
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold shadow-md shadow-emerald-500/20'
                      : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Warehouse className="w-5 h-5 text-emerald-400" />
                  <span className="block truncate font-semibold">Stores</span>
                </button>
              </div>
            </div>

            {/* SUPERVISORS LIST VIEW */}
            {selectedRoleCategory === 'supervisors' && (
              <div className="mb-5 p-3.5 bg-slate-900/90 rounded-2xl border border-amber-500/40 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Select Your Supervisor Account
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {filteredSupervisors.length} supervisors
                  </span>
                </div>

                <div className="relative mb-2.5">
                  <input
                    type="text"
                    placeholder="Filter by supervisor name or department..."
                    value={supervisorSearch}
                    onChange={(e) => setSupervisorSearch(e.target.value)}
                    className="w-full text-xs bg-slate-800/90 text-slate-200 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <div className="max-h-56 overflow-y-auto pr-1 space-y-3">
                  {Object.entries(groupedSupervisors).map(([deptName, sups]) => (
                    <div key={deptName}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {deptName}
                        <span className="text-slate-500">({sups.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {sups.map((s) => {
                          const isSelected = selectedSupervisor?.username === s.username && selectedSupervisor?.department === s.department;
                          return (
                            <button
                              key={`${s.username}-${s.department}`}
                              type="button"
                              onClick={() => handleSelectSupervisor(s)}
                              className={`p-2 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-950/60 text-amber-200 font-bold'
                                  : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              <div className="truncate pr-1">
                                <div className="font-semibold">{s.name}</div>
                              </div>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedSupervisors).length === 0 && (
                    <div className="text-center text-xs text-slate-500 py-3">No supervisors found.</div>
                  )}
                </div>

                {selectedSupervisor && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-center justify-between">
                    <span>
                      Selected: <strong>{selectedSupervisor.name}</strong> ({selectedSupervisor.department})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Default: {selectedSupervisor.defaultPass}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Hint Badge for Niranjan, Vinod, Stores */}
            {selectedRoleCategory === 'niranjan' && (
              <div className="mb-4 p-2.5 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                <span>Signing in as <strong>Mr. Niranjan</strong></span>
                <span className="text-[10px] text-slate-400">Default: Niranjan@123</span>
              </div>
            )}
            {selectedRoleCategory === 'vinod' && (
              <div className="mb-4 p-2.5 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-300 flex items-center justify-between">
                <span>Signing in as <strong>Mr. Vinod</strong></span>
                <span className="text-[10px] text-slate-400">Default: Vinod@123</span>
              </div>
            )}
            {selectedRoleCategory === 'stores' && (
              <div className="mb-4 p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Signing in as <strong>Stores Department</strong></span>
                <span className="text-[10px] text-slate-400">Default: Stores@123</span>
              </div>
            )}

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Main Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dilanka, niranjan, vinod, stores"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setChangeUsername(e.target.value);
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Default format: Name@123
                  </span>
                </div>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (e.g. ABC@123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* SUBTLE INLINE CHANGE PASSWORD BUTTON */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowInlineChangePassword(!showInlineChangePassword);
                  setChangeError('');
                  setChangeSuccess('');
                  if (username) setChangeUsername(username);
                }}
                className="text-xs text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1.5 transition font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{showInlineChangePassword ? 'Close Change Password' : 'Change Password?'}</span>
              </button>
            </div>

            {/* COLLAPSIBLE INLINE CHANGE PASSWORD PANEL */}
            {showInlineChangePassword && (
              <div className="mt-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                    Change Security Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlineChangePassword(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {changeError && (
                  <div className="mb-3 p-2 bg-red-950/40 border border-red-800 text-red-300 text-[11px] rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{changeError}</span>
                  </div>
                )}

                {changeSuccess && (
                  <div className="mb-3 p-2 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-[11px] rounded-xl flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>{changeSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePasswordSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Username to update"
                      value={changeUsername}
                      onChange={(e) => setChangeUsername(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min 4 chars"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                        Confirm New
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Repeat new"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changeLoading}
                    className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
                  >
                    {changeLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Save New Password'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-800 text-center text-xs text-slate-500 z-10">
        © Sundaram Lanka Tyres LTD. All rights reserved. Real-time Material Requisition Workflow.
      </footer>
    </div>
  );
}
