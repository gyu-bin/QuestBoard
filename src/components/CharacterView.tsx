/**
 * 메이플스타일 2D 캐릭터 – 큰 머리, 짧은 머리, 흰/연파랑 티, 바지, 맨발
 * 레벨 구간: 1-2 기본, 3-5 새싹, 6+ 용사
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS } from '@/theme';

export type CharacterMood = 'idle' | 'happy' | 'levelup';

interface CharacterViewProps {
  level: number;
  mood?: CharacterMood;
  size?: 'small' | 'medium' | 'large';
  skinEmoji?: string | null;
}

function getStage(level: number): { accent: 'default' | 'sprout' | 'hero' } {
  if (level <= 2) return { accent: 'default' };
  if (level <= 5) return { accent: 'sprout' };
  return { accent: 'hero' };
}

const OUTLINE = '#2D2A26';
const FACE = '#FFE4C4';
const HAIR = '#2D2A26';
const SHIRT = '#E8F4FC';
const SHORTS = '#C4956A';
const FOOT_SKIN = '#FFE4C4';

export function CharacterView({
  level,
  mood = 'idle',
  size = 'medium',
  skinEmoji,
}: CharacterViewProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const { accent } = getStage(level);

  useEffect(() => {
    if (mood === 'happy' || mood === 'levelup') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 200 }),
      ]).start();
    }
    if (mood === 'levelup') {
      bounce.setValue(0);
      Animated.timing(bounce, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [mood, scale, bounce]);

  const sizeNum = size === 'small' ? 48 : size === 'medium' ? 72 : 96;
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const headD = sizeNum * 0.5;
  const headR = headD / 2;
  const shirtW = sizeNum * 0.42;
  const shirtH = sizeNum * 0.2;
  const shortsW = sizeNum * 0.38;
  const shortsH = sizeNum * 0.18;
  const eyeW = sizeNum * 0.06;
  const eyeH = sizeNum * 0.045;
  const footW = sizeNum * 0.1;
  const footH = sizeNum * 0.06;

  const shirtColor = accent === 'sprout' ? '#7BC9A0' : accent === 'hero' ? COLORS.goldDark : SHIRT;
  const shortsColor = accent === 'sprout' ? '#5BA87E' : accent === 'hero' ? '#8B6914' : SHORTS;

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
        {skinEmoji ? (
          <View style={styles.skinOverlay}>
            <Text style={[styles.skinEmoji, { fontSize: sizeNum * 0.28 }]}>{skinEmoji}</Text>
          </View>
        ) : null}
        <View style={[styles.figure, { width: sizeNum, height: sizeNum }]}>
          {/* 맨발 */}
          <View style={[styles.foot, { width: footW, height: footH, borderRadius: 3, left: sizeNum * 0.3 - footW / 2, top: headR * 2 + shirtH + shortsH }]} />
          <View style={[styles.foot, { width: footW, height: footH, borderRadius: 3, right: sizeNum * 0.3 - footW / 2, top: headR * 2 + shirtH + shortsH }]} />
          {/* 바지 */}
          <View
            style={[
              styles.shorts,
              {
                width: shortsW,
                height: shortsH,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: OUTLINE,
                backgroundColor: shortsColor,
                top: headR * 2 + shirtH,
              },
            ]}
          />
          {/* 티셔츠 */}
          <View
            style={[
              styles.shirt,
              {
                width: shirtW,
                height: shirtH,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: OUTLINE,
                backgroundColor: shirtColor,
                top: headR * 2 - 1,
              },
            ]}
          />
          {/* 머리 (얼굴) */}
          <View
            style={[
              styles.head,
              {
                width: headD,
                height: headD,
                borderRadius: headR,
                borderWidth: 2,
                borderColor: OUTLINE,
                backgroundColor: FACE,
                top: 0,
              },
            ]}
          >
            {/* 눈 (작은 타원) */}
            <View style={[styles.eye, { width: eyeW, height: eyeH, borderRadius: eyeH / 2, left: headR * 0.4, top: headR * 0.55 }]} />
            <View style={[styles.eye, { width: eyeW, height: eyeH, borderRadius: eyeH / 2, right: headR * 0.4, top: headR * 0.55 }]} />
          </View>
          {/* 짧은 머리 (볼컷, 머리 위에 겹침) */}
          <View
            style={[
              styles.hair,
              {
                width: headD * 1.08,
                height: headR * 0.75,
                borderRadius: headR * 0.45,
                borderWidth: 1.5,
                borderColor: OUTLINE,
                backgroundColor: HAIR,
                top: headR * 0.05,
              },
            ]}
          />
          {accent === 'hero' && (
            <View style={[styles.heroCrown, { top: -sizeNum * 0.08 }]}>
              <Text style={{ fontSize: sizeNum * 0.2 }}>✨</Text>
            </View>
          )}
        </View>
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
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldLight + 'cc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  skinOverlay: { position: 'absolute', top: 2, right: 2 },
  skinEmoji: {},
  figure: { position: 'relative', alignItems: 'center' },
  hair: { position: 'absolute' },
  head: { position: 'absolute' },
  eye: { position: 'absolute', backgroundColor: OUTLINE },
  shirt: { position: 'absolute' },
  shorts: { position: 'absolute' },
  foot: { position: 'absolute', backgroundColor: FOOT_SKIN, borderWidth: 1.5, borderColor: OUTLINE },
  heroCrown: { position: 'absolute' },
  glow: { position: 'absolute', bottom: -4, alignSelf: 'center' },
  glowText: { fontSize: 14 },
});
