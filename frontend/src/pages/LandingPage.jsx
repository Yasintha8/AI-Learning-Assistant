import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  FileText,
  FileType,
  Layers,
  HelpCircle,
  BarChart3,
  Video,
  Globe,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ROTATING_WORDS = ['flashcards', 'quizzes', 'summaries', 'answers'];

const FEATURES = [
  {
    icon: FileText,
    title: 'Smart Document Analysis',
    description: 'Upload your notes and textbooks, and let AI break them down into digestible summaries and key concepts.',
    span: 'lg:col-span-2',
  },
  {
    icon: Layers,
    title: 'AI-Generated Flashcards',
    description: 'Turn any document into ready-to-study flashcards, generated automatically from the content that matters.',
    span: '',
  },
  {
    icon: HelpCircle,
    title: 'Adaptive Quizzes',
    description: 'Test your understanding with quizzes tailored to your material and track where you need more practice.',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description: 'See your study streaks, quiz scores, and flashcard mastery all in one place, updated in real time.',
    span: '',
  },
  {
    icon: Sparkles,
    title: 'Any Source, One Assistant',
    description: 'PDFs, DOCX files, YouTube videos, or website links — bring any material in and study it the same way.',
    span: 'lg:col-span-2',
  },
];

const FORMATS = [
  { icon: FileText, label: 'PDF' },
  { icon: FileType, label: 'DOCX' },
  { icon: Video, label: 'YouTube' },
  { icon: Globe, label: 'Websites' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: FileText, title: 'Add your material', description: 'Upload a PDF/DOCX, or paste a YouTube or website link.' },
  { step: '2', icon: Sparkles, title: 'AI processes the content', description: 'Get a summary, flashcards, and a quiz generated automatically.' },
  { step: '3', icon: BarChart3, title: 'Study and track progress', description: 'Review flashcards, take quizzes, and watch your dashboard grow.' },
];

const TERMINAL_STEPS = [
  { type: 'command', text: 'Add "React-Hooks-Notes.pdf"' },
  { type: 'output', text: 'Extracting content & building context...' },
  { type: 'success', text: '12 flashcards generated' },
  { type: 'success', text: '10-question quiz ready' },
  { type: 'command', text: 'Ask: "Explain useEffect simply"' },
  { type: 'ai', text: 'useEffect runs side effects after React renders — e.g. fetching data or subscribing to events.' },
];

const TYPE_SPEED_MS = 22;
const LINE_PAUSE_MS = 550;
const LOOP_PAUSE_MS = 2400;

// Cross-fading rotator for the hero headline's variable word.
const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      key={ROTATING_WORDS[index]}
      className="inline-block text-primary animate-fade-in-up"
    >
      {ROTATING_WORDS[index]}
    </span>
  );
};

const lineStyles = (type) => {
  switch (type) {
    case 'command':
      return 'text-emerald-400';
    case 'success':
      return 'text-sky-400';
    case 'ai':
      return 'text-white/80 pl-3 border-l-2 border-primary/50 ml-0.5 block';
    default:
      return 'text-white/45';
  }
};

const linePrefix = (type) => (type === 'command' ? '$ ' : type === 'success' ? '✓ ' : '');

// Animated "product demo" - simulates the real upload -> extract -> generate
// pipeline as a typed-out terminal transcript, looping continuously.
const TerminalDemo = () => {
  const [completedLines, setCompletedLines] = useState([]);
  const [typingText, setTypingText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let charIndex = 0;
    let cancelled = false;
    const step = TERMINAL_STEPS[activeIndex];

    const typeChar = () => {
      if (cancelled) return;
      charIndex += 1;
      setTypingText(step.text.slice(0, charIndex));

      if (charIndex < step.text.length) {
        timeoutRef.current = setTimeout(typeChar, TYPE_SPEED_MS);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setCompletedLines((prev) => [...prev, step]);
        setTypingText('');

        if (activeIndex + 1 < TERMINAL_STEPS.length) {
          setActiveIndex((i) => i + 1);
        } else {
          timeoutRef.current = setTimeout(() => {
            if (cancelled) return;
            setCompletedLines([]);
            setActiveIndex(0);
          }, LOOP_PAUSE_MS);
        }
      }, LINE_PAUSE_MS);
    };

    timeoutRef.current = setTimeout(typeChar, TYPE_SPEED_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0b0f19] shadow-2xl shadow-primary-shadow/10 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-400/80" />
        <span className="w-3 h-3 rounded-full bg-amber-400/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs text-white/40 font-mono">ai-learning-assistant</span>
      </div>
      <div className="p-5 font-mono text-[13px] sm:text-sm leading-relaxed min-h-[280px]">
        {completedLines.map((line, i) => (
          <div key={i} className={lineStyles(line.type)}>
            {linePrefix(line.type)}
            {line.text}
          </div>
        ))}
        <div className={lineStyles(TERMINAL_STEPS[activeIndex].type)}>
          {linePrefix(TERMINAL_STEPS[activeIndex].type)}
          {typingText}
          <span className="inline-block w-[2px] h-4 -mb-0.5 bg-primary-hover ml-0.5 animate-blink" />
        </div>
      </div>
    </div>
  );
};

// Lightweight scroll-reveal (no extra dependency) - fades + slides an element
// up into place the first time it enters the viewport.
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

const Reveal = ({ children, className = '', delay = 0 }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-body select-none">
      {/* Nav */}
      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-md transition-all duration-300 ${isScrolled ? 'bg-bg-main/90 border-b border-border-light shadow-sm' : 'bg-bg-main/60 border-b border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-text-heading tracking-tight">
              LearnMate AI
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
        {/* Decorative grid + gradient orbs */}
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-border-medium) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-medium) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-float" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <BrainCircuit className="w-3.5 h-3.5" />
              Personalized AI Learning
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-heading font-display leading-tight">
              Turn anything you study into{' '}
              <RotatingWord />
            </h1>
            <p className="text-lg text-text-body max-w-xl">
              Upload a PDF or DOCX, or paste a YouTube or website link — your AI assistant reads it
              and instantly builds summaries, flashcards, and quizzes so you can start learning.
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

            {/* Supported formats */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">Works with</span>
              {FORMATS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-medium bg-bg-card text-xs font-medium text-text-body"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full lg:pl-6">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            Everything you need to learn faster
          </h2>
          <p className="text-text-body">
            From raw notes to mastery, your AI assistant handles the busywork.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, span }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              className={`group relative bg-bg-card rounded-3xl border border-border-light shadow-xl shadow-slate-200/20 dark:shadow-none p-6 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/30 dark:hover:shadow-none hover:-translate-y-1 hover:border-primary/30 ${span}`}
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-2.5 w-fit bg-primary/10 rounded-xl text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="relative font-display font-semibold text-text-heading text-lg">{title}</h3>
              <p className="relative text-sm text-text-body">{description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            How it works
          </h2>
          <p className="text-text-body">Three steps between your notes and knowing the material.</p>
        </Reveal>

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, i) => (
            <React.Fragment key={step}>
              <Reveal
                delay={i * 120}
                className="group flex-1 bg-bg-card rounded-2xl border border-border-light shadow-sm hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 p-6 md:p-8 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-blue-400 text-white font-display font-bold text-sm flex items-center justify-center shadow-md shadow-primary-shadow/20 shrink-0">
                    {step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-display font-semibold text-text-heading text-lg">{title}</h3>
                <p className="text-sm text-text-body leading-relaxed">{description}</p>
              </Reveal>

              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden sm:flex items-center justify-center shrink-0 text-text-muted/40">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Reveal className="relative bg-bg-card border border-border-light rounded-3xl p-10 sm:p-14 flex flex-col items-center text-center gap-6 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            Ready to learn smarter?
          </h2>
          <p className="relative text-text-body max-w-lg">
            Create your free account and turn your first document, video, or article into flashcards and a quiz today.
          </p>
          <Link
            to="/register"
            className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary-shadow/20 hover:shadow-primary-shadow/30 transition-all duration-300 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light bg-bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-text-heading text-sm">
              LearnMate AI
            </span> */}
          </div>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} LearnMate AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;