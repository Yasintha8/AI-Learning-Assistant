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
  TrendingUp,
  Award
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

  const displayedActiveSection = (activeSection && navItems.some((item) => item.id === activeSection))
    ? activeSection
    : navItems[0]?.id;

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
      <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-main border border-border-light">
        {done
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
          : <Circle className="w-4 h-4 text-text-muted shrink-0" strokeWidth={2} />}
        <span className="text-xs sm:text-sm text-text-body flex-1 font-medium">{label}</span>
        <span className={`text-xs sm:text-sm font-black tabular-nums font-mono ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}`}>
          {current}/{required}
        </span>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-bg-card border border-border-light rounded-3xl p-8 shadow-xs">
          <Spinner size="lg" tone="emerald" />
          <p className="text-xs font-semibold text-text-muted">Loading learning path details...</p>
        </div>
      );
    }

    if (!learningPath || !learningPath.topics || learningPath.topics.length === 0) {
      return (
        <EmptyState
          title="No Learning Path Yet"
          description="Generate a topic breakdown from this document to start tracking your mastery."
          buttonText={generating ? 'Generating Topics...' : 'Generate Learning Path'}
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
        <div id="lp-progress" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 shrink-0 min-w-[200px]">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-primary" />
                <span>Overall Mastery</span>
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl sm:text-5xl font-black tabular-nums font-mono ${progressBand.text}`}>{overallProgress}%</span>
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Overall</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-text-muted">Mastery Progress</span>
                <span className="text-text-heading font-mono font-bold">{masteredCount} of {topics.length} topics mastered</span>
              </div>
              <div className="w-full h-3.5 bg-bg-main border border-border-light rounded-full overflow-hidden p-0.5 shadow-2xs">
                <div
                  className={`h-full rounded-full ${progressBand.bar} transition-all duration-500`}
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted pt-1 font-body">
                Scores automatically update as you complete quizzes and review flashcard sets linked to this document.
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Next */}
        {recommendedNext && recommendedNext.length > 0 && (
          <div id="lp-recommended" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl overflow-hidden shadow-xs">
            <div className="flex items-center gap-3 px-6 py-4 bg-primary-light/40 border-b border-border-light">
              <div className="w-9 h-9 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center shadow-2xs">
                <Target className="w-4.5 h-4.5 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-heading font-display">Recommended Next</h3>
                <p className="text-xs text-text-muted">Topics prioritized based on your recent performance</p>
              </div>
            </div>
            <ul className="divide-y divide-border-light">
              {recommendedNext.map((rec) => (
                <li
                  key={rec.topicId}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-bg-main/50 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-bold text-text-heading truncate">{rec.title}</p>
                    <p className="text-xs text-text-muted font-body">{rec.reason}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-black text-primary font-mono tabular-nums">
                      {rec.masteryScore}% score
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Study Plan */}
        {studyPlanItems && studyPlanItems.length > 0 && (
          <div id="lp-study-plan" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-4 bg-bg-main/60 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xs">
                  <ListChecks className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-heading font-display">Personalized Study Plan</h3>
                  <p className="text-xs text-text-muted">Structured checklist ordered from weakest topics to strongest</p>
                </div>
              </div>

              <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                {studyPlanItems.filter(i => i.isMastered).length}/{studyPlanItems.length} Done
              </span>
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
                    className={`flex items-center justify-between gap-4 px-6 py-4 transition-all duration-300 ${isHighlighted
                      ? 'bg-primary-light/95 border-l-4 border-primary ring-4 ring-primary/40 shadow-lg animate-pulse'
                      : isMastered
                        ? 'bg-emerald-500/5 border-l-4 border-emerald-500'
                        : 'hover:bg-bg-main/50'
                      }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-0.5 shrink-0 w-7 h-7 rounded-xl text-xs font-black font-mono flex items-center justify-center shadow-2xs ${isMastered
                        ? 'bg-emerald-500 text-white'
                        : 'bg-bg-main border border-border-medium text-text-heading'
                        }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-text-heading">{item.title}</p>
                          {isMastered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Mastered</span>
                            </span>
                          ) : (
                            levelStyle && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text}`}>
                                {levelStyle.label}
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed font-body">{item.reason}</p>
                      </div>
                    </div>

                    {link ? (
                      <Link
                        to={link}
                        className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-medium bg-bg-card hover:border-primary/50 text-xs font-bold text-text-heading hover:text-primary transition-all duration-150 shadow-2xs cursor-pointer"
                      >
                        {ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                        <span>{meta.label}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInlineAction(item, item.topicId, item.title)}
                        disabled={isLoadingThis}
                        className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-medium bg-bg-card hover:border-primary/50 text-xs font-bold text-text-heading hover:text-primary transition-all duration-150 shadow-2xs disabled:opacity-50 cursor-pointer"
                      >
                        {isLoadingThis
                          ? <Spinner size="xs" tone="emerald" inline />
                          : ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                        <span>{meta?.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Cognitive Skills */}
        {learningPath.skillProfile && learningPath.skillProfile.length > 0 && (
          <div id="lp-skills" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl overflow-hidden shadow-xs">
            <div className="flex items-center gap-3 px-6 py-4 bg-bg-main/60 border-b border-border-light">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xs">
                <BrainCircuit className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-heading font-display">Cognitive Skills Breakdown</h3>
                <p className="text-xs text-text-muted">Accuracy split across cognitive thinking levels</p>
              </div>
            </div>
            <ul className="divide-y divide-border-light">
              {learningPath.skillProfile.map((skill) => {
                const skillStyle = getSkillCategoryStyle(skill.skillCategory);
                const SkillIcon = skillStyle?.icon;
                const statusStyle = getStatusStyle(skill.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <li key={skill.skillCategory} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {SkillIcon && <SkillIcon className={`w-4 h-4 shrink-0 ${skillStyle.text}`} strokeWidth={2} />}
                        <span className="text-sm font-bold text-text-heading truncate">
                          {skillStyle?.label || skill.skillCategory}
                        </span>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                          {statusStyle.label}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-black text-text-heading font-mono tabular-nums">
                        {skill.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-bg-main border border-border-light h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusStyle.dot}`}
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted font-mono">
                      {skill.correctCount} of {skill.totalAnswered} question{skill.totalAnswered === 1 ? '' : 's'} correct
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Weak Areas */}
        {weakAreasEligibility && !weakAreasEligibility.eligible && (
          <div id="lp-weak-areas" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-heading font-display">AI Weak Concept Miner</h3>
                <p className="text-xs text-text-muted">
                  Complete at least 3 quizzes to unlock personalized weak area detection.
                </p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {renderEligibilityRow('Quizzes completed', weakAreasEligibility.completedQuizCount, weakAreasEligibility.requiredQuizCount)}
            </div>
          </div>
        )}

        {weakAreasEligibility?.eligible && (
          <div id="lp-weak-areas" className="scroll-mt-24 bg-bg-card border border-border-light rounded-3xl overflow-hidden shadow-xs">
            <div className="flex items-center gap-3 px-6 py-4 bg-amber-500/5 border-b border-border-light">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-heading font-display">Weak Concepts & Remediation</h3>
                <p className="text-xs text-text-muted">Specific concepts you've struggled with on recent quizzes</p>
              </div>
            </div>

            {recentQuizResults.length > 0 && (
              <div className="border-b border-border-light bg-bg-main/40">
                <button
                  type="button"
                  onClick={() => setQuizResultsExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-6 py-3.5 cursor-pointer"
                >
                  <p className="text-xs font-bold text-text-heading flex items-center gap-2">
                    <span>Based on {recentQuizResults.length} completed quiz attempt{recentQuizResults.length === 1 ? '' : 's'}</span>
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
                          className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl border border-border-light bg-bg-card hover:border-primary/40 transition-colors"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-bold text-text-heading truncate">{result.title}</p>
                            <p className="text-[11px] text-text-muted font-mono">
                              {new Date(result.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-black font-mono text-primary tabular-nums">
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
              <div className="px-6 py-8 text-center text-xs text-text-muted font-semibold">
                No weak concepts detected — excellent work on your quizzes so far!
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
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-bg-main/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertTriangle className="mt-0.5 shrink-0 w-4 h-4 text-amber-500" strokeWidth={2.5} />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-text-heading">{item.concept}</p>
                            {item.relatedTopicTitle && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-main border border-border-medium text-text-muted">
                                {item.relatedTopicTitle}
                              </span>
                            )}
                            {skillStyle && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${skillStyle.bg} ${skillStyle.text}`}>
                                {SkillIcon && <SkillIcon className="w-3 h-3" strokeWidth={2.5} />}
                                {skillStyle.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed font-body">{item.description}</p>
                          {item.missedCount > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                              Missed in {item.missedCount} quiz response{item.missedCount === 1 ? '' : 's'}
                            </p>
                          )}
                        </div>
                      </div>

                      {link ? (
                        <Link
                          to={link}
                          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-medium bg-bg-card hover:border-primary/50 text-xs font-bold text-text-heading hover:text-primary transition-all duration-150 shadow-2xs cursor-pointer"
                        >
                          {ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                          <span>{meta.label}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInlineAction(item, key, item.concept)}
                          disabled={isLoadingThis}
                          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-medium bg-bg-card hover:border-primary/50 text-xs font-bold text-text-heading hover:text-primary transition-all duration-150 shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {isLoadingThis
                            ? <Spinner size="xs" tone="emerald" inline />
                            : ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />}
                          <span>{meta?.label}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Topic Roadmap Grid */}
        <div id="lp-topics" className="scroll-mt-24 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xs">
                <MapIcon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-heading font-display">Topic Concept Roadmap</h3>
                <p className="text-xs text-text-muted">Click any topic card to view full mastery details & AI recommendations</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-text-muted">{topics.length} Topics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className={`bg-bg-card border ${isMastered
                    ? 'border-emerald-500/30 cursor-default'
                    : 'border-border-light hover:border-primary/50 cursor-pointer shadow-2xs hover:shadow-md'
                    } rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 group`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className={`text-sm font-bold text-text-heading ${isMastered ? '' : 'group-hover:text-primary'} transition-colors leading-snug line-clamp-2`}>
                          {topic.title}
                        </h4>
                        {planItem && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isMastered
                            ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300'
                            : 'text-primary bg-primary-light border-primary/30'
                            }`}>
                            <Target className="w-3 h-3 shrink-0" />
                            <span>Study Plan #{planIndex + 1}</span>
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${style.bg} ${style.text}`}
                      >
                        <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                        {style.label}
                      </span>
                    </div>

                    {levelStyle && (
                      <span className={`w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text}`}>
                        {LevelIcon && <LevelIcon className="w-3 h-3" strokeWidth={2.5} />}
                        {levelStyle.label}
                      </span>
                    )}

                    {/* Mastery score bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-semibold">Mastery</span>
                        <span className="font-mono font-bold text-text-heading tabular-nums">
                          {topic.masteryScore}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-main border border-border-light h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${style.dot}`}
                          style={{ width: `${topic.masteryScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer status link */}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-light/80">
                    <span className="capitalize text-[11px] font-mono">{topic.difficulty} difficulty</span>
                    {isMastered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mastered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                        <span>View in Plan</span>
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
    <div className="min-h-screen bg-bg-main pb-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to={`/documents/${documentId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary transition-colors duration-200 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Document</span>
        </Link>

        <PageHeader
          title={documentTitle || 'Learning Path'}
          subtitle={documentTitle ? 'Learning Path · Concept mastery tracking & personalized AI study guide' : 'Concept mastery tracking & personalized AI study guide'}
        >
          {learningPath && learningPath.topics?.length > 0 && (
            <div className="flex items-center gap-2.5">
              {/* Overflow menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  disabled={refreshingStudyPlan || refreshing}
                  aria-label="More actions"
                  aria-haspopup="true"
                  aria-expanded={moreMenuOpen}
                  className={`h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border-medium text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 cursor-pointer ${moreMenuOpen ? 'bg-border-light' : 'bg-bg-card'}`}
                >
                  {(refreshingStudyPlan || refreshing) ? (
                    <Spinner size="xs" tone="emerald" inline />
                  ) : (
                    <MoreVertical className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-border-medium rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in origin-top-right">
                    <button
                      type="button"
                      onClick={() => { setMoreMenuOpen(false); fetchStudyPlan(true); }}
                      disabled={refreshingStudyPlan}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-text-heading hover:bg-bg-main transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <ListChecks className={`w-4 h-4 text-primary shrink-0 ${refreshingStudyPlan ? 'animate-spin' : ''}`} strokeWidth={2} />
                      <span>{refreshingStudyPlan ? 'Refreshing Plan...' : 'Refresh Study Plan'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMoreMenuOpen(false); handleRefreshMastery(); }}
                      disabled={refreshing}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-text-heading hover:bg-bg-main transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 text-primary shrink-0 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
                      <span>{refreshing ? 'Refreshing Mastery...' : 'Refresh Mastery'}</span>
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
                <span>{downloadingReport ? 'Preparing Report...' : 'Download Report'}</span>
              </Button>

              <Button onClick={handleGenerate} disabled={generating}>
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                <span>{generating ? 'Generating...' : 'Regenerate Topics'}</span>
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
            <div className="mb-3 w-64 bg-bg-card/95 border border-border-medium rounded-2xl shadow-xl py-2 z-50 animate-fade-in origin-bottom-right backdrop-blur-md">
              <div className="px-4 pt-1 pb-2 flex items-center justify-between border-b border-border-light mb-1">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                  Page Sections
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
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${isActive
                        ? 'text-primary bg-primary-light/80 font-bold border-l-2 border-primary'
                        : 'text-text-heading hover:bg-bg-main'
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
            className="flex items-center gap-2.5 px-4.5 py-3 bg-gradient-to-r from-primary via-indigo-600 to-emerald-600 text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer group hover:scale-105 ring-2 ring-primary/20"
          >
            <Compass className="w-4.5 h-4.5 text-white group-hover:rotate-45 transition-transform duration-300" strokeWidth={2.5} />
            <span>Jump to Section</span>
            <ChevronUp className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${outlineOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Modal for topic details */}
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}
                >
                  <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                  {style.label}
                </span>
                {levelStyle && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${levelStyle.bg} ${levelStyle.text}`}>
                    {LevelIcon && <LevelIcon className="w-3 h-3" strokeWidth={2.5} />}
                    {levelStyle.label}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-text-muted">Mastery Score</span>
                  <span className="text-sm font-black font-mono text-text-heading tabular-nums">
                    {selectedTopic.masteryScore}%
                  </span>
                </div>
                <div className="w-full bg-bg-main border border-border-light h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${style.dot}`}
                    style={{ width: `${selectedTopic.masteryScore}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-text-body leading-relaxed font-body">
                {STATUS_HELP_TEXT[selectedTopic.status]}
              </p>

              {selectedTopic.knowledgeLevelReason && (
                <div className="p-3.5 rounded-2xl bg-bg-main border border-border-light space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">AI Assessment</p>
                  <p className="text-xs text-text-body leading-relaxed font-body">{selectedTopic.knowledgeLevelReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light text-xs">
                <div>
                  <p className="text-text-muted mb-1 font-semibold">Difficulty</p>
                  <p className="font-bold text-text-heading capitalize">{selectedTopic.difficulty}</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1 font-semibold">Based On</p>
                  <p className="font-bold text-text-heading">
                    {SOURCE_LABELS[selectedTopic.source] || 'No activity yet'}
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
                        className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>View in Plan</span> <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-text-heading font-medium">{planItem.reason}</p>

                    <div>
                      {link ? (
                        <Link
                          to={link}
                          onClick={() => setSelectedTopic(null)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-2xs"
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
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-2xs disabled:opacity-50"
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