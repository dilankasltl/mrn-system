'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
import { Download, BarChart2, Table as TableIcon, CheckCircle, Clock, PackageCheck, FileSpreadsheet } from 'lucide-react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function AnalyticsDashboard({ mrns, stats, loading, onRefresh }) {
  const [viewMode, setViewMode] = useState('both');

  // Export to Excel function
  const handleExportToExcel = () => {
    if (!mrns || mrns.length === 0) {
      alert('No MRN records to export.');
      return;
    }

    // Flatten data for detailed items export
    const rows = [];

    mrns.forEach((m) => {
      if (m.items && m.items.length > 0) {
        m.items.forEach((it) => {
          rows.push({
            'MRN Number': m.mrnNo,
            'Department': m.department,
            'Requested By': m.requestedBy,
            'Shift': m.shift || 'General',
            'Date': new Date(m.date).toLocaleDateString(),
            'Status': m.status,
            'Item No': it.itemNo,
            'Description': it.description,
            'Request QTY': it.requestQty,
            'Unit': it.unit || 'Nos',
            'Issue QTY': it.issueQty || 0,
            'Item Remarks': it.remarks || '',
            'Item Issued': it.isIssued ? 'YES' : 'NO',
            'Supervisor Approved': m.supervisorApproval?.approved ? 'YES' : 'NO',
            'Supervisor Name': m.supervisorApproval?.approvedBy || '',
            'Mr. Niranjan Approved': m.niranjanApproval?.approved ? 'YES' : 'NO',
            'Mr. Vinod Approved': m.vinodApproval?.approved ? 'YES' : 'NO',
            'Approved Without Mr. Niranjan': m.vinodApproval?.withoutNiranjan ? 'YES' : 'NO',
            'Issued by Stores': m.storesIssue?.issued ? 'YES' : 'NO',
            'Stores Officer': m.storesIssue?.issuedBy || '',
            'Stores Remarks': m.storesIssue?.storesRemarks || '',
          });
        });
      } else {
        rows.push({
          'MRN Number': m.mrnNo,
          'Department': m.department,
          'Requested By': m.requestedBy,
          'Shift': m.shift || 'General',
          'Date': new Date(m.date).toLocaleDateString(),
          'Status': m.status,
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MRN Summary');

    // Auto column widths
    const max_width = rows.reduce((w, r) => Math.max(w, String(r['Description'] || '').length), 10);
    worksheet['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: Math.min(max_width + 4, 40) }, { wch: 12 }, { wch: 8 }, { wch: 12 }];

    XLSX.writeFile(workbook, `Sundaram_MRN_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Prepare chart data: Department-wise request vs issued
  const deptDataMap = {};

  mrns.forEach((m) => {
    const dept = m.department || 'Other';
    if (!deptDataMap[dept]) {
      deptDataMap[dept] = { department: dept, requested: 0, issued: 0, count: 0 };
    }
    deptDataMap[dept].count += 1;
    (m.items || []).forEach((it) => {
      deptDataMap[dept].requested += it.requestQty || 0;
      deptDataMap[dept].issued += it.issueQty || 0;
    });
  });

  const deptChartData = Object.values(deptDataMap).slice(0, 10);

  // Status breakdown data for Pie Chart
  const statusCounts = {
    'Pending Supervisor': mrns.filter((m) => m.status === 'PENDING_SUPERVISOR').length,
    'Pending Mr. Niranjan': mrns.filter((m) => m.supervisorApproval?.approved && !m.niranjanApproval?.approved && m.status !== 'ISSUED').length,
    'Pending Mr. Vinod': mrns.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length,
    'Ready for Stores': mrns.filter((m) => m.status === 'APPROVED' && !m.storesIssue?.issued).length,
    'Fully Issued': mrns.filter((m) => m.status === 'ISSUED').length,
  };

  const pieData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Excel Export */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Department-wise MRN Analytics & Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time tracking of material requisitions, department consumption, approvals, and Stores issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          {/* Excel Export Button */}
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel (.XLSX)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase">Total MRNs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{mrns.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Generated across plant</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-amber-500 block uppercase">Pending Management</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {mrns.filter((m) => m.supervisorApproval?.approved && !m.vinodApproval?.approved && m.status !== 'ISSUED').length}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-1">Mr. Niranjan / Mr. Vinod review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-blue-500 block uppercase">Ready to Issue</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {mrns.filter((m) => (m.status === 'APPROVED' || m.supervisorApproval?.approved) && !m.storesIssue?.issued).length}
          </span>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 block mt-1">Waiting at Stores</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-xs font-semibold text-emerald-500 block uppercase">Issued by Stores</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {mrns.filter((m) => m.status === 'ISSUED').length}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mt-1">Completed & locked</span>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="requested" name="Requested Qty" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="issued" name="Issued Qty" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                <div className="text-xs text-slate-400">No data available for chart</div>
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
              Department Summary Table
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
                {Object.values(deptDataMap).map((row, idx) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
