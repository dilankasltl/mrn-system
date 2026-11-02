'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { exportMRNsToExcel } from '@/lib/exportExcel';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function AnalyticsDashboard({ mrns = [], stats, loading, onRefresh }) {
  const [viewMode, setViewMode] = useState('both');

  // Date filter states: 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom'
  const [datePreset, setDatePreset] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL'); // 'ALL' | 'NIRANJAN' | 'VINOD' | 'SUPERVISOR'

  // Extract all unique departments present
  const availableDepts = useMemo(() => {
    const set = new Set();
    mrns.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set).sort();
  }, [mrns]);

  // Compute filtered MRNs based on datePreset, custom dates, department, and approvalFilter
  const filteredMRNs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthIndex = lastMonthDate.getMonth();

    return mrns.filter((m) => {
      // 1. Department Filter
      if (selectedDept !== 'ALL' && m.department !== selectedDept) {
        return false;
      }

      // 2. Approver Filter
      if (approvalFilter === 'NIRANJAN' && !m.niranjanApproval?.approved) return false;
      if (approvalFilter === 'VINOD' && !m.vinodApproval?.approved) return false;
      if (approvalFilter === 'SUPERVISOR' && !m.supervisorApproval?.approved) return false;

      // 3. Date Filter
      if (!m.date) return true;
      const mDate = new Date(m.date);
      const mDateStr = mDate.toISOString().slice(0, 10);

      if (datePreset === 'today') {
        return mDateStr === todayStr;
      }

      if (datePreset === 'yesterday') {
        return mDateStr === yesterdayStr;
      }

      if (datePreset === 'this_month') {
        return mDate.getFullYear() === currentYear && mDate.getMonth() === currentMonth;
      }

      if (datePreset === 'last_month') {
        return mDate.getFullYear() === lastMonthYear && mDate.getMonth() === lastMonthIndex;
      }

      if (datePreset === 'custom') {
        if (customStartDate && mDateStr < customStartDate) return false;
        if (customEndDate && mDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [mrns, selectedDept, approvalFilter, datePreset, customStartDate, customEndDate]);

  // Handle Export to Excel
  const handleExport = () => {
    let dateLabel = datePreset;
    if (datePreset === 'custom' && customStartDate) {
      dateLabel = `${customStartDate}_to_${customEndDate || 'now'}`;
    }
    exportMRNsToExcel(filteredMRNs, {
      title: 'Sundaram_MRN_Analytics',
      department: selectedDept,
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
      'Pending Mr. Niranjan': filteredMRNs.filter((m) => m.supervisorApproval?.approved && !m.niranjanApproval?.approved && m.status !== 'ISSUED').length,
      'Pending Mr. Vinod': filteredMRNs.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length,
      'Ready for Stores': filteredMRNs.filter((m) => (m.status === 'APPROVED' || m.supervisorApproval?.approved) && !m.storesIssue?.issued).length,
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-500" />
              MRN Analytics & Department History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter by month, day, date range, or department and export comprehensive Excel reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggles */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1 rounded-lg transition ${viewMode === 'both' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1 rounded-lg transition ${viewMode === 'charts' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
                Charts
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
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
          {/* Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Period:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  datePreset === p.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Department Filter & Approver Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department Dropdown */}
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

        {/* Custom Date Range Pickers (shown when 'custom' selected) */}
        {datePreset === 'custom' && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs bg-sky-50/50 dark:bg-sky-950/20 p-3 rounded-2xl border border-sky-200 dark:border-sky-900/50">
            <span className="font-bold text-sky-800 dark:text-sky-300">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 dark:text-slate-400">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 dark:text-slate-400">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards for Filtered Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase">Matching MRNs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{filteredMRNs.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">In selected period</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-amber-500 block uppercase">Pending Management</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {filteredMRNs.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1">Mr. Niranjan / Mr. Vinod</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-blue-500 block uppercase">Ready at Stores</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {filteredMRNs.filter((m) => (m.status === 'APPROVED' || m.supervisorApproval?.approved) && !m.storesIssue?.issued).length}
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
              Material Quantities Requested vs Issued (By Department)
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

      {/* Table Breakdown Section */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Department Summary Table ({filteredMRNs.length} records)
            </h3>
            <span className="text-xs text-slate-400">{Object.keys(deptDataMap).length} Active Departments</span>
          </div>

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
                      No department data for the selected period.
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
        </div>
      )}
    </div>
  );
}
