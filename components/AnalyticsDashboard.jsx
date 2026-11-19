'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  BarChart2,
  Table as TableIcon,
  CheckCircle,
  Clock,
  PackageCheck,
  FileSpreadsheet,
  Calendar,
  Filter,
  Building2,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { exportMRNsToExcel } from '@/lib/exportExcel';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function AnalyticsDashboard({
  mrns = [],
  currentUser,
  departments = [],
  stats,
  loading,
  onRefresh,
  onSelectMRN,
}) {
  const [viewMode, setViewMode] = useState('both');

  // Role permissions
  const isGlobalRole = ['admin', 'stores', 'management_niranjan', 'management_vinod'].includes(currentUser?.role);
  const isSupervisor = currentUser?.role === 'supervisor';
  const isDepartmentRole = currentUser?.role === 'department';

  // Determine authorized departments for this specific user
  const authorizedDepartments = useMemo(() => {
    if (isGlobalRole) {
      return departments.map((d) => d.name);
    }
    if (isSupervisor) {
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
    }
    // Department role
    return currentUser?.department ? [currentUser.department] : [];
  }, [currentUser?.name, currentUser?.department, departments, isGlobalRole, isSupervisor]);

  const authorizedDeptKey = useMemo(() => authorizedDepartments.join(','), [authorizedDepartments]);

  // Initial department state
  const [selectedDept, setSelectedDept] = useState(() => {
    if (isDepartmentRole) return currentUser?.department || 'ALL';
    if (isSupervisor && authorizedDepartments.length === 1) return authorizedDepartments[0];
    return 'ALL';
  });

  // Keep selectedDept in sync if user changes
  useEffect(() => {
    if (isDepartmentRole) {
      setSelectedDept(currentUser?.department || 'ALL');
    } else if (isSupervisor && authorizedDepartments.length === 1) {
      setSelectedDept(authorizedDepartments[0]);
    }
  }, [currentUser?.department, isDepartmentRole, isSupervisor, authorizedDeptKey]);

  // Helper: Format local YYYY-MM-DD
  const getLocalDateStr = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Date filter states: 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'single' | 'custom'
  const [datePreset, setDatePreset] = useState('all');
  const [singleDate, setSingleDate] = useState(() => getLocalDateStr(new Date()));
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL'); // 'ALL' | 'NIRANJAN' | 'VINOD' | 'SUPERVISOR'
  const [tableTab, setTableTab] = useState('department'); // 'department' | 'records'
  const [recordSearch, setRecordSearch] = useState('');

  // Step single date back or forward by n days
  const stepSingleDate = (days) => {
    const base = singleDate ? new Date(`${singleDate}T00:00:00`) : new Date();
    base.setDate(base.getDate() + days);
    setSingleDate(getLocalDateStr(base));
    setDatePreset('single');
  };

  const setSingleDateToToday = () => {
    setSingleDate(getLocalDateStr(new Date()));
    setDatePreset('single');
  };

  // Active Date Filter Label
  const activeDateLabel = useMemo(() => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'last_month') return 'Last Month';
    if (datePreset === 'single') {
      if (!singleDate) return 'Specific Date';
      const parts = singleDate.split('-');
      if (parts.length === 3) {
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      }
      return singleDate;
    }
    if (datePreset === 'custom') {
      if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
      if (customStartDate) return `From ${customStartDate}`;
      if (customEndDate) return `Until ${customEndDate}`;
      return 'Custom Range';
    }
    return 'Filtered Period';
  }, [datePreset, singleDate, customStartDate, customEndDate]);

  // Extract available departments for dropdown
  const availableDepts = useMemo(() => {
    if (isGlobalRole) {
      const set = new Set(departments.map((d) => d.name));
      mrns.forEach((m) => {
        if (m.department) set.add(m.department);
      });
      return Array.from(set).sort();
    }
    return authorizedDepartments;
  }, [isGlobalRole, departments, mrns, authorizedDepartments]);

  // Compute filtered MRNs strictly scoped by role, department authorization, date, and approver
  const filteredMRNs = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthIndex = lastMonthDate.getMonth();

    return mrns.filter((m) => {
      // 1. Strict Department Access Control:
      // Department roles only see their own department.
      // Supervisors only see their supervised departments.
      if (!isGlobalRole) {
        if (!authorizedDepartments.includes(m.department)) {
          return false;
        }
      }

      // 2. Management Isolation:
      // Mr. Niranjan and Mr. Vinod only see supervisor-approved MRNs
      if (currentUser?.role === 'management_niranjan' || currentUser?.role === 'management_vinod') {
        if (!m.supervisorApproval?.approved) {
          return false;
        }
      }

      // 3. User's Selected Department Filter
      if (selectedDept !== 'ALL' && m.department !== selectedDept) {
        return false;
      }

      // 4. Approver Filter
      if (approvalFilter === 'NIRANJAN' && !m.niranjanApproval?.approved) return false;
      if (approvalFilter === 'VINOD' && !m.vinodApproval?.approved) return false;
      if (approvalFilter === 'SUPERVISOR' && !m.supervisorApproval?.approved) return false;

      // 5. Date Filter
      if (!m.date) return true;
      const mDateStr = getLocalDateStr(m.date);

      if (datePreset === 'today') {
        return mDateStr === todayStr;
      }

      if (datePreset === 'yesterday') {
        return mDateStr === yesterdayStr;
      }

      if (datePreset === 'this_month') {
        const mDate = new Date(m.date);
        return mDate.getFullYear() === currentYear && mDate.getMonth() === currentMonth;
      }

      if (datePreset === 'last_month') {
        const mDate = new Date(m.date);
        return mDate.getFullYear() === lastMonthYear && mDate.getMonth() === lastMonthIndex;
      }

      if (datePreset === 'single') {
        if (!singleDate) return true;
        return mDateStr === singleDate;
      }

      if (datePreset === 'custom') {
        if (customStartDate && mDateStr < customStartDate) return false;
        if (customEndDate && mDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [
    mrns,
    isGlobalRole,
    authorizedDepartments,
    currentUser,
    selectedDept,
    approvalFilter,
    datePreset,
    singleDate,
    customStartDate,
    customEndDate,
  ]);

  // Handle Export to Excel
  const handleExport = () => {
    let dateLabel = datePreset;
    if (datePreset === 'single' && singleDate) {
      dateLabel = `Date_${singleDate}`;
    } else if (datePreset === 'custom' && customStartDate) {
      dateLabel = `${customStartDate}_to_${customEndDate || 'now'}`;
    }
    const exportTitle = isDepartmentRole
      ? `${currentUser?.department || 'Dept'}_MRN_Analytics`
      : isSupervisor
      ? `Supervisor_${currentUser?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_Analytics`
      : 'Sundaram_MRN_Analytics';

    exportMRNsToExcel(filteredMRNs, {
      title: exportTitle,
      department: selectedDept !== 'ALL' ? selectedDept : isDepartmentRole ? currentUser?.department : 'My_Authorized',
      dateRangeLabel: dateLabel,
    });
  };

  // Prepare chart data: Department-wise request vs issued
  const deptDataMap = useMemo(() => {
    const map = {};
    filteredMRNs.forEach((m) => {
      const dept = m.department || 'Other';
      if (!map[dept]) {
        map[dept] = { department: dept, requested: 0, issued: 0, count: 0 };
      }
      map[dept].count += 1;
      (m.items || []).forEach((it) => {
        map[dept].requested += it.requestQty || 0;
        map[dept].issued += it.issueQty || 0;
      });
    });
    return map;
  }, [filteredMRNs]);

  const deptChartData = useMemo(() => {
    return Object.values(deptDataMap).slice(0, 15);
  }, [deptDataMap]);

  // Status breakdown data for Pie Chart
  const statusCounts = useMemo(() => {
    return {
      'Pending Supervisor': filteredMRNs.filter((m) => m.status === 'PENDING_SUPERVISOR').length,
      'Pending Mr. Niranjan': filteredMRNs.filter(
        (m) => m.supervisorApproval?.approved && !m.niranjanApproval?.approved && m.status !== 'ISSUED'
      ).length,
      'Pending Mr. Vinod': filteredMRNs.filter(
        (m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED'
      ).length,
      'Ready for Stores': filteredMRNs.filter(
        (m) =>
          (m.status === 'APPROVED' || m.vinodApproval?.approved) &&
          !m.storesIssue?.issued &&
          m.status !== 'REJECTED'
      ).length,
      'Issued & Locked': filteredMRNs.filter((m) => m.status === 'ISSUED' || m.isLocked).length,
    };
  }, [filteredMRNs]);

  const pieData = useMemo(() => {
    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [statusCounts]);

  return (
    <div className="space-y-6">
      {/* Top Banner, Filter Controls & Excel Export */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isDepartmentRole
                  ? `${currentUser?.department} Department Analytics & History`
                  : isSupervisor
                  ? `Supervisor Analytics — ${currentUser?.name}`
                  : 'Plant-wide MRN Analytics & Reports'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDepartmentRole
                ? `Authorized view strictly isolated to ${currentUser?.department} requisitions and store issuances.`
                : isSupervisor
                ? `Filtered strictly to your assigned departments: ${authorizedDepartments.join(', ')}.`
                : 'Real-time plant requisition tracking, department consumption, approvals, and Stores issuance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggles */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'both'
                    ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'charts'
                    ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
                Charts
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 inline mr-1" />
                Table
              </button>
            </div>

            {/* Refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Excel Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel ({filteredMRNs.length})
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Date Presets & Custom Pickers */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Presets Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Filter:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'single', label: 'Pick Specific Date', icon: Calendar },
              { id: 'custom', label: 'Date Range', icon: Calendar },
            ].map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                    datePreset === p.id
                      ? p.id === 'single' || p.id === 'custom'
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {IconComp && <IconComp className="w-3.5 h-3.5" />}
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Department Filter & Approver Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department Scoping Display */}
            {isDepartmentRole ? (
              // Locked to single department for department requester
              <div
                className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 shadow-xs"
                title={`Analytics locked strictly to ${currentUser?.department}`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <span>{currentUser?.department}</span>
                <span className="text-[9px] bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-300 px-1 py-0.2 rounded font-mono">
                  Locked
                </span>
              </div>
            ) : isSupervisor ? (
              // Supervisor sees only their supervised departments
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none text-xs"
                >
                  {authorizedDepartments.length > 1 && (
                    <option value="ALL">All My Departments ({authorizedDepartments.length})</option>
                  )}
                  {authorizedDepartments.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Global management sees all departments
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none text-xs"
                >
                  <option value="ALL">All Departments</option>
                  {availableDepts.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Approver Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none text-xs"
              >
                <option value="ALL">All Approvals</option>
                <option value="SUPERVISOR">Supervisor Approved</option>
                <option value="NIRANJAN">Mr. Niranjan Approved</option>
                <option value="VINOD">Mr. Vinod Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Specific Date Picker Bar (shown when 'single' selected) */}
        {datePreset === 'single' && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 animate-in fade-in duration-150">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Pick Exact Date:
            </span>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepSingleDate(-1)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" /> Prev Day
              </button>
              <button
                type="button"
                onClick={setSingleDateToToday}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => stepSingleDate(1)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition"
                title="Next Day"
              >
                Next Day <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
              </button>
            </div>
            <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 ml-1">
              📅 {activeDateLabel}
            </span>
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline ml-auto font-medium"
            >
              Reset to All Time
            </button>
          </div>
        )}

        {/* Custom Date Range Pickers (shown when 'custom' selected) */}
        {datePreset === 'custom' && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs bg-sky-50/50 dark:bg-sky-950/20 p-3 rounded-2xl border border-sky-200 dark:border-sky-900/50 animate-in fade-in duration-150">
            <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 dark:text-slate-400 font-medium">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 dark:text-slate-400 font-medium">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                Clear Dates
              </button>
            )}
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline ml-auto font-medium"
            >
              Reset to All Time
            </button>
          </div>
        )}

        {/* Active Filter Indicator */}
        {datePreset !== 'all' && (
          <div className="flex items-center justify-between bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 px-4 py-2 rounded-2xl text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Filtered Period: <strong className="text-sky-700 dark:text-sky-300 font-bold">{activeDateLabel}</strong>
              </span>
              <span className="bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {filteredMRNs.length} MRN{filteredMRNs.length === 1 ? '' : 's'} found
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" /> Show All Time
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards for Filtered Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase">
            {isDepartmentRole ? `${currentUser?.department} MRNs` : 'Matching MRNs'}
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{filteredMRNs.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            {isDepartmentRole ? 'This department only' : 'In authorized scope'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-amber-500 block uppercase">Pending Management</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {
              filteredMRNs.filter(
                (m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED'
              ).length
            }
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1">Mr. Niranjan / Mr. Vinod</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-blue-500 block uppercase">Ready at Stores</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {
              filteredMRNs.filter(
                (m) =>
                  (m.status === 'APPROVED' || m.vinodApproval?.approved) &&
                  !m.storesIssue?.issued &&
                  m.status !== 'REJECTED'
              ).length
            }
          </span>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 block mt-1">Authorized for issue</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-emerald-500 block uppercase">Issued & Locked</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {filteredMRNs.filter((m) => m.status === 'ISSUED' || m.isLocked).length}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mt-1">Completed issuance</span>
        </div>
      </div>

      {/* Visual Graphs Section */}
      {(viewMode === 'both' || viewMode === 'charts') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Requested vs Issued Quantities Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
              Material Quantities Requested vs Issued {isDepartmentRole ? `(${currentUser?.department})` : ''}
            </h3>
            <div className="h-72 w-full">
              {deptChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="requested" name="Requested Qty" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issued" name="Issued Qty" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No records found for the selected period
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown Pie Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
              MRN Pipeline Status Distribution
            </h3>
            <div className="h-72 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No data available for chart in selected period</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table Breakdown Section: Department Summary & Exact MRN History Records */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTableTab('department')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    tableTab === 'department'
                      ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 inline mr-1" />
                  Department Summary
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('records')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    tableTab === 'records'
                      ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  MRN History Records ({filteredMRNs.length})
                </button>
              </div>
            </div>

            {tableTab === 'department' ? (
              <span className="text-xs text-slate-400">
                {Object.keys(deptDataMap).length} Active Department{Object.keys(deptDataMap).length === 1 ? '' : 's'}
              </span>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none w-44"
                />
              </div>
            )}
          </div>

          {tableTab === 'department' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Total MRNs</th>
                    <th className="py-3 px-4 text-center">Requested QTY</th>
                    <th className="py-3 px-4 text-center">Issued QTY</th>
                    <th className="py-3 px-4 text-center">Fulfillment Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.values(deptDataMap).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No department data for {activeDateLabel}.
                      </td>
                    </tr>
                  ) : (
                    Object.values(deptDataMap).map((row, idx) => {
                      const rate = row.requested > 0 ? Math.round((row.issued / row.requested) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{row.department}</td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">{row.count}</td>
                          <td className="py-3 px-4 text-center font-medium text-sky-700 dark:text-sky-400">{row.requested}</td>
                          <td className="py-3 px-4 text-center font-medium text-emerald-700 dark:text-emerald-400">{row.issued}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(rate, 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">MRN Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMRNs
                    .filter((m) => {
                      if (!recordSearch.trim()) return true;
                      const q = recordSearch.toLowerCase();
                      return (
                        m.mrnNo?.toLowerCase().includes(q) ||
                        m.department?.toLowerCase().includes(q) ||
                        m.requestedBy?.toLowerCase().includes(q)
                      );
                    })
                    .map((m) => {
                      const mDate = m.date ? new Date(m.date).toLocaleDateString('en-GB') : '-';
                      return (
                        <tr key={m._id || m.mrnNo} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                            {m.mrnNo}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {m.department}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {m.requestedBy}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {mDate}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {m.items?.length || 0}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'ISSUED' || m.isLocked
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : m.status === 'APPROVED' || m.vinodApproval?.approved
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {m.status === 'ISSUED' || m.isLocked
                                ? 'Issued & Locked'
                                : m.status === 'APPROVED' || m.vinodApproval?.approved
                                ? 'Ready for Stores'
                                : m.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {onSelectMRN && (
                              <button
                                type="button"
                                onClick={() => onSelectMRN(m)}
                                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {filteredMRNs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No MRN records found for {activeDateLabel}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
