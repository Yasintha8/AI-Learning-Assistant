import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatarUtils';
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  Compass,
  Map,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

const Sidebar = ({ isSidebarOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
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

  const [sidebarImgError, setSidebarImgError] = useState(false);

  useEffect(() => {
    setSidebarImgError(false);
  }, [user?.profileImage, user?.avatar]);

  const avatarUrl = !sidebarImgError ? getAvatarUrl(user) : null;
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
        className={`fixed inset-y-0 left-0 z-50 bg-[#1a1d2e] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out shrink-0 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div
          className={`flex items-center h-16 border-b border-white/5 shrink-0 transition-all duration-300 ${
            isCollapsed ? 'px-3 justify-center' : 'px-5 justify-between'
          }`}
        >
          {isCollapsed ? (
            /* Collapsed view on desktop: Icon only centered */
            <div className="flex items-center justify-center w-full">
              <Link
                to="/dashboard"
                onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                className="p-2 bg-primary/20 hover:bg-primary/30 rounded-xl text-primary-hover flex items-center justify-center shadow-sm transition-all duration-200 group"
                title="LearnMate AI (Dashboard)"
                aria-label="LearnMate AI Dashboard"
              >
                <BrainCircuit className="w-5 h-5 group-hover:scale-105 transition-transform" />
              </Link>
            </div>
          ) : (
            /* Expanded view */
            <>
              <Link
                to="/dashboard"
                onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="p-2 bg-primary/20 rounded-xl text-primary-hover flex items-center justify-center shadow-sm shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-xl text-white tracking-tight bg-linear-to-r from-primary to-primary-hover bg-clip-text truncate">
                  LearnMate AI
                </span>
              </Link>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Section Area */}
        <nav
          className={`flex-1 py-5 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'} space-y-5 custom-scrollbar transition-all duration-300 ${
            isCollapsed ? 'px-2.5' : 'px-4'
          }`}
        >
          {/* MAIN Section */}
          <div className="space-y-1.5">
            {isCollapsed ? (
              <div className="h-1" />
            ) : (
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                MAIN
              </div>
            )}
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
                  className={`relative flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 select-none group ${
                    isCollapsed
                      ? 'justify-center p-3'
                      : 'gap-3 px-3.5 py-3'
                  } ${
                    isActive
                      ? 'bg-primary/15 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-primary-hover' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating Tooltip when Collapsed on Desktop */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 border border-white/10 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 backdrop-blur-md animate-fade-in">
                      <span>{item.label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider Line */}
          <div className="border-t border-white/5 pt-1" />

          {/* TOOLS Section */}
          <div className="space-y-1.5">
            {isCollapsed ? (
              <div className="h-1" />
            ) : (
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                TOOLS
              </div>
            )}
            {toolsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
                  className={`relative flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 select-none group ${
                    isCollapsed
                      ? 'justify-center p-3'
                      : 'gap-3 px-3.5 py-3'
                  } ${
                    isActive
                      ? 'bg-primary/15 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-primary-hover' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating Tooltip when Collapsed on Desktop */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 border border-white/10 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 backdrop-blur-md animate-fade-in">
                      <span>{item.label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions: Collapse Toggle + User Profile */}
        <div
          className={`border-t border-white/5 shrink-0 transition-all duration-300 relative ${
            isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'
          }`}
        >
          {/* Desktop Toggle Button at bottom */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 text-xs font-semibold transition-all duration-200 cursor-pointer relative group ${
              isCollapsed ? 'justify-center w-full p-2.5' : 'justify-between w-full px-3 py-2'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <>
                <PanelLeft className="w-4.5 h-4.5 text-slate-400 group-hover:text-white transition-colors" />
                <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 border border-white/10 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none items-center gap-2 backdrop-blur-md animate-fade-in">
                  <span>Expand Sidebar</span>
                  <kbd className="text-[10px] font-mono text-slate-400 bg-white/10 px-1 py-0.5 rounded">Ctrl+B</kbd>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Collapse</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  Ctrl+B
                </kbd>
              </>
            )}
          </button>

          {/* User Profile */}
          <Link
            to="/profile"
            onClick={() => { if (isSidebarOpen) toggleSidebar(); }}
            className={`flex items-center rounded-xl transition-all duration-200 group relative ${
              isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 p-2'
            } ${
              isProfileActive
                ? 'bg-primary/20 border border-primary/30 text-white'
                : 'hover:bg-white/5 text-slate-300'
            }`}
          >
            {/* User Profile Tooltip when Collapsed on Desktop */}
            {isCollapsed && (
              <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 border border-white/10 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 backdrop-blur-md animate-fade-in">
                <span>{user?.name || user?.username || 'My Profile'}</span>
              </div>
            )}
            {/* User Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || user?.username || 'User Avatar'}
                onError={() => setSidebarImgError(true)}
                className="w-8 h-8 rounded-lg object-cover border border-white/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-[11px] shadow-xs shrink-0 border border-white/10">
                {getUserInitials(user?.name || user?.username)}
              </div>
            )}

            {/* User Name & Details */}
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate group-hover:text-primary-hover transition-colors leading-snug">
                    {user?.name || user?.username || 'User Profile'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                    {user?.email || 'View Profile'}
                  </div>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isProfileActive ? 'text-primary-hover translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
              </>
            )}
          </Link>

          {/* Version & Copyright */}
          {!isCollapsed && (
            <div className="pt-0.5 px-2 text-center select-none">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                © {new Date().getFullYear()} LearnMate AI
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;