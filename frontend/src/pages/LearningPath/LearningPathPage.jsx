import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from '../../utils/toast';
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Target,
  ListChecks,
  GraduationCap,
  CheckCircle2,
  Circle,
  BookOpen,
  Layers,
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import learningPathService from '../../services/learningPathService';
import aiService from '../../services/aiService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { getStatusStyle, getKnowledgeLevelStyle } from '../../utils/learningPathStatus';

const SOURCE_LABELS = {
  quiz: 'Quiz results',
  flashcard: 'Flashcard reviews',
  both: 'Quiz results & flashcard reviews',
};

const STATUS_HELP_TEXT = {
  'not-started': "You haven't answered any quiz questions or reviewed any flashcards tagged with this topic yet.",
  weak: 'Your recent accuracy on this topic is below 50%. Consider reviewing it soon.',
  'in-progress': "You're making progress on this topic. Keep practicing to master it.",
  mastered: "You've consistently scored well on this topic. Great job!",
};

// Maps each study-plan action to how it's presented and how clicking it behaves
const ACTION_META = {
  'reread-summary': { label: 'Re-read Summary', icon: BookOpen, type: 'inline' },
  'redo-flashcards': { label: 'Redo Flashcards', icon: Layers, type: 'link' },
  'retake-quiz': { label: 'Retake Quiz', icon: BrainCircuit, type: 'link' },
  'ask-ai-explain': { label: 'Ask AI to Explain', icon: Lightbulb, type: 'inline' },
};

const getActionLink = (action, documentId) => {
  if (action === 'redo-flashcards') return `/documents/${documentId}/flashcards`;
  if (action === 'retake-quiz') return `/documents/${documentId}?tab=Quizzes`;
  return null;
};

const LearningPathPage = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();

  const [learningPath, setLearningPath] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingStudyPlan, setRefreshingStudyPlan] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, title: '', content: '' });

  const fetchStudyPlan = async (force = false) => {
    if (force) setRefreshingStudyPlan(true);
    try {
      const response = await learningPathService.getStudyPlan(documentId, force);
      setLearningPath(response.data);
      setEligibility(response.eligibility);
      if (force) toast.success('Study plan refreshed!');
    } catch (error) {
      if (force) toast.error(error.message || 'Failed to refresh study plan.');
      console.error(error);
    } finally {
      if (force) setRefreshingStudyPlan(false);
    }
  };

  const fetchLearningPath = async () => {
    try {
      const response = await learningPathService.getLearningPathForDocument(user.id || user._id, documentId);
      setLearningPath(response.data);

      // Auto-refresh the AI study plan on page load (cheap no-op if not eligible or not stale)
      if (response.data?.topics?.length > 0) {
        fetchStudyPlan(false);
      }
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

  // `key` uniquely identifies the item for the loading spinner; `title` is what gets sent to
  // the AI (a topic title for study-plan items, a concept name for weak-concept items).
  const handleInlineAction = async (item, key, title) => {
    setActionLoadingKey(key);
    try {
      if (item.action === 'reread-summary') {
        const { summary } = await aiService.generateSummary(documentId);
        setActionModal({ isOpen: true, title: 'Document Summary', content: summary });
      } else if (item.action === 'ask-ai-explain') {
        const { explanation } = await aiService.explainConcept(documentId, title);
        setActionModal({ isOpen: true, title: `Explanation: ${title}`, content: explanation });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to run this action.');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const renderEligibilityRow = (label, current, required) => {
    const done = current >= required;
    return (
      <div className="flex items-center gap-3">
        {done
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
          : <Circle className="w-4 h-4 text-text-muted shrink-0" strokeWidth={2} />}
        <span className="text-sm text-text-body flex-1">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${done ? 'text-emerald-600' : 'text-text-muted'}`}>
          {current}/{required}
        </span>
      </div>
    );
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

    const { topics, recommendedNext, studyPlan } = learningPath;

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

        {/* AI Study Plan (gated) or eligibility progress */}
        {eligibility && !eligibility.eligible && (
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">AI Study Plan</h3>
                <p className="text-xs text-text-muted">
                  Complete a bit more practice to unlock a personalized study plan.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {renderEligibilityRow('Quizzes completed', eligibility.completedQuizCount, eligibility.requiredQuizCount)}
              {renderEligibilityRow('Flashcard sets reviewed', eligibility.reviewedFlashcardSetCount, eligibility.requiredFlashcardSetCount)}
            </div>
          </div>
        )}

        {eligibility?.eligible && studyPlan && studyPlan.length > 0 && (
          <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Your Study Plan</h3>
                <p className="text-xs text-text-muted">Weakest topics first - work through this at your own pace.</p>
              </div>
            </div>
            <ul className="divide-y divide-border-light">
              {studyPlan.map((item, index) => {
                const levelStyle = getKnowledgeLevelStyle(item.knowledgeLevel);
                const meta = ACTION_META[item.action];
                const ActionIcon = meta?.icon;
                const isLoadingThis = actionLoadingKey === item.topicId;
                const link = getActionLink(item.action, documentId);

                return (
                  <li
                    key={`${item.topicId}-${index}`}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-border-light text-text-muted text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-text-heading">{item.title}</p>
                          {levelStyle && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                              {levelStyle.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{item.reason}</p>
                      </div>
                    </div>

                    {link ? (
                      <Link
                        to={link}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-medium text-xs font-semibold text-text-body hover:bg-border-light transition-colors duration-150"
                      >
                        {ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                        {meta.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleInlineAction(item, item.topicId, item.title)}
                        disabled={isLoadingThis}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-medium text-xs font-semibold text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingThis
                          ? <Spinner size="xs" tone="muted" inline />
                          : ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                        {meta?.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Weak Areas (concept-level, mined from wrong quiz answers) */}
        {eligibility?.eligible && (
          <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Weak Areas</h3>
                <p className="text-xs text-text-muted">Specific concepts you've missed on quizzes so far.</p>
              </div>
            </div>

            {(!learningPath.weakConcepts || learningPath.weakConcepts.length === 0) ? (
              <div className="px-6 py-5 text-sm text-text-body">
                No weak areas detected - nice work on your quizzes so far.
              </div>
            ) : (
              <ul className="divide-y divide-border-light">
                {learningPath.weakConcepts.map((item, index) => {
                  const meta = ACTION_META[item.action];
                  const ActionIcon = meta?.icon;
                  const key = `weak-${index}-${item.concept}`;
                  const isLoadingThis = actionLoadingKey === key;
                  const link = getActionLink(item.action, documentId);

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-4 px-6 py-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertTriangle className="mt-0.5 shrink-0 w-4 h-4 text-amber-500" strokeWidth={2} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-text-heading">{item.concept}</p>
                            {item.relatedTopicTitle && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-border-light text-text-muted">
                                {item.relatedTopicTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                          {item.missedCount > 0 && (
                            <p className="text-[11px] text-text-muted mt-0.5">
                              Missed in {item.missedCount} answer{item.missedCount === 1 ? '' : 's'}
                            </p>
                          )}
                        </div>
                      </div>

                      {link ? (
                        <Link
                          to={link}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-medium text-xs font-semibold text-text-body hover:bg-border-light transition-colors duration-150"
                        >
                          {ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                          {meta.label}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleInlineAction(item, key, item.concept)}
                          disabled={isLoadingThis}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-medium text-xs font-semibold text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingThis
                            ? <Spinner size="xs" tone="muted" inline />
                            : ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                          {meta?.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Topic Roadmap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => {
            const style = getStatusStyle(topic.status);
            const StatusIcon = style.icon;
            const levelStyle = getKnowledgeLevelStyle(topic.knowledgeLevel);
            const LevelIcon = levelStyle?.icon;

            return (
              <div
                key={topic.topicId}
                onClick={() => setSelectedTopic(topic)}
                className={`bg-bg-card border ${style.border} rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer`}
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

                {levelStyle && (
                  <span className={`w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                    <LevelIcon className="w-3 h-3" strokeWidth={2.5} />
                    {levelStyle.label}
                  </span>
                )}

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
              {eligibility?.eligible && (
                <Button
                  onClick={() => fetchStudyPlan(true)}
                  disabled={refreshingStudyPlan}
                  variant="secondary"
                >
                  <ListChecks className={`w-4 h-4 ${refreshingStudyPlan ? 'animate-spin' : ''}`} strokeWidth={2} />
                  {refreshingStudyPlan ? 'Refreshing...' : 'Refresh Study Plan'}
                </Button>
              )}
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

      <Modal
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        title={selectedTopic?.title}
      >
        {selectedTopic && (() => {
          const style = getStatusStyle(selectedTopic.status);
          const StatusIcon = style.icon;
          const levelStyle = getKnowledgeLevelStyle(selectedTopic.knowledgeLevel);
          const LevelIcon = levelStyle?.icon;

          return (
            <div className="space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                >
                  <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                  {style.label}
                </span>
                {levelStyle && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                    <LevelIcon className="w-3 h-3" strokeWidth={2.5} />
                    {levelStyle.label}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted">Mastery Score</span>
                  <span className="text-sm font-semibold text-text-heading tabular-nums">
                    {selectedTopic.masteryScore}%
                  </span>
                </div>
                <div className="w-full bg-border-light h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${style.dot}`}
                    style={{ width: `${selectedTopic.masteryScore}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-text-body leading-relaxed">
                {STATUS_HELP_TEXT[selectedTopic.status]}
              </p>

              {selectedTopic.knowledgeLevelReason && (
                <div className="p-3 rounded-xl bg-bg-main border border-border-light">
                  <p className="text-xs text-text-muted mb-1">AI Assessment</p>
                  <p className="text-sm text-text-body leading-relaxed">{selectedTopic.knowledgeLevelReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light text-sm">
                <div>
                  <p className="text-xs text-text-muted mb-1">Difficulty</p>
                  <p className="font-medium text-text-heading capitalize">{selectedTopic.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Based On</p>
                  <p className="font-medium text-text-heading">
                    {SOURCE_LABELS[selectedTopic.source] || 'No activity yet'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-text-muted mb-1">Last Reviewed</p>
                  <p className="font-medium text-text-heading">
                    {selectedTopic.lastReviewedAt
                      ? new Date(selectedTopic.lastReviewedAt).toLocaleString()
                      : 'Not reviewed yet'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, title: '', content: '' })}
        title={actionModal.title}
      >
        <div className="max-h-[60vh] overflow-y-auto prose prose-sm max-w-none prose-slate">
          <MarkdownRenderer content={actionModal.content} />
        </div>
      </Modal>
    </div>
  );
};

export default LearningPathPage;