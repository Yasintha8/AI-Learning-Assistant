import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import progressService from '../../services/progressService';
import learningPathService from '../../services/learningPathService';
import documentService from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import toast from '../../utils/toast';
import {
  FileText, BookOpen, BrainCircuit, Flame, Clock, ArrowRight, Target,
  Award, AlertTriangle, ChevronRight, User as UserIcon, Upload, Sparkles,
  BarChart2, Compass, CheckCircle2, TrendingUp, Zap, HelpCircle, Layers
} from 'lucide-react';

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getLearnerRank = (mastery, streak) => {
  if (mastery >= 85) return { title: 'Master Scholar', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  if (mastery >= 65) return { title: 'Advanced Learner', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
  if (mastery >= 40) return { title: 'Consistent Scholar', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
  if (streak > 0) return { title: 'Active Student', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  return { title: 'Getting Started', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        setDashboardData(data.data);
      } catch (error) {
        toast.error('Failed to fetch dashboard data.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!user) return;
      try {
        setDocumentsLoading(true);
        const [docsRes, pathsRes] = await Promise.allSettled([
          documentService.getDocuments(),
          learningPathService.getAllLearningPaths(user.id || user._id)
        ]);

        const rawDocs = docsRes.status === 'fulfilled' ? (docsRes.value || []) : [];
        const learningPaths = pathsRes.status === 'fulfilled' ? (pathsRes.value?.data || []) : [];

        const pathProgressMap = new Map();
        learningPaths.forEach(path => {
          const dId = path.documentId?._id || path.documentId;
          if (dId) {
            const topics = path.topics || [];
            const prog = topics.length > 0
              ? Math.round(topics.reduce((sum, t) => sum + (t.masteryScore || 0), 0) / topics.length)
              : 0;
            pathProgressMap.set(dId.toString(), prog);
          }
        });

        const docsWithProgress = rawDocs.map(doc => {
          const prog = pathProgressMap.get(doc._id?.toString()) || 0;
          return {
            ...doc,
            overallProgress: prog
          };
        });

        // Sort by most recent date (newest first)
        docsWithProgress.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));

        setUserDocuments(docsWithProgress);
      } catch (error) {
        console.error('Error fetching documents for dashboard:', error);
      } finally {
        setDocumentsLoading(false);
      }
    };
    fetchUserDocuments();
  }, [user]);

  const hasData = !loading && !!(dashboardData && dashboardData.overview);

  const overview = hasData ? dashboardData.overview : null;
  const recentActivity = hasData ? dashboardData.recentActivity : null;
  const weeklyActivity = hasData ? (dashboardData.weeklyActivity || []) : [];
  const focusAreas = hasData ? (dashboardData.focusAreas || []) : [];

  const stats = hasData ? [
    {
      label: 'Documents',
      value: overview.totalDocuments ?? 0,
      subtext: `${userDocuments.length} active documents`,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      badge: 'Files'
    },
    {
      label: 'Flashcards',
      value: overview.totalFlashcards ?? 0,
      subtext: `${overview.reviewedFlashcards ?? 0} reviewed`,
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      badge: `${overview.totalFlashcards > 0 ? Math.round(((overview.reviewedFlashcards || 0) / overview.totalFlashcards) * 100) : 0}% Done`
    },
    {
      label: 'Average Score',
      value: `${overview.averageScore ?? 0}%`,
      subtext: `${overview.completedQuizzes ?? 0}/${overview.totalQuizzes ?? 0} quizzes done`,
      icon: BrainCircuit,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      badge: 'Quizzes'
    },
    {
      label: 'Study Streak',
      value: `${overview.studyStreak ?? 0}d`,
      subtext: overview.studyStreak > 0 ? '🔥 Keep it up!' : 'Study today to start',
      icon: Flame,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      badge: 'Streak'
    },
  ] : [];

  const rawActivities = recentActivity
    ? [
      ...(recentActivity.documents || []).map(doc => ({
        id: doc._id,
        description: doc.title,
        timestamp: doc.lastAccessed,
        link: `/documents/${doc._id}`,
        type: 'document'
      })),
      ...(recentActivity.quizzes || []).map(quiz => ({
        id: quiz._id,
        description: quiz.title,
        score: quiz.score,
        timestamp: quiz.completedAt || quiz.createdAt,
        link: quiz.completedAt ? `/quizzes/${quiz._id}/results` : `/quizzes/${quiz._id}`,
        type: 'quiz'
      }))
    ].filter(a => a.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const filteredActivities = rawActivities.filter(activity => {
    if (activityFilter === 'documents') return activity.type === 'document';
    if (activityFilter === 'quizzes') return activity.type === 'quiz';
    return true;
  });

  const maxActivityCount = Math.max(1, ...weeklyActivity.map(d => d.count));
  const activeDaysCount = weeklyActivity.filter(d => d.count > 0).length;
  const totalWeeklyCount = weeklyActivity.reduce((sum, d) => sum + d.count, 0);

  const learnerRank = hasData ? getLearnerRank(overview.overallMastery || 0, overview.studyStreak || 0) : null;

  const quickLinks = [
    { label: 'My Documents', subtext: 'Upload & view learning paths', to: '/documents', icon: FileText, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Flashcards', subtext: 'Review & memorize concepts', to: '/flashcards', icon: BookOpen, bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { label: 'AI Career Roadmap', subtext: 'Explore skills & target jobs', to: '/career', icon: Compass, bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'My Profile', subtext: 'Account settings & history', to: '/profile', icon: UserIcon, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  ];

  return (
    <div className="min-h-screen bg-bg-main pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-8">

        {/* Hero Header & Quick Actions */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{getTimeGreeting()}</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-heading tracking-tight">
                Welcome back, <span className="text-primary">{user?.username || 'Learner'}</span> 👋
              </h1>

              <p className="text-text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
                Here is your AI-powered learning summary and progress snapshot for today.
              </p>

              <div className="inline-flex items-center gap-2 pt-1 text-xs text-text-muted bg-bg-card/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-border-light">
                <span className="font-semibold text-primary">💡 Daily AI Insight:</span>
                <span>Active recall with flashcards after reading increases long-term retention by over 50%.</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all duration-200 shadow-md shadow-primary/20 active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </Link>
              <Link
                to="/flashcards"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-border-medium text-text-heading text-sm font-semibold hover:bg-border-light/60 transition-all duration-200 active:scale-98"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Study Cards</span>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Spinner label="Loading your personal dashboard..." />
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md p-8 bg-bg-card rounded-2xl border border-border-light shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                <Target className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-heading">No Learning Data Available</h3>
                <p className="text-text-muted text-sm mt-1">Upload a document to automatically generate flashcards, quizzes, and learning paths!</p>
              </div>
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Your First Document</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-bg-card border border-border-light hover:border-primary/30 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        {stat.label}
                      </span>
                      <div className="text-3xl font-extrabold text-text-heading tracking-tight mt-1.5 tabular-nums">
                        {stat.value}
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.shadow} group-hover:scale-105 transition-transform duration-200`}>
                      <stat.icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between">
                    <p className="text-xs text-text-muted truncate">{stat.subtext}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-border-light text-text-heading shrink-0">
                      {stat.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Main Content Column (Left - 2 Cols) */}
              <div className="lg:col-span-2 space-y-8">

                {/* Weekly Activity Visualizer Chart */}
                <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <h3 className="text-base font-bold text-text-heading">Weekly Activity</h3>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Active {activeDaysCount} of the last 7 days · <span className="font-semibold text-text-heading">{totalWeeklyCount} total actions</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted bg-border-light/50 px-3 py-1.5 rounded-lg border border-border-light self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Last 7 Days</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2 sm:gap-4 h-36 pt-4 px-2">
                    {weeklyActivity.map((day, index) => {
                      const isToday = index === weeklyActivity.length - 1;
                      const pct = Math.max(Math.round((day.count / maxActivityCount) * 100), 6);

                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-10 px-2.5 py-1 rounded-lg bg-text-heading text-bg-card text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-20 shadow-md transform group-hover:-translate-y-1">
                            {day.count} {day.count === 1 ? 'action' : 'actions'} ({day.date})
                          </div>

                          {/* Bar */}
                          <div className="w-full h-28 flex items-end justify-center rounded-lg bg-border-light/30 p-1">
                            <div
                              className={`w-full max-w-[36px] rounded-md transition-all duration-300 ${isToday
                                  ? 'bg-gradient-to-t from-primary to-primary-hover shadow-sm shadow-primary/30'
                                  : day.count > 0
                                    ? 'bg-primary/40 group-hover:bg-primary/70'
                                    : 'bg-border-medium/40'
                                }`}
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* My Documents & Learning Progress Section */}
                <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-border-light bg-border-light/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-heading">
                          My Documents & Progress
                        </h3>
                        <p className="text-xs text-text-muted">
                          Your uploaded files and overall concept mastery progress
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/documents"
                      className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      <span>View All ({userDocuments.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner label="Loading documents..." />
                    </div>
                  ) : userDocuments.length > 0 ? (
                    <div className="divide-y divide-border-light">
                      {userDocuments.slice(0, 5).map((doc) => {
                        const progress = doc.overallProgress || 0;

                        return (
                          <div
                            key={doc._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/30 transition-colors duration-150 group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="p-3 bg-primary/10 rounded-xl shrink-0 text-primary group-hover:scale-105 transition-transform">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/documents/${doc._id}`}
                                    className="text-sm font-bold text-text-heading group-hover:text-primary transition-colors truncate"
                                  >
                                    {doc.title}
                                  </Link>
                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-border-light text-text-muted shrink-0">
                                    {doc.fileType || 'PDF'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex-1 bg-border-light h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-primary' : 'bg-amber-500'
                                        }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-text-heading tabular-nums shrink-0">
                                    {progress}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              <Link
                                to={`/documents/${doc._id}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-medium text-text-heading hover:bg-primary hover:text-white hover:border-primary transition-all duration-150"
                              >
                                <span>Study</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-border-light flex items-center justify-center">
                        <FileText className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-heading">No documents uploaded yet</p>
                        <p className="text-xs text-text-muted mt-1 max-w-sm">Upload your PDF or notes to generate interactive study material and learning paths.</p>
                      </div>
                      <Link
                        to="/documents"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Document</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent Activity Timeline Feed */}
                <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-border-light bg-border-light/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Clock className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-heading">
                          Recent Activity
                        </h3>
                        <p className="text-xs text-text-muted">
                          Your recent document accesses and quiz attempts
                        </p>
                      </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 bg-border-light p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                      {['all', 'documents', 'quizzes'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActivityFilter(tab)}
                          className={`px-3 py-1 rounded-lg capitalize transition-colors ${activityFilter === tab
                              ? 'bg-bg-card text-primary shadow-xs'
                              : 'text-text-muted hover:text-text-heading'
                            }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredActivities.length > 0 ? (
                    <div className="divide-y divide-border-light">
                      {filteredActivities.slice(0, 6).map((activity, index) => (
                        <div
                          key={activity.id || index}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/30 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activity.type === 'document'
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                              {activity.type === 'document' ? <FileText className="w-4.5 h-4.5" /> : <BrainCircuit className="w-4.5 h-4.5" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-text-heading truncate">
                                  {activity.description}
                                </p>
                                {activity.score !== undefined && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    {activity.score}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                                <span className="capitalize">{activity.type}</span>
                                <span>·</span>
                                <span>{formatRelativeTime(activity.timestamp)}</span>
                              </p>
                            </div>
                          </div>

                          {activity.link && (
                            <Link
                              to={activity.link}
                              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-2">
                      <Clock className="w-8 h-8 text-text-muted" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-text-heading">No activity found for this filter.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar Column (Right - 1 Col) */}
              <div className="space-y-8">

                {/* Overall Mastery & Rank Widget */}
                <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Award className="w-4.5 h-4.5" strokeWidth={2} />
                      </div>
                      <h3 className="text-base font-bold text-text-heading">Overall Mastery</h3>
                    </div>
                    {learnerRank && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${learnerRank.color}`}>
                        {learnerRank.title}
                      </span>
                    )}
                  </div>

                  {overview.overallMastery !== null && overview.overallMastery !== undefined ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-4xl font-extrabold text-text-heading tracking-tight tabular-nums">
                          {overview.overallMastery}%
                        </span>
                        <span className="text-xs font-semibold text-text-muted">
                          {overview.topicsTracked} topics tracked
                        </span>
                      </div>

                      {/* Visual mastery bar */}
                      <div className="w-full h-3 rounded-full bg-border-light overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                          style={{ width: `${overview.overallMastery}%` }}
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-border-light/40 border border-border-light text-xs text-text-muted leading-relaxed">
                        Mastery is calculated across all topics in your generated learning paths.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <HelpCircle className="w-8 h-8 text-text-muted mx-auto" />
                      <p className="text-xs text-text-muted">
                        Generate learning paths from documents to calculate your concept mastery rank.
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Focus Areas (Weak Concepts) */}
                <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-border-light bg-amber-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-4.5 h-4.5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-heading">AI Focus Areas</h3>
                        <p className="text-xs text-text-muted">Concepts recommended for review</p>
                      </div>
                    </div>
                  </div>

                  {focusAreas.length > 0 ? (
                    <div className="divide-y divide-border-light">
                      {focusAreas.map((area, index) => (
                        <div key={`${area.concept}-${index}`} className="p-4 hover:bg-border-light/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-text-heading leading-tight">{area.concept}</p>
                            {area.missedCount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                Missed {area.missedCount}×
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-text-muted mt-1 truncate">
                            From: {area.documentTitle || 'Uploaded document'}
                          </p>

                          {area.documentId && (
                            <div className="mt-3">
                              <Link
                                to={`/documents/${area.documentId}/learning-path`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                              >
                                <span>Review Topic</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-sm font-bold text-text-heading">No Weak Concepts Identified</p>
                      <p className="text-xs text-text-muted">Great job! Complete more quizzes to surface topics that need review.</p>
                    </div>
                  )}
                </div>

                {/* Quick Toolkit Navigation */}
                <div className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted px-2 py-1">
                    Quick Navigation
                  </h4>

                  {quickLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-border-light/50 transition-all duration-150 group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <link.icon className={`w-5 h-5 ${link.text}`} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-heading group-hover:text-primary transition-colors">{link.label}</p>
                        <p className="text-xs text-text-muted truncate">{link.subtext}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
