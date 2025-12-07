// API 서비스 - 백엔드 API 호출 전용
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api'
    : 'https://your-domain.com/api';

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
        console.log('🎨 이미지 생성 요청 (백엔드):', { prompt: prompt.substring(0, 50) + '...', style });

        const response = await fetch(`${API_BASE_URL}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, style }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse<{ image: string }> = await response.json();

        if (!result.success) {
            throw new Error(result.error || '이미지 생성 실패');
        }

        console.log('✅ 이미지 생성 성공 (백엔드)');
        return result.image;
    } catch (error) {
        console.error('❌ 이미지 생성 오류 (백엔드):', error);
        return null;
    }
};

// 파트너 회원가입
export const registerPartner = async (partnerData: any): Promise<ApiResponse<any>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ businessRegNumber, password }),
        });

        const result: ApiResponse<{ partner: any }> = await response.json();
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

// 딜 목록 조회
export const fetchDeals = async (status?: string): Promise<ApiResponse<{ deals: any[] }>> => {
    try {
        const url = status ? `${API_BASE_URL}/deals?status=${status}` : `${API_BASE_URL}/deals`;

        const response = await fetch(url);
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
        const response = await fetch(`${API_BASE_URL}/deals`, {
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