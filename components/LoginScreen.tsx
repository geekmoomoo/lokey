import React, { useState } from 'react';
import { Key, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (provider: 'kakao' | 'google') => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLoginClick = (provider: 'kakao' | 'google') => {
    setLoadingProvider(provider);
    // Simulate network delay for realistic feel
    setTimeout(() => {
      onLogin(provider);
    }, 1200);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Back Button */}
      {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 z-50 p-2 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-sm transition-colors active:scale-95"
          >
              <ArrowLeft size={24} />
          </button>
      )}

      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/30 via-black to-black animate-pulse-slow pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs animate-fade-in-up">
        {/* Logo Area */}
        <div className="w-24 h-24 bg-neutral-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-neutral-800 transform rotate-45">
           <Key size={48} className="text-yellow-500 transform -rotate-45 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">LO.KEY</h1>
        <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-16 text-center border-b border-gray-800 pb-4 w-full">
          Private Local Supporters
        </p>

        {/* Buttons */}
        <div className="w-full space-y-3">
          {/* Kakao Button */}
          <button 
            onClick={() => handleLoginClick('kakao')}
            disabled={loadingProvider !== null}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold h-12 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 relative overflow-hidden"
          >
             {loadingProvider === 'kakao' ? (
                 <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
             ) : (
                 <>
                    {/* Kakao Icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C5.9 3 1 6.9 1 11.8C1 14.8 3 17.5 6 19.1L4.6 24.1L9.6 20.8C10.4 20.9 11.2 21 12 21C18.1 21 23 17.1 23 12.2C23 7.3 18.1 3 12 3Z"/>
                    </svg>
                    <span>카카오로 3초 만에 시작하기</span>
                 </>
             )}
          </button>

          {/* Google Button */}
          <button 
            onClick={() => handleLoginClick('google')}
            disabled={loadingProvider !== null}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold h-12 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-gray-200 disabled:opacity-70 disabled:scale-100"
          >
            {loadingProvider === 'google' ? (
                 <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
             ) : (
                <>
                    {/* Google Icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google 계정으로 계속하기</span>
                </>
             )}
          </button>
        </div>

        <p className="mt-10 text-[10px] text-gray-600 text-center leading-relaxed">
          로그인 시 
          <span className="underline cursor-pointer mx-1 text-gray-500 hover:text-gray-300">이용약관</span> 
          및 
          <span className="underline cursor-pointer mx-1 text-gray-500 hover:text-gray-300">개인정보처리방침</span>
          에 동의하게 됩니다.
        </p>
      </div>

      <style>{`
        .animate-pulse-slow { animation: pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulseSlow {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.4; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};