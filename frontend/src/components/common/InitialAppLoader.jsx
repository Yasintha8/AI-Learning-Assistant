import React from 'react';
import { BrainCircuit } from 'lucide-react';
import Spinner from './Spinner';

const InitialAppLoader = ({ label = 'Preparing your workspace...' }) => {
  return (
    <div
      role="status"
      aria-label="Loading LearnMate AI"
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-bg-main z-50 select-none animate-fade-in"
    >
      <div className="flex flex-col items-center text-center space-y-5 max-w-xs px-4">
        {/* Glowing Brand Icon Badge */}
        <div className="relative">
          <div className="absolute -inset-2 bg-linear-to-r from-primary to-indigo-500 rounded-3xl blur-md opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-bg-card border border-primary/30 flex items-center justify-center shadow-xl shadow-primary/10">
            <BrainCircuit className="w-8 h-8 text-primary animate-pulse" strokeWidth={2.2} />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-text-heading tracking-tight">
            Learn<span className="text-primary">Mate</span> AI
          </h1>
          <p className="text-xs font-semibold text-text-muted">
            Intelligent Learning Platform
          </p>
        </div>

        {/* Centered Modern Spinner & Loading Status */}
        <div className="pt-2 flex flex-col items-center gap-2.5">
          <Spinner size="md" tone="primary" />
          <span className="text-xs font-medium text-text-muted tracking-wide animate-pulse">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InitialAppLoader;
