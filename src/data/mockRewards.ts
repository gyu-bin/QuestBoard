import type { Reward } from '@/types';

export const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    user_id: 'user-1',
    title: '커피 한 잔',
    cost_points: 30,
    stock_count: 99,
    icon_type: 'coffee',
  },
  {
    id: 'reward-2',
    user_id: 'user-1',
    title: '유튜브 30분',
    cost_points: 20,
    stock_count: 5,
    icon_type: 'play',
  },
  {
    id: 'reward-3',
    user_id: 'user-1',
    title: '맛집 디저트',
    cost_points: 80,
    stock_count: 3,
    icon_type: 'cake',
  },
  {
    id: 'reward-4',
    user_id: 'user-1',
    title: '게임 1시간',
    cost_points: 50,
    stock_count: 10,
    icon_type: 'gamepad',
  },
];
