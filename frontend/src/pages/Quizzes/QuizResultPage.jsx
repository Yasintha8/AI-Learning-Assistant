import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import learningPathService from '../../services/learningPathService';
import PageHeader from '../../components/common/PageHeader';
import toast from '../../utils/toast';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  BookOpen,
  Map,
  RotateCcw,
  Sparkles,
  Filter
} from 'lucide-react';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weakAreasEligible, setWeakAreasEligible] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'missed' | 'correct'

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);

        // Check if user is eligible for weak areas / learning path view
        const documentId = data?.data?.quiz?.document?._id;
        if (documentId) {
          try {
            const status = await learningPathService.getWeakAreasStatus(documentId);
            setWeakAreasEligible(!!status.data?.eligible);
          } catch (statusError) {
            console.error(statusError);
          }
        }
      } catch (error) {
        toast.error('Failed to fetch quiz results.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId]);

  const { data: { quiz, results: detailedResults } = {} } = results || {};

  // Compute filtered questions list
  const filteredResults = useMemo(() => {
    if (!detailedResults) return [];
    if (reviewFilter === 'missed') {
      return detailedResults.map((r, originalIndex) => ({ ...r, originalIndex })).filter((r) => !r.isCorrect);
    }
    if (reviewFilter === 'correct') {
      return detailedResults.map((r, originalIndex) => ({ ...r, originalIndex })).filter((r) => r.isCorrect);
    }
    return detailedResults.map((r, originalIndex) => ({ ...r, originalIndex }));
  }, [detailedResults, reviewFilter]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse" aria-busy="true" aria-label="Loading quiz results">
        {/* Result Hero Score Card Skeleton */}
        <div className="bg-bg-card border border-border-light rounded-3xl p-8 shadow-xs flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-24 h-24 rounded-full bg-border-medium/60" />
          <div className="h-6 w-48 bg-border-medium/60 rounded-md" />
          <div className="h-4 w-64 bg-border-light rounded-md" />
          <div className="flex gap-4 pt-4">
            <div className="h-10 w-28 bg-border-light rounded-xl" />
            <div className="h-10 w-28 bg-border-light rounded-xl" />
          </div>
        </div>

        {/* Question Breakdown Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-40 bg-border-medium/60 rounded" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-3/4 bg-border-medium/60 rounded" />
                <div className="h-6 w-16 bg-border-light rounded-full" />
              </div>
              <div className="h-3 w-1/2 bg-border-light rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!results || !results.data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-text-muted text-sm">Quiz results not found.</p>
        </div>
      </div>
    );
  }

  const score = quiz.score;
  const totalQuestions = detailedResults.length;
  const correctAnswers = detailedResults.filter((r) => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Outstanding! You have mastered this material.';
    if (score >= 80) return 'Great job! Strong conceptual understanding.';
    if (score >= 70) return 'Good work! A quick review of missed topics will get you to mastery.';
    if (score >= 60) return 'Decent start! Focus on the missed questions below to level up.';
    return 'Keep practicing! Review the explanations below and try retaking the quiz.';
  };

  return (
    <div className="max-w-5xl mx-auto font-body animate-fade-in flex flex-col gap-6 pb-12">
      {/* Back Button */}
      <Link
        to={`/documents/${quiz.document._id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors duration-200 group w-fit"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={2.5} />
        Back to Document
      </Link>

      {/* Header */}
      <PageHeader title={`${quiz.title || 'Quiz'} Results`} />

      {/* Score Card */}
      <div className="bg-bg-card border border-border-medium rounded-3xl p-8 flex flex-col items-center gap-4 text-center shadow-xs">
        {/* Celebration Badge for High Scores */}
        {score >= 80 ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider animate-pulse shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>Mastery Achieved! High Performance</span>
          </div>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Your Performance
          </p>
        )}

        <div className="w-20 h-20 rounded-3xl bg-primary-light flex items-center justify-center shadow-md shadow-primary-shadow border border-primary/20">
          <Trophy className="w-10 h-10 text-primary" strokeWidth={2.25} />
        </div>

        <div
          className={`text-6xl md:text-7xl font-black tracking-tight font-display bg-linear-to-r ${getScoreColor(
            score
          )} bg-clip-text text-transparent`}
        >
          {score}%
        </div>

        <p className="text-sm md:text-base font-medium text-text-body max-w-lg leading-relaxed">
          {getScoreMessage(score)}
        </p>

        {/* Stats Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full pt-2">
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-main border border-border-medium rounded-xl">
            <Target className="w-4 h-4 text-text-muted" strokeWidth={2} />
            <span className="text-xs font-bold text-text-body">{totalQuestions} Total Questions</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-bold">{correctAnswers} Correct</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
            <XCircle className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-bold">{incorrectAnswers} Incorrect</span>
          </div>
        </div>

        {/* Quick Retake Action from Hero Card */}
        <div className="pt-2">
          <Link
            to={`/quizzes/${quizId}/take`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary-light/40 text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Retake This Quiz</span>
          </Link>
        </div>
      </div>

      {/* Detailed Review Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-text-heading tracking-tight font-display">
              Detailed Question Review
            </h3>
          </div>

          {/* Missed Questions Filter Tabs */}
          <div className="flex items-center gap-1 bg-bg-main p-1 rounded-xl border border-border-medium text-xs font-bold w-fit self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reviewFilter === 'all'
                  ? 'bg-bg-card text-text-heading shadow-xs border border-border-light'
                  : 'text-text-muted hover:text-text-heading'
              }`}
            >
              All ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('missed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reviewFilter === 'missed'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-500/30'
                  : 'text-text-muted hover:text-rose-600'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Missed ({incorrectAnswers})</span>
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('correct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                  : 'text-text-muted hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correct ({correctAnswers})</span>
            </button>
          </div>
        </div>

        {/* Filtered Empty State */}
        {filteredResults.length === 0 ? (
          <div className="p-8 text-center bg-bg-card border border-border-light rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-text-heading">
              {reviewFilter === 'missed' ? 'Flawless! No missed questions.' : 'No questions in this filter.'}
            </h4>
            <p className="text-xs text-text-muted">
              {reviewFilter === 'missed'
                ? 'You answered every question correctly on this attempt.'
                : 'Try switching the filter above to view all questions.'}
            </p>
          </div>
        ) : (
          filteredResults.map((result) => {
            const userAnswerIndex = result.options.findIndex((opt) => opt === result.selectedAnswer);
            const correctAnswerIndex = result.correctOption - 1;
            const isCorrect = result.isCorrect;

            return (
              <div
                key={result.originalIndex}
                className="bg-bg-card border border-border-light rounded-3xl p-6 flex flex-col gap-4 shadow-xs"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-light text-xs font-bold text-primary w-fit font-mono">
                      Question {result.originalIndex + 1}
                    </span>
                    <h4 className="text-base font-bold text-text-heading leading-snug">
                      {result.question}
                    </h4>
                  </div>
                  <div
                    className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center border-2 ${
                      isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      <XCircle className="w-5 h-5" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Options Review */}
                <div className="flex flex-col gap-2.5 font-body">
                  {result.options.map((option, optIndex) => {
                    const isCorrectOption = optIndex === correctAnswerIndex;
                    const isUserAnswer = optIndex === userAnswerIndex;
                    const isWrongAnswer = isUserAnswer && !isCorrect;

                    return (
                      <div
                        key={optIndex}
                        className={`relative px-4 py-3 rounded-2xl border-2 transition-all duration-150 ${
                          isCorrectOption
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-300'
                            : isWrongAnswer
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-300'
                            : 'bg-bg-main border-border-light text-text-body'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-sm font-medium ${
                              isCorrectOption
                                ? 'font-bold text-emerald-700 dark:text-emerald-300'
                                : isWrongAnswer
                                ? 'font-bold text-rose-600 dark:text-rose-400'
                                : 'text-text-body'
                            }`}
                          >
                            {option}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCorrectOption && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Correct Answer
                              </span>
                            )}
                            {isWrongAnswer && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-lg">
                                <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {result.explanation && (
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-950 dark:text-amber-200">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Explanation
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-border-light">
        <Link
          to={`/quizzes/${quizId}/take`}
          className="relative inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-primary text-primary hover:bg-primary-light/50 text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2} />
          <span>Retake Quiz</span>
        </Link>

        {weakAreasEligible && (
          <Link
            to={`/documents/${quiz.document._id}/learning-path`}
            className="relative inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white text-sm font-semibold overflow-hidden group shadow-sm shadow-primary-shadow"
          >
            <span className="absolute inset-0 bg-linear-to-r from-emerald-500 to-teal-500" />
            <span className="absolute inset-0 bg-linear-to-r from-emerald-600 to-teal-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            <Map className="w-4 h-4 relative z-10" strokeWidth={2} />
            <span className="relative z-10">View Learning Path</span>
          </Link>
        )}

        <Link
          to={`/documents/${quiz.document._id}`}
          className="relative inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white text-sm font-semibold overflow-hidden group shadow-sm shadow-primary-shadow"
        >
          <span className="absolute inset-0 bg-linear-to-r from-primary to-blue-400" />
          <span className="absolute inset-0 bg-linear-to-r from-primary-hover to-cyan-400 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
          <ArrowLeft className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
          <span className="relative z-10">Back to Document</span>
        </Link>
      </div>
    </div>
  );
};

export default QuizResultPage;