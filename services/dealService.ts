
import { Deal } from '../types';

// Mock Center (approx Gwangju Sangmu District for demo)
const CENTER = { lat: 35.1534, lng: 126.8514 };

// Helper to generate offset
const loc = (latOffset: number, lngOffset: number) => ({
    lat: CENTER.lat + latOffset,
    lng: CENTER.lng + lngOffset
});

// Helper: Context Aware Comment Generator
export const generateContextComments = (category: string, title: string): string[] => {
    const common = ["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ"];
    
    let specific: string[] = [];
    if (category.includes('일식') || title.includes('초밥') || title.includes('스시')) {
        specific = ["회 두께 실화냐", "초밥 땡겼는데 딱이네", "오마카세급 퀄리티 ㄷㄷ", "사케 한잔 하고싶다", "신선해 보여요!"];
    } else if (category.includes('양식') || title.includes('스테이크') || title.includes('파스타')) {
        specific = ["데이트 코스로 딱일듯", "와인 콜키지 되나요?", "스테이크 굽기 예술이네", "파스타 꾸덕한거 보소", "분위기 맛집 인정"];
    } else if (category.includes('한식') || title.includes('갈비') || title.includes('찜')) {
        specific = ["밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯"];
    } else if (category.includes('카페') || category.includes('디저트')) {
        specific = ["디저트 배는 따로있지", "인스타 감성 제대로네", "커피 맛집일듯", "당 충전 필요했는데 ㅠㅠ", "케이크 너무 예뻐요"];
    } else if (category.includes('술') || title.includes('포차') || title.includes('맥주')) {
        specific = ["오늘밤은 여기다", "안주 킬러 출동", "하이볼 있나요?", "불금 보내기 딱 좋네", "적셔~!"];
    } else {
        specific = ["맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요"];
    }

    // Combine and Shuffle
    const pool = [...common, ...specific, ...specific]; // Weight specific comments higher
    return pool.sort(() => Math.random() - 0.5).slice(0, 20); // Return 20 random comments
};

// Initial Data
const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-001',
    title: '특선 모듬 초밥 12p',
    originalPrice: 22000,
    discountAmount: 7000,
    imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1287&auto=format&fit=crop', 
    totalCoupons: 50,
    remainingCoupons: 3,
    expiresAt: new Date(new Date().getTime() + 3600 * 1000), 
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-001',
      name: '상무초밥 본점',
      category: '일식',
      distance: 350,
      rating: 4.9,
      reviewCount: 2350,
      location: loc(0.001, 0.001)
    },
    initialComments: generateContextComments('일식', '특선 모듬 초밥')
  },
  {
    id: 'deal-ghost-01',
    title: '[SECRET] 셰프의 심야 오마카세',
    originalPrice: 88000,
    discountAmount: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 5,
    remainingCoupons: 1,
    expiresAt: new Date(new Date().getTime() + 1800 * 1000), 
    isGhost: true,
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-ghost-01',
      name: '스시 사카바 (Hidden)',
      category: '일식/오마카세',
      distance: 150,
      rating: 5.0,
      reviewCount: 42,
      location: loc(-0.0005, 0.0008)
    },
    initialComments: ["쉿 여기 나만 알고싶음", "오마카세 반값 실화?", "예약 전쟁이다", "셰프님 포스 ㄷㄷ", "분위기 미쳤다 진짜", "오늘 밤 주인공은 나"]
  },
  {
    id: 'deal-002',
    title: '토마호크 스테이크 세트',
    originalPrice: 128000,
    discountAmount: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 10,
    remainingCoupons: 2,
    expiresAt: new Date(new Date().getTime() + 7200 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-002',
      name: '어나더키친 상무점',
      category: '양식',
      distance: 520,
      rating: 4.8,
      reviewCount: 890,
      location: loc(0.002, -0.001)
    },
    initialComments: generateContextComments('양식', '토마호크 스테이크')
  },
  {
    id: 'deal-003',
    title: '수제 담양식 돼지갈비 2인',
    originalPrice: 36000,
    discountAmount: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 30,
    remainingCoupons: 8,
    expiresAt: new Date(new Date().getTime() + 5400 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-003',
      name: '금호동 명가 갈비',
      category: '한식',
      distance: 1200,
      rating: 4.6,
      reviewCount: 432,
      location: loc(-0.003, -0.004)
    },
    initialComments: generateContextComments('한식', '돼지갈비')
  },
  {
    id: 'deal-004',
    title: '매운 철판 쭈꾸미 볶음',
    originalPrice: 28000,
    discountAmount: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1582538884036-d885ac6e3913?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    totalCoupons: 40,
    remainingCoupons: 15,
    expiresAt: new Date(new Date().getTime() + 9000 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-004',
      name: '신쭈꾸미 상무본점',
      category: '한식',
      distance: 450,
      rating: 4.7,
      reviewCount: 1560,
      location: loc(0.0015, 0.002)
    },
    initialComments: generateContextComments('한식', '쭈꾸미')
  },
  {
    id: 'deal-005',
    title: '딸기 듬뿍 생크림 케이크',
    originalPrice: 42000,
    discountAmount: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 20,
    remainingCoupons: 5,
    expiresAt: new Date(new Date().getTime() + 2400 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-005',
      name: '카페 304',
      category: '카페/디저트',
      distance: 600,
      rating: 4.8,
      reviewCount: 3200,
      location: loc(-0.002, 0.001)
    },
    initialComments: generateContextComments('디저트', '딸기 케이크')
  },
  {
    id: 'deal-006',
    title: '옛날 가마솥 통닭 한마리',
    originalPrice: 21000,
    discountAmount: 6000,
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 100,
    remainingCoupons: 42,
    expiresAt: new Date(new Date().getTime() + 12000 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-006',
      name: '양동통닭 서구점',
      category: '치킨',
      distance: 2100,
      rating: 4.5,
      reviewCount: 512,
      location: loc(0.008, -0.005)
    },
    initialComments: generateContextComments('치킨', '가마솥 통닭')
  },
  {
    id: 'deal-007',
    title: '연어 포케 & 아보카도 샐러드',
    originalPrice: 16000,
    discountAmount: 4500,
    imageUrl: 'https://storage.googleapis.com/d-camping-image/delete/23.png',
    totalCoupons: 25,
    remainingCoupons: 1,
    expiresAt: new Date(new Date().getTime() + 1200 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-007',
      name: '보울레시피 풍암점',
      category: '샐러드',
      distance: 1800,
      rating: 4.7,
      reviewCount: 210,
      location: loc(-0.006, 0.003)
    },
    initialComments: generateContextComments('샐러드', '포케')
  },
  {
    id: 'deal-008',
    title: '더블 치즈 수제버거 세트',
    originalPrice: 14500,
    discountAmount: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 60,
    remainingCoupons: 28,
    expiresAt: new Date(new Date().getTime() + 6400 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-008',
      name: '프랭크버거 치평점',
      category: '버거',
      distance: 250,
      rating: 4.4,
      reviewCount: 180,
      location: loc(0.0005, -0.0005)
    },
    initialComments: generateContextComments('버거', '수제버거')
  },
  {
    id: 'deal-009',
    title: '화덕 고르곤졸라 피자',
    originalPrice: 19000,
    discountAmount: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 15,
    remainingCoupons: 0, 
    expiresAt: new Date(new Date().getTime() - 1000),
    status: 'ENDED',
    restaurant: {
      id: 'rest-009',
      name: '로니로티 광주상무점',
      category: '양식',
      distance: 400,
      rating: 4.5,
      reviewCount: 950,
      location: loc(-0.001, -0.002)
    },
    initialComments: generateContextComments('양식', '피자')
  },
  {
    id: 'deal-010',
    title: '얼큰 차돌 짬뽕',
    originalPrice: 13000,
    discountAmount: 4000,
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1287&auto=format&fit=crop',
    totalCoupons: 45,
    remainingCoupons: 12,
    expiresAt: new Date(new Date().getTime() + 4800 * 1000),
    status: 'ACTIVE',
    restaurant: {
      id: 'rest-010',
      name: '신락원 상무점',
      category: '중식',
      distance: 650,
      rating: 4.6,
      reviewCount: 1120,
      location: loc(0.0015, -0.003)
    },
    initialComments: generateContextComments('중식', '짬뽕')
  }
];

// Mutable Store for Demo Purposes
let currentDeals = [...INITIAL_DEALS];

export const fetchFlashDeals = async (): Promise<Deal[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(currentDeals.filter(d => d.status === 'ACTIVE' || d.status === undefined));
    }, 500);
  });
};

export const getMerchantDeals = (): Deal[] => {
    return currentDeals;
};

export const addDeal = (newDeal: Deal) => {
  // Add to the beginning of the array so it shows up first
  newDeal.status = 'ACTIVE';
  currentDeals.unshift(newDeal);
};

export const updateDeal = (dealId: string, updates: Partial<Deal>) => {
    currentDeals = currentDeals.map(deal => 
        deal.id === dealId ? { ...deal, ...updates } : deal
    );
};
