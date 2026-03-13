import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/theme';

interface LevelUpEffectProps {
  level: number;
  visible: boolean;
  onDismiss: () => void;
}

export function LevelUpEffect({ level, visible, onDismiss }: LevelUpEffectProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || level < 1) return;
    scale.setValue(0);
    opacity.setValue(0);
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
    const t = setTimeout(onDismiss, 2200);
    return () => clearTimeout(t);
  }, [visible, level, onDismiss, scale, opacity]);

  if (!visible || level < 1) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onDismiss}
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
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>레벨 업!</Text>
          <Text style={styles.level}>Lv.{level}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  box: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.goldDark,
    marginBottom: 4,
  },
  level: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
