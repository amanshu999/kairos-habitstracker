import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Volume2, 
  Tv, 
  ShieldCheck, 
  Cloud, 
  Save, 
  Check, 
  RefreshCw,
  Palette
} from 'lucide-react';
import { ThemeType, UserSettings, Habit, HabitLog, Routine } from '../types';
import { downloadFile, exportToCSV } from '../lib/exportImport';
import { StorageEngine } from '../lib/storage';
import { 
  isSupabaseConfigured, 
  getSupabaseCredentials, 
  saveCustomSupabaseCredentials, 
  getSupabaseClient 
} from '../lib/supabase';
import { playSound } from '../lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  habits: Habit[];
  logs: HabitLog[];
  routines: Routine[];
  onReloadAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  habits,
  logs,
  routines,
  onReloadAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cloud' | 'data'>('general');
  const [displayName, setDisplayName] = useState(settings.display_name);
  const [weekStart, setWeekStart] = useState(settings.week_starts_on);
  const [streakTokens, setStreakTokens] = useState(settings.streak_protection_tokens);

  // Cloud credentials
  const currentCreds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(currentCreds.url);
  const [customAnonKey, setCustomAnonKey] = useState(currentCreds.anonKey);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      display_name: displayName.trim() || 'developer@terminal',
      week_starts_on: weekStart,
      streak_protection_tokens: Number(streakTokens) || 0,
    });
    playSound.complete(settings.sound_effects);
    onClose();
  };

  const handleExportJSON = async () => {
    playSound.click(settings.sound_effects);
    const data = await StorageEngine.exportFullData();
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, `init-habits-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    playSound.click(settings.sound_effects);
    exportToCSV(habits, logs);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (confirm('Importing this file will overwrite existing data. Proceed?')) {
          await StorageEngine.importFullData(parsed);
          playSound.success(settings.sound_effects);
          alert('Data imported successfully!');
          onReloadAllData();
          onClose();
        }
      } catch (err) {
        alert('Invalid JSON file format: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('CAUTION: Are you sure you want to reset all data back to default? All custom records will be deleted.')) {
      if (confirm('Confirm once more to purge local state?')) {
        await StorageEngine.resetAll();
        playSound.undo(settings.sound_effects);
        alert('Local data reset to default successfully.');
        onReloadAllData();
        onClose();
      }
    }
  };

  const handleSaveCloudCreds = async () => {
    saveCustomSupabaseCredentials(customUrl, customAnonKey);
    setIsSyncing(true);
    setSyncStatusMsg('Testing Supabase connection...');

    const client = getSupabaseClient();
    if (!client) {
      setIsSyncing(false);
      setSyncStatusMsg('Error: Invalid URL or API key format.');
      return;
    }

    try {
      const { error } = await client.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows, which is fine
        setSyncStatusMsg(`Connection warning: ${error.message}`);
      } else {
        setSyncStatusMsg('Successfully connected to Supabase PostgreSQL!');
        playSound.complete(settings.sound_effects);
      }
    } catch (e: any) {
      setSyncStatusMsg(`Connection failed: ${e.message || e}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const themes: { id: ThemeType; label: string; desc: string }[] = [
    { id: 'terminal-emerald', label: 'Terminal Emerald', desc: 'Default dark charcoal with emerald accents' },
    { id: 'matrix-green', label: 'Matrix Phosphor', desc: 'Pure black CRT with radiant neon green' },
    { id: 'dracula', label: 'Dracula Midnight', desc: 'Rich purple and neon pink cyberpunk' },
    { id: 'nord', label: 'Nord Polar', desc: 'Arctic cool blues and muted slate' },
    { id: 'amber-crt', label: 'Amber Vintage CRT', desc: 'Warm nostalgic 1980s glowing amber' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="terminal-card bg-term-surface border border-term-border-strong rounded-lg max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Terminal Header */}
        <div className="bg-term-elevated px-4 py-3 border-b border-term-border flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-term-accent" />
            <h2 className="text-sm font-bold text-term-text">
              $ config --global // PREFERENCES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-term-text-muted hover:text-term-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-term-border text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'general'
                ? 'border-term-accent text-term-accent font-bold bg-term-elevated/40'
                : 'border-transparent text-term-text-muted hover:text-term-text'
            }`}
          >
            [0] GENERAL
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'cloud'
                ? 'border-term-accent text-term-accent font-bold bg-term-elevated/40'
                : 'border-transparent text-term-text-muted hover:text-term-text'
            }`}
          >
            [1] SUPABASE_CLOUD
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'data'
                ? 'border-term-accent text-term-accent font-bold bg-term-elevated/40'
                : 'border-transparent text-term-text-muted hover:text-term-text'
            }`}
          >
            [2] DATA_&amp;_EXPORT
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 text-xs space-y-4">
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  OPERATOR_DISPLAY_NAME
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  WEEK_STARTS_ON
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekStart('monday')}
                    className={`py-2 rounded border text-xs ${
                      weekStart === 'monday'
                        ? 'bg-term-accent text-black font-bold border-term-accent'
                        : 'bg-term-elevated border-term-border text-term-text-muted'
                    }`}
                  >
                    Monday (ISO Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStart('sunday')}
                    className={`py-2 rounded border text-xs ${
                      weekStart === 'sunday'
                        ? 'bg-term-accent text-black font-bold border-term-accent'
                        : 'bg-term-elevated border-term-border text-term-text-muted'
                    }`}
                  >
                    Sunday
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  STREAK_SHIELD_TOKENS
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={streakTokens}
                  onChange={e => setStreakTokens(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
                <span className="text-[11px] text-term-text-dim mt-1 block">
                  Protects consecutive streaks from breaking on emergencies or illness.
                </span>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-term-text-muted mb-1.5 font-semibold flex items-center gap-1.5">
                  <Palette size={14} className="text-term-accent" />
                  <span>COLOR_PALETTE</span>
                </label>
                <div className="space-y-1.5">
                  {themes.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={`p-2.5 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                        settings.theme === t.id
                          ? 'border-term-accent bg-term-accent-dim text-term-accent font-semibold'
                          : 'border-term-border bg-term-elevated text-term-text hover:border-term-border-strong'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[11px] text-term-text-dim">{t.desc}</div>
                      </div>
                      {settings.theme === t.id && <Check size={14} strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle controls: Audio and CRT */}
              <div className="pt-2 border-t border-term-border space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded bg-term-elevated border border-term-border">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-term-accent" />
                    <div>
                      <span className="font-semibold text-term-text block">8-Bit Sound Synthesizer</span>
                      <span className="text-[11px] text-term-text-dim">Synthesizes retro mechanical terminal audio</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !settings.sound_effects;
                      if (next) playSound.click(true);
                      onUpdateSettings({ sound_effects: next });
                    }}
                    className={`px-3 py-1 rounded text-xs border font-bold ${
                      settings.sound_effects
                        ? 'bg-term-accent text-black border-term-accent'
                        : 'bg-term-surface border-term-border text-term-text-dim'
                    }`}
                  >
                    {settings.sound_effects ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-term-elevated border border-term-border">
                  <div className="flex items-center gap-2">
                    <Tv size={16} className="text-term-cyan" />
                    <div>
                      <span className="font-semibold text-term-text block">CRT Scanline Monitor Effect</span>
                      <span className="text-[11px] text-term-text-dim">Subtle horizontal cathode tube raster overlay</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ crt_effects: !settings.crt_effects })}
                    className={`px-3 py-1 rounded text-xs border font-bold ${
                      settings.crt_effects
                        ? 'bg-term-cyan text-black border-term-cyan'
                        : 'bg-term-surface border-term-border text-term-text-dim'
                    }`}
                  >
                    {settings.crt_effects ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-term-accent text-black font-bold flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>APPLY_SETTINGS</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-term-elevated border border-term-border">
                <div className="flex items-center gap-2 mb-1">
                  <Cloud size={16} className="text-term-cyan" />
                  <span className="font-bold text-term-text">Supabase Cloud Sync</span>
                </div>
                <p className="text-term-text-muted text-[11px]">
                  Provide your Supabase Project URL and Anon Public Key for multi-device sync.
                  If left empty, all data remains 100% private and persistent in your browser via IndexedDB.
                </p>
              </div>

              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-term-text-muted mb-1 font-semibold">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  value={customAnonKey}
                  onChange={e => setCustomAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded bg-term-elevated border border-term-border focus:border-term-accent text-term-text focus:outline-none"
                />
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 rounded bg-term-elevated border border-term-border text-xs text-term-accent font-semibold">
                  &gt; {syncStatusMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-term-text-dim">
                  Status: {isSupabaseConfigured() ? 'CONFIGURED' : 'LOCAL_ONLY'}
                </span>
                <button
                  type="button"
                  onClick={handleSaveCloudCreds}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded bg-term-cyan text-black font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>TEST_&amp;_SAVE_CONNECTION</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-term-elevated border border-term-border">
                <span className="font-bold text-term-text block mb-1">Data Portability &amp; Backups</span>
                <p className="text-term-text-muted text-[11px]">
                  Export your habit configurations and historical logs anytime. Your data belongs to you.
                </p>
              </div>

              {/* Exports */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="p-3 rounded bg-term-elevated border border-term-border hover:border-term-accent text-term-text hover:text-term-accent text-left flex flex-col gap-1 transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Download size={14} />
                    <span>EXPORT_JSON</span>
                  </div>
                  <span className="text-[11px] text-term-text-dim">
                    Full backup of habits, logs, routines, and settings.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="p-3 rounded bg-term-elevated border border-term-border hover:border-term-cyan text-term-text hover:text-term-cyan text-left flex flex-col gap-1 transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Download size={14} />
                    <span>EXPORT_CSV</span>
                  </div>
                  <span className="text-[11px] text-term-text-dim">
                    Spreadsheet-ready log rows for Excel / Python analysis.
                  </span>
                </button>
              </div>

              {/* Import */}
              <div className="p-3 rounded bg-term-elevated border border-term-border">
                <label className="block text-term-text font-bold mb-1">
                  IMPORT_JSON_BACKUP
                </label>
                <p className="text-term-text-dim text-[11px] mb-2">
                  Select a previously exported init-habits JSON backup file to restore.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="block w-full text-xs text-term-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-term-border file:text-xs file:font-mono file:bg-term-surface file:text-term-accent hover:file:bg-term-elevated cursor-pointer"
                />
              </div>

              {/* Reset Local Data */}
              <div className="p-3 rounded bg-rose-950/20 border border-rose-900/50">
                <span className="font-bold text-term-red block mb-1">DANGER_ZONE: PURGE_LOCAL_DATABASE</span>
                <p className="text-term-text-dim text-[11px] mb-3">
                  Wipes all habits and completions, resetting the application to pristine default sample state.
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-3.5 py-1.5 rounded bg-term-red text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
                >
                  <Trash2 size={13} />
                  <span>RESET_TO_DEFAULT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
