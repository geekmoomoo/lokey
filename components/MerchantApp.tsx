
import React, { useState, useRef, useEffect } from 'react';
import { MerchantNavigation } from './MerchantNavigation';
import { MerchantTab, Deal } from '../types';
import { 
  Camera, ChevronRight, BarChart2, Users, Clock, 
  Edit2, Trash2, Plus, Info, Settings, LogOut, Store, 
  Wand2, Image as ImageIcon, CheckCircle, ArrowLeft, Eye, EyeOff, X,
  Sparkles, AlertCircle, Palette, Megaphone, Building2, MapPin, Phone, FileText, User, Search, Lock,
  Ticket, Heart, Activity, Zap, Bell, Crop, ZoomIn, Move, RotateCcw, Copy, PauseCircle, PlayCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DealScreen } from './DealScreen';
import { addDeal, getMerchantDeals, updateDeal, generateContextComments } from '../services/dealService';

interface MerchantAppProps {
  onBackToHome: () => void;
}

// --- CONSTANTS & HELPERS ---
const STEPS = ['기본 정보', '이미지 설정', '운영 설정', '확인 및 발행'];

// Style Presets for AI Generation
const STYLE_PRESETS = [
    { id: 'NATURAL', label: '자연스러운(Natural)', desc: '밝은 자연광, 신선함 강조', prompt: 'Natural sunlight, bright and airy, fresh ingredients, soft shadows, organic feel' },
    { id: 'LUXURY', label: '고급스러운(Luxury)', desc: '어두운 배경, 핀 조명', prompt: 'Dark moody background, dramatic cinematic lighting, rim light, fine dining elegant atmosphere' },
    { id: 'VIVID', label: '생생한(Vivid)', desc: '높은 채도, 강렬한 색감', prompt: 'High saturation, vibrant colors, pop art style lighting, energetic and delicious look' },
];

// Initial Empty Deal State for Form
const INITIAL_FORM = {
    title: '',
    benefitType: 'DISCOUNT' as 'DISCOUNT' | 'CUSTOM' | 'AD', 
    benefitValue: '', 
    originalPrice: '',
    imagePrompt: '',
    imageStyle: 'NATURAL', 
    generatedImages: [] as string[],
    selectedImageIndex: 0,
    duration: 1, 
    expiryTime: '23:59', 
    quantityMode: 'LIMITED' as 'LIMITED' | 'UNLIMITED',
    quantity: 10,
    description: '',
    conditionType: 'NONE' as 'NONE' | 'ONE_MENU' | 'MIN_ORDER',
    minOrderAmount: '',
    usageConditionText: '' 
};

// Initial Sign Up Form State
const INITIAL_SIGNUP_FORM = {
    businessRegNumber: '', // Acts as ID
    password: '',
    ownerName: '',
    ownerPhone: '',
    storeName: '',
    category: 'KOREAN',
    storePhone: '',
    address: '',
    openTime: '11:00',
    closeTime: '22:00',
};

// --- IMAGE EDITOR COMPONENT ---
interface ImageEditorProps {
    imageSrc: string;
    onSave: (newImageSrc: string) => void;
    onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showGuides, setShowGuides] = useState(true); // Toggle for guides
    const dragStart = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset Handler
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Pan Handlers
    const handlePointerDown = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragStart.current = { x: clientX - position.x, y: clientY - position.y };
    };
    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
    };
    const handlePointerUp = () => setIsDragging(false);

    // Canvas Crop & Save Logic (1K Resolution)
    const handleSave = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const container = containerRef.current;
        if (!canvas || !img || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Target Output Resolution (1K Width Vertical)
        const OUTPUT_WIDTH = 1080;
        const OUTPUT_HEIGHT = 1920; // 9:16 aspect ratio

        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;

        // Calculate ratios
        // Container dimensions
        const cw = container.clientWidth;
        
        // 1. Fill Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        // 2. Calculate scaling factor between Screen Container and Output Canvas
        const outputScale = OUTPUT_WIDTH / cw;

        // 3. Transformation
        // Translate to center of canvas, then apply user offset scaled up
        ctx.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);
        ctx.translate(position.x * outputScale, position.y * outputScale);
        ctx.scale(scale, scale);
        
        // Draw Image Centered
        const drawWidth = OUTPUT_WIDTH; 
        const drawHeight = (img.naturalHeight / img.naturalWidth) * OUTPUT_WIDTH;

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        // 4. Export
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onSave(base64);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in select-none">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black z-10 border-b border-neutral-800">
                <button onClick={onCancel} className="text-gray-400 p-2 hover:text-white"><X /></button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-sm">이미지 편집</span>
                    <span className="text-[10px] text-gray-500">드래그하여 위치 이동 / 하단 바로 확대</span>
                </div>
                <button onClick={handleSave} className="text-purple-400 font-bold p-2 hover:text-purple-300">완료</button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 w-full h-full relative bg-neutral-900 overflow-hidden flex items-center justify-center p-4">
                {/* Crop Frame (Phone Ratio) - MAXIMIZED */}
                <div 
                    ref={containerRef}
                    className="relative bg-black overflow-hidden shadow-2xl border border-neutral-700 ring-1 ring-white/10"
                    style={{
                        aspectRatio: '9/16',
                        height: '100%',
                        maxHeight: '100%', 
                        width: 'auto',
                        maxWidth: '100%'
                    }}
                    onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                    onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={handlePointerUp}
                >
                    <img 
                        ref={imgRef}
                        src={imageSrc} 
                        alt="Edit Target"
                        className="absolute left-1/2 top-1/2 w-full h-auto origin-center pointer-events-none select-none touch-none"
                        style={{
                            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
                        }}
                    />

                    {/* --- GUIDES (TOGGLEABLE) --- */}
                    {showGuides && (
                        <>
                            {/* Circular Safe Zone Guide (Responsive) */}
                            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70%] aspect-square rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none flex items-center justify-center">
                                 <span className="text-white/90 text-xs font-bold drop-shadow-md bg-black/40 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">핵심 메뉴 위치</span>
                                 <div className="absolute w-4 h-4 border-l-2 border-t-2 border-white/80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                            
                            {/* Bottom Gradient Guide (Text Area) */}
                            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-red-500/30 to-transparent border-t border-red-500/30 pointer-events-none flex items-end justify-center pb-4">
                                <span className="text-red-300 text-[10px] font-bold uppercase tracking-widest mb-4 drop-shadow-md">Text Safe Zone</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Guide Toggle Button (Floating) */}
                <button 
                    onClick={() => setShowGuides(!showGuides)}
                    className="absolute top-6 right-6 z-50 bg-neutral-800/80 backdrop-blur-md p-3 rounded-full text-white hover:bg-neutral-700 border border-white/10 shadow-lg"
                    title={showGuides ? "가이드 숨기기" : "가이드 보기"}
                >
                    {showGuides ? <Eye size={20} /> : <EyeOff size={20} className="text-gray-400" />}
                </button>
            </div>

            {/* Controls */}
            <div className="p-6 bg-neutral-900 border-t border-neutral-800 pb-10 safe-area-bottom">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-500 font-bold uppercase">Zoom & Pan</span>
                    <button 
                        onClick={handleReset} 
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-700 transition-colors"
                    >
                        <RotateCcw size={12} /> 원래대로
                    </button>
                </div>
                <div className="flex items-center gap-4 mb-2">
                    <ZoomIn size={20} className="text-gray-400" />
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.1" 
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="text-white w-8 text-right font-mono text-sm">{scale.toFixed(1)}x</span>
                </div>
                <div className="flex justify-center mt-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Move size={12} />
                        사진을 드래그하여 위치를 조정하세요
                    </p>
                </div>
            </div>

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

// --- DASHBOARD COMPONENT ---
interface DashboardScreenProps {
    authState: 'LOGGED_OUT' | 'SIGNING_UP' | 'LOGGED_IN';
    storeName: string;
    onNavigateToAd: () => void;
    onCopyDeal: (deal: Deal) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ authState, storeName, onNavigateToAd, onCopyDeal }) => {
    const [myDeals, setMyDeals] = useState<Deal[]>([]);
    const [addQtyDeal, setAddQtyDeal] = useState<Deal | null>(null);
    const [qtyToAdd, setQtyToAdd] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ENDED'>('ACTIVE');

    // Load deals
    useEffect(() => {
        if (authState === 'LOGGED_IN') {
            const allDeals = getMerchantDeals();
            setMyDeals(allDeals); 
        }
    }, [authState]);

    const activeDeals = myDeals.filter(d => !d.status || d.status === 'ACTIVE');
    const endedDeals = myDeals.filter(d => d.status === 'ENDED' || d.status === 'CANCELED');
    const currentList = activeTab === 'ACTIVE' ? activeDeals : endedDeals;

    const handleStopDeal = (deal: Deal) => {
        if (confirm(`'${deal.title}' 광고를 중단하시겠습니까?\n중단된 광고는 복구할 수 없습니다.`)) {
            updateDeal(deal.id, { status: 'CANCELED', expiresAt: new Date() });
            setMyDeals([...getMerchantDeals()]); // Refresh
        }
    };

    const handleAddQuantityConfirm = () => {
        if (addQtyDeal && qtyToAdd) {
            const added = parseInt(qtyToAdd, 10);
            if (added > 0) {
                updateDeal(addQtyDeal.id, { 
                    totalCoupons: addQtyDeal.totalCoupons + added,
                    remainingCoupons: addQtyDeal.remainingCoupons + added
                });
                setMyDeals([...getMerchantDeals()]); // Refresh
                setAddQtyDeal(null);
                setQtyToAdd('');
                alert('수량이 추가되었습니다.');
            }
        }
    };

    if (authState !== 'LOGGED_IN') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                    <BarChart2 size={32} className="text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">데이터가 없습니다</h2>
                <p className="text-sm text-gray-500">로그인 후 매장 소식을 확인하세요.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto no-scrollbar p-6 pb-24">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-black text-white mb-1">운영 관리</h1>
                    <p className="text-gray-400 text-xs">
                       오늘도 힘찬 하루 되세요, 사장님!
                    </p>
                </div>
                <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[10px] font-bold border border-purple-500/30">
                    {storeName || "내 매장"}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">진행 중 광고</p>
                    <p className="text-2xl font-black text-white">{activeDeals.length}<span className="text-xs font-normal text-gray-500 ml-1">건</span></p>
                </div>
                <div onClick={onNavigateToAd} className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-center items-center cursor-pointer hover:bg-purple-900/30 transition-colors">
                     <Plus size={24} className="text-purple-400 mb-1" />
                     <p className="text-xs font-bold text-purple-300">새 광고 등록</p>
                </div>
            </div>

            {/* Tab Header */}
            <div className="flex gap-6 mb-4 border-b border-neutral-800">
                <button 
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === 'ACTIVE' ? 'text-white' : 'text-gray-600'}`}
                >
                    진행 중인 광고
                    {activeTab === 'ACTIVE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('ENDED')}
                    className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === 'ENDED' ? 'text-white' : 'text-gray-600'}`}
                >
                    종료/중단된 광고
                    {activeTab === 'ENDED' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
                </button>
            </div>

            {/* Deal List */}
            <div className="space-y-4 pb-12">
                {currentList.length === 0 ? (
                    <div className="py-12 text-center text-gray-600 text-xs">
                        {activeTab === 'ACTIVE' ? '현재 진행 중인 광고가 없습니다.' : '종료된 광고 내역이 없습니다.'}
                    </div>
                ) : (
                    currentList.map(deal => (
                        <div key={deal.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                            {/* Card Body */}
                            <div className="p-4 flex gap-4">
                                <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden shrink-0">
                                    <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                         <h3 className="text-white font-bold text-sm truncate">{deal.title}</h3>
                                         {deal.status === 'CANCELED' && <span className="text-[10px] text-red-500 bg-red-900/20 px-1.5 py-0.5 rounded">중단됨</span>}
                                         {deal.status === 'ENDED' && <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">종료됨</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                                        <Clock size={10} /> 
                                        <span>{deal.expiresAt > new Date() ? '남은 시간: ' + Math.ceil((deal.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60)) + '시간' : '기간 만료'}</span>
                                    </div>
                                    
                                    {/* Progress */}
                                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${(deal.remainingCoupons / deal.totalCoupons) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px]">
                                        <span className="text-purple-400 font-bold">{deal.remainingCoupons}개 남음</span>
                                        <span className="text-gray-600">총 {deal.totalCoupons}개</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Footer */}
                            <div className="bg-neutral-950 px-4 py-3 flex gap-2 border-t border-neutral-800">
                                {activeTab === 'ACTIVE' ? (
                                    <>
                                        <button 
                                            onClick={() => { setAddQtyDeal(deal); setQtyToAdd(''); }}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                        >
                                            + 수량 추가
                                        </button>
                                        <button 
                                            onClick={() => handleStopDeal(deal)}
                                            className="flex-1 bg-neutral-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 text-xs font-bold py-2 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                                        >
                                            광고 중단
                                        </button>
                                        <button 
                                            onClick={() => onCopyDeal(deal)}
                                            className="flex-1 bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 text-xs font-bold py-2 rounded-lg transition-colors border border-purple-500/20"
                                        >
                                            복사 등록
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => onCopyDeal(deal)}
                                        className="w-full bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 text-xs font-bold py-2 rounded-lg transition-colors border border-purple-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Copy size={12} />
                                        이 내용으로 다시 등록하기 (복사)
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Increase Quantity Modal */}
            {addQtyDeal && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative">
                        <button onClick={() => setAddQtyDeal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                        <h3 className="text-white font-bold text-lg mb-1">수량 추가</h3>
                        <p className="text-xs text-gray-400 mb-6">{addQtyDeal.title}</p>
                        
                        <div className="mb-4">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">추가할 수량 (매)</label>
                            <input 
                                type="number" 
                                autoFocus
                                value={qtyToAdd}
                                onChange={(e) => setQtyToAdd(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') handleAddQuantityConfirm(); }}
                                className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none text-center text-lg"
                                placeholder="0"
                            />
                        </div>

                        {/* Quick Add Buttons */}
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setQtyToAdd((prev) => String((parseInt(prev || '0') + 10)))} className="flex-1 py-2 bg-neutral-800 rounded-lg text-xs font-bold text-gray-300 hover:bg-neutral-700">+10</button>
                            <button onClick={() => setQtyToAdd((prev) => String((parseInt(prev || '0') + 50)))} className="flex-1 py-2 bg-neutral-800 rounded-lg text-xs font-bold text-gray-300 hover:bg-neutral-700">+50</button>
                            <button onClick={() => setQtyToAdd((prev) => String((parseInt(prev || '0') + 100)))} className="flex-1 py-2 bg-neutral-800 rounded-lg text-xs font-bold text-gray-300 hover:bg-neutral-700">+100</button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setAddQtyDeal(null)} className="flex-1 py-3 bg-neutral-800 rounded-xl text-gray-400 font-bold text-sm">취소</button>
                            <button onClick={handleAddQuantityConfirm} className="flex-1 py-3 bg-purple-600 rounded-xl text-white font-bold text-sm">확인</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const MerchantApp: React.FC<MerchantAppProps> = ({ onBackToHome }) => {
  const [currentTab, setCurrentTab] = useState<MerchantTab>(MerchantTab.AD_REGISTER);
  
  // Auth State
  const [authState, setAuthState] = useState<'LOGGED_OUT' | 'SIGNING_UP' | 'LOGGED_IN'>('LOGGED_OUT');
  
  // Login Inputs
  const [loginBusinessNum, setLoginBusinessNum] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Signup Inputs
  const [signupForm, setSignupForm] = useState(INITIAL_SIGNUP_FORM);

  // Ad Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editor State
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLER: COPY DEAL ---
  const handleCopyDeal = (deal: Deal) => {
    let conditionType: 'NONE' | 'ONE_MENU' | 'MIN_ORDER' = 'NONE';
    let minOrder = '';
    
    if (deal.usageCondition?.includes('1인 1메뉴')) conditionType = 'ONE_MENU';
    if (deal.usageCondition?.includes('이상 주문')) {
        conditionType = 'MIN_ORDER';
        minOrder = deal.usageCondition.replace(/[^0-9]/g, '');
    }

    setFormData({
        ...INITIAL_FORM,
        title: deal.title,
        benefitType: deal.benefitType || (deal.discountAmount > 0 ? 'DISCOUNT' : 'AD'),
        benefitValue: deal.benefitType === 'CUSTOM' 
            ? (deal.customBenefit || '') 
            : (deal.discountAmount > 0 ? new Intl.NumberFormat('ko-KR').format(deal.discountAmount) : ''),
        originalPrice: new Intl.NumberFormat('ko-KR').format(deal.originalPrice),
        generatedImages: [deal.imageUrl],
        selectedImageIndex: 0,
        quantity: deal.totalCoupons,
        conditionType: conditionType,
        minOrderAmount: minOrder ? new Intl.NumberFormat('ko-KR').format(parseInt(minOrder)) : '',
    });

    setStep(1);
    setCurrentTab(MerchantTab.AD_REGISTER);
  };

  // --- HELPER FOR NUMBER INPUTS ---
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const formatted = raw ? Number(raw).toLocaleString() : '';
      setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const parseNum = (str: string) => Number(str.replace(/,/g, '')) || 0;

  // --- VALIDATION LOGIC ---
  const isStepValid = () => {
    if (step === 1) {
        if (!formData.title || formData.title.trim().length === 0) return false;
        if (formData.benefitType === 'AD') {
            if (!formData.originalPrice) return false;
        } else if (formData.benefitType === 'DISCOUNT') {
             if (!formData.benefitValue) return false;
        } else if (formData.benefitType === 'CUSTOM') {
             if (!formData.benefitValue || formData.benefitValue.trim().length === 0) return false;
        }
        return true;
    }
    if (step === 2) {
        if (formData.generatedImages.length === 0) return false;
        return true;
    }
    if (step === 3) {
        if (formData.conditionType === 'MIN_ORDER' && !formData.minOrderAmount) return false;
        return true;
    }
    return true; 
  };


  // --- AI IMAGE GENERATION LOGIC ---
  const constructOptimizedPrompt = (userInput: string, styleId: string) => {
      const selectedStyle = STYLE_PRESETS.find(s => s.id === styleId) || STYLE_PRESETS[0];
      
      return `
        Role: World-class Food Photographer.
        Subject: ${userInput}.
        
        COMPOSITION RULES (CRITICAL):
        1. Aspect Ratio: Vertical (9:16).
        2. SUBJECT POSITION: Place the main food subject CLEARLY in the TOP 40-50% of the frame. The food MUST be placed high up.
        3. NEGATIVE SPACE: The bottom 50% of the image MUST be relatively empty, blurred (bokeh), or have a clean surface (tabletop) to ensure text overlay is readable. Do NOT put important details at the bottom.
        4. FRAMING: Medium shot. Show the full dish/plate. Do NOT zoom in too close.
        5. ANGLE: 45-degree angle or slight top-down view.
        
        STYLE & LIGHTING:
        ${selectedStyle.prompt}
        
        QUALITY:
        8k resolution, highly detailed texture, professional color grading, appetizing, michelin star presentation.
      `;
  };

  const handleAIAction = async (mode: 'GENERATE' | 'ENHANCE', input?: File) => {
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let prompt = "";
        let imageParts: any[] = [];

        if (mode === 'GENERATE') {
            prompt = constructOptimizedPrompt(formData.imagePrompt, formData.imageStyle);
        } else if (mode === 'ENHANCE' && input) {
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(input);
            });
            imageParts = [{ inlineData: { data: base64Data, mimeType: input.type } }];
            prompt = "Enhance this food image. Make it look more delicious, improve lighting to be professional studio quality. Keep the composition but refine textures and colors.";
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts: [...imageParts, { text: prompt }] },
            config: { 
                imageConfig: { 
                    aspectRatio: "9:16"
                } 
            }
        });

        const newImages: string[] = [];
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    newImages.push(`data:image/png;base64,${part.inlineData.data}`);
                }
            }
        }

        if (newImages.length === 0) {
             console.warn("No image data in response");
             newImages.push("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop");
        }

        setFormData(prev => ({ ...prev, generatedImages: newImages, selectedImageIndex: 0 }));

    } catch (error) {
        console.error("AI Generation Failed:", error);
        alert("이미지 생성 중 오류가 발생했습니다. (잠시 후 다시 시도해주세요)");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleAIAction('ENHANCE', file);
  };

  // --- PREVIEW DATA CONSTRUCTOR ---
  const getPreviewDeal = (): Deal => {
    let finalCondition = "";
    if (formData.conditionType === 'ONE_MENU') finalCondition = "1인 1메뉴 필수";
    if (formData.conditionType === 'MIN_ORDER') {
        const amount = parseNum(formData.minOrderAmount);
        finalCondition = amount > 0 ? `${new Intl.NumberFormat('ko-KR').format(amount)}원 이상 주문 시` : "최소 주문 금액 필요";
    }

    let discountAmount = 0;
    if (formData.benefitType === 'DISCOUNT') discountAmount = parseNum(formData.benefitValue);

    return {
        id: 'preview',
        title: formData.title || '제목 미리보기',
        originalPrice: parseNum(formData.originalPrice) || 0,
        discountAmount: discountAmount,
        imageUrl: formData.generatedImages[formData.selectedImageIndex] || 'https://via.placeholder.com/400x600/333/999?text=No+Image',
        totalCoupons: formData.quantity,
        remainingCoupons: formData.quantity,
        expiresAt: new Date(Date.now() + 86400000), // Mock 24h
        status: 'ACTIVE',
        benefitType: formData.benefitType,
        customBenefit: formData.benefitType === 'CUSTOM' ? formData.benefitValue : undefined,
        restaurant: {
            id: 'my-store',
            name: signupForm.storeName || '내 매장 이름',
            category: signupForm.category || '카테고리',
            distance: 10,
            rating: 5.0,
            reviewCount: 0,
            location: { lat: 0, lng: 0 }
        },
        usageCondition: finalCondition,
        initialComments: ["맛있겠다", "오픈런각"] // Dummy for preview
    };
  };

  // --- WIZARD RENDER FUNCTIONS ---
  const renderWizardHeader = () => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black text-white">광고 등록</h1>
                <span className="text-purple-400 font-bold text-sm">Step {step}/4</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Title Section (Renamed to Product Name) */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase">상품명 (필수)</label>
                </div>
                
                <div className="relative">
                    <input 
                        type="text" 
                        maxLength={12}
                        placeholder="예: 특선 모듬 초밥" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white text-lg font-bold placeholder-gray-700 focus:border-purple-500 focus:outline-none transition-colors" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                        {formData.title.length}/12
                    </span>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">광고 방식</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <button 
                        onClick={() => setFormData({...formData, benefitType: 'DISCOUNT'})}
                        className={`py-3 rounded-xl border text-[11px] font-bold transition-all ${formData.benefitType === 'DISCOUNT' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}
                    >
                        금액 할인
                    </button>
                    <button 
                        onClick={() => setFormData({...formData, benefitType: 'CUSTOM'})}
                        className={`py-3 rounded-xl border text-[11px] font-bold transition-all ${formData.benefitType === 'CUSTOM' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}
                    >
                        직접 입력
                    </button>
                    <button 
                        onClick={() => setFormData({...formData, benefitType: 'AD'})}
                        className={`py-3 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${formData.benefitType === 'AD' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}
                    >
                        <div className="flex items-center gap-1">
                             <Megaphone size={10} /> 단순 홍보
                        </div>
                    </button>
                </div>

                {formData.benefitType === 'DISCOUNT' && (
                    <div className="relative animate-fade-in">
                        <input 
                            type="text" 
                            inputMode="numeric"
                            placeholder="5,000" 
                            value={formData.benefitValue}
                            onChange={(e) => handleNumberChange(e, 'benefitValue')}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-24 py-4 text-white text-lg font-bold placeholder-gray-700 focus:border-purple-500 focus:outline-none" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                            원 (혜택제공)
                        </span>
                    </div>
                )}
                
                {formData.benefitType === 'CUSTOM' && (
                    <div className="animate-fade-in">
                        <input 
                            type="text" 
                            placeholder="예: 음료수 1개 무료, 1+1" 
                            value={formData.benefitValue}
                            onChange={(e) => setFormData({...formData, benefitValue: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white text-lg font-bold placeholder-gray-700 focus:border-purple-500 focus:outline-none" 
                        />
                    </div>
                )}

                {formData.benefitType === 'AD' && (
                    <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-4 animate-fade-in">
                        <p className="text-green-400 text-xs font-bold mb-1">📢 단순 홍보 모드</p>
                        <p className="text-gray-400 text-[11px]">
                            할인 혜택 없이 메뉴나 매장을 홍보합니다.<br/>
                            하단에 <b>판매 가격</b>을 정확히 입력해주세요.
                        </p>
                    </div>
                )}
            </div>
            
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                    {formData.benefitType === 'AD' ? '판매 가격 (필수)' : '정상 가격 (선택)'}
                </label>
                <div className="relative">
                    <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0" 
                        value={formData.originalPrice}
                        onChange={(e) => handleNumberChange(e, 'originalPrice')}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-3 text-white text-base placeholder-gray-700 focus:border-purple-500 focus:outline-none" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">이미지 생성</label>
                
                {formData.generatedImages.length === 0 ? (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Wand2 className="text-purple-400" size={18} />
                                <h3 className="text-white font-bold text-sm">AI 메뉴 촬영</h3>
                            </div>
                            <input 
                                type="text" 
                                placeholder="예: 숯불에 구운 두툼한 삼겹살" 
                                value={formData.imagePrompt}
                                onChange={(e) => setFormData({...formData, imagePrompt: e.target.value})}
                                className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 mb-4"
                            />
                            <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                                <Palette size={10} /> 분위기 선택 (조명/톤)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {STYLE_PRESETS.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setFormData({...formData, imageStyle: style.id})}
                                        className={`p-2 rounded-lg border text-center transition-all ${formData.imageStyle === style.id ? 'bg-purple-900/40 border-purple-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-500 hover:border-gray-600'}`}
                                    >
                                        <div className="text-xs font-bold mb-0.5">{style.label.split('(')[0]}</div>
                                        <div className="text-[9px] opacity-70 scale-90">{style.label.split('(')[1].replace(')', '')}</div>
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => handleAIAction('GENERATE')}
                                disabled={!formData.imagePrompt || isGenerating}
                                className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-purple-500 transition-colors"
                            >
                                최적 비율로 생성하기
                            </button>
                        </div>
                         <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-600 font-medium">OR</span></div>
                        </div>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-neutral-800 transition-colors"
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            <Camera className="text-gray-400" size={18} />
                            <span className="text-gray-400 text-sm font-bold">직접 촬영한 사진 올리기</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white">생성된 이미지 선택</span>
                            <button onClick={() => setFormData({...formData, generatedImages: []})} className="text-xs text-gray-500 underline">다시 만들기</button>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            {formData.generatedImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setEditingImageIndex(idx)}
                                    className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${formData.selectedImageIndex === idx ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-transparent opacity-60'}`}
                                >
                                    <img src={img} alt="Generated" className="w-full h-full object-cover" />
                                    {/* Edit Overlay Hint */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div className="bg-black/60 backdrop-blur-sm p-2 rounded-full text-white">
                                            <Crop size={20} />
                                        </div>
                                    </div>
                                    {formData.selectedImageIndex === idx && (
                                        <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1"><CheckCircle size={14} className="text-white" /></div>
                                    )}
                                </div>
                            ))}
                         </div>
                         <p className="text-[10px] text-gray-500 text-center">
                             <Crop size={10} className="inline mr-1" />
                             이미지를 클릭하면 위치와 크기를 편집할 수 있습니다.
                         </p>
                    </div>
                )}
            </div>
            {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl">
                    <Wand2 size={40} className="text-purple-500 animate-pulse mb-4" />
                    <p className="text-white font-bold animate-pulse">AI가 최적의 구도를 찾는 중...</p>
                </div>
            )}
            
            {/* Editor Modal */}
            {editingImageIndex !== null && (
                <ImageEditor 
                    imageSrc={formData.generatedImages[editingImageIndex]}
                    onCancel={() => setEditingImageIndex(null)}
                    onSave={(newImageSrc) => {
                        const newImages = [...formData.generatedImages];
                        newImages[editingImageIndex] = newImageSrc;
                        setFormData({ 
                            ...formData, 
                            generatedImages: newImages,
                            selectedImageIndex: editingImageIndex 
                        });
                        setEditingImageIndex(null);
                    }}
                />
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">광고 노출 기간</label>
                <div className="flex gap-2">
                    {[1, 2, 3].map(day => (
                        <button 
                            key={day}
                            onClick={() => setFormData({...formData, duration: day})}
                            className={`flex-1 py-4 rounded-xl border text-sm font-bold transition-all ${formData.duration === day ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}
                        >
                            {day}일간
                        </button>
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">사용 조건 설정</label>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div onClick={() => setFormData({...formData, conditionType: 'NONE'})} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${formData.conditionType === 'NONE' ? 'bg-neutral-800 border-purple-500' : 'border-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.conditionType === 'NONE' ? 'border-purple-500' : 'border-gray-600'}`}>{formData.conditionType === 'NONE' && <div className="w-2 h-2 rounded-full bg-purple-500" />}</div>
                        <span className="text-sm text-gray-200">조건 없음 (권장)</span>
                    </div>
                    <div onClick={() => setFormData({...formData, conditionType: 'ONE_MENU'})} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${formData.conditionType === 'ONE_MENU' ? 'bg-neutral-800 border-purple-500' : 'border-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.conditionType === 'ONE_MENU' ? 'border-purple-500' : 'border-gray-600'}`}>{formData.conditionType === 'ONE_MENU' && <div className="w-2 h-2 rounded-full bg-purple-500" />}</div>
                        <span className="text-sm text-gray-200">1인 1메뉴 주문 필수</span>
                    </div>
                    <div onClick={() => setFormData({...formData, conditionType: 'MIN_ORDER'})} className={`flex flex-col gap-2 p-3 rounded-lg border cursor-pointer ${formData.conditionType === 'MIN_ORDER' ? 'bg-neutral-800 border-purple-500' : 'border-neutral-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.conditionType === 'MIN_ORDER' ? 'border-purple-500' : 'border-gray-600'}`}>{formData.conditionType === 'MIN_ORDER' && <div className="w-2 h-2 rounded-full bg-purple-500" />}</div>
                            <span className="text-sm text-gray-200">최소 주문 금액 설정</span>
                        </div>
                        {formData.conditionType === 'MIN_ORDER' && (
                            <div className="ml-7 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="20,000" 
                                    value={formData.minOrderAmount} 
                                    onChange={(e) => handleNumberChange(e, 'minOrderAmount')} 
                                    className="w-32 bg-black border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500" 
                                />
                                <span className="text-xs text-gray-500">원 이상</span>
                            </div>
                        )}
                    </div>
                </div>
             </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">발행 수량</label>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex gap-2 mb-3">
                     <button onClick={() => setFormData({...formData, quantityMode: 'LIMITED'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.quantityMode === 'LIMITED' ? 'bg-neutral-700 text-white' : 'text-gray-500'}`}>수량 제한</button>
                     <button onClick={() => setFormData({...formData, quantityMode: 'UNLIMITED'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.quantityMode === 'UNLIMITED' ? 'bg-neutral-700 text-white' : 'text-gray-500'}`}>무제한</button>
                </div>
                {formData.quantityMode === 'LIMITED' && (
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                        <button onClick={() => setFormData(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))} className="p-2 text-gray-400 hover:text-white"><Plus className="rotate-45" size={20}/></button>
                        <div className="flex-1 text-center"><span className="text-xl font-bold text-white">{formData.quantity}</span><span className="text-xs text-gray-500 ml-1">매</span></div>
                        <button onClick={() => setFormData(prev => ({...prev, quantity: prev.quantity + 1}))} className="p-2 text-gray-400 hover:text-white"><Plus size={20}/></button>
                    </div>
                )}
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">쿠폰 마감 시간</label>
                 <select value={formData.expiryTime} onChange={(e) => setFormData({...formData, expiryTime: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white font-bold focus:border-purple-500 focus:outline-none appearance-none">
                     <option value="14:00">점심 (14:00 마감)</option>
                     <option value="20:00">저녁 (20:00 마감)</option>
                     <option value="23:59">영업 종료 시까지</option>
                 </select>
             </div>
        </div>
    );

    const renderStep4 = () => (
         <div className="space-y-6 animate-fade-in flex flex-col items-center justify-center h-full text-center">
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle size={40} className="text-green-500" />
             </div>
             <h2 className="text-2xl font-black text-white">설정 완료!</h2>
             <p className="text-gray-400 text-sm mb-6">모든 정보가 입력되었습니다.<br/>미리보기를 통해 확인 후 발행해주세요.</p>
             <button onClick={() => setShowPreview(true)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-neutral-700">
                 <Eye size={20} /> 사용자 화면 미리보기
             </button>
         </div>
    );

  // --- TAB RENDERERS ---
  const renderAdRegistrationWizard = () => {
    // Check login first
    if (authState !== 'LOGGED_IN') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                     <Store size={32} className="text-gray-600" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
                 <p className="text-sm text-gray-500 mb-8">광고를 등록하려면 먼저 로그인하거나 매장을 등록해주세요.</p>
                 <button 
                    onClick={() => setCurrentTab(MerchantTab.PROFILE)}
                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl"
                 >
                     로그인 / 회원가입 하러가기
                 </button>
            </div>
        );
    }
    
    // Navigation Handlers for Wizard
    const goNext = () => {
        if (step < 4) setStep(step + 1);
        else {
            const newDeal: Deal = {
                id: `deal-custom-${Date.now()}`,
                title: formData.title,
                originalPrice: parseNum(formData.originalPrice) || 0,
                discountAmount: formData.benefitType === 'DISCOUNT' ? parseNum(formData.benefitValue) : 0,
                imageUrl: formData.generatedImages[formData.selectedImageIndex],
                totalCoupons: formData.quantity,
                remainingCoupons: formData.quantity,
                expiresAt: new Date(Date.now() + 86400000), // Default 24h
                status: 'ACTIVE',
                benefitType: formData.benefitType,
                customBenefit: formData.benefitType === 'CUSTOM' ? formData.benefitValue : undefined,
                restaurant: {
                    id: `rest-${Date.now()}`,
                    name: signupForm.storeName || "내 매장",
                    category: signupForm.category,
                    distance: 10,
                    rating: 5.0,
                    reviewCount: 0,
                    location: { lat: 35.1534 + (Math.random() * 0.002 - 0.001), lng: 126.8514 + (Math.random() * 0.002 - 0.001) }
                },
                usageCondition: formData.conditionType === 'MIN_ORDER' ? `${new Intl.NumberFormat('ko-KR').format(parseNum(formData.minOrderAmount))}원 이상 주문 시` : undefined,
                initialComments: generateContextComments(signupForm.category, formData.title)
            };
            addDeal(newDeal);
            alert("광고가 성공적으로 등록되었습니다!\n사용자 앱에서 바로 확인할 수 있습니다.");
            onBackToHome();
        }
    };
    const goBack = () => { if (step > 1) setStep(step - 1); };

    return (
        <div className="w-full h-full flex flex-col p-6 pb-24 relative">
            {renderWizardHeader()}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>
            <div className="pt-4 flex gap-3">
                {step > 1 && <button onClick={goBack} className="px-6 py-4 rounded-xl bg-neutral-800 text-gray-400 font-bold hover:bg-neutral-700 transition-colors">이전</button>}
                <button onClick={goNext} disabled={!isStepValid()} className="flex-1 py-4 rounded-xl bg-purple-600 text-white font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:bg-purple-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100">{step === 4 ? '광고 발행하기' : '다음'}</button>
            </div>
            {showPreview && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-50">
                        <span className="text-white font-bold">미리보기</span>
                        <button onClick={() => setShowPreview(false)} className="p-2 bg-neutral-800 rounded-full text-white"><X size={20} /></button>
                    </div>
                    <div className="flex-1 relative"><DealScreen deal={getPreviewDeal()} /></div>
                </div>
            )}
        </div>
    );
  };

  const renderProfileTab = () => {
    if (authState === 'LOGGED_IN') {
        return (
            <div className="w-full h-full p-6 pb-24 flex flex-col">
                <div className="mb-8 text-center">
                    <div className="w-20 h-20 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-neutral-700">
                        <Store size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{signupForm.storeName}</h2>
                    <p className="text-sm text-gray-500">{signupForm.category} · 사장님</p>
                </div>
                
                <div className="space-y-4">
                     <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                         <span className="text-sm text-gray-400">사업자 등록번호</span>
                         <span className="text-white font-bold">{loginBusinessNum || signupForm.businessRegNumber}</span>
                     </div>
                     <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                         <span className="text-sm text-gray-400">등록된 주소</span>
                         <span className="text-white font-bold text-xs">{signupForm.address || "주소 미입력"}</span>
                     </div>
                </div>

                <div className="mt-auto">
                    <button 
                        onClick={() => { setAuthState('LOGGED_OUT'); setLoginPw(''); }}
                        className="w-full py-4 bg-neutral-900 text-red-400 font-bold rounded-xl border border-neutral-800 hover:bg-neutral-800"
                    >
                        로그아웃
                    </button>
                    <button 
                        onClick={onBackToHome}
                        className="w-full mt-3 py-4 text-gray-500 font-medium text-xs underline"
                    >
                        메인 화면으로 나가기
                    </button>
                </div>
            </div>
        );
    }

    if (authState === 'SIGNING_UP') {
        return (
            <div className="w-full h-full p-6 pb-24 flex flex-col overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => setAuthState('LOGGED_OUT')} className="p-2 text-white"><ArrowLeft size={20}/></button>
                    <h2 className="text-xl font-bold text-white">매장 등록 (회원가입)</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">매장명</label>
                        <input type="text" value={signupForm.storeName} onChange={(e) => setSignupForm({...signupForm, storeName: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="매장 이름을 입력하세요" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">사업자 등록번호</label>
                        <input type="text" value={signupForm.businessRegNumber} onChange={(e) => setSignupForm({...signupForm, businessRegNumber: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="10자리 숫자" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">비밀번호</label>
                        <input type="password" value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="비밀번호 설정" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
                        <select value={signupForm.category} onChange={(e) => setSignupForm({...signupForm, category: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none">
                            <option value="한식">한식</option>
                            <option value="일식">일식</option>
                            <option value="중식">중식</option>
                            <option value="양식">양식</option>
                            <option value="카페/디저트">카페/디저트</option>
                            <option value="술집">술집</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">매장 주소</label>
                        <input type="text" value={signupForm.address} onChange={(e) => setSignupForm({...signupForm, address: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="상세 주소 입력" />
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={() => {
                            if(!signupForm.storeName || !signupForm.businessRegNumber || !signupForm.password) return alert("필수 정보를 모두 입력해주세요.");
                            setAuthState('LOGGED_IN');
                            setLoginBusinessNum(signupForm.businessRegNumber);
                        }}
                        className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500"
                    >
                        등록 완료 및 시작하기
                    </button>
                </div>
            </div>
        );
    }

    // Default: Login View
    return (
        <div className="w-full h-full p-8 flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-neutral-900 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-neutral-800 rotate-45">
                <Store size={40} className="text-purple-500 -rotate-45" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">사장님 로그인</h1>
            <p className="text-gray-500 text-xs mb-8">등록된 사업자 번호로 로그인해주세요.</p>

            <div className="space-y-4 w-full mb-6">
                <input 
                    type="text" 
                    placeholder="사업자 등록번호" 
                    value={loginBusinessNum}
                    onChange={(e) => setLoginBusinessNum(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                />
                <input 
                    type="password" 
                    placeholder="비밀번호" 
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                />
            </div>

            <button 
                onClick={() => {
                    if (loginBusinessNum && loginPw) setAuthState('LOGGED_IN');
                    else alert('정보를 입력해주세요.');
                }}
                className="w-full py-4 bg-white text-black font-bold rounded-xl mb-4 hover:bg-gray-200 transition-colors"
            >
                로그인
            </button>
            
            <button 
                onClick={() => setAuthState('SIGNING_UP')}
                className="text-gray-500 text-xs underline"
            >
                아직 계정이 없으신가요? 매장 등록하기
            </button>

            <button 
                onClick={onBackToHome}
                className="absolute bottom-8 left-0 right-0 text-gray-600 text-[10px]"
            >
                메인으로 돌아가기
            </button>
        </div>
    );
  };

  return (
    <div className="bg-neutral-900 min-h-screen w-full flex justify-center items-center">
      <div className="w-full max-w-md h-[100dvh] bg-black relative shadow-2xl overflow-hidden md:rounded-3xl border-gray-800 md:border-4 flex flex-col">
        {/* Content based on Tab */}
        <div className="flex-1 overflow-hidden relative">
            {currentTab === MerchantTab.AD_REGISTER && renderAdRegistrationWizard()}
            {currentTab === MerchantTab.DASHBOARD && (
                <DashboardScreen 
                    authState={authState} 
                    storeName={signupForm.storeName}
                    onNavigateToAd={() => setCurrentTab(MerchantTab.AD_REGISTER)}
                    onCopyDeal={handleCopyDeal}
                />
            )}
            {currentTab === MerchantTab.PROFILE && renderProfileTab()}
        </div>

        {/* Navigation */}
        <MerchantNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </div>
  );
};
