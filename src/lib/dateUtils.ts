export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDisplayDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isHabitDueOnDate(frequency: string, customDays: number[] | undefined, dateStr: string): boolean {
  const d = parseDateString(dateStr);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return Array.isArray(customDays) && customDays.includes(dayOfWeek);
    default:
      return true;
  }
}

export function getDaysInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const current = parseDateString(startDateStr);
  const end = parseDateString(endDateStr);

  while (current <= end) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
