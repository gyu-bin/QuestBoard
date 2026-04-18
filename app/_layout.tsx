import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '@/store/useStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { COLORS } from '@/theme';

export default function RootLayout() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const user = useStore((s) => s.user);
  const setQuests = useStore((s) => s.setQuests);
  const resetRepeatQuestsIfNeeded = useStore((s) => s.resetRepeatQuestsIfNeeded);

  /** 예전 더미 퀘스트 id 제거 (한 번만 실행되면 됨) */
  const MOCK_QUEST_IDS = ['quest-1', 'quest-2', 'quest-3', 'quest-4', 'quest-5'];

  useEffect(() => {
    const finish = () => {
      setHasHydrated(true);
      const { quests, checkAchievements, ensureDailyChallenge, ensurePeriodChallenges } = useStore.getState();
      const withoutMock = quests.filter((q) => !MOCK_QUEST_IDS.includes(q.id));
      if (withoutMock.length !== quests.length) setQuests(withoutMock);
      checkAchievements();
      ensureDailyChallenge();
      ensurePeriodChallenges();
    };

    const unsub = useStore.persist.onFinishHydration(finish);
    const timeout = setTimeout(finish, 2500);
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [setQuests]);

  useEffect(() => {
    const t = setInterval(() => resetRepeatQuestsIfNeeded(), 60_000);
    return () => clearInterval(t);
  }, [resetRepeatQuestsIfNeeded]);

  if (!hasHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (user && (user.characterType === null || user.characterType === undefined)) {
    return (
      <>
        <StatusBar style="dark" />
        <OnboardingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
