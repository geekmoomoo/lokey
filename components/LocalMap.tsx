import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Navigation, MapPin, Target, Crosshair, Compass } from 'lucide-react';
import { Deal, Coupon } from '../types';

interface LocalMapProps {
  onClose: () => void;
  deals: Deal[];
  myCoupons: Coupon[];
}

export const LocalMap: React.FC<LocalMapProps> = ({ onClose, deals, myCoupons }) => {
  const [scale, setScale] = useState(1.2);
  
  // State for Panning (Dragging the map)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 }); // Store initial click position relative to current offset

  // Mock User Center (approx Gwangju Sangmu District)
  const CENTER = { lat: 35.1534, lng: 126.8514 };

  // Scale factors for visual representation
  const LAT_SCALE = 12000;
  const LNG_SCALE = 9500;

  // --- DRAG HANDLERS ---
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    // Record where the click happened relative to the current map position
    dragStart.current = { 
        x: clientX - offset.x, 
        y: clientY - offset.y 
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
        x: clientX - dragStart.current.x,
        y: clientY - dragStart.current.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handlePointerDown(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY);
  const onMouseUp = () => handlePointerUp();
  const onMouseLeave = () => handlePointerUp();

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handlePointerUp();

  // Reset View Handler
  const resetView = () => {
      setOffset({ x: 0, y: 0 });
      setScale(1.2);
  };

  const markers = useMemo(() => {
    // 1. Process Deals (Unvisited / Available)
    const dealMarkers = deals.map(deal => {
      const isOwned = myCoupons.some(c => c.dealId === deal.id && c.status === 'AVAILABLE');
      const isVisited = myCoupons.some(c => c.dealId === deal.id && c.status === 'USED');
      
      if (isVisited) return null;

      return {
        id: deal.id,
        name: deal.restaurant.name,
        type: isOwned ? 'OWNED' : 'DEAL',
        // Invert X because latitude goes up (North) but screen Y goes down
        y: -(deal.restaurant.location.lat - CENTER.lat) * LAT_SCALE,
        x: (deal.restaurant.location.lng - CENTER.lng) * LNG_SCALE,
        data: deal
      };
    }).filter(Boolean) as any[];

    // 2. Process Visited Coupons
    const visitedMarkers = myCoupons
      .filter(c => c.status === 'USED')
      .map(c => ({
        id: c.id,
        name: c.restaurantName,
        type: 'VISITED',
        y: -(c.location.lat - CENTER.lat) * LAT_SCALE,
        x: (c.location.lng - CENTER.lng) * LNG_SCALE,
        data: c
      }));

    return [...dealMarkers, ...visitedMarkers];
  }, [deals, myCoupons]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white animate-fade-in flex flex-col select-none touch-none">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <div>
           <div className="flex items-center gap-2 mb-1">
                <Compass className="text-yellow-500 animate-spin-slow" size={20} />
                <h1 className="text-xl font-black text-white tracking-wider">LOCAL RADAR</h1>
           </div>
           <div className="flex items-center gap-2 text-[10px] text-yellow-500/80 font-mono">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span>LIVE SIGNAL ACTIVE</span>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 text-white pointer-events-auto active:scale-95 transition-transform"
        >
          <X size={24} />
        </button>
      </div>

      {/* --- MAP INTERACTIVE AREA --- */}
      <div 
        className="flex-1 relative overflow-hidden bg-neutral-950 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        {/* Static Background Grid (Does not move with map for parallax effect, or moves slightly) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div 
             className="absolute inset-0 bg-[linear-gradient(rgba(50,50,50,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(50,50,50,0.5)_1px,transparent_1px)] bg-[size:40px_40px]"
             style={{ backgroundPosition: `${offset.x % 40}px ${offset.y % 40}px` }} 
           ></div>
        </div>

        {/* Rotating Radar Sweep (Centered on Screen) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden flex items-center justify-center">
            <div className="w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(234,179,8,0.1)_360deg)] rounded-full animate-radar-spin opacity-30"></div>
            {/* Range Circles */}
            <div className="absolute inset-0 border border-yellow-900/30 rounded-full w-[200px] h-[200px] m-auto"></div>
            <div className="absolute inset-0 border border-yellow-900/30 rounded-full w-[400px] h-[400px] m-auto"></div>
            <div className="absolute inset-0 border border-yellow-900/30 rounded-full w-[600px] h-[600px] m-auto"></div>
        </div>

        {/* --- MOVABLE MAP CONTENT --- */}
        <div 
            className="absolute left-1/2 top-1/2 w-0 h-0"
            style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
        >
            {/* User Center Marker (Always at 0,0 relative to map origin) */}
            <div className="absolute left-0 top-0 w-0 h-0 flex items-center justify-center z-10">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"></div>
                    <div className="absolute w-32 h-32 bg-blue-500/10 rounded-full animate-ping"></div>
                    <div className="absolute mt-8 bg-blue-900/80 text-[8px] px-2 py-0.5 rounded text-blue-200 font-bold whitespace-nowrap backdrop-blur-sm border border-blue-500/30">
                    MY LOCATION
                    </div>
            </div>

            {/* Markers */}
            {markers.map((marker, idx) => (
                <div 
                    key={`${marker.type}-${marker.id}`}
                    className="absolute w-0 h-0 flex items-center justify-center"
                    style={{ transform: `translate(${marker.x}px, ${marker.y}px)` }}
                >
                    {marker.type === 'VISITED' ? (
                        // Visited: Bright Light
                        <div className="group relative flex flex-col items-center cursor-pointer hover:scale-125 transition-transform z-20">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse"></div>
                            <div className="absolute w-8 h-8 bg-yellow-500/20 rounded-full animate-pulse delay-75"></div>
                            <div className="absolute -top-8 text-[9px] font-bold text-yellow-300 bg-black/80 px-2 py-1 rounded backdrop-blur-sm border border-yellow-500/30 whitespace-nowrap shadow-lg">
                                {marker.name}
                            </div>
                        </div>
                    ) : marker.type === 'OWNED' ? (
                            // Owned: Solid Ticket Icon
                            <div className="group relative flex flex-col items-center cursor-pointer hover:scale-125 transition-transform z-20">
                            <MapPin size={24} className="text-white fill-green-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
                            <div className="absolute -top-7 text-[9px] font-medium text-white bg-green-900/80 px-2 py-0.5 rounded border border-green-500/30 whitespace-nowrap">
                                {marker.name}
                            </div>
                            </div>
                    ) : (
                        // Deal: Dim Dot
                            <div className="group relative flex flex-col items-center cursor-pointer hover:scale-150 transition-transform hover:z-30">
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full group-hover:bg-white group-hover:shadow-[0_0_10px_white] transition-all"></div>
                            <div className="absolute -top-6 text-[8px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
                                {marker.name}
                            </div>
                            </div>
                    )}
                </div>
            ))}
        </div>
        
        {/* Zoom & Reset Controls */}
        <div className="absolute bottom-8 right-6 flex flex-col gap-2 z-30 pointer-events-auto">
            <button 
               onClick={() => setScale(s => Math.min(s + 0.5, 4))}
               className="w-10 h-10 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full text-white flex items-center justify-center active:bg-neutral-800 shadow-lg"
            >
                +
            </button>
            <button 
               onClick={() => setScale(s => Math.max(s - 0.5, 0.5))}
               className="w-10 h-10 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full text-white flex items-center justify-center active:bg-neutral-800 shadow-lg"
            >
                -
            </button>
            <button 
               onClick={resetView}
               className="w-10 h-10 bg-yellow-600/90 backdrop-blur border border-yellow-500/30 rounded-full text-white flex items-center justify-center active:bg-yellow-700 shadow-xl mt-2 animate-bounce-subtle"
            >
                <Crosshair size={20} />
            </button>
        </div>
        
        {/* Legend Panel */}
        <div className="absolute bottom-8 left-6 z-30 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
             <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-[0_0_5px_blue]"></div>
                 <span className="text-[10px] text-gray-200 font-medium">내 위치 (You)</span>
             </div>
             <div className="flex items-center gap-2">
                 <MapPin size={12} className="text-white fill-green-600" />
                 <span className="text-[10px] text-gray-200 font-medium">보유 티켓 (Ticket)</span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_5px_yellow]"></div>
                 <span className="text-[10px] text-gray-200 font-medium">방문 완료 (Visited)</span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
                 <span className="text-[10px] text-gray-400">히든 스팟 (Hidden)</span>
             </div>
        </div>

      </div>
      
      <style>{`
        .animate-radar-spin { animation: radarSpin 6s linear infinite; }
        .animate-spin-slow { animation: radarSpin 10s linear infinite; }
        @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-bounce-subtle { animation: bounceSubtle 2s infinite; }
        @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};