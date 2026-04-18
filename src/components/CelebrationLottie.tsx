import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS } from '@/theme';

interface CelebrationLottieProps {
  visible: boolean;
  onFinish?: () => void;
  sourceUri?: string;
}

/** Lottie 대신 간단한 애니메이션 (네이티브 크래시 회피) */
export function CelebrationLottie({ visible, onFinish }: CelebrationLottieProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish?.());
    }, 1200);
    return () => clearTimeout(t);
  }, [visible, onFinish, scale, opacity]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
          <View style={styles.sparkleWrap}>
            <Sparkles size={36} color={COLORS.surface} strokeWidth={2} />
          </View>
          <Text style={styles.text}>골드 획득!</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  box: {
    backgroundColor: '#E8A838',
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  sparkleWrap: {
    marginBottom: 8,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
});
