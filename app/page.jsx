'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import LandingPortal from '@/components/LandingPortal';
import NewMRNModal from '@/components/NewMRNModal';
import MRNDetailsModal from '@/components/MRNDetailsModal';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AdminPanel from '@/components/AdminPanel';
import LoginModal from '@/components/LoginModal';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  PackageCheck,
  Lock,
  ChevronRight,
  RefreshCw,
  Building2,
  AlertCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Bell,
} from 'lucide-react';

export default function HomePage() {
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('portal');

  const [currentUser, setCurrentUser] = useState({
    id: 'guest',
    name: 'Department Requester',
    role: 'department',
    department: 'Engineering',
    isAuthenticated: false,
  });

  const [departments, setDepartments] = useState([]);
  const [mrns, setMrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [activeTab, setActiveTab] = useState('mrns');

  const [isNewMRNModalOpen, setIsNewMRNModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMRN, setSelectedMRN] = useState(null);

  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manage Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('sundaram_theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('sundaram_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Restore saved session
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('sundaram_mrn_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.name && parsed.isAuthenticated) {
          setCurrentUser(parsed);
          setViewMode('dashboard');
        }
      }
    } catch (e) {
      console.error('Session load error', e);
    }
  }, []);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success && data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  }, []);

  // Fetch MRNs
  const fetchMRNs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      const isGlobalManager = ['admin', 'stores', 'management_niranjan', 'management_vinod'].includes(currentUser.role);
      const activeDept = isGlobalManager ? selectedDeptFilter : (currentUser.department || 'Production');

      if (activeDept && activeDept !== 'ALL') {
        params.append('department', activeDept);
      }

      if (selectedStatusFilter !== 'ALL') {
        params.append('status', selectedStatusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      params.append('role', currentUser.role);
      if (currentUser.department) {
        params.append('userDept', currentUser.department);
      }

      const res = await fetch(`/api/mrn?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.mrns) {
        setMrns(data.mrns);
      }
    } catch (err) {
      console.error('Failed to load MRNs', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptFilter, selectedStatusFilter, searchQuery, currentUser.role, currentUser.department]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  // Initialize Data
  useEffect(() => {
    const initApp = async () => {
      try {
        await fetch('/api/init');
      } catch (e) {
        console.error('Init error', e);
      }
      await fetchDepartments();
      await fetchMRNs();
      await fetchStats();
    };

    initApp();
  }, [fetchDepartments, fetchMRNs, fetchStats]);

  // Handle Search for single MRN
  const handleSearchMRN = async (mrnNo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mrn/${mrnNo}`);
      const data = await res.json();
      if (data.success && data.mrn) {
        setSelectedMRN(data.mrn);
        setViewMode('dashboard');
      } else {
        setSearchQuery(mrnNo);
        setViewMode('dashboard');
        fetchMRNs();
      }
    } catch (err) {
      setSearchQuery(mrnNo);
      setViewMode('dashboard');
      fetchMRNs();
    } finally {
      setLoading(false);
    }
  };

  // Select Department from Entrance Portal
  const handleSelectDepartment = (deptName) => {
    const deptUser = {
      id: `dept-${deptName}`,
      name: `${deptName} Officer`,
      role: 'department',
      department: deptName,
      isAuthenticated: false,
    };
    setCurrentUser(deptUser);
    setSelectedDeptFilter(deptName);
    setViewMode('dashboard');
  };

  // Handle successful login
  const handleLoginSuccess = (loggedUser) => {
    setCurrentUser(loggedUser);
    if (loggedUser.role === 'supervisor' && loggedUser.department) {
      setSelectedDeptFilter(loggedUser.department);
    } else {
      setSelectedDeptFilter('ALL');
    }
    setViewMode('dashboard');
    fetchMRNs();
    fetchStats();
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('sundaram_mrn_user');
    setCurrentUser({
      id: 'guest',
      name: 'Department Requester',
      role: 'department',
      department: 'Engineering',
      isAuthenticated: false,
    });
    setSelectedDeptFilter('ALL');
    setViewMode('portal');
  };

  // Helper: Status Badge
  const renderStatusBadge = (mrn) => {
    if (mrn.isLocked || mrn.status === 'ISSUED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <Lock className="w-3 h-3" /> Issued & Locked
        </span>
      );
    }

    if (mrn.status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
          <CheckCircle className="w-3 h-3" /> Approved (Stores Ready)
        </span>
      );
    }

    if (mrn.status === 'SUPERVISOR_APPROVED' || mrn.status === 'NIRANJAN_APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
          <Clock className="w-3 h-3" /> Pending Management
        </span>
      );
    }

    if (mrn.status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        <Clock className="w-3 h-3" /> Pending Supervisor
      </span>
    );
  };

  // If in portal view mode, show the beautiful entrance portal
  if (viewMode === 'portal') {
    return (
      <LandingPortal
        departments={departments}
        onSelectDepartment={handleSelectDepartment}
        onLoginSuccess={handleLoginSuccess}
        onSearchMRN={handleSearchMRN}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Dashboard Workspace View
  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        departments={departments}
        onOpenNewMRN={() => setIsNewMRNModalOpen(true)}
        onSearchMRN={handleSearchMRN}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onExitToPortal={() => setViewMode('portal')}
        mrns={mrns}
        onSelectMRN={(m) => setSelectedMRN(m)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: MRN Requests List */}
        {activeTab === 'mrns' && (
          <div className="space-y-5">
            {/* Action Bar & Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by MRN #, Description, Requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Department & Status Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {['admin', 'stores', 'management_niranjan', 'management_vinod'].includes(currentUser.role) ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none text-xs"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.name} value={d.name} className="dark:bg-slate-800">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800/80 px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 shadow-sm"
                    title={`Locked to ${currentUser.department || 'Department'}. Requisitions and data are isolated to this department only.`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{currentUser.department || 'Department'}</span>
                    <span className="text-[10px] bg-sky-200 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                      Department
                    </span>
                  </div>
                )}

                {/* Status Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none text-xs"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING_SUPERVISOR">Pending Supervisor</option>
                    <option value="PENDING_MANAGEMENT">Pending Management</option>
                    <option value="APPROVED">Approved (Stores Ready)</option>
                    <option value="ISSUED">Issued & Locked</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => { fetchMRNs(); fetchStats(); }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                  title="Refresh MRN List"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div onClick={() => setSelectedStatusFilter('ALL')} className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedStatusFilter === 'ALL' ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Listed</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{mrns.length}</div>
              </div>

              <div onClick={() => setSelectedStatusFilter('PENDING_SUPERVISOR')} className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedStatusFilter === 'PENDING_SUPERVISOR' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending Supervisor</div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                  {mrns.filter((m) => m.status === 'PENDING_SUPERVISOR').length}
                </div>
              </div>

              <div onClick={() => setSelectedStatusFilter('PENDING_MANAGEMENT')} className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedStatusFilter === 'PENDING_MANAGEMENT' ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">Pending Mr. Niranjan / Mr. Vinod</div>
                <div className="text-xl font-black text-purple-700 dark:text-purple-400">
                  {mrns.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length}
                </div>
              </div>

              <div onClick={() => setSelectedStatusFilter('ISSUED')} className={`p-3.5 rounded-2xl border cursor-pointer transition ${selectedStatusFilter === 'ISSUED' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Issued & Locked</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {mrns.filter((m) => m.status === 'ISSUED').length}
                </div>
              </div>
            </div>

            {/* MRN Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">MRN Number</th>
                      <th className="py-3 px-4">Department & Shift</th>
                      <th className="py-3 px-4">Requested By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Items</th>
                      <th className="py-3 px-4">Approvals Status</th>
                      <th className="py-3 px-4 text-center">Lifecycle Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                          Loading MRN records...
                        </td>
                      </tr>
                    ) : mrns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          No Material Request Notes found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      mrns.map((m) => (
                        <tr
                          key={m._id}
                          onClick={() => setSelectedMRN(m)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition"
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-sky-700 dark:text-sky-400 hover:underline font-mono">{m.mrnNo}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{m.department}</div>
                            <div className="text-[11px] text-slate-400">{m.shift || 'General'}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{m.requestedBy}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(m.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{m.items?.length || 0}</span>
                            <span className="text-[10px] text-slate-400 block">items</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.supervisorApproval?.approved ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`} title={m.supervisorApproval?.approved ? `Supervisor: ${m.supervisorApproval.approvedBy}` : 'Supervisor: Pending'}>
                                Sup {m.supervisorApproval?.approved ? '✓' : '...'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.niranjanApproval?.approved ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`} title={m.niranjanApproval?.approved ? 'Approved by Mr. Niranjan' : 'Mr. Niranjan: Pending'}>
                                Mr. Niranjan {m.niranjanApproval?.approved ? '✓' : '...'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.vinodApproval?.approved ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`} title={m.vinodApproval?.approved ? (m.vinodApproval.withoutNiranjan ? 'Approved by Mr. Vinod (Without Mr. Niranjan Approval)' : 'Approved by Mr. Vinod') : 'Mr. Vinod: Pending'}>
                                Mr. Vinod {m.vinodApproval?.approved ? '✓' : '...'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">{renderStatusBadge(m)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold hover:underline">
                              View <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analytics & Reports */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            mrns={mrns}
            stats={stats}
            loading={loading}
            onRefresh={() => { fetchMRNs(); fetchStats(); }}
          />
        )}

        {/* Tab 3: Admin Console */}
        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <AdminPanel
            departments={departments}
            onRefreshDepartments={fetchDepartments}
            mrns={mrns}
            onSelectMRN={(m) => setSelectedMRN(m)}
            onRefreshMRNs={fetchMRNs}
          />
        )}
      </main>

      {/* New MRN Creation Modal */}
      <NewMRNModal
        isOpen={isNewMRNModalOpen}
        onClose={() => setIsNewMRNModalOpen(false)}
        currentUser={currentUser}
        departments={departments}
        onMRNCreated={(newMrn) => {
          setMrns([newMrn, ...mrns]);
          fetchStats();
        }}
      />

      {/* Login & Change Password Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* MRN Details & Approval / Issue Modal */}
      <MRNDetailsModal
        mrn={selectedMRN}
        isOpen={Boolean(selectedMRN)}
        onClose={() => setSelectedMRN(null)}
        currentUser={currentUser}
        onMRNUpdated={(updatedMRN) => {
          setSelectedMRN(updatedMRN);
          setMrns(mrns.map((m) => (m._id === updatedMRN._id ? updatedMRN : m)));
          fetchStats();
        }}
        onMRNDeleted={(delId) => {
          setMrns(mrns.filter((m) => m._id !== delId));
          fetchStats();
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />
    </div>
  );
}
