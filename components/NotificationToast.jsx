'use client';

import React from 'react';
import { Bell, X, ChevronRight, Clock, PackageCheck, AlertCircle } from 'lucide-react';

export default function NotificationToast({ toasts, onDismiss, onSelectMRN }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 transition-all animate-in slide-in-from-top-3 fade-in duration-200 hover:shadow-sky-500/10"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              if (toast.mrn) onSelectMRN(toast.mrn);
              onDismiss(toast.id);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                {toast.title || 'New Notification'}
              </span>
              <span className="text-[9px] text-slate-400">Just now</span>
            </div>

            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
              {toast.mrn?.mrnNo}
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
              {toast.message}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1.5 hover:underline">
              <span>View details</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
