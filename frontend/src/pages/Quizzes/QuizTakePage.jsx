import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Keyboard } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from '../../utils/toast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error('Failed to fetch quiz.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = useCallback((questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [quiz, currentQuestionIndex]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Compute list of indices of unanswered questions
  const unansweredIndices = useMemo(() => {
    if (!quiz?.questions) return [];
    return quiz.questions
      .map((q, idx) => (!selectedAnswers.hasOwnProperty(q._id) ? idx : null))
      .filter((idx) => idx !== null);
  }, [quiz, selectedAnswers]);

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setShowUnansweredModal(false);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map((questionId) => {
        const question = quiz.questions.find((q) => q._id === questionId);
        const questionIndex = quiz.questions.findIndex((q) => q._id === questionId);
        const optionIndex = selectedAnswers[questionId];
        const selectedAnswer = question.options[optionIndex];
        return { questionIndex, selectedAnswer };
      });

      const response = await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      if (response.masteryUpdated) {
        toast.success("Mastery updated for this document's learning path!", { icon: '🎯' });
      }
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateSubmit = useCallback(() => {
    if (unansweredIndices.length > 0) {
      setShowUnansweredModal(true);
    } else {
      handleSubmitQuiz();
    }
  }, [unansweredIndices]);

  // Keyboard shortcut listener (1-4, A-D, Arrows, Enter)
  const handleKeyDown = useCallback(
    (e) => {
      if (showUnansweredModal || submitting) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const currentQ = quiz?.questions?.[currentQuestionIndex];
      if (!currentQ) return;

      const key = e.key.toLowerCase();

      // Number keys 1-4
      if (['1', '2', '3', '4'].includes(key)) {
        const optIdx = parseInt(key, 10) - 1;
        if (optIdx < currentQ.options.length) {
          e.preventDefault();
          handleOptionChange(currentQ._id, optIdx);
          return;
        }
      }

      // Letter keys a-d
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const optIdx = key.charCodeAt(0) - 97;
        if (optIdx < currentQ.options.length) {
          e.preventDefault();
          handleOptionChange(currentQ._id, optIdx);
          return;
        }
      }

      // Navigation shortcuts
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextQuestion();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousQuestion();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentQuestionIndex === quiz.questions.length - 1) {
          handleInitiateSubmit();
        } else {
          handleNextQuestion();
        }
      }
    },
    [
      quiz,
      currentQuestionIndex,
      showUnansweredModal,
      submitting,
      handleOptionChange,
      handleNextQuestion,
      handlePreviousQuestion,
      handleInitiateSubmit,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse" aria-busy="true" aria-label="Loading quiz">
        {/* Header Skeleton */}
        <div className="h-8 w-64 bg-border-medium/60 rounded-xl" />

        {/* Progress Bar Container Skeleton */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-36 bg-border-medium/60 rounded" />
            <div className="h-4 w-20 bg-border-light rounded" />
          </div>
          <div className="h-2.5 w-full bg-border-light rounded-full" />
        </div>

        {/* Question Card Skeleton */}
        <div className="bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border-light rounded" />
            <div className="h-6 w-3/4 bg-border-medium/60 rounded-lg" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl border border-border-light flex items-center gap-3 bg-bg-main/50"
              >
                <div className="w-5 h-5 rounded-full border border-border-medium/60 shrink-0" />
                <div className="h-4 w-2/3 bg-border-light rounded" />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border-light">
            <div className="h-10 w-28 bg-border-light rounded-xl" />
            <div className="h-10 w-28 bg-border-light rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz not found or has no questions.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isAnswered = selectedAnswers.hasOwnProperty(currentQuestion._id);
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12 font-body">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title={quiz.title || 'Take Quiz'} />
        
        {/* Keyboard shortcut hint banner */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card border border-border-medium text-xs text-text-muted self-start sm:self-auto shadow-2xs">
          <Keyboard className="w-4 h-4 text-primary shrink-0" />
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-medium font-mono font-bold text-text-heading">1-4</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-medium font-mono font-bold text-text-heading">A-D</kbd> to pick, <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-medium font-mono font-bold text-text-heading">← →</kbd> to navigate</span>
        </div>
      </div>

      {/* Progress & Navigator Container */}
      <div className="bg-bg-card border border-border-light rounded-3xl p-5 mb-6 shadow-xs space-y-4">
        {/* Progress Info Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary-light px-3 py-1 rounded-full border border-primary/20">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {answeredCount}/{quiz.questions.length} Answered
            </span>
            {unansweredIndices.length > 0 && (
              <span className="text-amber-500 hidden sm:inline font-mono">
                ({unansweredIndices.length} remaining)
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-border-light h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_var(--color-primary-shadow)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Jumper Bar Strip */}
        <div className="pt-2 border-t border-border-light/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Question Navigator
            </span>
            <span className="text-[11px] text-text-muted">
              Click any question to jump
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
            {quiz.questions.map((q, idx) => {
              const isAnsweredQ = selectedAnswers.hasOwnProperty(q._id);
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  disabled={submitting}
                  className={`relative shrink-0 w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-primary text-white shadow-md shadow-primary-shadow/50 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-bg-card'
                      : isAnsweredQ
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-bg-main text-text-muted border border-border-medium hover:border-text-muted hover:text-text-heading'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={`Question ${idx + 1}${isAnsweredQ ? ' (Answered)' : ' (Unanswered)'}`}
                  aria-label={`Jump to question ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {isAnsweredQ && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-bg-card" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-bg-card border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <span className="text-xs font-bold tracking-wider uppercase text-text-muted">
              Question {currentQuestionIndex + 1}
            </span>
          </div>
          {isAnswered ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Answer Selected
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
              Not Answered
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-text-heading leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options with Key Shortcut Badges */}
        <div className="mt-6 flex flex-col gap-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            const keyLabel = String(index + 1);

            return (
              <label
                key={index}
                className={`group relative flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'border-primary bg-primary-light/40 shadow-sm shadow-primary-shadow'
                    : 'border-border-medium bg-bg-main/60 hover:border-primary-hover hover:bg-primary-light/10'
                }`}
              >
                {/* Hidden Native Radio Input */}
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />

                {/* Left Side: Key Hint + Custom Radio + Option Text */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Keyboard Shortcut Key Pill */}
                  <kbd
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-bg-card border-border-medium text-text-muted group-hover:border-primary/50 group-hover:text-primary'
                    }`}
                  >
                    {keyLabel}
                  </kbd>

                  {/* Custom Radio Button */}
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border-medium bg-bg-card group-hover:border-primary-hover'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-fade-in" />}
                  </div>

                  {/* Option Text */}
                  <span
                    className={`text-sm sm:text-base font-medium transition-colors duration-200 ${
                      isSelected ? 'text-text-heading font-semibold' : 'text-text-body group-hover:text-text-heading'
                    }`}
                  >
                    {option}
                  </span>
                </div>

                {/* Right Side: Selected Checkmark Icon */}
                {isSelected && (
                  <CheckCircle2
                    className="w-5 h-5 text-primary shrink-0 animate-fade-in ml-2"
                    strokeWidth={2.5}
                  />
                )}
              </label>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-border-light flex items-center justify-between">
          {/* Previous Button */}
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            variant="secondary"
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-border-medium text-text-body bg-bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-text-muted" strokeWidth={2.5} />
            <span>Previous</span>
            <kbd className="hidden sm:inline px-1 py-0.5 bg-bg-main border border-border-light rounded text-[10px] font-mono text-text-muted">←</kbd>
          </Button>

          {/* Next or Submit Button */}
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              type="button"
              onClick={handleInitiateSubmit}
              disabled={submitting}
              className="relative group overflow-hidden flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:bg-primary/60 disabled:cursor-not-allowed rounded-xl shadow-md shadow-primary-shadow/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" tone="white" inline />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span>Finish & Submit</span>
                  <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">↵</kbd>
                </>
              )}
            </button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-primary-shadow/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <span>Next</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">→</kbd>
              <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Unanswered Questions */}
      <Modal
        isOpen={showUnansweredModal}
        onClose={() => setShowUnansweredModal(false)}
        title="Unanswered Questions Warning"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-sm">
                You have {unansweredIndices.length} unanswered {unansweredIndices.length === 1 ? 'question' : 'questions'}.
              </p>
              <p className="text-text-muted leading-relaxed">
                Submitting now will treat unanswered questions as incorrect and may lower your document mastery score.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Unanswered Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {unansweredIndices.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setShowUnansweredModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-bg-main hover:bg-border-light border border-border-medium text-xs font-bold text-text-heading hover:text-primary transition-colors cursor-pointer"
                >
                  Question #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
            <Button
              variant="secondary"
              onClick={() => {
                if (unansweredIndices.length > 0) {
                  setCurrentQuestionIndex(unansweredIndices[0]);
                }
                setShowUnansweredModal(false);
              }}
              className="text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              Review Question #{unansweredIndices[0] + 1}
            </Button>
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="text-xs font-bold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Anyway'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizTakePage;