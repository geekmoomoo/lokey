import React from 'react';
import { Compass, Ticket, User } from 'lucide-react';
import { AppTab } from '@shared/types';

interface NavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const getIconColor = (tab: AppTab) => currentTab === tab ? 'text-white' : 'text-gray-600';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 flex justify-around items-center px-6 pb-2 z-50">
      <button onClick={() => onTabChange(AppTab.SEARCH)} className="flex flex-col items-center p-2 w-16 group">
        <Compass className={`w-6 h-6 mb-1 transition-colors ${getIconColor(AppTab.SEARCH)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(AppTab.SEARCH)}`}>로컬 탐험</span>
      </button>
      <button onClick={() => onTabChange(AppTab.COUPONS)} className="flex flex-col items-center p-2 w-16 group">
        <Ticket className={`w-6 h-6 mb-1 transition-colors ${getIconColor(AppTab.COUPONS)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(AppTab.COUPONS)}`}>마이 티켓</span>
      </button>
      <button onClick={() => onTabChange(AppTab.PROFILE)} className="flex flex-col items-center p-2 w-16 group">
        <User className={`w-6 h-6 mb-1 transition-colors ${getIconColor(AppTab.PROFILE)} group-active:scale-90`} />
        <span className={`text-[10px] font-medium tracking-wide ${getIconColor(AppTab.PROFILE)}`}>내 정보</span>
      </button>
    </div>
  );
};
