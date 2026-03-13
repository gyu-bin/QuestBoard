import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Coins, Plus, Repeat, Sparkles, Trash2, X } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { QuestCompleteOverlay } from '@/components/QuestCompleteOverlay';
import { LevelUpEffect } from '@/components/LevelUpEffect';
import { levelFromTotalExp } from '@/utils/levelExp';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import { getTodayLabel } from '@/utils/date';
import type { Quest, QuestDifficulty, RepeatType } from '@/types';

const DIFFICULTY_MAP: Record<
  QuestDifficulty,
  { label: string; color: string; bg: string }
> = {
  Easy: { label: '쉬움', color: COLORS.easy, bg: COLORS.easyBg },
  Normal: { label: '보통', color: COLORS.normal, bg: COLORS.normalBg },
  Hard: { label: '어려움', color: COLORS.hard, bg: COLORS.hardBg },
};

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'Daily', label: '매일' },
  { value: 'Weekly', label: '매주' },
  { value: 'None', label: '1회' },
];

const REPEAT_LABEL = { Daily: '매일', Weekly: '매주', None: '1회' };

export default function QuestBoardScreen() {
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const quests = useStore((s) => s.quests);
  const completeQuest = useStore((s) => s.completeQuest);
  const deleteQuest = useStore((s) => s.deleteQuest);
  const uncompleteQuest = useStore((s) => s.uncompleteQuest);
  const addQuest = useStore((s) => s.addQuest);
  const levelUpAmount = useStore((s) => s.levelUpAmount);
  const setLevelUpCleared = useStore((s) => s.setLevelUpCleared);
  const streakCount = useStore((s) => s.streakCount);
  const claimDailyBonus = useStore((s) => s.claimDailyBonus);
  const lastDailyBonusDate = useStore((s) => s.lastDailyBonusDate);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [lastEarnedGold, setLastEarnedGold] = useState(0);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState('15');
  const [newDifficulty, setNewDifficulty] = useState<QuestDifficulty>('Normal');
  const [newRepeat, setNewRepeat] = useState<RepeatType>('Daily');

  const handleComplete = async (quest: Quest) => {
    if (quest.is_completed || completingId) return;
    setCompletingId(quest.id);
    try {
      const ok = completeQuest(quest.id);
      if (ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastEarnedGold(quest.points_reward);
        setCelebrationVisible(true);
      }
    } finally {
      setCompletingId(null);
    }
  };

  const handleAddQuest = () => {
    const title = newTitle.trim();
    if (!title) return;
    const points = Math.max(0, parseInt(newPoints, 10) || 15);
    addQuest({
      title,
      description: newDesc.trim(),
      points_reward: points,
      difficulty: newDifficulty,
      repeat_type: newRepeat,
    });
    setNewTitle('');
    setNewDesc('');
    setNewPoints('15');
    setNewDifficulty('Normal');
    setNewRepeat('Daily');
    setAddModalVisible(false);
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const canClaimDaily = lastDailyBonusDate !== todayKey;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {canClaimDaily && (
        <TouchableOpacity
          style={styles.dailyBanner}
          onPress={() => claimDailyBonus()}
          activeOpacity={0.9}
        >
          <Text style={styles.dailyBannerText}>🎁 오늘 출석 보너스 +50 G 받기</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.header, { paddingTop: SPACING.md }]}>
        <Text style={styles.headerDate}>{getTodayLabel()}</Text>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerGreeting}>오늘의 퀘스트</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddModalVisible(true)}
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
          <Text style={styles.headerSub}>완료하면 골드를 받아요 ✨</Text>
          {streakCount > 0 && (
            <Text style={styles.streakBadge}>🔥 {streakCount}일 연속</Text>
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
              onPress={() => setAddModalVisible(true)}
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
                SHADOWS.card,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.questTitle} numberOfLines={1}>
                  {q.title}
                </Text>
                <View style={styles.badges}>
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
                    <Text style={styles.repeatText}>{REPEAT_LABEL[q.repeat_type]}</Text>
                  </View>
                </View>
              </View>
              {q.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {q.description}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <View style={styles.pointsChip}>
                  <Coins size={14} color={COLORS.gold} strokeWidth={2.5} />
                  <Text style={styles.points}>+{q.points_reward}</Text>
                </View>
                {!q.is_completed ? (
                  <View style={styles.incompleteRow}>
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleComplete(q)}
                      disabled={!!completingId}
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
        onRequestClose={() => setAddModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrap}
          >
            <Pressable
              style={[styles.modalCard, { paddingBottom: Math.max(8, insets.bottom) }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>퀘스트 추가</Text>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
                  hitSlop={12}
                  style={styles.modalClose}
                >
                  <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
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
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalSubmit, !newTitle.trim() && styles.modalSubmitDisabled]}
                onPress={handleAddQuest}
                disabled={!newTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>추가하기</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <QuestCompleteOverlay
        visible={celebrationVisible}
        earnedGold={lastEarnedGold}
        level={user ? levelFromTotalExp(user.total_exp) : 1}
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
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  streakBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
    backgroundColor: COLORS.goldLight + 'cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  dailyBanner: {
    backgroundColor: COLORS.goldLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '44',
  },
  dailyBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDark,
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
    maxHeight: '100%',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: 0,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: '100%',
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
    maxHeight: 360,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
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
