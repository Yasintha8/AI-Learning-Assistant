import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  FileText,
  Layers,
  HelpCircle,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import heroImage from '../assets/hero.png';

const features = [
  {
    icon: FileText,
    title: 'Smart Document Analysis',
    description: 'Upload your notes and textbooks, and let AI break them down into digestible summaries and key concepts.',
  },
  {
    icon: Layers,
    title: 'AI-Generated Flashcards',
    description: 'Turn any document into ready-to-study flashcards, generated automatically from the content that matters.',
  },
  {
    icon: HelpCircle,
    title: 'Adaptive Quizzes',
    description: 'Test your understanding with quizzes tailored to your material and track where you need more practice.',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description: 'See your study streaks, quiz scores, and flashcard mastery all in one place, updated in real time.',
  },
];

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main text-text-body select-none">
      {/* Nav */}
      <header className="sticky top-0 z-40 w-full bg-bg-main/80 backdrop-blur-md border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-text-heading tracking-tight">
              AI Learning Assistant
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-body">
            <a href="#features" className="hover:text-text-heading transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-heading transition-colors">How it works</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-text-body hover:bg-border-light transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-text-heading hover:bg-border-light transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary-shadow/20 transition-all"
            >
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="md:hidden p-2 rounded-xl text-text-body hover:bg-border-light transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-light bg-bg-main px-4 py-4 flex flex-col gap-3">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text-body">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text-body">How it works</a>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm font-medium text-text-body"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <Link to="/login" className="text-sm font-semibold text-text-heading">Log in</Link>
            <Link
              to="/register"
              className="text-center px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <BrainCircuit className="w-3.5 h-3.5" />
              Personalized AI Learning
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-heading font-display leading-tight">
              Study smarter with your own AI learning assistant
            </h1>
            <p className="text-lg text-text-body max-w-xl">
              Upload your documents and instantly get summaries, flashcards, and quizzes generated
              by AI, so you spend less time organizing and more time learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary-shadow/20 hover:shadow-primary-shadow/30 transition-all duration-300 group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border-medium text-text-heading font-semibold hover:bg-border-light transition-colors duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <img
              src={heroImage}
              alt="AI Learning Assistant illustration"
              className="w-full max-w-md drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            Everything you need to learn faster
          </h2>
          <p className="text-text-body">
            From raw notes to mastery, your AI assistant handles the busywork.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-bg-card rounded-3xl border border-border-light shadow-xl shadow-slate-200/20 dark:shadow-none p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/30 dark:hover:shadow-none"
            >
              <div className="p-2.5 w-fit bg-primary/10 rounded-xl text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-text-heading text-lg">{title}</h3>
              <p className="text-sm text-text-body">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            How it works
          </h2>
          <p className="text-text-body">Three steps between your notes and knowing the material.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Upload your document', description: 'Add a PDF or notes to your library in seconds.' },
            { step: '2', title: 'AI processes the content', description: 'Get a summary, flashcards, and a quiz generated automatically.' },
            { step: '3', title: 'Study and track progress', description: 'Review flashcards, take quizzes, and watch your dashboard grow.' },
          ].map(({ step, title, description }) => (
            <div key={step} className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary text-white font-display font-bold flex items-center justify-center shadow-lg shadow-primary-shadow/20">
                {step}
              </div>
              <h3 className="font-display font-semibold text-text-heading text-lg">{title}</h3>
              <p className="text-sm text-text-body">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-bg-card border border-border-light rounded-3xl p-10 sm:p-14 flex flex-col items-center text-center gap-6 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            Ready to learn smarter?
          </h2>
          <p className="text-text-body max-w-lg">
            Create your free account and turn your first document into flashcards and a quiz today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary-shadow/20 hover:shadow-primary-shadow/30 transition-all duration-300 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-text-heading text-sm">
              AI Learning Assistant
            </span>
          </div>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} AI Learning Assistant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
