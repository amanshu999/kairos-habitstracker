import React, { useState } from 'react';
import { X, Lock, Mail, Cloud, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { playSound } from '../lib/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
  onAuthSuccess: (email: string) => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  userEmail,
  onAuthSuccess,
  onSignOut,
  onOpenSettings,
  soundEnabled,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('Supabase is not configured. Please enter your credentials in Settings first.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          playSound.complete(soundEnabled);
          setStatusMsg('Registration successful! If confirmation is enabled, check your email.');
          if (data.session) {
            onAuthSuccess(data.user.email || email);
            onClose();
          }
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          playSound.complete(soundEnabled);
          onAuthSuccess(data.user.email || email);
          onClose();
        }
      }
    } catch (err: any) {
      playSound.undo(soundEnabled);
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="terminal-card bg-term-surface border border-term-border-strong rounded-lg max-w-md w-full p-5 shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-term-border mb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-term-accent" />
            <h2 className="text-sm font-bold text-term-text">
              $ auth-service --login
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-term-text-muted hover:text-term-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* If already logged in */}
        {isLoggedIn ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded bg-term-elevated border border-term-accent/40 flex items-start gap-3">
              <CheckCircle size={18} className="text-term-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-term-text block">AUTHENTICATED_SESSION</span>
                <span className="text-term-text-muted block text-[11px] mt-0.5">
                  Logged in as: <strong className="text-term-accent">{userEmail}</strong>
                </span>
                <span className="text-term-text-dim text-[10px] block mt-1">
                  Cloud synchronization active with Row-Level Security enabled.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full py-2.5 rounded bg-term-elevated hover:bg-term-hover border border-term-border hover:border-term-red text-term-red font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={14} />
              <span>LOGOUT_SESSION</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Supabase status warning if unconfigured */}
            {!isConfigured && (
              <div className="p-3 rounded bg-term-elevated/70 border border-term-amber/40 text-term-amber space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} />
                  <span>LOCAL-FIRST GUEST MODE ACTIVE</span>
                </div>
                <p className="text-[11px] text-term-text-muted">
                  The application is running 100% offline via IndexedDB. To enable cloud sync across multiple machines, configure your Supabase URL &amp; Anon Key in Settings.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="mt-1 text-[11px] underline text-term-accent hover:opacity-80 block"
                >
                  Configure Supabase Cloud Credentials &gt;
                </button>
              </div>
            )}

            {/* Tab switch between Sign In and Sign Up */}
            <div className="flex border border-term-border rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-1.5 font-bold transition-colors ${
                  authMode === 'signin'
                    ? 'bg-term-accent text-black'
                    : 'bg-term-elevated text-term-text-muted'
                }`}
              >
                SIGN_IN
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 font-bold transition-colors ${
                  authMode === 'signup'
                    ? 'bg-term-accent text-black'
                    : 'bg-term-elevated text-term-text-muted'
                }`}
              >
                REGISTER
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  EMAIL_ADDRESS
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-2.5 top-2.5 text-term-text-dim" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="developer@kernel.org"
                    className="w-full pl-8 pr-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-2.5 top-2.5 text-term-text-dim" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-[11px]">
                  &gt; Error: {errorMsg}
                </div>
              )}

              {statusMsg && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-[11px]">
                  &gt; {statusMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded bg-term-accent text-black font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow transition-all disabled:opacity-50"
              >
                <Cloud size={14} />
                <span>{isLoading ? 'TRANSMITTING...' : authMode === 'signin' ? 'LOGIN_TO_ACCOUNT' : 'CREATE_ACCOUNT'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
