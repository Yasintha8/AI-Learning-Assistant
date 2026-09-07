import { useState, useEffect } from 'react';
import CareerIntakeModal from '../../components/career/CareerIntakeModal';
import CareerRoadmap from '../../components/career/CareerRoadmap';
import CareerCounselorChat from '../../components/career/CareerCounselorChat';
import {
  getCareerData,
  saveCareerProfile,
  updateMilestoneProgress,
  sendCounselorMessage
} from '../../services/careerService';
import toast from '../../utils/toast';
import {
  Compass,
  Sparkles,
  Layers,
  MessageSquare,
  Edit3,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase,
  Target
} from 'lucide-react';

const CareerPage = () => {
  const [profile, setProfile] = useState(null);
  const [careerPath, setCareerPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' | 'chat'

  const fetchCareerData = async () => {
    try {
      const response = await getCareerData();
      if (response.success && response.data) {
        setProfile(response.data.profile);
        setCareerPath(response.data.careerPath);
        if (!response.data.profile) {
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch career data:', error);
      toast.error('Failed to load career path data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve();
      if (active) {
        fetchCareerData();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (profileData) => {
    try {
      setIsSubmitting(true);
      const response = await saveCareerProfile(profileData);
      if (response.success && response.data) {
        setProfile(response.data.profile);
        setCareerPath(response.data.careerPath);
        setIsModalOpen(false);
        toast.success(response.message || 'Career roadmap generated successfully!');
      }
    } catch (error) {
      console.error('Error saving career profile:', error);
      toast.error(error.response?.data?.error || 'Failed to generate career roadmap');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTopic = async (milestoneId, topicIndex, isCompleted) => {
    try {
      const response = await updateMilestoneProgress({
        milestoneId,
        topicIndex,
        isCompleted
      });
      if (response.success && response.data) {
        setCareerPath(response.data);
      }
    } catch (error) {
      console.error('Error updating topic completion:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, topicIndex, isCompleted, status) => {
    try {
      const response = await updateMilestoneProgress({
        milestoneId,
        status
      });
      if (response.success && response.data) {
        setCareerPath(response.data);
        toast.success(`Milestone status updated`);
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast.error('Failed to update milestone status');
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return;

    const trimmed = messageText.trim();
    const userMsg = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    // Optimistically add user message to chat history immediately
    setCareerPath(prev => ({
      ...prev,
      chatHistory: [...(prev?.chatHistory || []), userMsg]
    }));

    try {
      setIsSendingChat(true);
      const response = await sendCounselorMessage(trimmed);
      if (response.success && response.data) {
        setCareerPath(prev => ({
          ...prev,
          chatHistory: response.data.chatHistory
        }));
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error(error.response?.data?.error || 'Failed to get response from AI counselor');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs transition-all">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          {/* Role Header & Subtitle */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-light border border-primary/20 rounded-full text-primary text-xs font-semibold shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              <span>AI Career Navigator & Strategic Planning</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-heading tracking-tight font-display">
                {profile ? profile.targetRole : 'Personalized Career Path & Guidance'}
              </h1>

              {profile ? (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs sm:text-sm text-text-muted font-body">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-main border border-border-light rounded-xl font-medium text-text-body">
                    <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                    <span>{profile.currentRole}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-light border border-primary/20 rounded-xl font-bold text-primary">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.targetRole}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-bg-main border border-border-light rounded-xl text-xs font-mono font-bold text-text-muted">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {profile.timelineMonths} mos • {profile.weeklyHours} hrs/wk
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-muted font-body leading-relaxed">
                  Define your current background and target role to generate a step-by-step career path roadmap with AI-curated skill gaps and portfolio project ideas.
                </p>
              )}
            </div>
          </div>

          {/* Job Readiness Metric Card & Action */}
          <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
            {profile && careerPath && (
              <div className="flex items-center gap-3.5 px-5 py-3.5 bg-bg-main/80 backdrop-blur-sm border border-border-medium rounded-2xl shadow-2xs">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-2xs">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-0.5">
                    Job Readiness Score
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-center gap-1">
                    <span>{careerPath.readinessScore || 0}%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{profile ? 'Edit Career Goal' : 'Start Intake Wizard'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-16 text-center bg-bg-card border border-border-light rounded-3xl space-y-4 shadow-xs">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted font-medium">Loading your career navigator data...</p>
        </div>
      ) : !profile ? (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center bg-bg-card border border-border-light rounded-3xl space-y-6 shadow-xs">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 via-purple-500/20 to-emerald-500/20 text-primary rounded-3xl border border-primary/30 flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-text-heading font-display">No Career Goal Set Yet</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body">
              Take the quick career intake wizard to outline your current background and target role. AI will construct a personalized, multi-phase roadmap for you.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Build My Career Roadmap</span>
          </button>
        </div>
      ) : (
        /* Main Tabbed Interface */
        <div className="space-y-6">

          {/* Segmented Tab Control */}
          <div className="flex items-center gap-2 p-1.5 bg-bg-card border border-border-light rounded-2xl max-w-md shadow-2xs">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'roadmap'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-muted hover:text-text-heading'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Roadmap & Skill Gaps</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'chat'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-muted hover:text-text-heading'
                }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Counselor Chat</span>
            </button>
          </div>

          {/* Tab 1: Roadmap & Skills */}
          {activeTab === 'roadmap' && (
            <CareerRoadmap
              careerPath={careerPath}
              onToggleTopic={handleToggleTopic}
              onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
            />
          )}

          {/* Tab 2: AI Counselor Chat */}
          {activeTab === 'chat' && (
            <CareerCounselorChat
              chatHistory={careerPath?.chatHistory || []}
              onSendMessage={handleSendMessage}
              isLoading={isSendingChat}
              targetRole={profile?.targetRole}
            />
          )}

        </div>
      )}

      {/* Career Intake Modal */}
      {isModalOpen && (
        <CareerIntakeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveProfile}
          initialProfile={profile}
          isLoading={isSubmitting}
        />
      )}

    </div>
  );
};

export default CareerPage;
