import { Habit, HabitLog } from '../types';

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(habits: Habit[], logs: HabitLog[]): void {
  const habitMap = new Map<string, Habit>(habits.map(h => [h.id, h]));
  const headers = ['Date', 'Habit ID', 'Habit Title', 'Category', 'Type', 'Target', 'Value Completed', 'Completed Status'];
  
  const rows = logs.map(log => {
    const habit = habitMap.get(log.habit_id);
    const title = habit ? `"${habit.title.replace(/"/g, '""')}"` : 'Unknown';
    const category = habit?.category || '';
    const type = habit?.type || '';
    const target = habit?.target_value ?? '';
    const completed = log.completed ? 'TRUE' : 'FALSE';

    return [
      log.date,
      log.habit_id,
      title,
      category,
      type,
      target,
      log.value,
      completed,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const filename = `init-habits-export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
