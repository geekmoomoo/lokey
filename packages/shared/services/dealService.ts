import { Deal, Location } from '@shared/types';
import {
  createDeal as apiCreateDeal,
  fetchDeals as apiFetchDeals,
  updateDeal as apiUpdateDeal,
  uploadDealImage as apiUploadDealImage
} from './apiService';

// Default center location (Gwangju Sangmu District)
const CENTER: Location = { lat: 35.1534, lng: 126.8514 };

const defaultRestaurant = {
  id: 'default-restaurant',
  name: '로케이 키친',
  category: '한식',
  distance: 250,
  rating: 4.6,
  reviewCount: 120,
  location: CENTER
};

// In-memory cache for deals (mirrors API response)
let currentDeals: Deal[] = [];

const normalizeRestaurant = (input: any): any => {
  if (!input) {
    return defaultRestaurant;
  }
  return {
    id: input.id ?? `restaurant-${Date.now()}`,
    name: input.name ?? defaultRestaurant.name,
    category: input.category ?? defaultRestaurant.category,
    distance: input.distance ?? defaultRestaurant.distance,
    rating: input.rating ?? defaultRestaurant.rating,
    reviewCount: input.reviewCount ?? defaultRestaurant.reviewCount,
    location: input.location ?? CENTER
  };
};

const normalizeDeal = (row: any): Deal => ({
  id: row.id,
  title: row.title ?? row.name ?? 'New Deal',
  originalPrice: Number(row.originalPrice ?? row.original_price ?? 0),
  discountAmount: Number(row.discountAmount ?? row.discount_amount ?? 0),
  imageUrl: row.imageUrl ?? row.image_url ?? '',
  totalCoupons: Number(row.totalCoupons ?? row.total_coupons ?? 0),
  remainingCoupons: Number(row.remainingCoupons ?? row.remaining_coupons ?? 0),
  expiresAt: row.expiresAt ? new Date(row.expiresAt) : new Date(),
  status: (row.status as Deal['status']) ?? 'ACTIVE',
  isGhost: Boolean(row.isGhost ?? row.is_ghost),
  usageCondition: row.usageCondition ?? row.usage_condition ?? undefined,
  benefitType: row.benefitType ?? row.benefit_type ?? undefined,
  customBenefit: row.customBenefit ?? row.custom_benefit ?? undefined,
  initialComments: row.initialComments ?? [],
  restaurant: normalizeRestaurant(row.restaurant ?? {
    id: row.merchant_id,
    name: row.restaurant_name,
    category: row.restaurant_category,
    location: row.restaurant_location,
    distance: row.restaurant_distance,
    rating: row.restaurant_rating,
    reviewCount: row.restaurant_review_count
  })
});

export const uploadImageToStorage = async (base64Data: string, fileName?: string): Promise<string | null> => {
  try {
    // 클라이언트 측 파일 크기 체크 (base64)
    const sizeInBytes = (base64Data.split(',')[1] || base64Data).length * 0.75;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 5) {
      console.error(`Image too large: ${sizeInMB.toFixed(2)}MB (max 5MB)`);
      alert('이미지 크기가 5MB를 초과했습니다. 더 작은 이미지를 사용해주세요.');
      return null;
    }

    console.log(`Uploading image: ${sizeInMB.toFixed(2)}MB`);
    const result = await apiUploadDealImage(base64Data, fileName);

    if (!result.success) {
      console.error('이미지 업로드 실패:', {
        error: result.error,
        details: result.details,
        fileName: fileName
      });

      // 사용자 친화적인 에러 메시지
      const errorMessage = result.error === '이미지 크기가 5MB를 초과했습니다.'
        ? '이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.'
        : result.error === '스토리지 용량이 초과되었습니다.'
        ? '서버 저장 공간이 부족합니다. 잠시 후 다시 시도해주세요.'
        : '이미지 업로드에 실패했습니다. 다시 시도해주세요.';

      alert(errorMessage);
      return null;
    }

    console.log('Image upload successful:', result.data?.url);
    return result.data?.url ?? null;
  } catch (error) {
    const err = error as Error;
    console.error('uploadImageToStorage error:', {
      message: err.message,
      stack: err.stack,
      fileName: fileName
    });
    alert('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    return null;
  }
};

export const generateContextComments = (category: string, title: string): string[] => {
  const common = [
    '정말 맛있어 보여요!',
    '완벽한 비주얼과 카메라 패킹',
    '겉은 바삭, 속은 촉촉',
    '지금 바로 예약하고 싶은 느낌'
  ];
  const specific = category.includes('한식') ? ['따끈한 즉석 조리', '아련한 셰프의 손맛'] : [];
  const pool = [...common, ...specific, ...specific];
  return pool.sort(() => Math.random() - 0.5).slice(0, 10);
};

export const fetchFlashDeals = async (): Promise<Deal[]> => {
  const result = await apiFetchDeals('ACTIVE');
  if (result.success && result.data?.deals?.length) {
    currentDeals = result.data.deals.map(normalizeDeal);
    return currentDeals;
  }

  if (!result.success) {
    console.warn('Flash deals API failed:', result.error);
  }

  return currentDeals.filter((deal) => deal.status === 'ACTIVE' || !deal.status);
};

export const fetchMerchantDeals = async (merchantId?: string, businessRegNumber?: string): Promise<Deal[]> => {
  // Always use production Firebase Cloud Functions
  const url = new URL('https://us-central1-lokey-service.cloudfunctions.net/listDeals');

  if (merchantId) {
    url.searchParams.set('merchantId', merchantId);
  }
  if (businessRegNumber) {
    url.searchParams.set('businessRegNumber', businessRegNumber);
  }

  console.log('🔍 Fetching merchant deals from production:', url.toString());
  const response = await fetch(url.toString());
  const result = await response.json();

  if (result.success && result.deals?.length) {
    currentDeals = result.deals.map(normalizeDeal);
    console.log('✅ Merchant deals loaded from production:', currentDeals.length, 'deals');
    return currentDeals;
  }

  if (!result.success) {
    console.warn('Merchant deals API failed:', result.error);
  }

  console.log('📭 No merchant deals found in production, returning empty array');
  return [];
};

export const getMerchantDeals = (): Deal[] => {
  if (currentDeals.length === 0) {
    console.warn('No cached deals available yet');
  }
  return currentDeals;
};

export const addDeal = async (newDeal: Deal): Promise<void> => {
  newDeal.status = 'ACTIVE';
  currentDeals.unshift(newDeal);
  try {
    const result = await apiCreateDeal(newDeal);
    if (!result.success) {
      console.warn('Create deal failed:', result.error);
    }
  } catch (error) {
    console.error('addDeal error:', error);
  }
};

export const updateDeal = async (dealId: string, updates: Partial<Deal>): Promise<void> => {
  currentDeals = currentDeals.map((deal) => (deal.id === dealId ? { ...deal, ...updates } : deal));
  try {
    const result = await apiUpdateDeal(dealId, updates);
    if (!result.success) {
      console.warn('Update deal failed:', result.error);
    }
  } catch (error) {
    console.error('updateDeal error:', error);
  }
};
