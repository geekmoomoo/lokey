-- LO.KEY Demo Data for Supabase
-- Execute this in your Supabase SQL Editor

-- First, insert merchants (상점 정보)
INSERT INTO merchants (
  id,
  name,
  category,
  distance,
  rating,
  review_count,
  location_lat,
  location_lng
) VALUES
-- 일식
('rest-001', '상무초밥 본점', '일식', 350, 4.9, 2350, 35.1544, 126.8524),
('rest-ghost-01', '스시 사카바 (Hidden)', '일식/오마카세', 150, 5.0, 42, 35.1529, 126.8522),

-- 양식
('rest-002', '어나더키친 상무점', '양식', 520, 4.8, 890, 35.1554, 126.8504),

-- 한식
('rest-003', '금호동 명가 갈비', '한식', 1200, 4.6, 432, 35.1504, 126.8474),
('rest-004', '신쭈꾸미 상무본점', '한식', 450, 4.7, 1560, 35.1549, 126.8534),

-- 카페/디저트
('rest-005', '카페 304', '카페/디저트', 600, 4.8, 3200, 35.1514, 126.8524),

-- 치킨
('rest-006', '양동통닭 서구점', '치킨', 2100, 4.5, 512, 35.1614, 126.8464),

-- 샐러드
('rest-007', '보울레시피 풍암점', '샐러드', 1800, 4.7, 210, 35.1474, 126.8544),

-- 버거
('rest-008', '프랭크버거 치평점', '버거', 250, 4.4, 180, 35.1539, 126.8509),

-- 양식 (피자)
('rest-009', '로니로티 광주상무점', '양식', 400, 4.5, 950, 35.1524, 126.8494),

-- 중식
('rest-010', '신락원 상무점', '중식', 650, 4.6, 1120, 35.1549, 126.8484)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  distance = EXCLUDED.distance,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng;

-- Now insert deals (딜/쿠폰 정보)
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
  -- 중복 필드들 (쿼리 최적화용)
  distance,
  rating,
  review_count,
  location_lat,
  location_lng
) VALUES
-- 딜 1: 상무초밥 특선 모듬 초밥
('deal-001', 'rest-001', '특선 모듬 초밥 12p', 22000, 7000,
 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1287&auto=format&fit=crop',
 50, 3,
 NOW() + INTERVAL '1 hour',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "회 두께 실화냐", "초밥 땡겼는데 딱이네", "오마카세급 퀄리티 ㄷㄷ", "사케 한잔 하고싶다", "신선해 보여요!", "회 두께 실화냐", "초밥 땡겼는데 딱이네", "오마카세급 퀄리티 ㄷㄷ", "사케 한잔 하고싶다", "신선해 보여요!"],
 350, 4.9, 2350, 35.1544, 126.8524),

-- 딜 2: Ghost 딜 - 오마카세
('deal-ghost-01', 'rest-ghost-01', '[SECRET] 셰프의 심야 오마카세', 88000, 40000,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1287&auto=format&fit=crop',
 5, 1,
 NOW() + INTERVAL '30 minutes',
 'ACTIVE',
 true,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["쉿 여기 나만 알고싶음", "오마카세 반값 실화?", "예약 전쟁이다", "셰프님 포스 ㄷㄷ", "분위기 미쳤다 진짜", "오늘 밤 주인공은 나"],
 150, 5.0, 42, 35.1529, 126.8522),

-- 딜 3: 토마호크 스테이크
('deal-002', 'rest-002', '토마호크 스테이크 세트', 128000, 40000,
 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=1287&auto=format&fit=crop',
 10, 2,
 NOW() + INTERVAL '2 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "데이트 코스로 딱일듯", "와인 콜키지 되나요?", "스테이크 굽기 예술이네", "파스타 꾸덕한거 보소", "분위기 맛집 인정", "데이트 코스로 딱일듯", "와인 콜키지 되나요?", "스테이크 굽기 예술이네", "파스타 꾸덕한거 보소", "분위기 맛집 인정"],
 520, 4.8, 890, 35.1554, 126.8504),

-- 딜 4: 돼지갈비
('deal-003', 'rest-003', '수제 담양식 돼지갈비 2인', 36000, 12000,
 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1287&auto=format&fit=crop',
 30, 8,
 NOW() + INTERVAL '1.5 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯"],
 1200, 4.6, 432, 35.1504, 126.8474),

-- 딜 5: 쭈꾸미
('deal-004', 'rest-004', '매운 철판 쭈꾸미 볶음', 28000, 9000,
 'https://images.unsplash.com/photo-1582538884036-d885ac6e3913?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
 40, 15,
 NOW() + INTERVAL '2.5 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯"],
 450, 4.7, 1560, 35.1549, 126.8534),

-- 딜 6: 딸기 케이크
('deal-005', 'rest-005', '딸기 듬뿍 생크림 케이크', 42000, 15000,
 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1287&auto=format&fit=crop',
 20, 5,
 NOW() + INTERVAL '40 minutes',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "디저트 배는 따로있지", "인스타 감성 제대로네", "커피 맛집일듯", "당 충전 필요했는데 ㅠㅠ", "케이크 너무 예뻐요", "디저트 배는 따로있지", "인스타 감성 제대로네", "커피 맛집일듯", "당 충전 필요했는데 ㅠㅠ", "케이크 너무 예뻐요"],
 600, 4.8, 3200, 35.1514, 126.8524),

-- 딜 7: 가마솥 통닭
('deal-006', 'rest-006', '옛날 가마솥 통닭 한마리', 21000, 6000,
 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1287&auto=format&fit=crop',
 100, 42,
 NOW() + INTERVAL '3.3 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯", "밥 두공기 순삭각", "소주를 부르는 비주얼", "부모님 모시고 가야지", "한국인은 밥심이지", "반찬도 맛있을 듯"],
 2100, 4.5, 512, 35.1614, 126.8464),

-- 딜 8: 포케 샐러드 (마감 임박)
('deal-007', 'rest-007', '연어 포케 & 아보카도 샐러드', 16000, 4500,
 'https://storage.googleapis.com/d-camping-image/delete/23.png',
 25, 1,
 NOW() + INTERVAL '20 minutes',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요"],
 1800, 4.7, 210, 35.1474, 126.8544),

-- 딜 9: 수제버거
('deal-008', 'rest-008', '더블 치즈 수제버거 세트', 14500, 5000,
 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1287&auto=format&fit=crop',
 60, 28,
 NOW() + INTERVAL '1.8 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요"],
 250, 4.4, 180, 35.1539, 126.8509),

-- 딜 10: 이미 마감된 딜 (테스트용)
('deal-009', 'rest-009', '화덕 고르곤졸라 피자', 19000, 8000,
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1287&auto=format&fit=crop',
 15, 0,
 NOW() - INTERVAL '1 second', -- 이미 마감됨
 'ENDED',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "데이트 코스로 딱일듯", "와인 콜키지 되나요?", "스테이크 굽기 예술이네", "파스타 꾸덕한거 보소", "분위기 맛집 인정", "데이트 코스로 딱일득", "와인 콜키지 되나요?", "스테이크 굽기 예술이네", "파스타 꾸덕한거 보소", "분위기 맛집 인정"],
 400, 4.5, 950, 35.1524, 126.8494),

-- 딜 11: 짬뽕
('deal-010', 'rest-010', '얼큰 차돌 짬뽕', 13000, 4000,
 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1287&auto=format&fit=crop',
 45, 12,
 NOW() + INTERVAL '1.3 hours',
 'ACTIVE',
 false,
 NULL,
 'DISCOUNT',
 NULL,
 ARRAY["와 대박이다", "여기 분위기 깡패네", "가성비 미쳤다..", "지금 가야겠다", "사장님 남는거 있어요?", "친구 태그각 @", "이미 마감 임박 ㄷㄷ", "저장완료!", "오픈런 해야되나", "비주얼 무엇 ㅠㅠ", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요", "맛있겠다 ㅠㅠ", "사장님 센스 굿", "이런 곳이 있었다니", "단골 예약이요", "가보고 싶어요"],
 650, 4.6, 1120, 35.1549, 126.8484)

ON CONFLICT (id) DO UPDATE SET
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

-- Verify data insertion
SELECT
  d.id,
  d.title,
  d.original_price,
  d.discount_amount,
  d.remaining_coupons,
  d.total_coupons,
  d.status,
  d.is_ghost,
  m.name as merchant_name,
  m.category
FROM deals d
LEFT JOIN merchants m ON d.merchant_id = m.id
ORDER BY d.expires_at ASC;