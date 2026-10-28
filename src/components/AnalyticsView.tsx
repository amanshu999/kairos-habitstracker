import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { Flame, Trophy, TrendingUp, Calendar, CheckCircle, Activity } from 'lucide-react';
import { Habit, HabitLog, StreakInfo } from '../types';
import { 
  getTodayDateString, 
  parseDateString, 
  formatDateString, 
  isHabitDueOnDate 
} from '../lib/dateUtils';

interface AnalyticsViewProps {
  habits: Habit[];
  logs: HabitLog[];
  streakMap: Map<string, StreakInfo>;
  todayStr: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  habits,
  logs,
  streakMap,
  todayStr,
}) => {
  const [timeRange, setTimeRange] = useState<'30d' | '60d' | '90d'>('30d');
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    completed: number;
    total: number;
    percent: number;
  } | null>(null);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog[]>();
    for (const log of logs) {
      if (!map.has(log.date)) map.set(log.date, []);
      map.get(log.date)!.push(log);
    }
    return map;
  }, [logs]);

  // Overall stats
  const totalCompletedLogs = useMemo(() => {
    return logs.filter(l => l.completed).length;
  }, [logs]);

  // Calculate Heatmap Data (Past 20 weeks = 140 days)
  const heatmapData = useMemo(() => {
    const today = parseDateString(todayStr);
    const dayOfWeek = today.getDay(); // 0 is Sun
    const totalDaysToShow = 140; // 20 weeks
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDaysToShow + (6 - dayOfWeek));

    const weeks: Array<Array<{
      date: string;
      completed: number;
      total: number;
      percent: number;
      level: 0 | 1 | 2 | 3 | 4;
    }>> = [];

    let currentWeek: Array<{
      date: string;
      completed: number;
      total: number;
      percent: number;
      level: 0 | 1 | 2 | 3 | 4;
    }> = [];

    const runner = new Date(startDate);
    while (runner <= today) {
      const dateStr = formatDateString(runner);
      const dayLogs = logsByDate.get(dateStr) || [];
      const completedOnDay = dayLogs.filter(l => l.completed).length;

      // Calculate habits scheduled for that day
      const dueHabits = habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, dateStr));
      const totalDue = dueHabits.length || 1;

      const percent = Math.min(100, Math.round((completedOnDay / totalDue) * 100));

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (completedOnDay > 0) {
        if (percent >= 100) level = 4;
        else if (percent >= 66) level = 3;
        else if (percent >= 33) level = 2;
        else level = 1;
      }

      currentWeek.push({
        date: dateStr,
        completed: completedOnDay,
        total: totalDue,
        percent,
        level,
      });

      if (runner.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      runner.setDate(runner.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [todayStr, logsByDate, habits]);

  // 30 / 60 / 90 Days completion trend line
  const trendData = useMemo(() => {
    const daysCount = timeRange === '30d' ? 30 : timeRange === '60d' ? 60 : 90;
    const result = [];
    const today = parseDateString(todayStr);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDateString(d);

      const dayLogs = logsByDate.get(dateStr) || [];
      const completedOnDay = dayLogs.filter(l => l.completed).length;
      const dueHabits = habits.filter(h => !h.archived && isHabitDueOnDate(h.frequency, h.custom_days, dateStr));
      const totalDue = dueHabits.length || 1;
      const percent = Math.min(100, Math.round((completedOnDay / totalDue) * 100));

      result.push({
        date: dateStr.substring(5), // MM-DD
        fullDate: dateStr,
        percentage: percent,
        completed: completedOnDay,
        total: totalDue,
      });
    }

    return result;
  }, [timeRange, todayStr, logsByDate, habits]);

  // Category Distribution
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    for (const h of habits) {
      const cat = h.category.toLowerCase();
      if (!counts[cat]) counts[cat] = { total: 0, completed: 0 };
    }

    for (const log of logs) {
      if (log.completed) {
        const habit = habits.find(h => h.id === log.habit_id);
        if (habit) {
          const cat = habit.category.toLowerCase();
          if (counts[cat]) {
            counts[cat].completed += 1;
          }
        }
      }
    }

    return Object.entries(counts).map(([name, data]) => ({
      category: `#${name}`,
      completions: data.completed,
    })).sort((a, b) => b.completions - a.completions);
  }, [habits, logs]);

  // Day of Week consistency
  const dayOfWeekStats = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const tallies = [0, 0, 0, 0, 0, 0, 0];
    for (const log of logs) {
      if (log.completed) {
        const dayIdx = parseDateString(log.date).getDay();
        tallies[dayIdx] += 1;
      }
    }
    return dayNames.map((name, idx) => ({
      day: name,
      count: tallies[idx],
    }));
  }, [logs]);

  // Heatmap Level Colors (calm, eye-friendly tones)
  const getLevelClass = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-[#39d353] border border-[#34c24d]';
      case 3:
        return 'bg-[#26a641] border border-[#22953b]';
      case 2:
        return 'bg-[#006d32] border border-[#005c2a]';
      case 1:
        return 'bg-[#0e4429] border border-[#0c3922]';
      default:
        return 'bg-[#101b15] border border-[#16251d] hover:border-term-accent/50';
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-term-border">
        <div>
          <h1 className="text-xl font-bold text-term-text flex items-center gap-2">
            <Activity className="text-term-accent" size={20} />
            <span>ANALYTICS_&amp;_METRICS</span>
          </h1>
          <p className="text-xs text-term-text-muted mt-0.5">
            Historical completion heatmaps, consistency streaks, and velocity trends
          </p>
        </div>

        <div className="flex items-center gap-1 bg-term-surface p-0.5 rounded border border-term-border text-xs">
          {(['30d', '60d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded transition-colors ${
                timeRange === range
                  ? 'bg-term-elevated text-term-accent font-bold border border-term-border'
                  : 'text-term-text-dim hover:text-term-text'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* GitHub-Style Contribution Heatmap Matrix */}
      <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-term-accent" />
            <h2 className="text-sm font-bold text-term-text">
              CONTRIBUTION_MATRIX // PAST 20 WEEKS
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-term-text-dim select-none">
            <span>Less</span>
            <span className="w-3 h-3 rounded-[2px] bg-[#101b15] border border-[#16251d] inline-block" />
            <span className="w-3 h-3 rounded-[2px] bg-[#0e4429] inline-block" />
            <span className="w-3 h-3 rounded-[2px] bg-[#006d32] inline-block" />
            <span className="w-3 h-3 rounded-[2px] bg-[#26a641] inline-block" />
            <span className="w-3 h-3 rounded-[2px] bg-[#39d353] inline-block" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-1.5 min-w-[700px]">
            {heatmapData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-3.5 h-3.5 rounded-sm border cursor-pointer transition-transform hover:scale-125 ${getLevelClass(cell.level)}`}
                    title={`${cell.date}: ${cell.completed}/${cell.total} (${cell.percent}%)`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hover detail tooltip bar */}
        <div className="mt-3 pt-2 border-t border-term-border/60 text-xs flex items-center justify-between min-h-[24px]">
          {hoveredCell ? (
            <div className="flex items-center gap-2 text-term-text">
              <span className="text-term-accent font-semibold">{hoveredCell.date}:</span>
              <span>{hoveredCell.completed} of {hoveredCell.total} habits completed</span>
              <span className="text-term-cyan font-bold">({hoveredCell.percent}%)</span>
            </div>
          ) : (
            <span className="text-term-text-dim text-[11px] italic">
              Hover over matrix cells to view daily completion audit
            </span>
          )}
          <span className="text-term-text-dim text-[11px]">
            Total historical logs: <strong className="text-term-text">{totalCompletedLogs}</strong>
          </span>
        </div>
      </div>

      {/* Completion Velocity Trend Chart */}
      <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-term-cyan" />
            <h2 className="text-sm font-bold text-term-text">
              COMPLETION_RATE_TREND ({timeRange.toUpperCase()})
            </h2>
          </div>
        </div>

        <div className="h-60 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="termGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21293e" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#10131d',
                  borderColor: '#333f5f',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: '#e5e7eb',
                }}
                formatter={(val: any) => [`${val}%`, 'Daily Rate']}
              />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#termGlow)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Analytics: Day of Week & Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Day of Week Consistency */}
        <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4">
          <h2 className="text-sm font-bold text-term-text mb-3 flex items-center gap-2">
            <CheckCircle size={15} className="text-term-accent" />
            <span>WEEKDAY_CONSISTENCY</span>
          </h2>
          <div className="h-44 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21293e" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10131d',
                    borderColor: '#333f5f',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#e5e7eb',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4">
          <h2 className="text-sm font-bold text-term-text mb-3 flex items-center gap-2">
            <Trophy size={15} className="text-term-amber" />
            <span>CATEGORY_VELOCITY</span>
          </h2>
          <div className="h-44 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats} layout="vertical" margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21293e" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10131d',
                    borderColor: '#333f5f',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#e5e7eb',
                  }}
                />
                <Bar dataKey="completions" fill="#bd93f9" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Habit Streak Leaderboard */}
      <div className="terminal-card rounded-md border border-term-border bg-term-surface p-4">
        <h2 className="text-sm font-bold text-term-text mb-3 flex items-center gap-2">
          <Flame size={15} className="text-term-amber" />
          <span>HABIT_STREAK_LEADERBOARD</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-term-border text-term-text-dim text-[11px]">
                <th className="pb-2 font-normal">HABIT</th>
                <th className="pb-2 font-normal">CATEGORY</th>
                <th className="pb-2 font-normal">CURRENT_STREAK</th>
                <th className="pb-2 font-normal">RECORD_STREAK</th>
                <th className="pb-2 font-normal text-right">TOTAL_LOGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-term-border/40">
              {habits.map(h => {
                const streak = streakMap.get(h.id) || {
                  currentStreak: 0,
                  longestStreak: 0,
                  totalCompletions: 0,
                  isCompletedToday: false,
                  freezeUsedDays: [],
                };

                return (
                  <tr key={h.id} className="hover:bg-term-elevated/40 transition-colors">
                    <td className="py-2.5 font-semibold text-term-text flex items-center gap-1.5">
                      <span className="text-term-accent">&gt;</span>
                      <span>{h.title}</span>
                    </td>
                    <td className="py-2.5 text-term-text-muted">
                      #{h.category}
                    </td>
                    <td className="py-2.5 font-bold text-term-amber">
                      🔥 {streak.currentStreak}d
                    </td>
                    <td className="py-2.5 text-term-text-dim">
                      {streak.longestStreak}d
                    </td>
                    <td className="py-2.5 text-right font-bold text-term-cyan">
                      {streak.totalCompletions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
