import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchFlashDeals } from '@shared/services/dealService';
import { Coupon, Deal } from '@shared/types';

type SupporterTab = 'DISCOVERY' | 'COUPONS' | 'PROFILE';

const tabConfig: { key: SupporterTab; label: string }[] = [
  { key: 'DISCOVERY', label: '로컬 탐험' },
  { key: 'COUPONS', label: '마이 티켓' },
  { key: 'PROFILE', label: '성장 & 프로필' },
];

const levelSpecs = [
  {
    threshold: 0,
    label: '반딧불이',
    description: '골목을 은은하게 밝히는 서포터즈의 시작',
    color: '#facc15',
  },
  {
    threshold: 1000,
    label: '골목 가로등',
    description: '발자국마다 지역을 더 환하게 만드는 힘',
    color: '#f97316',
  },
  {
    threshold: 2500,
    label: '로컬 등대',
    description: '숨은 가게에 빛을 비추는 지역의 등대',
    color: '#06b6d4',
  },
  {
    threshold: 5000,
    label: '오로라',
    description: '다양한 혜택을 연결하는 오로라 같은 존재',
    color: '#7c3aed',
  },
  {
    threshold: 9000,
    label: '슈퍼노바',
    description: '지역을 폭발적으로 변화시키는 서포터즈',
    color: '#f472b6',
  },
];

const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

const getLevelDefinition = (lumens: number) => {
  const picked = [...levelSpecs].filter((spec) => lumens >= spec.threshold);
  const current = picked.length ? picked[picked.length - 1] : levelSpecs[0];
  const nextIndex = levelSpecs.findIndex((spec) => spec.threshold === current.threshold) + 1;
  const nextLevel = levelSpecs[nextIndex];
  const nextThreshold = nextLevel?.threshold ?? current.threshold + 1500;

  return {
    ...current,
    nextThreshold,
    progress: Math.min(1, lumens / nextThreshold),
  };
};

const formatTimeLeft = (expiresAt: Date) => {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return '마감';
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}시간 ${minutes.toString().padStart(2, '0')}분 후 마감`;
};

const DealCard = ({ deal, onClaim }: { deal: Deal; onClaim: (deal: Deal) => void }) => {
  const [isRevealed, setIsRevealed] = useState(!deal.isGhost);
  const [ghostProgress, setGhostProgress] = useState(0);
  const [remaining, setRemaining] = useState(deal.remainingCoupons);
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(deal.expiresAt));
  const revealRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => setTimeLeft(formatTimeLeft(deal.expiresAt));
    tick();
    timerRef.current = setInterval(tick, 60000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deal.expiresAt]);

  useEffect(() => {
    if (!isRevealed) return undefined;
    const drain = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 5000);
    return () => clearInterval(drain);
  }, [isRevealed]);

  const startReveal = () => {
    if (isRevealed || !deal.isGhost) return;
    if (revealRef.current) clearInterval(revealRef.current);
    let value = 0;
    revealRef.current = setInterval(() => {
      value = Math.min(100, value + 10);
      setGhostProgress(value);
      if (value >= 100) {
        setIsRevealed(true);
        if (revealRef.current) clearInterval(revealRef.current);
      }
    }, 120);
  };

  const stopReveal = () => {
    if (revealRef.current) clearInterval(revealRef.current);
    revealRef.current = null;
    setGhostProgress(0);
  };

  const handleClaim = () => {
    if (!isRevealed) return;
    onClaim(deal);
  };

  return (
    <View style={styles.dealCard}>
      <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} resizeMode="cover" />
      {deal.isGhost && !isRevealed && (
        <View style={styles.ghostMask}>
          <Text style={styles.ghostMaskText}>누르고 비밀 혜택을 해제하세요</Text>
        </View>
      )}
      <View style={styles.dealMeta}>
        <Text style={styles.dealLabel}>{deal.restaurant.name}</Text>
        <Text style={styles.dealTitle}>{deal.title}</Text>
        <View style={styles.dealStatsRow}>
          <Text style={styles.dealDiscount}>{formatCurrency(deal.discountAmount)}원 할인</Text>
          <Text style={styles.dealDistance}>{deal.restaurant.distance}m</Text>
        </View>
        <Text style={styles.dealTime}>{timeLeft}</Text>
        <Text style={styles.dealRemaining}>남은 쿠폰: {remaining}</Text>
      </View>
      <Pressable
        style={styles.claimButton}
        onPress={handleClaim}
        onPressIn={startReveal}
        onPressOut={stopReveal}
      >
        <Text style={styles.claimButtonText}>{isRevealed ? '티켓 뜯기' : `비밀 ${ghostProgress}% 진행 중`}</Text>
        {deal.isGhost && !isRevealed && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${ghostProgress}%` }]} />
          </View>
        )}
      </Pressable>
    </View>
  );
};

const CouponsSection = ({
  coupons,
  onUseCoupon,
  onPreviewInvitation,
}: {
  coupons: Coupon[];
  onUseCoupon: (id: string) => void;
  onPreviewInvitation?: (coupon: Coupon) => void;
}) => {
  if (!coupons.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>아직 티켓이 없습니다. 첫 혜택을 가져보세요!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={coupons}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.couponList}
      renderItem={({ item }) => (
        <View style={[styles.couponCard, item.status === 'USED' && styles.couponUsed]}>
          <Text style={styles.couponTitle}>{item.title}</Text>
          <Text style={styles.couponSubtitle}>{item.restaurantName}</Text>
          <Text style={styles.couponDiscount}>{formatCurrency(item.discountAmount)}원 할인</Text>
          <Text style={styles.couponExpiry}>유효기간: {item.expiresAt.toLocaleDateString()}</Text>
          <Pressable
            style={[styles.useButton, item.status === 'USED' && styles.useButtonDisabled]}
            onPress={() => onUseCoupon(item.id)}
            disabled={item.status === 'USED'}
          >
            <Text style={styles.useButtonText}>{item.status === 'USED' ? '사용 완료' : '사용 처리'}</Text>
          </Pressable>
          {item.hasGoldenKey && item.status === 'USED' && onPreviewInvitation && (
            <Pressable style={styles.goldenInvite} onPress={() => onPreviewInvitation(item)}>
              <Text style={styles.goldenInviteText}>골든 티켓 초대 보기</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
};

const ProfileSection = ({
  isLoggedIn,
  lumens,
  levelDefinition,
  usedCoupons,
  onLogin,
  onLogout,
}: {
  isLoggedIn: boolean;
  lumens: number;
  levelDefinition: ReturnType<typeof getLevelDefinition>;
  usedCoupons: Coupon[];
  onLogin: () => void;
  onLogout: () => void;
}) => {
  return (
    <ScrollView contentContainerStyle={styles.profileContent}>
      <View style={styles.profileBadge}>
        <Text style={styles.profileLabel}>LO.KEY 서포터즈</Text>
        <Text style={[styles.profileLevel, { color: levelDefinition.color }]}>{levelDefinition.label}</Text>
        <Text style={styles.profileDescription}>{levelDefinition.description}</Text>
        <View style={styles.levelBarTrack}>
          <View style={[styles.levelBarFill, { width: `${levelDefinition.progress * 100}%`, backgroundColor: levelDefinition.color }]} />
        </View>
        <Text style={styles.profileSubtext}>다음 레벨까지 {Math.ceil(levelDefinition.nextThreshold - lumens)} lm 남음</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>서포트 금액</Text>
          <Text style={styles.statValue}>{formatCurrency(usedCoupons.reduce((sum, coupon) => sum + coupon.discountAmount, 0))}원</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>탐험 횟수</Text>
          <Text style={styles.statValue}>{usedCoupons.length}회</Text>
        </View>
      </View>
      <View style={styles.localRadar}>
        <Text style={styles.radarLabel}>Local Radar</Text>
        <Text style={styles.radarSubtitle}>보유 티켓과 주변 딜을 한눈에</Text>
      </View>
      <Pressable style={styles.authButton} onPress={isLoggedIn ? onLogout : onLogin}>
        <Text style={styles.authButtonText}>{isLoggedIn ? '로그아웃' : '간편 로그인/계정 연결'}</Text>
      </Pressable>
    </ScrollView>
  );
};

const NavigationBar = ({ currentTab, onChange }: { currentTab: SupporterTab; onChange: (tab: SupporterTab) => void }) => (
  <View style={styles.navBar}>
    {tabConfig.map((tab) => (
      <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.navButton}>
        <Text style={[styles.navLabel, currentTab === tab.key && styles.navLabelActive]}>{tab.label}</Text>
      </Pressable>
    ))}
  </View>
);

const GoldenTicketModal = ({
  visible,
  coupon,
  onClose,
  onAccept,
}: {
  visible: boolean;
  coupon: Coupon | null;
  onClose: () => void;
  onAccept: () => void;
}) => (
  <Modal animationType="fade" transparent visible={visible}>
    <View style={styles.modalBackground}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>골든 티켓 초대</Text>
        <Text style={styles.modalSubtitle}>{coupon?.restaurantName}에서 드리는 프리패스</Text>
        <Text style={styles.modalEmoji}>✨</Text>
        <Text style={styles.modalBody}>초대한 친구가 이 혜택을 사용하면 둘 다 특별 골든 리워드를 받습니다.</Text>
        <View style={styles.modalActions}>
          <Pressable onPress={onAccept} style={[styles.modalButton, styles.modalPrimary]}>
            <Text style={styles.modalButtonText}>초대 수락</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const LoginModal = ({ visible, onClose, onLogin }: { visible: boolean; onClose: () => void; onLogin: () => void }) => (
  <Modal animationType="fade" transparent visible={visible}>
    <View style={styles.modalBackground}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>게스트로 시범 운영 중</Text>
        <Text style={styles.modalBody}>로그인 후 초대권, 골든 티켓 기능을 모두 잠금 해제하세요.</Text>
        <View style={styles.modalActions}>
          <Pressable onPress={onLogin} style={[styles.modalButton, styles.modalPrimary]}>
            <Text style={styles.modalButtonText}>간편 로그인</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>이전 화면으로</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const windowHeight = Dimensions.get('window').height;

export default function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentTab, setCurrentTab] = useState<SupporterTab>('DISCOVERY');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [previewCoupon, setPreviewCoupon] = useState<Coupon | null>(null);
  const [recentBuyer, setRecentBuyer] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashDeals()
      .then((data) => setDeals(data))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const names = ['김*민', '이*서', '박*준', '최*우', '정*윤'];
    const ticker = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      setRecentBuyer(`${name}님이 서포터즈로 참여했어요!`);
      setTimeout(() => setRecentBuyer(null), 3000);
    }, 7000);
    return () => clearInterval(ticker);
  }, []);

  const usedCoupons = useMemo(() => coupons.filter((coupon) => coupon.status === 'USED'), [coupons]);
  const lumens = isLoggedIn ? 150 + usedCoupons.length * 450 : 0;
  const levelDefinition = useMemo(() => getLevelDefinition(lumens), [lumens]);

  const handleClaim = (deal: Deal) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    const alreadyClaimed = coupons.some((coupon) => coupon.dealId === deal.id && coupon.status === 'AVAILABLE');
    if (alreadyClaimed) {
      setCurrentTab('COUPONS');
      return;
    }
    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      dealId: deal.id,
      title: deal.title,
      restaurantName: deal.restaurant.name,
      discountAmount: deal.discountAmount,
      imageUrl: deal.imageUrl,
      status: 'AVAILABLE',
      claimedAt: new Date(),
      expiresAt: deal.expiresAt,
      location: deal.restaurant.location,
      usageCondition: deal.usageCondition,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    setCurrentTab('COUPONS');
  };

  const handleUseCoupon = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === couponId
          ? { ...coupon, status: 'USED', usedAt: new Date(), hasGoldenKey: true }
          : coupon
      )
    );
  };

  const handleAcceptGolden = () => {
    setPreviewCoupon(null);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLoginDialog(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCoupons([]);
    setCurrentTab('DISCOVERY');
  };

  const bodyContent = () => {
    if (currentTab === 'COUPONS') {
      return (
        <CouponsSection
          coupons={coupons}
          onUseCoupon={handleUseCoupon}
          onPreviewInvitation={(coupon) => setPreviewCoupon(coupon)}
        />
      );
    }

    if (currentTab === 'PROFILE') {
      return (
        <ProfileSection
          isLoggedIn={isLoggedIn}
          lumens={lumens}
          levelDefinition={levelDefinition}
          usedCoupons={usedCoupons}
          onLogin={() => setShowLoginDialog(true)}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <View style={[styles.discoveryWrapper, { height: windowHeight - 200 }]}
      >
        {recentBuyer && (
          <View style={styles.recentRibbon}>
            <Text style={styles.recentRibbonText}>{recentBuyer}</Text>
          </View>
        )}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>히든 스팟 탐색 중...</Text>
          </View>
        ) : (
          <FlatList
            data={deals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DealCard deal={item} onClaim={handleClaim} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dealList}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>LO.KEY</Text>
        <Text style={styles.subheader}>Private Local Supporter</Text>
      </View>
      <View style={styles.content}>{bodyContent()}</View>
      <NavigationBar currentTab={currentTab} onChange={setCurrentTab} />
      <GoldenTicketModal
        visible={Boolean(previewCoupon)}
        coupon={previewCoupon}
        onAccept={handleAcceptGolden}
        onClose={() => setPreviewCoupon(null)}
      />
      <LoginModal visible={showLoginDialog} onClose={() => setShowLoginDialog(false)} onLogin={handleLogin} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#030305',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  logo: {
    color: '#fefefe',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subheader: {
    color: '#9da5b2',
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  discoveryWrapper: {
    flex: 1,
  },
  recentRibbon: {
    backgroundColor: '#181818',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  recentRibbonText: {
    color: '#fcd34d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9aa5c8',
    fontSize: 14,
  },
  dealList: {
    paddingBottom: 120,
  },
  dealCard: {
    backgroundColor: '#090909',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#151515',
  },
  dealImage: {
    width: '100%',
    height: 320,
  },
  ghostMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostMaskText: {
    color: '#e5e7eb',
    fontSize: 16,
    letterSpacing: 1,
  },
  dealMeta: {
    padding: 16,
  },
  dealLabel: {
    color: '#fefefe',
    fontWeight: '700',
    fontSize: 14,
  },
  dealTitle: {
    color: '#fefefe',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  dealStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dealDiscount: {
    color: '#34d399',
    fontWeight: '700',
  },
  dealDistance: {
    color: '#e5e7eb',
  },
  dealTime: {
    color: '#cbd5f5',
    marginTop: 6,
  },
  dealRemaining: {
    color: '#fbbf24',
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: '#111111',
    padding: 14,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b2b',
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fefefe',
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34d399',
  },
  couponList: {
    paddingVertical: 16,
    paddingBottom: 140,
  },
  couponCard: {
    backgroundColor: '#0b0b0f',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f29',
    marginBottom: 14,
  },
  couponUsed: {
    borderColor: '#374151',
    opacity: 0.85,
  },
  couponTitle: {
    color: '#fefefe',
    fontWeight: '700',
    fontSize: 16,
  },
  couponSubtitle: {
    color: '#a1a1aa',
    marginTop: 4,
  },
  couponDiscount: {
    color: '#34d399',
    fontWeight: '700',
    marginTop: 8,
  },
  couponExpiry: {
    color: '#cbd5f5',
    fontSize: 12,
    marginTop: 4,
  },
  useButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  useButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  useButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  goldenInvite: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  goldenInviteText: {
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  profileContent: {
    paddingVertical: 24,
    paddingBottom: 120,
  },
  profileBadge: {
    backgroundColor: '#08080d',
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f29',
  },
  profileLabel: {
    color: '#9ca3af',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  profileLevel: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  profileDescription: {
    color: '#cbd5f5',
    marginTop: 6,
  },
  levelBarTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: '#1f2937',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
  },
  profileSubtext: {
    marginTop: 6,
    color: '#a5b4fc',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#0c0f1a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f29',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  statValue: {
    color: '#fefefe',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  localRadar: {
    backgroundColor: '#04050a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#111827',
    marginBottom: 20,
  },
  radarLabel: {
    color: '#fefefe',
    fontWeight: '700',
    fontSize: 16,
  },
  radarSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  authButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222831',
  },
  authButtonText: {
    color: '#fefefe',
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#050509',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
  },
  navLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#fefefe',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#0b0b0f',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f29',
    width: '80%',
  },
  modalTitle: {
    color: '#fefefe',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#cbd5f5',
    marginTop: 4,
  },
  modalEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginVertical: 8,
  },
  modalBody: {
    color: '#cbd5f5',
    fontSize: 14,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f29',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#fefefe',
    fontWeight: '700',
  },
  modalPrimary: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
});
