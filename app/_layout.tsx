import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { mockQuests } from '@/data/mockQuests';
import { mockRewards } from '@/data/mockRewards';

export default function RootLayout() {
  const setQuests = useStore((s) => s.setQuests);
  const setRewards = useStore((s) => s.setRewards);
  const resetRepeatQuestsIfNeeded = useStore((s) => s.resetRepeatQuestsIfNeeded);

  // 저장된 데이터 복원 후, 퀘스트/보상이 비어 있으면 목업으로 초기화
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      const { quests, rewards, checkAchievements } = useStore.getState();
      if (quests.length === 0) setQuests(mockQuests);
      if (rewards.length === 0) setRewards(mockRewards);
      checkAchievements();
    });
    return unsub;
  }, [setQuests, setRewards]);

  // 반복 퀘스트 갱신 (매일/매주)
  useEffect(() => {
    const t = setInterval(() => resetRepeatQuestsIfNeeded(), 60_000);
    return () => clearInterval(t);
  }, [resetRepeatQuestsIfNeeded]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
