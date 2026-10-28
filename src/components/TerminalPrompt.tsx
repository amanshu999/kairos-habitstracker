import React, { useState } from 'react';
import { Terminal, Send, ChevronRight } from 'lucide-react';
import { ThemeType } from '../types';

interface TerminalPromptProps {
  completedCount: number;
  totalHabitsDue: number;
  percentage: number;
  longestStreak: number;
  displayName: string;
  onExecuteCommand: (cmd: string) => string | void;
  onSetTheme: (theme: ThemeType) => void;
  onOpenNewHabit: (prefillTitle?: string) => void;
}

const QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Continuous integration applied to daily life: small commits, zero regressions.",
  "Discipline is choosing between what you want now and what you want most.",
  "Automate the trivial, standardize the critical, execute daily.",
  "No syntax errors detected. Maintain focus state.",
  "One day or Day One. You compile the runtime.",
];

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  completedCount,
  totalHabitsDue,
  percentage,
  longestStreak,
  displayName,
  onExecuteCommand,
  onSetTheme,
  onOpenNewHabit,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<Array<{ cmd: string; result: string }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Motivational quote based on progress
  let progressState = 'STATUS: IN_PROGRESS';
  let progressMsg = 'Pipeline executing. Complete queued tasks.';
  if (totalHabitsDue > 0 && completedCount === totalHabitsDue) {
    progressState = 'STATUS: 200 OK (ALL_PASSED)';
    progressMsg = 'All systems nominal. 100% daily tasks successfully executed!';
  } else if (completedCount === 0) {
    progressState = 'STATUS: AWAITING_EXECUTION';
    progressMsg = 'System booted. Queue empty. Ready for execution.';
  }

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;

    let output = '';
    const lower = trimmed.toLowerCase();

    if (lower === 'help') {
      output = 'Available: help, add <name>, theme <name>, clear, stats, quote, pwd, whoami';
    } else if (lower === 'clear') {
      setCommandHistory([]);
      setCommandInput('');
      return;
    } else if (lower === 'whoami') {
      output = `Logged in as: ${displayName} (UID: 1000)`;
    } else if (lower === 'pwd') {
      output = '/home/user/workspace/habits';
    } else if (lower === 'stats') {
      output = `Completed: ${completedCount}/${totalHabitsDue} (${percentage}%) | Longest Streak: ${longestStreak}d`;
    } else if (lower === 'quote') {
      output = `"${QUOTES[Math.floor(Math.random() * QUOTES.length)]}"`;
    } else if (lower.startsWith('theme ')) {
      const themeArg = lower.replace('theme ', '').trim();
      const validThemes: Record<string, ThemeType> = {
        emerald: 'terminal-emerald',
        matrix: 'matrix-green',
        dracula: 'dracula',
        nord: 'nord',
        amber: 'amber-crt',
      };
      if (validThemes[themeArg]) {
        onSetTheme(validThemes[themeArg]);
        output = `Theme switched to: ${themeArg}`;
      } else {
        output = `Unknown theme. Choose from: emerald, matrix, dracula, nord, amber`;
      }
    } else if (lower.startsWith('add ')) {
      const habitTitle = trimmed.substring(4).trim();
      onOpenNewHabit(habitTitle);
      output = `Opening dialog to add habit: "${habitTitle}"`;
    } else {
      const customRes = onExecuteCommand(trimmed);
      output = customRes || `Command not recognized: "${trimmed}". Type "help" for a list of commands.`;
    }

    setCommandHistory(prev => [...prev.slice(-6), { cmd: trimmed, result: output }]);
    setCommandInput('');
    setIsExpanded(true);
  };

  return (
    <div className="terminal-card rounded-md border border-term-border overflow-hidden mb-6">
      {/* Terminal Title Bar */}
      <div className="bg-term-elevated px-4 py-2 border-b border-term-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-term-red/70 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-term-amber/70 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-term-accent/70 inline-block" />
          </div>
          <span className="text-term-text-muted font-mono ml-2 font-medium">
            bash - kairos --daemon
          </span>
        </div>
        <div className="flex items-center gap-3 text-term-text-dim font-mono text-[11px]">
          <span className="hidden sm:inline">PID: 4096</span>
          <span className="px-1.5 py-0.5 rounded bg-term-surface border border-term-border text-term-accent font-semibold">
            {progressState}
          </span>
        </div>
      </div>

      {/* Terminal Body / Output */}
      <div className="p-4 bg-term-surface font-mono text-xs sm:text-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-term-text">
          <span className="text-term-accent font-semibold">{displayName}:~$</span>
          <span className="text-term-cyan">habits --summary</span>
          <span className="text-term-text-dim">--date=today</span>
        </div>

        <div className="text-term-text-muted pl-4 border-l-2 border-term-border space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-term-text">Progress:</span>
            <span className="font-semibold text-term-accent">{completedCount}/{totalHabitsDue} completed</span>
            <span className="text-term-text-dim">({percentage}%)</span>
            <span className="text-term-border-strong">|</span>
            <span className="text-term-text">Streak Record:</span>
            <span className="text-term-amber font-semibold">🔥 {longestStreak} days</span>
          </div>
          <div className="text-term-text-dim italic">
            &gt; {progressMsg}
          </div>
        </div>

        {/* Command Output History */}
        {isExpanded && commandHistory.length > 0 && (
          <div className="mt-3 pt-2 border-t border-term-border/60 space-y-1.5 text-xs">
            {commandHistory.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-term-text">
                  <span className="text-term-accent font-bold">$</span>
                  <span>{item.cmd}</span>
                </div>
                <div className="text-term-text-muted pl-3 font-mono whitespace-pre-wrap">
                  {item.result}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive CLI Input */}
        <form onSubmit={handleCommandSubmit} className="mt-3 pt-2 flex items-center gap-2 border-t border-term-border">
          <div className="flex items-center text-term-accent font-bold">
            <ChevronRight size={16} />
          </div>
          <input
            type="text"
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            placeholder="Type terminal command (e.g., 'help', 'add Study Rust', 'quote', 'stats')..."
            className="flex-1 bg-transparent text-term-text font-mono text-xs sm:text-sm focus:outline-none placeholder:text-term-text-dim/60"
          />
          <button
            type="submit"
            className="p-1 rounded bg-term-elevated text-term-text-muted hover:text-term-accent border border-term-border"
            title="Execute Command (Enter)"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
