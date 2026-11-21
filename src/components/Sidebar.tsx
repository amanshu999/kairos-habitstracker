import React from 'react';
import { 
  Home, 
  CheckCircle2, 
  Workflow, 
  Calendar as CalendarIcon, 
  BarChart2, 
  Settings as SettingsIcon, 
  HelpCircle,
  Sprout,
  X
} from 'lucide-react';
import { playSound } from '../lib/audio';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'dashboard' | 'routines' | 'analytics' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'routines' | 'analytics' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  soundEnabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenShortcuts,
  soundEnabled,
}) => {
  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={16} />, isTab: true, tabTarget: 'dashboard' as const },
    { id: 'habits', label: 'Habits', icon: <CheckCircle2 size={16} />, isTab: true, tabTarget: 'dashboard' as const },
    { id: 'routines', label: 'Routines', icon: <Workflow size={16} />, isTab: true, tabTarget: 'routines' as const },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={16} />, isTab: true, tabTarget: 'calendar' as const },
    { id: 'analytics', label: 'Stats', icon: <BarChart2 size={16} />, isTab: true, tabTarget: 'analytics' as const },
    { id: 'system', label: 'System', icon: <SettingsIcon size={16} />, isTab: false, action: onOpenSettings },
    { id: 'help', label: 'Help', icon: <HelpCircle size={16} />, isTab: false, action: onOpenShortcuts },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 p-4 border-r border-term-border bg-term-surface shadow-2xl flex flex-col justify-between font-mono text-xs select-none animate-slide-down">
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-term-border">
            <div className="flex items-center gap-2">
              <Sprout size={18} className="text-term-accent" />
              <span className="font-bold text-sm text-term-text">Navigation</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-term-border text-term-text-muted hover:text-term-text hover:bg-term-elevated transition-colors"
              title="Close sidebar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = 
                (item.id === 'dashboard' && activeTab === 'dashboard') ||
                (item.id === 'habits' && activeTab === 'dashboard') ||
                (item.id === 'routines' && activeTab === 'routines') ||
                (item.id === 'calendar' && activeTab === 'calendar') ||
                (item.id === 'analytics' && activeTab === 'analytics');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playSound.click(soundEnabled);
                    if (item.isTab && item.tabTarget) {
                      setActiveTab(item.tabTarget);
                    } else if (item.action) {
                      item.action();
                    }
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-term-elevated text-term-accent font-semibold border border-term-border-strong shadow-sm'
                      : 'text-term-text-muted hover:text-term-text hover:bg-term-elevated/40'
                  }`}
                >
                  <span className={isActive ? 'text-term-accent' : 'text-term-text-dim'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Hero Card & Author */}
        <div className="rounded-xl border border-term-border overflow-hidden bg-term-elevated/70">
          <div className="relative h-20 overflow-hidden">
            <img 
              src="./kairos-hero.png" 
              alt="Terminal Environment" 
              className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2 flex flex-col justify-end">
              <span className="text-[9px] text-term-accent font-semibold tracking-wider">// FOCUS_RUNTIME</span>
            </div>
          </div>
          <div className="p-3 space-y-1.5">
            <p className="text-[11px] italic text-term-text leading-relaxed">
              &ldquo;Small habits build a better you.&rdquo;
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-term-border/40 text-[10px]">
              <a
                href="https://github.com/amanshu999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-term-text-muted hover:text-term-accent transition-colors"
              >
                made by <span className="text-term-accent font-medium">amanshu</span>
              </a>
              <span className="text-term-accent text-[11px] font-mono">&gt;_</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
