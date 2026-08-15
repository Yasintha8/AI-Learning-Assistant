import { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, LogOut, Sparkles, Sun, Moon, FileText, Layers, HelpCircle, Loader2, X, BrainCircuit } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";
import searchService from '../../services/searchService';
import notificationService from '../../services/notificationService';

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

const NOTIFICATION_ICONS = {
    streak_risk: { icon: Sparkles, className: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    quiz_due: { icon: BrainCircuit, className: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
    flashcards_due: { icon: Layers, className: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' },
};

const Header = ({ toggleSidebar }) => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ documents: [], flashcards: [], quizzes: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const notificationsRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Live to-do items fetch
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getNotifications();
                setNotifications(data.notifications || []);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };
        fetchNotifications();
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Debounced global search
    useEffect(() => {
        const query = searchQuery.trim();

        if (query.length < MIN_QUERY_LENGTH) {
            setSearchResults({ documents: [], flashcards: [], quizzes: [] });
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchService.globalSearch(query);
                setSearchResults(results || { documents: [], flashcards: [], quizzes: [] });
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleNotificationClick = (notification) => {
        setIsNotificationsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleSearchResultClick = (path) => {
        setShowSearchResults(false);
        setSearchQuery('');
        navigate(path);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowSearchResults(false);
            searchInputRef.current?.blur();
        }
    };

    const trimmedQuery = searchQuery.trim();
    const hasSearchResults = searchResults.documents.length > 0
        || searchResults.flashcards.length > 0
        || searchResults.quizzes.length > 0;

    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-bg-card/80 backdrop-blur-md border-b border-border-light flex items-center justify-between px-6 select-none">
            {/* Left Section: Sidebar Toggle & Search */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 rounded-xl text-text-body hover:bg-border-light lg:hidden transition-colors cursor-pointer"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search Bar */}
                <div className="relative w-full max-w-md hidden md:block" ref={searchContainerRef}>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSearchResults(true);
                        }}
                        onFocus={() => {
                            if (trimmedQuery.length >= MIN_QUERY_LENGTH) setShowSearchResults(true);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search documents, flashcards, or quizzes..."
                        className="w-full bg-bg-main hover:bg-border-light/60 focus:bg-bg-card text-sm text-text-heading border border-transparent focus:border-primary-hover/20 rounded-2xl pl-10 pr-12 py-2 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:shadow-md focus:shadow-primary-shadow/5"
                    />
                    {searchQuery ? (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearchResults(false);
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body p-0.5 rounded cursor-pointer"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-border-light text-[10px] font-semibold text-text-muted rounded border border-border-medium/40">
                            <span>⌘</span><span>K</span>
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {showSearchResults && trimmedQuery.length >= MIN_QUERY_LENGTH && (
                        <div className="absolute left-0 right-0 mt-2 bg-bg-card border border-border-medium rounded-2xl shadow-xl shadow-slate-200/25 dark:shadow-none py-2 z-50 animate-fade-in max-h-96 overflow-y-auto">
                            {isSearching ? (
                                <div className="py-8 flex items-center justify-center gap-2 text-text-muted text-xs">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : hasSearchResults ? (
                                <>
                                    {searchResults.documents.length > 0 && (
                                        <div className="px-2 pb-1">
                                            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Documents</p>
                                            {searchResults.documents.map((doc) => (
                                                <button
                                                    key={doc._id}
                                                    onClick={() => handleSearchResultClick(`/documents/${doc._id}`)}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-border-light/40 transition-colors cursor-pointer"
                                                >
                                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                                    <span className="text-xs text-text-heading font-medium truncate">{doc.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchResults.flashcards.length > 0 && (
                                        <div className="px-2 pb-1">
                                            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Flashcards</p>
                                            {searchResults.flashcards.map((set) => (
                                                <button
                                                    key={set.id}
                                                    onClick={() => handleSearchResultClick(`/documents/${set.documentId}/flashcards`)}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-border-light/40 transition-colors cursor-pointer"
                                                >
                                                    <Layers className="w-4 h-4 text-primary shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-text-heading font-medium truncate">{set.question || set.documentTitle}</p>
                                                        <p className="text-[10px] text-text-muted truncate">{set.documentTitle}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchResults.quizzes.length > 0 && (
                                        <div className="px-2 pb-1">
                                            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Quizzes</p>
                                            {searchResults.quizzes.map((quiz) => (
                                                <button
                                                    key={quiz._id}
                                                    onClick={() => handleSearchResultClick(
                                                        quiz.completedAt
                                                            ? `/quizzes/${quiz._id}/results`
                                                            : `/quizzes/${quiz._id}`
                                                    )}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-border-light/40 transition-colors cursor-pointer"
                                                >
                                                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                                                    <span className="text-xs text-text-heading font-medium truncate">{quiz.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-8 text-center text-text-muted text-xs">
                                    No results found for "{trimmedQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section: Theme Toggle, Notifications & Direct Logout Button */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl text-text-body transition-all duration-300 hover:bg-border-light cursor-pointer"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-amber-400 animate-fade-in" />
                    ) : (
                        <Moon className="w-5 h-5 text-text-body animate-fade-in" />
                    )}
                </button>

                {/* Notification Dropdown */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={`relative p-2.5 rounded-xl text-text-body transition-all duration-300 hover:bg-border-light cursor-pointer ${isNotificationsOpen ? 'bg-border-light' : ''
                            }`}
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-bg-card border border-border-medium rounded-2xl shadow-xl shadow-slate-200/25 dark:shadow-none py-2 z-50 animate-fade-in origin-top-right transition-all">
                            <div className="px-4 py-2 border-b border-border-light">
                                <h3 className="font-semibold text-text-heading text-sm">To Do</h3>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => {
                                        const { icon: Icon, className } = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.quiz_due;
                                        return (
                                            <button
                                                key={n.id}
                                                type="button"
                                                onClick={() => handleNotificationClick(n)}
                                                className="w-full px-4 py-3 flex gap-3 text-left hover:bg-border-light/40 transition-colors border-b border-border-light last:border-0 cursor-pointer"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
                                                    <Icon className="w-4 h-4" strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-text-heading truncate">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[11px] text-text-body mt-0.5 line-clamp-2">
                                                        {n.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center text-text-muted text-xs">
                                        You're all caught up.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Direct Logout Button */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer shadow-xs ml-1"
                    title="Log Out"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>

            </div>
        </header>
    );
};

export default Header;