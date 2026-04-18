import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Coins, Gift, Plus, ShoppingBag, Trash2, X } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/theme';
import { getTodayLabel } from '@/utils/date';
import type { Reward } from '@/types';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const rewards = useStore((s) => s.rewards);
  const purchaseReward = useStore((s) => s.purchaseReward);
  const addReward = useStore((s) => s.addReward);
  const deleteReward = useStore((s) => s.deleteReward);
  const addToast = useStore((s) => s.addToast);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('30');
  const [newStock, setNewStock] = useState('5');

  const handlePurchase = async (reward: Reward) => {
    if (purchasingId || reward.stock_count <= 0) return;
    if (user && user.current_points < reward.cost_points) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      addToast({ type: 'error', text: '골드가 부족해요' });
      return;
    }
    setPurchasingId(reward.id);
    try {
      const ok = purchaseReward(reward.id);
      if (ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addToast({ type: 'success', text: `${reward.title} 구매 완료` });
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        addToast({ type: 'error', text: '골드가 부족해요' });
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleAddReward = () => {
    const title = newTitle.trim();
    if (!title) return;
    const cost = Math.max(0, parseInt(newCost, 10) || 30);
    const stock = Math.max(0, parseInt(newStock, 10) || 5);
    addReward({ title, cost_points: cost, stock_count: stock });
    setNewTitle('');
    setNewCost('30');
    setNewStock('5');
    setAddModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: SPACING.xl }]}>
        <View>
          <Text style={styles.headerDate}>{getTodayLabel()}</Text>
          <Text style={styles.headerTitle}>보상 상점</Text>
          <View style={styles.headerSubRow}>
            <ShoppingBag size={14} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.headerSub}>골드로 나만의 보상을 사요</Text>
          </View>
        </View>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rewards.length === 0 ? (
          <View style={styles.empty}>
            <Gift size={40} color={COLORS.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>등록된 보상이 없어요</Text>
            <Text style={styles.emptyText}>보상 아이템을 추가해 보세요!</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Plus size={18} color={COLORS.surface} strokeWidth={2.5} />
              <Text style={styles.emptyAddBtnText}>보상 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rewards.map((r) => {
            const canBuy =
              (user?.current_points ?? 0) >= r.cost_points && r.stock_count > 0;
            return (
              <View key={r.id} style={[styles.card, SHADOWS.card]}>
                <View style={styles.cardTop}>
                  <View style={styles.rewardIconWrap}>
                    <Gift size={22} color={COLORS.gold} strokeWidth={2} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{r.title}</Text>
                    <Text style={styles.stock}>재고 {r.stock_count}개</Text>
                  </View>
                  <View style={styles.costWrap}>
                    <Coins size={16} color={COLORS.gold} strokeWidth={2.5} />
                    <Text style={styles.cost}>{r.cost_points}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {r.stock_count > 0 ? (
                    <TouchableOpacity
                      style={[styles.buyBtn, !canBuy && styles.buyBtnDisabled]}
                      onPress={() => handlePurchase(r)}
                      disabled={!canBuy || !!purchasingId}
                      activeOpacity={0.85}
                    >
                      <ShoppingBag
                        size={16}
                        color={canBuy ? COLORS.surface : COLORS.textMuted}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.buyBtnText,
                          !canBuy && styles.buyBtnTextDisabled,
                        ]}
                      >
                        {purchasingId === r.id ? '구매 중...' : '구매하기'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.deleteRewardBtn, r.stock_count > 0 && styles.deleteRewardBtnIcon]}
                    onPress={() => deleteReward(r.id)}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={r.stock_count > 0 ? 18 : 16} color={COLORS.surface} strokeWidth={2} />
                    {r.stock_count === 0 ? (
                      <Text style={styles.deleteRewardBtnText}>삭제</Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
                <Text style={styles.modalTitle}>보상 추가</Text>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
                  hitSlop={12}
                  style={styles.modalClose}
                >
                  <X size={24} color={COLORS.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalLabel}>보상 이름 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="예: 커피 한 잔"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={50}
                />
                <Text style={styles.modalLabel}>필요 골드</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCost}
                  onChangeText={setNewCost}
                  placeholder="30"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.modalLabel}>재고 수량</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newStock}
                  onChangeText={setNewStock}
                  placeholder="5"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.modalSubmit,
                  !newTitle.trim() && styles.modalSubmitDisabled,
                ]}
                onPress={handleAddReward}
                disabled={!newTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>추가하기</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <ToastContainer />
    </SafeAreaView>
  );
}

function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const duration = toasts[0].duration ?? 2500;
    const id = toasts[0].id;
    const timer = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.toastWrap} pointerEvents="box-none">
      {toasts.map((t) => (
        <View
          key={t.id}
          style={[
            styles.toast,
            t.type === 'error' && styles.toastError,
            t.type === 'success' && styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{t.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
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
    fontSize: 12,
    color: COLORS.textMuted,
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
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  rewardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldLight + '99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  stock: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  costWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cost: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.goldDark,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  buyBtnDisabled: {
    backgroundColor: COLORS.borderLight,
    opacity: 0.8,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
  },
  buyBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  deleteRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  deleteRewardBtnIcon: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minWidth: undefined,
  },
  deleteRewardBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
  },
  toastWrap: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.floating,
  },
  toastError: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  toastSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  toastText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalWrap: {
    maxHeight: '90%',
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
    maxHeight: 280,
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
