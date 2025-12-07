import React, { useState, useEffect, useRef } from 'react';
import { Coupon, Location } from '../types';
import { X, Check, Clock, Sparkles, Lock, Unlock, MapPin, AlertTriangle, Fingerprint, Stamp, Navigation, Radar, Megaphone } from 'lucide-react';

interface CouponsScreenProps {
  coupons: Coupon[];
  onUseCoupon: (couponId: string) => void;
  onPreviewInvitation?: (coupon: Coupon) => void; 
}

// --- UTILS ---
const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

// Internal Component for Timer
const CouponTimer: React.FC<{ expiresAt: Date }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = new Date(expiresAt).getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('기간 만료');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      let timeString = '';
      if (days > 0) timeString += `${days}일 `;
      if (hours > 0 || days > 0) timeString += `${hours}시간 `;
      timeString += `${minutes}분 후 마감`;

      setTimeLeft(timeString);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); 
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 self-start mt-2">
      <Clock size={10} />
      <span>{timeLeft}</span>
    </div>
  );
};

// Internal Component: Real-time Live Clock
const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">
                {time.toLocaleTimeString('en-US', { hour12: false })}
            </span>
        </div>
    );
};

export const CouponsScreen: React.FC<CouponsScreenProps> = ({ coupons, onUseCoupon, onPreviewInvitation }) => {
  const [filter, setFilter] = useState<'AVAILABLE' | 'USED'>('AVAILABLE');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  // --- LOCATION & STAMP STATE ---
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [showStampMode, setShowStampMode] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  
  // Mock Location for Demo (Simulate User being close if GPS fails or for testing)
  // In a real app, you would handle geolocation errors more gracefully.
  const useMockLocation = () => {
      if (selectedCoupon) {
          setUserLocation({
              lat: selectedCoupon.location.lat + 0.0001, // Very close
              lng: selectedCoupon.location.lng
          });
      }
  };

  // 1. Geolocation Tracking
  useEffect(() => {
      if (!navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition(
          (pos) => {
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => console.error(err),
          { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Distance Calculation
  useEffect(() => {
      if (selectedCoupon && userLocation) {
          const dist = calculateDistance(userLocation, selectedCoupon.location);
          setDistance(dist);
          setIsLocationVerified(dist <= 100); // 100m radius
      }
  }, [userLocation, selectedCoupon]);

  // 3. Reset State on Close
  useEffect(() => {
      if (!selectedCoupon) {
          setShowStampMode(false);
          setIsStamped(false);
          setDistance(null);
          setIsLocationVerified(false);
      }
  }, [selectedCoupon]);

  const filteredCoupons = coupons.filter(c => c.status === filter);
  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
      const dateA = a.usedAt || a.claimedAt;
      const dateB = b.usedAt || b.claimedAt;
      return dateB.getTime() - dateA.getTime();
  });

  // --- STAMP INTERACTION HANDLER ---
  const handleStamp = () => {
      if (isStamped) return;

      // 1. Trigger Visual & Haptic
      setIsStamped(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 50, 200]); // Thump effect
      }

      // 2. Play Sound (Optional, browser blocks auto-audio usually, so we rely on visuals)
      // const audio = new Audio('/stamp_sound.mp3'); audio.play().catch(() => {});

      // 3. Delay then Close/Process
      setTimeout(() => {
          if (selectedCoupon) {
              onUseCoupon(selectedCoupon.id);
              setSelectedCoupon(null);
          }
      }, 2500); // Give time to see the animation
  };

  return (
    <div className="w-full h-full bg-black text-white p-6 pb-24 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-6 mt-6">
          <h1 className="text-2xl font-black">마이 티켓</h1>
          <div className="text-xs font-medium text-gray-500">
             LO.KEY MEMBER
          </div>
      </div>
      
      {/* Tabs */}
      <div className="flex p-1 bg-neutral-900 border border-neutral-800 rounded-xl mb-6 sticky top-0 z-10 backdrop-blur-md">
        <button 
          onClick={() => setFilter('AVAILABLE')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-300 ${filter === 'AVAILABLE' ? 'bg-neutral-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-400'}`}
        >
          보유 티켓 {coupons.filter(c => c.status === 'AVAILABLE').length > 0 && <span className="ml-1 text-yellow-500">•</span>}
        </button>
        <button 
          onClick={() => setFilter('USED')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-300 ${filter === 'USED' ? 'bg-neutral-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-400'}`}
        >
          방문 완료
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {sortedCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-600 gap-4">
            <div className="p-6 bg-neutral-900 rounded-full border border-neutral-800">
                <Sparkles size={30} className="opacity-30" />
            </div>
            <p className="font-medium text-sm text-gray-500">
                {filter === 'AVAILABLE' ? '아직 받은 티켓이 없습니다.' : '방문한 기록이 없습니다.'}
            </p>
          </div>
        ) : (
          sortedCoupons.map(coupon => (
            <div key={coupon.id}>
                <div 
                onClick={() => filter === 'AVAILABLE' && setSelectedCoupon(coupon)}
                className={`relative bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex gap-4 transition-all duration-200 
                    ${filter === 'AVAILABLE' ? 'cursor-pointer active:scale-[0.98] active:bg-neutral-800 hover:border-neutral-700' : 'opacity-60 grayscale'}`}
                >
                {/* Left: Image */}
                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-neutral-800 self-center border border-neutral-800">
                    <img src={coupon.imageUrl} alt={coupon.title} className="w-full h-full object-cover" />
                </div>

                {/* Right: Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            {coupon.restaurantName}
                        </span>
                    </div>
                    <h3 className="font-bold text-base leading-tight mb-1 truncate text-gray-100">{coupon.title}</h3>
                    <span className="text-sm font-medium text-gray-300 leading-none">
                         {coupon.discountAmount > 0 ? (
                             <>서포터즈 혜택 <span className="text-white font-bold">{new Intl.NumberFormat('ko-KR').format(coupon.discountAmount)}원</span></>
                         ) : (
                             <span className="text-green-400 font-bold flex items-center gap-1"><Megaphone size={12}/> 추천 메뉴 (Visit Pass)</span>
                         )}
                    </span>
                    
                    {filter === 'AVAILABLE' ? (
                        <CouponTimer expiresAt={coupon.expiresAt} />
                    ) : (
                        <span className="text-[10px] text-gray-500 mt-2 font-medium flex items-center gap-1">
                            <Check size={10} /> 체크인: {coupon.usedAt?.toLocaleDateString()}
                        </span>
                    )}
                </div>

                {/* Badge for Used */}
                {filter === 'USED' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 border-2 border-gray-600 text-gray-600 font-black text-[10px] px-2 py-1 rounded rotate-[-15deg] uppercase">
                        Visited
                    </div>
                )}
                </div>
            </div>
          ))
        )}
      </div>

      {/* --- Detail Modal (VIP Check-in Screen) --- */}
      {selectedCoupon && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
            {/* Modal Content */}
            <div className={`w-full h-[95%] sm:h-auto max-w-sm bg-neutral-900 border-t sm:border border-neutral-700 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col animate-slide-up transition-all duration-300`}>
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCoupon(null)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-50 bg-black/20 rounded-full backdrop-blur-sm"
              >
                <X size={24} />
              </button>
              
              {!showStampMode ? (
                  // --- VIEW 1: LOCATION CHECK (Replaces QR) ---
                  <>
                      {/* Live Indicator Bar */}
                      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-40 flex justify-between items-start p-5 pl-6">
                         <div className="flex flex-col">
                             <span className="text-[10px] text-gray-400 font-medium mb-1">매장 방문 인증</span>
                             <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${isLocationVerified ? 'text-white' : 'text-gray-500'}`}>
                                    {isLocationVerified ? '도착 완료' : '이동 중...'}
                                </span>
                                {isLocationVerified ? (
                                     <div className="flex items-center gap-1 bg-green-500/20 px-1.5 py-0.5 rounded text-[10px] text-green-400 border border-green-500/30">
                                        <MapPin size={10} />
                                        <span>Verified</span>
                                     </div>
                                ) : (
                                     <div className="flex items-center gap-1 bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-gray-500">
                                        <Radar size={10} className="animate-spin" />
                                        <span>Tracking</span>
                                     </div>
                                )}
                             </div>
                         </div>
                         <LiveClock />
                      </div>

                      <div className="flex-1 p-8 pt-20 flex flex-col items-center text-center overflow-y-auto relative">
                         {/* Animated Hologram Background */}
                         <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(0,0,0,0)40%,rgba(255,255,255,0.05)50%,rgba(0,0,0,0)60%)] bg-[length:200%_100%] animate-hologram pointer-events-none"></div>

                         {/* Store Name Badge */}
                         <div className="mb-4 text-yellow-500 text-[10px] font-black tracking-[0.2em] uppercase relative z-10">
                            Location Check
                         </div>
                         
                         <h2 className="text-xl font-black text-white leading-tight mb-2 break-keep relative z-10">
                            {selectedCoupon.restaurantName}
                         </h2>
                         <p className="text-gray-400 text-sm mb-6 relative z-10">{selectedCoupon.title}</p>

                         {/* --- LOCATION STATUS VISUAL (Replaces QR) --- */}
                         <div className="w-64 h-64 bg-neutral-800/30 rounded-full mb-6 flex flex-col items-center justify-center relative border border-neutral-700/50 overflow-hidden z-10">
                            
                            {/* Background Radar Effect */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                <div className={`w-96 h-96 border border-white/20 rounded-full absolute ${isLocationVerified ? 'scale-150 opacity-0' : 'animate-ping-slow'}`}></div>
                                <div className={`w-64 h-64 border border-white/20 rounded-full absolute ${isLocationVerified ? 'scale-125 opacity-0' : 'animate-ping-slow delay-75'}`}></div>
                                {/* Rotating Radar Line */}
                                {!isLocationVerified && (
                                    <div className="w-full h-full absolute animate-radar-spin bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(255,255,255,0.1)_360deg)]"></div>
                                )}
                            </div>

                            {isLocationVerified ? (
                                // VERIFIED STATE
                                <div className="z-10 flex flex-col items-center animate-bounce-subtle">
                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.6)] mb-4 relative">
                                         <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50"></div>
                                         <MapPin size={40} className="text-white fill-white" />
                                         <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                                            <Check size={14} className="text-green-600 font-bold" strokeWidth={4} />
                                         </div>
                                    </div>
                                    <p className="text-green-400 font-bold text-lg">위치 인증 완료</p>
                                    <p className="text-gray-400 text-xs mt-1">매장 도착이 확인되었습니다.</p>
                                </div>
                            ) : (
                                // LOCKED STATE
                                <div className="z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-neutral-700 rounded-full flex items-center justify-center mb-4 relative">
                                        <Navigation size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-300 font-bold text-base">매장으로 이동해주세요</p>
                                     <div className="mt-2 text-xs font-mono text-gray-500 bg-black/50 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                        <MapPin size={10} />
                                        <span>남은 거리: {distance ? Math.round(distance) : '?'}m</span>
                                    </div>
                                    {/* Test Button */}
                                    <button onClick={useMockLocation} className="mt-6 text-[9px] text-gray-600 underline hover:text-gray-400 transition-colors">
                                        (테스트용) 강제 위치 이동
                                    </button>
                                </div>
                            )}
                        </div>

                         <div className="text-2xl font-black text-white relative z-10">
                            {selectedCoupon.discountAmount > 0 ? (
                                `${new Intl.NumberFormat('ko-KR').format(selectedCoupon.discountAmount)}원 우대 혜택`
                            ) : (
                                "방문 인증 패스 (Visit Pass)"
                            )}
                         </div>
                      </div>

                      {/* Bottom Action Area */}
                      <div className="p-6 bg-neutral-900 border-t border-neutral-800 safe-area-bottom relative z-20">
                         <button 
                           disabled={!isLocationVerified}
                           onClick={() => setShowStampMode(true)}
                           className={`w-full font-bold py-4 rounded-xl text-base shadow-xl transition-all flex items-center justify-center gap-2 
                             ${isLocationVerified 
                                ? 'bg-white text-black active:scale-[0.98] hover:bg-gray-100 cursor-pointer' 
                                : 'bg-neutral-800 text-gray-500 cursor-not-allowed opacity-50'}`}
                         >
                           {isLocationVerified ? (
                               <>
                                 <Stamp size={18} />
                                 직원 확인 (도장 찍기)
                               </>
                           ) : (
                               <>
                                 <AlertTriangle size={18} />
                                 매장 도착 시 활성화됩니다
                               </>
                           )}
                         </button>
                      </div>
                  </>
              ) : (
                  // --- VIEW 2: DIGITAL STAMP INTERACTION ---
                  <div className="flex-1 flex flex-col items-center bg-neutral-900 h-full animate-fade-in relative overflow-hidden cursor-pointer" onClick={handleStamp}>
                      
                      {/* Content Container */}
                      <div className={`flex-1 flex flex-col items-center justify-center w-full z-20 transition-all duration-200 ${isStamped ? 'scale-95 opacity-50 blur-sm' : ''}`}>
                           <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center mb-6 text-neutral-500 animate-pulse">
                               <Fingerprint size={40} />
                           </div>
                           <h3 className="text-white font-bold text-xl mb-2">직원 확인</h3>
                           <p className="text-gray-400 text-sm text-center mb-10">
                               직원분이 화면 중앙을<br/>
                               <span className="text-yellow-500 font-bold">터치(도장)</span> 해주세요
                           </p>

                           {/* Visual Touch Target */}
                           <div className="w-48 h-48 rounded-full border border-neutral-700 bg-neutral-800/30 flex items-center justify-center relative">
                               <div className="absolute inset-0 rounded-full border border-white/10 animate-ping"></div>
                               <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center shadow-inner">
                                   <span className="text-xs font-bold text-gray-600">TOUCH HERE</span>
                               </div>
                           </div>
                      </div>

                      {/* --- STAMP ANIMATION LAYER --- */}
                      {isStamped && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                              {/* 1. Impact Effect (Shake) */}
                              <div className="absolute inset-0 animate-shake-hard"></div>
                              
                              {/* 2. The Stamp Mark */}
                              <div className="relative animate-stamp-in">
                                  <div className="w-64 h-64 border-[8px] border-red-500 rounded-full flex items-center justify-center transform rotate-[-15deg] opacity-90 mix-blend-screen bg-red-500/10 backdrop-blur-sm">
                                      <div className="w-[90%] h-[90%] border-[2px] border-red-500 rounded-full flex flex-col items-center justify-center p-4">
                                          <span className="text-red-500 font-black text-5xl tracking-tighter mb-2">USED</span>
                                          <div className="w-full h-0.5 bg-red-500 mb-2"></div>
                                          <span className="text-red-400 font-bold text-sm tracking-widest">{new Date().toLocaleDateString()}</span>
                                          <span className="text-red-400 font-bold text-xs">{selectedCoupon.restaurantName}</span>
                                      </div>
                                  </div>
                              </div>

                              {/* 3. Confetti Particles */}
                              {Array.from({ length: 20 }).map((_, i) => (
                                  <div 
                                    key={i}
                                    className="absolute w-2 h-2 bg-red-500 rounded-full animate-particle"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        '--tx': `${(Math.random() - 0.5) * 300}px`,
                                        '--ty': `${(Math.random() - 0.5) * 300}px`,
                                        animationDelay: '0.1s'
                                    } as React.CSSProperties}
                                  ></div>
                              ))}
                          </div>
                      )}

                      {/* Cancel Button */}
                      {!isStamped && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowStampMode(false); }}
                            className="absolute bottom-8 text-gray-500 text-sm font-medium underline z-30"
                          >
                              취소하기
                          </button>
                      )}
                  </div>
              )}

            </div>
         </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 24px); }
        
        @keyframes hologram {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .animate-hologram { animation: hologram 3s linear infinite; }

        @keyframes stampIn {
            0% { transform: scale(3) rotate(0deg); opacity: 0; }
            50% { transform: scale(0.8) rotate(-15deg); opacity: 1; }
            70% { transform: scale(1.1) rotate(-15deg); }
            100% { transform: scale(1) rotate(-15deg); opacity: 1; }
        }
        .animate-stamp-in { animation: stampIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        @keyframes shakeHard {
            0%, 100% { transform: translate(0, 0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 5px); }
            20%, 40%, 60%, 80% { transform: translate(5px, -5px); }
        }
        .animate-shake-hard { animation: shakeHard 0.3s ease-in-out; }

        @keyframes particle {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .animate-particle { animation: particle 0.8s ease-out forwards; }

        .animate-ping-slow { animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pingSlow {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-radar-spin { animation: radarSpin 4s linear infinite; }
        @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-bounce-subtle { animation: bounceSubtle 2s infinite; }
        @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};