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
    const result = await apiUploadDealImage(base64Data, fileName);
    if (!result.success) {
      console.warn('이미지 업로드 실패:', result.error);
      return null;
    }
    return result.url ?? null;
  } catch (error) {
    console.error('uploadImageToStorage error:', error);
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
  if (result.success && result.deals?.length) {
    currentDeals = result.deals.map(normalizeDeal);
    return currentDeals;
  }

  if (!result.success) {
    console.warn('Flash deals API failed:', result.error);
  }

  return currentDeals.filter((deal) => deal.status === 'ACTIVE' || !deal.status);
};

export const fetchMerchantDeals = async (): Promise<Deal[]> => {
  const result = await apiFetchDeals();
  if (result.success && result.deals?.length) {
    currentDeals = result.deals.map(normalizeDeal);
    return currentDeals;
  }

  if (!result.success) {
    console.warn('Merchant deals API failed:', result.error);
  }

  return [...currentDeals];
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
