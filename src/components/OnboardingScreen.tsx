import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { CHARACTER_TYPES } from '@/constants/character';
import { CharacterTraitIcon } from '@/components/CharacterTraitIcon';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import type { CharacterType } from '@/types';

export function OnboardingScreen() {
  const updateUserProfile = useStore((s) => s.updateUserProfile);

  const handleSelect = (value: CharacterType) => {
    updateUserProfile({ characterType: value });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>나의 특성을 선택해주세요</Text>
        <Text style={styles.subtitle}>
          선택한 특성과 맞는 퀘스트를 완료하면{'\n'}골드를 10% 더 받을 수 있어요
        </Text>
        <View style={styles.cards}>
          {CHARACTER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.card, SHADOWS.card]}
              onPress={() => handleSelect(t.value)}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                <CharacterTraitIcon type={t.value} size={32} color={COLORS.goldDark} />
              </View>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardDesc}>{t.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl * 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xxl * 2,
  },
  cards: {
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  iconWrap: {
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
});
