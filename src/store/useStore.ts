import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Quest, Reward, Transaction, ToastMessage, Achievement, CharacterType, QuestCategory } from '@/types';
import { TRAIT_BONUS_RATE } from '@/constants/character';
import { levelFromTotalExp } from '@/utils/levelExp';
import {
  ACHIEVEMENT_DEFINITIONS,
  checkAchievementConditions,
} from '@/utils/achievements';
import { playQuestComplete, playAchievement, playLevelUp, playPurchase, playComboBonus } from '@/utils/sound';
import { SKINS, getSkinById } from '@/constants/skins';

function mergeAchievements(existing: Achievement[]): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const found = existing?.find((a) => a.id === def.id);
    return found ? { ...def, unlockedAt: found.unlockedAt } : { ...def };
  });
}

interface QuestBoardState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserProfile: (payload: { nickname?: string; title?: string; characterType?: CharacterType | null }) => void;
  purchaseSkin: (skinId: string) => boolean;
  equipSkin: (skinId: string | null) => void;

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
    category?: QuestCategory;
  }) => void;
  /** 퀘스트 완료. 성공 시 지급된 골드 수 반환, 실패 시 false */
  completeQuest: (questId: string) => number | false;
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

  /** 오늘의 도전 (데일리 챌린지) */
  dailyChallenge: { date: string; type: 'hard' | 'three'; claimed: boolean };
  ensureDailyChallenge: () => void;
  tryClaimDailyChallenge: (completedQuestDifficulty: string, todayQuestCount: number) => boolean;

  /** 주간/월간 챌린지 */
  weeklyChallenge: { weekKey: string; progress: number; claimed: boolean };
  monthlyChallenge: { monthKey: string; progress: number; claimed: boolean };
  ensurePeriodChallenges: () => void;
  tryClaimWeeklyChallenge: () => boolean;
  tryClaimMonthlyChallenge: () => boolean;
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
            ...(payload.characterType !== undefined && { characterType: payload.characterType }),
          },
        });
      },

      purchaseSkin: (skinId) => {
        const { user, spendPoints, addToast } = get();
        const skin = getSkinById(skinId) ?? SKINS.find((s) => s.id === skinId);
        if (!user || !skin) return false;
        const owned = user.ownedSkinIds ?? [];
        if (owned.includes(skinId)) return false;
        if (user.current_points < skin.cost) {
          addToast({ type: 'error', text: '골드가 부족해요 💧' });
          return false;
        }
        const ok = spendPoints(skin.cost, `스킨 구매: ${skin.name}`);
        if (!ok) return false;
        set({ user: { ...user, ownedSkinIds: [...owned, skinId] } });
        playPurchase();
        return true;
      },

      equipSkin: (skinId) => {
        const { user } = get();
        if (!user) return;
        const owned = user.ownedSkinIds ?? [];
        if (skinId !== null && !owned.includes(skinId)) return;
        set({ user: { ...user, equippedSkinId: skinId } });
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
        if (levelUp) setTimeout(() => playLevelUp(), 350);
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
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            level: 1,
            total_exp: 0,
            characterType: null,
            title: undefined,
            ownedSkinIds: [],
            equippedSkinId: null,
          },
          quests: [],
          transactions: [],
          streakCount: 0,
          lastStreakDate: null,
          lastDailyBonusDate: null,
          achievements: mergeAchievements([]),
          dailyChallenge: { date: '', type: 'three', claimed: true },
          weeklyChallenge: { weekKey: '', progress: 0, claimed: true },
          monthlyChallenge: { monthKey: '', progress: 0, claimed: true },
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
          category: input.category ?? 'none',
        };
        set({ quests: [newQuest, ...quests] });
      },

      completeQuest: (questId) => {
        const { quests, user, addPoints, addToast } = get();
        const quest = quests.find((q) => q.id === questId);
        if (!quest || !user || quest.is_completed) return false;
        const category = quest.category ?? 'none';
        const traitMatch = category !== 'none' && user.characterType === category;
        const finalGold = traitMatch
          ? Math.round(quest.points_reward * TRAIT_BONUS_RATE)
          : quest.points_reward;
        addPoints(finalGold, `퀘스트 완료: ${quest.title}`);
        playQuestComplete();
        if (traitMatch) {
          addToast({ type: 'success', text: `특성 보너스! +${finalGold - quest.points_reward} G`, duration: 2000 });
        }
        const today = new Date().toISOString().slice(0, 10);
        const todayQuestCompletions = [...get().transactions].filter(
          (t) => t.type === 'Earn' && t.description.startsWith('퀘스트 완료:')
        ).length;
        const comboBonus =
          todayQuestCompletions >= 4 ? 15 : todayQuestCompletions === 3 ? 10 : todayQuestCompletions === 2 ? 5 : 0;
        if (comboBonus > 0) {
          get().addPoints(comboBonus, '콤보 보너스');
          addToast({ type: 'success', text: `${todayQuestCompletions}개 연속! 콤보 +${comboBonus} G`, duration: 2000 });
          playComboBonus();
        }
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
        get().tryClaimDailyChallenge(quest.difficulty, todayQuestCompletions);
        get().ensurePeriodChallenges();
        get().tryClaimWeeklyChallenge();
        get().tryClaimMonthlyChallenge();
        return finalGold;
      },

      uncompleteQuest: (questId) => {
        const { quests, user, transactions, streakCount, lastStreakDate } = get();
        const quest = quests.find((q) => q.id === questId);
        if (!quest || !user || !quest.is_completed) return false;
        const category = quest.category ?? 'none';
        const traitMatch = category !== 'none' && user.characterType === category;
        const amountToSubtract = traitMatch
          ? Math.round(quest.points_reward * TRAIT_BONUS_RATE)
          : quest.points_reward;
        const newPoints = Math.max(0, user.current_points - amountToSubtract);
        const newExp = Math.max(0, user.total_exp - amountToSubtract);
        const newLevel = levelFromTotalExp(newExp);

        // 해당 퀘스트 완료 거래 1건 제거 (가장 최근 것 = 리스트 앞)
        const questDesc = `퀘스트 완료: ${quest.title}`;
        let removed = false;
        const newTransactions = transactions.filter((t) => {
          if (!removed && t.type === 'Earn' && t.description === questDesc) {
            removed = true;
            return false;
          }
          return true;
        });

        // 오늘 남은 완료가 0건이면 스트릭 되돌리기
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const todayCompletionsLeft = newTransactions.filter(
          (t) => t.type === 'Earn' && t.description.startsWith('퀘스트 완료:') && t.created_at.startsWith(today)
        ).length;
        const newStreakCount = todayCompletionsLeft === 0 ? Math.max(0, streakCount - 1) : streakCount;
        const newLastStreakDate = todayCompletionsLeft === 0 ? (streakCount <= 1 ? null : yesterday) : lastStreakDate;

        set({
          user: {
            ...user,
            current_points: newPoints,
            gold_balance: newPoints,
            total_exp: newExp,
            level: newLevel,
          },
          quests: quests.map((q) =>
            q.id === questId
              ? { ...q, is_completed: false, completed_at: undefined }
              : q
          ),
          transactions: newTransactions,
          streakCount: newStreakCount,
          lastStreakDate: newLastStreakDate,
        });
        get().ensurePeriodChallenges();
        get().checkAchievements();
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
        playPurchase();
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
            playAchievement();
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

      dailyChallenge: { date: '', type: 'three', claimed: true },
      ensureDailyChallenge: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { dailyChallenge } = get();
        if (dailyChallenge.date === today) return;
        const types: ('hard' | 'three')[] = ['hard', 'three'];
        const type = types[Math.floor(Math.random() * types.length)];
        set({ dailyChallenge: { date: today, type, claimed: false } });
      },
      tryClaimDailyChallenge: (completedQuestDifficulty, todayQuestCount) => {
        const { dailyChallenge, addPoints, addToast } = get();
        const today = new Date().toISOString().slice(0, 10);
        if (dailyChallenge.date !== today || dailyChallenge.claimed) return false;
        const satisfied =
          dailyChallenge.type === 'hard'
            ? completedQuestDifficulty === 'Hard'
            : dailyChallenge.type === 'three' && todayQuestCount >= 3;
        if (!satisfied) return false;
        addPoints(20, '오늘의 도전 보너스');
        addToast({ type: 'success', text: '🎯 오늘의 도전 달성! +20 G', duration: 2500 });
        set({ dailyChallenge: { ...dailyChallenge, claimed: true } });
        return true;
      },

      weeklyChallenge: { weekKey: '', progress: 0, claimed: true },
      monthlyChallenge: { monthKey: '', progress: 0, claimed: true },
      ensurePeriodChallenges: () => {
        const now = new Date();
        const getWeekKey = () => {
          const d = new Date(now);
          d.setDate(d.getDate() - d.getDay());
          return d.toISOString().slice(0, 10);
        };
        const weekKey = getWeekKey();
        const monthKey = now.toISOString().slice(0, 7);
        const { transactions, weeklyChallenge, monthlyChallenge } = get();
        const questCompletions = transactions.filter(
          (t) => t.type === 'Earn' && t.description.startsWith('퀘스트 완료:')
        );
        const weekProgress = questCompletions.filter((t) => {
          const d = new Date(t.created_at);
          d.setDate(d.getDate() - d.getDay());
          return d.toISOString().slice(0, 10) === weekKey;
        }).length;
        const monthProgress = questCompletions.filter(
          (t) => t.created_at.slice(0, 7) === monthKey
        ).length;
        set({
          weeklyChallenge: {
            weekKey,
            progress: weekProgress,
            claimed: weeklyChallenge.weekKey === weekKey ? weeklyChallenge.claimed : false,
          },
          monthlyChallenge: {
            monthKey,
            progress: monthProgress,
            claimed: monthlyChallenge.monthKey === monthKey ? monthlyChallenge.claimed : false,
          },
        });
      },
      tryClaimWeeklyChallenge: () => {
        const { weeklyChallenge, addPoints, addToast } = get();
        if (weeklyChallenge.progress < 7 || weeklyChallenge.claimed) return false;
        addPoints(50, '주간 챌린지 보너스');
        addToast({ type: 'success', text: '📅 주간 챌린지 달성! +50 G', duration: 2500 });
        set({ weeklyChallenge: { ...weeklyChallenge, claimed: true } });
        return true;
      },
      tryClaimMonthlyChallenge: () => {
        const { monthlyChallenge, addPoints, addToast } = get();
        if (monthlyChallenge.progress < 20 || monthlyChallenge.claimed) return false;
        addPoints(100, '월간 챌린지 보너스');
        addToast({ type: 'success', text: '📆 월간 챌린지 달성! +100 G', duration: 2500 });
        set({ monthlyChallenge: { ...monthlyChallenge, claimed: true } });
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
        dailyChallenge: s.dailyChallenge,
        weeklyChallenge: s.weeklyChallenge,
        monthlyChallenge: s.monthlyChallenge,
      }),
    }
  )
);
