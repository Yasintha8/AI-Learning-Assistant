import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Layers,
  FolderGit2,
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  SlidersHorizontal
} from 'lucide-react';
import Select from '../common/Select';
import toast from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const CareerRoadmap = ({ careerPath, onToggleTopic, onUpdateMilestoneStatus }) => {
  const [skillGapFilter, setSkillGapFilter] = useState('all');
  const [collapsedMilestones, setCollapsedMilestones] = useState(new Set());
  const [copiedProjectId, setCopiedProjectId] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!careerPath) return null;

  const { summary, skillGaps = [], milestones = [], readinessScore = 0 } = careerPath;

  const allCollapsed = milestones.length > 0 && collapsedMilestones.size === milestones.length;

  const toggleAllMilestones = () => {
    if (allCollapsed) {
      setCollapsedMilestones(new Set());
    } else {
      setCollapsedMilestones(new Set(milestones.map((_, i) => i)));
    }
  };

  const toggleMilestone = (idx) => {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const filteredSkillGaps = skillGaps.filter((g) => {
    if (skillGapFilter === 'all') return true;
    return g.importance === skillGapFilter;
  });

  const criticalCount = skillGaps.filter(g => g.importance === 'critical').length;
  const recCount = skillGaps.filter(g => g.importance === 'recommended').length;
  const optCount = skillGaps.filter(g => g.importance === 'optional').length;

  const handleCopyProject = (projectId, project) => {
    navigator.clipboard.writeText(`${project.title}\n\n${project.description}`);
    setCopiedProjectId(projectId);
    toast.success('Project idea copied to clipboard!');
    setTimeout(() => setCopiedProjectId(null), 2000);
  };

  const handleCopySummary = () => {
    const text = `## AI Career Strategy Blueprint\n\n${summary}\n\n### Target Skill Gaps:\n${skillGaps.map(g => `- ${g.skill} (${g.importance})`).join('\n')}\n\n### Milestones:\n${milestones.map((m, i) => `${i + 1}. ${m.title} (~${m.estimatedWeeks} wks) [${m.status}]\n   ${m.description}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Career blueprint copied to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const getImportanceBadge = (importance) => {
    switch (importance) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'recommended':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'optional':
        return 'bg-bg-main text-text-muted border-border-medium';
      default:
        return 'bg-primary-light text-primary border-primary/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'in-progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-bg-main text-text-muted border-border-medium';
    }
  };

  return (
    <div className="space-y-6">

      {/* Executive Summary Card */}
      <div className="p-6 sm:p-8 bg-bg-card border border-border-light rounded-3xl shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-light text-primary rounded-2xl border border-primary/20 shadow-2xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-bold text-text-heading tracking-tight font-display">
              AI Strategy & Career Transition Blueprint
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light hover:border-primary/40 bg-bg-main text-xs font-semibold text-text-muted hover:text-primary transition-all cursor-pointer shadow-2xs"
            title="Copy entire blueprint outline to clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied' : 'Copy Blueprint'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body">
          {summary || 'Your custom roadmap is engineered to build essential competencies step-by-step toward your target role.'}
        </p>
      </div>

      {/* Target Skill Gap Analysis Matrix with Filter Tabs */}
      {skillGaps.length > 0 && (
        <div className="p-6 bg-bg-card border border-border-light rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-sm font-bold text-text-heading font-display">
                Target Skill Gap Analysis ({skillGaps.length})
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-bg-main p-1 rounded-xl border border-border-medium text-xs font-bold w-fit">
              <button
                type="button"
                onClick={() => setSkillGapFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  skillGapFilter === 'all'
                    ? 'bg-bg-card text-text-heading shadow-xs border border-border-light'
                    : 'text-text-muted hover:text-text-heading'
                }`}
              >
                All ({skillGaps.length})
              </button>
              {criticalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSkillGapFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    skillGapFilter === 'critical'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-500/30'
                      : 'text-text-muted hover:text-rose-600'
                  }`}
                >
                  Critical ({criticalCount})
                </button>
              )}
              {recCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSkillGapFilter('recommended')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    skillGapFilter === 'recommended'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30'
                      : 'text-text-muted hover:text-amber-600'
                  }`}
                >
                  Recommended ({recCount})
                </button>
              )}
              {optCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSkillGapFilter('optional')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    skillGapFilter === 'optional'
                      ? 'bg-bg-card text-text-heading shadow-xs border border-border-light'
                      : 'text-text-muted hover:text-text-heading'
                  }`}
                >
                  Optional ({optCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {filteredSkillGaps.map((gap, index) => (
              <div
                key={index}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all hover:scale-102 ${getImportanceBadge(
                  gap.importance
                )}`}
              >
                <span>{gap.skill}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 font-mono">
                  {gap.importance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones Progression Visual Timeline */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-text-heading tracking-tight flex items-center gap-2.5 font-display">
            <Layers className="w-5 h-5 text-primary" />
            <span>Career Transition Milestones ({milestones.length})</span>
          </h3>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAllMilestones}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-medium hover:border-primary/40 bg-bg-card text-xs font-semibold text-text-muted hover:text-primary transition-all cursor-pointer shadow-2xs"
            >
              {allCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              <span>{allCollapsed ? 'Expand All' : 'Collapse All'}</span>
            </button>
            <span className="text-xs font-semibold text-text-muted font-body hidden sm:inline">
              Readiness: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{readinessScore}%</strong>
            </span>
          </div>
        </div>

        {/* Vertical Timeline Stepper Container */}
        <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border-medium">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in-progress';
            const isCollapsed = collapsedMilestones.has(idx);

            const totalTopics = milestone.topics?.length || 0;
            const completedTopics = milestone.topics?.filter(t => t.isCompleted).length || 0;
            const topicPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <div
                key={milestone.milestoneId || idx}
                className={`relative pl-12 transition-all ${isCompleted ? 'opacity-95' : ''}`}
              >
                {/* Timeline Stepper Node Badge */}
                <div
                  className={`absolute left-2.5 top-1 -translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-2xs transition-all ${isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isInProgress
                        ? 'bg-primary border-primary text-white ring-2 ring-primary/20'
                        : 'bg-bg-main border-border-medium text-text-muted'
                    }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
                </div>

                {/* Milestone Details Card */}
                <div className="bg-bg-card border border-border-light hover:border-border-medium rounded-3xl shadow-xs transition-all overflow-hidden">

                  {/* Milestone Card Header (Clickable for toggle) */}
                  <div
                    onClick={() => toggleMilestone(idx)}
                    className="p-6 cursor-pointer select-none space-y-3 hover:bg-bg-main/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-50">
                        <div className="flex items-center gap-2.5 mb-1" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={milestone.status}
                            onChange={(e) =>
                              onUpdateMilestoneStatus(
                                milestone.milestoneId,
                                null,
                                null,
                                e.target.value
                              )
                            }
                            options={STATUS_OPTIONS}
                            size="sm"
                            variant="badge"
                            buttonClassName={`px-2.5 h-6 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusBadge(
                              milestone.status
                            )}`}
                            ariaLabel="Update milestone status"
                          />

                          <span className="text-xs font-semibold text-text-muted flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            ~{milestone.estimatedWeeks} week{milestone.estimatedWeeks > 1 ? 's' : ''}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-text-heading tracking-tight font-display">
                          {milestone.title}
                        </h4>
                      </div>

                      {/* Header Right: Mini Progress & Collapse Indicator */}
                      <div className="flex items-center gap-3 shrink-0">
                        {totalTopics > 0 && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-text-body font-mono">
                              {completedTopics}/{totalTopics} done
                            </div>
                            <div className="w-20 bg-bg-main rounded-full h-1.5 overflow-hidden border border-border-light mt-1">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${topicPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="p-1 rounded-xl hover:bg-border-light text-text-muted transition-colors">
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isCollapsed && (
                      <p className="text-xs text-text-muted line-clamp-1 font-body">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  {/* Collapsible Content */}
                  {!isCollapsed && (
                    <div className="px-6 pb-6 pt-0 space-y-4 border-t border-border-light/60 mt-0">
                      <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body pt-4">
                        {milestone.description}
                      </p>

                      {/* Skills & Topics Checklist */}
                      {milestone.topics && milestone.topics.length > 0 && (
                        <div className="pt-3 border-t border-border-light space-y-3">
                          <h5 className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            <span>Key Topics ({completedTopics}/{totalTopics})</span>
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {milestone.topics.map((topic, topicIdx) => (
                              <div
                                key={topicIdx}
                                onClick={() =>
                                  onToggleTopic(milestone.milestoneId, topicIdx, !topic.isCompleted)
                                }
                                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${topic.isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium'
                                    : 'bg-bg-main border-border-light text-text-heading hover:border-border-medium font-medium'
                                  }`}
                              >
                                {topic.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-text-muted shrink-0" />
                                )}
                                <span className={topic.isCompleted ? 'line-through opacity-80' : ''}>
                                  {topic.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio Project Ideas */}
                      {milestone.suggestedProjects && milestone.suggestedProjects.length > 0 && (
                        <div className="pt-3 border-t border-border-light space-y-3">
                          <h5 className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center gap-2">
                            <FolderGit2 className="w-3.5 h-3.5 text-purple-500" />
                            <span>Portfolio Project Suggestions</span>
                          </h5>

                          <div className="space-y-2.5">
                            {milestone.suggestedProjects.map((project, pIdx) => {
                              const projId = `${idx}-${pIdx}`;
                              const isCopied = copiedProjectId === projId;

                              return (
                                <div
                                  key={pIdx}
                                  className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                                      <span>🚀</span> <span>{project.title}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleCopyProject(projId, project)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg-card hover:bg-purple-500/10 border border-border-light hover:border-purple-500/30 rounded-lg text-[10px] font-semibold text-text-muted hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                    >
                                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      <span>{isCopied ? 'Copied' : 'Copy Brief'}</span>
                                    </button>
                                  </div>
                                  <div className="text-xs text-text-muted leading-relaxed font-body">
                                    {project.description}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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

export default CareerRoadmap;
