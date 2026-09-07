import { useState } from 'react';
import { X, Sparkles, Plus, Briefcase, Target, Clock, Calendar, BookOpen } from 'lucide-react';

const CareerIntakeModal = ({ isOpen, onClose, onSubmit, initialProfile, isLoading }) => {
  const [currentRole, setCurrentRole] = useState(initialProfile?.currentRole || '');
  const [educationLevel, setEducationLevel] = useState(initialProfile?.educationLevel || 'Undergraduate Student');
  const [targetRole, setTargetRole] = useState(initialProfile?.targetRole || '');
  const [timelineMonths, setTimelineMonths] = useState(initialProfile?.timelineMonths || 6);
  const [weeklyHours, setWeeklyHours] = useState(initialProfile?.weeklyHours || 10);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(initialProfile?.preferredLearningStyle || 'hands-on');

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

        {/* Form Container */}
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
            </div>
          </div>

          {/* Education & Learning Preference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="educationLevel" className="flex items-center gap-1.5 text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Education / Experience Level</span>
              </label>
              <select
                id="educationLevel"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading focus:outline-none focus:border-primary transition-colors"
              >
                <option value="High School / Self-taught">High School / Self-taught</option>
                <option value="Undergraduate Student">Undergraduate Student</option>
                <option value="Postgraduate / Master's">Postgraduate / Master's</option>
                <option value="Junior Professional (0-2 yrs)">Junior Professional (0-2 yrs)</option>
                <option value="Experienced Professional (3+ yrs)">Experienced Professional (3+ yrs)</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredLearningStyle" className="block text-xs font-bold text-text-heading uppercase tracking-wider mb-2">
                Learning Style Preference
              </label>
              <select
                id="preferredLearningStyle"
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading focus:outline-none focus:border-primary transition-colors"
              >
                <option value="hands-on">Hands-On Projects & Code</option>
                <option value="structured-theory">Structured Reading & Documentation</option>
                <option value="video-based">Video Tutorials & Guided Labs</option>
                <option value="fast-track">Fast-Track / Interview Prep Intensive</option>
              </select>
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
              <select
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(e.target.value)}
                className="px-3 py-2 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading focus:outline-none focus:border-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 bg-border-light hover:bg-border-medium text-text-heading rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
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

      </div>
    </div>
  );
};

export default CareerIntakeModal;
