import { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Briefcase, Target, Clock, Calendar, BookOpen, Compass } from 'lucide-react';
import Select from '../common/Select';

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'High School / Self-taught', label: 'High School / Self-taught' },
  { value: 'Undergraduate Student', label: 'Undergraduate Student' },
  { value: "Postgraduate / Master's", label: "Postgraduate / Master's" },
  { value: 'Junior Professional (0-2 yrs)', label: 'Junior Professional (0-2 yrs)' },
  { value: 'Experienced Professional (3+ yrs)', label: 'Experienced Professional (3+ yrs)' },
];

const LEARNING_STYLE_OPTIONS = [
  { value: 'hands-on', label: 'Hands-On Projects & Code' },
  { value: 'structured-theory', label: 'Structured Reading & Documentation' },
  { value: 'video-based', label: 'Video Tutorials & Guided Labs' },
  { value: 'fast-track', label: 'Fast-Track / Interview Prep Intensive' },
];

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'SQL', 'Docker', 'Git', 'AWS', 'Tailwind CSS', 'MongoDB'
];

const TARGET_ROLE_SUGGESTIONS = [
  'Full-Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'AI/ML Engineer', 'DevOps Specialist', 'Data Analyst'
];

const CAREER_GENERATION_STAGES = [
  'Benchmarking your background against target role requirements...',
  'Analyzing industry skill gaps & prerequisites...',
  'Architecting progressive milestone phases & timelines...',
  'Curating tailored portfolio project blueprints...'
];

const CareerIntakeModal = ({ isOpen, onClose, onSubmit, initialProfile, isLoading }) => {
  const [currentRole, setCurrentRole] = useState(initialProfile?.currentRole || '');
  const [educationLevel, setEducationLevel] = useState(initialProfile?.educationLevel || 'Undergraduate Student');
  const [targetRole, setTargetRole] = useState(initialProfile?.targetRole || '');
  const [timelineMonths, setTimelineMonths] = useState(initialProfile?.timelineMonths || 6);
  const [weeklyHours, setWeeklyHours] = useState(initialProfile?.weeklyHours || 10);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(initialProfile?.preferredLearningStyle || 'hands-on');
  const [generationStage, setGenerationStage] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setGenerationStage(0);
      return;
    }
    const interval = setInterval(() => {
      setGenerationStage((prev) => (prev < CAREER_GENERATION_STAGES.length - 1 ? prev + 1 : prev));
    }, 5500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Skills list state
  const [skills, setSkills] = useState(
    Array.isArray(initialProfile?.currentSkills) && initialProfile.currentSkills.length > 0
      ? initialProfile.currentSkills
      : [
        { skillName: 'HTML / CSS', proficiency: 'intermediate' },
        { skillName: 'JavaScript', proficiency: 'beginner' }
      ]
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('beginner');

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { skillName: newSkillName.trim(), proficiency: newSkillProficiency }]);
    setNewSkillName('');
    setNewSkillProficiency('beginner');
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentRole.trim() || !targetRole.trim()) return;

    onSubmit({
      currentRole: currentRole.trim(),
      educationLevel,
      currentSkills: skills,
      targetRole: targetRole.trim(),
      timelineMonths: Number(timelineMonths),
      weeklyHours: Number(weeklyHours),
      preferredLearningStyle
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-card border border-border-light rounded-3xl shadow-2xl overflow-hidden my-8 animate-fade-in">

        {/* Top Header */}
        <div className="px-6 py-5 bg-bg-main/80 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-white rounded-2xl shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-text-heading tracking-tight font-display">
                {initialProfile ? 'Update Career Goals' : 'Create Career Roadmap'}
              </h2>
              <p className="text-xs text-text-muted font-body">
                Share your background and goal to let AI generate your custom transition path.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-text-muted hover:text-text-heading hover:bg-border-light transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Active Generation State or Intake Form */}
        {isLoading ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary-shadow/30">
                <Compass className="w-10 h-10 animate-pulse text-primary" strokeWidth={2} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
              </span>
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-bold text-text-heading tracking-tight font-display">
                Crafting Your Custom Career Roadmap
              </h3>
              <p className="text-xs font-semibold text-primary transition-all duration-300">
                {CAREER_GENERATION_STAGES[generationStage]}
              </p>
              <p className="text-xs text-text-muted leading-relaxed font-body">
                Claude AI is evaluating your competencies and structuring progressive milestone phases toward{' '}
                <strong className="text-text-heading font-semibold">{targetRole || 'your target role'}</strong>.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-bg-main rounded-full h-2 overflow-hidden border border-border-light">
              <div
                className="bg-primary h-full transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${((generationStage + 1) / CAREER_GENERATION_STAGES.length) * 92}%` }}
              />
            </div>
            <p className="text-[11px] text-text-muted font-mono">
              Estimated duration: ~15–25 seconds
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar font-body">

          {/* Current Role & Target Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentRole" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>Current Role / Background</span> <span className="text-rose-500">*</span>
              </label>
              <input
                id="currentRole"
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. 2nd Year CS Student, Self-taught"
                required
                className="w-full px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="targetRole" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <Target className="w-3.5 h-3.5 text-purple-500" />
                <span>Target Role / Future Goal</span> <span className="text-rose-500">*</span>
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full-Stack Developer, AI Engineer"
                required
                className="w-full px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors"
              />
              {/* Target Role Quick Picks */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Quick Pick:</span>
                {TARGET_ROLE_SUGGESTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      targetRole === role
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-bg-main hover:bg-primary-light border border-border-light hover:border-primary/40 text-text-muted hover:text-primary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Education & Learning Preference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="educationLevel" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Education / Experience Level</span>
              </label>
              <Select
                id="educationLevel"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                options={EDUCATION_LEVEL_OPTIONS}
                autoWidth={false}
                size="md"
                ariaLabel="Education or experience level"
              />
            </div>

            <div>
              <label htmlFor="preferredLearningStyle" className="block text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                Learning Style Preference
              </label>
              <Select
                id="preferredLearningStyle"
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value)}
                options={LEARNING_STYLE_OPTIONS}
                autoWidth={false}
                size="md"
                ariaLabel="Learning style preference"
              />
            </div>
          </div>

          {/* Timeline & Study Time Commitment Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timelineMonths" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Target Timeline (Months)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="timelineMonths"
                  type="range"
                  min="1"
                  max="24"
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono min-w-16 text-right">
                  {timelineMonths} mo{timelineMonths > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="weeklyHours" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Weekly Study Time (Hours)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="weeklyHours"
                  type="range"
                  min="2"
                  max="60"
                  step="2"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono min-w-16 text-right">
                  {weeklyHours} hrs/wk
                </span>
              </div>
            </div>
          </div>

          {/* Skills Builder */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-text-heading uppercase tracking-wider">
              Your Known Skills & Technologies
            </span>

            <div className="flex flex-wrap gap-2 py-1">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading"
                >
                  <span className="font-semibold">{skill.skillName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary-light text-primary text-[10px] uppercase font-bold tracking-wider">
                    {skill.proficiency}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-text-muted hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-text-muted italic py-1">No skills added yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add a skill (e.g. React, SQL, Python)"
                className="flex-1 px-3.5 py-2 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary"
              />
              <Select
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(e.target.value)}
                options={PROFICIENCY_OPTIONS}
                size="md"
                autoWidth={true}
                ariaLabel="Skill proficiency level"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 bg-border-light hover:bg-border-medium text-text-heading rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>

            {/* Quick Add Popular Skills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Suggestions:</span>
              {POPULAR_SKILLS.filter(s => !skills.some(k => k.skillName.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkills([...skills, { skillName: s, proficiency: 'intermediate' }])}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-bg-main hover:bg-emerald-500/10 border border-border-light hover:border-emerald-500/30 text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border-light flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-border-medium text-text-body hover:bg-border-light text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !currentRole.trim() || !targetRole.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

      </div>
    </div>
  );
};

export default CareerIntakeModal;
