import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalShortcutsModal from '../common/GlobalShortcutsModal';

const SIDEBAR_COLLAPSED_KEY = 'learnmate_sidebar_collapsed';

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  };

  // Keyboard shortcuts (Ctrl+B / Cmd+B for sidebar, ? or Shift+/ for shortcuts modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className='flex h-screen bg-bg-main text-text-body transition-colors duration-300'>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          toggleSidebar={toggleSidebar}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
        <main className='flex-1 overflow-hidden overflow-y-auto p-6'>
          {children}
        </main>
      </div>

      {/* Global Keyboard Shortcuts Modal */}
      <GlobalShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default AppLayout;