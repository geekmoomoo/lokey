const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase 클라이언트 (서비스 롤 키 사용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수 설정 필요');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Google AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// SHA-256 해싱 함수
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// 미들웨어 설정
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // 개발 서버 허용
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 헬스케이딩
app.use('/api', (req, res, next) => {
    console.log(`📥 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// API 라우트

// 1. 이미지 생성 (Gemini API 프록시)
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, style } = req.body;

        console.log('🎨 이미지 생성 요청:', { prompt: prompt.substring(0, 50) + '...', style });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: Buffer.alloc(0)
                }
            }
        ]);

        const imageBase64 = result.response.candidates[0].content.parts
            .find(part => part.inlineData)?.data
            .toString('base64');

        res.json({ success: true, image: `data:image/png;base64,${imageBase64}` });
    } catch (error) {
        console.error('❌ 이미지 생성 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '이미지 생성 중 오류 발생',
            details: error.message
        });
    }
});

// 2. 파트너 가입
app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            businessRegNumber,
            password,
            storeName,
            storeType = '본점',
            category,
            categoryCustom = '',
            address,
            storePhone = '',
            ownerName,
            ownerPhone
        } = req.body;

        // 필수 필드 검증
        if (!businessRegNumber || !password || !storeName || !ownerName || !ownerPhone) {
            return res.status(400).json({
                success: false,
                error: '필수 정보를 모두 입력해주세요.'
            });
        }

        // 비밀번호 해싱
        const hashedPassword = hashPassword(password);

        // 최종 카테고리 결정
        const finalCategory = category === 'OTHER' ? categoryCustom : category;

        // 파트너 데이터 저장
        const { data, error } = await supabase
            .from('partners')
            .insert({
                business_reg_number: businessRegNumber,
                password: hashedPassword,
                store_name: storeName,
                store_type: storeType,
                category: finalCategory,
                address,
                store_phone: storePhone,
                owner_name: ownerName,
                owner_phone: ownerPhone,
                plan_type: 'REGULAR',
                status: 'ACTIVE'
            })
            .select();

        if (error) {
            console.error('❌ 파트너 등록 오류:', error);
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: '이미 등록된 사업자등록번호입니다.'
                });
            }
            throw error;
        }

        console.log('✅ 새 파트너 등록:', storeName);
        res.json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            partnerId: data[0].id
        });
    } catch (error) {
        console.error('❌ 파트너 등록 중 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 3. 파트너 로그인
app.post('/api/auth/login', async (req, res) => {
    try {
        const { businessRegNumber, password } = req.body;

        if (!businessRegNumber || !password) {
            return res.status(400).json({
                success: false,
                error: '사업자등록번호와 비밀번호를 입력해주세요.'
            });
        }

        // 파트너 정보 조회
        const { data, error } = await supabase
            .from('partners')
            .select('*')
            .eq('business_reg_number', businessRegNumber)
            .single();

        if (error || !data) {
            console.log('❌ 파트너 없음:', businessRegNumber);
            return res.status(404).json({
                success: false,
                error: '등록되지 않은 사업자등록번호입니다.'
            });
        }

        // 비밀번호 검증
        const inputHash = hashPassword(password);
        if (inputHash !== data.password) {
            console.log('❌ 비밀번호 불일치:', businessRegNumber);
            return res.status(401).json({
                success: false,
                error: '비밀번호가 올바르지 않습니다.'
            });
        }

        // 로그인 성공 - 민감 정보 제외하고 반환
        const partnerData = {
            id: data.id,
            businessRegNumber: data.business_reg_number,
            storeName: data.store_name,
            storeType: data.store_type,
            category: data.category,
            address: data.address,
            storePhone: data.store_phone,
            ownerName: data.owner_name,
            ownerPhone: data.owner_phone,
            planType: data.plan_type
        };

        console.log('✅ 파트너 로그인 성공:', partnerData.storeName);
        res.json({
            success: true,
            message: `${partnerData.storeName}님, 환영합니다!`,
            partner: partnerData
        });
    } catch (error) {
        console.error('❌ 로그인 중 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 4. 딜 생성
app.post('/api/deals', async (req, res) => {
    try {
        const dealData = req.body;

        // 딜 데이터 저장
        const { data, error } = await supabase
            .from('deals')
            .insert({
                merchant_id: dealData.merchantId,
                title: dealData.title,
                original_price: dealData.originalPrice,
                discount_amount: dealData.discountAmount,
                image_url: dealData.imageUrl,
                total_coupons: dealData.totalCoupons,
                remaining_coupons: dealData.remainingCoupons,
                expires_at: dealData.expiresAt,
                status: 'ACTIVE',
                is_ghost: dealData.isGhost || false,
                usage_condition: dealData.usageCondition || null,
                benefit_type: dealData.benefitType || 'DISCOUNT',
                custom_benefit: dealData.customBenefit || null
            })
            .select();

        if (error) {
            console.error('❌ 딜 생성 오류:', error);
            throw error;
        }

        console.log('✅ 새 딜 생성:', dealData.title);
        res.json({
            success: true,
            message: '딜이 성공적으로 생성되었습니다.',
            dealId: data[0].id
        });
    } catch (error) {
        console.error('❌ 딜 생성 중 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '딜 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 5. 딜 목록 조회
app.get('/api/deals', async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('deals')
            .select('*')
            .eq('is_ghost', false)
            .order('expires_at', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ 딜 목록 조회 오류:', error);
            throw error;
        }

        res.json({
            success: true,
            deals: data
        });
    } catch (error) {
        console.error('❌ 딜 목록 조회 중 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '딜 목록 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 헬스케이션 필터링
app.use((err, req, res, next) => {
    console.error('❌ 서버 오류:', err);
    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? err.message : '서버 오류'
    });
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log('🚀 LO.KEY 백엔드 서버 시작!');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('📡 API 프록시 작동 중...');
    console.log('🔐 API 키 보안 처리 완료');
    console.log('🔗 프론트엔드: http://localhost:5173');
});