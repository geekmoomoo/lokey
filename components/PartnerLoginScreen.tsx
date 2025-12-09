import React, { useState } from 'react';
import { ArrowLeft, Store, Lock, User, Eye, EyeOff, Building2, Mail, Phone, MapPin } from 'lucide-react';

interface PartnerLoginScreenProps {
  onLogin: (businessRegNumber: string, password: string) => void;
  onRegister: (partnerData: any) => Promise<{ success: boolean; switchToLogin?: boolean }>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
  isRegistering?: boolean;
}

export const PartnerLoginScreen: React.FC<PartnerLoginScreenProps> = ({
  onLogin,
  onRegister,
  onBack,
  isLoading = false,
  error = '',
  isRegistering = false
}) => {
  const [isLogin, setIsLogin] = useState(true);

  // 사업자등록번호 포맷팅 함수
  const formatBusinessNumber = (value: string): string => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 3) {
      return numbersOnly;
    }
    if (numbersOnly.length <= 5) {
      return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    }
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 5)}-${numbersOnly.slice(5, 10)}`;
  };

  // Login state
  const [loginBusinessReg, setLoginBusinessReg] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerForm, setRegisterForm] = useState({
    businessRegNumber: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    category: 'KOREAN',
    address: '',
    storePhone: '',
    ownerName: '',
    ownerPhone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const categories = [
    { value: 'KOREAN', label: '한식' },
    { value: 'JAPANESE', label: '일식' },
    { value: 'CHINESE', label: '중식' },
    { value: 'WESTERN', label: '양식' },
    { value: 'CAFE_DESSERT', label: '카페/디저트' },
    { value: 'PUB', label: '술집' },
    { value: 'CHICKEN', label: '치킨' },
    { value: 'PIZZA', label: '피자' },
    { value: 'BURGER', label: '버거' },
    { value: 'OTHER', label: '기타' }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginBusinessReg || !loginPassword) return;
    // 하이픈 제거 후 숫자만 전송
    const cleanBusinessReg = loginBusinessReg.replace(/[^0-9]/g, '');
    onLogin(cleanBusinessReg, loginPassword);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerForm.businessRegNumber || !registerForm.password || !registerForm.confirmPassword) {
      setRegisterError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (registerForm.password.length < 8) {
      setRegisterError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    // 하이픈 제거 후 숫자만 전송
    const cleanRegisterForm = {
      ...registerForm,
      businessRegNumber: registerForm.businessRegNumber.replace(/[^0-9]/g, '')
    };

    const result = await onRegister(cleanRegisterForm);
    if (result.success && result.switchToLogin) {
      // 신청 완료 후 로그인 화면으로 전환
      setIsLogin(true);
      // 폼 초기화
      setRegisterForm({
        businessRegNumber: '',
        password: '',
        confirmPassword: '',
        storeName: '',
        category: 'KOREAN',
        address: '',
        storePhone: '',
        ownerName: '',
        ownerPhone: ''
      });
    }
  };

  if (isLogin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center p-6 pb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold">파트너 로그인</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4 flex flex-col justify-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Store className="w-10 h-10 text-purple-500" />
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">사업자등록번호와 비밀번호로 로그인하세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Business Registration Number */}
            <div>
              <label className="text-sm text-gray-400 flex items-center mb-2">
                <User className="w-4 h-4 mr-2" />
                사업자등록번호
              </label>
              <input
                type="text"
                value={loginBusinessReg}
                onChange={(e) => setLoginBusinessReg(formatBusinessNumber(e.target.value))}
                placeholder="123-45-67890"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-yellow-500 focus:outline-none"
                maxLength={12}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-400 flex items-center mb-2">
                <Lock className="w-4 h-4 mr-2" />
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-yellow-500 focus:outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !loginBusinessReg || !loginPassword}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            {/* Switch to Register */}
            <div className="text-center pt-2">
              <p className="text-gray-400 text-sm">
                아직 파트너가 아니신가요?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  파트너 신청
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Register Form
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">파트너 신청</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">파트너 신청을 위한 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Business Registration Number */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Building2 className="w-4 h-4 mr-2" />
              사업자등록번호
            </label>
            <input
              type="text"
              value={registerForm.businessRegNumber}
              onChange={(e) => setRegisterForm({...registerForm, businessRegNumber: formatBusinessNumber(e.target.value)})}
              placeholder="123-45-67890"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              maxLength={12}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Lock className="w-4 h-4 mr-2" />
              비밀번호 (8자 이상)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Lock className="w-4 h-4 mr-2" />
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                placeholder="비밀번호 확인"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-yellow-500 focus:outline-none pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Store Name */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Store className="w-4 h-4 mr-2" />
              상호명
            </label>
            <input
              type="text"
              value={registerForm.storeName}
              onChange={(e) => setRegisterForm({...registerForm, storeName: e.target.value})}
              placeholder="상호명"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">업종</label>
            <select
              value={registerForm.category}
              onChange={(e) => setRegisterForm({...registerForm, category: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-yellow-500 focus:outline-none"
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              주소
            </label>
            <input
              type="text"
              value={registerForm.address}
              onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
              placeholder="매장 주소"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Store Phone */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Phone className="w-4 h-4 mr-2" />
              매장 전화번호
            </label>
            <input
              type="tel"
              value={registerForm.storePhone}
              onChange={(e) => setRegisterForm({...registerForm, storePhone: e.target.value})}
              placeholder="매장 전화번호"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <User className="w-4 h-4 mr-2" />
              대표자명
            </label>
            <input
              type="text"
              value={registerForm.ownerName}
              onChange={(e) => setRegisterForm({...registerForm, ownerName: e.target.value})}
              placeholder="대표자 성함"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Owner Phone */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Phone className="w-4 h-4 mr-2" />
              대표자 연락처
            </label>
            <input
              type="tel"
              value={registerForm.ownerPhone}
              onChange={(e) => setRegisterForm({...registerForm, ownerPhone: e.target.value})}
              placeholder="대표자 연락처"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Error Message */}
          {registerError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-200">
              {registerError}
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                신청 중...
              </>
            ) : (
              '파트너 신청하기'
            )}
          </button>

          {/* Switch to Login */}
          <div className="text-center pt-2">
            <p className="text-gray-400 text-sm">
              이미 파트너이신가요?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                로그인
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};