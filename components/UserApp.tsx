import React, { useState, useEffect } from 'react';
import { DealScreen } from './DealScreen';
import { Navigation } from './Navigation';
import { CouponsScreen } from './CouponsScreen';
import { ProfileScreen } from './ProfileScreen';
import { GoldenTicketScreen } from './GoldenTicketScreen';
import { LoginScreen } from './LoginScreen';
import { fetchFlashDeals } from '@shared/services/dealService';
import { getUserCoupons, claimCoupon, useCoupon } from '@shared/services/apiService';
import { Deal, AppTab, Coupon } from '@shared/types';
import { Compass, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserAppProps {
  onBackToHome: () => void;
}

export const UserApp: React.FC<UserAppProps> = ({ onBackToHome }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.SEARCH);
  const [isLoading, setIsLoading] = useState(true);
  const [recentBuyer, setRecentBuyer] = useState<string | null>(null);

  // Firebase Auth
  const { user, login, logout, isLoading: authLoading } = useAuth();

  // UI State
  const [showLogin, setShowLogin] = useState(false);

  // My Coupons State
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);

  // Invitation Preview State
  const [invitationPreview, setInvitationPreview] = useState<Coupon | null>(null);

  // Load coupons from Firebase when user logs in
  useEffect(() => {
    const loadCouponsFromFirebase = async () => {
      if (user) {
        console.log('🌐 Firebase 쿠폰 데이터 로딩 시작:', user.uid);
        try {
          const result = await getUserCoupons(user.uid);
          if (result.success && result.data?.coupons) {
            // Convert Firestore timestamps to Date objects with better error handling
            const validCoupons = result.data.coupons.map((coupon: any) => {
              let claimedAt, usedAt, expiresAt;

              // Handle claimedAt
              if (coupon.claimedAt?.toDate) {
                claimedAt = coupon.claimedAt.toDate();
              } else if (coupon.claimedAt) {
                claimedAt = new Date(coupon.claimedAt);
              } else {
                claimedAt = new Date();
              }

              // Handle usedAt
              if (coupon.usedAt?.toDate) {
                usedAt = coupon.usedAt.toDate();
              } else if (coupon.usedAt) {
                usedAt = new Date(coupon.usedAt);
              } else {
                usedAt = undefined;
              }

              // Handle expiresAt - most important for the countdown
              if (coupon.expiresAt?.toDate) {
                expiresAt = coupon.expiresAt.toDate();
              } else if (coupon.expiresAt) {
                expiresAt = new Date(coupon.expiresAt);
              } else {
                // If no expiry date, set to 7 days from now
                expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              }

              return {
                ...coupon,
                claimedAt,
                usedAt,
                expiresAt
              };
            });
            setMyCoupons(validCoupons);
            console.log('✅ Firebase 쿠폰 데이터 로드 완료:', validCoupons.length, '개');
          } else {
            console.log('📭 Firebase 쿠폰 데이터 없음');
            setMyCoupons([]);
          }
        } catch (error) {
          console.error('❌ Firebase 쿠폰 데이터 로드 실패:', error);
          setMyCoupons([]);
        }
      } else {
        setMyCoupons([]);
      }
    };

    loadCouponsFromFirebase();
  }, [user]);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        console.log('🔄 서포터 앱: 최신 딜 데이터 로드 중...');
        const data = await fetchFlashDeals();
        setDeals(data);
        console.log('✅ 서포터 앱: 딜 데이터 로드 완료, 딜 수:', data.length);
      } catch (error) {
        console.error("Failed to fetch deals", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();

    // 30초마다 자동으로 데이터 새로고침 (실시간 동기화)
    const interval = setInterval(() => {
      console.log('🔄 30초 경과: 서포터 앱 데이터 자동 새로고침');
      loadDeals();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Social Proof Ticker
  useEffect(() => {
    const names = ['김*민', '이*서', '박*준', '최*우', '정*윤'];
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomName = names[Math.floor(Math.random() * names.length)];
        setRecentBuyer(randomName);
        setTimeout(() => setRecentBuyer(null), 3000); 
      }
    }, 8000); 
    return () => clearInterval(interval);
  }, []);

  // Handler: Login Success
  const handleLogin = async (provider: 'google' | 'kakao') => {
    try {
      await login(provider);
      setShowLogin(false); // Close modal
    } catch (error) {
      console.error(`Login failed with ${provider}:`, error);
      // You might want to show an error message to the user here
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    try {
      await logout();
      // Coupons will be cleared automatically by the useEffect that depends on user
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Refresh coupons from Firebase
  const refreshCoupons = async () => {
    if (!user) return;

    console.log('🔄 Firebase 쿠폰 데이터 새로고침 중...');
    try {
      const result = await getUserCoupons(user.uid);
      if (result.success && result.data?.coupons) {
        // Use the same robust date conversion logic
        const validCoupons = result.data.coupons.map((coupon: any) => {
          let claimedAt, usedAt, expiresAt;

          // Handle claimedAt
          if (coupon.claimedAt?.toDate) {
            claimedAt = coupon.claimedAt.toDate();
          } else if (coupon.claimedAt) {
            claimedAt = new Date(coupon.claimedAt);
          } else {
            claimedAt = new Date();
          }

          // Handle usedAt
          if (coupon.usedAt?.toDate) {
            usedAt = coupon.usedAt.toDate();
          } else if (coupon.usedAt) {
            usedAt = new Date(coupon.usedAt);
          } else {
            usedAt = undefined;
          }

          // Handle expiresAt - most important for the countdown
          if (coupon.expiresAt?.toDate) {
            expiresAt = coupon.expiresAt.toDate();
          } else if (coupon.expiresAt) {
            expiresAt = new Date(coupon.expiresAt);
          } else {
            // If no expiry date, set to 7 days from now
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }

          return {
            ...coupon,
            claimedAt,
            usedAt,
            expiresAt
          };
        });
        setMyCoupons(validCoupons);
        console.log('✅ 쿠폰 데이터 새로고침 완료:', validCoupons.length, '개');
      } else {
        setMyCoupons([]);
      }
    } catch (error) {
      console.error('❌ 쿠폰 새로고침 실패:', error);
    }
  };

  // Handler: Manual refresh deals
  const handleRefreshDeals = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 수동 새로고침: 서포터 앱 딜 데이터 갱신');
      const data = await fetchFlashDeals();
      setDeals(data);
      console.log('✅ 수동 새로고침 완료: 최신 딜 수:', data.length);
    } catch (error) {
      console.error("Failed to refresh deals", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: When user tears a coupon
  const handleClaimCoupon = async (deal: Deal) => {
    console.log('🎫 Firebase 쿠폰 발급 시작:', deal.title);

    if (!user) {
        console.log('❌ 로그인이 필요합니다.');
        // If guest tries to claim, ask for login
        setShowLogin(true);
        return;
    }

    console.log('✅ 사용자 확인:', user.uid);
    console.log('📋 현재 보유 쿠폰 수:', myCoupons.length);

    // Check if already claimed
    if (myCoupons.some(c => c.dealId === deal.id && c.status === 'AVAILABLE')) {
        console.log('⚠️ 이미 발급된 쿠폰입니다.');
        setCurrentTab(AppTab.COUPONS);
        return;
    }

    try {
        console.log('🌐 Firebase 쿠폰 발급 요청 중...');
        console.log('📋 원본 딜 expiresAt:', deal.expiresAt, typeof deal.expiresAt);
        const dealData = {
            title: deal.title,
            restaurantName: deal.restaurant.name,
            discountAmount: deal.discountAmount,
            imageUrl: deal.imageUrl,
            expiresAt: deal.expiresAt,
            location: deal.restaurant.location,
            usageCondition: deal.usageCondition
        };
        console.log('📤 전송할 dealData.expiresAt:', dealData.expiresAt, typeof dealData.expiresAt);

        const result = await claimCoupon(user.uid, deal.id, dealData);

        if (result.success && result.data?.coupon) {
            console.log('📥 수신한 쿠폰 데이터:', result.data.coupon);
            console.log('📥 수신한 expiresAt:', result.data.coupon.expiresAt, typeof result.data.coupon.expiresAt);
            console.log('📥 수신한 claimedAt:', result.data.coupon.claimedAt, typeof result.data.coupon.claimedAt);

            // Convert Firestore timestamp to Date
            const newCoupon: Coupon = {
                ...result.data.coupon,
                claimedAt: result.data.coupon.claimedAt?.toDate ? result.data.coupon.claimedAt.toDate() : new Date(result.data.coupon.claimedAt),
                expiresAt: result.data.coupon.expiresAt?.toDate ? result.data.coupon.expiresAt.toDate() : new Date(result.data.coupon.expiresAt),
                usedAt: result.data.coupon.usedAt?.toDate ? result.data.coupon.usedAt.toDate() : (result.data.coupon.usedAt ? new Date(result.data.coupon.usedAt) : undefined)
            };

            console.log('✅ 변환된 쿠폰 expiresAt:', newCoupon.expiresAt, typeof newCoupon.expiresAt);

            console.log('✅ Firebase 쿠폰 발급 성공:', newCoupon.id);
            setMyCoupons(prev => [newCoupon, ...prev]);

            // Refresh deals to update remaining coupons count
            await handleRefreshDeals();

            setCurrentTab(AppTab.COUPONS);
            console.log('🔄 마이티켓 탭으로 이동');
        } else {
            console.error('❌ Firebase 쿠폰 발급 실패:', result.error);
            alert(`쿠폰 발급 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('❌ Firebase 쿠폰 발급 중 오류 발생:', error);
        alert('쿠폰 발급 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // Handler: When staff confirms usage
  const handleUseCoupon = async (couponId: string) => {
    if (!user) {
        console.error('❌ 사용자 정보 없음');
        return;
    }

    try {
        console.log('🌐 Firebase 쿠폰 사용 요청 중...', couponId);
        const result = await useCoupon(user.uid, couponId);

        if (result.success) {
            console.log('✅ Firebase 쿠폰 사용 성공:', couponId);
            setMyCoupons(prev => prev.map(c => {
                if (c.id === couponId) {
                    return { ...c, status: 'USED', usedAt: new Date(), hasGoldenKey: true };
                }
                return c;
            }));
        } else {
            console.error('❌ Firebase 쿠폰 사용 실패:', result.error);
            alert(`쿠폰 사용 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('❌ Firebase 쿠폰 사용 중 오류 발생:', error);
        alert('쿠폰 사용 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handlePreviewInvitation = (coupon: Coupon) => {
    setInvitationPreview(coupon);
  };

  const handleClosePreview = () => {
    setInvitationPreview(null);
  };

  return (
    <div className="bg-neutral-900 min-h-screen w-full flex justify-center items-center">
      {/* Mobile container */}
      <div className="w-full max-w-md h-[100dvh] bg-black relative shadow-2xl overflow-hidden md:rounded-3xl border-gray-800 md:border-4 flex flex-col">
        
        {/* --- LOGIN MODAL (Overlay) --- */}
        {showLogin && (
            <div className="absolute inset-0 z-[100] animate-fade-in">
                <LoginScreen 
                    onLogin={handleLogin} 
                    onBack={() => setShowLogin(false)}
                />
            </div>
        )}

        {/* --- MAIN APP CONTENT --- */}
        {/* Persistent Top Notification Layer */}
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 pointer-events-none z-50 flex justify-between items-start">
            {recentBuyer && currentTab === AppTab.SEARCH && !showLogin ? (
            <div className="animate-fade-in-down pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-md text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center border border-white/10 shadow-lg">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                <span><b>{recentBuyer}</b>님이 서포터즈로 참여했습니다!</span>
                </div>
            </div>
            ) : <div></div>}
        </div>

        {/* Main Content Router */}
        {isLoading || authLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">히든 스팟 탐색 중...</p>
            </div>
        ) : (
            <div className="w-full h-full relative"> {/* Removed pb-20 to allow full screen background */}
                
                {/* Tab: SEARCH (Feed) */}
                {currentTab === AppTab.SEARCH && (
                    <div className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-contain touch-pan-y">
                    {deals.length > 0 ? (
                        deals.map((deal) => (
                        <div key={deal.id} className="w-full h-full snap-center snap-always shrink-0 relative">
                            <DealScreen
                            deal={deal}
                            onClaimCoupon={handleClaimCoupon}
                            onNavigateToCoupons={() => setCurrentTab(AppTab.COUPONS)}
                            myCoupons={myCoupons}
                            />
                        </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                            <div className="w-16 h-16 mb-6 rounded-full bg-neutral-800 flex items-center justify-center">
                                <Compass className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">히든 스팟을 찾는 중...</h2>
                            <p className="text-gray-400 text-center text-sm mb-6">
                                백엔드 API에 딜이 아직 등록되지 않았습니다.<br/>
                                Firebase Cloud Functions를 배포하고 샘플 딜을 만들어 보세요.
                            </p>
                            <div className="bg-neutral-800 rounded-lg p-4 max-w-sm w-full">
                                <p className="text-xs text-gray-500 mb-2">체크리스트:</p>
                                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Firebase 콘솔에서 deals 컬렉션 확인</li>
                                    <li>백엔드 API로 딜 생성 호출</li>
                                    <li>샘플 데이터로 피드 테스트</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Tab: COUPONS */}
                {currentTab === AppTab.COUPONS && (
                    <CouponsScreen 
                    coupons={myCoupons} 
                    onUseCoupon={handleUseCoupon}
                    onPreviewInvitation={handlePreviewInvitation} 
                    />
                )}

                {/* Tab: PROFILE */}
                {currentTab === AppTab.PROFILE && (
                <ProfileScreen
                    coupons={myCoupons}
                    deals={deals}
                    onLogout={handleLogout}
                    isLoggedIn={!!user}
                    onLoginClick={() => setShowLogin(true)}
                    userImage={user?.photoURL}
                    onImageUpdate={() => {}} // Firebase profile image handled differently
                />
                )}
            </div>
        )}

        {/* Floating Navigation */}
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* --- RECIPIENT VIEW SIMULATION (OVERLAY) --- */}
        {invitationPreview && (
            <GoldenTicketScreen 
                inviterName="로컬탐험가"
                restaurantName={invitationPreview.restaurantName}
                benefitAmount={invitationPreview.discountAmount}
                onAccept={() => {
                    alert("티켓이 발급되었습니다! (시연용)");
                    setInvitationPreview(null);
                }}
                onClose={handleClosePreview}
            />
        )}

        {/* Global Styles for Animations */}
        <style>{`
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
          .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </div>
  );
};
