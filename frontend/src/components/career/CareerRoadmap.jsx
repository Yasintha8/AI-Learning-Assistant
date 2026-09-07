import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Layers,
  FolderGit2,
  AlertCircle,
  BookOpen,
  Check
} from 'lucide-react';

const CareerRoadmap = ({ careerPath, onToggleTopic, onUpdateMilestoneStatus }) => {
  if (!careerPath) return null;

  const { summary, skillGaps = [], milestones = [], readinessScore = 0 } = careerPath;

  const getImportanceBadge = (importance) => {
    switch (importance) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'recommended':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'optional':
        return 'bg-bg-main text-text-muted border-border-medium';
      default:
        return 'bg-primary-light text-primary border-primary/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'in-progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-bg-main text-text-muted border-border-medium';
    }
  };

  return (
    <div className="space-y-6">

      {/* Executive Summary Card */}
      <div className="p-6 sm:p-8 bg-bg-card border border-border-light rounded-3xl shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary-light text-primary rounded-2xl border border-primary/20 shadow-2xs">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-bold text-text-heading tracking-tight font-display">
            AI Strategy & Career Transition Blueprint
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body">
          {summary || 'Your custom roadmap is engineered to build essential competencies step-by-step toward your target role.'}
        </p>
      </div>

      {/* Target Skill Gap Analysis Matrix */}
      {skillGaps.length > 0 && (
        <div className="p-6 bg-bg-card border border-border-light rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
            <h3 className="text-sm font-bold text-text-heading font-display">Target Skill Gap Analysis</h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {skillGaps.map((gap, index) => (
              <div
                key={index}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all hover:scale-102 ${getImportanceBadge(
                  gap.importance
                )}`}
              >
                <span>{gap.skill}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 font-mono">
                  {gap.importance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones Progression Visual Timeline */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-text-heading tracking-tight flex items-center gap-2.5 font-display">
            <Layers className="w-5 h-5 text-primary" />
            <span>Career Transition Milestones ({milestones.length})</span>
          </h3>
          <span className="text-xs font-semibold text-text-muted font-body">
            Check off completed topics to increase your readiness score ({readinessScore}%)
          </span>
        </div>

        {/* Vertical Timeline Stepper Container */}
        <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border-medium">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in-progress';

            return (
              <div
                key={milestone.milestoneId || idx}
                className={`relative pl-12 transition-all ${isCompleted ? 'opacity-95' : ''
                  }`}
              >
                {/* Timeline Stepper Node Badge */}
                <div
                  className={`absolute left-2.5 top-1 -translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-2xs transition-all ${isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isInProgress
                        ? 'bg-primary border-primary text-white animate-pulse'
                        : 'bg-bg-main border-border-medium text-text-muted'
                    }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
                </div>

                {/* Milestone Details Card */}
                <div className="p-6 bg-bg-card border border-border-light hover:border-border-medium rounded-3xl shadow-xs transition-all space-y-4">

                  {/* Milestone Card Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2.5 mb-1">
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            onUpdateMilestoneStatus(
                              milestone.milestoneId,
                              null,
                              null,
                              e.target.value
                            )
                          }
                          className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider cursor-pointer focus:outline-none transition-all ${getStatusBadge(
                            milestone.status
                          )}`}
                        >
                          <option value="not-started" className="bg-bg-card text-text-heading capitalize">
                            Not Started
                          </option>
                          <option value="in-progress" className="bg-bg-card text-text-heading capitalize">
                            In Progress
                          </option>
                          <option value="completed" className="bg-bg-card text-text-heading capitalize">
                            Completed
                          </option>
                        </select>

                        <span className="text-xs font-semibold text-text-muted flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ~{milestone.estimatedWeeks} week{milestone.estimatedWeeks > 1 ? 's' : ''}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-text-heading tracking-tight font-display">
                        {milestone.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body">
                    {milestone.description}
                  </p>

                  {/* Skills & Topics Checklist */}
                  {milestone.topics && milestone.topics.length > 0 && (
                    <div className="pt-4 border-t border-border-light space-y-3">
                      <h5 className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>Key Topics ({milestone.topics.filter(t => t.isCompleted).length}/{milestone.topics.length})</span>
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
                    <div className="pt-4 border-t border-border-light space-y-3">
                      <h5 className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center gap-2">
                        <FolderGit2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>Portfolio Project Suggestions</span>
                      </h5>

                      <div className="space-y-2.5">
                        {milestone.suggestedProjects.map((project, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3.5 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-1"
                          >
                            <div className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                              <span>🚀</span> <span>{project.title}</span>
                            </div>
                            <div className="text-xs text-text-muted leading-relaxed font-body">
                              {project.description}
                            </div>
                          </div>
                        ))}
                      </div>
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
