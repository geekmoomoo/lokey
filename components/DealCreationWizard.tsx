import React, { useState, useRef } from 'react';
import { Deal, MerchantTab } from '@shared/types';
import { ImageEditor } from './ImageEditor';
import { DealScreen } from './DealScreen';
import {
    Wand2, Eye, Camera, Plus, CheckCircle, X, Megaphone, Palette, Crop,
    ArrowLeft
} from 'lucide-react';
import { addDeal, generateContextComments, uploadImageToStorage } from '@shared/services/dealService';
import { generateImage } from '@shared/services/apiService';

const STEPS = ['기본 정보', '이미지 설정', '운영 설정', '확인 및 발행'];

const STYLE_PRESETS = [
    { id: 'NATURAL', label: '자연스러운(Natural)', desc: '밝은 자연광, 신선함 강조', prompt: 'Natural sunlight, bright and airy, fresh ingredients, soft shadows, organic feel' },
    { id: 'LUXURY', label: '고급스러운(Luxury)', desc: '어두운 배경, 핀 조명', prompt: 'Dark moody background, dramatic cinematic lighting, rim light, fine dining elegant atmosphere' },
    { id: 'VIVID', label: '생생한(Vivid)', desc: '높은 채도, 강렬한 색감', prompt: 'High saturation, vibrant colors, pop art style lighting, energetic and delicious look' },
];

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

interface DealCreationWizardProps {
    step: number;
    setStep: (step: number) => void;
    formData: typeof INITIAL_FORM;
    setFormData: (data: typeof INITIAL_FORM) => void;
    onBackToHome: () => void;
    storeName: string;
    category: string;
    merchantId?: string;
    setCurrentTab: (tab: MerchantTab) => void;
}

export const DealCreationWizard: React.FC<DealCreationWizardProps> = ({
    step, setStep, formData, setFormData, onBackToHome, storeName, category, merchantId, setCurrentTab
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    const [originalGeneratedImages, setOriginalGeneratedImages] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const formatted = raw ? Number(raw).toLocaleString() : '';
        setFormData(prev => ({ ...prev, [field]: formatted }));
    };

    const parseNum = (str: string) => Number(str.replace(/,/g, '')) || 0;

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

    const compressImage = async (base64Image: string, maxSizeMB: number = 2.0): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();

            // 타임아웃 추가
            const timeout = setTimeout(() => {
                console.log('Image compression timeout, using original');
                resolve(base64Image);
            }, 10000);

            img.onload = () => {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(base64Image);
                    return;
                }

                // 이미지 크기 최적화 (더 작은 크기로)
                const maxWidth = 800;
                const maxHeight = 1200;
                let { width, height } = img;

                // 비율 유지하며 리사이징
                if (width > maxWidth || height > maxHeight) {
                    const widthRatio = maxWidth / width;
                    const heightRatio = maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio);

                    width = width * ratio;
                    height = height * ratio;
                }

                // 캔버스 크기는 정수로 설정
                canvas.width = Math.round(width);
                canvas.height = Math.round(height);

                // 이미지 품질 설정
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 초기 품질 0.75에서 시작하여 점진적으로 낮춤
                const tryQuality = (quality: number): string => {
                    return canvas.toDataURL('image/webp', quality);
                };

                const estimateSize = (dataUrl: string): number => {
                    const base64 = dataUrl.split(',')[1];
                    return (base64.length * 0.75) / (1024 * 1024);
                };

                let compressedBase64 = tryQuality(0.75);
                let quality = 0.75;

                // 목표 크기에 도달할 때까지 품질 낮추기
                while (estimateSize(compressedBase64) > maxSizeMB && quality > 0.3) {
                    quality -= 0.05;
                    compressedBase64 = tryQuality(quality);
                }

                const originalSize = estimateSize(base64Image);
                const compressedSize = estimateSize(compressedBase64);

                console.log(`Image compressed: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${((1 - compressedSize/originalSize) * 100).toFixed(0)}% reduction, quality: ${(quality * 100).toFixed(0)}%)`);

                // 압축이 효과가 없으면 원본 사용
                if (compressedSize >= originalSize * 0.95) {
                    console.log('Compression ineffective, using original');
                    resolve(base64Image);
                } else {
                    resolve(compressedBase64);
                }
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(base64Image);
            };

            img.crossOrigin = 'anonymous';
            img.src = base64Image;
        });
    };

    const constructOptimizedPrompt = (userInput: string, styleId: string) => {
        const selectedStyle = STYLE_PRESETS.find(s => s.id === styleId) || STYLE_PRESETS[0];

        return `
          Role: World-class Food Photographer.
          Subject: ${userInput}.

          COMPOSITION RULES (CRITICAL):
          1. Aspect Ratio: Vertical (9:16).
          2. SUBJECT POSITION: Place the main food subject CLEARLY in the TOP 40-50% of the frame. The food MUST be placed high up.
          3. NEGATIVE SPACE: The bottom 50% of the image MUST be relatively empty, blurred (bokeh), or have a clean surface (tabletop) to ensure text overlay is readable. Do NOT put important details at the bottom.
          4. FRAMING: Medium-wide shot. Show the full dish/plate with some extra space around it. Zoom out slightly to ensure the entire food context is visible.
          5. ANGLE: 45-degree angle or slight top-down view.

          STYLE & LIGHTING:
          ${selectedStyle.prompt}

          QUALITY & SIZE OPTIMIZATION:
          - Resolution: 1024x1792 (9:16 ratio optimized for web)
          - File size: Under 2MB compressed
          - Format: Optimized for web delivery
          - Color space: sRGB for web compatibility
          - Professional food photography quality with efficient compression
          - Clear details but optimized for mobile display
          8k resolution, highly detailed texture, professional color grading, appetizing, michelin star presentation.

          CREATIVE ENHANCEMENT:
          - Soft window light creating natural, warm atmosphere
          - Cinematic lighting with dramatic shadows
          - Macro lens quality with f/1.8 for stunning depth of field
          - High angle shot for appetizing food presentation
          - Professional lighting setup
          - Premium color grading with accurate food representation
        `;
    };

    const handleAIAction = async (mode: 'GENERATE' | 'ENHANCE', input?: File) => {
        setIsGenerating(true);
        try {
            if (mode === 'GENERATE') {
                const prompt = constructOptimizedPrompt(formData.imagePrompt, formData.imageStyle);

                console.log('🎨 안전한 백엔드 API로 이미지 생성 시작:', { prompt: prompt.substring(0, 50) + '...', style: formData.imageStyle });

                const imageUrl = await generateImage(prompt, formData.imageStyle);

                if (imageUrl) {
                    console.log('✅ 백엔드 API 이미지 생성 성공');

                    try {
                        const compressedBase64 = await compressImage(imageUrl, 2.0);
                        const uploadedUrl = await uploadImageToStorage(compressedBase64, 'ai-generated-0');

                        if (uploadedUrl) {
                            console.log('📤 이미지 업로드 성공:', uploadedUrl);
                            setFormData(prev => ({ ...prev, generatedImages: [uploadedUrl], selectedImageIndex: 0 }));
                            setOriginalGeneratedImages([uploadedUrl]);
                        } else {
                            console.log('⚠️ 업로드 실패, 생성된 이미지 직접 사용');
                            setFormData(prev => ({ ...prev, generatedImages: [imageUrl], selectedImageIndex: 0 }));
                            setOriginalGeneratedImages([imageUrl]);
                        }
                    } catch (uploadError) {
                        console.error('이미지 업로드 오류:', uploadError);
                        setFormData(prev => ({ ...prev, generatedImages: [imageUrl], selectedImageIndex: 0 }));
                        setOriginalGeneratedImages([imageUrl]);
                    }
                } else {
                    throw new Error('백엔드 API에서 이미지를 생성하지 못했습니다.');
                }
            } else if (mode === 'ENHANCE' && input) {
                alert('이미지 개선 기능은 현재 개발 중입니다. 이미지 생성 기능을 먼저 사용해보세요.');
                return;
            }

        } catch (error) {
            console.error("❌ AI 이미지 생성 실패 (백엔드 API):", error);
            alert("이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleAIAction('ENHANCE', file);
    };

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
            expiresAt: new Date(Date.now() + formData.duration * 24 * 3600 * 1000),
            status: 'ACTIVE',
            benefitType: formData.benefitType,
            customBenefit: formData.benefitType === 'CUSTOM' ? formData.benefitValue : undefined,
            restaurant: {
                id: 'my-store',
                name: storeName || '내 매장 이름',
                category: category || '카테고리',
                distance: 10,
                rating: 5.0,
                reviewCount: 0,
                location: { lat: 0, lng: 0 }
            },
            usageCondition: finalCondition,
            initialComments: ["맛있겠다", "오픈런각"]
        };
    };

    const renderWizardHeader = () => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black text-white">광고 등록</h1>
                <span className="text-purple-400 font-bold text-sm">Step {step}/4</span>
            </div>
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

            {editingImageIndex !== null && (
                <ImageEditor
                    imageSrc={formData.generatedImages[editingImageIndex]}
                    originalImageSrc={originalGeneratedImages[editingImageIndex] || formData.generatedImages[editingImageIndex]}
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

    const goNext = () => {
        if (step < 4) setStep(step + 1);
        else {
            const generateUUID = (): string => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            const newDeal: Deal = {
                id: `deal-custom-${Date.now()}`,
                title: formData.title,
                originalPrice: parseNum(formData.originalPrice) || 0,
                discountAmount: formData.benefitType === 'DISCOUNT' ? parseNum(formData.benefitValue) : 0,
                imageUrl: formData.generatedImages[formData.selectedImageIndex],
                totalCoupons: formData.quantity,
                remainingCoupons: formData.quantity,
                expiresAt: new Date(Date.now() + formData.duration * 24 * 3600 * 1000),
                status: 'ACTIVE',
                benefitType: formData.benefitType,
                customBenefit: formData.benefitType === 'CUSTOM' ? formData.benefitValue : undefined,
                restaurant: {
                    id: merchantId || generateUUID(),
                    name: storeName || "내 매장",
                    category: category,
                    distance: 10,
                    rating: 5.0,
                    reviewCount: 0,
                    location: { lat: 35.1534 + (Math.random() * 0.002 - 0.001), lng: 126.8514 + (Math.random() * 0.002 - 0.001) }
                },
                usageCondition: formData.conditionType === 'MIN_ORDER' ? `${new Intl.NumberFormat('ko-KR').format(parseNum(formData.minOrderAmount))}원 이상 주문 시` : undefined,
                initialComments: generateContextComments(category, formData.title)
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