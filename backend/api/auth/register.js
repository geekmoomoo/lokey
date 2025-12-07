const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase 클라이언트
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수 설정 필요');
    throw new Error('Supabase 환경 변수 설정 필요');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SHA-256 해싱 함수
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'POST 메소드만 허용됩니다.'
        });
    }

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
};