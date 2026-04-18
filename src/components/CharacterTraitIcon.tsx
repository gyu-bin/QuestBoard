import { Dumbbell, BookOpen, Palette, Home } from 'lucide-react-native';
import type { CharacterType } from '@/types';

type Props = {
  type: CharacterType;
  size?: number;
  color: string;
};

/**
 * 특성(운동/지식/창작/생활) 표시용 — 이모지는 기기 글꼴에 따라 깨질 수 있어 벡터 아이콘 사용
 */
export function CharacterTraitIcon({ type, size = 28, color }: Props) {
  const stroke = 2;
  switch (type) {
    case 'fitness':
      return <Dumbbell size={size} color={color} strokeWidth={stroke} />;
    case 'knowledge':
      return <BookOpen size={size} color={color} strokeWidth={stroke} />;
    case 'creative':
      return <Palette size={size} color={color} strokeWidth={stroke} />;
    case 'life':
      return <Home size={size} color={color} strokeWidth={stroke} />;
  }
}
