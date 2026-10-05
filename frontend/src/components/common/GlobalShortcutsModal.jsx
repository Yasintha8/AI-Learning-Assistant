import React from 'react';
import Modal from './Modal';
import {
  Keyboard,
  Search,
  Sidebar,
  HelpCircle,
  BrainCircuit,
  Layers,
  Volume2,
  Star,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  X
} from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    category: 'Global & Navigation',
    shortcuts: [
      {
        action: 'Quick Search / Command Palette',
        keys: ['Ctrl', 'K'],
        altKeys: ['⌘', 'K'],
        icon: Search,
      },
      {
        action: 'Toggle Desktop Sidebar Collapse',
        keys: ['Ctrl', 'B'],
        altKeys: ['⌘', 'B'],
        icon: Sidebar,
      },
      {
        action: 'Open Keyboard Shortcuts Guide',
        keys: ['?'],
        note: 'or Shift + /',
        icon: Keyboard,
      },
      {
        action: 'Dismiss / Close Active Modal',
        keys: ['Esc'],
        icon: X,
      },
    ],
  },
  {
    category: 'Interactive Quizzes',
    shortcuts: [
      {
        action: 'Select Question Options',
        keys: ['1', '2', '3', '4'],
        note: 'or A, B, C, D',
        icon: BrainCircuit,
      },
      {
        action: 'Next Question / Advance',
        keys: ['→'],
        note: 'or Enter',
        icon: ArrowRight,
      },
      {
        action: 'Previous Question',
        keys: ['←'],
        icon: ArrowLeft,
      },
      {
        action: 'Finish & Submit Quiz (on last question)',
        keys: ['Enter'],
        icon: CornerDownLeft,
      },
    ],
  },
  {
    category: 'Flashcards Study & Audio',
    shortcuts: [
      {
        action: 'Flip Card (Question ⇄ Answer)',
        keys: ['Space'],
        icon: Layers,
      },
      {
        action: 'Read Aloud / Text-to-Speech (TTS)',
        keys: ['A'],
        note: 'speaks front or back side',
        icon: Volume2,
      },
      {
        action: 'Star / Unstar Flashcard',
        keys: ['S'],
        icon: Star,
      },
      {
        action: 'Next Card in Deck',
        keys: ['→'],
        icon: ArrowRight,
      },
      {
        action: 'Previous Card in Deck',
        keys: ['←'],
        icon: ArrowLeft,
      },
      {
        action: 'Shuffle Flashcard Deck',
        keys: ['R'],
        icon: Shuffle,
      },
    ],
  },
];

const GlobalShortcutsModal = ({ isOpen, onClose }) => {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center border border-primary/20">
            <Keyboard className="w-4 h-4 text-primary" strokeWidth={2.25} />
          </div>
          <span>Keyboard Shortcuts</span>
        </div>
      }
      size="2xl"
    >
      <div className="space-y-6 font-body text-xs text-text-body">
        <p className="text-text-muted leading-relaxed">
          Speed up your study workflow with built-in hotkeys. You can trigger this guide at any time by pressing{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-medium font-mono font-bold text-text-heading">?</kbd>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group, groupIdx) => (
            <div
              key={groupIdx}
              className={`p-4 rounded-2xl bg-bg-main border border-border-light space-y-3.5 ${
                groupIdx === 2 ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-border-light">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-heading">
                  {group.category}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.shortcuts.map((sc, scIdx) => {
                  const Icon = sc.icon;
                  const displayKeys = isMac && sc.altKeys ? sc.altKeys : sc.keys;

                  return (
                    <div
                      key={scIdx}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-bg-card transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={2} />}
                        <div className="truncate">
                          <span className="font-semibold text-text-heading block truncate">
                            {sc.action}
                          </span>
                          {sc.note && (
                            <span className="text-[10px] text-text-muted block">
                              {sc.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 font-mono">
                        {displayKeys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="min-w-6 h-6 px-2 rounded-lg bg-bg-card border border-border-medium text-[11px] font-bold text-text-heading flex items-center justify-center shadow-2xs">
                              {k}
                            </kbd>
                            {kIdx < displayKeys.length - 1 && (
                              <span className="text-text-muted text-[10px]">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-light text-text-muted">
          <span className="text-[11px]">Shortcuts are disabled while focused inside inputs or search boxes.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GlobalShortcutsModal;
