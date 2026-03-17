/**
 * 사용자 특성 & 퀘스트 카테고리 (특성 보너스 +10%)
 */
import type { CharacterType, QuestCategory } from '@/types';

export const CHARACTER_TYPES: { value: CharacterType; label: string; description: string; emoji: string }[] = [
  { value: 'fitness', label: '운동인', description: '헬스·운동 퀘스트 완료 시 골드 +10%', emoji: '💪' },
  { value: 'knowledge', label: '지식인', description: '공부·학습 퀘스트 완료 시 골드 +10%', emoji: '📚' },
  { value: 'creative', label: '창작인', description: '창작·예술 퀘스트 완료 시 골드 +10%', emoji: '🎨' },
  { value: 'life', label: '정비인', description: '정리·생활 습관 퀘스트 완료 시 골드 +10%', emoji: '🏠' },
];

export const QUEST_CATEGORIES: { value: QuestCategory; label: string }[] = [
  { value: 'fitness', label: '운동' },
  { value: 'knowledge', label: '공부' },
  { value: 'creative', label: '창작' },
  { value: 'life', label: '생활' },
  { value: 'none', label: '해당 없음' },
];

/** 퀘스트 추가 시 사용 – 특성과 같은 순서·이모지로 표시 */
export const QUEST_CATEGORIES_WITH_TRAIT: { value: QuestCategory; label: string; emoji: string }[] = [
  { value: 'fitness', label: '운동', emoji: '💪' },
  { value: 'knowledge', label: '공부', emoji: '📚' },
  { value: 'creative', label: '창작', emoji: '🎨' },
  { value: 'life', label: '생활', emoji: '🏠' },
  { value: 'none', label: '해당 없음', emoji: '' },
];

export const TRAIT_BONUS_RATE = 1.1;

export function getCharacterLabel(type: CharacterType | null | undefined): string {
  if (!type) return '';
  return CHARACTER_TYPES.find((c) => c.value === type)?.label ?? type;
}

export function getCategoryLabel(cat: QuestCategory | undefined): string {
  if (!cat || cat === 'none') return '해당 없음';
  return QUEST_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}
