import React, { useState } from 'react';
import { Sparkles, Check, X, Key } from 'lucide-react';

interface GoldenTicketScreenProps {
  inviterName: string;
  restaurantName: string;
  benefitAmount: number;
  onAccept: () => void;
  onClose: () => void;
}

export const GoldenTicketScreen: React.FC<GoldenTicketScreenProps> = ({ 
  inviterName, 
  restaurantName, 
  benefitAmount, 
  onAccept, 
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (isOpening || isOpen) return;
    setIsOpening(true);
    setTimeout(() => {
        setIsOpen(true);
        setIsOpening(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-fade-in">
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white/50 hover:text-white z-50"
      >
        <X size={24} />
      </button>

      {/* --- PHASE 1: THE ENVELOPE --- */}
      {!isOpen && (
        <div 
            onClick={handleOpen}
            className={`relative w-full max-w-xs aspect-[4/3] cursor-pointer transition-transform duration-500 ${isOpening ? 'scale-110 opacity-0 translate-y-20' : 'scale-100 hover:scale-105'}`}
        >
            {/* Envelope Body */}
            <div className="absolute inset-0 bg-neutral-800 rounded-lg shadow-2xl border border-neutral-700 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700"></div>
                
                {/* Text on Envelope */}
                <div className="relative z-10 text-center">
                    <p className="text-yellow-500/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">Invitation</p>
                    <p className="text-white font-serif italic text-lg opacity-80">To. You</p>
                </div>

                {/* Wax Seal */}
                <div className="absolute z-20 w-16 h-16 bg-red-800 rounded-full shadow-lg border-4 border-red-900 flex items-center justify-center group">
                    <div className="w-12 h-12 rounded-full border border-red-900/50 flex items-center justify-center">
                        <Key size={20} className="text-red-950/70" />
                    </div>
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 rounded-full animate-ping bg-red-600/20"></div>
                </div>
            </div>
            
            <p className="absolute -bottom-12 w-full text-center text-gray-400 text-sm animate-pulse">
                터치하여 초대장 열기
            </p>
        </div>
      )}

      {/* --- PHASE 2: THE GOLDEN TICKET --- */}
      {isOpen && (
        <div className="relative w-full max-w-sm bg-gradient-to-b from-yellow-100 to-white rounded-3xl p-1 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-ticket-reveal overflow-hidden">
            {/* Inner Border */}
            <div className="w-full h-full border-[1px] border-yellow-500/30 rounded-[22px] p-6 flex flex-col items-center text-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                
                {/* Header */}
                <div className="flex items-center gap-1 text-yellow-700 mb-6">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Special Invitation</span>
                    <Sparkles size={14} />
                </div>

                {/* Main Content */}
                <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                    {restaurantName}
                </h2>
                <div className="w-10 h-0.5 bg-yellow-400 mb-6"></div>

                <p className="text-slate-500 text-sm font-medium mb-1">
                    <span className="text-slate-900 font-bold underline">{inviterName}</span>님이 보낸
                </p>
                <p className="text-slate-900 text-xl font-bold mb-8">
                    프리패스 골든키가 도착했습니다.
                </p>

                {/* Benefit Box */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
                    <p className="text-slate-400 text-xs font-bold mb-1">혜택 금액</p>
                    <p className="text-3xl font-black text-yellow-600">
                        {new Intl.NumberFormat('ko-KR').format(benefitAmount)}원
                    </p>
                </div>

                {/* Action Button */}
                <button 
                    onClick={onAccept}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Check size={18} />
                    초대장 수락하고 혜택 받기
                </button>
                
                <p className="text-[10px] text-slate-400 mt-4">
                    * 이 티켓은 1회성으로, 수락 시 즉시 발급됩니다.
                </p>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-100%] animate-shine pointer-events-none"></div>
        </div>
      )}

      <style>{`
        .animate-ticket-reveal { animation: ticketReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes ticketReveal {
            0% { transform: scale(0.8) translateY(50px) rotateX(20deg); opacity: 0; }
            100% { transform: scale(1) translateY(0) rotateX(0); opacity: 1; }
        }
        .animate-shine { animation: shine 3s infinite delay 1s; }
        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            20% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
