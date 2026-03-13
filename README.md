# QuestBoard

일상을 RPG 퀘스트처럼 관리하는 자기계발 앱입니다.

## Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **Routing**: Expo Router (file-based)
- **State**: Zustand
- **Animation**: Lottie (퀘스트 완료 축하), Expo Haptics (진동)

## 환경 설정 및 실행

### 1. 의존성 설치

```bash
npx expo install expo expo-router react-native-safe-area-context react-native-screens lucide-react-native zustand lottie-react-native expo-haptics react-native-reanimated
npm install
```

### 2. 실행

```bash
npx expo start
```

Expo Go 앱으로 QR 코드 스캔 후 테스트할 수 있습니다.

## 프로젝트 구조

- `app/(tabs)/index.tsx` — 퀘스트 게시판 (의뢰 게시판 UI, 완료 시 골드 애니메이션 + 햅틱)
- `app/(tabs)/shop.tsx` — 보상 상점 (구매 시 포인트 차감, 부족 시 "골드가 부족합니다" 토스트)
- `app/(tabs)/settings.tsx` — 프로필 & 레벨/경험치 바, 퀘스트 통계
- `src/types.ts` — Users, Quests, Rewards, Transactions 타입 정의
- `src/store/useStore.ts` — Zustand 스토어 (포인트 가산/차감, 퀘스트 완료, 보상 구매)
- `src/components/CelebrationLottie.tsx` — 퀘스트 완료 시 재생되는 Lottie 애니메이션
- `src/data/mockQuests.ts`, `mockRewards.ts` — 목업 데이터

## 데이터 스키마

- **Users**: id, email, nickname, level, total_exp, current_points, gold_balance
- **Quests**: id, user_id, title, description, points_reward, difficulty, is_completed, created_at, repeat_type (Daily/Weekly/None)
- **Rewards**: id, user_id, title, cost_points, stock_count, icon_type
- **Transactions**: id, user_id, type (Earn/Spend), amount, description, created_at

## 반복 퀘스트

- **Daily**: 매일 자정이 지나면 미완료로 갱신
- **Weekly**: 해당 주가 바뀌면 미완료로 갱신
- **None**: 1회성
