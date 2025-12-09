// API 서비스 - 백엔드 API 호출 전용
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-no-project';
const overrideBase = import.meta.env.VITE_API_BASE_URL;

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// 개발 환경에서는 로컬 에뮬레이터 사용, 프로덕션에서는 실제 함수 사용
const API_BASE_URL = isDevelopment && !overrideBase
  ? 'http://127.0.0.1:5001/demo-no-project/us-central1'
  : (overrideBase || `https://us-central1-${projectId}.cloudfunctions.net`).replace(/\/$/, '');

const buildFunctionUrl = (functionName: string) => `${API_BASE_URL}/${functionName}`;

// 타입 정의
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: string;
}

// 이미지 생성 (Gemini API 프록시)
export const generateImage = async (prompt: string, style: string = 'NATURAL'): Promise<string | null> => {
    try {
        console.log('🎨 이미지 생성 요청 (프로덕션):', { prompt: prompt.substring(0, 50) + '...', style });

        const response = await fetch(buildFunctionUrl('generateImage'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, style }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 백엔드 응답 구조: { success: true, image: "data:image/png;base64,..." }
        if (!result.success) {
            throw new Error(result.error || '이미지 생성 실패');
        }

        console.log('✅ 이미지 생성 성공 (프로덕션)');
        return result.image || null;
    } catch (error) {
        console.error('❌ 이미지 생성 오류 (프로덕션):', error);
        return null;
    }
};

// 파트너 회원가입
export const registerPartner = async (partnerData: any): Promise<ApiResponse<any>> => {
    try {
        const response = await fetch(buildFunctionUrl('registerPartner'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(partnerData),
        });

        const result: ApiResponse<any> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 파트너 가입 오류 (백엔드):', error);
        return {
            success: false,
            error: '서버 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 파트너 로그인
export const loginPartner = async (businessRegNumber: string, password: string): Promise<ApiResponse<{ partner: any }>> => {
    try {
        const response = await fetch(buildFunctionUrl('loginPartner'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ businessRegNumber, password }),
        });

        const result: ApiResponse<{ partner: any }> = await response.json();

        // 백엔드 응답 구조 맞추기: { success: true, partner: {...} } → { success: true, data: { partner: {...} } }
        if (result.success && (result as any).partner && !result.data) {
            return {
                ...result,
                data: { partner: (result as any).partner }
            };
        }

        return result;
    } catch (error) {
        console.error('❌ 파트너 로그인 오류 (백엔드):', error);
        return {
            success: false,
            error: '로그인 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 파트너 정보 수정
export const updatePartner = async (partnerId: string, updates: Record<string, any>): Promise<ApiResponse<{ partner: any }>> => {
    try {
        const response = await fetch(buildFunctionUrl('updatePartner'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ partnerId, updates }),
        });

        const result: ApiResponse<{ partner: any }> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 파트너 정보 수정 오류 (백엔드):', error);
        return {
            success: false,
            error: '파트너 정보 수정 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 딜 목록 조회
export const fetchDeals = async (status?: string): Promise<ApiResponse<{ deals: any[] }>> => {
    try {
        const url = new URL(buildFunctionUrl('listDeals'));
        if (status) {
            url.searchParams.set('status', status);
        }

        const response = await fetch(url.toString());
        const result: ApiResponse<{ deals: any[] }> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 딜 목록 조회 오류 (백엔드):', error);
        return {
            success: false,
            error: '딜 목록 조회 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 딜 생성
export const createDeal = async (dealData: any): Promise<ApiResponse<{ dealId: string }>> => {
    try {
        const response = await fetch(buildFunctionUrl('createDeal'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dealData),
        });

        const result: ApiResponse<{ dealId: string }> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 딜 생성 오류 (백엔드):', error);
        return {
            success: false,
            error: '딜 생성 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};
export const updateDeal = async (dealId: string, updates: Record<string, any>): Promise<ApiResponse<any>> => {
    try {
        const response = await fetch(buildFunctionUrl('updateDeal'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dealId, updates }),
        });

        const result: ApiResponse<any> = await response.json();
        return result;
    } catch (error) {
        console.error('�� ������Ʈ ���� (Ŭ���̾�Ʈ):', error);
        return {
            success: false,
            error: '�� ������ ������Ʈ�� �� �����ϴ�.',
            details: error.message
        };
    }
};

export const uploadDealImage = async (base64Data: string, fileName?: string): Promise<ApiResponse<{ url: string }>> => {
    try {
        const response = await fetch(buildFunctionUrl('uploadImage'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Data, fileName }),
        });

        const result: ApiResponse<{ url: string }> = await response.json();
        return result;
    } catch (error) {
        console.error('이미지 업로드 오류 (클라이언트):', error);
        return {
            success: false,
            error: '이미지를 업로드할 수 없습니다.',
            details: error.message
        };
    }
};

// 사용자 쿠폰 조회
export const getUserCoupons = async (userId: string): Promise<ApiResponse<{ coupons: any[] }>> => {
    try {
        const url = new URL(buildFunctionUrl('getUserCoupons'));
        url.searchParams.set('userId', userId);

        const response = await fetch(url.toString());
        const result: ApiResponse<{ coupons: any[] }> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 쿠폰 조회 오류 (백엔드):', error);
        return {
            success: false,
            error: '쿠폰 조회 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 쿠폰 발급
export const claimCoupon = async (userId: string, dealId: string, dealData: any): Promise<ApiResponse<{ coupon: any }>> => {
    try {
        const response = await fetch(buildFunctionUrl('claimCoupon'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, dealId, dealData }),
        });

        const result: ApiResponse<{ coupon: any }> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 쿠폰 발급 오류 (백엔드):', error);
        return {
            success: false,
            error: '쿠폰 발급 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};

// 쿠폰 사용
export const useCoupon = async (userId: string, couponId: string): Promise<ApiResponse<any>> => {
    try {
        const response = await fetch(buildFunctionUrl('useCoupon'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, couponId }),
        });

        const result: ApiResponse<any> = await response.json();
        return result;
    } catch (error) {
        console.error('❌ 쿠폰 사용 오류 (백엔드):', error);
        return {
            success: false,
            error: '쿠폰 사용 중 오류가 발생했습니다.',
            details: error.message
        };
    }
};
