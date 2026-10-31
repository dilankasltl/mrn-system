'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User,
  KeyRound,
  Warehouse,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Users,
  Search,
} from 'lucide-react';
import { SUPERVISORS_DATA } from './LandingPortal';

export default function LoginModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) {
  const [selectedRoleCategory, setSelectedRoleCategory] = useState(null);
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  const [showInlineChangePassword, setShowInlineChangePassword] = useState(false);
  const [changeUsername, setChangeUsername] = useState(currentUser.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoginError('');
      setLoginSuccess('');
      setChangeError('');
      setChangeSuccess('');
      setShowInlineChangePassword(false);
      if (currentUser.username) {
        setUsername(currentUser.username);
        setChangeUsername(currentUser.username);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const filteredSupervisors = SUPERVISORS_DATA.filter((s) =>
    s.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    s.department.toLowerCase().includes(supervisorSearch.toLowerCase())
  );

  const handleSelectRoleCategory = (cat) => {
    setSelectedRoleCategory(cat);
    setLoginError('');

    if (cat === 'supervisors') {
      if (selectedSupervisor) {
        setUsername(selectedSupervisor.username);
        setChangeUsername(selectedSupervisor.username);
      } else {
        setUsername('');
      }
    } else if (cat === 'niranjan') {
      setSelectedSupervisor(null);
      setUsername('niranjan');
      setChangeUsername('niranjan');
      setPassword('');
      passwordInputRef.current?.focus();
    } else if (cat === 'vinod') {
      setSelectedSupervisor(null);
      setUsername('vinod');
      setChangeUsername('vinod');
      setPassword('');
      passwordInputRef.current?.focus();
    } else if (cat === 'stores') {
      setSelectedSupervisor(null);
      setUsername('stores');
      setChangeUsername('stores');
      setPassword('');
      passwordInputRef.current?.focus();
    }
  };

  const handleSelectSupervisor = (sup) => {
    setSelectedSupervisor(sup);
    setUsername(sup.username);
    setChangeUsername(sup.username);
    setPassword('');
    setLoginError('');
    passwordInputRef.current?.focus();
  };

  const handleLoginSubmit = async (e) => {
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
      const loggedUser = {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
        department: data.user.department,
        isAuthenticated: true,
      };

      localStorage.setItem('sundaram_mrn_user', JSON.stringify(loggedUser));

      setTimeout(() => {
        onLoginSuccess(loggedUser);
        onClose();
      }, 700);
    } catch (err) {
      setLoginError(err.message || 'Error logging in');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    const targetUser = changeUsername.trim() || username.trim();
    if (!targetUser) {
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
          username: targetUser,
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
      setTimeout(() => {
        setShowInlineChangePassword(false);
        setChangeSuccess('');
      }, 2000);
    } catch (err) {
      setChangeError(err.message || 'Error occurred');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-lg shadow-sky-500/20 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Sundaram Lanka Tyres LTD.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Office Sign In Portal
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button type="button" onClick={() => handleSelectRoleCategory('supervisors')} className={`p-2.5 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 ${selectedRoleCategory === 'supervisors' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="block truncate font-semibold">Supervisors</span>
            </button>
            <button type="button" onClick={() => handleSelectRoleCategory('niranjan')} className={`p-2.5 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 ${selectedRoleCategory === 'niranjan' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="block truncate font-semibold">Mr. Niranjan</span>
            </button>
            <button type="button" onClick={() => handleSelectRoleCategory('vinod')} className={`p-2.5 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 ${selectedRoleCategory === 'vinod' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="block truncate font-semibold">Mr. Vinod</span>
            </button>
            <button type="button" onClick={() => handleSelectRoleCategory('stores')} className={`p-2.5 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 ${selectedRoleCategory === 'stores' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="block truncate font-semibold">Stores</span>
            </button>
          </div>
        </div>

        {selectedRoleCategory === 'supervisors' && (
          <div className="mb-4 p-3 bg-amber-50/60 dark:bg-slate-800/80 rounded-2xl border border-amber-300 dark:border-amber-500/40 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-200 dark:border-slate-700">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Select Your Name & Department
              </span>
            </div>
            <div className="relative mb-2">
              <input type="text" placeholder="Search supervisor or department..." value={supervisorSearch} onChange={(e) => setSupervisorSearch(e.target.value)} className="w-full text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none" />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {filteredSupervisors.map((s) => {
                const isSelected = selectedSupervisor?.username === s.username;
                return (
                  <button key={s.username} type="button" onClick={() => handleSelectSupervisor(s)} className={`p-1.5 px-2 rounded-xl border text-left transition flex items-center justify-between text-xs ${isSelected ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <div className="truncate pr-1">
                      <div className="font-semibold leading-tight">{s.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{s.department}</div>
                    </div>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selectedSupervisor && (
              <div className="mt-2 pt-1.5 border-t border-amber-200 dark:border-slate-700 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Selected: <strong>{selectedSupervisor.name}</strong></span>
                <span className="text-[10px] text-slate-500">Default: {selectedSupervisor.defaultPass}</span>
              </div>
            )}
          </div>
        )}

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> <span>{loginError}</span>
          </div>
        )}

        {loginSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> <span className="font-semibold">{loginSuccess}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input type="text" required placeholder="e.g. dilanka, niranjan, vinod, stores" value={username} onChange={(e) => { setUsername(e.target.value); setChangeUsername(e.target.value); }} className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <span className="text-[10px] text-slate-400">Default: Name@123</span>
            </div>
            <div className="relative">
              <input ref={passwordInputRef} type={showPassword ? 'text' : 'password'} required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loginLoading} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loginLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>) : (<><KeyRound className="w-4 h-4" /> Sign In</>)}
          </button>
        </form>

        <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-center">
          <button type="button" onClick={() => { setShowInlineChangePassword(!showInlineChangePassword); setChangeError(''); setChangeSuccess(''); if (username) setChangeUsername(username); }} className="text-xs text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-medium">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{showInlineChangePassword ? 'Close Change Password' : 'Change Password?'}</span>
          </button>
        </div>

        {showInlineChangePassword && (
          <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><KeyRound className="w-3.5 h-3.5 text-sky-500" /> Change Password</span>
              <button type="button" onClick={() => setShowInlineChangePassword(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-3.5 h-3.5" /></button>
            </div>
            {changeError && (<div className="mb-2.5 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[11px] rounded-xl flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" /><span>{changeError}</span></div>)}
            {changeSuccess && (<div className="mb-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[11px] rounded-xl flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" /><span>{changeSuccess}</span></div>)}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-2">
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">Username</label><input type="text" required placeholder="Username" value={changeUsername} onChange={(e) => setChangeUsername(e.target.value)} className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">Current Password</label><input type="password" required placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">New Password</label><input type="password" required placeholder="Min 4 chars" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none" /></div>
                <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">Confirm New</label><input type="password" required placeholder="Repeat" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none" /></div>
              </div>
              <button type="submit" disabled={changeLoading} className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1">
                {changeLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</>) : ('Update Password')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
