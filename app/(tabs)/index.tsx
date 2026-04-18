import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  Coins,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  Pencil,
  X,
  Gift,
  Target,
  Flame,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '@/store/useStore';
import { QuestCompleteOverlay } from '@/components/QuestCompleteOverlay';
import { LevelUpEffect } from '@/components/LevelUpEffect';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import { getTodayLabel } from '@/utils/date';
import { QUEST_CATEGORIES_WITH_TRAIT, getCategoryLabel } from '@/constants/character';
import { CharacterTraitIcon } from '@/components/CharacterTraitIcon';
import type {
  Quest,
  QuestDifficulty,
  RepeatType,
  QuestCategory,
  QuestGoalPeriodDays,
} from '@/types';
import {
  questProgressRatio,
  questProgressLabel,
  questRepeatSummary,
  isQuestPeriodExpired,
} from '@/utils/questPeriod';

const DIFFICULTY_MAP: Record<
  QuestDifficulty,
  { label: string; color: string; bg: string }
> = {
  Easy: { label: '쉬움', color: COLORS.easy, bg: COLORS.easyBg },
  Normal: { label: '보통', color: COLORS.normal, bg: COLORS.normalBg },
  Hard: { label: '어려움', color: COLORS.hard, bg: COLORS.hardBg },
};

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'Daily', label: '매일 인증' },
  { value: 'None', label: '반복 안 함' },
];

const GOAL_PERIOD_OPTIONS: { days: QuestGoalPeriodDays; label: string }[] = [
  { days: 7, label: '1주' },
  { days: 30, label: '1개월' },
  { days: 90, label: '3개월' },
  { days: 365, label: '1년' },
];

function goalDaysToPreset(days: number | undefined): QuestGoalPeriodDays {
  const presets: QuestGoalPeriodDays[] = [7, 30, 90, 365];
  if (days != null && presets.includes(days as QuestGoalPeriodDays)) return days as QuestGoalPeriodDays;
  return 30;
}

const MODAL_SHEET_HEIGHT_RATIO = 0.88;

export default function QuestBoardScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const user = useStore((s) => s.user);
  const quests = useStore((s) => s.quests);
  const completeQuest = useStore((s) => s.completeQuest);
  const deleteQuest = useStore((s) => s.deleteQuest);
  const uncompleteQuest = useStore((s) => s.uncompleteQuest);
  const addQuest = useStore((s) => s.addQuest);
  const updateQuest = useStore((s) => s.updateQuest);
  const resetRepeatQuestsIfNeeded = useStore((s) => s.resetRepeatQuestsIfNeeded);
  const levelUpAmount = useStore((s) => s.levelUpAmount);
  const setLevelUpCleared = useStore((s) => s.setLevelUpCleared);
  const streakCount = useStore((s) => s.streakCount);
  const claimDailyBonus = useStore((s) => s.claimDailyBonus);
  const lastDailyBonusDate = useStore((s) => s.lastDailyBonusDate);
  const dailyChallenge = useStore((s) => s.dailyChallenge);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [lastEarnedGold, setLastEarnedGold] = useState(0);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState('15');
  const [newDifficulty, setNewDifficulty] = useState<QuestDifficulty>('Normal');
  const [newRepeat, setNewRepeat] = useState<RepeatType>('Daily');
  const [newGoalDays, setNewGoalDays] = useState<QuestGoalPeriodDays>(30);
  const [newCategory, setNewCategory] = useState<QuestCategory>('none');

  useFocusEffect(
    useCallback(() => {
      resetRepeatQuestsIfNeeded();
    }, [resetRepeatQuestsIfNeeded]),
  );

  useEffect(() => {
    if (addModalVisible) resetRepeatQuestsIfNeeded();
  }, [addModalVisible, resetRepeatQuestsIfNeeded]);

  const handleComplete = async (quest: Quest) => {
    if (quest.is_completed || completingId) return;
    if (isQuestPeriodExpired(quest)) return;
    setCompletingId(quest.id);
    try {
      const gold = completeQuest(quest.id);
      if (gold !== false) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastEarnedGold(gold);
        setCelebrationVisible(true);
      }
    } finally {
      setCompletingId(null);
    }
  };

  const resetQuestForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewPoints('15');
    setNewDifficulty('Normal');
    setNewRepeat('Daily');
    setNewGoalDays(30);
    setNewCategory('none');
    setEditingQuestId(null);
  };

  const closeQuestModal = () => {
    setAddModalVisible(false);
    resetQuestForm();
  };

  const openAddQuestModal = () => {
    resetQuestForm();
    setAddModalVisible(true);
  };

  const openEditQuestModal = (q: Quest) => {
    setEditingQuestId(q.id);
    setNewTitle(q.title);
    setNewDesc(q.description);
    setNewPoints(String(q.points_reward));
    setNewDifficulty(q.difficulty);
    setNewRepeat(q.repeat_type);
    setNewGoalDays(goalDaysToPreset(q.goal_period_days));
    setNewCategory(q.category ?? 'none');
    setAddModalVisible(true);
  };

  const handleSaveQuest = () => {
    const title = newTitle.trim();
    if (!title) return;
    const points = Math.max(0, parseInt(newPoints, 10) || 15);
    if (editingQuestId) {
      updateQuest(editingQuestId, {
        title,
        description: newDesc.trim(),
        points_reward: points,
        difficulty: newDifficulty,
        repeat_type: newRepeat,
        goal_period_days: newRepeat === 'Daily' ? newGoalDays : undefined,
        category: newCategory,
      });
    } else {
      addQuest({
        title,
        description: newDesc.trim(),
        points_reward: points,
        difficulty: newDifficulty,
        repeat_type: newRepeat,
        goal_period_days: newRepeat === 'Daily' ? newGoalDays : undefined,
        category: newCategory,
      });
    }
    closeQuestModal();
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const canClaimDaily = lastDailyBonusDate !== todayKey;
  const isDailyChallengeToday = dailyChallenge.date === todayKey;
  const dailyChallengeLabel =
    isDailyChallengeToday && !dailyChallenge.claimed
      ? dailyChallenge.type === 'hard'
        ? '어려움 퀘스트 1개 완료'
        : '퀘스트 3개 완료'
      : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {canClaimDaily && (
        <TouchableOpacity
          style={styles.dailyBanner}
          onPress={() => claimDailyBonus()}
          activeOpacity={0.9}
        >
          <View style={styles.dailyBannerInner}>
            <Gift size={18} color={COLORS.goldDark} strokeWidth={2} />
            <Text style={styles.dailyBannerText}>오늘 출석 보너스 +50 G 받기</Text>
          </View>
        </TouchableOpacity>
      )}
      {dailyChallengeLabel && (
        <View style={styles.dailyChallengeBanner}>
          <View style={styles.dailyChallengeTitleRow}>
            <Target size={16} color={COLORS.goldDark} strokeWidth={2} />
            <Text style={styles.dailyChallengeLabel}>오늘의 도전</Text>
          </View>
          <Text style={styles.dailyChallengeDesc}>{dailyChallengeLabel} → +20 G</Text>
        </View>
      )}
      <View style={[styles.header, { paddingTop: SPACING.md }]}>
        <Text style={styles.headerDate}>{getTodayLabel()}</Text>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerGreeting}>오늘의 퀘스트</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={openAddQuestModal}
              activeOpacity={0.85}
            >
              <Plus size={20} color={COLORS.surface} strokeWidth={2.5} />
              <Text style={styles.addBtnText}>추가</Text>
            </TouchableOpacity>
            <View style={styles.goldBadge}>
              <Coins size={18} color={COLORS.gold} strokeWidth={2.5} />
              <Text style={styles.goldValue}>{user?.current_points ?? 0}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerSubRow}>
          <View style={styles.headerSubLeft}>
            <Sparkles size={14} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.headerSub}>완료하면 골드를 받아요</Text>
          </View>
          {streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={14} color={COLORS.goldDark} strokeWidth={2} />
              <Text style={styles.streakBadgeText}>{streakCount}일 연속</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {quests.length === 0 ? (
          <View style={styles.empty}>
            <Sparkles size={40} color={COLORS.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>등록된 퀘스트가 없어요</Text>
            <Text style={styles.emptyText}>새 퀘스트를 추가해 보세요!</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={openAddQuestModal}
              activeOpacity={0.85}
            >
              <Plus size={18} color={COLORS.surface} strokeWidth={2.5} />
              <Text style={styles.emptyAddBtnText}>퀘스트 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quests.map((q) => (
            <View
              key={q.id}
              style={[
                styles.card,
                q.is_completed && styles.cardCompleted,
                isQuestPeriodExpired(q) && styles.cardExpired,
                SHADOWS.card,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.questTitle} numberOfLines={1}>
                  {q.title}
                </Text>
                <View style={styles.badges}>
                  {q.category && q.category !== 'none' ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{getCategoryLabel(q.category)}</Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: DIFFICULTY_MAP[q.difficulty].bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: DIFFICULTY_MAP[q.difficulty].color },
                      ]}
                    >
                      {DIFFICULTY_MAP[q.difficulty].label}
                    </Text>
                  </View>
                  <View style={styles.repeatBadge}>
                    <Repeat size={10} color={COLORS.textMuted} strokeWidth={2} />
                    <Text style={styles.repeatText}>{questRepeatSummary(q)}</Text>
                  </View>
                </View>
              </View>
              {q.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {q.description}
                </Text>
              ) : null}
              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(questProgressRatio(q) * 100)}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressMeta}>
                  <Text style={styles.progressLabel}>{questProgressLabel(q)}</Text>
                  {isQuestPeriodExpired(q) ? (
                    <Text style={styles.progressExpired}>기간 종료</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.footer}>
                <View style={styles.pointsChip}>
                  <Coins size={14} color={COLORS.gold} strokeWidth={2.5} />
                  <Text style={styles.points}>+{q.points_reward}</Text>
                </View>
                {!q.is_completed ? (
                  <View style={styles.incompleteRow}>
                    <TouchableOpacity
                      style={[
                        styles.completeBtn,
                        isQuestPeriodExpired(q) && styles.completeBtnDisabled,
                      ]}
                      onPress={() => handleComplete(q)}
                      disabled={!!completingId || isQuestPeriodExpired(q)}
                      activeOpacity={0.85}
                    >
                      {completingId === q.id ? (
                        <ActivityIndicator size="small" color={COLORS.surface} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color={COLORS.surface} strokeWidth={2.5} />
                          <Text style={styles.completeBtnText}>완료하기</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => openEditQuestModal(q)}
                      hitSlop={8}
                      activeOpacity={0.7}
                    >
                      <Pencil size={18} color={COLORS.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteQuest(q.id)}
                      hitSlop={8}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color={COLORS.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.doneRow}>
                    <TouchableOpacity
                      style={styles.doneBadge}
                      onPress={() => uncompleteQuest(q.id)}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={16} color={COLORS.success} strokeWidth={2.5} />
                      <Text style={styles.doneText}>완료했어요</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => openEditQuestModal(q)}
                      hitSlop={8}
                      activeOpacity={0.7}
                    >
                      <Pencil size={18} color={COLORS.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteQuest(q.id)}
                      hitSlop={8}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color={COLORS.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeQuestModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeQuestModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalWrap, { height: windowHeight * MODAL_SHEET_HEIGHT_RATIO }]}
          >
            <Pressable
              style={[styles.modalCard, { paddingBottom: Math.max(8, insets.bottom) }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingQuestId ? '퀘스트 수정' : '퀘스트 추가'}
                </Text>
                <TouchableOpacity
                  onPress={closeQuestModal}
                  hitSlop={12}
                  style={styles.modalClose}
                >
                  <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalLabel}>제목 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="예: 오늘의 묵상"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={50}
                />
                <Text style={styles.modalLabel}>설명</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="퀘스트 설명 (선택)"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={2}
                />
                <Text style={styles.modalLabel}>보상 골드</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPoints}
                  onChangeText={setNewPoints}
                  placeholder="15"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.modalLabel}>난이도</Text>
                <View style={styles.modalRow}>
                  {(['Easy', 'Normal', 'Hard'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.modalChip,
                        newDifficulty === d && {
                          backgroundColor: DIFFICULTY_MAP[d].bg,
                        },
                      ]}
                      onPress={() => setNewDifficulty(d)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          newDifficulty === d && { color: DIFFICULTY_MAP[d].color },
                        ]}
                      >
                        {DIFFICULTY_MAP[d].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalLabel}>반복</Text>
                <Text style={styles.modalHint}>
                  매일 인증은 선택한 기간 동안 하루에 한 번 완료할 수 있어요. 날이 바뀌면 다시 완료할 수 있습니다. 반복
                  안 함은 한 번 끝나면 그대로예요.
                </Text>
                <View style={styles.modalRow}>
                  {REPEAT_OPTIONS.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.modalChip,
                        newRepeat === value && { backgroundColor: COLORS.goldLight + '99' },
                      ]}
                      onPress={() => setNewRepeat(value)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          newRepeat === value && { color: COLORS.goldDark, fontWeight: '600' },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {newRepeat === 'Daily' ? (
                  <>
                    <Text style={styles.modalLabel}>진행 기간</Text>
                    <View style={styles.modalRow}>
                      {GOAL_PERIOD_OPTIONS.map(({ days, label }) => (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.modalChip,
                            newGoalDays === days && { backgroundColor: COLORS.goldLight + '99' },
                          ]}
                          onPress={() => setNewGoalDays(days)}
                        >
                          <Text
                            style={[
                              styles.modalChipText,
                              newGoalDays === days && { color: COLORS.goldDark, fontWeight: '600' },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : null}
                <Text style={styles.modalLabel}>카테고리</Text>
                <Text style={styles.modalHint}>프로필 특성(운동인/지식인/창작인/정비인)과 같으면 완료 시 골드 +10%</Text>
                <View style={styles.modalRow}>
                  {QUEST_CATEGORIES_WITH_TRAIT.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.modalChip,
                        newCategory === value && { backgroundColor: COLORS.goldLight + '99' },
                      ]}
                      onPress={() => setNewCategory(value)}
                    >
                      {value !== 'none' ? (
                        <CharacterTraitIcon
                          type={value}
                          size={16}
                          color={
                            newCategory === value ? COLORS.goldDark : COLORS.textMuted
                          }
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.modalChipText,
                          newCategory === value && { color: COLORS.goldDark, fontWeight: '600' },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalSubmit, !newTitle.trim() && styles.modalSubmitDisabled]}
                onPress={handleSaveQuest}
                disabled={!newTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>
                  {editingQuestId ? '저장하기' : '추가하기'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <QuestCompleteOverlay
        visible={celebrationVisible}
        earnedGold={lastEarnedGold}
        onFinish={() => setCelebrationVisible(false)}
      />
      <LevelUpEffect
        level={levelUpAmount}
        visible={levelUpAmount > 0}
        onDismiss={setLevelUpCleared}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingLeft: SPACING.xl,
    paddingRight: 10,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.xs + 4,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    ...(Platform.OS === 'android' && {
      elevation: 2,
      shadowColor: '#2D2A26',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    }),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  headerSubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.goldLight + 'cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  dailyBanner: {
    backgroundColor: COLORS.goldLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '44',
  },
  dailyBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  dailyChallengeBanner: {
    backgroundColor: COLORS.normalBg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dailyChallengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyChallengeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  dailyChallengeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.surface,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight + '99',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  goldValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  empty: {
    padding: SPACING.xxl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    marginTop: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 0,
  },
  cardCompleted: {
    backgroundColor: COLORS.successLight,
    opacity: 0.95,
  },
  cardExpired: {
    opacity: 0.88,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  questTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldLight + '99',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.goldDark,
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSecondary,
  },
  repeatText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 21,
  },
  progressBlock: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bgSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressExpired: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  points: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    minWidth: 100,
    justifyContent: 'center',
  },
  completeBtnDisabled: {
    opacity: 0.42,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
  incompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.successLight,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  deleteBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  modalCard: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalScroll: {
    flex: 1,
    minHeight: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  modalInputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
  },
  modalChipText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  modalSubmit: {
    backgroundColor: COLORS.gold,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: 0,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
