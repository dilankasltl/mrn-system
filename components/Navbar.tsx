'use client';

import React, { useState } from 'react';
import { CurrentUser, IDepartment } from '@/types';
import { Building2, Search, PlusCircle, UserCheck, ShieldCheck, Warehouse, FileText, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser;
  onUserChange: (user: CurrentUser) => void;
  departments: IDepartment[];
  onOpenNewMRN: () => void;
  onSearchMRN: (mrnNo: string) => void;
  activeTab: 'mrns' | 'analytics' | 'admin';
  setActiveTab: (tab: 'mrns' | 'analytics' | 'admin') => void;
}

export default function Navbar({
  currentUser,
  onUserChange,
  departments,
  onOpenNewMRN,
  onSearchMRN,
  activeTab,
  setActiveTab,
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
        return { label: `${currentUser.department} (Requester)`, bg: 'bg-slate-700 text-white', icon: Building2 };
    }
  };

  const badge = getRoleBadge();
  const IconComponent = badge.icon;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('mrns')}>
              <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-xl tracking-wider text-white shadow-inner">
                SL
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  Sundaram Lanka Tyres LTD.
                </h1>
                <p className="text-xs text-sky-400 font-medium tracking-wide">
                  Material Request Note (MRN) System
                </p>
              </div>
            </div>

            {/* Quick Search Bar for Any MRN */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Track any MRN No (e.g. MRN-202610...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="ml-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                Track
              </button>
            </form>

            {/* Actions & Role Switcher */}
            <div className="flex items-center gap-3">
              {/* Create MRN Button */}
              <button
                onClick={onOpenNewMRN}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-sm transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New MRN</span>
              </button>

              {/* Current Role Pill */}
              <button
                onClick={() => setShowRoleModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition hover:opacity-90 ${badge.bg}`}
                title="Click to Switch Login / Role"
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">{badge.label}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-slate-800 pt-1 pb-2 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab('mrns')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
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

      {/* Role / Login Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Switch Department / Login Role</h3>
                <p className="text-xs text-slate-500">
                  Select your role or department to test authorization rules and permissions.
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Special Roles */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5">
                Executive & Special Approvers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mr. Niranjan */}
                <button
                  onClick={() => {
                    onUserChange({
                      id: 'niranjan',
                      name: 'Mr. Niranjan',
                      role: 'management_niranjan',
                    });
                    setShowRoleModal(false);
                  }}
                  className="flex items-center p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-left transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold mr-3 text-sm">
                    MN
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-900">Mr. Niranjan</div>
                    <div className="text-xs text-blue-700">Plant / Management Approver</div>
                  </div>
                </button>

                {/* Mr. Vinod */}
                <button
                  onClick={() => {
                    onUserChange({
                      id: 'vinod',
                      name: 'Mr. Vinod',
                      role: 'management_vinod',
                    });
                    setShowRoleModal(false);
                  }}
                  className="flex items-center p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-left transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold mr-3 text-sm">
                    MV
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-900">Mr. Vinod</div>
                    <div className="text-xs text-purple-700">Final Approval Authority</div>
                  </div>
                </button>

                {/* Stores */}
                <button
                  onClick={() => {
                    onUserChange({
                      id: 'stores',
                      name: 'Stores Officer',
                      role: 'stores',
                      department: 'Stores',
                    });
                    setShowRoleModal(false);
                  }}
                  className="flex items-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold mr-3 text-sm">
                    ST
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-900">Stores Department</div>
                    <div className="text-xs text-emerald-700">Material Issue Authority</div>
                  </div>
                </button>

                {/* Admin */}
                <button
                  onClick={() => {
                    onUserChange({
                      id: 'admin',
                      name: 'System Admin',
                      role: 'admin',
                    });
                    setShowRoleModal(false);
                  }}
                  className="flex items-center p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100 text-left transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold mr-3 text-sm">
                    AD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-900">Admin Login</div>
                    <div className="text-xs text-red-700">Full System Control & Settings</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Department Supervisors */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5">
                Department Supervisors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {departments
                  .flatMap((d) =>
                    (d.supervisors || []).map((s) => ({
                      supervisorName: s.name,
                      deptName: d.name,
                    }))
                  )
                  .map((sup, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onUserChange({
                          id: `sup-${idx}`,
                          name: sup.supervisorName,
                          role: 'supervisor',
                          department: sup.deptName,
                          isSupervisor: true,
                        });
                        setShowRoleModal(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{sup.supervisorName}</span>
                        <span className="text-slate-400 ml-1.5">({sup.deptName})</span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                        Supervisor
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Department Requesters */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5">
                Department Request User
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {departments.map((dept) => (
                  <button
                    key={dept.name}
                    onClick={() => {
                      onUserChange({
                        id: `dept-${dept.name}`,
                        name: `${dept.name} Officer`,
                        role: 'department',
                        department: dept.name,
                      });
                      setShowRoleModal(false);
                    }}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition text-xs"
                  >
                    <div className="font-medium text-slate-800 truncate">{dept.name}</div>
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
