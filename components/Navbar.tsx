'use client';

import React, { useState } from 'react';
import { CurrentUser, IDepartment, IMRN } from '@/types';
import {
  Building2,
  Search,
  PlusCircle,
  UserCheck,
  Warehouse,
  FileText,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Bell,
  CheckCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser;
  departments: IDepartment[];
  onOpenNewMRN: () => void;
  onSearchMRN: (mrnNo: string) => void;
  activeTab: 'mrns' | 'analytics' | 'admin';
  setActiveTab: (tab: 'mrns' | 'analytics' | 'admin') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExitToPortal: () => void;
  mrns: IMRN[];
  onSelectMRN: (mrn: IMRN) => void;
}

export default function Navbar({
  currentUser,
  departments,
  onOpenNewMRN,
  onSearchMRN,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onOpenLogin,
  onLogout,
  onExitToPortal,
  mrns,
  onSelectMRN,
}: NavbarProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchMRN(searchInput.trim());
    }
  };

  // Determine user display label (Notice: "Mr.Niranan Management kyl danna epa")
  const getUserDisplayLabel = () => {
    switch (currentUser.role) {
      case 'management_niranjan':
        return 'Mr. Niranjan';
      case 'management_vinod':
        return 'Mr. Vinod';
      case 'stores':
        return 'Stores Department';
      case 'supervisor':
        return `${currentUser.name} (${currentUser.department})`;
      case 'admin':
        return 'System Admin';
      default:
        return `${currentUser.department || 'Department'}`;
    }
  };

  // Calculate pending MRNs for notification based on logged-in user role
  const getPendingNotifications = () => {
    if (!mrns || mrns.length === 0) return [];

    if (currentUser.role === 'supervisor') {
      return mrns.filter(
        (m) =>
          m.department === currentUser.department &&
          !m.supervisorApproval?.approved &&
          m.status === 'PENDING_SUPERVISOR'
      );
    }

    if (currentUser.role === 'management_niranjan') {
      return mrns.filter(
        (m) =>
          m.supervisorApproval?.approved &&
          !m.niranjanApproval?.approved &&
          m.status !== 'ISSUED' &&
          m.status !== 'REJECTED'
      );
    }

    if (currentUser.role === 'management_vinod') {
      return mrns.filter(
        (m) =>
          m.supervisorApproval?.approved &&
          !m.vinodApproval?.approved &&
          m.status !== 'ISSUED' &&
          m.status !== 'REJECTED'
      );
    }

    if (currentUser.role === 'stores') {
      return mrns.filter(
        (m) =>
          m.supervisorApproval?.approved &&
          !m.storesIssue?.issued &&
          m.status !== 'REJECTED'
      );
    }

    return [];
  };

  const pendingNotifications = getPendingNotifications();
  const notifCount = pendingNotifications.length;

  // Crucial requirement:
  // "Anika bn Mr.Niranjanta,Mr.Vinodta,Adminta,Supervisorslata New Mrn Create kyl penanna ona na bn."
  // Only Department role can create New MRN!
  const canCreateNewMRN = currentUser.role === 'department';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
            onClick={onExitToPortal}
            title="Return to Portal"
          >
            <div className="bg-white px-2 py-1 rounded-xl shadow-md border border-slate-700 flex items-center justify-center">
              <img src="/logo.png" alt="TVS SUN-TWS" className="h-7 sm:h-8 w-auto object-contain" />
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
                className="w-full bg-slate-800/80 text-xs text-slate-100 placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition-all"
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

          {/* Right Action Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Create MRN Button: Strictly for Department Requesters only */}
            {canCreateNewMRN && (
              <button
                onClick={onOpenNewMRN}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-600/30 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New MRN</span>
              </button>
            )}

            {/* Notification Bell (for Supervisors, Niranjan, Vinod, Stores) */}
            {currentUser.role !== 'department' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition relative"
                  title="Pending Approval Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md shadow-red-500/50">
                      {notifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-sky-500" />
                        Pending Approvals ({notifCount})
                      </span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        ✕
                      </button>
                    </div>

                    {notifCount === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <CheckCircle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                        No pending requests waiting for your action.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {pendingNotifications.map((m) => (
                          <div
                            key={m._id}
                            onClick={() => {
                              onSelectMRN(m);
                              setShowNotifications(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800 cursor-pointer transition text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sky-600 dark:text-sky-400 text-xs font-mono">
                                {m.mrnNo}
                              </span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                Needs Action
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                              {m.department} - {m.requestedBy}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {m.items?.length || 0} material item(s)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
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

            {/* Logged in User Name & Logout Button */}
            {currentUser.isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 p-1 pl-3 rounded-xl">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[130px] sm:max-w-[180px]">
                  {getUserDisplayLabel()}
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Department badge / Exit to portal button */}
                <button
                  onClick={onExitToPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition"
                  title="Switch / Return to Department Selection Portal"
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate max-w-[110px] sm:max-w-[150px] font-bold text-white">{currentUser.department}</span>
                  <span className="text-[10px] bg-slate-900/90 text-slate-400 px-1.5 py-0.5 rounded font-mono">Switch</span>
                </button>

                {/* Sign In Button */}
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>
            )}
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

          {/* Admin panel only visible when logged in as admin */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
