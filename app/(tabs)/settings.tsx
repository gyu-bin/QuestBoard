import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coins, Award, RotateCcw, RotateCw, Target, TrendingUp, X } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import {
  expInCurrentLevel,
  expNeededForNextLevel,
  levelFromTotalExp,
} from '@/utils/levelExp';

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
  const [recordModal, setRecordModal] = useState<RecordModalType>(null);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(14, insets.top) }]}>
        <View>
          <Text style={styles.headerTitle}>프로필</Text>
          <Text style={styles.headerSub}>나의 성장 기록이에요 🌱</Text>
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
        <View style={[styles.profileCard, SHADOWS.card]}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user.nickname.slice(0, 1)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
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
    paddingBottom: SPACING.xxl + 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
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
  },
  email: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
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
