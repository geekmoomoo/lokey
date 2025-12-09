import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginPartner } from '@shared/services/apiService';

export interface Partner {
  id: string;
  businessRegNumber: string;
  storeName: string;
  storeType: string;
  category: string;
  address: string;
  storePhone: string;
  ownerName: string;
  ownerPhone: string;
  planType: string;
  status: string;
}

interface PartnerAuthContextType {
  partner: Partner | null;
  isLoading: boolean;
  login: (businessRegNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

interface PartnerAuthContextProviderProps {
  children: ReactNode;
}

export const PartnerAuthContextProvider: React.FC<PartnerAuthContextProviderProps> = ({ children }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 파트너 정보 복원
    const savedPartner = localStorage.getItem('partner_auth');
    if (savedPartner) {
      try {
        const partnerData = JSON.parse(savedPartner);
        setPartner(partnerData);
      } catch (error) {
        console.error('Failed to parse saved partner data:', error);
        localStorage.removeItem('partner_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (businessRegNumber: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await loginPartner(businessRegNumber, password);

      if (response.success && response.data?.partner) {
        setPartner(response.data.partner);
        // 로컬 스토리지에 파트너 정보 저장 (세션 유지용)
        localStorage.setItem('partner_auth', JSON.stringify(response.data.partner));
        console.log('✅ 파트너 로그인 성공:', response.data.partner.storeName);
        return { success: true };
      } else {
        return { success: false, error: response.error || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('❌ 파트너 로그인 에러:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      setPartner(null);
      localStorage.removeItem('partner_auth');
      console.log('✅ 파트너 로그아웃 완료');
    } catch (error) {
      console.error('❌ 파트너 로그아웃 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    partner,
    isLoading,
    login,
    logout
  };

  return (
    <PartnerAuthContext.Provider value={value}>
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = (): PartnerAuthContextType => {
  const context = useContext(PartnerAuthContext);
  if (context === undefined) {
    throw new Error('usePartnerAuth must be used within a PartnerAuthContextProvider');
  }
  return context;
};