import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from '../../utils/toast';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Target,
  ListChecks,
  CheckCircle2,
  Circle,
  BookOpen,
  Layers,
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Download,
  MoreVertical,
  Gauge,
  Map as MapIcon,
  Compass,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import learningPathService from '../../services/learningPathService';
import documentService from '../../services/documentService';
import aiService from '../../services/aiService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { getStatusStyle, getKnowledgeLevelStyle, getProgressBandStyle, getSkillCategoryStyle } from '../../utils/learningPathStatus';
import { generateLearningPathReportPdf } from '../../utils/learningPathReport';

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

// Persists across page visits so the floating outline button's attention-pulse only shows
// until the user discovers it once, not every time they open a learning path
const OUTLINE_SEEN_KEY = 'lp-outline-seen';

const getActionLink = (action, documentId) => {
  if (action === 'redo-flashcards') return `/documents/${documentId}/flashcards`;
  if (action === 'retake-quiz') return `/documents/${documentId}?tab=Quizzes`;
  return null;
};

const LearningPathPage = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();

  const [learningPath, setLearningPath] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [weakAreasEligibility, setWeakAreasEligibility] = useState(null);
  const [recentQuizResults, setRecentQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingStudyPlan, setRefreshingStudyPlan] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [highlightedStudyPlanTopicId, setHighlightedStudyPlanTopicId] = useState(null);

  const studyPlanItems = useMemo(() => {
    if (!learningPath?.topics || learningPath.topics.length === 0) return [];

    const existingPlanMap = new Map();
    if (learningPath?.studyPlan && Array.isArray(learningPath.studyPlan)) {
      learningPath.studyPlan.forEach((sp) => {
        if (sp.topicId) existingPlanMap.set(String(sp.topicId), sp);
        if (sp.title) existingPlanMap.set(sp.title.toLowerCase().trim(), sp);
      });
    }

    return learningPath.topics
      .slice()
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .map((t) => {
        const isMastered = t.status === 'mastered' || t.knowledgeLevel === 'proficient' || t.masteryScore >= 80;
        const matchedSp = existingPlanMap.get(String(t.topicId)) || existingPlanMap.get(t.title?.toLowerCase().trim());

        return {
          topicId: t.topicId,
          title: t.title,
          knowledgeLevel: t.knowledgeLevel || (isMastered ? 'proficient' : 'developing'),
          action: isMastered ? 'reread-summary' : (matchedSp?.action || (t.status === 'weak' ? 'redo-flashcards' : 'retake-quiz')),
          reason: isMastered ? 'Mastered topic! Review periodically to maintain top retention.' : (matchedSp?.reason || `Current mastery score: ${t.masteryScore}%.`),
          isMastered
        };
      });
  }, [learningPath]);

  const handleTopicCardClick = (topic) => {
    const isMastered = topic.status === 'mastered' || topic.knowledgeLevel === 'proficient' || topic.masteryScore >= 80;
    if (isMastered) return;

    const planItem = studyPlanItems.find((sp) =>
      (sp.topicId && topic.topicId && String(sp.topicId) === String(topic.topicId)) ||
      (sp.title && topic.title && sp.title.toLowerCase().trim() === topic.title.toLowerCase().trim())
    );

    if (planItem) {
      const targetId = planItem.topicId || topic.topicId;
      setHighlightedStudyPlanTopicId(targetId);

      const itemEl = document.getElementById(`study-plan-item-${targetId}`);
      if (itemEl) {
        scrollToSection(`study-plan-item-${targetId}`);
      } else {
        scrollToSection('lp-study-plan');
      }

      setTimeout(() => {
        setHighlightedStudyPlanTopicId(null);
      }, 4000);
    }
  };
  const [quizResultsExpanded, setQuizResultsExpanded] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, title: '', content: '' });
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const [activeSection, setActiveSection] = useState(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  // Pulses the outline FAB until the user discovers it once, then never again (persisted so
  // it doesn't nag on every return visit) - standard pattern for a newly-relocated affordance
  const [outlineSeen, setOutlineSeen] = useState(() => {
    try { return localStorage.getItem(OUTLINE_SEEN_KEY) === '1'; } catch { return false; }
  });
  const outlineRef = useRef(null);

  const openOutline = () => {
    setOutlineOpen(true);
    if (!outlineSeen) {
      setOutlineSeen(true);
      try { localStorage.setItem(OUTLINE_SEEN_KEY, '1'); } catch { /* localStorage unavailable */ }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
      if (outlineRef.current && !outlineRef.current.contains(event.target)) {
        setOutlineOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Jump-to-section nav shown at the top of the page - only lists sections that actually
  // render, since Study Plan / Cognitive Skills / Weak Areas are conditional on real activity
  const navItems = useMemo(() => {
    if (!learningPath?.topics?.length) return [];

    return [
      { id: 'lp-progress', label: 'Progress', icon: Gauge, show: true },
      { id: 'lp-recommended', label: 'Recommended Next', icon: Target, show: (learningPath.recommendedNext?.length || 0) > 0 },
      { id: 'lp-study-plan', label: 'Study Plan', icon: ListChecks, show: (learningPath.studyPlan?.length || 0) > 0 },
      { id: 'lp-skills', label: 'Cognitive Skills', icon: BrainCircuit, show: (learningPath.skillProfile?.length || 0) > 0 },
      { id: 'lp-weak-areas', label: 'Weak Areas', icon: AlertTriangle, show: !!weakAreasEligibility },
      { id: 'lp-topics', label: 'Topic Roadmap', icon: MapIcon, show: true },
    ].filter((item) => item.show);
  }, [learningPath, weakAreasEligibility]);

  // Falls back to the first nav item until the observer below reports a real intersection
  // (e.g. right after navItems changes, or before the user has scrolled at all)
  const displayedActiveSection = (activeSection && navItems.some((item) => item.id === activeSection))
    ? activeSection
    : navItems[0]?.id;

  // Scroll-spy: highlights whichever section is currently under the sticky app header as the user scrolls
  useEffect(() => {
    if (navItems.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-110px 0px -65% 0px', threshold: 0 }
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        const mainRect = mainEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetPos = mainEl.scrollTop + (elRect.top - mainRect.top) - 20;
        mainEl.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setOutlineOpen(false);
  };

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setOutlineOpen(false);
  };

  const fetchStudyPlan = async (force = false) => {
    if (force) setRefreshingStudyPlan(true);
    try {
      const response = await learningPathService.getStudyPlan(documentId, force);
      setLearningPath(response.data);
      setWeakAreasEligibility(response.weakAreasEligibility);
      setRecentQuizResults(response.recentQuizResults || []);
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

  // Fetched independently of the learning path itself - getStudyPlan's response isn't
  // populated with the document, so relying on learningPath.documentId.title would go
  // stale as soon as the auto-refresh in fetchLearningPath overwrites it.
  useEffect(() => {
    if (!documentId) return;
    documentService.getDocumentById(documentId)
      .then((response) => setDocumentTitle(response.data?.title || ''))
      .catch((error) => console.error(error));
  }, [documentId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await learningPathService.generateLearningPath(documentId);
      setLearningPath(response.data);
      toast.success('Learning path generated successfully!');
      // Populate the default study plan immediately rather than waiting for a reload
      fetchStudyPlan(false);
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

  const handleDownloadReport = () => {
    setDownloadingReport(true);
    try {
      generateLearningPathReportPdf({
        documentTitle,
        userName: user?.username,
        learningPath,
        weakAreasEligibility,
        recentQuizResults,
      });
    } catch (error) {
      toast.error('Failed to generate report.');
      console.error(error);
    } finally {
      setDownloadingReport(false);
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

    const overallProgress = topics.length > 0
      ? Math.round(topics.reduce((sum, topic) => sum + topic.masteryScore, 0) / topics.length)
      : 0;
    const masteredCount = topics.filter((topic) => topic.status === 'mastered').length;
    const progressBand = getProgressBandStyle(overallProgress);

    return (
      <div className="space-y-8">
        {/* Overall Progress */}
        <div id="lp-progress" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="shrink-0">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Document Progress</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tabular-nums ${progressBand.text}`}>{overallProgress}%</span>
                <span className="text-sm text-text-muted">complete</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="w-full h-2.5 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${progressBand.bar} transition-all duration-300`}
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                {masteredCount} of {topics.length} topic{topics.length === 1 ? '' : 's'} mastered
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Next */}
        {recommendedNext && recommendedNext.length > 0 && (
          <div id="lp-recommended" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
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

        {studyPlanItems && studyPlanItems.length > 0 && (
          <div id="lp-study-plan" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Your Study Plan</h3>
                <p className="text-xs text-text-muted">Personalized topic checklist — weakest topics first.</p>
              </div>
            </div>
            <ul className="divide-y divide-border-light">
              {studyPlanItems.map((item, index) => {
                const isHighlighted = highlightedStudyPlanTopicId && (
                  String(highlightedStudyPlanTopicId) === String(item.topicId) ||
                  (item.title && String(highlightedStudyPlanTopicId).toLowerCase().trim() === item.title.toLowerCase().trim())
                );
                const topicObj = learningPath?.topics?.find((t) =>
                  (t.topicId && item.topicId && String(t.topicId) === String(item.topicId)) ||
                  (t.title && item.title && t.title.toLowerCase().trim() === item.title.toLowerCase().trim())
                );
                const isMastered = item.knowledgeLevel === 'proficient' || topicObj?.status === 'mastered' || topicObj?.knowledgeLevel === 'proficient' || (topicObj?.masteryScore >= 80);
                const levelStyle = getKnowledgeLevelStyle(item.knowledgeLevel);
                const meta = ACTION_META[item.action];
                const ActionIcon = meta?.icon;
                const isLoadingThis = actionLoadingKey === item.topicId;
                const link = getActionLink(item.action, documentId);

                return (
                  <li
                    key={`${item.topicId}-${index}`}
                    id={`study-plan-item-${item.topicId}`}
                    className={`flex items-center justify-between gap-4 px-6 py-4 transition-all duration-500 ${
                      isHighlighted
                        ? 'bg-primary-light/95 border-l-4 border-primary ring-4 ring-primary/40 shadow-lg animate-pulse'
                        : isMastered
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-l-4 border-emerald-500'
                          : 'hover:bg-border-light/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-border-light text-text-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-text-heading">{item.title}</p>
                          {isMastered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Mastered ✓</span>
                            </span>
                          ) : (
                            levelStyle && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                                {levelStyle.label}
                              </span>
                            )
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

        {/* Cognitive Skills - deterministic accuracy-by-skill-category breakdown from quiz answers,
            no AI call involved. Shown as soon as any skill-tagged question has been answered. */}
        {learningPath.skillProfile && learningPath.skillProfile.length > 0 && (
          <div id="lp-skills" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Cognitive Skills</h3>
                <p className="text-xs text-text-muted">Quiz accuracy by type of thinking - lowest first.</p>
              </div>
            </div>
            <ul className="divide-y divide-border-light">
              {learningPath.skillProfile.map((skill) => {
                const skillStyle = getSkillCategoryStyle(skill.skillCategory);
                const SkillIcon = skillStyle?.icon;
                const statusStyle = getStatusStyle(skill.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <li key={skill.skillCategory} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {SkillIcon && <SkillIcon className={`w-4 h-4 shrink-0 ${skillStyle.text}`} strokeWidth={2} />}
                        <span className="text-sm font-medium text-text-heading truncate">
                          {skillStyle?.label || skill.skillCategory}
                        </span>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                          {statusStyle.label}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-text-heading tabular-nums">
                        {skill.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-border-light h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${statusStyle.dot}`}
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-1.5">
                      {skill.correctCount} of {skill.totalAnswered} question{skill.totalAnswered === 1 ? '' : 's'} correct
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Weak Areas (concept-level, mined from wrong quiz answers) - unlocks after 3 quizzes */}
        {weakAreasEligibility && !weakAreasEligibility.eligible && (
          <div id="lp-weak-areas" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Weak Areas</h3>
                <p className="text-xs text-text-muted">
                  Complete a few quizzes to unlock AI-detected weak concepts.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {renderEligibilityRow('Quizzes completed', weakAreasEligibility.completedQuizCount, weakAreasEligibility.requiredQuizCount)}
            </div>
          </div>
        )}

        {weakAreasEligibility?.eligible && (
          <div id="lp-weak-areas" className="scroll-mt-24 bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-heading">Weak Areas</h3>
                <p className="text-xs text-text-muted">Specific concepts you've missed on quizzes so far.</p>
              </div>
            </div>

            {recentQuizResults.length > 0 && (
              <div className="border-b border-border-light">
                <button
                  type="button"
                  onClick={() => setQuizResultsExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-6 py-4"
                >
                  <p className="text-xs font-semibold text-text-heading">
                    Based on {recentQuizResults.length} quiz result{recentQuizResults.length === 1 ? '' : 's'}
                  </p>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${quizResultsExpanded ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>

                {quizResultsExpanded && (
                  <ul className="space-y-2 px-6 pb-4">
                    {recentQuizResults.map((result) => (
                      <li key={result.quizId}>
                        <Link
                          to={`/quizzes/${result.quizId}/results`}
                          className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg border border-border-light hover:bg-border-light transition-colors duration-150"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-heading truncate">{result.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {new Date(result.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                            {result.score}%
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                  const skillStyle = getSkillCategoryStyle(item.skillCategory);
                  const SkillIcon = skillStyle?.icon;

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
                            {skillStyle && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${skillStyle.bg} ${skillStyle.text}`}>
                                <SkillIcon className="w-3 h-3" strokeWidth={2.5} />
                                {skillStyle.label}
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
        <div id="lp-topics" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <MapIcon className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-heading">Topic Roadmap</h3>
              <p className="text-xs text-text-muted">Every topic extracted from this document - click a card for details.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => {
            const style = getStatusStyle(topic.status);
            const StatusIcon = style.icon;
            const levelStyle = getKnowledgeLevelStyle(topic.knowledgeLevel);
            const LevelIcon = levelStyle?.icon;

            const isMastered = topic.status === 'mastered' || topic.knowledgeLevel === 'proficient' || topic.masteryScore >= 80;

            const planIndex = studyPlanItems
              ? studyPlanItems.findIndex((sp) =>
                  (sp.topicId && topic.topicId && String(sp.topicId) === String(topic.topicId)) ||
                  (sp.title && topic.title && sp.title.toLowerCase().trim() === topic.title.toLowerCase().trim())
                )
              : -1;
            const planItem = planIndex !== -1 ? studyPlanItems[planIndex] : null;

            return (
              <div
                key={topic.topicId}
                onClick={() => !isMastered && handleTopicCardClick(topic)}
                className={`bg-bg-card border ${
                  isMastered
                    ? 'border-emerald-200 dark:border-emerald-900/40 cursor-default'
                    : 'border-primary/40 ring-1 ring-primary/20 cursor-pointer shadow-sm hover:shadow-md'
                } rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 relative group`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className={`text-sm font-bold text-text-heading ${isMastered ? '' : 'group-hover:text-primary'} transition-colors leading-snug truncate`}>
                        {topic.title}
                      </h4>
                      {planItem && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isMastered
                            ? 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'text-primary bg-primary-light border-primary/30'
                        }`}>
                          <Target className="w-3 h-3 shrink-0" />
                          <span>Study Plan #{planIndex + 1}</span>
                        </span>
                      )}
                    </div>
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
                </div>

                {/* Footer status link */}
                <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-light">
                  <span className="capitalize text-[11px]">{topic.difficulty} difficulty</span>
                  {isMastered ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mastered ✓</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                      <span>View in Study Plan</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
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

        <PageHeader
          title={documentTitle || 'Learning Path'}
          subtitle={documentTitle ? 'Learning Path · Track your topic mastery and see what to study next' : 'Track your topic mastery and see what to study next'}
        >
          {learningPath && learningPath.topics?.length > 0 && (
            <div className="flex items-center gap-2.5">
              {/* Overflow menu: lower-frequency maintenance actions */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  disabled={refreshingStudyPlan || refreshing}
                  aria-label="More actions"
                  aria-haspopup="true"
                  aria-expanded={moreMenuOpen}
                  className={`h-11 w-11 inline-flex items-center justify-center rounded-xl border border-border-medium text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${moreMenuOpen ? 'bg-border-light' : 'bg-bg-card'}`}
                >
                  {(refreshingStudyPlan || refreshing) ? (
                    <Spinner size="xs" tone="muted" inline />
                  ) : (
                    <MoreVertical className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-border-medium rounded-2xl shadow-xl shadow-slate-200/25 dark:shadow-none py-1.5 z-50 animate-fade-in origin-top-right">
                    <button
                      type="button"
                      onClick={() => { setMoreMenuOpen(false); fetchStudyPlan(true); }}
                      disabled={refreshingStudyPlan}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-text-heading hover:bg-border-light/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ListChecks className={`w-4 h-4 text-primary shrink-0 ${refreshingStudyPlan ? 'animate-spin' : ''}`} strokeWidth={2} />
                      {refreshingStudyPlan ? 'Refreshing...' : 'Refresh Study Plan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMoreMenuOpen(false); handleRefreshMastery(); }}
                      disabled={refreshing}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-text-heading hover:bg-border-light/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 text-primary shrink-0 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
                      {refreshing ? 'Refreshing...' : 'Refresh Mastery'}
                    </button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                variant="outline"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                {downloadingReport ? 'Preparing...' : 'Download Report'}
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

      {/* Floating Labeled Pill Button at Bottom-Right */}
      {navItems.length > 0 && (
        <div
          ref={outlineRef}
          className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
          onMouseEnter={openOutline}
          onMouseLeave={() => setOutlineOpen(false)}
        >
          {outlineOpen && (
            <div className="mb-3 w-64 bg-bg-card border border-border-medium rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-none py-2 z-50 animate-fade-in origin-bottom-right backdrop-blur-lg">
              <div className="px-4 pt-1 pb-2 flex items-center justify-between border-b border-border-light mb-1">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                  On This Page
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Section Spying" />
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = displayedActiveSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'text-primary bg-primary-light font-bold border-l-2 border-primary'
                          : 'text-text-heading hover:bg-border-light/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-muted'}`} strokeWidth={2} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Back to Top */}
              <div className="pt-1.5 mt-1 border-t border-border-light px-2">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary-light transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ArrowUp className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                    <span>Back to Top</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-80">↑</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOutlineOpen((prev) => !prev)}
            aria-label="Jump to section"
            aria-expanded={outlineOpen}
            className="flex items-center gap-2.5 px-4.5 py-3 bg-gradient-to-r from-primary via-indigo-600 to-blue-600 text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer group hover:scale-105 ring-2 ring-primary/20"
          >
            <Compass className="w-4.5 h-4.5 text-white group-hover:rotate-45 transition-transform duration-300" strokeWidth={2.5} />
            <span>Jump to Section</span>
            <ChevronUp className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${outlineOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      )}

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

              {/* Study Plan Alignment Section in Modal */}
              {(() => {
                const planIndex = studyPlan?.findIndex((sp) =>
                  (sp.topicId && String(sp.topicId) === String(selectedTopic.topicId)) ||
                  (sp.title && selectedTopic.title && sp.title.toLowerCase() === selectedTopic.title.toLowerCase())
                );
                const planItem = (planIndex !== undefined && planIndex !== -1) ? studyPlan[planIndex] : null;

                if (!planItem) return null;
                const meta = ACTION_META[planItem.action];
                const ActionIcon = meta?.icon;
                const link = getActionLink(planItem.action, documentId);
                const isLoadingThis = actionLoadingKey === planItem.topicId;

                return (
                  <div className="p-4 rounded-2xl bg-primary-light/60 border border-primary/20 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Target className="w-4 h-4" />
                        <span>Study Plan Priority #{planIndex + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopic(null);
                          scrollToSection('lp-study-plan');
                        }}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View in Plan <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-text-heading font-medium">{planItem.reason}</p>

                    <div>
                      {link ? (
                        <Link
                          to={link}
                          onClick={() => setSelectedTopic(null)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
                        >
                          {ActionIcon && <ActionIcon className="w-4 h-4" />}
                          <span>{meta?.label || 'Study Topic'}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTopic(null);
                            handleInlineAction(planItem, planItem.topicId, planItem.title);
                          }}
                          disabled={isLoadingThis}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs disabled:opacity-50"
                        >
                          {isLoadingThis ? <Spinner size="xs" tone="white" inline /> : (ActionIcon && <ActionIcon className="w-4 h-4" />)}
                          <span>{meta?.label || 'Study Topic'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
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