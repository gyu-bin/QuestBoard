/**
 * QuestBoard - 귀엽고 세련된 모던 앱 테마
 */
export const COLORS = {
  // 배경: 따뜻한 크림/아이보리
  bg: '#FAF8F6',
  bgSecondary: '#F5F2EF',
  // 카드/서페이스: 깨끗한 화이트
  surface: '#FFFFFF',
  card: '#FFFFFF',
  // 포인트/골드: 따뜻한 허니 골드
  gold: '#E8A838',
  goldLight: '#F5D99A',
  goldDark: '#C48920',
  // 텍스트
  text: '#2D2A26',
  textSecondary: '#6B6560',
  textMuted: '#9A9590',
  // 상태 색상 (파스텔)
  success: '#6BCB9A',
  successLight: '#E8F8F0',
  error: '#E89B9B',
  errorLight: '#FDF0F0',
  warning: '#F5C26B',
  info: '#8BB8E8',
  // 난이도
  easy: '#6BCB9A',
  easyBg: '#E8F8F0',
  normal: '#E8A838',
  normalBg: '#FDF6E8',
  hard: '#E89B9B',
  hardBg: '#FDF0F0',
  // 보더
  border: '#EDE9E5',
  borderLight: '#F3F0ED',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
} as const;

/** 카드용 부드러운 그림자 (iOS + Android) */
export const SHADOWS = {
  card: {
    shadowColor: '#2D2A26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    shadowColor: '#2D2A26',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  floating: {
    shadowColor: '#2D2A26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
