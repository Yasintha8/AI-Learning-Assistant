import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Briefcase, Target, Clock, Calendar, BookOpen } from 'lucide-react';

const CareerIntakeModal = ({ isOpen, onClose, onSubmit, initialProfile, isLoading }) => {
  const [currentRole, setCurrentRole] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate Student');
  const [targetRole, setTargetRole] = useState('');
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('hands-on');
  
  // Skills list state
  const [skills, setSkills] = useState([
    { skillName: 'HTML / CSS', proficiency: 'intermediate' },
    { skillName: 'JavaScript', proficiency: 'beginner' }
  ]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('beginner');

  useEffect(() => {
    if (initialProfile) {
      setCurrentRole(initialProfile.currentRole || '');
      setEducationLevel(initialProfile.educationLevel || 'Undergraduate Student');
      setTargetRole(initialProfile.targetRole || '');
      setTimelineMonths(initialProfile.timelineMonths || 6);
      setWeeklyHours(initialProfile.weeklyHours || 10);
      setPreferredLearningStyle(initialProfile.preferredLearningStyle || 'hands-on');
      if (Array.isArray(initialProfile.currentSkills) && initialProfile.currentSkills.length > 0) {
        setSkills(initialProfile.currentSkills);
      }
    }
  }, [initialProfile, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white dark:from-[#192238] dark:to-[#151b2c] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
                {initialProfile ? 'Update Career Goals' : 'Create Career Roadmap'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share your background and goal to let Gemini AI generate your custom transition path.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar font-sans">
          
          {/* Current Role & Target Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Current Role / Background <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. 2nd Year CS Student, Self-taught"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Target Role / Future Goal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full-Stack Developer, AI Engineer"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
          </div>

          {/* Education & Learning Preference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Education / Experience Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors"
              >
                <option value="High School / Self-taught">High School / Self-taught</option>
                <option value="Undergraduate Student">Undergraduate Student</option>
                <option value="Postgraduate / Master's">Postgraduate / Master's</option>
                <option value="Junior Professional (0-2 yrs)">Junior Professional (0-2 yrs)</option>
                <option value="Experienced Professional (3+ yrs)">Experienced Professional (3+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Learning Style Preference
              </label>
              <select
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Target Timeline (Months)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono min-w-16 text-right">
                  {timelineMonths} mo{timelineMonths > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Weekly Study Time (Hours)
              </label>
              <div className="flex items-center gap-3">
                <input
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Your Known Skills & Technologies
            </label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                >
                  <span className="font-semibold">{skill.skillName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                    {skill.proficiency}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-slate-400 italic py-1">No skills added yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add a skill (e.g. React, SQL, Python)"
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
              <select
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !currentRole.trim() || !targetRole.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Roadmap
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
