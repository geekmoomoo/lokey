import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addDeal, generateContextComments, getMerchantDeals, updateDeal } from '@shared/services/dealService';
import { Deal, MerchantTab } from '@shared/types';

type WizardForm = {
  storeName: string;
  title: string;
  benefitType: 'DISCOUNT' | 'CUSTOM' | 'AD';
  benefitValue: string;
  duration: string;
  quantity: string;
  condition: string;
  category: string;
  prompt: string;
  style: 'NATURAL' | 'LUXURY' | 'VIVID';
};

const tabs = [
  { key: MerchantTab.AD_REGISTER, label: '광고 등록' },
  { key: MerchantTab.DASHBOARD, label: '운영 대시보드' },
  { key: MerchantTab.PROFILE, label: '매장 관리' },
];

const wizardSteps = ['기본 정보', '이미지 설정', '운영 조건', '확인 & 발행'];
const aiStyles = ['NATURAL', 'LUXURY', 'VIVID'] as const;
const sampleImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<MerchantTab>(MerchantTab.AD_REGISTER);
  const [deals, setDeals] = useState<Deal[]>(getMerchantDeals());
  const [wizardStep, setWizardStep] = useState(0);
  const [aiImage, setAiImage] = useState(sampleImages[0]);
  const [form, setForm] = useState<WizardForm>({
    storeName: '상무 딜라이트',
    title: '시그니처 티켓 50% OFF',
    benefitType: 'DISCOUNT',
    benefitValue: '7000',
    duration: '2',
    quantity: '40',
    condition: '1인 1메뉴 필수',
    category: '한식',
    prompt: '따뜻한 조명이 비치는 가로등 아래 석양에 빛나는 국물',
    style: 'NATURAL',
  });

  const refreshDeals = () => setDeals([...getMerchantDeals()]);

  const handlePublish = () => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: form.title || '로컬 스페셜 딜',
      originalPrice: Number(form.benefitValue) + 20000,
      discountAmount: Number(form.benefitValue) || 5000,
      imageUrl: aiImage,
      totalCoupons: Number(form.quantity) || 30,
      remainingCoupons: Number(form.quantity) || 30,
      expiresAt: new Date(Date.now() + Number(form.duration) * 24 * 3600 * 1000),
      status: 'ACTIVE',
      restaurant: {
        id: `store-${Date.now()}`,
        name: form.storeName,
        category: form.category,
        distance: 450,
        rating: 4.8,
        reviewCount: 860,
        location: { lat: 35.1534, lng: 126.8514 },
      },
      initialComments: generateContextComments(form.category, form.title),
    };
    addDeal(newDeal);
    refreshDeals();
    setWizardStep(0);
  };

  const handlePause = (deal: Deal) => {
    updateDeal(deal.id, { status: deal.status === 'ACTIVE' ? 'ENDED' : 'ACTIVE' });
    refreshDeals();
  };

  const handleAddQuantity = (deal: Deal) => {
    updateDeal(deal.id, { remainingCoupons: deal.remainingCoupons + 10 });
    refreshDeals();
  };

  const handleCopy = (deal: Deal) => {
    const copy: Deal = {
      ...deal,
      id: `deal-copy-${Date.now()}`,
      remainingCoupons: deal.totalCoupons,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      status: 'ACTIVE',
    };
    addDeal(copy);
    refreshDeals();
  };

  const activeDeals = useMemo(() => deals.filter((deal) => deal.status === 'ACTIVE'), [deals]);

  const renderWizard = () => (
    <ScrollView contentContainerStyle={styles.wizardContainer}>
      <View style={styles.stepper}>
        {wizardSteps.map((step, index) => (
          <View key={step} style={[styles.step, wizardStep === index && styles.stepActive]}>
            <Text style={[styles.stepText, wizardStep === index && styles.stepTextActive]}>{step}</Text>
          </View>
        ))}
      </View>

      {wizardStep === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>광고 기본 정보</Text>
          <TextInput
            style={styles.input}
            value={form.storeName}
            onChangeText={(value) => setForm((prev) => ({ ...prev, storeName: value }))}
            placeholder="매장명"
            placeholderTextColor="#8b8f96"
          />
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
            placeholder="광고 문구"
            placeholderTextColor="#8b8f96"
          />
          <View style={styles.selectorRow}>
            {['DISCOUNT', 'CUSTOM', 'AD'].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.selectorButton,
                  form.benefitType === type && styles.selectorButtonActive,
                ]}
                onPress={() => setForm((prev) => ({ ...prev, benefitType: type as WizardForm['benefitType'] }))}
              >
                <Text
                  style={[
                    styles.selectorText,
                    form.benefitType === type && styles.selectorTextActive,
                  ]}
                >
                  {type === 'DISCOUNT' ? '금액 할인' : type === 'CUSTOM' ? '한정 스페셜' : '단순 홍보'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={form.benefitValue}
            onChangeText={(value) => setForm((prev) => ({ ...prev, benefitValue: value }))}
            placeholder="할인 금액"
            placeholderTextColor="#8b8f96"
            keyboardType="numeric"
          />
        </View>
      )}

      {wizardStep === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI 이미지 & 스타일</Text>
          <TextInput
            style={styles.input}
            value={form.prompt}
            onChangeText={(value) => setForm((prev) => ({ ...prev, prompt: value }))}
            placeholder="이미지 설명"
            placeholderTextColor="#8b8f96"
            multiline
          />
          <View style={styles.styleRow}>
            {aiStyles.map((styleOption) => (
              <Pressable
                key={styleOption}
                style={[
                  styles.styleButton,
                  form.style === styleOption && styles.styleButtonActive,
                ]}
                onPress={() => setForm((prev) => ({ ...prev, style: styleOption }))}
              >
                <Text
                  style={form.style === styleOption ? styles.styleTextActive : styles.styleText}
                >
                  {styleOption}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.imagePreview}
            onPress={() => setAiImage(sampleImages[Math.floor(Math.random() * sampleImages.length)])}
          >
            <Image source={{ uri: aiImage }} style={styles.previewImage} />
            <Text style={styles.previewHint}>누르면 AI가 새 이미지를 생성합니다</Text>
          </Pressable>
        </View>
      )}

      {wizardStep === 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>운영 조건</Text>
          <TextInput
            style={styles.input}
            value={form.duration}
            onChangeText={(value) => setForm((prev) => ({ ...prev, duration: value }))}
            placeholder="노출 기간 (일)"
            placeholderTextColor="#8b8f96"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={form.quantity}
            onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
            placeholder="쿠폰 수량"
            placeholderTextColor="#8b8f96"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={form.condition}
            onChangeText={(value) => setForm((prev) => ({ ...prev, condition: value }))}
            placeholder="사용 조건"
            placeholderTextColor="#8b8f96"
          />
        </View>
      )}

      {wizardStep === 3 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>확인 & 발행</Text>
          <Text style={styles.confirmText}>{form.title}</Text>
          <Text style={styles.confirmSubtext}>기간: {form.duration}일 · 수량: {form.quantity}개</Text>
          <Text style={styles.confirmSubtext}>조건: {form.condition}</Text>
        </View>
      )}

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>회원용 미리보기</Text>
        <Image source={{ uri: aiImage }} style={styles.previewImage} />
        <Text style={styles.previewTitle}>{form.title || '히든 스팟 광고'}</Text>
        <Text style={styles.previewCopy}>할인 {form.benefitValue}원 · {form.category} · {form.condition}</Text>
      </View>

      <View style={styles.wizardActions}>
        <Pressable
          style={styles.wizardAction}
          onPress={() => setWizardStep((prev) => Math.max(prev - 1, 0))}
        >
          <Text style={styles.wizardActionText}>이전</Text>
        </Pressable>
        {wizardStep < wizardSteps.length - 1 ? (
          <Pressable
            style={[styles.wizardAction, styles.wizardActionPrimary]}
            onPress={() => setWizardStep((prev) => Math.min(prev + 1, wizardSteps.length - 1))}
          >
            <Text style={styles.wizardActionText}>다음</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.wizardAction, styles.wizardActionPrimary]}
            onPress={handlePublish}
          >
            <Text style={styles.wizardActionText}>광고 발행</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
  
  const renderDashboard = () => (
    <ScrollView contentContainerStyle={styles.dashboardContainer}>
      <View style={styles.dashboardStats}>
        <View style={styles.dashboardStat}>
          <Text style={styles.dashboardLabel}>진행 중 광고</Text>
          <Text style={styles.dashboardNumber}>{activeDeals.length}</Text>
        </View>
        <View style={styles.dashboardStat}>
          <Text style={styles.dashboardLabel}>일 평균 유입</Text>
          <Text style={styles.dashboardNumber}>134</Text>
        </View>
      </View>
      <Text style={styles.sectionLabel}>광고 리스트</Text>
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cardsContainer}
        renderItem={({ item }) => (
          <View style={styles.campaignCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.campaignImage} />
            <View style={styles.campaignBody}>
              <Text style={styles.campaignTitle}>{item.title}</Text>
              <Text style={styles.campaignSub}>{item.restaurant.name}</Text>
              <Text style={styles.campaignSub}>남은 {item.remainingCoupons} / {item.totalCoupons}</Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.smallButton} onPress={() => handlePause(item)}>
                  <Text style={styles.smallButtonText}>{item.status === 'ACTIVE' ? '광고 중단' : '재개'}</Text>
                </Pressable>
                <Pressable style={styles.smallButton} onPress={() => handleAddQuantity(item)}>
                  <Text style={styles.smallButtonText}>수량 추가</Text>
                </Pressable>
                <Pressable style={styles.smallButton} onPress={() => handleCopy(item)}>
                  <Text style={styles.smallButtonText}>복사</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      <View style={styles.profileCard}>
        <Text style={styles.sectionLabel}>매장 정보</Text>
        <Text style={styles.profileText}>매장명: {form.storeName}</Text>
        <Text style={styles.profileText}>사업자 번호: 123-45-67890</Text>
        <Text style={styles.profileText}>전화: 010-1234-5678</Text>
        <Text style={styles.profileText}>주소: 광주 광산구 상무대로</Text>
      </View>
      <View style={styles.profileCard}>
        <Text style={styles.sectionLabel}>AI 지원</Text>
        <Text style={styles.profileText}>Gemini API 연결 상태: 연결됨</Text>
        <Text style={styles.profileText}>이미지 생성 요청: {form.prompt.slice(0, 20)}...</Text>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>페이스북/인스타 동시 발행</Text>
        </Pressable>
      </View>
      <View style={styles.profileCard}>
        <Text style={styles.sectionLabel}>운영 설정</Text>
        <View style={styles.settingRow}>
          <Text style={styles.profileText}>알림</Text>
          <Text style={styles.toggle}>ON</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.profileText}>자동 수량 연장</Text>
          <Text style={styles.toggle}>OFF</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.profileText}>영업시간 확인</Text>
          <Text style={styles.toggle}>12:00 - 23:00</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>LO.KEY Partner</Text>
        <Text style={styles.subtitle}>AI 기반 게릴라 마케팅</Text>
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, currentTab === tab.key && styles.tabActive]}
            onPress={() => setCurrentTab(tab.key)}
          >
            <Text style={styles.tabText}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tabContent}>
        {currentTab === MerchantTab.AD_REGISTER && renderWizard()}
        {currentTab === MerchantTab.DASHBOARD && renderDashboard()}
        {currentTab === MerchantTab.PROFILE && renderProfile()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#05060c',
  },
  header: {
    paddingTop: 42,
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  logo: {
    color: '#fefefe',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#0b0c13',
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#111827',
  },
  tabText: {
    color: '#a5b4fc',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  wizardContainer: {
    padding: 16,
    paddingBottom: 160,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#06070d',
  },
  stepActive: {
    backgroundColor: '#1d4ed8',
  },
  stepText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  stepTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  section: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#070912',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
  },
  sectionLabel: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0e111a',
    borderRadius: 12,
    padding: 12,
    color: '#fefefe',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  selectorText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  selectorTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  styleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  styleButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e2a',
    alignItems: 'center',
  },
  styleButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0a192f',
  },
  styleText: {
    color: '#94a3b8',
  },
  styleTextActive: {
    color: '#ecfeff',
    fontWeight: '700',
  },
  imagePreview: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  previewHint: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    color: '#fefefe',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewCard: {
    marginTop: 18,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  previewLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  previewTitle: {
    color: '#fefefe',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  previewCopy: {
    color: '#cbd5f5',
    marginTop: 4,
  },
  confirmText: {
    color: '#fefefe',
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 6,
  },
  confirmSubtext: {
    color: '#cbd5f5',
  },
  wizardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  wizardAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#0b0e18',
  },
  wizardActionPrimary: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  wizardActionText: {
    color: '#fefefe',
    fontWeight: '700',
  },
  dashboardContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  dashboardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dashboardStat: {
    flex: 1,
    backgroundColor: '#0a0c14',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#111827',
  },
  dashboardLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  dashboardNumber: {
    color: '#fefefe',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  cardsContainer: {
    paddingBottom: 80,
  },
  campaignCard: {
    flexDirection: 'row',
    backgroundColor: '#060712',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#111827',
    marginBottom: 14,
    overflow: 'hidden',
  },
  campaignImage: {
    width: 120,
    height: 120,
  },
  campaignBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  campaignTitle: {
    color: '#fefefe',
    fontSize: 16,
    fontWeight: '700',
  },
  campaignSub: {
    color: '#9ca3af',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  smallButtonText: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '700',
  },
  profileContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: '#0a0d18',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#111827',
    padding: 16,
    marginBottom: 14,
  },
  profileText: {
    color: '#cbd5f5',
    marginTop: 6,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  toggle: {
    color: '#34d399',
    fontWeight: '700',
  },
});
