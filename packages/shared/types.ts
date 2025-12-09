
export interface Location {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  distance: number; // in meters
  rating: number;
  reviewCount: number;
  location: Location;
}

export interface Deal {
  id: string;
  title: string;
  originalPrice: number;
  discountAmount: number;
  imageUrl: string;
  totalCoupons: number;
  remainingCoupons: number;
  expiresAt: Date;
  restaurant: Restaurant;
  isGhost?: boolean; // New property for Ghost Tickets
  usageCondition?: string; // e.g., "1인 1메뉴 필수", "2만원 이상 주문 시"
  status?: 'ACTIVE' | 'ENDED' | 'CANCELED' | 'DELETED';
  benefitType?: 'DISCOUNT' | 'CUSTOM' | 'AD'; // Persist the type of benefit
  customBenefit?: string; // Persist the custom text (e.g. "1+1")
  initialComments: string[]; // AI generated comments specific to this deal
}

export interface Coupon {
  id: string;
  dealId: string;
  title: string;
  restaurantName: string;
  discountAmount: number;
  imageUrl: string;
  status: 'AVAILABLE' | 'USED';
  claimedAt: Date;
  usedAt?: Date;
  expiresAt: Date;
  hasGoldenKey?: boolean; // If true, user can invite a friend
  location: Location; // Coordinate of the restaurant
  usageCondition?: string; // Persisted condition from Deal
}

export enum AppTab {
  SEARCH = 'SEARCH',
  COUPONS = 'COUPONS',
  PROFILE = 'PROFILE'
}

export enum MerchantTab {
  AD_REGISTER = 'AD_REGISTER',
  DASHBOARD = 'DASHBOARD',
  PROFILE = 'PROFILE'
}
