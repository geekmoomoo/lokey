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
};