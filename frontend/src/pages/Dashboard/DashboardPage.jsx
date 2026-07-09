import React, { useState, useEffect } from 'react';
import Spinner from '../../components/common/Spinner';
import progressService from '../../services/progressService';
import toast from 'react-hot-toast';
import { FileText, BookOpen, BrainCircuit, TrendingUp, Clock, ArrowRight } from 'lucide-react';

const DashboardPage = () => {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        console.log("Data__getDashboardData", data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  if (!dashboardData || !dashboardData.overview) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-border-light">
            <TrendingUp className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
          </div>
          <p className="text-text-muted text-sm font-medium">No dashboard data available.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Documents',
      value: dashboardData.overview.totalDocuments,
      icon: FileText,
      gradient: 'from-blue-400 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Flashcards',
      value: dashboardData.overview.totalFlashcards,
      icon: BookOpen,
      gradient: 'from-violet-400 to-purple-500',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Total Quizzes',
      value: dashboardData.overview.totalQuizzes,
      icon: BrainCircuit,
      gradient: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    }
  ];

  const activities = dashboardData.recentActivity
    ? [
      ...(dashboardData.recentActivity.documents || []).map(doc => ({
        id: doc._id,
        description: doc.title,
        timestamp: doc.lastAccessed,
        link: `/documents/${doc._id}`,
        type: 'document'
      })),
      ...(dashboardData.recentActivity.quizzes || []).map(quiz => ({
        id: quiz._id,
        description: quiz.title,
        timestamp: quiz.lastAttempted,
        link: `/quizzes/${quiz._id}`,
        type: 'quiz'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const hasActivity = activities.length > 0;

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="relative max-w-6xl mx-auto px-6 py-5 space-y-10">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-text-heading tracking-tight">
            Dashboard
          </h1>
          <p className="text-text-muted text-sm">
            Track your learning progress and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-bg-card border border-border-light rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {stat.label}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="text-4xl font-bold text-text-heading tabular-nums">
                {stat.value ?? 0}
              </div>
            </div>
          ))}
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
              {activities.map((activity, index) => (
                <li
                  key={activity.id || index}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/40 transition-colors duration-150"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${activity.type === 'document'
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
                      className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
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
    </div>
  );
};

export default DashboardPage;