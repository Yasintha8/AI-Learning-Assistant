import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from '../../utils/toast';
import Button from '../../components/common/Button';

const QuizTakePage = () => {

  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error('Failed to fetch quiz.');
        console.error(error);
      } finally {
        setLoading(false)
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => {
        const question = quiz.questions.find(q => q._id === questionId);
        const questionIndex = quiz.questions.findIndex(q => q._id === questionId);
        const optionIndex = selectedAnswers[questionId];
        const selectedAnswer = question.options[optionIndex];
        return { questionIndex, selectedAnswer };
      });

      const response = await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      if (response.masteryUpdated) {
        toast.success('Mastery updated for this document\'s learning path!', { icon: '🎯' });
      }
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex item-center justify-center min-h-[60vh]">
        <Spinner />
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

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <PageHeader title={quiz.title || 'Take Quiz'} />
      </div>

      {/* Progress Bar Container */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-text-heading bg-primary-light px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-text-muted">
            {answeredCount} answered
          </span>
        </div>

        {/* Track */}
        <div className="w-full bg-border-light h-2.5 rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_var(--color-primary-shadow)]"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-bg-card border border-border-medium rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-2 h-6 bg-primary rounded-full" />
          <span className="text-xs font-bold tracking-wider uppercase text-text-muted">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <h3 className="font-body text-xl md:text-lg font-bold text-text-heading leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="mt-6 flex flex-col gap-3 font-body">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;

            return (
              <label
                key={index}
                className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none
          ${isSelected
                    ? 'border-primary bg-primary-light/40 shadow-sm shadow-primary-shadow'
                    : 'border-border-medium bg-bg-card hover:border-primary-hover hover:bg-primary-light/10'
                  }`}
              >
                {/* Hidden Native Radio Input (Keeps it accessible) */}
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />

                {/* Left Side: Custom Radio + Text */}
                <div className="flex items-center gap-4">
                  {/* Custom Radio Button */}
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
              ${isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border-medium bg-bg-card group-hover:border-primary-hover'
                      }`}
                  >
                    {/* Inner Dot for Selected Radio */}
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white animate-fade-in" />
                    )}
                  </div>

                  {/* Option Text */}
                  <span
                    className={`text-base font-medium transition-colors duration-200 
              ${isSelected ? 'text-text-heading font-semibold' : 'text-text-body group-hover:text-text-heading'}`}
                  >
                    {option}
                  </span>
                </div>

                {/* Right Side: Selected Checkmark Icon */}
                {isSelected && (
                  <CheckCircle2
                    className="w-5 h-5 text-primary shrink-0 animate-fade-in"
                    strokeWidth={2.5}
                  />
                )}
              </label>
            );
          })}
        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-border-light flex items-center justify-between font-body">
        {/* Previous Button */}
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 || submitting}
          variant="secondary"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-border-medium text-text-body bg-bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-text-muted" strokeWidth={2.5} />
          Previous
        </Button>

        {/* Next or Submit Button */}
        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="relative group overflow-hidden flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover disabled:bg-primary/60 disabled:cursor-not-allowed rounded-xl shadow-md shadow-primary-shadow/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            {submitting ? (
              <>
                <Spinner size="sm" tone="white" inline />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                <span>Submit Quiz</span>
              </>
            )}
          </button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-primary-shadow/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
          </Button>
        )}
      </div>


      {/* Question Navigation Dots */}
      <div className="flex items-center justify-center flex-wrap gap-2.5 p-4 rounded-xl font-body">
        {quiz.questions.map((_, index) => {
          const isAnsweredQuestion = selectedAnswers.hasOwnProperty(quiz.questions[index]._id);
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={submitting}
              className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all duration-200 select-none
          ${isCurrent
                  ? 'bg-primary text-white shadow-md shadow-primary-shadow/50 scale-105 ring-2 ring-offset-2 ring-primary dark:ring-offset-bg-card'
                  : isAnsweredQuestion
                    ? 'bg-primary-light text-primary hover:bg-primary/20 font-semibold'
                    : 'bg-border-light text-text-muted hover:bg-border-medium hover:text-text-heading'
                } 
          disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100`}
            >
              {index + 1}
            </button>
          );
        })}

      </div>
    </div>
  )
}

export default QuizTakePage;