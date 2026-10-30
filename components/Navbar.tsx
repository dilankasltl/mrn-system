'use client';

import React, { useState } from 'react';
import { CurrentUser, IDepartment } from '@/types';
import {
  Building2,
  Search,
  PlusCircle,
  UserCheck,
  ShieldCheck,
  Warehouse,
  FileText,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser;
  onUserChange: (user: CurrentUser) => void;
  departments: IDepartment[];
  onOpenNewMRN: () => void;
  onSearchMRN: (mrnNo: string) => void;
  activeTab: 'mrns' | 'analytics' | 'admin';
  setActiveTab: (tab: 'mrns' | 'analytics' | 'admin') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({
  currentUser,
  onUserChange,
  departments,
  onOpenNewMRN,
  onSearchMRN,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onOpenLogin,
}: NavbarProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchMRN(searchInput.trim());
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return { label: 'System Admin', bg: 'bg-red-600 text-white', icon: ShieldCheck };
      case 'management_vinod':
        return { label: 'Mr. Vinod (Final Approval)', bg: 'bg-purple-700 text-white', icon: UserCheck };
      case 'management_niranjan':
        return { label: 'Mr. Niranjan (Management)', bg: 'bg-blue-700 text-white', icon: UserCheck };
      case 'stores':
        return { label: 'Stores Department', bg: 'bg-emerald-700 text-white', icon: Warehouse };
      case 'supervisor':
        return { label: `Supervisor (${currentUser.name})`, bg: 'bg-amber-600 text-white', icon: UserCheck };
      default:
        return { label: `${currentUser.department || 'Department'} (Requester)`, bg: 'bg-slate-700 text-white', icon: Building2 };
    }
  };

  const badge = getRoleBadge();
  const IconComponent = badge.icon;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
            {/* Brand Logo & Name */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => setActiveTab('mrns')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center font-black text-lg sm:text-xl tracking-wider text-white shadow-md shadow-sky-600/30">
                SL
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                  Sundaram Lanka Tyres LTD.
                </h1>
                <p className="text-[10px] sm:text-xs text-sky-400 font-semibold tracking-wide">
                  Material Request Note (MRN) System
                </p>
              </div>
            </div>

            {/* Quick Search Bar for Any MRN */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-sm mx-2">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Track any MRN No (e.g. MRN-202610...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-800/80 text-xs text-slate-100 placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="ml-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Track
              </button>
            </form>

            {/* Actions: New MRN, Login, Light/Dark Mode Toggle, Role Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Create MRN Button */}
              <button
                onClick={onOpenNewMRN}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-600/30 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New MRN</span>
              </button>

              {/* Login Button (Right next to New MRN as requested: "New MRN ek eha paththen Login kyl dapan") */}
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/30 transition"
                title="Login / Change Password"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              {/* Light / Dark Mode Toggle Button */}
              <button
                onClick={onToggleTheme}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-300" />
                )}
              </button>

              {/* Current Role / User Pill */}
              <button
                onClick={() => setShowRoleModal(true)}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition hover:opacity-90 ${badge.bg}`}
                title="Quick Department Switcher"
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[120px] lg:max-w-[180px]">{badge.label}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-slate-800 pt-1 pb-2 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab('mrns')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'mrns'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              MRN Requests
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              Stores & Management Analytics / Reports
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel (Departments & Supervisors)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Department Quick Switcher Modal (No password required for departments) */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Department Selection (No Login Required)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your department to raise Material Request Notes. Password login is required for Approvers, Stores, and Admin.
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Password Login Prompt for Special Roles */}
            <div className="mb-5 p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <div>
                  <div className="text-xs font-bold text-sky-900 dark:text-sky-200">
                    Need to Approve, Issue or Manage?
                  </div>
                  <div className="text-[11px] text-sky-700 dark:text-sky-300">
                    Mr. Niranjan, Mr. Vinod, Stores & Supervisors sign in with password.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  onOpenLogin();
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Open Login
              </button>
            </div>

            {/* Department Requesters Grid */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2.5">
                Departments ({departments.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {departments.map((dept) => (
                  <button
                    key={dept.name}
                    onClick={() => {
                      onUserChange({
                        id: `dept-${dept.name}`,
                        name: `${dept.name} Officer`,
                        role: 'department',
                        department: dept.name,
                        isAuthenticated: false,
                      });
                      setShowRoleModal(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      currentUser.department === dept.name
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="truncate">{dept.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">Requester</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
