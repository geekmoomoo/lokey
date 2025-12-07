import React, { useState, useEffect } from 'react';
import { DealScreen } from './DealScreen';
import { Navigation } from './Navigation';
import { CouponsScreen } from './CouponsScreen';
import { ProfileScreen } from './ProfileScreen';
import { GoldenTicketScreen } from './GoldenTicketScreen';
import { LoginScreen } from './LoginScreen';
import { fetchFlashDeals } from '../services/dealService';
import { Deal, AppTab, Coupon } from '../types';

interface UserAppProps {
  onBackToHome: () => void;
}

export const UserApp: React.FC<UserAppProps> = ({ onBackToHome }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.SEARCH);
  const [isLoading, setIsLoading] = useState(true);
  const [recentBuyer, setRecentBuyer] = useState<string | null>(null);
  
  // Auth State (Default is false now - Guest Access allowed)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  // User Profile State
  const [userImage, setUserImage] = useState<string | null>(null);
  
  // My Coupons State
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);

  // Invitation Preview State
  const [invitationPreview, setInvitationPreview] = useState<Coupon | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const data = await fetchFlashDeals();
        setDeals(data);
      } catch (error) {
        console.error("Failed to fetch deals", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeals();
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
  const handleLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    setIsLoggedIn(true);
    setShowLogin(false); // Close modal
  };

  // Handler: Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    onBackToHome(); // Go back to selection screen on logout for demo purposes
  };

  // Handler: When user tears a coupon
  const handleClaimCoupon = (deal: Deal) => {
    if (!isLoggedIn) {
        // If guest tries to claim, ask for login
        setShowLogin(true);
        return;
    }

    // Check if already claimed
    if (myCoupons.some(c => c.dealId === deal.id && c.status === 'AVAILABLE')) {
        setCurrentTab(AppTab.COUPONS);
        return;
    }

    const newCoupon: Coupon = {
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dealId: deal.id,
        title: deal.title,
        restaurantName: deal.restaurant.name,
        discountAmount: deal.discountAmount,
        imageUrl: deal.imageUrl,
        status: 'AVAILABLE',
        claimedAt: new Date(),
        expiresAt: deal.expiresAt,
        location: deal.restaurant.location,
        usageCondition: deal.usageCondition // Persist the condition!
    };

    setMyCoupons(prev => [newCoupon, ...prev]);
    setCurrentTab(AppTab.COUPONS);
  };

  // Handler: When staff confirms usage
  const handleUseCoupon = (couponId: string) => {
    setMyCoupons(prev => prev.map(c => {
        if (c.id === couponId) {
            return { ...c, status: 'USED', usedAt: new Date(), hasGoldenKey: true };
        }
        return c;
    }));
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
        {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">히든 스팟 탐색 중...</p>
            </div>
        ) : (
            <div className="w-full h-full relative"> {/* Removed pb-20 to allow full screen background */}
                
                {/* Tab: SEARCH (Feed) */}
                {currentTab === AppTab.SEARCH && (
                    <div className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-contain touch-pan-y">
                    {deals.map((deal) => (
                    <div key={deal.id} className="w-full h-full snap-center snap-always shrink-0 relative">
                        <DealScreen 
                        deal={deal} 
                        onUseCoupon={() => handleClaimCoupon(deal)}
                        />
                    </div>
                    ))}
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
                    isLoggedIn={isLoggedIn}
                    onLoginClick={() => setShowLogin(true)}
                    userImage={userImage}
                    onImageUpdate={setUserImage}
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