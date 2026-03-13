/**
 * 좌우 스와이프 + 화살표로 이전/다음 달 보기
 */
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { SPACING, COLORS } from '@/theme';

interface CalendarWithSwipeProps {
  completedDates: string[];
}

function getMonthKey(year: number, month: number) {
  return `${year}-${month}`;
}

function getMonthLabel(year: number, month: number) {
  return `${year}년 ${month + 1}월`;
}

export function CalendarWithSwipe({ completedDates }: CalendarWithSwipeProps) {
  const { width } = useWindowDimensions();
  const pageWidth = width - SPACING.xl * 2;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(12);

  const months = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    for (let i = -12; i <= 12; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return list;
  }, [currentYear, currentMonth]);

  const initialIndex = 12;
  const current = months[currentIndex] ?? { year: currentYear, month: currentMonth };

  const getItemLayout = (_: unknown, index: number) => ({
    length: pageWidth,
    offset: index * pageWidth,
    index,
  });

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setCurrentIndex(Math.max(0, Math.min(months.length - 1, idx)));
    },
    [pageWidth, months.length]
  );

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex >= months.length - 1) return;
    const next = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  }, [currentIndex, months.length]);

  return (
    <View style={[styles.wrap, { width: pageWidth }]}>
      <View style={styles.monthRow}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={goPrev}
          disabled={currentIndex <= 0}
          hitSlop={12}
        >
          <ChevronLeft size={24} color={currentIndex <= 0 ? COLORS.textMuted : COLORS.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{getMonthLabel(current.year, current.month)}</Text>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={goNext}
          disabled={currentIndex >= months.length - 1}
          hitSlop={12}
        >
          <ChevronRight size={24} color={currentIndex >= months.length - 1 ? COLORS.textMuted : COLORS.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={months}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => getMonthKey(item.year, item.month)}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pageWidth }]}>
            <ActivityCalendar
              completedDates={completedDates}
              year={item.year}
              month={item.month}
              hideMonthLabel
            />
          </View>
        )}
      />
      <Text style={styles.hint}>← 좌우로 스와이프하여 이전/다음 달 보기</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  arrowBtn: {
    padding: SPACING.xs,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  page: {
    justifyContent: 'flex-start',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
