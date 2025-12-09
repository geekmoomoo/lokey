import React, { useState, useRef } from 'react';
import { X, Eye, EyeOff, RotateCcw, Move, ZoomIn, Crop } from 'lucide-react';

interface ImageEditorProps {
    imageSrc: string;
    originalImageSrc: string;
    onSave: (newImageSrc: string) => void;
    onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, originalImageSrc, onSave, onCancel }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showGuides, setShowGuides] = useState(true);
    const dragStart = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragStart.current = { x: clientX - position.x, y: clientY - position.y };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
    };

    const handlePointerUp = () => setIsDragging(false);

    const handleSave = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const container = containerRef.current;
        if (!canvas || !img || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const OUTPUT_WIDTH = 1080;
        const OUTPUT_HEIGHT = 1920;

        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;

        const cw = container.clientWidth;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        const outputScale = OUTPUT_WIDTH / cw;

        ctx.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);
        ctx.translate(position.x * outputScale, position.y * outputScale);
        ctx.scale(scale, scale);

        const drawWidth = OUTPUT_WIDTH;
        const drawHeight = (img.naturalHeight / img.naturalWidth) * OUTPUT_WIDTH;

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onSave(base64);
    };

    return (
        <>
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                    }

                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }

                @media not print {
                    .print-only {
                        display: none !important;
                    }
                }
            `}</style>
            <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in select-none">
                <div className="flex justify-between items-center p-4 bg-black z-10 border-b border-neutral-800 no-print">
                <button onClick={onCancel} className="text-gray-400 p-2 hover:text-white"><X /></button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-sm">이미지 편집</span>
                    <span className="text-[10px] text-gray-500">드래그하여 위치 이동 / 하단 바로 확대</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (imageSrc !== originalImageSrc) {
                                onSave(originalImageSrc);
                            }
                        }}
                        className={`text-sm font-medium p-2 transition-colors ${
                            imageSrc === originalImageSrc
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-blue-400 hover:text-blue-300'
                        }`}
                    >
                        원래대로
                    </button>
                    <button onClick={handleSave} className="text-purple-400 font-bold p-2 hover:text-purple-300">완료</button>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative bg-neutral-900 overflow-hidden flex items-center justify-center p-4 print:w-full print:h-screen print:bg-white print:overflow-visible">
                <div
                    ref={containerRef}
                    className="relative bg-black overflow-hidden shadow-2xl border border-neutral-700 ring-1 ring-white/10 print:shadow-none print:border-none print:ring-0"
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
                        crossOrigin="anonymous"
                        src={imageSrc}
                        alt="Edit Target"
                        className="absolute left-1/2 top-1/2 w-full h-auto origin-center pointer-events-none select-none touch-none"
                        style={{
                            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
                        }}
                        onLoad={() => {
                            console.log('Image loaded successfully');
                        }}
                        onError={() => {
                            console.warn('Image failed to load due to CORS error');
                        }}
                    />

                    {showGuides && (
                        <>
                            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70%] aspect-square rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none flex items-center justify-center">
                                 <span className="text-white/90 text-xs font-bold drop-shadow-md bg-black/40 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">핵심 메뉴 위치</span>
                                 <div className="absolute w-4 h-4 border-l-2 border-t-2 border-white/80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-red-500/30 to-transparent border-t border-red-500/30 pointer-events-none flex items-end justify-center pb-4">
                                <span className="text-red-300 text-[10px] font-bold uppercase tracking-widest mb-4 drop-shadow-md">Text Safe Zone</span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={() => setShowGuides(!showGuides)}
                    className="absolute top-6 right-6 z-50 bg-neutral-800/80 backdrop-blur-md p-3 rounded-full text-white hover:bg-neutral-700 border border-white/10 shadow-lg no-print"
                    title={showGuides ? "가이드 숨기기" : "가이드 보기"}
                >
                    {showGuides ? <Eye size={20} /> : <EyeOff size={20} className="text-gray-400" />}
                </button>
            </div>

            <div className="p-6 bg-neutral-900 border-t border-neutral-800 pb-10 safe-area-bottom no-print">
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

            <canvas ref={canvasRef} className="hidden" />
        </div>
        </>
    );
};