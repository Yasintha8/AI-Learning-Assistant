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
  Search
} from 'lucide-react';

const LearningPathsOverviewPage = () => {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPaths = combinedPaths.filter(item =>
    item.document.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall aggregate metrics
  const totalTrackedTopics = combinedPaths.reduce((acc, curr) => acc + curr.totalTopics, 0);
  const totalMastered = combinedPaths.reduce((acc, curr) => acc + curr.masteredCount, 0);
  const totalWeak = combinedPaths.reduce((acc, curr) => acc + curr.weakCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Map className="w-3.5 h-3.5" />
              <span>Document Concept Map & Mastery</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-heading tracking-tight font-display">
              Learning Paths Hub
            </h1>
            <p className="text-sm text-text-muted leading-relaxed font-body">
              Track concept mastery, study recommendations, and weak area focus across all your uploaded documents.
            </p>
          </div>

          {/* Quick Aggregate Stats Bar */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="px-4 py-3 bg-bg-main border border-border-medium rounded-2xl text-center">
              <div className="text-xl font-black text-text-heading font-mono">{documents.length}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Documents</div>
            </div>
            <div className="px-4 py-3 bg-bg-main border border-border-medium rounded-2xl text-center">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalMastered}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Mastered</div>
            </div>
            <div className="px-4 py-3 bg-bg-main border border-border-medium rounded-2xl text-center">
              <div className="text-xl font-black text-amber-500 font-mono">{totalWeak}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Weak Areas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Search Input */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learning paths by document title..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors font-body shadow-xs"
            />
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
        <div className="p-12 text-center bg-bg-card border border-border-light rounded-3xl space-y-6 shadow-xs">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Map className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-text-heading">No Documents Uploaded Yet</h2>
            <p className="text-xs text-text-muted leading-relaxed font-body">
              Upload your first study document to automatically generate a personalized learning path with concept tracking, quizzes, and flashcards.
            </p>
          </div>
          <Link
            to="/documents"
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Upload Document
          </Link>
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="p-8 text-center bg-bg-card border border-border-light rounded-2xl text-xs text-text-muted">
          No learning paths match your search query "{searchQuery}".
        </div>
      ) : (
        /* Document Learning Paths Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPaths.map(({ document, learningPath, totalTopics, masteredCount, weakCount, inProgressCount, overallScore }) => (
            <div
              key={document._id}
              className="p-6 bg-bg-card border border-border-light hover:border-border-medium rounded-3xl shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Top Row: Document Type Badge & Created Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-primary-light text-primary border border-primary/20 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    {document.fileType || 'Document'}
                  </span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Document Title */}
                <h3 className="text-base sm:text-lg font-bold text-text-heading group-hover:text-primary transition-colors tracking-tight line-clamp-2 mb-2 font-display">
                  {document.title}
                </h3>

                {/* Overall Mastery Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted">Concept Mastery</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{overallScore}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(overallScore, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Badges */}
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-center">
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">{masteredCount}</div>
                    <div className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase">Mastered</div>
                  </div>

                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-center">
                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 font-mono">{inProgressCount}</div>
                    <div className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80 uppercase">In Progress</div>
                  </div>

                  <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-center">
                    <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">{weakCount}</div>
                    <div className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase">Needs Focus</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-4 border-t border-border-light flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">
                  {totalTopics > 0 ? `${totalTopics} topics tracked` : 'Ready to generate path'}
                </span>
                
                <Link
                  to={`/documents/${document._id}/learning-path`}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Open Learning Path</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
