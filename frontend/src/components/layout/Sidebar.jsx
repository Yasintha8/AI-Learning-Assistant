import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  User,
  X
} from 'lucide-react';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
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

      {/* Sidebar Container — intentionally always dark, independent of the light/dark theme
          toggle: a fixed dark nav rail is easier on the eyes against a bright light-mode
          content area and reads as a more standard app shell (Notion/Linear/Vercel-style). */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-65 bg-[#1a1d2e] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/5 shrink-0">
          <Link
            to="/dashboard"
            onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
            className="flex items-center gap-2.5"
          >
            <div className="p-2 bg-primary/20 rounded-xl text-primary-hover flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight bg-linear-to-r from-primary to-primary-hover bg-clip-text">
              NeuroLearn
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
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
                  ? 'bg-primary/15 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
              >
                {/* Active Left indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-primary-hover' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;