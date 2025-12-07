import React from 'react';
import { PlusCircle, Layers, Store } from 'lucide-react';
import { MerchantTab } from '@shared/types';

interface MerchantNavigationProps {
  currentTab: MerchantTab;
  onTabChange: (tab: MerchantTab) => void;
}

export const MerchantNavigation: React.FC<MerchantNavigationProps> = ({ currentTab, onTabChange }) => {
  const getIconColor = (tab: MerchantTab) => currentTab === tab ? 'text-purple-400' : 'text-gray-600';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800 flex justify-around items-center px-6 pb-2 z-50">
      <button onClick={() => onTabChange(MerchantTab.AD_REGISTER)} className="flex flex-col items-center p-2 w-20 group">
        <PlusCircle className={`w-6 h-6 mb-1 transition-colors ${getIconColor(MerchantTab.AD_REGISTER)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(MerchantTab.AD_REGISTER)}`}>광고등록</span>
      </button>
      <button onClick={() => onTabChange(MerchantTab.DASHBOARD)} className="flex flex-col items-center p-2 w-20 group">
        <Layers className={`w-6 h-6 mb-1 transition-colors ${getIconColor(MerchantTab.DASHBOARD)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(MerchantTab.DASHBOARD)}`}>운영/수정</span>
      </button>
      <button onClick={() => onTabChange(MerchantTab.PROFILE)} className="flex flex-col items-center p-2 w-20 group">
        <Store className={`w-6 h-6 mb-1 transition-colors ${getIconColor(MerchantTab.PROFILE)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(MerchantTab.PROFILE)}`}>내 정보</span>
      </button>
    </div>
  );
};
