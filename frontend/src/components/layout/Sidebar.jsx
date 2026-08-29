import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/apiPaths';
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  Compass,
  Map,
  User as UserIcon,
  ChevronRight,
  X
} from 'lucide-react';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Documents', path: '/documents', icon: FileText },
    { label: 'Flashcards', path: '/flashcards', icon: BrainCircuit },
  ];

  const toolsNavItems = [
    { label: 'Learning Paths', path: '/learning-paths', icon: Map },
    { label: 'Career Path', path: '/career', icon: Compass },
  ];

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarUrl = (userObj) => {
    const img = userObj?.profileImage || userObj?.avatar;
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  const avatarUrl = getAvatarUrl(user);
  const isProfileActive = location.pathname.startsWith('/profile');

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
              LearnMate AI
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

        {/* Navigation Section Area */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* MAIN Section */}
          <div className="space-y-1.5">
            <div className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              MAIN
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 select-none group ${isActive
                      ? 'bg-primary/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-primary-hover' : 'text-slate-500 group-hover:text-slate-300'
                    }`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider Line */}
          <div className="border-t border-white/5 pt-1" />

          {/* TOOLS Section */}
          <div className="space-y-1.5">
            <div className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              TOOLS
            </div>
            {toolsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 select-none group ${isActive
                      ? 'bg-primary/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-primary-hover' : 'text-slate-500 group-hover:text-slate-300'
                    }`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

        </nav>

        {/* Bottom User Profile Section - Compact & Reduced */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <Link
            to="/profile"
            onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 group ${isProfileActive
                ? 'bg-primary/20 border border-primary/30 text-white'
                : 'hover:bg-white/5 text-slate-300'
              }`}
          >
            {/* User Avatar Circle or Profile Image */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || user?.username || 'User Avatar'}
                className="w-8 h-8 rounded-lg object-cover border border-white/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-[11px] shadow-xs shrink-0 border border-white/10">
                {getUserInitials(user?.name || user?.username)}
              </div>
            )}

            {/* User Name & Details */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-primary-hover transition-colors leading-snug">
                {user?.name || user?.username || 'User Profile'}
              </div>
              <div className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                {user?.email || 'View Profile'}
              </div>
            </div>

            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isProfileActive ? 'text-primary-hover translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
          </Link>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;