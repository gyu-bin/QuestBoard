import type { Quest, RepeatType } from '@/types';

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, day] = ymd.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function addCalendarDays(ymd: string, deltaDays: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + deltaDays);
  return localDateKey(d);
}

export function questPeriodBounds(quest: Quest): { start: string; end: string; totalDays: number } | null {
  if (quest.repeat_type !== 'Daily') return null;
  const totalDays = Math.max(1, quest.goal_period_days ?? 30);
  const start = localDateKey(new Date(quest.created_at));
  const end = addCalendarDays(start, totalDays - 1);
  return { start, end, totalDays };
}

export function isQuestPeriodExpired(quest: Quest, now = new Date()): boolean {
  const b = questPeriodBounds(quest);
  if (!b) return false;
  return localDateKey(now) > b.end;
}

export function completionsInPeriod(quest: Quest): number {
  const b = questPeriodBounds(quest);
  if (!b) return quest.is_completed ? 1 : 0;
  const dates = quest.completed_dates ?? [];
  return [...new Set(dates)].filter((d) => d >= b.start && d <= b.end).length;
}

export function questProgressRatio(quest: Quest): number {
  if (quest.repeat_type === 'None') return quest.is_completed ? 1 : 0;
  const b = questPeriodBounds(quest);
  if (!b) return 0;
  const done = completionsInPeriod(quest);
  return Math.min(1, done / b.totalDays);
}

export function questProgressLabel(quest: Quest): string {
  if (quest.repeat_type === 'None') {
    return quest.is_completed ? '완료' : '미완료 (1회)';
  }
  const b = questPeriodBounds(quest);
  if (!b) return '';
  const done = completionsInPeriod(quest);
  return `${done} / ${b.totalDays}일`;
}

export function questRepeatSummary(quest: Quest): string {
  if (quest.repeat_type === 'None') return '반복 안 함';
  return `매일 · ${quest.goal_period_days ?? 30}일`;
}

/** 저장소에 Weekly 등 예전 값이 있을 때 정규화 */
export function migrateQuestFromStorage(raw: Quest & { repeat_type?: string }): Quest {
  const legacyType = String(raw.repeat_type ?? 'Daily');
  let repeat_type: RepeatType = legacyType === 'None' ? 'None' : 'Daily';
  if (legacyType === 'Weekly') repeat_type = 'Daily';

  let goal_period_days = raw.goal_period_days;
  if (legacyType === 'Weekly') goal_period_days = goal_period_days ?? 7;
  if (repeat_type === 'Daily' && (goal_period_days == null || goal_period_days < 1)) {
    goal_period_days = 365;
  }

  const completed_dates = Array.isArray(raw.completed_dates) ? [...raw.completed_dates] : [];

  return {
    ...raw,
    repeat_type,
    goal_period_days: repeat_type === 'Daily' ? goal_period_days : undefined,
    completed_dates: repeat_type === 'Daily' ? completed_dates : undefined,
  };
}
