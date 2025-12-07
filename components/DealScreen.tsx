
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, CheckCircle, Share2, Heart, ChevronRight, MapPin, Sparkles, AlertCircle, ShoppingBag, MessageCircle, Send, X } from 'lucide-react';
import { Deal } from '@shared/types';

interface DealScreenProps {
  deal: Deal;
  onUseCoupon?: () => void;
}

// --- DANMAKU (Bullet Chat) TYPE & DATA ---
interface DanmakuItem {
  id: number;
  text: string;
  top: number; // percentage position (0-100)
  duration: number; // animation speed
  size: number; // font size
  opacity: number;
  isUser: boolean; // true if written by current user
}

export const DealScreen: React.FC<DealScreenProps> = ({ deal, onUseCoupon }) => {
  const [remaining, setRemaining] = useState(deal.remainingCoupons);
  const [isTorn, setIsTorn] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  
  // Image State
  const [isImageStable, setIsImageStable] = useState(false); // To optimize image sharpness
  
  // Favorite Button State
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHeartPopping, setIsHeartPopping] = useState(false);
  
  // Drag Physics State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- DANMAKU STATE ---
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [userComment, setUserComment] = useState("");
  const [userSubmittedComments, setUserSubmittedComments] = useState<string[]>([]); 
  const danmakuIdRef = useRef(0);
  const danmakuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdMode = deal.discountAmount === 0;

  const safeVibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

  // --- Image Sharpness Optimization ---
  useEffect(() => {
      // Remove transition/transform classes after animation finishes to prevent blurry rendering
      const timer = setTimeout(() => setIsImageStable(true), 1100);
      return () => clearTimeout(timer);
  }, []);

  // --- DANMAKU LOGIC (Top Zone) ---
  const addDanmaku = useCallback((text: string, isUser: boolean = false) => {
      const minTop = 8;
      const maxTop = 18;
      const top = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
      
      const newItem: DanmakuItem = {
          id: danmakuIdRef.current++,
          text,
          top,
          duration: Math.random() * 5 + (isUser ? 10 : 7), 
          size: isUser ? 16 : Math.floor(Math.random() * 2) + 13,
          opacity: isUser ? 1 : Math.random() * 0.3 + 0.6, 
          isUser
      };

      setDanmakuList(prev => [...prev, newItem]);
      setTimeout(() => {
          setDanmakuList(prev => prev.filter(item => item.id !== newItem.id));
      }, newItem.duration * 1000 + 100); 
  }, []);

  useEffect(() => {
      const scheduleNextComment = () => {
          const isBurst = Math.random() > 0.8;
          const delay = isBurst 
            ? Math.floor(Math.random() * 500) + 200  
            : Math.floor(Math.random() * 3000) + 1000;

          danmakuTimeoutRef.current = setTimeout(() => {
              const hasUserComments = userSubmittedComments.length > 0;
              const pickUserComment = hasUserComments && Math.random() > 0.6;
              let textToDisplay = "";
              let isUserStyle = false;

              if (pickUserComment) {
                   textToDisplay = userSubmittedComments[Math.floor(Math.random() * userSubmittedComments.length)];
                   isUserStyle = true; 
              } else {
                   const pool = deal.initialComments && deal.initialComments.length > 0 
                      ? deal.initialComments 
                      : ["대박이네", "가고싶다", "맛있겠다"];
                   textToDisplay = pool[Math.floor(Math.random() * pool.length)];
              }

              addDanmaku(textToDisplay, isUserStyle);
              scheduleNextComment(); 
          }, delay);
      };
      scheduleNextComment();
      return () => { if (danmakuTimeoutRef.current) clearTimeout(danmakuTimeoutRef.current); };
  }, [true, addDanmaku, deal.initialComments, userSubmittedComments]);

  const handleUserCommentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userComment.trim()) return;
      setUserSubmittedComments(prev => [...prev, userComment]);
      addDanmaku(userComment, true);
      setUserComment("");
      setShowCommentInput(false);
      safeVibrate(50);
  };

  // NOTE: 티켓 수량 자동 감소 시뮬레이션 로직 제거됨
  // 실제 사용자 구매 시에만 수량이 줄어들어야 함

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = deal.expiresAt.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("마감");
        return;
      }
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const minStr = minutes.toString().padStart(2, '0');
      setTimeLeft(`${hours}시간 ${minStr}분 후 마감`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [deal.expiresAt]);

  const formattedDiscount = new Intl.NumberFormat('ko-KR').format(deal.discountAmount);
  const formattedOriginalPrice = new Intl.NumberFormat('ko-KR').format(deal.originalPrice);

  const toggleFavorite = () => {
      setIsFavorite(prev => !prev);
      if (!isFavorite) {
          setIsHeartPopping(true);
          setTimeout(() => setIsHeartPopping(false), 500); 
      }
  };

  
  // --- Confetti (Rain from Top) ---
  const triggerConfetti = useCallback(() => {
    const colors = ['#fde047', '#facc15', '#ffffff', '#fbbf24'];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Fire from top of the APP CONTAINER
    for (let i = 0; i < 80; i++) {
        const piece = document.createElement('div');
        
        // Use container coordinates for accurate placement
        const startX = rect.left + Math.random() * rect.width;
        // Start exactly at the top of the container
        const startY = rect.top; 

        Object.assign(piece.style, {
            position: 'fixed', 
            zIndex: '9999', 
            pointerEvents: 'none',
            width: `${Math.random() * 10 + 5}px`, 
            height: `${Math.random() * 8 + 4}px`,
            left: `${startX}px`, 
            top: `${startY}px`,
            background: colors[Math.floor(Math.random() * colors.length)], 
            borderRadius: '2px',
            opacity: '0' // Start invisible
        });
        document.body.appendChild(piece);
        
        const dropHeight = window.innerHeight; // Fall to bottom of screen
        const drift = (Math.random() - 0.5) * 150; // Horizontal drift
        const rotation = (Math.random() - 0.5) * 720;
        const duration = Math.random() * 2000 + 1000; // 1s to 3s duration
        const delay = Math.random() * 500; // Staggered start

        piece.animate([
            { transform: `translate(0, 0) rotate(0deg)`, opacity: 0 },
            { transform: `translate(0, 20px) rotate(20deg)`, opacity: 1, offset: 0.1 }, // Fade in
            { transform: `translate(${drift}px, ${dropHeight}px) rotate(${rotation}deg)`, opacity: 0, offset: 1 }
        ], { 
            duration: duration, 
            delay: delay,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
            fill: 'forwards' 
        });
        
        setTimeout(() => piece.remove(), duration + delay + 100);
    }
  }, []);

  // --- Ticket Drag Logic ---
  const handleStart = (e: React.MouseEvent | React.TouchEvent, clientX: number) => {
    // CRITICAL: Stop propagation to prevent vertical scroll while dragging ticket
    e.stopPropagation(); 
    
    if (isTorn || remaining === 0 || false) return;
    setIsDragging(true);
    dragStartX.current = clientX;
    safeVibrate(10);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent, clientX: number) => {
    if (!isDragging) return;
    
    // Prevent default touch actions (scrolling) if we are dragging the ticket
    if(e.type === 'touchmove') {
       // e.preventDefault(); 
    }

    const delta = Math.max(0, clientX - dragStartX.current);
    // Add resistance effect (rubber banding)
    const resistance = delta > 200 ? 0.2 : 1; 
    setDragX(prev => prev + (delta - prev) * resistance); // Smooth lerpish feel
    setDragX(delta);
    
    // Haptic feedback at intervals
    if (delta > 0 && Math.floor(delta) % 50 === 0) safeVibrate(5);
  };

  const handleEnd = () => {
    if (!isDragging || isTorn) return;
    setIsDragging(false);

    if (dragX > 120) { // Threshold
      setIsTorn(true);
      safeVibrate([30, 50, 80]); // Success vibration
      triggerConfetti();
    } else {
      setDragX(0); // Snap back
    }
  };

  // Drag Progress (0 to 1)
  const dragProgress = Math.min(dragX / 120, 1);

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-end overflow-hidden bg-gray-900 select-none"
      ref={containerRef}
      onMouseMove={(e) => handleMove(e, e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e, e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
        <img 
            src={deal.imageUrl} 
            alt={deal.title} 
            className={`w-full h-full object-cover 
              ${false
                  ? 'blur-2xl grayscale brightness-50 scale-105 transition-all duration-1000 ease-out'
                  : isImageStable 
                    ? 'blur-0 grayscale-0 brightness-100' // CLEAN STATE: No transition, no scale
                    : 'blur-0 grayscale-0 brightness-100 scale-100 transition-all duration-1000 ease-out' // ANIMATING STATE
              }`}
        />
        
        {/* Gradient pushed way down to keep image clear, only dark behind text */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-black/80 pointer-events-none" />
      </div>

      {/* --- DANMAKU OVERLAY (Header Area) --- */}
      {true && (
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              {danmakuList.map(item => (
                  <div 
                      key={item.id}
                      className="absolute whitespace-nowrap will-change-transform animate-danmaku"
                      style={{
                          top: `${item.top}%`,
                          left: '100%',
                          fontSize: `${item.size}px`,
                          opacity: item.opacity,
                          color: item.isUser ? '#FCD34D' : '#ffffff',
                          fontWeight: item.isUser ? '800' : '500',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          animationDuration: `${item.duration}s`,
                          zIndex: item.isUser ? 20 : 10,
                          border: item.isUser ? '1px solid rgba(253, 224, 71, 0.5)' : 'none',
                          padding: item.isUser ? '4px 12px' : '0',
                          borderRadius: '20px',
                          backgroundColor: item.isUser ? 'rgba(0,0,0,0.4)' : 'transparent',
                          backdropFilter: item.isUser ? 'blur(4px)' : 'none'
                      }}
                  >
                      {item.text}
                  </div>
              ))}
          </div>
      )}

      {/* --- COMMENT INPUT MODAL --- */}
      {showCommentInput && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <form 
                onSubmit={handleUserCommentSubmit}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 shadow-2xl transform scale-100 transition-all"
              >
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-white font-bold text-sm">실시간 댓글 남기기</span>
                      <button type="button" onClick={() => setShowCommentInput(false)} className="text-gray-500 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="relative">
                      <input 
                          autoFocus
                          type="text" 
                          maxLength={30}
                          placeholder="이 스팟에 대해 한마디! (최대 30자)"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          className="w-full bg-black border border-neutral-700 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                      />
                      <button 
                          type="submit"
                          disabled={!userComment.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-yellow-500 rounded-lg text-black disabled:opacity-50 disabled:bg-neutral-700 disabled:text-gray-500 transition-colors"
                      >
                          <Send size={16} />
                      </button>
                  </div>
              </form>
          </div>
      )}

      
      {/* Top Bar: Share & Comment */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-end items-start gap-3 z-30 opacity-100">
        <button 
            onClick={() => setShowCommentInput(true)}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/90 hover:bg-black/40 hover:text-yellow-400 transition-colors active:scale-95 shadow-lg"
        >
            <MessageCircle size={20} />
        </button>
        <button className="text-white/80 drop-shadow-md active:scale-95 hover:text-white transition-colors mt-1">
           <Share2 size={24} />
        </button>
      </div>

      {/* --- INFO LAYER --- */}
      <div className={`absolute bottom-[90px] left-0 right-0 z-20 px-6 w-full flex flex-col gap-2 transition-all duration-700 translate-y-0 opacity-100 blur-0`}>
        
        {/* Badge */}
        <div className="self-start">
             {isAdMode ? (
                 <div className="flex items-center gap-1.5 bg-green-500/90 text-white px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg mb-2">
                     <Sparkles size={10} fill="white" />
                     <span className="text-[10px] font-black tracking-wide uppercase">RECOMMENDED</span>
                 </div>
             ) : (
                 <div className="flex items-center gap-1.5 bg-yellow-500/90 text-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg mb-2">
                     <Sparkles size={10} fill="black" />
                     <span className="text-[10px] font-black tracking-wide uppercase">LO.KEY Exclusive</span>
                 </div>
             )}
        </div>

        {/* Title */}
        <div className="text-left">
           <h1
              className="text-3xl font-black text-white leading-tight break-keep"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
           >
              {deal.title}
           </h1>

           <div className="mt-2 flex flex-col gap-2">
             <div className={`font-bold drop-shadow-md transition-all ${isAdMode ? 'text-green-400' : 'text-yellow-400'}`}>
                {isAdMode ? (
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-3xl font-black text-green-400 tracking-tight flex items-center gap-2">
                            👍 사장님 강력 추천
                        </span>
                        <span className="text-sm font-bold text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1">
                            <ShoppingBag size={12} />
                            판매가 {formattedOriginalPrice}원
                        </span>
                    </div>
                ) : (
                    <span
                      className="text-2xl"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                    >
                      {formattedDiscount}원 할인혜택
                    </span>
                )}
             </div>
             {deal.usageCondition && (
               <div className="flex items-center gap-1.5 bg-red-900/40 border border-red-400/30 backdrop-blur-md text-red-200 text-[10px] font-bold px-2.5 py-1 rounded-lg self-start shadow-sm">
                  <AlertCircle size={10} className="text-red-400" />
                  <span>{deal.usageCondition}</span>
               </div>
             )}
           </div>
        </div>

        {/* Store Info & Favorite Button Row */}
        <div className="flex justify-between items-center mt-1">
             <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <span
                  className="text-white font-bold border-b border-white/30 pb-0.5"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {deal.restaurant.name}
                </span>
                <span
                  className="text-xs text-white/70 font-medium"
                  style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)' }}
                >
                  {deal.restaurant.category}
                </span>
            </div>

            <button 
              onClick={toggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 active:scale-95 shadow-sm backdrop-blur-sm
                 ${isFavorite 
                    ? 'bg-red-500/80 border-red-500/30' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                 }
              `}
            >
               <Heart 
                 size={12} 
                 className={`transition-all duration-300
                    ${isFavorite ? 'fill-white text-white' : 'text-white'}
                    ${isHeartPopping ? 'animate-heart-burst' : ''}
                 `} 
               />
               <span className="text-[10px] font-bold text-white">
                 {isFavorite ? '관심 매장' : '찜하기'}
               </span>
            </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/90 mb-2">
             <span
               className="flex items-center gap-1"
               style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.3)' }}
             >
               <MapPin size={10} /> {deal.restaurant.distance}m 거리
             </span>
        </div>

        {/* --- REAL-FEEL TICKET UI --- */}
        <div className="relative w-full h-20 shadow-2xl mt-1">
            
            {/* PART 1: LEFT STUB (Static) */}
            <div className={`absolute left-0 top-0 bottom-0 w-[30%] z-10 
              rounded-l-xl overflow-hidden flex flex-col items-center justify-center
              ${isTorn ? 'bg-neutral-200' : 'bg-white coupon-pattern'}
              border-r-2 border-dashed border-gray-300
            `}>
                 <div className={`text-center w-full px-1 flex flex-col items-center justify-center h-full ${isTorn ? 'opacity-50' : ''}`}>
                    {isTorn ? (
                         <span className="text-xs font-bold text-gray-500">발급<br/>완료</span>
                    ) : (
                        <>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                                {isAdMode ? "New" : "Invite"}
                            </span>
                            {isAdMode ? (
                                <span className="text-xl font-black text-black leading-none tracking-tight">홍보</span>
                            ) : (
                                <span className="text-xl font-black text-black leading-none">{remaining}</span>
                            )}
                            <div className={`mt-1 px-2 py-0.5 text-white text-[8px] font-bold rounded-sm ${isAdMode ? 'bg-green-600' : 'bg-black'}`}>
                                {isAdMode ? '추천' : '잔여석'}
                            </div>
                        </>
                    )}
                 </div>
            </div>

            {/* PART 1.5: HIDDEN EMOJI LAYER */}
            <div 
                className="absolute left-[30%] top-0 bottom-0 z-15 flex items-center justify-center overflow-hidden pointer-events-none"
                style={{ 
                    width: `${dragX}px`, 
                    opacity: isTorn ? 0 : 1
                }}
            >
                <div 
                    className="flex items-center justify-center"
                    style={{ transform: `scale(${0.5 + (dragProgress * 1.0)})` }}
                >
                    <span className="text-3xl filter drop-shadow-sm select-none">
                       {isAdMode ? '👀' : '🗝️'}
                    </span>
                </div>
            </div>

            {/* PART 2: RIGHT TICKET (Draggable) */}
            <div 
                className={`absolute left-[30%] top-0 bottom-0 right-0 z-20
                  rounded-r-xl overflow-hidden cursor-grab active:cursor-grabbing
                  flex items-center 
                  ${isTorn ? 'bg-neutral-200' : remaining === 0 ? 'bg-neutral-500' : 'bg-white coupon-pattern'}
                `}
                style={{
                    transform: isTorn 
                        ? `translateX(${dragX + 60}px) rotate(${dragX * 0.1}deg) translateY(20px)` 
                        : `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`, // Physics Rotation!
                    transformOrigin: 'top left', // Pivot point for rotation
                    transition: isDragging ? 'none' : 'opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    opacity: isTorn ? 0 : 1,
                    pointerEvents: isTorn ? 'none' : 'auto',
                    touchAction: 'none' // CRITICAL: This allows horizontal drag without scrolling the page
                }}
                onMouseDown={(e) => handleStart(e, e.clientX)}
                onTouchStart={(e) => handleStart(e, e.touches[0].clientX)}
            >
                {/* Visual Dotted Line (Left Edge) */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] border-l-2 border-dotted border-gray-300 opacity-60 ml-[1px]"></div>

                {remaining === 0 ? (
                    <span className="w-full text-center font-bold text-gray-300 text-sm">금일 마감되었습니다</span>
                ) : (
                    <div className="w-full h-full relative flex items-center">
                        <div className="absolute inset-0 flex items-center justify-between px-4">
                             <div className="flex flex-col items-start pl-3">
                                <span className="text-base font-black text-gray-900 tracking-tight">
                                    {isAdMode ? '관심 매장 담기' : '서포트 티켓 받기'}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                                    <Clock size={12} /> {timeLeft}
                                </span>
                            </div>
                            <div className="flex items-center text-gray-300">
                                <ChevronRight size={20} className="animate-flow-arrow" style={{animationDelay:'0ms'}}/>
                                <ChevronRight size={20} className="animate-flow-arrow" style={{animationDelay:'100ms'}}/>
                                <ChevronRight size={20} className="animate-flow-arrow" style={{animationDelay:'200ms'}}/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Message Layer */}
            {isTorn && (
                <div className="absolute left-[30%] top-0 bottom-0 right-0 flex flex-col items-center justify-center z-0 animate-fade-in-up pl-2">
                     <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                         <CheckCircle size={14} className="fill-yellow-500 text-black" />
                         <span className="text-sm font-bold text-white shadow-black drop-shadow-md">
                             {isAdMode ? '리스트 저장 완료!' : '티켓 발급 완료!'}
                         </span>
                     </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onUseCoupon?.(); }}
                        className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-transform"
                     >
                        마이 티켓 확인하기
                     </button>
                </div>
            )}
            
        </div>
      </div>

      <style>{`
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flowArrow {
            0% { opacity: 0.3; transform: translateX(0); }
            50% { opacity: 1; transform: translateX(3px); color: #000; }
            100% { opacity: 0.3; transform: translateX(0); }
        }
        .animate-flow-arrow { animation: flowArrow 1.5s infinite ease-in-out; }
        @keyframes heartBurst {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
        }
        .animate-heart-burst { animation: heartBurst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        .animate-bounce-slow { animation: bounce 2s infinite; }
        
        .coupon-pattern {
            background-color: #ffffff;
            background-image: repeating-linear-gradient(
                45deg,
                #f1f5f9,
                #f1f5f9 10px,
                #ffffff 10px,
                #ffffff 20px
            );
            background-size: 28px 28px;
        }

        /* DANMAKU ANIMATION */
        @keyframes danmakuSlide {
            from { transform: translateX(0); }
            to { transform: translateX(calc(-100vw - 100%)); }
        }
        .animate-danmaku {
            animation-name: danmakuSlide;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};
