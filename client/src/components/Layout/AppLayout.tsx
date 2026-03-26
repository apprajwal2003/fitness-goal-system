import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/progress', label: 'Progress' },
  { to: '/squad', label: 'Squad' },
  { to: '/profile', label: 'Profile' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-display font-bold text-xl text-primary-600 hover:text-primary-700">
            FitFlow
          </Link>
          <nav className="flex items-center gap-1 flex-wrap">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === to
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 truncate max-w-[140px]">{user?.name ?? user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
