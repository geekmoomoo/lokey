import React, { useState, useRef } from 'react';
import { Coupon, Deal } from '../types';
import { 
  User, Settings, Bell, 
  HelpCircle, ChevronRight, LogOut, 
  Heart, Map, ShieldCheck,
  Lightbulb, Zap, Crown,
  Sparkles, Flame, Coins, TrendingUp, Star, Lock, Camera
} from 'lucide-react';
import { LocalMap } from './LocalMap';

interface ProfileScreenProps {
  coupons: Coupon[];
  deals: Deal[]; // Passed to show on map
  onLogout: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  userImage: string | null;
  onImageUpdate: (image: string | null) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  coupons, 
  deals, 
  onLogout, 
  isLoggedIn, 
  onLoginClick,
  userImage,
  onImageUpdate 
}) => {
  const [showMap, setShowMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Statistics Calculation ---
  const usedCoupons = coupons.filter(c => c.status === 'USED');
  
  // 1. Total Support Amount (Total Discount Received)
  const totalSupportAmount = usedCoupons.reduce((sum, coupon) => sum + coupon.discountAmount, 0);

  // 2. Lumen Calculation (XP)
  const baseLumens = 150; 
  const lumensPerVisit = 450; 
  const currentLumens = isLoggedIn ? baseLumens + (usedCoupons.length * lumensPerVisit) : 0;
  
  // --- Enhanced Level System Logic ---
  let lumenLevel;
  let nextLevelGoal;

  if (currentLumens < 1000) {
      nextLevelGoal = 1000;
      lumenLevel = {
          mode: "NORMAL",
          color: "text-yellow-100",
          glowColor: "shadow-[0_0_30px_rgba(253,224,71,0.2)]",
          barGradient: "bg-gradient-to-r from-yellow-900 to-yellow-500",
          icon: <Lightbulb size={24} className="text-yellow-500" />,
          label: "반딧불이",
          subLabel: "Firefly",
          description: "골목의 어둠을 밝히기 시작하셨네요!",
          badgeBg: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      };
  } else if (currentLumens < 2500) {
      nextLevelGoal = 2500;
      lumenLevel = {
          mode: "NORMAL",
          color: "text-orange-200",
          glowColor: "shadow-[0_0_40px_rgba(251,146,60,0.3)]",
          barGradient: "bg-gradient-to-r from-orange-600 to-amber-400",
          icon: <Zap size={24} className="text-orange-400 fill-orange-400" />,
          label: "골목 가로등",
          subLabel: "Streetlight",
          description: "당신 덕분에 거리가 활기를 띱니다.",
          badgeBg: "bg-orange-500/20 text-orange-400 border-orange-500/30"
      };
  } else if (currentLumens < 5000) {
      nextLevelGoal = 5000;
      lumenLevel = {
          mode: "NORMAL",
          color: "text-cyan-100",
          glowColor: "shadow-[0_0_60px_rgba(34,211,238,0.4)]",
          barGradient: "bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500",
          icon: <Crown size={24} className="text-cyan-400 fill-cyan-400" />,
          label: "로컬 등대",
          subLabel: "Lighthouse",
          description: "숨겨진 명소를 비추는 독보적인 존재!",
          badgeBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      };
  } else if (currentLumens < 10000) {
      nextLevelGoal = 10000;
      lumenLevel = {
          mode: "HARD",
          color: "text-fuchsia-200",
          glowColor: "shadow-[0_0_80px_rgba(217,70,239,0.5)]",
          barGradient: "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500",
          icon: <Sparkles size={24} className="text-fuchsia-300 fill-fuchsia-300 animate-pulse" />,
          label: "오로라",
          subLabel: "Aurora",
          description: "하드 모드 진입! 밤하늘을 수놓는 빛.",
          badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
      };
  } else {
      nextLevelGoal = currentLumens * 1.5;
      lumenLevel = {
          mode: "INFINITY",
          color: "text-rose-200",
          glowColor: "shadow-[0_0_100px_rgba(225,29,72,0.6)]",
          barGradient: "bg-gradient-to-r from-red-600 via-rose-500 to-white",
          icon: <Flame size={24} className="text-rose-500 fill-rose-500 animate-bounce-subtle" />,
          label: "슈퍼노바",
          subLabel: "Supernova",
          description: "당신은 로컬을 살리는 태양입니다.",
          badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/30"
      };
  }

  const progressPercent = Math.min(100, (currentLumens / nextLevelGoal) * 100);

  // Toggle States (Mock)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // Handle protected actions
  const handleProtectedAction = (action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      onLoginClick();
    }
  };

  // Image Upload Handler
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click
    if (!isLoggedIn) {
        onLoginClick();
    } else {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        onImageUpdate(imageUrl);
    }
  };

  const MenuSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      {title && <h3 className="text-[10px] font-bold text-gray-500 mb-2 px-1 uppercase tracking-wider">{title}</h3>}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );

  const MenuItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    subLabel?: string;
    isToggle?: boolean; 
    toggleValue?: boolean; 
    onToggle?: () => void;
    onClick?: () => void;
    isLast?: boolean; 
  }> = ({ icon, label, subLabel, isToggle, toggleValue, onToggle, onClick, isLast }) => (
    <div 
      onClick={!isToggle ? onClick : () => handleProtectedAction(onToggle!)}
      className={`flex items-center justify-between p-4 active:bg-neutral-800 transition-colors cursor-pointer ${!isLast ? 'border-b border-neutral-800' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div className="flex flex-col">
           <span className="text-sm font-medium text-gray-100">{label}</span>
           {subLabel && <span className="text-[10px] text-gray-500">{subLabel}</span>}
        </div>
      </div>
      
      {isToggle ? (
        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${toggleValue && isLoggedIn ? 'bg-yellow-600' : 'bg-neutral-700'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${toggleValue && isLoggedIn ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      ) : (
        <ChevronRight size={16} className="text-gray-600" />
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar pb-24 relative">
      
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
      />

      {/* Header Profile Card */}
      <div className="relative p-6 pt-10 pb-8 bg-black cursor-pointer" onClick={!isLoggedIn ? onLoginClick : undefined}>
         <div className="flex items-center gap-4">
             {/* Profile Avatar (Editable) */}
             <div 
                onClick={handleImageClick}
                className={`w-16 h-16 rounded-full p-[2px] relative transition-all group ${isLoggedIn ? lumenLevel.barGradient : 'bg-neutral-800 border border-neutral-700'}`}
             >
                 <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-black relative">
                    {isLoggedIn && userImage ? (
                        <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : isLoggedIn ? (
                        <User size={30} className="text-gray-400" />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                            <Lock size={20} className="text-gray-600" />
                        </div>
                    )}
                 </div>
                 
                 {/* Badge Icon / Camera Icon */}
                 {isLoggedIn && (
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-black bg-neutral-800 shadow-md`}>
                        {userImage ? (
                            <div className="text-[10px] font-bold text-gray-200 bg-black/50 w-full h-full rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Camera size={12} />
                            </div>
                        ) : (
                             lumenLevel.icon
                        )}
                    </div>
                 )}
                 
                 {/* Camera Overlay Hint on Hover/Active */}
                 {isLoggedIn && (
                     <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                         <Camera size={20} className="text-white" />
                     </div>
                 )}
             </div>

             <div>
                 <div className="flex items-center gap-2 mb-1">
                     <h1 className="text-xl font-black text-white flex items-center gap-2">
                        {isLoggedIn ? "로컬탐험가" : "로그인하기"}
                        {!isLoggedIn && <ChevronRight size={20} className="text-gray-500" />}
                     </h1>
                 </div>
                 {isLoggedIn ? (
                     <div className="flex flex-col gap-1">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide uppercase self-start ${lumenLevel.badgeBg}`}>
                            {lumenLevel.mode !== 'NORMAL' && <Star size={10} fill="currentColor" />}
                            <span>{lumenLevel.subLabel} LV.</span>
                        </div>
                        {!userImage && <span className="text-[10px] text-gray-500 mt-1">프로필 사진을 등록해보세요!</span>}
                     </div>
                 ) : (
                     <span className="text-xs text-gray-500">3초 만에 시작하고 혜택을 받아보세요!</span>
                 )}
             </div>
         </div>
         
         {/* Guest Login Banner (Inline) - Subtle but visible */}
         {!isLoggedIn && (
             <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center text-black">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">비회원으로 둘러보는 중</p>
                        <p className="text-[10px] text-gray-400">가입하고 나만의 로컬 지도를 만들어보세요.</p>
                    </div>
                </div>
                <button 
                  className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg"
                >
                    로그인
                </button>
             </div>
         )}
      </div>

      <div className="px-6 -mt-2 relative z-10">
        
        {/* --- LUMEN CARD (XP) --- */}
        {/* For guests, show a locked state or invitation state */}
        <div className={`bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-4 relative overflow-hidden transition-all duration-700 ${isLoggedIn ? lumenLevel.glowColor : ''}`}>
            
            {/* Ambient Light Effect */}
            {isLoggedIn && <div className={`absolute top-[-50%] right-[-50%] w-[200%] h-[200%] rounded-full opacity-10 blur-[80px] ${lumenLevel.barGradient}`}></div>}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Local Brightness</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                            {new Intl.NumberFormat('en-US').format(currentLumens)} 
                            <span className="text-sm font-medium text-gray-500 ml-1">lm</span>
                        </h2>
                    </div>
                    
                    {/* Level Icon Display */}
                    <div className="text-right flex flex-col items-end">
                         <div className={`w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-1 backdrop-blur-md shadow-inner`}>
                             {lumenLevel.icon}
                         </div>
                         <span className={`text-xs font-bold ${lumenLevel.color}`}>{lumenLevel.label}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 bg-black/50 rounded-full overflow-hidden mb-3 border border-white/5">
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${lumenLevel.barGradient}`}
                        style={{ width: `${progressPercent}%` }}
                    >
                    </div>
                </div>

                <div className="flex justify-between items-start">
                     <p className="text-xs text-gray-400 font-medium">{lumenLevel.description}</p>
                     <span className="text-[10px] text-gray-600 font-mono">NEXT: {Math.floor(nextLevelGoal)} lm</span>
                </div>
            </div>
            
            {/* Lock Overlay for Guest - But clickable */}
            {!isLoggedIn && (
                <div onClick={onLoginClick} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 cursor-pointer group">
                    <Lock className="text-gray-500 w-8 h-8 mb-2 group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">내 레벨 확인하기</span>
                </div>
            )}
        </div>

        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            {/* Total Support */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Coins size={40} className="text-yellow-500" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">총 서포트 금액</p>
                   <p className="text-xs text-gray-500 mb-2">사장님에게 전달된 가치</p>
                </div>
                <div className="text-lg font-black text-white">
                    {isLoggedIn ? new Intl.NumberFormat('ko-KR').format(totalSupportAmount) : '-'}
                    <span className="text-xs font-medium text-gray-500 ml-1">원</span>
                </div>
            </div>

            {/* Visit Count */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                     <TrendingUp size={40} className="text-blue-500" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">탐험 횟수</p>
                   <p className="text-xs text-gray-500 mb-2">밝혀낸 히든 스팟</p>
                </div>
                <div className="text-lg font-black text-white">
                    {isLoggedIn ? usedCoupons.length : '-'}
                    <span className="text-xs font-medium text-gray-500 ml-1">곳</span>
                </div>
            </div>
        </div>


        {/* Menu Sections - Fully Visible but Protected */}
        <MenuSection title="MY ACTIVITY">
           <MenuItem 
             icon={<Map size={18} />} 
             label="나의 로컬 지도" 
             subLabel="내가 밝힌 구역 확인하기"
             onClick={() => handleProtectedAction(() => setShowMap(true))}
           />
           <MenuItem 
             icon={<Heart size={18} />} 
             label="관심 매장" 
             subLabel="찜한 매장 목록"
             isLast={true}
             onClick={() => handleProtectedAction(() => alert('준비 중인 기능입니다.'))}
           />
        </MenuSection>

        <MenuSection title="SETTINGS">
           <MenuItem 
             icon={<Bell size={18} />} 
             label="초대 알림" 
             subLabel="새로운 히든 스팟 알림 받기"
             isToggle={true}
             toggleValue={pushEnabled}
             onToggle={() => setPushEnabled(!pushEnabled)}
           />
           <MenuItem 
             icon={<ShieldCheck size={18} />} 
             label="마케팅 정보 수신 동의" 
             isToggle={true}
             toggleValue={marketingEnabled}
             onToggle={() => setMarketingEnabled(!marketingEnabled)}
             isLast={true}
           />
        </MenuSection>

        <MenuSection title="SUPPORT">
           <MenuItem 
             icon={<HelpCircle size={18} />} 
             label="고객센터" 
             onClick={() => alert("고객센터 연결")}
           />
           <MenuItem 
             icon={<Settings size={18} />} 
             label="앱 버전 정보" 
             subLabel="LO.KEY v1.0.3"
             isLast={true}
             onClick={() => {}}
           />
        </MenuSection>
        
        {isLoggedIn ? (
            <div className="mt-4 mb-10 flex justify-center">
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-700 text-xs font-medium hover:text-gray-500 transition-colors"
                >
                    <LogOut size={14} /> 로그아웃
                </button>
            </div>
        ) : (
             <div className="mt-4 mb-10 text-center">
                <p className="text-[10px] text-gray-600">
                    회원가입 없이 둘러보고 계십니다.
                </p>
            </div>
        )}

      </div>

      {/* --- LOCAL MAP MODAL --- */}
      {showMap && (
        <LocalMap 
          deals={deals} 
          myCoupons={coupons} 
          onClose={() => setShowMap(false)} 
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-bounce-subtle { animation: bounceSubtle 2s infinite; }
        @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};