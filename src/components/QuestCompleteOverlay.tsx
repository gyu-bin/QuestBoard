/**
 * 퀘스트 완료 시 골드 카운트업 연출
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '@/theme';

interface QuestCompleteOverlayProps {
  visible: boolean;
  earnedGold: number;
  onFinish: () => void;
}

export function QuestCompleteOverlay({
  visible,
  earnedGold,
  onFinish,
}: QuestCompleteOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [displayGold, setDisplayGold] = useState(0);

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(0);
    setDisplayGold(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    const duration = 500;
    const start = Date.now();
    const interval = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const v = Math.round(t * earnedGold);
      setDisplayGold(v);
      if (t >= 1) clearInterval(interval);
    }, 40);
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 1800);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, [visible, earnedGold, onFinish, scale, opacity]);

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onFinish}
      style={StyleSheet.absoluteFill}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.box,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <CheckCircle2 size={48} color={COLORS.success} strokeWidth={2.5} />
          <Text style={styles.title}>골드 획득!</Text>
          <Text style={styles.gold}>+{displayGold} G</Text>
          <Text style={styles.hint}>탭하여 닫기</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  box: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    minWidth: 220,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.goldDark,
    marginTop: SPACING.md,
  },
  gold: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
