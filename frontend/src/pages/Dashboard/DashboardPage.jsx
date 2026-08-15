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
  Award, AlertTriangle, ChevronRight, User as UserIcon
} from 'lucide-react';

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardPage = () => {

  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);

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
      subtext: 'Uploaded so far',
      icon: FileText,
      gradient: 'from-blue-400 to-cyan-500',
    },
    {
      label: 'Flashcards',
      value: overview.totalFlashcards ?? 0,
      subtext: `${overview.reviewedFlashcards ?? 0} reviewed`,
      icon: BookOpen,
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Average Score',
      value: `${overview.averageScore ?? 0}%`,
      subtext: `${overview.completedQuizzes ?? 0}/${overview.totalQuizzes ?? 0} quizzes done`,
      icon: BrainCircuit,
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      label: 'Study Streak',
      value: `${overview.studyStreak ?? 0}d`,
      subtext: overview.studyStreak > 0 ? 'Keep the momentum going' : 'Study today to start one',
      icon: Flame,
      gradient: 'from-amber-400 to-orange-500',
    },
  ] : [];

  const activities = recentActivity
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
        timestamp: quiz.completedAt,
        link: quiz.completedAt ? `/quizzes/${quiz._id}/results` : `/quizzes/${quiz._id}`,
        type: 'quiz'
      }))
    ].filter(a => a.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const hasActivity = activities.length > 0;

  const maxActivityCount = Math.max(1, ...weeklyActivity.map(d => d.count));
  const activeDaysCount = weeklyActivity.filter(d => d.count > 0).length;

  const quickLinks = [
    { label: 'My Documents', subtext: 'Upload & manage files', to: '/documents', icon: FileText, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Flashcards', subtext: 'Review & memorize', to: '/flashcards', icon: BookOpen, bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { label: 'My Profile', subtext: 'Account & settings', to: '/profile', icon: UserIcon, bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  ];

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="relative max-w-6xl mx-auto px-6 py-5 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{getTimeGreeting()}</p>
            <h1 className="text-3xl font-bold text-text-heading tracking-tight">
              Hi, {user?.username || 'there'}
            </h1>
            <p className="text-text-muted text-sm">
              Here's your learning snapshot for today.
            </p>
          </div>
          <p className="text-xs font-medium text-text-muted">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-100">
            <Spinner label="Loading your dashboard..." />
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-border-light mx-auto">
                <Target className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-text-muted text-sm font-medium">No dashboard data available.</p>
            </div>
          </div>
        ) : (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-bg-card border border-border-light rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {stat.label}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-text-heading tabular-nums">
                  {stat.value}
                </div>
                <p className="text-xs text-text-muted mt-1 truncate">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Weekly Activity */}
            <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-heading">Weekly Activity</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Active {activeDaysCount} of the last 7 days
                  </p>
                </div>
                <Clock className="w-4 h-4 text-text-muted" />
              </div>

              <div className="flex items-end justify-between gap-2 h-28">
                {weeklyActivity.map((day, index) => {
                  const isToday = index === weeklyActivity.length - 1;
                  const pct = Math.max(Math.round((day.count / maxActivityCount) * 100), 4);

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {day.count > 0 && (
                        <div className="absolute -top-7 px-2 py-1 rounded-lg bg-text-heading text-bg-card text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                          {day.count} {day.count === 1 ? 'activity' : 'activities'}
                        </div>
                      )}
                      <div className="w-full h-24 flex items-end justify-center">
                        <div
                          className={`w-full max-w-7 rounded-t-md transition-all duration-300 ${isToday ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/60'
                            }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Documents Section */}
            <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-heading">
                      My Documents
                    </h3>
                    <p className="text-xs text-text-muted">
                      Your uploaded documents & overall mastery progress
                    </p>
                  </div>
                </div>
                <Link
                  to="/documents"
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {documentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner />
                </div>
              ) : userDocuments.length > 0 ? (
                <ul className="divide-y divide-border-light">
                  {userDocuments.slice(0, 6).map((doc) => {
                    const progress = doc.overallProgress || 0;

                    return (
                      <li
                        key={doc._id}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/40 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2.5 bg-primary-light rounded-xl shrink-0 text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-text-heading truncate">
                              {doc.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 max-w-xs">
                              <div className="flex-1 bg-border-light h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-primary tabular-nums shrink-0">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/documents/${doc._id}/learning-path`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-border-light hover:bg-primary-light text-xs font-semibold text-text-body hover:text-primary transition-colors duration-150"
                          >
                            Learning Path
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-border-light flex items-center justify-center mb-1">
                    <FileText className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-text-body">No documents uploaded yet.</p>
                  <p className="text-xs text-text-muted">Upload your first PDF or document to start building learning paths!</p>
                  <Link
                    to="/documents"
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs"
                  >
                    Upload Document
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-text-heading">
                  Recent Activity
                </h3>
              </div>

              {hasActivity ? (
                <ul className="divide-y divide-border-light">
                  {activities.slice(0, 6).map((activity, index) => (
                    <li
                      key={activity.id || index}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/40 transition-colors duration-150"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${activity.type === 'document'
                          ? 'bg-blue-400'
                          : 'bg-emerald-400'
                          }`} />
                        <div className="min-w-0">
                          <p className="text-sm text-text-body truncate">
                            <span className="text-text-muted mr-1">
                              {activity.type === 'document' ? 'Accessed' : 'Attempted'}
                            </span>
                            <span className="font-medium text-text-heading">
                              {activity.description}
                            </span>
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {activity.link && (
                        <a
                          href={activity.link}
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
                        >
                          View
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-border-light flex items-center justify-center mb-1">
                    <Clock className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-text-body">No recent activity yet.</p>
                  <p className="text-xs text-text-muted">Start learning to see your progress here.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right / side column */}
          <div className="space-y-6">

            {/* Overall Mastery */}
            <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                  <Award className="w-4 h-4 text-primary" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-text-heading">Overall Mastery</h3>
              </div>

              {overview.overallMastery !== null && overview.overallMastery !== undefined ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-heading tabular-nums">{overview.overallMastery}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-primary-light overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${overview.overallMastery}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Across {overview.topicsTracked} tracked topic{overview.topicsTracked === 1 ? '' : 's'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-text-muted">
                  Generate a learning path from a document to start tracking mastery.
                </p>
              )}
            </div>

            {/* Focus Areas */}
            <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-text-heading">Focus Areas</h3>
              </div>

              {focusAreas.length > 0 ? (
                <ul className="divide-y divide-border-light">
                  {focusAreas.map((area, index) => (
                    <li key={`${area.concept}-${index}`} className="px-6 py-3.5">
                      <p className="text-sm font-medium text-text-heading truncate">{area.concept}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-text-muted truncate">
                          {area.documentTitle || 'Untitled document'}
                          {area.missedCount > 0 && ` · missed ${area.missedCount}×`}
                        </p>
                        {area.documentId && (
                          <a
                            href={`/documents/${area.documentId}/learning-path`}
                            className="shrink-0 text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
                          >
                            Review
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-2">
                  <p className="text-sm font-medium text-text-body">No focus areas right now.</p>
                  <p className="text-xs text-text-muted">Take some quizzes to surface concepts worth revisiting.</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-bg-card border border-border-light rounded-2xl p-3 shadow-sm space-y-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-border-light/40 transition-colors duration-150"
                >
                  <div className={`w-9 h-9 rounded-lg ${link.bg} flex items-center justify-center shrink-0`}>
                    <link.icon className={`w-4 h-4 ${link.text}`} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-heading">{link.label}</p>
                    <p className="text-xs text-text-muted truncate">{link.subtext}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
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