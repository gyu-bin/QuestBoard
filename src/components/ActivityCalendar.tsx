/**
 * 활동 달력 - 해당 월에 퀘스트 완료한 날 표시
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/theme';
import { getDateKey } from '@/utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface ActivityCalendarProps {
  /** 퀘스트 완료한 날짜들 (YYYY-MM-DD) */
  completedDates: string[];
  /** 표시할 연월 (기본: 이번 달) */
  year?: number;
  month?: number;
  /** 월 라벨 숨기기 (상위에서 화살표와 함께 표시할 때) */
  hideMonthLabel?: boolean;
}

export function ActivityCalendar({
  completedDates,
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  hideMonthLabel = false,
}: ActivityCalendarProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const completedSet = new Set(completedDates);
  const todayKey = getDateKey(new Date());

  const blanks = Array(startWeekday).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  let cells: (number | null)[] = [...blanks, ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const monthLabel = `${year}년 ${month + 1}월`;

  const renderCell = (day: number | null, i: number) => {
    if (day === null) {
      return <View key={`empty-${i}`} style={styles.cell} />;
    }
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasActivity = completedSet.has(dateKey);
    const isToday = dateKey === todayKey;
    return (
      <View
        key={dateKey}
        style={[
          styles.cell,
          hasActivity && styles.cellActive,
          isToday && styles.cellToday,
        ]}
      >
        <Text
          style={[
            styles.cellText,
            hasActivity && styles.cellTextActive,
            isToday && styles.cellTextToday,
          ]}
        >
          {day}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.wrap, hideMonthLabel && styles.wrapCompact]}>
      {!hideMonthLabel && <Text style={styles.monthLabel}>{monthLabel}</Text>}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={`row-${ri}`} style={styles.row}>
            {row.map((day, di) => renderCell(day, ri * 7 + di))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotActive]} />
          <Text style={styles.legendText}>퀘스트 완료한 날</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotToday]} />
          <Text style={styles.legendText}>오늘</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  wrapCompact: {
    paddingTop: SPACING.xs,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  grid: {},
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  cellActive: {
    backgroundColor: COLORS.successLight,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  cellText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cellTextActive: {
    color: COLORS.success,
    fontWeight: '700',
  },
  cellTextToday: {
    color: COLORS.goldDark,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotActive: {
    backgroundColor: COLORS.success,
  },
  legendDotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
