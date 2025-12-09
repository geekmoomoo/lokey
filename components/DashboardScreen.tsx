import React, { useState, useEffect } from 'react';
import { Deal } from '@shared/types';
import { Clock, Plus, Copy, X, BarChart2, Users } from 'lucide-react';
import { fetchMerchantDeals, updateDeal } from '@shared/services/dealService';

interface DashboardScreenProps {
    storeName: string;
    merchantId?: string;
    businessRegNumber?: string;
    onNavigateToAd: () => void;
    onCopyDeal: (deal: Deal) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ storeName, merchantId, businessRegNumber, onNavigateToAd, onCopyDeal }) => {
    const [myDeals, setMyDeals] = useState<Deal[]>([]);
    const [addQtyDeal, setAddQtyDeal] = useState<Deal | null>(null);
    const [qtyToAdd, setQtyToAdd] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ENDED'>('ACTIVE');
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        const loadDealsFromBackend = async () => {
            try {
                const fetchedDeals = await fetchMerchantDeals(merchantId, businessRegNumber);
                setMyDeals(fetchedDeals || []);

                // 만료된 딜 자동 상태 업데이트
                const now = new Date();
                for (const deal of fetchedDeals || []) {
                    if (deal.expiresAt && deal.expiresAt < now && deal.status === 'ACTIVE') {
                        console.log('만료된 딜 자동 상태 변경:', deal.title);
                        await updateDeal(deal.id, { status: 'ENDED' });
                    }
                }
            } catch (error) {
                console.error('딜 데이터 로딩 실패:', error);
            }
            setLastUpdated(new Date());
        };

        loadDealsFromBackend();

        // 30초마다 데이터 새로고침
        const interval = setInterval(loadDealsFromBackend, 30000);
        return () => clearInterval(interval);
    }, [merchantId, businessRegNumber]);

    const activeDeals = myDeals.filter(d => !d.status || d.status === 'ACTIVE');
    const endedDeals = myDeals.filter(d => d.status === 'ENDED' || d.status === 'CANCELED');
    const currentList = activeTab === 'ACTIVE' ? activeDeals : endedDeals;

    const handleStopDeal = (deal: Deal) => {
        if (confirm(`'${deal.title}' 광고를 중단하시겠습니까?\n중단된 광고는 복구할 수 없습니다.`)) {
            updateDeal(deal.id, { status: 'CANCELED', expiresAt: new Date() }).then(() => {
                fetchMerchantDeals(merchantId).then(deals => setMyDeals(deals || []));
            });
        }
    };

    const handleDeleteDeal = (deal: Deal) => {
        if (confirm(`'${deal.title}' 광고를 완전히 삭제하시겠습니까?\n삭제된 광고는 복구할 수 없습니다.`)) {
            // 실제 삭제 대신 상태를 DELETED로 변경 (데이터 보존을 위해)
            updateDeal(deal.id, { status: 'DELETED' }).then(() => {
                fetchMerchantDeals(merchantId).then(deals => setMyDeals(deals || []));
                alert('광고가 삭제되었습니다.');
            });
        }
    };

    const handleAddQuantityConfirm = () => {
        if (addQtyDeal && qtyToAdd) {
            const added = parseInt(qtyToAdd, 10);
            if (added > 0) {
                updateDeal(addQtyDeal.id, {
                    totalCoupons: addQtyDeal.totalCoupons + added,
                    remainingCoupons: addQtyDeal.remainingCoupons + added
                }).then(() => {
                    fetchMerchantDeals().then(deals => setMyDeals(deals || []));
                });
                setAddQtyDeal(null);
                setQtyToAdd('');
                alert('수량이 추가되었습니다.');
            }
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto no-scrollbar p-6 pb-24">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-2xl font-black text-white mb-1">운영 관리</h1>
                    <p className="text-gray-400 text-xs">
                       오늘도 힘찬 하루 되세요, 사장님!
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[10px] font-bold border border-purple-500/30 mb-1">
                        {storeName || "내 매장"}
                    </div>
                    <p className="text-[10px] text-gray-500">
                        마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">진행 중 광고</p>
                    <p className="text-2xl font-black text-white">{activeDeals.length}<span className="text-xs font-normal text-gray-500 ml-1">건</span></p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">총 발행 쿠폰</p>
                    <p className="text-2xl font-black text-white">{myDeals.reduce((sum, deal) => sum + deal.totalCoupons, 0)}<span className="text-xs font-normal text-gray-500 ml-1">개</span></p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">남은 쿠폰</p>
                    <p className="text-2xl font-black text-white">{myDeals.reduce((sum, deal) => sum + deal.remainingCoupons, 0)}<span className="text-xs font-normal text-gray-500 ml-1">개</span></p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">사용률</p>
                    <p className="text-2xl font-black text-white">
                        {myDeals.length > 0 ? Math.round((1 - myDeals.reduce((sum, deal) => sum + deal.remainingCoupons, 0) / myDeals.reduce((sum, deal) => sum + deal.totalCoupons, 0)) * 100) : 0}<span className="text-xs font-normal text-gray-500 ml-1">%</span>
                    </p>
                </div>
            </div>

            {/* 사용률 차트 */}
            {myDeals.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-white">쿠폰 사용 현황</h3>
                        <span className="text-xs text-gray-400">총 {myDeals.reduce((sum, deal) => sum + deal.totalCoupons, 0)}개 발행</span>
                    </div>
                    <div className="space-y-2">
                        {myDeals.slice(0, 3).map(deal => {
                            const usageRate = deal.totalCoupons > 0 ? (deal.totalCoupons - deal.remainingCoupons) / deal.totalCoupons : 0;
                            const percentage = Math.round(usageRate * 100);
                            return (
                                <div key={deal.id} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white truncate flex-1 mr-2">{deal.title}</span>
                                        <span className="text-xs text-gray-400">{percentage}% ({deal.totalCoupons - deal.remainingCoupons}/{deal.totalCoupons})</span>
                                    </div>
                                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                percentage >= 80 ? 'bg-red-500' :
                                                percentage >= 50 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {myDeals.length > 3 && (
                            <p className="text-xs text-gray-500 text-center pt-1">
                                그 외 {myDeals.length - 3}개 광고 더 있음
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div onClick={onNavigateToAd} className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-center cursor-pointer hover:bg-purple-900/30 transition-colors mb-6">
                 <Plus size={24} className="text-purple-400 mr-2" />
                 <p className="text-sm font-bold text-purple-300">새 광고 등록</p>
            </div>

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

            <div className="space-y-4 pb-12">
                {currentList.length === 0 ? (
                    <div className="py-12 text-center text-gray-600 text-xs">
                        {activeTab === 'ACTIVE' ? '현재 진행 중인 광고가 없습니다.' : '종료된 광고 내역이 없습니다.'}
                    </div>
                ) : (
                    currentList.map(deal => (
                        <div key={deal.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
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

                                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${(deal.remainingCoupons / deal.totalCoupons) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px]">
                                        <span className="text-purple-400 font-bold">{deal.remainingCoupons}개 남음</span>
                                        <span className="text-gray-600">총 {deal.totalCoupons}개</span>
                                    </div>
                                </div>
                            </div>

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
                                            onClick={() => setEditingDeal(deal)}
                                            className="flex-1 bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 text-xs font-bold py-2 rounded-lg transition-colors border border-blue-500/20"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleStopDeal(deal)}
                                            className="flex-1 bg-neutral-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 text-xs font-bold py-2 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                                        >
                                            중단
                                        </button>
                                        <button
                                            onClick={() => onCopyDeal(deal)}
                                            className="flex-1 bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 text-xs font-bold py-2 rounded-lg transition-colors border border-purple-500/20"
                                        >
                                            복사
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onCopyDeal(deal)}
                                            className="flex-1 bg-purple-900/20 hover:bg-purple-900/30 text-purple-400 text-xs font-bold py-2 rounded-lg transition-colors border border-purple-500/20 flex items-center justify-center gap-2"
                                        >
                                            <Copy size={12} />
                                            복사
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDeal(deal)}
                                            className="flex-1 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors border border-red-500/20"
                                        >
                                            삭제
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

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

            {editingDeal && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setEditingDeal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                        <h3 className="text-white font-bold text-lg mb-1">광고 수정</h3>
                        <p className="text-xs text-gray-400 mb-6">{editingDeal.title}</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">상품명</label>
                                <input
                                    type="text"
                                    defaultValue={editingDeal.title}
                                    id="edit-title"
                                    className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">정상 가격 (원)</label>
                                <input
                                    type="number"
                                    defaultValue={editingDeal.originalPrice}
                                    id="edit-original-price"
                                    className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                />
                            </div>

                            {editingDeal.benefitType === 'DISCOUNT' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">할인 금액 (원)</label>
                                    <input
                                        type="number"
                                        defaultValue={editingDeal.discountAmount}
                                        id="edit-discount"
                                        className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                    />
                                </div>
                            )}

                            {editingDeal.benefitType === 'CUSTOM' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">혜택 내용</label>
                                    <input
                                        type="text"
                                        defaultValue={editingDeal.customBenefit || ''}
                                        id="edit-custom-benefit"
                                        className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">추가할 수량 (매)</label>
                                <input
                                    type="number"
                                    id="edit-add-quantity"
                                    placeholder="0"
                                    className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">현재 {editingDeal.remainingCoupons}/{editingDeal.totalCoupons}개</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">기간 연장 (일)</label>
                                <select
                                    id="edit-extend-days"
                                    className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:border-purple-500 outline-none"
                                >
                                    <option value="0">연장하지 않음</option>
                                    <option value="1">1일</option>
                                    <option value="2">2일</option>
                                    <option value="3">3일</option>
                                    <option value="7">7일</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setEditingDeal(null)} className="flex-1 py-3 bg-neutral-800 rounded-xl text-gray-400 font-bold text-sm">취소</button>
                            <button onClick={async () => {
                                const title = (document.getElementById('edit-title') as HTMLInputElement).value;
                                const originalPrice = parseInt((document.getElementById('edit-original-price') as HTMLInputElement).value) || 0;
                                const discount = parseInt((document.getElementById('edit-discount') as HTMLInputElement)?.value || '0');
                                const customBenefit = (document.getElementById('edit-custom-benefit') as HTMLInputElement)?.value;
                                const addQuantity = parseInt((document.getElementById('edit-add-quantity') as HTMLInputElement).value) || 0;
                                const extendDays = parseInt((document.getElementById('edit-extend-days') as HTMLSelectElement).value) || 0;

                                const updates: any = { title, originalPrice };

                                if (editingDeal.benefitType === 'DISCOUNT') {
                                    updates.discountAmount = discount;
                                }
                                if (editingDeal.benefitType === 'CUSTOM') {
                                    updates.customBenefit = customBenefit;
                                }

                                if (addQuantity > 0) {
                                    updates.totalCoupons = editingDeal.totalCoupons + addQuantity;
                                    updates.remainingCoupons = editingDeal.remainingCoupons + addQuantity;
                                }

                                if (extendDays > 0) {
                                    const newExpiresAt = new Date(editingDeal.expiresAt);
                                    newExpiresAt.setDate(newExpiresAt.getDate() + extendDays);
                                    updates.expiresAt = newExpiresAt;
                                }

                                await updateDeal(editingDeal.id, updates);
                                fetchMerchantDeals(merchantId).then(deals => setMyDeals(deals || []));
                                alert('광고가 수정되었습니다.');
                                setEditingDeal(null);
                            }} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold text-sm">수정 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};