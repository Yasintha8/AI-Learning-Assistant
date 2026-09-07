import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import learningPathService from '../../services/learningPathService';
import documentService from '../../services/documentService';
import toast from '../../utils/toast';
import {
  Map,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  Layers,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Award
} from 'lucide-react';

const LearningPathsOverviewPage = () => {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const userId = user.id || user._id;

        // Fetch user learning paths and documents in parallel
        const [lpRes, docsRes] = await Promise.all([
          learningPathService.getAllLearningPaths(userId).catch(() => ({ data: [] })),
          documentService.getDocuments().catch(() => ({ data: [] }))
        ]);

        const paths = lpRes.data || lpRes || [];
        const docs = docsRes.data?.documents || docsRes.data || docsRes || [];

        setLearningPaths(paths);
        setDocuments(Array.isArray(docs) ? docs : []);
      } catch (error) {
        console.error('Error fetching learning paths hub data:', error);
        toast.error('Failed to load learning paths');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Combine documents with their respective learning path stats
  const combinedPaths = documents.map(doc => {
    const lp = learningPaths.find(p => p.documentId?._id === doc._id || p.documentId === doc._id);
    const topics = lp?.topics || [];
    const totalTopics = topics.length;
    const masteredCount = topics.filter(t => t.status === 'mastered').length;
    const weakCount = topics.filter(t => t.status === 'weak').length;
    const inProgressCount = topics.filter(t => t.status === 'in-progress').length;
    const overallScore = totalTopics > 0
      ? Math.round(topics.reduce((sum, topic) => sum + (topic.masteryScore || 0), 0) / totalTopics)
      : 0;

    return {
      document: doc,
      learningPath: lp,
      totalTopics,
      masteredCount,
      weakCount,
      inProgressCount,
      overallScore,
    };
  });

  const filteredPaths = combinedPaths.filter(item => {
    const matchesSearch = item.document.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'mastered') return item.overallScore >= 80 || (item.masteredCount > 0 && item.weakCount === 0);
    if (statusFilter === 'needs-focus') return item.weakCount > 0 || (item.totalTopics > 0 && item.overallScore < 50);
    return true;
  });

  // Overall aggregate metrics
  const totalTrackedTopics = combinedPaths.reduce((acc, curr) => acc + curr.totalTopics, 0);
  const totalMastered = combinedPaths.reduce((acc, curr) => acc + curr.masteredCount, 0);
  const totalWeak = combinedPaths.reduce((acc, curr) => acc + curr.weakCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-60 h-60 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs">
              <Map className="w-3.5 h-3.5" />
              <span>Concept Mapping & Knowledge Mastery</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-heading tracking-tight font-display">
              Learning Paths Hub
            </h1>
            <p className="text-sm text-text-muted leading-relaxed font-body">
              Track concept mastery across your uploaded study documents. View AI-generated topic breakdowns, identify weak areas, and follow personalized study plans.
            </p>
          </div>

          {/* Quick Aggregate Stats Bar */}
          <div className="grid grid-cols-3 gap-3 shrink-0 sm:flex sm:items-center">
            <div className="px-4 py-3.5 bg-bg-main/80 backdrop-blur-sm border border-border-medium/80 rounded-2xl text-center shadow-2xs min-w-[100px]">
              <div className="flex items-center justify-center gap-1.5 text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">
                <FileText className="w-3 h-3" />
                <span>Documents</span>
              </div>
              <div className="text-2xl font-black text-text-heading font-mono">{documents.length}</div>
            </div>

            <div className="px-4 py-3.5 bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 rounded-2xl text-center shadow-2xs min-w-[100px]">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600/80 dark:text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Award className="w-3 h-3" />
                <span>Mastered</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalMastered}</div>
            </div>

            <div className="px-4 py-3.5 bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-2xl text-center shadow-2xs min-w-[100px]">
              <div className="flex items-center justify-center gap-1.5 text-amber-600/80 dark:text-amber-400/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Weak Areas</span>
              </div>
              <div className="text-2xl font-black text-amber-500 font-mono">{totalWeak}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Filter Controls */}
      {documents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-card p-2.5 border border-border-light rounded-2xl shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learning paths by document title..."
              className="w-full pl-10 pr-4 py-2 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-bg-main p-1 rounded-xl border border-border-light text-xs font-semibold text-text-muted self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all'
                  ? 'bg-bg-card text-primary font-bold shadow-2xs border border-border-light'
                  : 'hover:text-text-heading'
                }`}
            >
              All Paths ({combinedPaths.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'mastered'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                  : 'hover:text-text-heading'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>High Mastery</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs-focus')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'needs-focus'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                  : 'hover:text-text-heading'
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Needs Focus</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-16 text-center bg-bg-card border border-border-light rounded-3xl space-y-4 shadow-xs">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted font-medium">Loading your document learning paths...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center bg-bg-card border border-border-light rounded-3xl space-y-6 shadow-xs">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-primary/20 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
            <Map className="w-10 h-10" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-text-heading font-display">No Learning Paths Yet</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-body">
              Upload your first study document to automatically generate a personalized learning path with concept tracking, quizzes, and flashcards.
            </p>
          </div>
          <Link
            to="/documents"
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Your First Document</span>
          </Link>
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="p-12 text-center bg-bg-card border border-border-light rounded-3xl space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-bg-main border border-border-medium rounded-2xl flex items-center justify-center mx-auto text-text-muted">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-text-heading">No matching learning paths</p>
          <p className="text-xs text-text-muted">Try clearing your search query or changing the status filter.</p>
        </div>
      ) : (
        /* Document Learning Paths Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPaths.map(({ document, learningPath, totalTopics, masteredCount, weakCount, inProgressCount, overallScore }) => (
            <div
              key={document._id}
              className="p-6 bg-bg-card border border-border-light hover:border-primary/40 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5 group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Top Row: Document Type Badge & Created Date */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-primary-light text-primary border border-primary/20 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    {document.fileType || 'Document'}
                  </span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {new Date(document.updatedAt || document.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Document Title */}
                <h3 className="text-lg font-bold text-text-heading group-hover:text-primary transition-colors tracking-tight line-clamp-2 font-display leading-snug">
                  {document.title}
                </h3>

                {/* Overall Mastery Progress Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-muted flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      Concept Mastery
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">{overallScore}%</span>
                  </div>
                  <div className="w-full h-3 bg-bg-main border border-border-light rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(overallScore, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Badges */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">{masteredCount}</div>
                    <div className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Mastered</div>
                  </div>

                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-center">
                    <div className="text-base font-black text-indigo-700 dark:text-indigo-400 font-mono">{inProgressCount}</div>
                    <div className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider">In Progress</div>
                  </div>

                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center">
                    <div className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">{weakCount}</div>
                    <div className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">Needs Focus</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-4 border-t border-border-light/80 flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                  {totalTopics > 0 ? `${totalTopics} topics tracked` : 'Ready to generate path'}
                </span>

                <Link
                  to={`/documents/${document._id}/learning-path`}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs group-hover:shadow-sm cursor-pointer"
                >
                  <span>Open Path</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default LearningPathsOverviewPage;
