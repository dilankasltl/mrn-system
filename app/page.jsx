'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import LandingPortal from '@/components/LandingPortal';
import NewMRNModal from '@/components/NewMRNModal';
import MRNDetailsModal from '@/components/MRNDetailsModal';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AdminPanel from '@/components/AdminPanel';
import LoginModal from '@/components/LoginModal';
import NotificationToast from '@/components/NotificationToast';
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
  FileSpreadsheet,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { exportMRNsToExcel } from '@/lib/exportExcel';
import { INITIAL_DEPARTMENTS } from '@/lib/seedData';
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/notificationAudio';

export default function HomePage() {
  const [theme, setTheme] = useState('light');

  // Synchronous session restore - zero hydration race condition
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sundaram_mrn_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name && parsed.isAuthenticated) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return {
      id: 'guest',
      name: 'Department Requester',
      role: 'department',
      department: 'Engineering',
      isAuthenticated: false,
    };
  });

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sundaram_mrn_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.isAuthenticated) return 'dashboard';
        }
      } catch (e) {}
    }
    return 'portal';
  });

  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [mrns, setMrns] = useState([]);
  const [allMrns, setAllMrns] = useState([]); // unrestricted list for track search suggestions
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [activeTab, setActiveTab] = useState('mrns');

  const [isNewMRNModalOpen, setIsNewMRNModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMRN, setSelectedMRN] = useState(null);

  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date and Approval History Filters
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [approvalHistoryFilter, setApprovalHistoryFilter] = useState('ALL'); // 'ALL' | 'MY_APPROVALS' | 'PENDING_ME'

  // Live Toast Notifications & Sound State
  const [toasts, setToasts] = useState([]);
  const lastKnownPendingIds = React.useRef(new Set());
  const hasInitialPolled = React.useRef(false);

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

  // Supervised departments for supervisor role
  const supervisorDepartments = useMemo(() => {
    if (currentUser?.role !== 'supervisor') return [];
    const supName = currentUser?.name?.toLowerCase().trim();
    const matched = departments
      .filter((d) =>
        (d.supervisors || []).some((s) => {
          const sName = s.name?.toLowerCase().trim();
          return sName && (sName === supName || sName.includes(supName) || supName.includes(sName));
        })
      )
      .map((d) => d.name);
    if (matched.length > 0) return Array.from(new Set(matched)).sort();
    return currentUser?.department ? [currentUser.department] : [];
  }, [currentUser?.role, currentUser?.name, currentUser?.department, departments]);

  const supervisorDeptKey = useMemo(() => supervisorDepartments.join(','), [supervisorDepartments]);

  // Safeguarded MRNs list for active view:
  // Management View Isolation: Mr. Niranjan and Mr. Vinod ONLY see supervisor-approved MRNs
  const displayMrns = useMemo(() => {
    let list = mrns;
    if (currentUser?.role === 'management_niranjan' || currentUser?.role === 'management_vinod') {
      list = list.filter((m) => m.supervisorApproval?.approved === true);
    }
    return list;
  }, [mrns, currentUser?.role]);

  // Fetch MRNs
  const fetchMRNs = useCallback(async (userOverride = null) => {
    setLoading(true);
    try {
      const activeUser = userOverride || currentUser;
      const params = new URLSearchParams();

      const isGlobalManager = ['admin', 'stores', 'management_niranjan', 'management_vinod'].includes(activeUser.role);
      const isSupervisor = activeUser.role === 'supervisor';

      if (isGlobalManager) {
        if (selectedDeptFilter && selectedDeptFilter !== 'ALL') {
          params.append('department', selectedDeptFilter);
        }
      } else if (isSupervisor) {
        if (selectedDeptFilter && selectedDeptFilter !== 'ALL') {
          params.append('department', selectedDeptFilter);
        } else {
          const supName = activeUser.name?.toLowerCase().trim();
          const matched = (departments || [])
            .filter((d) =>
              (d.supervisors || []).some((s) => {
                const sName = s.name?.toLowerCase().trim();
                return sName && (sName === supName || sName.includes(supName) || supName.includes(sName));
              })
            )
            .map((d) => d.name);
          const depts = matched.length > 0 ? matched : (activeUser.department ? [activeUser.department] : []);
          if (depts.length > 0) {
            params.append('supervisorDepts', depts.join(','));
          } else if (activeUser.department) {
            params.append('department', activeUser.department);
          }
        }
      } else {
        params.append('department', activeUser.department || 'Production');
      }

      if (selectedStatusFilter !== 'ALL') {
        params.append('status', selectedStatusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Date filtering params
      const now = new Date();
      if (dateFilter === 'TODAY') {
        const todayStr = now.toISOString().slice(0, 10);
        params.append('startDate', todayStr);
        params.append('endDate', todayStr);
      } else if (dateFilter === 'THIS_MONTH') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        params.append('startDate', firstDay);
        params.append('endDate', lastDay);
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }

      // Approval history filter
      if (approvalHistoryFilter === 'MY_APPROVALS') {
        params.append('approvalFilter', 'my_approvals');
        if (activeUser.role === 'supervisor') {
          params.append('approvedBy', activeUser.name);
        }
      } else if (approvalHistoryFilter === 'PENDING_ME') {
        params.append('status', 'PENDING_MY_APPROVAL');
      }

      params.append('role', activeUser.role);
      if (activeUser.department) {
        params.append('userDept', activeUser.department);
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
  }, [
    selectedDeptFilter,
    selectedStatusFilter,
    searchQuery,
    currentUser.role,
    currentUser.department,
    currentUser.name,
    dateFilter,
    customStartDate,
    customEndDate,
    approvalHistoryFilter,
    supervisorDeptKey,
  ]);

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

  // Initial Data on Mount (runs once)
  useEffect(() => {
    fetchDepartments();
    fetchStats();
    fetch('/api/init').catch((e) => console.error('Init error', e));
  }, [fetchDepartments, fetchStats]);

  // Fetch MRNs on filter / criteria change
  useEffect(() => {
    fetchMRNs();
  }, [fetchMRNs]);

  // Fetch all MRNs for track search suggestions and analytics
  useEffect(() => {
    const allMrnsParams = new URLSearchParams({ limit: '500' });
    if (currentUser?.role) allMrnsParams.append('role', currentUser.role);
    if (currentUser?.department) allMrnsParams.append('userDept', currentUser.department);
    if (currentUser?.role === 'supervisor' && supervisorDeptKey) {
      allMrnsParams.append('supervisorDepts', supervisorDeptKey);
    }
    fetch(`/api/mrn?${allMrnsParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          let list = data.mrns || [];
          if (currentUser?.role === 'management_niranjan' || currentUser?.role === 'management_vinod') {
            list = list.filter((m) => m.supervisorApproval?.approved === true);
          }
          setAllMrns(list);
        }
      })
      .catch((e) => console.error('All MRNs fetch error', e));
  }, [currentUser?.role, currentUser?.department, supervisorDeptKey]);

  // Real-Time Live Polling for Notifications & Bell Count (every 15s)
  useEffect(() => {
    if (!currentUser.isAuthenticated || currentUser.role === 'department') return;

    // Request desktop permission on sign-in
    requestNotificationPermission();

    const checkNewNotifications = async () => {
      try {
        const res = await fetch('/api/mrn?limit=100');
        const data = await res.json();
        if (!data.success || !Array.isArray(data.mrns)) return;

        const currentMrns = data.mrns;

        // Filter what is pending for current user
        let userPending = [];
        if (currentUser.role === 'supervisor') {
          const supDepts = supervisorDepartments.length > 0 ? supervisorDepartments : [currentUser.department];
          userPending = currentMrns.filter(
            (m) =>
              supDepts.includes(m.department) &&
              !m.supervisorApproval?.approved &&
              m.status === 'PENDING_SUPERVISOR'
          );
        } else if (currentUser.role === 'management_niranjan') {
          userPending = currentMrns.filter(
            (m) =>
              m.supervisorApproval?.approved &&
              !m.niranjanApproval?.approved &&
              m.status !== 'ISSUED' &&
              m.status !== 'REJECTED'
          );
        } else if (currentUser.role === 'management_vinod') {
          userPending = currentMrns.filter(
            (m) =>
              m.supervisorApproval?.approved &&
              !m.vinodApproval?.approved &&
              m.status !== 'ISSUED' &&
              m.status !== 'REJECTED'
          );
        } else if (currentUser.role === 'stores') {
          userPending = currentMrns.filter(
            (m) =>
              m.supervisorApproval?.approved &&
              (m.vinodApproval?.approved || m.status === 'APPROVED') &&
              !m.storesIssue?.issued &&
              m.status !== 'REJECTED'
          );
        }

        const pendingIds = new Set(userPending.map((m) => m._id));

        // If after initial poll, detect new arrivals
        if (hasInitialPolled.current) {
          const newArrivals = userPending.filter((m) => !lastKnownPendingIds.current.has(m._id));
          if (newArrivals.length > 0) {
            playNotificationSound();
            const newest = newArrivals[0];
            const toastId = Date.now();
            setToasts((prev) => [
              {
                id: toastId,
                title: 'New Requisition Pending Action',
                message: `${newest.department} - ${newest.requestedBy} (${newest.items?.length || 0} items)`,
                mrn: newest,
              },
              ...prev.slice(0, 4),
            ]);

            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 7000);

            showBrowserNotification(
              `Sundaram MRN Action Required: ${newest.mrnNo}`,
              `New requisition from ${newest.department} by ${newest.requestedBy} requires your review.`,
              () => setSelectedMRN(newest)
            );

            // Update live data silently only when new action arrives
            fetchMRNs();
            fetchStats();
          }
        } else {
          hasInitialPolled.current = true;
        }

        lastKnownPendingIds.current = pendingIds;
      } catch (err) {
        // silent polling catch
      }
    };

    const interval = setInterval(checkNewNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role, currentUser?.department, currentUser?.isAuthenticated, supervisorDeptKey, fetchMRNs, fetchStats]);

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
    setSelectedDeptFilter('ALL');
    setViewMode('dashboard');
    fetchMRNs(loggedUser);
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
    setApprovalHistoryFilter('ALL');
    setDateFilter('ALL');
    setViewMode('portal');
  };

  // Export current list to Excel
  const handleExportCurrentMRNs = () => {
    let dateLabel = dateFilter;
    if (dateFilter === 'CUSTOM' && customStartDate) {
      dateLabel = `${customStartDate}_to_${customEndDate || 'now'}`;
    }
    exportMRNsToExcel(displayMrns, {
      title: 'Sundaram_MRN_History',
      department: selectedDeptFilter,
      dateRangeLabel: dateLabel,
    });
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

  // If in portal view mode, show entrance portal
  if (viewMode === 'portal') {
    return (
      <LandingPortal
        departments={departments}
        onSelectDepartment={handleSelectDepartment}
        onLoginSuccess={handleLoginSuccess}
        onSearchMRN={handleSearchMRN}
        theme={theme}
        onToggleTheme={toggleTheme}
        allMrns={allMrns}
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
        mrns={allMrns.length > 0 ? allMrns : mrns}
        onSelectMRN={(m) => setSelectedMRN(m)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: MRN Requests List */}
        {activeTab === 'mrns' && (
          <div className="space-y-5">
            {/* Action Bar & Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

                {/* Right Controls: Department, Status, Export, Refresh */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Department Selector */}
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
                  ) : currentUser.role === 'supervisor' && supervisorDepartments.length > 1 ? (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 px-3 py-2 rounded-xl text-xs">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value)}
                        className="bg-transparent text-amber-900 dark:text-amber-200 font-semibold focus:outline-none text-xs"
                      >
                        <option value="ALL">All Supervised Depts ({supervisorDepartments.length})</option>
                        {supervisorDepartments.map((deptName) => (
                          <option key={deptName} value={deptName} className="dark:bg-slate-800">
                            {deptName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div
                        className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800/80 px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 shadow-sm"
                        title={`Locked to ${currentUser.department || 'Department'}.`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>{currentUser.department || 'Department'}</span>
                        <span className="text-[10px] bg-sky-200 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {currentUser.role === 'supervisor' ? 'Supervisor' : 'Department'}
                        </span>
                      </div>
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

                  {/* Date Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none text-xs"
                    >
                      <option value="ALL">All Dates</option>
                      <option value="TODAY">Today</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="CUSTOM">Custom Range</option>
                    </select>
                  </div>

                  {/* Excel Export Button */}
                  <button
                    onClick={handleExportCurrentMRNs}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                    title="Download filtered MRNs as Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>

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

              {/* Secondary Filter Row: Custom Dates & Approver History Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Supervisor & Management History Toggle Pills */}
                {currentUser.role === 'supervisor' && (
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 px-1.5">View:</span>
                    <button
                      type="button"
                      onClick={() => setApprovalHistoryFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        approvalHistoryFilter === 'ALL'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 dark:text-amber-300 hover:bg-amber-200/50'
                      }`}
                    >
                      All {currentUser.department || ''} MRNs
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalHistoryFilter('MY_APPROVALS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        approvalHistoryFilter === 'MY_APPROVALS'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 dark:text-amber-300 hover:bg-amber-200/50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approved By Me
                    </button>
                  </div>
                )}

                {(currentUser.role === 'management_niranjan' || currentUser.role === 'management_vinod') && (
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 p-1 rounded-xl border border-blue-200 dark:border-blue-900/50">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 px-1.5">View:</span>
                    <button
                      type="button"
                      onClick={() => setApprovalHistoryFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        approvalHistoryFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-800 dark:text-blue-300 hover:bg-blue-200/50'
                      }`}
                    >
                      All Plant MRNs
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalHistoryFilter('PENDING_ME')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        approvalHistoryFilter === 'PENDING_ME'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-800 dark:text-blue-300 hover:bg-blue-200/50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Pending My Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalHistoryFilter('MY_APPROVALS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        approvalHistoryFilter === 'MY_APPROVALS'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-800 dark:text-blue-300 hover:bg-blue-200/50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approved By Me
                    </button>
                  </div>
                )}

                {currentUser.role === 'stores' && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-1.5">View:</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('ALL'); setApprovalHistoryFilter('ALL'); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        selectedStatusFilter === 'ALL' && approvalHistoryFilter === 'ALL'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      All MRNs
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('READY_TO_ISSUE'); setApprovalHistoryFilter('ALL'); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        selectedStatusFilter === 'READY_TO_ISSUE'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      Ready to Issue (Authorized)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedStatusFilter('ISSUED'); setApprovalHistoryFilter('my_approvals'); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        selectedStatusFilter === 'ISSUED'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      Issued & Locked
                    </button>
                  </div>
                )}

                {/* Custom Date Pickers */}
                {dateFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 text-[11px]">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[11px]">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  selectedStatusFilter === 'ALL'
                    ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {currentUser.role === 'management_niranjan' || currentUser.role === 'management_vinod'
                    ? 'Supervisor Approved Total'
                    : 'Total Listed'}
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{displayMrns.length}</div>
              </div>

              {currentUser.role === 'management_niranjan' ? (
                <>
                  <div
                    onClick={() => { setSelectedStatusFilter('ALL'); setApprovalHistoryFilter('PENDING_ME'); }}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-300 transition"
                  >
                    <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                      Pending My Review
                    </div>
                    <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                      {displayMrns.filter((m) => !m.niranjanApproval?.approved && m.status !== 'REJECTED' && m.status !== 'ISSUED').length}
                    </div>
                  </div>

                  <div
                    onClick={() => { setSelectedStatusFilter('ALL'); setApprovalHistoryFilter('MY_APPROVALS'); }}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-300 transition"
                  >
                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      Reviewed by Me
                    </div>
                    <div className="text-xl font-black text-blue-700 dark:text-blue-400">
                      {displayMrns.filter((m) => m.niranjanApproval?.approved).length}
                    </div>
                  </div>
                </>
              ) : currentUser.role === 'management_vinod' ? (
                <>
                  <div
                    onClick={() => { setSelectedStatusFilter('ALL'); setApprovalHistoryFilter('PENDING_ME'); }}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-purple-300 transition"
                  >
                    <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
                      Pending My Approval
                    </div>
                    <div className="text-xl font-black text-purple-700 dark:text-purple-400">
                      {displayMrns.filter((m) => !m.vinodApproval?.approved && m.status !== 'REJECTED' && m.status !== 'ISSUED').length}
                    </div>
                  </div>

                  <div
                    onClick={() => { setSelectedStatusFilter('ALL'); setApprovalHistoryFilter('MY_APPROVALS'); }}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-300 transition"
                  >
                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      Authorized by Me
                    </div>
                    <div className="text-xl font-black text-blue-700 dark:text-blue-400">
                      {displayMrns.filter((m) => m.vinodApproval?.approved).length}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    onClick={() => setSelectedStatusFilter('PENDING_SUPERVISOR')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedStatusFilter === 'PENDING_SUPERVISOR'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending Supervisor</div>
                    <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                      {displayMrns.filter((m) => m.status === 'PENDING_SUPERVISOR').length}
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedStatusFilter('PENDING_MANAGEMENT')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedStatusFilter === 'PENDING_MANAGEMENT'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
                      Pending Mr. Niranjan / Mr. Vinod
                    </div>
                    <div className="text-xl font-black text-purple-700 dark:text-purple-400">
                      {displayMrns.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length}
                    </div>
                  </div>
                </>
              )}

              <div
                onClick={() => setSelectedStatusFilter('ISSUED')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  selectedStatusFilter === 'ISSUED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Issued & Locked</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {displayMrns.filter((m) => m.isLocked || m.status === 'ISSUED' || m.status === 'PARTIALLY_ISSUED').length}
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
                      <th className="py-3 px-4">Department</th>
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
                    ) : displayMrns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          No Material Request Notes found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      displayMrns.map((m) => (
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
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{m.requestedBy}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(m.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{m.items?.length || 0}</span>
                            <span className="text-[10px] text-slate-400 block">items</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  m.supervisorApproval?.approved
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                                title={m.supervisorApproval?.approved ? `Supervisor: ${m.supervisorApproval.approvedBy}` : 'Supervisor: Pending'}
                              >
                                Sup {m.supervisorApproval?.approved ? '✓' : '...'}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  m.niranjanApproval?.approved
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                                title={m.niranjanApproval?.approved ? `Approved by ${m.niranjanApproval.approvedBy}` : 'Mr. Niranjan: Pending'}
                              >
                                {m.niranjanApproval?.approved ? 'Mr. Niranjan ✓' : 'Mr. Niranjan ...'}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  m.vinodApproval?.approved
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                                title={
                                  m.vinodApproval?.approved
                                    ? m.vinodApproval.withoutNiranjan
                                      ? 'Approved by Mr. Vinod (Direct)'
                                      : 'Approved by Mr. Vinod'
                                    : 'Mr. Vinod: Pending'
                                }
                              >
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
            mrns={allMrns.length > 0 ? allMrns : displayMrns}
            currentUser={currentUser}
            departments={departments}
            stats={stats}
            loading={loading}
            onRefresh={() => {
              fetchMRNs();
              fetchStats();
              const p = new URLSearchParams({ limit: '500' });
              if (currentUser?.role) p.append('role', currentUser.role);
              if (currentUser?.department) p.append('userDept', currentUser.department);
              if (currentUser?.role === 'supervisor' && supervisorDepartments.length > 0) {
                p.append('supervisorDepts', supervisorDepartments.join(','));
              }
              fetch(`/api/mrn?${p.toString()}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.success) {
                    let list = d.mrns || [];
                    if (currentUser?.role === 'management_niranjan' || currentUser?.role === 'management_vinod') {
                      list = list.filter((m) => m.supervisorApproval?.approved === true);
                    }
                    setAllMrns(list);
                  }
                });
            }}
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
          setAllMrns([newMrn, ...allMrns]);
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
        departments={departments}
      />

      {/* MRN Details & Approval / Issue Modal */}
      <MRNDetailsModal
        mrn={selectedMRN}
        isOpen={Boolean(selectedMRN)}
        onClose={() => setSelectedMRN(null)}
        currentUser={currentUser}
        departments={departments}
        onMRNUpdated={(updatedMRN) => {
          setSelectedMRN(updatedMRN);
          setMrns(mrns.map((m) => (m._id === updatedMRN._id ? updatedMRN : m)));
          setAllMrns(allMrns.map((m) => (m._id === updatedMRN._id ? updatedMRN : m)));
          fetchStats();
        }}
        onMRNDeleted={(delId) => {
          setMrns(mrns.filter((m) => m._id !== delId));
          setAllMrns(allMrns.filter((m) => m._id !== delId));
          fetchStats();
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Floating Real-Time Notification Toasts */}
      <NotificationToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onSelectMRN={(m) => setSelectedMRN(m)}
      />
    </div>
  );
}
