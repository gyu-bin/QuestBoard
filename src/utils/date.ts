/**
 * 오늘 날짜/요일 포맷 (한국어)
 */
export function getTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/** YYYY-MM-DD */
export function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
