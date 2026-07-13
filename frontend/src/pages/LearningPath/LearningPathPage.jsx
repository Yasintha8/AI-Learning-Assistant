import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import learningPathService from '../../services/learningPathService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { getStatusStyle } from '../../utils/learningPathStatus';

const LearningPathPage = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();

  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLearningPath = async () => {
    try {
      const response = await learningPathService.getLearningPathForDocument(user.id || user._id, documentId);
      setLearningPath(response.data);
    } catch (error) {
      toast.error('Failed to fetch learning path.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId && user) {
      fetchLearningPath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, user]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await learningPathService.generateLearningPath(documentId);
      setLearningPath(response.data);
      toast.success('Learning path generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to generate learning path.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefreshMastery = async () => {
    setRefreshing(true);
    try {
      const response = await learningPathService.updateLearningPath(documentId);
      setLearningPath(response.data);
      toast.success('Mastery scores updated!');
    } catch (error) {
      toast.error(error.message || 'Failed to update mastery scores.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      );
    }

    if (!learningPath || !learningPath.topics || learningPath.topics.length === 0) {
      return (
        <EmptyState
          title="No Learning Path Yet"
          description="Generate a topic breakdown from this document to start tracking your mastery."
          buttonText={generating ? 'Generating...' : 'Generate Learning Path'}
          onActionClick={generating ? undefined : handleGenerate}
        />
      );
    }

    const { topics, recommendedNext } = learningPath;

    return (
      <div className="space-y-8">
        {/* Recommended Next */}
        {recommendedNext && recommendedNext.length > 0 && (
          <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-text-heading">Recommended Next</h3>
            </div>
            <ul className="divide-y divide-border-light">
              {recommendedNext.map((rec) => (
                <li
                  key={rec.topicId}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-heading truncate">{rec.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{rec.reason}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                    {rec.masteryScore}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topic Roadmap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => {
            const style = getStatusStyle(topic.status);
            const StatusIcon = style.icon;

            return (
              <div
                key={topic.topicId}
                className={`bg-bg-card border ${style.border} rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-bold text-text-heading leading-snug">
                    {topic.title}
                  </h4>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                  >
                    <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                    {style.label}
                  </span>
                </div>

                {/* Mastery bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">Mastery</span>
                    <span className="text-xs font-semibold text-text-heading tabular-nums">
                      {topic.masteryScore}%
                    </span>
                  </div>
                  <div className="w-full bg-border-light h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${style.dot}`}
                      style={{ width: `${topic.masteryScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border-light">
                  <span className="capitalize">{topic.difficulty} difficulty</span>
                  <span>
                    {topic.lastReviewedAt
                      ? `Reviewed ${new Date(topic.lastReviewedAt).toLocaleDateString()}`
                      : 'Not reviewed yet'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-6xl mx-auto px-6 py-5 space-y-6">
        <Link
          to={`/documents/${documentId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Document
        </Link>

        <PageHeader title="Learning Path" subtitle="Track your topic mastery and see what to study next">
          {learningPath && learningPath.topics?.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefreshMastery}
                disabled={refreshing}
                variant="secondary"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
                {refreshing ? 'Refreshing...' : 'Refresh Mastery'}
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                {generating ? 'Generating...' : 'Regenerate Topics'}
              </Button>
            </div>
          )}
        </PageHeader>

        {renderContent()}
      </div>
    </div>
  );
};

export default LearningPathPage;