/**
 * 레벨이 올라갈수록 다음 레벨까지 필요한 EXP가 증가합니다.
 * Lv1→2: 200, Lv2→3: 400, Lv3→4: 600, ...
 * 총 필요 EXP (레벨 L 도달) = 100 * L * (L - 1)
 */

/** 해당 레벨 시작 시점의 누적 EXP */
export function expAtLevelStart(level: number): number {
  if (level <= 1) return 0;
  return 100 * level * (level - 1);
}

/** total_exp로부터 현재 레벨 계산 */
export function levelFromTotalExp(totalExp: number): number {
  if (totalExp <= 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + 0.04 * totalExp)) / 2);
}

/** 현재 레벨에서 다음 레벨까지 필요한 EXP */
export function expNeededForNextLevel(level: number): number {
  return 200 * level;
}

/** 현재 레벨에서 쌓은 EXP (다음 레벨까지 진행도용) */
export function expInCurrentLevel(totalExp: number, level: number): number {
  return totalExp - expAtLevelStart(level);
}
