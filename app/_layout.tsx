import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '@/store/useStore';
import { mockQuests } from '@/data/mockQuests';
import { mockRewards } from '@/data/mockRewards';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { COLORS } from '@/theme';

export default function RootLayout() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const user = useStore((s) => s.user);
  const setQuests = useStore((s) => s.setQuests);
  const setRewards = useStore((s) => s.setRewards);
  const resetRepeatQuestsIfNeeded = useStore((s) => s.resetRepeatQuestsIfNeeded);

  useEffect(() => {
    const finish = () => {
      setHasHydrated(true);
      const { quests, rewards, checkAchievements } = useStore.getState();
      if (quests.length === 0) setQuests(mockQuests);
      if (rewards.length === 0) setRewards(mockRewards);
      checkAchievements();
    };

    const unsub = useStore.persist.onFinishHydration(finish);
    const timeout = setTimeout(finish, 2500);
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [setQuests, setRewards]);

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
