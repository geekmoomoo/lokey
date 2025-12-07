-- Quick Test Data for Supabase
-- 상무초밥 딜 하나만 테스트용으로 추가

-- 1. 상점 정보 추가
INSERT INTO merchants (
  id,
  name,
  category,
  distance,
  rating,
  review_count,
  location_lat,
  location_lng
) VALUES (
  'rest-001-test',
  '상무초밥 본점',
  '일식',
  350,
  4.9,
  2350,
  35.1544,
  126.8524
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  distance = EXCLUDED.distance,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng;

-- 2. 딜 정보 추가 (1시간 후 마감)
INSERT INTO deals (
  id,
  merchant_id,
  title,
  original_price,
  discount_amount,
  image_url,
  total_coupons,
  remaining_coupons,
  expires_at,
  status,
  is_ghost,
  usage_condition,
  benefit_type,
  custom_benefit,
  initial_comments,
  distance,
  rating,
  review_count,
  location_lat,
  location_lng
) VALUES (
  'deal-001-test',
  'rest-001-test',
  '특선 모듬 초밥 12인분',
  22000,
  7000,
  'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1287&auto=format&fit=crop',
  50,
  5,
  NOW() + INTERVAL '1 hour',
  'ACTIVE',
  false,
  NULL,
  'DISCOUNT',
  NULL,
  ARRAY[
    '와 대박이다', '여기 분위기 깡패네', '가성비 미쳤다..', '지금 가야겠다',
    '사장님 남는거 있어요?', '친구 태그각 @', '이미 마감 임박 ㄷㄷ', '저장완료!',
    '오픈런 해야되나', '비주얼 무엇 ㅠㅠ', '회 두께 실화냐', '초밥 땡겼는데 딱이네',
    '오마카세급 퀄리티 ㄷㄷ', '사케 한잔 하고싶다', '신선해 보여요!', '오늘 여기다',
    '단골 확정', '인생 맛집', '재방문 의사 100%'
  ],
  350,
  4.9,
  2350,
  35.1544,
  126.8524
) ON CONFLICT (id) DO UPDATE SET
  merchant_id = EXCLUDED.merchant_id,
  title = EXCLUDED.title,
  original_price = EXCLUDED.original_price,
  discount_amount = EXCLUDED.discount_amount,
  image_url = EXCLUDED.image_url,
  total_coupons = EXCLUDED.total_coupons,
  remaining_coupons = EXCLUDED.remaining_coupons,
  expires_at = EXCLUDED.expires_at,
  status = EXCLUDED.status,
  is_ghost = EXCLUDED.is_ghost,
  usage_condition = EXCLUDED.usage_condition,
  benefit_type = EXCLUDED.benefit_type,
  custom_benefit = EXCLUDED.custom_benefit,
  initial_comments = EXCLUDED.initial_comments,
  distance = EXCLUDED.distance,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng;

-- 3. Ghost 딜 하나 더 추가 (테스트용)
INSERT INTO deals (
  id,
  merchant_id,
  title,
  original_price,
  discount_amount,
  image_url,
  total_coupons,
  remaining_coupons,
  expires_at,
  status,
  is_ghost,
  usage_condition,
  benefit_type,
  custom_benefit,
  initial_comments,
  distance,
  rating,
  review_count,
  location_lat,
  location_lng
) VALUES (
  'deal-ghost-test',
  'rest-001-test',
  '[SECRET] 심야 오마카세',
  88000,
  40000,
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1287&auto=format&fit=crop',
  5,
  1,
  NOW() + INTERVAL '30 minutes',
  'ACTIVE',
  true,
  '사전 예약 필수',
  'DISCOUNT',
  NULL,
  ARRAY[
    '쉿 여기 나만 알고싶음', '오마카세 반값 실화?', '예약 전쟁이다',
    '셰프님 포스 ㄷㄷ', '분위기 미쳤다 진짜', '오늘 밤 주인공은 나',
    '비밀스러운 곳', '히든 맛집', '단골만 아는 곳'
  ],
  350,
  4.9,
  2350,
  35.1544,
  126.8524
) ON CONFLICT (id) DO UPDATE SET
  merchant_id = EXCLUDED.merchant_id,
  title = EXCLUDED.title,
  original_price = EXCLUDED.original_price,
  discount_amount = EXCLUDED.discount_amount,
  image_url = EXCLUDED.image_url,
  total_coupons = EXCLUDED.total_coupons,
  remaining_coupons = EXCLUDED.remaining_coupons,
  expires_at = EXCLUDED.expires_at,
  status = EXCLUDED.status,
  is_ghost = EXCLUDED.is_ghost,
  usage_condition = EXCLUDED.usage_condition,
  benefit_type = EXCLUDED.benefit_type,
  custom_benefit = EXCLUDED.custom_benefit,
  initial_comments = EXCLUDED.initial_comments,
  distance = EXCLUDED.distance,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng;

-- 확인 쿼리
SELECT
  d.id,
  d.title,
  d.original_price,
  d.discount_amount,
  d.remaining_coupons,
  d.total_coupons,
  d.status,
  d.is_ghost,
  d.expires_at,
  m.name as merchant_name
FROM deals d
LEFT JOIN merchants m ON d.merchant_id = m.id
WHERE d.status = 'ACTIVE'
ORDER BY d.expires_at ASC;