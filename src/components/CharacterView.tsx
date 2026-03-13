/**
 * 레벨/기분에 따라 보여주는 캐릭터 뷰 (시각적 연출)
 * 레벨 구간: 1-2 알, 3-5 새싹, 6+ 용사
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/theme';

export type CharacterMood = 'idle' | 'happy' | 'levelup';

interface CharacterViewProps {
  level: number;
  mood?: CharacterMood;
  size?: 'small' | 'medium' | 'large';
}

function getStage(level: number): { emoji: string; label: string } {
  if (level <= 2) return { emoji: '🥚', label: '알' };
  if (level <= 5) return { emoji: '🌱', label: '새싹' };
  return { emoji: '⚔️', label: '용사' };
}

export function CharacterView({
  level,
  mood = 'idle',
  size = 'medium',
}: CharacterViewProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const { emoji, label } = getStage(level);

  useEffect(() => {
    if (mood === 'happy' || mood === 'levelup') {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
          tension: 200,
        }),
      ]).start();
    }
    if (mood === 'levelup') {
      bounce.setValue(0);
      Animated.timing(bounce, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [mood, scale, bounce]);

  const sizeNum = size === 'small' ? 48 : size === 'medium' ? 72 : 96;
  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          width: sizeNum + 24,
          height: sizeNum + 24,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <View style={[styles.circle, { width: sizeNum, height: sizeNum }]}>
        <Text style={[styles.emoji, { fontSize: sizeNum * 0.55 }]}>{emoji}</Text>
      </View>
      {mood === 'levelup' && (
        <View style={styles.glow}>
          <Text style={styles.glowText}>✨</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldLight + 'cc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  emoji: {},
  glow: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
  },
  glowText: {
    fontSize: 14,
  },
});
