import React from 'react'
import { Link } from 'react-router-dom'
import { Play, BarChart2, Trash2, Award } from 'lucide-react'
import moment from 'moment'

const QuizCard = ({ quiz, onDelete }) => {
    return (
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300  hover:border-primary-hover">

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(quiz);
                }}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer"
            >
                <Trash2 size={18} strokeWidth={2} />
            </button>

            <div className="space-y-5">

                {/* Score */}
                <div className="inline-flex items-center text-xs gap-1.5 rounded-lg border border-primary/10 bg-[#3324ff]/10 px-4 py-1 font-semibold text-[#3324ff]">
                    <Award className='w-3.5 h-3.5' />
                    <span>Score: {quiz?.score}</span>
                </div>

                {/* Title */}
                <div>
                    <h3
                        title={quiz.title}
                        className="text-lg font-bold text-slate-900 line-clamp-2"
                    >
                        {quiz.title ||
                            `Quiz - ${moment(quiz.createdAt).format("MMM D, YYYY")}`}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Created {moment(quiz.createdAt).format("MMM D, YYYY")}
                    </p>
                </div>

                {/* Questions */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className='px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg'>
                        <span className="text-sm font-semibold text-slate-700">
                            {quiz.questions.length}{" "}
                            {quiz.questions.length === 1 ? "Question" : "Questions"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Button */}
            <div className="mt-8">
                {quiz?.userAnswers?.length > 0 ? (
                    <Link to={`/quizzes/${quiz._id}`}>
                        <button className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-[#3324ff] text-sm font-semibold text-[#3324ff] transition-all duration-300 hover:bg-[#3324ff] hover:text-white cursor-pointer">
                            <BarChart2 size={18} />
                            View Results
                        </button>
                    </Link>
                ) : (
                    <Link to={`/quizzes/${quiz._id}`}>
                        <button className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-blue-400 font-semibold text-sm text-white shadow-lg shadow-[#3324ff]/20 transition-all duration-300 hover:bg-[#2495ff] hover:shadow-[#2495ff]/30 cursor-pointer">
                            <Play size={18} />
                            Start Quiz
                        </button>
                    </Link>
                )}
            </div>

        </div>
    )
}

export default QuizCard