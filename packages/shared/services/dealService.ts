
import { Deal } from '@shared/types';
import { supabase, isSupabaseConfigured, ensureSupabase } from './supabaseClient';

// Default center location (Gwangju Sangmu District)
const CENTER = { lat: 35.1534, lng: 126.8514 };

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Upload image to Supabase Storage
export const uploadImageToStorage = async (base64Data: string, fileName: string): Promise<string | null> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - skipping image upload');
      return null;
    }

    const supabaseClient = ensureSupabase();

    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();

    // Generate unique file name
    const fileExt = 'webp'; // Use webp extension for WebP format
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('deal-images')
      .upload(uniqueFileName, blob, {
        contentType: 'image/webp',
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('deal-images')
      .getPublicUrl(uniqueFileName);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    return null;
  }
};

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

// In-memory cache for deals (will be populated from Supabase)
let currentDeals: Deal[] = [];

// ----- Supabase helpers -----
interface SupabaseMerchantRow {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
}

interface SupabaseDealRow {
  id: string;
  title: string;
  original_price: number | null;
  discount_amount: number | null;
  image_url: string | null;
  total_coupons: number | null;
  remaining_coupons: number | null;
  expires_at: string | null;
  status: string | null;
  is_ghost: boolean | null;
  usage_condition: string | null;
  benefit_type: string | null;
  custom_benefit: string | null;
  merchant_id: string | null;
  merchant?: SupabaseMerchantRow | null;
}

const mapDealRow = (row: SupabaseDealRow): Deal => {
  // 하드코딩된 매장 정보 (merchant_id에 따라)
  const getMerchantInfo = (merchantId: string) => {
    if (merchantId === '05f81f10-ee79-45d5-ad67-0aee83393997') {
      return {
        id: merchantId,
        name: '상무초밥 본점',
        category: '일식'
      };
    } else if (merchantId === 'b024464b-cbcb-47b6-8839-58f0e75c8f80') {
      return {
        id: merchantId,
        name: '어나더키친 상무점',
        category: '양식'
      };
    }
    return {
      id: merchantId,
      name: '로컬 히든 스팟',
      category: '로컬'
    };
  };

  const merchant = getMerchantInfo(row.merchant_id!);

  return {
    id: row.id,
    title: row.title,
    originalPrice: row.original_price ?? 0,
    discountAmount: row.discount_amount ?? 0,
    imageUrl: row.image_url ?? '',
    totalCoupons: row.total_coupons ?? 0,
    remainingCoupons: row.remaining_coupons ?? 0,
    expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(),
    status: (row.status as Deal['status']) ?? 'ACTIVE',
    isGhost: row.is_ghost ?? false,
    usageCondition: row.usage_condition ?? undefined,
    benefitType: row.benefit_type ?? undefined,
    customBenefit: row.custom_benefit ?? undefined,
    initialComments: [],  // 테이블에 없으므로 빈 배열로 설정
    restaurant: {
      id: merchant.id,
      name: merchant.name,
      category: merchant.category,
      distance: 350, // 기본값 설정
      rating: 4.5, // 기본값 설정
      reviewCount: 100, // 기본값 설정
      location: {
        lat: CENTER.lat, // 기본 위치
        lng: CENTER.lng, // 기본 위치
      }
    }
  };
};

const fetchDealsFromSupabase = async (statusFilter?: string): Promise<Deal[] | null> => {
  if (!isSupabaseConfigured) return null;

  const query = supabase!
    .from('deals')
    .select('*')
    .eq('is_ghost', false) // 고스트딜 제외
    .order('expires_at', { ascending: true });

  if (statusFilter) {
    query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.warn('Supabase fetch deals failed', error);
    return null;
  }
  return data.map(mapDealRow);
};

// ----- Public API -----
export const fetchFlashDeals = async (): Promise<Deal[]> => {
  const supabaseDeals = await fetchDealsFromSupabase('ACTIVE');

  if (supabaseDeals) {
    currentDeals = supabaseDeals;
    return supabaseDeals;
  }

  // If Supabase is not configured, return empty array
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - no deals available');
    return [];
  }

  // Return cached deals if available
  return currentDeals.filter((d) => d.status === 'ACTIVE' || !d.status);
};

export const fetchMerchantDeals = async (): Promise<Deal[]> => {
  const supabaseDeals = await fetchDealsFromSupabase();
  if (supabaseDeals) {
    currentDeals = supabaseDeals;
    return supabaseDeals;
  }

  // If Supabase is not configured, return empty array
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - no deals available');
    return [];
  }

  return [...currentDeals];
};

export const getMerchantDeals = (): Deal[] => {
  // Return cached deals, but warn if empty and Supabase is not configured
  if (currentDeals.length === 0 && !isSupabaseConfigured) {
    console.warn('No deals available - Supabase not configured');
  }
  return currentDeals;
};

export const addDeal = async (newDeal: Deal): Promise<void> => {
  newDeal.status = 'ACTIVE';
  currentDeals.unshift(newDeal);

  if (!isSupabaseConfigured) return;

  const merchantId = newDeal.restaurant.id || `merchant-${Date.now()}`;
  const merchantPayload = {
    id: merchantId,
    name: newDeal.restaurant.name,
    category: newDeal.restaurant.category,
    phone: null, // 테이블에 있지만 필수 아님
    address: null // 테이블에 있지만 필수 아님
  };

  await supabase!.from('merchants').upsert(merchantPayload, { onConflict: 'id' });

  const dealPayload = {
    id: generateUUID(), // Generate proper UUID for database
    merchant_id: merchantId,
    title: newDeal.title,
    original_price: newDeal.originalPrice,
    discount_amount: newDeal.discountAmount,
    image_url: newDeal.imageUrl,
    total_coupons: newDeal.totalCoupons,
    remaining_coupons: newDeal.remainingCoupons,
    expires_at: newDeal.expiresAt,
    status: newDeal.status,
    is_ghost: newDeal.isGhost,
    usage_condition: newDeal.usageCondition,
    benefit_type: newDeal.benefitType,
    custom_benefit: newDeal.customBenefit
  };

  const { error } = await supabase!.from('deals').insert(dealPayload);
  if (error) {
    console.warn('Supabase addDeal failed', error);
  }
};

export const updateDeal = async (dealId: string, updates: Partial<Deal>): Promise<void> => {
  currentDeals = currentDeals.map((deal) => (deal.id === dealId ? { ...deal, ...updates } : deal));

  if (!isSupabaseConfigured) return;

  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.remainingCoupons !== undefined) payload.remaining_coupons = updates.remainingCoupons;
  if (updates.totalCoupons !== undefined) payload.total_coupons = updates.totalCoupons;
  if (updates.expiresAt) payload.expires_at = updates.expiresAt;

  if (!Object.keys(payload).length) {
    return;
  }

  const { error } = await supabase!.from('deals').update(payload).eq('id', dealId);
  if (error) {
    console.warn('Supabase updateDeal failed', error);
  }
};
