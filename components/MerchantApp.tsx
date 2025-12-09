import React, { useState, useCallback } from 'react';
import { MerchantNavigation } from './MerchantNavigation';
import { PartnerLoginScreen } from './PartnerLoginScreen';
import { MerchantTab, Deal } from '@shared/types';
import { usePartnerAuth } from '../contexts/PartnerAuthContext';
import { Store } from 'lucide-react';
import { DashboardScreen } from './DashboardScreen';
import { DealCreationWizard } from './DealCreationWizard';
import { PartnerProfile } from './PartnerProfile';
import { registerPartner } from '@shared/services/apiService';

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Initial Empty Deal State for Form
const INITIAL_FORM = {
    title: '',
    benefitType: 'DISCOUNT' as 'DISCOUNT' | 'CUSTOM' | 'AD',
    benefitValue: '',
    originalPrice: '',
    imagePrompt: '',
    imageStyle: 'NATURAL',
    generatedImages: [] as string[],
    selectedImageIndex: 0,
    duration: 1,
    expiryTime: '23:59',
    quantityMode: 'LIMITED' as 'LIMITED' | 'UNLIMITED',
    quantity: 10,
    description: '',
    conditionType: 'NONE' as 'NONE' | 'ONE_MENU' | 'MIN_ORDER',
    minOrderAmount: '',
    usageConditionText: ''
};

interface MerchantAppProps {
  onBackToHome: () => void;
}

export const MerchantApp: React.FC<MerchantAppProps> = ({ onBackToHome }) => {
  // 파트너 인증 훅 사용
  const { partner, isLoading: authLoading, login } = usePartnerAuth();

  const [currentTab, setCurrentTab] = useState<MerchantTab>(MerchantTab.AD_REGISTER);

  // UI State
  const [loginError, setLoginError] = useState('');

  // Ad Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- HANDLER: LOGIN ---
  const handleLogin = useCallback(async (businessRegNumber: string, password: string) => {
    setLoginError('');
    try {
      const result = await login(businessRegNumber, password);
      if (result.success) {
        console.log('✅ 파트너 로그인 성공');
      } else {
        setLoginError(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 로그인 에러:', error);
      setLoginError('로그인 중 오류가 발생했습니다.');
    }
  }, [login]);

  const [isRegistering, setIsRegistering] = useState(false);

  // --- HANDLER: REGISTER ---
  const handleRegister = useCallback(async (partnerData: any) => {
    setIsRegistering(true);
    try {
      const result = await registerPartner(partnerData);
      if (result.success) {
        alert('✅ 파트너 신청이 완료되었습니다!\n\n관리자 승인 후 로그인할 수 있습니다.\n(영업일 기준 1-2일 소요)');
        // 신청 완료 후 로그인 화면으로 전환하도록 PartnerLoginScreen에 알림
        return { success: true, switchToLogin: true };
      } else {
        alert(`❌ 신청 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ 회원가입 에러:', error);
      alert('❌ 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      return { success: false };
    } finally {
      setIsRegistering(false);
    }
  }, []);

  // --- HANDLER: COPY DEAL ---
  const handleCopyDeal = (deal: Deal) => {
    let conditionType: 'NONE' | 'ONE_MENU' | 'MIN_ORDER' = 'NONE';
    let minOrder = '';

    if (deal.usageCondition?.includes('1인 1메뉴')) conditionType = 'ONE_MENU';
    if (deal.usageCondition?.includes('이상 주문')) {
        conditionType = 'MIN_ORDER';
        minOrder = deal.usageCondition.replace(/[^0-9]/g, '');
    }

    const parseNum = (str: string) => Number(str.replace(/,/g, '')) || 0;

    setFormData({
        ...INITIAL_FORM,
        title: deal.title,
        benefitType: deal.benefitType || (deal.discountAmount > 0 ? 'DISCOUNT' : 'AD'),
        benefitValue: deal.benefitType === 'CUSTOM'
            ? (deal.customBenefit || '')
            : (deal.discountAmount > 0 ? new Intl.NumberFormat('ko-KR').format(deal.discountAmount) : ''),
        originalPrice: new Intl.NumberFormat('ko-KR').format(deal.originalPrice),
        generatedImages: [deal.imageUrl],
        selectedImageIndex: 0,
        quantity: deal.totalCoupons,
        conditionType: conditionType,
        minOrderAmount: minOrder ? new Intl.NumberFormat('ko-KR').format(parseInt(minOrder)) : '',
    });

    setStep(1);
    setCurrentTab(MerchantTab.AD_REGISTER);
  };

  // --- RENDER: AD REGISTRATION WIZARD ---
  const renderAdRegistrationWizard = () => {
    // Check login first (partner 상태 확인)
    if (!partner) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                     <Store size={32} className="text-gray-600" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
                 <p className="text-sm text-gray-500 mb-8">광고를 등록하려면 먼저 로그인하거나 매장을 등록해주세요.</p>
                 <button
                    onClick={() => setCurrentTab(MerchantTab.PROFILE)}
                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl"
                 >
                     로그인 / 회원가입 하러가기
                 </button>
            </div>
        );
    }

    return (
        <DealCreationWizard
            step={step}
            setStep={setStep}
            formData={formData}
            setFormData={setFormData}
            onBackToHome={onBackToHome}
            storeName={partner.storeName}
            category={partner.category}
            merchantId={partner.id}
            setCurrentTab={setCurrentTab}
        />
    );
  };

  // 로딩 중일 때
  if (authLoading) {
    return (
      <div className="bg-neutral-900 min-h-screen w-full flex justify-center items-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">업주 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 파트너 로그인이 필요한 경우
  if (!partner) {
    return (
      <PartnerLoginScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        onBack={onBackToHome}
        isLoading={authLoading}
        error={loginError}
        isRegistering={isRegistering}
      />
    );
  }

  // 로그인된 상태에서 메인 앱 표시
  return (
    <div className="bg-neutral-900 min-h-screen w-full flex justify-center items-center">
      <div className="w-full max-w-md h-[100dvh] bg-black relative shadow-2xl overflow-hidden md:rounded-3xl border-gray-800 md:border-4 flex flex-col">
        {/* Content based on Tab */}
        <div className="flex-1 overflow-hidden relative">
            {currentTab === MerchantTab.AD_REGISTER && renderAdRegistrationWizard()}
            {currentTab === MerchantTab.DASHBOARD && (
                <DashboardScreen
                    storeName={partner.storeName}
                    merchantId={partner.id}
                    businessRegNumber={partner.businessRegNumber}
                    onNavigateToAd={() => setCurrentTab(MerchantTab.AD_REGISTER)}
                    onCopyDeal={handleCopyDeal}
                />
            )}
            {currentTab === MerchantTab.PROFILE && (
                <PartnerProfile
                    setCurrentTab={setCurrentTab}
                    onBackToHome={onBackToHome}
                />
            )}
        </div>

        {/* Navigation */}
        <MerchantNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </div>
  );
};