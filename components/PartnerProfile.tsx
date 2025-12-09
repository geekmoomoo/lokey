import React, { useState } from 'react';
import { Store, ArrowLeft, Lock, LogOut } from 'lucide-react';
import { usePartnerAuth } from '../contexts/PartnerAuthContext';
import { MerchantTab } from '@shared/types';
import { updatePartner } from '@shared/services/apiService';

interface PartnerProfileProps {
    setCurrentTab: (tab: MerchantTab) => void;
    onBackToHome: () => void;
}

const INITIAL_SIGNUP_FORM = {
    businessRegNumber: '',
    password: '',
    storeName: '',
    storeType: '본점',
    category: 'KOREAN',
    categoryCustom: '',
    address: '',
    storePhone: '',
    ownerName: '',
    ownerPhone: '',
    planType: 'REGULAR' as 'REGULAR' | 'PREMIUM',
};

const formatBusinessNumber = (value: string): string => {
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length !== 10) {
        return numbersOnly;
    }
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 5)}-${numbersOnly.slice(5)}`;
};

export const PartnerProfile: React.FC<PartnerProfileProps> = ({ setCurrentTab, onBackToHome }) => {
    const { partner, logout } = usePartnerAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({...INITIAL_SIGNUP_FORM});
    const [isUpdating, setIsUpdating] = useState(false);
    const [signupForm, setSignupForm] = useState({
        ...INITIAL_SIGNUP_FORM,
        businessRegNumber: partner?.businessRegNumber || '',
        storeName: partner?.storeName || '',
        storeType: partner?.storeType || '본점',
        category: partner?.category || 'KOREAN',
        address: partner?.address || '',
        storePhone: partner?.storePhone || '',
        ownerName: partner?.ownerName || '',
        ownerPhone: partner?.ownerPhone || '',
        planType: partner?.planType || 'REGULAR'
    });

    if (partner) {
        const startEditProfile = () => {
            setEditProfileForm({
                ...signupForm,
                businessRegNumber: partner.businessRegNumber,
            });
            setIsEditingProfile(true);
        };

        const saveProfile = async () => {
            if (!editProfileForm.storeName || !editProfileForm.ownerName || !editProfileForm.ownerPhone) {
                return alert('필수 정보를 모두 입력해주세요.');
            }

            setIsUpdating(true);
            try {
                // Prepare updates object (only send changed fields)
                const updates: Record<string, any> = {};

                if (editProfileForm.storeName !== partner.storeName) updates.storeName = editProfileForm.storeName;
                if (editProfileForm.storeType !== partner.storeType) updates.storeType = editProfileForm.storeType;
                if (editProfileForm.category !== partner.category) updates.category = editProfileForm.category;
                if (editProfileForm.address !== partner.address) updates.address = editProfileForm.address;
                if (editProfileForm.storePhone !== partner.storePhone) updates.storePhone = editProfileForm.storePhone;
                if (editProfileForm.ownerName !== partner.ownerName) updates.ownerName = editProfileForm.ownerName;
                if (editProfileForm.ownerPhone !== partner.ownerPhone) updates.ownerPhone = editProfileForm.ownerPhone;

                if (Object.keys(updates).length === 0) {
                    setIsEditingProfile(false);
                    setIsUpdating(false);
                    alert('변경된 정보가 없습니다.');
                    return;
                }

                console.log('프로필 수정 요청:', updates);

                const result = await updatePartner(partner.id, updates);

                if (result.success) {
                    // Update local state with new data
                    const updatedPartner = result.data?.partner || partner;
                    // Update signupForm with new values
                    setSignupForm({
                        ...signupForm,
                        storeName: updatedPartner.storeName,
                        storeType: updatedPartner.storeType,
                        category: updatedPartner.category,
                        address: updatedPartner.address,
                        storePhone: updatedPartner.storePhone,
                        ownerName: updatedPartner.ownerName,
                        ownerPhone: updatedPartner.ownerPhone,
                    });

                    setIsEditingProfile(false);
                    setIsUpdating(false);
                    alert('프로필이 성공적으로 수정되었습니다.');
                } else {
                    setIsUpdating(false);
                    alert(`프로필 수정 실패: ${result.error || '알 수 없는 오류'}`);
                }
            } catch (error) {
                console.error('❌ 프로필 수정 에러:', error);
                setIsUpdating(false);
                alert('프로필 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        };

        if (isEditingProfile) {
            return (
                <div className="w-full h-full p-6 pb-24 flex flex-col overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 p-2 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-white">내정보 수정</h2>
                        <button
                            onClick={saveProfile}
                            disabled={isUpdating}
                            className={`font-bold text-sm ${isUpdating ? 'text-gray-500' : 'text-purple-400 hover:text-purple-300'}`}
                        >
                            {isUpdating ? '저장 중...' : '저장'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">매장명 *</label>
                            <input
                                type="text"
                                value={editProfileForm.storeName}
                                onChange={(e) => setEditProfileForm({...editProfileForm, storeName: e.target.value})}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                placeholder="매장 이름을 입력하세요"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">본점/지점 선택</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditProfileForm({...editProfileForm, storeType: '본점'})}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                                        editProfileForm.storeType === '본점'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-neutral-800 text-gray-400 border border-neutral-700'
                                    }`}
                                >
                                    본점
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditProfileForm({...editProfileForm, storeType: '지점'})}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                                        editProfileForm.storeType === '지점'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-neutral-800 text-gray-400 border border-neutral-700'
                                    }`}
                                >
                                    지점
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">업종 *</label>
                            <select
                                value={editProfileForm.category}
                                onChange={(e) => setEditProfileForm({...editProfileForm, category: e.target.value})}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                            >
                                <option value="KOREAN">한식</option>
                                <option value="JAPANESE">일식</option>
                                <option value="CHINESE">중식</option>
                                <option value="WESTERN">양식</option>
                                <option value="CAFE_DESSERT">카페/디저트</option>
                                <option value="PUB">술집</option>
                                <option value="CHICKEN">치킨</option>
                                <option value="PIZZA">피자</option>
                                <option value="BURGER">버거</option>
                                <option value="SALAD">샐러드</option>
                                <option value="OTHER">기타</option>
                            </select>
                        </div>

                        {editProfileForm.category === 'OTHER' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">업종 직접 입력</label>
                                <input
                                    type="text"
                                    value={editProfileForm.categoryCustom}
                                    onChange={(e) => setEditProfileForm({...editProfileForm, categoryCustom: e.target.value})}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                    placeholder="업종을 직접 입력하세요"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">매장 주소</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editProfileForm.address}
                                    onChange={(e) => setEditProfileForm({...editProfileForm, address: e.target.value})}
                                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                    placeholder="상세 주소 입력"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">매장 전화번호</label>
                            <input
                                type="tel"
                                value={editProfileForm.storePhone}
                                onChange={(e) => setEditProfileForm({...editProfileForm, storePhone: e.target.value})}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                placeholder="02-1234-5678"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">가입확인 대표자 이름 *</label>
                            <input
                                type="text"
                                value={editProfileForm.ownerName}
                                onChange={(e) => setEditProfileForm({...editProfileForm, ownerName: e.target.value})}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                placeholder="대표자 성명 입력"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">가입확인 대표자 연락처 *</label>
                            <input
                                type="tel"
                                value={editProfileForm.ownerPhone}
                                onChange={(e) => setEditProfileForm({...editProfileForm, ownerPhone: e.target.value})}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                placeholder="010-1234-5678"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full p-6 pb-24 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Store size={24} className="text-purple-400" />
                        <h2 className="text-xl font-bold text-white">내정보</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startEditProfile}
                            className="text-purple-400 font-medium text-sm hover:text-purple-300"
                        >
                            수정
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm('로그아웃하시겠습니까?')) {
                                    try {
                                        await logout();
                                        console.log('✅ 파트너 로그아웃 완료');
                                    } catch (error) {
                                        console.error('❌ 로그아웃 에러:', error);
                                        alert('로그아웃 중 오류가 발생했습니다.');
                                    }
                                }
                            }}
                            className="text-red-400 font-medium text-sm hover:text-red-300 flex items-center gap-1"
                        >
                            <LogOut size={16} />
                            로그아웃
                        </button>
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-purple-500/30 shadow-lg">
                        <Store size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{signupForm.storeName}</h2>
                    <p className="text-sm text-gray-400">{signupForm.storeType} · {signupForm.category.includes('KOREAN') ? '한식' : signupForm.category.includes('JAPANESE') ? '일식' : signupForm.category} · 사장님</p>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">사업자 등록번호</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold">{formatBusinessNumber(partner.businessRegNumber)}</span>
                                <Lock size={12} className="text-gray-500" />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">사업자등록번호는 수정할 수 없습니다</p>
                    </div>

                    <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">매장 주소</span>
                            <span className="text-white font-bold text-sm text-right">{signupForm.address || "주소 미입력"}</span>
                        </div>
                    </div>

                    <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">매장 전화번호</span>
                            <span className="text-white font-bold">{signupForm.storePhone || "미등록"}</span>
                        </div>
                    </div>

                    <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">대표자명</span>
                            <span className="text-white font-bold">{signupForm.ownerName}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-400">대표자 연락처</span>
                            <span className="text-white font-bold">{signupForm.ownerPhone}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    <button
                        onClick={async () => {
                            if (confirm('로그아웃하시겠습니까?')) {
                                try {
                                    await logout();
                                    console.log('✅ 파트너 로그아웃 완료');
                                } catch (error) {
                                    console.error('❌ 로그아웃 에러:', error);
                                    alert('로그아웃 중 오류가 발생했습니다.');
                                }
                            }
                        }}
                        className="w-full py-4 bg-neutral-900 text-red-400 font-bold rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors"
                    >
                        로그아웃
                    </button>
                    <button
                        onClick={onBackToHome}
                        className="w-full py-4 text-gray-500 font-medium text-sm underline hover:text-gray-400 transition-colors"
                    >
                        메인 화면으로 나가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                <Store size={32} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-500 mb-8">프로필을 보려면 먼저 로그인해주세요.</p>
        </div>
    );
};