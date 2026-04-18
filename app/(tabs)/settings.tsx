import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, Modal, Pressable, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Coins,
  Award,
  RotateCcw,
  RotateCw,
  Target,
  TrendingUp,
  X,
  Trophy,
  Calendar,
  Pencil,
  Lock,
  Sprout,
  Flame,
} from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { CalendarWithSwipe } from '@/components/CalendarWithSwipe';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import {
  expInCurrentLevel,
  expNeededForNextLevel,
  levelFromTotalExp,
} from '@/utils/levelExp';
import { getAchievementProgress, mergeAchievementsForDisplay } from '@/utils/achievements';
import { CHARACTER_TYPES, getCharacterLabel } from '@/constants/character';
import { CharacterTraitIcon } from '@/components/CharacterTraitIcon';
import type { CharacterType } from '@/types';

type RecordModalType = 'quest' | 'earn' | 'spend' | null;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const quests = useStore((s) => s.quests);
  const transactions = useStore((s) => s.transactions);
  const resetGold = useStore((s) => s.resetGold);
  const resetProgress = useStore((s) => s.resetProgress);
  const updateUserProfile = useStore((s) => s.updateUserProfile);
  const streakCount = useStore((s) => s.streakCount);
  const storedAchievements = useStore((s) => s.achievements);
  const achievements = useMemo(() => mergeAchievementsForDisplay(storedAchievements), [storedAchievements]);
  const weeklyChallenge = useStore((s) => s.weeklyChallenge);
  const monthlyChallenge = useStore((s) => s.monthlyChallenge);
  const ensurePeriodChallenges = useStore((s) => s.ensurePeriodChallenges);
  const tryClaimWeeklyChallenge = useStore((s) => s.tryClaimWeeklyChallenge);
  const tryClaimMonthlyChallenge = useStore((s) => s.tryClaimMonthlyChallenge);
  const [recordModal, setRecordModal] = useState<RecordModalType>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCharacterType, setEditCharacterType] = useState<CharacterType | null>(null);

  const unlockedTitles = achievements.filter((a) => a.unlockedAt).map((a) => a.title);

  useEffect(() => {
    ensurePeriodChallenges();
  }, [ensurePeriodChallenges]);

  const handleResetProgress = () => {
    Alert.alert(
      '레벨·통계 초기화',
      '레벨, 경험치, 퀘스트 완료 상태, 획득/사용 기록이 모두 초기화됩니다. 진행할까요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: () => resetProgress() },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>로그인이 필요해요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const level = levelFromTotalExp(user.total_exp);
  const expInLevel = expInCurrentLevel(user.total_exp, level);
  const expNeeded = expNeededForNextLevel(level);
  const expProgress = expNeeded > 0 ? Math.min(1, expInLevel / expNeeded) : 1;
  const completedCount = transactions.filter((t) => t.type === 'Earn' && t.description.includes('퀘스트 완료')).length;
  const earnCount = transactions.filter((t) => t.type === 'Earn').length;
  const spendCount = transactions.filter((t) => t.type === 'Spend').length;
  const totalGoldEarned = transactions.filter((t) => t.type === 'Earn').reduce((sum, t) => sum + t.amount, 0);
  const totalGoldSpent = transactions.filter((t) => t.type === 'Spend').reduce((sum, t) => sum + t.amount, 0);
  const purchaseCount = spendCount;

  const recordList =
    recordModal === 'quest'
      ? transactions
          .filter((t) => t.type === 'Earn' && t.description.includes('퀘스트 완료'))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : recordModal === 'earn'
        ? [...transactions].filter((t) => t.type === 'Earn').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : recordModal === 'spend'
          ? [...transactions].filter((t) => t.type === 'Spend').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : [];
  const recordTitle =
    recordModal === 'quest' ? '완료한 퀘스트 기록' : recordModal === 'earn' ? '획득 기록' : recordModal === 'spend' ? '사용 기록' : '';

  const completedDates = Array.from(
    new Set(
      transactions
        .filter((t) => t.type === 'Earn' && t.description.includes('퀘스트 완료'))
        .map((t) => t.created_at.slice(0, 10))
    )
  );

  const achievementState = {
    completedQuestCount: completedCount,
    level,
    currentGold: user.current_points,
    streakCount,
    totalGoldEarned,
    totalGoldSpent,
    purchaseCount,
  };
  const ACHIEVEMENT_SHOW_LIMIT = 4;
  const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, ACHIEVEMENT_SHOW_LIMIT);
  const hasMoreAchievements = achievements.length > ACHIEVEMENT_SHOW_LIMIT;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header]}>
        <View>
          <Text style={styles.headerTitle}>프로필</Text>
          <View style={styles.headerSubRow}>
            <Sprout size={16} color={COLORS.gold} strokeWidth={2} />
            <Text style={styles.headerSub}>나의 성장 기록이에요</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.resetProgressBtn}
          onPress={handleResetProgress}
          activeOpacity={0.85}
        >
          <RotateCw size={18} color={COLORS.textSecondary} strokeWidth={2} />
          <Text style={styles.resetProgressBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.profileCard, SHADOWS.card]}
          onPress={() => {
            setEditNickname(user.nickname);
            setEditTitle(user.title ?? '');
            setEditCharacterType(user.characterType ?? null);
            setProfileEditVisible(true);
          }}
          activeOpacity={0.9}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <View style={styles.profileNameTitleWrap}>
                <Text style={styles.nickname} numberOfLines={1}>{user.nickname}</Text>
                {user.title ? (
                  <View style={styles.titleBadge}>
                    <Text style={styles.titleBadgeText}>{user.title}</Text>
                  </View>
                ) : null}
              </View>
              <Pencil size={14} color={COLORS.textMuted} strokeWidth={2} />         
            </View>
            {streakCount > 0 ? (
              <View style={styles.streakRow}>
                <Flame size={16} color={COLORS.goldDark} strokeWidth={2} />
                <Text style={styles.streakText}>{streakCount}일 연속 퀘스트 완료</Text>
              </View>
            ) : null}
            {user.characterType ? (
              <View style={styles.roleHighlight}>
                <View style={styles.roleIconWrap}>
                  <CharacterTraitIcon type={user.characterType} size={28} color={COLORS.goldDark} />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={styles.roleLabel}>나의 역할</Text>
                  <Text style={styles.roleName}>{getCharacterLabel(user.characterType)}</Text>
                  <Text style={styles.roleBonus}>맞는 퀘스트 완료 시 골드 +10%</Text>
                </View>
              </View>
            ) : null}
            
          </View>
        </TouchableOpacity>

        <Modal visible={profileEditVisible} animationType="slide" transparent>
          <Pressable style={styles.profileEditBackdrop} onPress={() => setProfileEditVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.profileEditKeyboard}>
              <Pressable style={[styles.profileEditCard, { paddingBottom: Math.max(SPACING.lg, insets.bottom + 8) }]} onPress={(e) => e.stopPropagation()}>
                <View style={styles.profileEditHeader}>
                  <Text style={styles.profileEditTitle}>프로필 수정</Text>
                  <TouchableOpacity onPress={() => setProfileEditVisible(false)} hitSlop={12}>
                    <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileEditLabel}>닉네임</Text>
                <TextInput
                  style={styles.profileEditInput}
                  value={editNickname}
                  onChangeText={setEditNickname}
                  placeholder="닉네임"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={12}
                />
                <Text style={styles.profileEditLabel}>칭호 (업적에서 해금)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titlePresetScroll}>
                  <TouchableOpacity
                    style={[styles.titlePresetChip, !editTitle && styles.titlePresetChipActive]}
                    onPress={() => setEditTitle('')}
                  >
                    <Text style={[styles.titlePresetText, !editTitle && styles.titlePresetTextActive]}>칭호 없음</Text>
                  </TouchableOpacity>
                  {unlockedTitles.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.titlePresetChip, editTitle === t && styles.titlePresetChipActive]}
                      onPress={() => setEditTitle(t)}
                    >
                      <Text style={[styles.titlePresetText, editTitle === t && styles.titlePresetTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {unlockedTitles.length === 0 && (
                  <Text style={styles.profileEditHint}>업적을 달성하면 칭호를 쓸 수 있어요</Text>
                )}
                <Text style={styles.profileEditLabel}>특성</Text>
                <View style={styles.traitChipsRow}>
                  {CHARACTER_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.traitChip, editCharacterType === t.value && styles.traitChipActive]}
                      onPress={() => setEditCharacterType(t.value)}
                    >
                      <View style={styles.traitChipIcon}>
                        <CharacterTraitIcon
                          type={t.value}
                          size={20}
                          color={editCharacterType === t.value ? COLORS.goldDark : COLORS.textSecondary}
                        />
                      </View>
                      <Text style={[styles.traitChipText, editCharacterType === t.value && styles.traitChipTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {editCharacterType && (
                  <Text style={styles.traitDescription}>
                    {CHARACTER_TYPES.find((c) => c.value === editCharacterType)?.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.profileEditSave}
                  onPress={() => {
                    const titleToSave = editTitle && unlockedTitles.includes(editTitle) ? editTitle : undefined;
                    updateUserProfile({
                      nickname: editNickname.trim() || user.nickname,
                      title: titleToSave,
                      characterType: editCharacterType ?? undefined,
                    });
                    setProfileEditVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.profileEditSaveText}>저장</Text>
                </TouchableOpacity>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {achievements.length > 0 && (
          <View style={[styles.achievementsCard, SHADOWS.card]}>
            <View style={styles.achievementsHeader}>
              <Trophy size={18} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>업적</Text>
            </View>
            <View style={styles.achievementsList}>
              {visibleAchievements.map((a) => {
                const progress = !a.unlockedAt ? getAchievementProgress(a.id, achievementState) : null;
                return (
                  <View key={a.id} style={[styles.achievementRow, !a.unlockedAt && styles.achievementRowLocked]}>
                    <View style={styles.achievementIconWrap}>
                      {a.unlockedAt ? (
                        <Trophy size={22} color={COLORS.gold} strokeWidth={2} />
                      ) : (
                        <Lock size={22} color={COLORS.textMuted} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.achievementTextWrap}>
                      <Text style={[styles.achievementTitle, !a.unlockedAt && styles.achievementTitleLocked]}>{a.title}</Text>
                      {a.unlockedAt && a.description ? (
                        <Text style={styles.achievementDesc}>{a.description}</Text>
                      ) : progress ? (
                        <Text style={styles.achievementProgress}>
                          {progress.current} / {progress.target}
                        </Text>
                      ) : a.description ? (
                        <Text style={styles.achievementDesc}>{a.description}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
            {hasMoreAchievements && (
              <TouchableOpacity
                style={styles.achievementExpandBtn}
                onPress={() => setShowAllAchievements(!showAllAchievements)}
                activeOpacity={0.7}
              >
                <Text style={styles.achievementExpandText}>
                  {showAllAchievements ? '접기' : `나머지 업적 보기`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.calendarButton, SHADOWS.card]}
          onPress={() => setCalendarModalVisible(true)}
          activeOpacity={0.85}
        >
          <Calendar size={22} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.calendarButtonText}>퀘스트 달력</Text>
        </TouchableOpacity>

        <Modal
          visible={calendarModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <Pressable style={styles.calendarModalBackdrop} onPress={() => setCalendarModalVisible(false)}>
            <Pressable style={styles.calendarModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.calendarModalTitle}>퀘스트 달력</Text>
                <TouchableOpacity onPress={() => setCalendarModalVisible(false)} hitSlop={12}>
                  <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <CalendarWithSwipe completedDates={completedDates} />
            </Pressable>
          </Pressable>
        </Modal>

        <View style={[styles.levelCard, SHADOWS.card]}>
          <View style={styles.levelHeader}>
            <Award size={20} color={COLORS.gold} strokeWidth={2} />
            <Text style={styles.levelLabel}>Lv.{level}</Text>
            <Text style={styles.expText}>
              {expInLevel} / {expNeeded} EXP
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${expProgress * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={[styles.challengeCard, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>기간 챌린지</Text>
          <View style={styles.challengeRow}>
            <View style={styles.challengeItem}>
              <View style={styles.challengeLabelRow}>
                <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.challengeLabel}>이번 주 (7개 완료)</Text>
              </View>
              <Text style={styles.challengeProgress}>{weeklyChallenge.progress} / 7</Text>
              {weeklyChallenge.progress >= 7 && !weeklyChallenge.claimed ? (
                <TouchableOpacity style={styles.challengeClaimBtn} onPress={() => { ensurePeriodChallenges(); tryClaimWeeklyChallenge(); }} activeOpacity={0.85}>
                  <Text style={styles.challengeClaimText}>+50 G 받기</Text>
                </TouchableOpacity>
              ) : weeklyChallenge.claimed ? (
                <Text style={styles.challengeDone}>완료</Text>
              ) : null}
            </View>
            <View style={styles.challengeItem}>
              <View style={styles.challengeLabelRow}>
                <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.challengeLabel}>이번 달 (20개 완료)</Text>
              </View>
              <Text style={styles.challengeProgress}>{monthlyChallenge.progress} / 20</Text>
              {monthlyChallenge.progress >= 20 && !monthlyChallenge.claimed ? (
                <TouchableOpacity style={styles.challengeClaimBtn} onPress={() => { ensurePeriodChallenges(); tryClaimMonthlyChallenge(); }} activeOpacity={0.85}>
                  <Text style={styles.challengeClaimText}>+100 G 받기</Text>
                </TouchableOpacity>
              ) : monthlyChallenge.claimed ? (
                <Text style={styles.challengeDone}>완료</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.statsCard, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>퀘스트 통계</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} onPress={() => setRecordModal('quest')} activeOpacity={0.7}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.successLight }]}>
                <Target size={20} color={COLORS.success} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>완료한 퀘스트</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={() => setRecordModal('earn')} activeOpacity={0.7}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.normalBg }]}>
                <TrendingUp size={20} color={COLORS.gold} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{earnCount}</Text>
              <Text style={styles.statLabel}>획득 기록</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={() => setRecordModal('spend')} activeOpacity={0.7}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.hardBg }]}>
                <Coins size={20} color={COLORS.hard} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{spendCount}</Text>
              <Text style={styles.statLabel}>사용 기록</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={recordModal !== null} animationType="slide" transparent>
          <Pressable style={styles.recordModalBackdrop} onPress={() => setRecordModal(null)}>
            <Pressable style={styles.recordModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.recordModalHeader}>
                <Text style={styles.recordModalTitle}>{recordTitle}</Text>
                <TouchableOpacity onPress={() => setRecordModal(null)} hitSlop={12}>
                  <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.recordModalBody} showsVerticalScrollIndicator={false}>
                {recordList.length === 0 ? (
                  <Text style={styles.recordEmpty}>기록이 없어요</Text>
                ) : (
                  recordList.map((t) => (
                    <View key={t.id} style={styles.recordRow}>
                      <Text style={styles.recordDate}>{formatDate(t.created_at)}</Text>
                      <Text style={styles.recordDesc} numberOfLines={2}>{t.description}</Text>
                      <Text style={[styles.recordAmount, t.type === 'Earn' ? styles.recordAmountEarn : styles.recordAmountSpend]}>
                        {t.type === 'Earn' ? '+' : '-'}{t.amount} G
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={[styles.goldCard, SHADOWS.card]}>
          <Coins size={28} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.goldLabel}>현재 보유 골드</Text>
          <Text style={styles.goldValue}>{user.current_points}</Text>
          <TouchableOpacity
            style={styles.resetGoldBtn}
            onPress={() => resetGold()}
            activeOpacity={0.85}
          >
            <RotateCcw size={16} color={COLORS.textSecondary} strokeWidth={2} />
            <Text style={styles.resetGoldBtnText}>골드 리셋</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.xs + 4,
    backgroundColor: COLORS.bg,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resetProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  resetProgressBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  profileNameTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minWidth: 0,
  },
  titleBadge: {
    backgroundColor: COLORS.goldLight + 'cc',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  profileEditBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  profileEditKeyboard: {
    width: '100%',
  },
  profileEditCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  profileEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  profileEditTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  profileEditHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.lg,
  },
  profileEditInput: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  titlePresetScroll: {
    marginBottom: SPACING.sm,
    maxHeight: 44,
  },
  titlePresetChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    marginRight: SPACING.sm,
  },
  titlePresetChipActive: {
    backgroundColor: COLORS.goldLight,
  },
  titlePresetText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  titlePresetTextActive: {
    color: COLORS.goldDark,
    fontWeight: '700',
  },
  profileEditSave: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  profileEditSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.goldLight + '99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  email: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF8ED',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.goldLight + '80',
  },
  roleIconWrap: {
    marginRight: SPACING.md,
    justifyContent: 'center',
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  roleName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  roleBonus: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  streakText: {
    fontSize: 12,
    color: COLORS.goldDark,
    fontWeight: '600',
  },
  traitChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  traitChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  traitChipActive: {
    backgroundColor: COLORS.goldLight + 'cc',
  },
  traitChipIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  traitChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  traitChipTextActive: {
    color: COLORS.goldDark,
    fontWeight: '600',
  },
  traitDescription: {
    fontSize: 12,
    color: COLORS.goldDark,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },
  achievementsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  achievementsList: {
    gap: SPACING.sm,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  achievementRowLocked: {
    opacity: 0.7,
  },
  achievementIconWrap: {
    width: 28,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTextWrap: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  achievementTitleLocked: {
    color: COLORS.textMuted,
  },
  achievementDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  achievementProgress: {
    fontSize: 12,
    color: COLORS.goldDark,
    marginTop: 2,
    fontWeight: '600',
  },
  achievementExpandBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  achievementExpandText: {
    fontSize: 13,
    color: COLORS.goldDark,
    fontWeight: '600',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  calendarModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  calendarModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    maxHeight: '80%',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  levelCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  expText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
  },
  challengeCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  challengeRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  challengeItem: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  challengeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  challengeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  challengeProgress: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  challengeClaimBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  challengeClaimText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  challengeDone: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  goldCard: {
    backgroundColor: COLORS.goldLight + '66',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 0,
  },
  goldLabel: {
    fontSize: 14,
    color: COLORS.goldDark,
    marginTop: 4,
  },
  goldValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: -0.5,
  },
  resetGoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  resetGoldBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  recordModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  recordModalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
  },
  recordModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recordModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordModalBody: {
    padding: SPACING.lg,
    maxHeight: 400,
  },
  recordEmpty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    paddingVertical: SPACING.xxl,
  },
  recordRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recordDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  recordDesc: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordAmountEarn: {
    color: COLORS.success,
  },
  recordAmountSpend: {
    color: COLORS.hard,
  },
});
