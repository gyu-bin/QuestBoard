import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Quest, Reward, Transaction, ToastMessage, Achievement } from '@/types';
import { levelFromTotalExp } from '@/utils/levelExp';
import {
  ACHIEVEMENT_DEFINITIONS,
  checkAchievementConditions,
} from '@/utils/achievements';

function mergeAchievements(existing: Achievement[]): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const found = existing?.find((a) => a.id === def.id);
    return found ? { ...def, unlockedAt: found.unlockedAt } : { ...def };
  });
}

interface QuestBoardState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserProfile: (payload: { nickname?: string; title?: string }) => void;

  addPoints: (amount: number, description: string) => void;
  spendPoints: (amount: number, description: string) => boolean;
  resetGold: () => void;
  resetProgress: () => void;

  quests: Quest[];
  setQuests: (quests: Quest[]) => void;
  addQuest: (input: {
    title: string;
    description: string;
    points_reward: number;
    difficulty: Quest['difficulty'];
    repeat_type: Quest['repeat_type'];
  }) => void;
  completeQuest: (questId: string) => boolean;
  uncompleteQuest: (questId: string) => boolean;
  deleteQuest: (questId: string) => void;
  resetRepeatQuestsIfNeeded: () => void;

  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  addReward: (input: {
    title: string;
    cost_points: number;
    stock_count: number;
    icon_type?: string;
  }) => void;
  deleteReward: (rewardId: string) => void;
  purchaseReward: (rewardId: string) => boolean;

  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;

  toasts: ToastMessage[];
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  /** 레벨업 시 표시용 (persist 제외), 0이면 미표시 */
  levelUpAmount: number;
  setLevelUpCleared: () => void;

  /** 스트릭 & 업적 & 일일 보너스 */
  streakCount: number;
  lastStreakDate: string | null; // YYYY-MM-DD
  lastDailyBonusDate: string | null;
  achievements: Achievement[];
  checkAchievements: () => void;
  claimDailyBonus: () => boolean;
}

const defaultUser: User = {
  id: 'user-1',
  email: 'hero@questboard.dev',
  nickname: '용사',
  level: 1,
  total_exp: 0,
  current_points: 0,
  gold_balance: 0,
};

export const useStore = create<QuestBoardState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      setUser: (user) => set({ user }),
      updateUserProfile: (payload) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            ...(payload.nickname !== undefined && { nickname: payload.nickname.trim() || user.nickname }),
            ...(payload.title !== undefined && { title: payload.title.trim() || undefined }),
          },
        });
      },

      addPoints: (amount, description) => {
        const { user, addTransaction } = get();
        if (!user) return;
        const newPoints = user.current_points + amount;
        const newExp = user.total_exp + amount;
        const newLevel = levelFromTotalExp(newExp);
        const levelUp = newLevel > user.level;
        set({
          user: {
            ...user,
            current_points: newPoints,
            gold_balance: newPoints,
            total_exp: newExp,
            level: newLevel,
          },
          ...(levelUp && { levelUpAmount: newLevel }),
        });
        addTransaction({
          id: `tx-${Date.now()}`,
          user_id: user.id,
          type: 'Earn',
          amount,
          description,
          created_at: new Date().toISOString(),
        });
      },

      spendPoints: (amount, description) => {
        const { user, addTransaction } = get();
        if (!user) return false;
        if (user.current_points < amount) return false;
        const newPoints = user.current_points - amount;
        set({
          user: {
            ...user,
            current_points: newPoints,
            gold_balance: newPoints,
          },
        });
        addTransaction({
          id: `tx-${Date.now()}`,
          user_id: user.id,
          type: 'Spend',
          amount,
          description,
          created_at: new Date().toISOString(),
        });
        return true;
      },

      resetGold: () => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            current_points: 0,
            gold_balance: 0,
          },
          transactions: [],
        });
      },

      resetProgress: () => {
        const { user, quests } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            level: 1,
            total_exp: 0,
          },
          quests: quests.map((q) => ({
            ...q,
            is_completed: false,
            completed_at: undefined,
          })),
          transactions: [],
        });
      },

      quests: [],
      setQuests: (quests) => set({ quests }),

      addQuest: (input) => {
        const { user, quests } = get();
        if (!user) return;
        const newQuest: Quest = {
          id: `quest-${Date.now()}`,
          user_id: user.id,
          title: input.title.trim(),
          description: input.description.trim(),
          points_reward: input.points_reward,
          difficulty: input.difficulty,
          repeat_type: input.repeat_type,
          is_completed: false,
          created_at: new Date().toISOString(),
        };
        set({ quests: [newQuest, ...quests] });
      },

      completeQuest: (questId) => {
        const { quests, user, addPoints } = get();
        const quest = quests.find((q) => q.id === questId);
        if (!quest || !user || quest.is_completed) return false;
        addPoints(quest.points_reward, `퀘스트 완료: ${quest.title}`);
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const { streakCount, lastStreakDate } = get();
        let newStreak = streakCount;
        if (lastStreakDate !== today) {
          newStreak = lastStreakDate === yesterday ? streakCount + 1 : 1;
        }
        set({
          quests: quests.map((q) =>
            q.id === questId
              ? { ...q, is_completed: true, completed_at: new Date().toISOString() }
              : q
          ),
          streakCount: newStreak,
          lastStreakDate: today,
        });
        get().checkAchievements();
        return true;
      },

      uncompleteQuest: (questId) => {
        const { quests, user } = get();
        const quest = quests.find((q) => q.id === questId);
        if (!quest || !user || !quest.is_completed) return false;
        const newPoints = Math.max(0, user.current_points - quest.points_reward);
        set({
          user: {
            ...user,
            current_points: newPoints,
            gold_balance: newPoints,
          },
          quests: quests.map((q) =>
            q.id === questId
              ? { ...q, is_completed: false, completed_at: undefined }
              : q
          ),
        });
        return true;
      },

      deleteQuest: (questId) => {
        set({ quests: get().quests.filter((q) => q.id !== questId) });
      },

      resetRepeatQuestsIfNeeded: () => {
        const { quests } = get();
        const now = new Date();
        const getWeekKey = (d: Date) => {
          const start = new Date(d);
          start.setDate(d.getDate() - d.getDay());
          return start.toISOString().slice(0, 10);
        };
        const thisWeekKey = getWeekKey(now);
        const updated = quests.map((q) => {
          if (!q.is_completed || q.repeat_type === 'None') return q;
          const completedAt = q.completed_at ? new Date(q.completed_at) : null;
          if (!completedAt) return q;
          const completedWeekKey = getWeekKey(completedAt);
          const shouldReset =
            q.repeat_type === 'Daily'
              ? completedAt.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)
              : q.repeat_type === 'Weekly' && completedWeekKey !== thisWeekKey;
          if (shouldReset)
            return { ...q, is_completed: false, completed_at: undefined };
          return q;
        });
        set({ quests: updated });
      },

      rewards: [],
      setRewards: (rewards) => set({ rewards }),

      addReward: (input) => {
        const { user, rewards } = get();
        if (!user) return;
        const newReward: Reward = {
          id: `reward-${Date.now()}`,
          user_id: user.id,
          title: input.title.trim(),
          cost_points: input.cost_points,
          stock_count: input.stock_count,
          icon_type: input.icon_type ?? 'gift',
        };
        set({ rewards: [newReward, ...rewards] });
      },

      deleteReward: (rewardId) => {
        set({ rewards: get().rewards.filter((r) => r.id !== rewardId) });
      },

      purchaseReward: (rewardId) => {
        const { rewards, user, spendPoints } = get();
        const reward = rewards.find((r) => r.id === rewardId);
        if (!reward || !user) return false;
        if (user.current_points < reward.cost_points) return false;
        if (reward.stock_count <= 0) return false;
        const ok = spendPoints(reward.cost_points, `보상 구매: ${reward.title}`);
        if (!ok) return false;
        set({
          rewards: rewards.map((r) =>
            r.id === rewardId ? { ...r, stock_count: Math.max(0, r.stock_count - 1) } : r
          ),
        });
        get().checkAchievements();
        return true;
      },

      transactions: [],
      addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),

      toasts: [],
      addToast: (message) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...message, id: `toast-${Date.now()}`, duration: message.duration ?? 2500 },
          ],
        })),
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      levelUpAmount: 0,
      setLevelUpCleared: () => set({ levelUpAmount: 0 }),

      streakCount: 0,
      lastStreakDate: null,
      lastDailyBonusDate: null,
      achievements: mergeAchievements([]),

      checkAchievements: () => {
        const { user, transactions, streakCount } = get();
        if (!user) return;
        const completedQuestCount = transactions.filter(
          (t) => t.type === 'Earn' && t.description.includes('퀘스트 완료')
        ).length;
        const totalGoldEarned = transactions
          .filter((t) => t.type === 'Earn')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalGoldSpent = transactions
          .filter((t) => t.type === 'Spend')
          .reduce((sum, t) => sum + t.amount, 0);
        const purchaseCount = transactions.filter((t) => t.type === 'Spend').length;
        const state = {
          completedQuestCount,
          level: user.level,
          currentGold: user.current_points,
          streakCount,
          totalGoldEarned,
          totalGoldSpent,
          purchaseCount,
        };
        const existing = get().achievements;
        const merged: Achievement[] = mergeAchievements(existing ?? []);
        const now = new Date().toISOString();
        let updated = false;
        const next = merged.map((a) => {
          if (a.unlockedAt) return a;
          if (!checkAchievementConditions(a.id, state)) return a;
          updated = true;
          return { ...a, unlockedAt: now };
        });
        set({ achievements: next });
        if (updated) {
          const newlyUnlocked = next.find((a) => a.unlockedAt === now);
          if (newlyUnlocked) {
            get().addToast({
              type: 'success',
              text: `🏆 업적 달성: ${newlyUnlocked.title}`,
              duration: 3000,
            });
          }
        }
      },

      claimDailyBonus: () => {
        const { user, lastDailyBonusDate, addPoints } = get();
        if (!user) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (lastDailyBonusDate === today) return false;
        addPoints(50, '일일 출석 보너스');
        set({ lastDailyBonusDate: today });
        return true;
      },
    }),
    {
      name: 'questboard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        quests: s.quests,
        rewards: s.rewards,
        transactions: s.transactions,
        streakCount: s.streakCount,
        lastStreakDate: s.lastStreakDate,
        lastDailyBonusDate: s.lastDailyBonusDate,
        achievements: s.achievements,
      }),
    }
  )
);
