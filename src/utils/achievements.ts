/**
 * 업적 정의 및 해금 조건
 */
import type { Achievement } from '@/types';

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // 퀘스트 완료
  { id: 'first_quest', title: '첫 걸음', description: '첫 퀘스트를 완료했어요' },
  { id: 'quest_5', title: '발돌움', description: '퀘스트 5개 완료' },
  { id: 'quest_10', title: '성실한 용사', description: '퀘스트 10개 완료' },
  { id: 'quest_30', title: '퀘스트 마스터', description: '퀘스트 30개 완료' },
  { id: 'quest_50', title: '불굴의 탐험가', description: '퀘스트 50개 완료' },
  { id: 'quest_100', title: '전설의 용사', description: '퀘스트 100개 완료' },
  // 레벨
  { id: 'level_3', title: '성장 중', description: '레벨 3 달성' },
  { id: 'level_5', title: '레벨 5', description: '레벨 5 달성' },
  { id: 'level_10', title: '레벨 10', description: '레벨 10 달성' },
  { id: 'level_15', title: '고급 용사', description: '레벨 15 달성' },
  { id: 'level_20', title: '그랜드 마스터', description: '레벨 20 달성' },
  // 보유 골드
  { id: 'gold_100', title: '골드 맛보기', description: '골드 100 모음' },
  { id: 'gold_500', title: '골드 수집가', description: '골드 500 모음' },
  { id: 'gold_1000', title: '부자 용사', description: '골드 1000 모음' },
  { id: 'gold_2000', title: '황금 사냥꾼', description: '골드 2000 모음' },
  // 누적 획득 골드 (퀘스트 등)
  { id: 'total_earned_500', title: '수입 창출', description: '총 500 골드 획득' },
  { id: 'total_earned_2000', title: '대박 수입', description: '총 2000 골드 획득' },
  // 스트릭
  { id: 'streak_3', title: '3일 연속', description: '3일 연속 퀘스트 완료' },
  { id: 'streak_7', title: '일주일 연속', description: '7일 연속 퀘스트 완료' },
  { id: 'streak_14', title: '2주 연속', description: '14일 연속 퀘스트 완료' },
  // 상점·소비
  { id: 'first_purchase', title: '첫 구매', description: '보상 상점에서 첫 구매' },
  { id: 'shopper_5', title: '쇼핑 애호가', description: '보상 5번 구매' },
  { id: 'shopper_20', title: '대량 구매왕', description: '보상 20번 구매' },
  { id: 'spent_500', title: '소비 달인', description: '총 500 골드 사용' },
  { id: 'spent_1000', title: '황금 손님', description: '총 1000 골드 사용' },
];

export type AchievementId = (typeof ACHIEVEMENT_DEFINITIONS)[number]['id'];

/** 프로필 표시 순서: 쉬운 것부터 (id 순서대로) */
const ACHIEVEMENT_DISPLAY_ORDER: AchievementId[] = [
  'first_quest',
  'quest_5',
  'quest_10',
  'level_3',
  'level_5',
  'streak_3',
  'first_purchase',
  'gold_100',
  'quest_30',
  'level_10',
  'streak_7',
  'gold_500',
  'total_earned_500',
  'shopper_5',
  'quest_50',
  'level_15',
  'gold_1000',
  'streak_14',
  'spent_500',
  'quest_100',
  'level_20',
  'gold_2000',
  'total_earned_2000',
  'shopper_20',
  'spent_1000',
];

/** 저장된 업적과 최신 정의를 병합해 화면에 항상 전체 목록 표시 (쉬운 순서) */
export function mergeAchievementsForDisplay(
  existing: { id: string; unlockedAt?: string | null }[] | null | undefined
): Achievement[] {
  const merged = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const found = existing?.find((a) => a.id === def.id);
    const at = found?.unlockedAt;
    return { ...def, unlockedAt: at == null ? undefined : at };
  });
  const orderMap = new Map(ACHIEVEMENT_DISPLAY_ORDER.map((id, i) => [id, i]));
  return [...merged].sort((a, b) => {
    const orderA = orderMap.get(a.id as AchievementId) ?? 999;
    const orderB = orderMap.get(b.id as AchievementId) ?? 999;
    return orderA - orderB;
  });
}

export type AchievementState = {
  completedQuestCount: number;
  level: number;
  currentGold: number;
  streakCount: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  purchaseCount: number;
};

export function checkAchievementConditions(
  achievementId: string,
  state: AchievementState
): boolean {
  const totalEarned = state.totalGoldEarned ?? 0;
  const totalSpent = state.totalGoldSpent ?? 0;
  const purchases = state.purchaseCount ?? 0;

  switch (achievementId) {
    case 'first_quest':
      return state.completedQuestCount >= 1;
    case 'quest_5':
      return state.completedQuestCount >= 5;
    case 'quest_10':
      return state.completedQuestCount >= 10;
    case 'quest_30':
      return state.completedQuestCount >= 30;
    case 'quest_50':
      return state.completedQuestCount >= 50;
    case 'quest_100':
      return state.completedQuestCount >= 100;
    case 'level_3':
      return state.level >= 3;
    case 'level_5':
      return state.level >= 5;
    case 'level_10':
      return state.level >= 10;
    case 'level_15':
      return state.level >= 15;
    case 'level_20':
      return state.level >= 20;
    case 'gold_100':
      return state.currentGold >= 100;
    case 'gold_500':
      return state.currentGold >= 500;
    case 'gold_1000':
      return state.currentGold >= 1000;
    case 'gold_2000':
      return state.currentGold >= 2000;
    case 'total_earned_500':
      return totalEarned >= 500;
    case 'total_earned_2000':
      return totalEarned >= 2000;
    case 'streak_3':
      return state.streakCount >= 3;
    case 'streak_7':
      return state.streakCount >= 7;
    case 'streak_14':
      return state.streakCount >= 14;
    case 'first_purchase':
      return purchases >= 1;
    case 'shopper_5':
      return purchases >= 5;
    case 'shopper_20':
      return purchases >= 20;
    case 'spent_500':
      return totalSpent >= 500;
    case 'spent_1000':
      return totalSpent >= 1000;
    default:
      return false;
  }
}

/** 미해금 업적의 현재/목표 진행도 (표시용) */
export function getAchievementProgress(
  achievementId: string,
  state: AchievementState
): { current: number; target: number } | null {
  const totalEarned = state.totalGoldEarned ?? 0;
  const totalSpent = state.totalGoldSpent ?? 0;
  const purchases = state.purchaseCount ?? 0;

  switch (achievementId) {
    case 'first_quest':
      return { current: state.completedQuestCount, target: 1 };
    case 'quest_5':
      return { current: state.completedQuestCount, target: 5 };
    case 'quest_10':
      return { current: state.completedQuestCount, target: 10 };
    case 'quest_30':
      return { current: state.completedQuestCount, target: 30 };
    case 'quest_50':
      return { current: state.completedQuestCount, target: 50 };
    case 'quest_100':
      return { current: state.completedQuestCount, target: 100 };
    case 'level_3':
      return { current: state.level, target: 3 };
    case 'level_5':
      return { current: state.level, target: 5 };
    case 'level_10':
      return { current: state.level, target: 10 };
    case 'level_15':
      return { current: state.level, target: 15 };
    case 'level_20':
      return { current: state.level, target: 20 };
    case 'gold_100':
      return { current: state.currentGold, target: 100 };
    case 'gold_500':
      return { current: state.currentGold, target: 500 };
    case 'gold_1000':
      return { current: state.currentGold, target: 1000 };
    case 'gold_2000':
      return { current: state.currentGold, target: 2000 };
    case 'total_earned_500':
      return { current: totalEarned, target: 500 };
    case 'total_earned_2000':
      return { current: totalEarned, target: 2000 };
    case 'streak_3':
      return { current: state.streakCount, target: 3 };
    case 'streak_7':
      return { current: state.streakCount, target: 7 };
    case 'streak_14':
      return { current: state.streakCount, target: 14 };
    case 'first_purchase':
      return { current: purchases, target: 1 };
    case 'shopper_5':
      return { current: purchases, target: 5 };
    case 'shopper_20':
      return { current: purchases, target: 20 };
    case 'spent_500':
      return { current: totalSpent, target: 500 };
    case 'spent_1000':
      return { current: totalSpent, target: 1000 };
    default:
      return null;
  }
}
