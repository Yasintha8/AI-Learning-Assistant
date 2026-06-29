import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  User,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Documents', path: '/documents', icon: FileText },
    { label: 'Flashcards', path: '/flashcards', icon: BrainCircuit },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-65 bg-white border-r border-border-light flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-border-light shrink-0">
          <Link
            to="/dashboard"
            onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
            className="flex items-center gap-2.5"
          >
            <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg text-text-heading tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text">
              AI Learning Assistant
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-text-body hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 select-none group ${isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-text-body hover:bg-slate-50 hover:text-text-heading'
                  }`}
              >
                {/* Active Left indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-body'
                  }`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / CTA & LogOut */}
        <div className="p-4 border-t border-border-light mt-auto shrink-0">
          {/* Upgrade Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-border-medium rounded-2xl relative overflow-hidden group select-none">
            {/* Background Gradient Blob */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all duration-300" />

            <h4 className="text-xs font-bold text-text-heading flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              Upgrade to Pro
            </h4>
            <p className="text-[11px] text-text-body mt-1 leading-relaxed">
              Upload unlimited PDFs and unlock custom study plans.
            </p>
            <button className="w-full mt-3 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold transition-all duration-300 shadow-md shadow-primary-shadow/15 hover:shadow-primary-shadow/25 active:scale-[0.98] cursor-pointer">
              Explore Plans
            </button>
          </div>

          {/* Log Out button in sidebar */}
          <button
            onClick={logout}
            className="w-full mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-error hover:bg-error-bg/60 transition-colors cursor-pointer text-left select-none"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;