/**
 * 캐릭터 스킨/악세사리 - 상점에서 골드로 구매
 */
export interface SkinDef {
  id: string;
  name: string;
  cost: number;
  emoji: string;
}

export const SKINS: SkinDef[] = [
  { id: 'hat_cap', name: '모자', cost: 30, emoji: '🧢' },
  { id: 'glasses', name: '안경', cost: 50, emoji: '👓' },
  { id: 'crown', name: '왕관', cost: 100, emoji: '👑' },
  { id: 'star', name: '별', cost: 80, emoji: '⭐' },
  { id: 'fire', name: '불꽃', cost: 60, emoji: '🔥' },
];

export function getSkinById(id: string | null | undefined): SkinDef | undefined {
  if (!id) return undefined;
  return SKINS.find((s) => s.id === id);
}
