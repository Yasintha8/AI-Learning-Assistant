import { Link } from 'react-router-dom'
import { Play, BarChart2, Trash2, Award } from 'lucide-react'
import moment from 'moment'

const QuizCard = ({ quiz, onDelete }) => {
    return (
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border-medium bg-bg-card p-6 shadow-xs transition-all duration-300  hover:border-primary-hover">

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(quiz);
                }}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-error-bg text-error transition-all duration-300 hover:bg-error hover:text-white cursor-pointer"
            >
                <Trash2 size={18} strokeWidth={2} />
            </button>

            <div className="space-y-5">

                {/* Score */}
                <div className="inline-flex items-center text-xs gap-1.5 rounded-lg border border-primary/10 bg-primary-light px-4 py-1 font-semibold text-primary">
                    <Award className='w-3.5 h-3.5' />
                    <span>Score: {quiz?.score}</span>
                </div>

                {/* Title */}
                <div>
                    <h3
                        title={quiz.title}
                        className="text-lg font-bold text-text-heading line-clamp-2"
                    >
                        {quiz.title ||
                            `Quiz - ${moment(quiz.createdAt).format("MMM D, YYYY")}`}
                    </h3>

                    <p className="mt-2 text-sm text-text-muted">
                        Created {moment(quiz.createdAt).format("MMM D, YYYY")}
                    </p>
                </div>

                {/* Questions */}
                <div className="flex items-center gap-3 pt-2 border-t border-border-light">
                    <div className='px-3 py-1.5 bg-bg-main border border-border-medium/60 rounded-lg'>
                        <span className="text-sm font-semibold text-text-body">
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
                        <button className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white cursor-pointer">
                            <BarChart2 size={18} />
                            View Results
                        </button>
                    </Link>
                ) : (
                    <Link to={`/quizzes/${quiz._id}`}>
                        <button className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-blue-400 font-semibold text-sm text-white shadow-lg shadow-primary-shadow/20 transition-all duration-300 hover:bg-primary-hover hover:shadow-primary-shadow/30 cursor-pointer">
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