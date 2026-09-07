import { Link } from 'react-router-dom';
import { BrainCircuit, Sparkles, FileText, Route } from 'lucide-react';

const FEATURES = [
  { icon: FileText, label: 'Turn any document into study material' },
  { icon: Sparkles, label: 'AI-generated flashcards & quizzes' },
  { icon: Route, label: 'Personalized learning paths' },
];

const AuthLayout = ({ eyebrow, headline, subheadline, children }) => {
  return (
    <div className="min-h-screen w-full flex bg-bg-main select-none">
      {/* Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative overflow-hidden bg-linear-to-br from-primary via-primary to-primary-hover">
        <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] rounded-full bg-white/10 blur-[110px] animate-float-slow pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[110px] animate-float pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full text-white">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">LearnMate AI</span>
          </Link>

          <div className="flex flex-col gap-8 animate-fade-in-up">
            {eyebrow && (
              <span className="text-xs font-semibold tracking-widest uppercase text-white/70">
                {eyebrow}
              </span>
            )}
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl xl:text-[2.75rem] font-bold font-display leading-tight max-w-md">
                {headline}
              </h2>
              <p className="text-white/75 text-base leading-relaxed max-w-sm">
                {subheadline}
              </p>
            </div>

            <ul className="flex flex-col gap-4 mt-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-white/90">
                  <span className="p-1.5 bg-white/15 rounded-full shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-medium text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} LearnMate AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="lg:hidden absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="lg:hidden absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;