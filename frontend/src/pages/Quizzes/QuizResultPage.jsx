import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import learningPathService from '../../services/learningPathService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from '../../utils/toast';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Target, BookOpen, Map } from 'lucide-react';

const QuizResultPage = () => {

    const { quizId } = useParams();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weakAreasEligible, setWeakAreasEligible] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const data = await quizService.getQuizResults(quizId);
                setResults(data);

                // Once the user has enough completed quizzes for this document, offer a
                // direct path to their Weak Areas / Learning Path from here.
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
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

    const { data: { quiz, results: detailedResults } } = results;
    const score = quiz.score;
    const totalQuestions = detailedResults.length;
    const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;

    const getScoreColor = (score) => {
        if (score >= 80) return 'from-emerald-500 to-teal-500';
        if (score >= 60) return 'from-amber-500 to-orange-500';
        return 'from-rose-500 to-red-500';
    };

    const getScoreMessage = (score) => {
        if (score >= 90) return 'Outstanding!';
        if (score >= 80) return 'Great job!';
        if (score >= 70) return 'Good work!';
        if (score >= 60) return 'Not bad!';
        return 'Keep Practicing!';
    };

    return (
        <div className="max-w-5xl mx-auto font-display animate-fade-in flex flex-col gap-6">

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
            <div className="bg-bg-card border border-border-medium rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center shadow-sm shadow-primary-shadow">
                    <Trophy className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Your Performance
                </p>

                <div className={`text-6xl md:text-7xl font-black tracking-tight bg-linear-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
                    {score}%
                </div>

                <p className="text-base font-medium text-text-body max-w-md">
                    {getScoreMessage(score)}
                </p>

                {/* Stats chips */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 w-full pt-2">
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-main border border-border-medium rounded-xl">
                        <Target className="w-4 h-4 text-text-muted" strokeWidth={2} />
                        <span className="text-sm font-semibold text-text-body">{totalQuestions} Total</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-light border border-primary/20 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2} />
                        <span className="text-sm font-semibold text-primary">{correctAnswers} Correct</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-error-bg border border-error-border rounded-xl">
                        <XCircle className="w-4 h-4 text-error" strokeWidth={2} />
                        <span className="text-sm font-semibold text-error">{incorrectAnswers} Incorrect</span>
                    </div>
                </div>
            </div>

            {/* Detailed Review */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-bold text-text-heading tracking-tight">Detailed Review</h3>
                </div>

                {detailedResults.map((result, index) => {

                    console.log("Question:", result.question);
                    console.log("Options:", result.options);
                    console.log("Correct Option:", result.correctOption);
                    console.log("Selected Answer:", result.selectedAnswer);

                    const userAnswerIndex = result.options.findIndex(opt => opt === result.selectedAnswer);
                    const correctAnswerIndex = result.correctOption - 1;
                    const isCorrect = result.isCorrect;

                    return (
                        <div
                            key={index}
                            className="bg-bg-card border border-border-light rounded-2xl p-5 flex flex-col gap-4 shadow-sm"
                        >
                            {/* Question header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-light text-xs font-semibold text-primary w-fit">
                                        Question {index + 1}
                                    </span>
                                    <h4 className="text-sm font-semibold text-text-heading leading-relaxed">
                                        {result.question}
                                    </h4>
                                </div>
                                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border-2 ${isCorrect
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-error-bg border-error-border'
                                    }`}>
                                    {isCorrect ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-error" strokeWidth={2.5} />
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex flex-col gap-2">
                                {result.options.map((option, optIndex) => {
                                    const isCorrectOption = optIndex === correctAnswerIndex;
                                    const isUserAnswer = optIndex === userAnswerIndex;
                                    const isWrongAnswer = isUserAnswer && !isCorrect;

                                    return (
                                        <div
                                            key={optIndex}
                                            className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-150 ${isCorrectOption
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : isWrongAnswer
                                                    ? 'bg-error-bg border-error-border'
                                                    : 'bg-bg-main border-border-light'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className={`text-sm font-medium ${isCorrectOption
                                                    ? 'text-emerald-800'
                                                    : isWrongAnswer
                                                        ? 'text-error'
                                                        : 'text-text-body'
                                                    }`}>
                                                    {option}
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isCorrectOption && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                                                            Correct
                                                        </span>
                                                    )}
                                                    {isWrongAnswer && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-error bg-error-bg px-2 py-0.5 rounded-md">
                                                            <XCircle className="w-3 h-3" strokeWidth={2.5} />
                                                            Your Answer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Explanation */}
                            {result.explanation && (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <BookOpen className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                            Explanation
                                        </p>
                                        <p className="text-sm text-amber-900 leading-relaxed">
                                            {result.explanation}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
                {weakAreasEligible && (
                    <Link
                        to={`/documents/${quiz.document._id}/learning-path`}
                        className="relative inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white text-sm font-semibold overflow-hidden group shadow-sm shadow-primary-shadow"
                    >
                        {/* Default background */}
                        <span className="absolute inset-0 bg-linear-to-r from-emerald-500 to-teal-500" />

                        {/* Hover slide — darker shade slides in from left */}
                        <span className="absolute inset-0 bg-linear-to-r from-emerald-600 to-teal-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

                        {/* Content */}
                        <Map className="w-4 h-4 relative z-10" strokeWidth={2} />
                        <span className="relative z-10">View Your Learning Path</span>
                    </Link>
                )}

                <Link
                    to={`/documents/${quiz.document._id}`}
                    className="relative inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white text-sm font-semibold overflow-hidden group shadow-sm shadow-primary-shadow"
                >
                    {/* Default background */}
                    <span className="absolute inset-0 bg-linear-to-r from-primary to-blue-400" />

                    {/* Hover slide — darker shade slides in from left */}
                    <span className="absolute inset-0 bg-linear-to-r from-primary-hover to-cyan-400 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

                    {/* Content */}
                    <ArrowLeft className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
                    <span className="relative z-10">Back to Document</span>
                </Link>
            </div>
        </div>
    );
};

export default QuizResultPage;