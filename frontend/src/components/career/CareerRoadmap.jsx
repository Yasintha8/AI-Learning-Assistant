import React from 'react';
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
  ChevronRight
} from 'lucide-react';

const CareerRoadmap = ({ careerPath, onToggleTopic, onUpdateMilestoneStatus }) => {
  if (!careerPath) return null;

  const { summary, skillGaps = [], milestones = [], readinessScore = 0 } = careerPath;

  const getImportanceBadge = (importance) => {
    switch (importance) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      case 'recommended':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'optional':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'in-progress':
        return 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Summary Card */}
      <div className="p-6 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-white dark:from-[#192238] dark:to-[#151b2c] border border-indigo-100 dark:border-indigo-950/80 rounded-3xl shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">AI Strategy & Career Overview</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {summary || 'Your custom roadmap is engineered to build essential competencies step-by-step toward your target role.'}
        </p>
      </div>

      {/* Target Skill Gap Analysis Matrix */}
      {skillGaps.length > 0 && (
        <div className="p-6 bg-white dark:bg-[#151b2c] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2 mb-3.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Skill Gap Analysis</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {skillGaps.map((gap, index) => (
              <div
                key={index}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all hover:scale-102 ${getImportanceBadge(
                  gap.importance
                )}`}
              >
                <span>{gap.skill}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 font-mono">
                  {gap.importance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones Progression Visual Timeline */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Career Transition Milestones ({milestones.length})
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Check off completed topics to raise your readiness score ({readinessScore}%)
          </span>
        </div>

        {/* Vertical Timeline Stepper Container */}
        <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in-progress';

            return (
              <div
                key={milestone.milestoneId || idx}
                className={`relative pl-12 transition-all ${
                  isCompleted ? 'opacity-90' : ''
                }`}
              >
                {/* Timeline Stepper Node Badge */}
                <div
                  className={`absolute left-2.5 top-1 -translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isInProgress
                      ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-[#151b2c] border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>

                {/* Milestone Details Card */}
                <div className="p-6 bg-white dark:bg-[#151b2c] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl shadow-xs transition-all space-y-4">
                  
                  {/* Milestone Card Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
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
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider cursor-pointer focus:outline-none transition-all ${getStatusBadge(
                            milestone.status
                          )}`}
                        >
                          <option value="not-started" className="bg-white dark:bg-[#151b2c] text-slate-800 dark:text-slate-200 capitalize">
                            Not Started
                          </option>
                          <option value="in-progress" className="bg-white dark:bg-[#151b2c] text-slate-800 dark:text-slate-200 capitalize">
                            In Progress
                          </option>
                          <option value="completed" className="bg-white dark:bg-[#151b2c] text-slate-800 dark:text-slate-200 capitalize">
                            Completed
                          </option>
                        </select>
                        
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ~{milestone.estimatedWeeks} week{milestone.estimatedWeeks > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {milestone.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {milestone.description}
                  </p>

                  {/* Skills & Topics Checklist */}
                  {milestone.topics && milestone.topics.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Key Topics ({milestone.topics.filter(t => t.isCompleted).length}/{milestone.topics.length})
                      </h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {milestone.topics.map((topic, topicIdx) => (
                          <div
                            key={topicIdx}
                            onClick={() =>
                              onToggleTopic(milestone.milestoneId, topicIdx, !topic.isCompleted)
                            }
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              topic.isCompleted
                                ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {topic.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                            )}
                            <span className={topic.isCompleted ? 'line-through opacity-85' : 'font-medium'}>
                              {topic.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Project Ideas */}
                  {milestone.suggestedProjects && milestone.suggestedProjects.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Portfolio Project Suggestions
                      </h5>
                      
                      <div className="space-y-2">
                        {milestone.suggestedProjects.map((project, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/20 rounded-xl"
                          >
                            <div className="font-bold text-xs text-purple-900 dark:text-purple-300 mb-0.5 flex items-center gap-1.5">
                              <span>🚀</span> {project.title}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
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
