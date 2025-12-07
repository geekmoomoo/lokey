-- Simple Test Data for Supabase (실제 테이블 구조에 맞춤)

-- 1. 상점 정보 추가 (merchants 테이블)
INSERT INTO merchants (
  id,
  name,
  category,
  phone,
  address
) VALUES (
  gen_random_uuid(),  -- UUID 자동 생성
  '상무초밥 본점',
  '일식',
  '062-123-4567',
  '광주광역시 서구 상무대로 123'
);

-- 2. 일반 딜 추가 (deals 테이블)
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
  benefit_type
) VALUES (
  gen_random_uuid(),  -- UUID 자동 생성
  (SELECT id FROM merchants WHERE name = '상무초밥 본점' LIMIT 1),  -- 방금 추가한 상점의 ID
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
  'DISCOUNT'
);

-- 3. Ghost 딜 추가 (deals 테이블)
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
  benefit_type
) VALUES (
  gen_random_uuid(),  -- UUID 자동 생성
  (SELECT id FROM merchants WHERE name = '상무초밥 본점' LIMIT 1),  -- 같은 상점 사용
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
  'DISCOUNT'
);

-- 4. 두 번째 상점 추가 (양식)
INSERT INTO merchants (
  id,
  name,
  category,
  phone,
  address
) VALUES (
  gen_random_uuid(),
  '어나더키친 상무점',
  '양식',
  '062-234-5678',
  '광주광역시 서구 상무동 456'
);

-- 5. 스테이크 딜 추가
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
  benefit_type
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM merchants WHERE name = '어나더키친 상무점' LIMIT 1),
  '토마호크 스테이크 세트',
  128000,
  40000,
  'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=1287&auto=format&fit=crop',
  10,
  2,
  NOW() + INTERVAL '2 hours',
  'ACTIVE',
  false,
  NULL,
  'DISCOUNT'
);

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
  m.name as merchant_name,
  m.category
FROM deals d
LEFT JOIN merchants m ON d.merchant_id = m.id
WHERE d.status = 'ACTIVE'
ORDER BY d.expires_at ASC;