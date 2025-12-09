import React, { useState } from 'react';
import { UserApp } from './components/UserApp';
import { MerchantApp } from './components/MerchantApp';
import { AuthProvider } from './contexts/AuthContext';
import { PartnerAuthContextProvider } from './contexts/PartnerAuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Key, Store, User } from 'lucide-react';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'SELECTION' | 'USER' | 'MERCHANT'>('SELECTION');

  if (appMode === 'USER') {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <UserApp onBackToHome={() => setAppMode('SELECTION')} />
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  if (appMode === 'MERCHANT') {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <PartnerAuthContextProvider>
            <MerchantApp onBackToHome={() => setAppMode('SELECTION')} />
          </PartnerAuthContextProvider>
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  // --- LANDING SELECTION SCREEN ---
  return (
    <div className="bg-black min-h-screen w-full flex justify-center items-center p-4">
      <div className="w-full max-w-md flex flex-col items-center justify-center animate-fade-in">
         {/* Logo Area */}
         <div className="mb-12 flex flex-col items-center">
             <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-neutral-800 transform rotate-45">
                <Key size={40} className="text-yellow-500 transform -rotate-45" />
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter mb-2">LO.KEY</h1>
             <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase">Private Local Supporters</p>
         </div>

         {/* Selection Cards */}
         <div className="w-full space-y-4">
             {/* User Button */}
             <button 
                onClick={() => setAppMode('USER')}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between group transition-all active:scale-[0.98]"
             >
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                         <User size={24} className="text-yellow-500" />
                     </div>
                     <div className="text-left">
                         <h3 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">서포터즈 입장</h3>
                         <p className="text-gray-500 text-xs">히든 스팟을 찾고 혜택을 받으세요</p>
                     </div>
                 </div>
                 <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center">
                     <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9L5 5L1 1" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                 </div>
             </button>

             {/* Merchant Button */}
             <button 
                onClick={() => setAppMode('MERCHANT')}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between group transition-all active:scale-[0.98]"
             >
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                         <Store size={24} className="text-purple-500" />
                     </div>
                     <div className="text-left">
                         <h3 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors">파트너(사장님) 입장</h3>
                         <p className="text-gray-500 text-xs">우리 매장을 알리고 단골을 만드세요</p>
                     </div>
                 </div>
                 <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center">
                     <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9L5 5L1 1" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                 </div>
             </button>
         </div>

         <p className="mt-12 text-[10px] text-gray-700 font-medium">
             © 2024 LO.KEY Corp. All rights reserved.
         </p>
      </div>
      <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;