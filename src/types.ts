/**
 * QuestBoard - Core Data Types
 * Users, Quests, Rewards, Transactions 스키마 기반 타입 정의
 */

// ============ Enums ============
export type QuestDifficulty = 'Easy' | 'Normal' | 'Hard';
export type RepeatType = 'Daily' | 'Weekly' | 'None';
export type TransactionType = 'Earn' | 'Spend';

/** 사용자 특성 (온보딩에서 1개 선택) - 매칭 퀘스트 완료 시 골드 +10% */
export type CharacterType = 'fitness' | 'knowledge' | 'creative' | 'life';
/** 퀘스트 카테고리 (특성 보너스 매칭용) */
export type QuestCategory = CharacterType | 'none';

// ============ User ============
export interface User {
  id: string;
  email: string;
  nickname: string;
  /** 사용자 칭호 (커스텀) */
  title?: string;
  /** 선택한 특성 - 매칭 퀘스트 완료 시 골드 +10% */
  characterType?: CharacterType | null;
  level: number;
  total_exp: number;
  current_points: number;
  gold_balance: number;
}

// ============ Quest ============
export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  points_reward: number;
  difficulty: QuestDifficulty;
  is_completed: boolean;
  created_at: string; // ISO date
  repeat_type: RepeatType;
  completed_at?: string; // ISO date, 반복 퀘스트 갱신 판단용
  /** 카테고리 - 사용자 특성과 일치 시 골드 +10% */
  category?: QuestCategory;
}

// ============ Reward ============
export interface Reward {
  id: string;
  user_id: string;
  title: string;
  cost_points: number;
  stock_count: number;
  icon_type: string;
}

// ============ Transaction ============
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
}

// ============ UI / Store 보조 타입 ============
export type ToastType = 'success' | 'error' | 'info';
export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
  duration?: number;
}

// ============ 업적 ============
export interface Achievement {
  id: string;
  title: string;
  description?: string;
  unlockedAt?: string; // ISO date, 있으면 해금됨
}
