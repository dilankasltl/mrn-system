'use client';

import React, { useState } from 'react';
import { IDepartment, CurrentUser } from '@/types';
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
  ShieldAlert,
} from 'lucide-react';

interface LandingPortalProps {
  departments: IDepartment[];
  onSelectDepartment: (deptName: string) => void;
  onLoginSuccess: (user: CurrentUser) => void;
  onSearchMRN: (mrnNo: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function LandingPortal({
  departments,
  onSelectDepartment,
  onLoginSuccess,
  onSearchMRN,
  theme,
  onToggleTheme,
}: LandingPortalProps) {
  const [activePortalTab, setActivePortalTab] = useState<'departments' | 'login' | 'change_password'>('departments');
  const [deptSearch, setDeptSearch] = useState('');
  const [trackInput, setTrackInput] = useState('');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Change password state
  const [changeUsername, setChangeUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Filter departments by search
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onSearchMRN(trackInput.trim());
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

      const loggedUser: CurrentUser = {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
        department: data.user.department,
        isAuthenticated: true,
      };

      localStorage.setItem('sundaram_mrn_user', JSON.stringify(loggedUser));
      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!changeUsername.trim() || !currentPassword.trim() || !newPassword.trim()) {
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
          username: changeUsername.trim(),
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
        setActivePortalTab('login');
      }, 1500);
    } catch (err: any) {
      setChangeError(err.message || 'Error updating password');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-sky-500/20">
            SL
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
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 z-10 flex-1 flex flex-col justify-center">
        {/* Title & Introduction */}
        <div className="text-center mb-8">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mb-3">
            Plant Requisition & Authorization Gateway
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Welcome to Sundaram MRN System
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Departments can raise material notes without a password. Authorized approvers and Stores officers can sign in with secure credentials.
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
            Official Sign In
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('change_password')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activePortalTab === 'change_password'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Change Key
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

        {/* TAB 2: OFFICIAL SIGN IN */}
        {activePortalTab === 'login' && (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl max-w-lg mx-auto w-full animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Authorized Sign In
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your designated username and password.
              </p>
            </div>

            {/* Quick account shortcut pills (Note: Admin is completely hidden!) */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('niranjan');
                    setPassword('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-center transition ${
                    username === 'niranjan'
                      ? 'border-blue-500 bg-blue-950/60 text-blue-300 font-bold'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                  <span className="block truncate">Mr. Niranjan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsername('vinod');
                    setPassword('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-center transition ${
                    username === 'vinod'
                      ? 'border-purple-500 bg-purple-950/60 text-purple-300 font-bold'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                  <span className="block truncate">Mr. Vinod</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsername('stores');
                    setPassword('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-center transition ${
                    username === 'stores'
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Warehouse className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                  <span className="block truncate">Stores</span>
                </button>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. niranjan, vinod, stores, dilanka, etc."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Format: ABC@123
                  </span>
                </div>
                <div className="relative">
                  <input
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
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activePortalTab === 'change_password' && (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl max-w-lg mx-auto w-full animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-400" />
                Change Password Anytime
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Update your security password safely in the system database.
              </p>
            </div>

            {changeError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. niranjan, vinod, stores, dilanka"
                  value={changeUsername}
                  onChange={(e) => setChangeUsername(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {changeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
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
