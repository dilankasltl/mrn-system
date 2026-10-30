'use client';

import React, { useState, useEffect } from 'react';
import { CurrentUser } from '@/types';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Warehouse,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onLoginSuccess: (user: CurrentUser) => void;
  onLogout: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'change_password'>('login');

  // Login form state
  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Change Password form state
  const [changeUsername, setChangeUsername] = useState(currentUser.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Available user accounts for quick selection
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoginError('');
      setLoginSuccess('');
      setChangeError('');
      setChangeSuccess('');
      if (currentUser.username) {
        setUsername(currentUser.username);
        setChangeUsername(currentUser.username);
      }

      // Fetch accounts list
      fetch('/api/auth/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.users) {
            setAccounts(data.users);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

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
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      setLoginSuccess(`Welcome back, ${data.user.name}!`);
      const loggedUser: CurrentUser = {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
        department: data.user.department,
        isAuthenticated: true,
      };

      // Persist in localStorage
      localStorage.setItem('sundaram_mrn_user', JSON.stringify(loggedUser));

      setTimeout(() => {
        onLoginSuccess(loggedUser);
        onClose();
      }, 700);
    } catch (err: any) {
      setLoginError(err.message || 'Error logging in');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!changeUsername.trim()) {
      setChangeError('Please enter the username.');
      return;
    }

    if (!currentPassword.trim()) {
      setChangeError('Please enter your current password.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setChangeError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match. Please verify.');
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

      setChangeSuccess('Password changed successfully! You can now use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setChangeError(err.message || 'Error occurred');
    } finally {
      setChangeLoading(false);
    }
  };

  // Quick preset selector click
  const selectQuickAccount = (acc: any) => {
    setUsername(acc.username);
    setChangeUsername(acc.username);
    setPassword('');
    setLoginError('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-lg shadow-sky-500/20 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Sundaram Lanka Tyres LTD.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Approver, Stores & Administrator Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('change_password')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'change_password'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Change Password
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <div>
            {/* Quick account presets */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Quick Select Role / Account
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => selectQuickAccount({ username: 'niranjan' })}
                  className={`p-2 rounded-xl border text-xs text-left transition flex items-center gap-2 ${
                    username === 'niranjan'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate">Mr. Niranjan</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectQuickAccount({ username: 'vinod' })}
                  className={`p-2 rounded-xl border text-xs text-left transition flex items-center gap-2 ${
                    username === 'vinod'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span className="truncate">Mr. Vinod</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectQuickAccount({ username: 'stores' })}
                  className={`p-2 rounded-xl border text-xs text-left transition flex items-center gap-2 ${
                    username === 'stores'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">Stores</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectQuickAccount({ username: 'admin' })}
                  className={`p-2 rounded-xl border text-xs text-left transition flex items-center gap-2 ${
                    username === 'admin'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                  <span className="truncate">Admin</span>
                </button>
              </div>

              {/* Supervisor quick select dropdown */}
              <div className="mt-2">
                <select
                  value={accounts.some((a) => a.username === username && a.role === 'supervisor') ? username : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectQuickAccount({ username: e.target.value });
                    }
                  }}
                  className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Or Select Department Supervisor...</option>
                  {accounts
                    .filter((a) => a.role === 'supervisor')
                    .map((a) => (
                      <option key={a.username} value={a.username}>
                        {a.name} ({a.department})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Error or Success notification */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="font-semibold">{loginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. niranjan, vinod, stores, admin, dilanka"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Default: &lt;Name&gt;@123
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (e.g. Niranjan@123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Departments do not require password</span>
                </div>

                {currentUser.isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Logout Current
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Sign In Securely
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: CHANGE PASSWORD */}
        {activeTab === 'change_password' && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Any authorized user can update their password at any time.
            </p>

            {changeError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="font-semibold">{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. niranjan, vinod, stores, admin, dilanka"
                  value={changeUsername}
                  onChange={(e) => setChangeUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showChangePass ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type={showChangePass ? 'text' : 'password'}
                    required
                    placeholder="New password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showChangePass ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowChangePass(!showChangePass)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showChangePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showChangePass ? 'Hide' : 'Show'} Passwords</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Save New Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
