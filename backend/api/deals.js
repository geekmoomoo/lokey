const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수 설정 필요');
    throw new Error('Supabase 환경 변수 설정 필요');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // 딜 목록 조회
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

        } else if (req.method === 'POST') {
            // 딜 생성
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
        } else {
            res.status(405).json({
                success: false,
                error: 'GET, POST 메소드만 허용됩니다.'
            });
        }
    } catch (error) {
        console.error('❌ 딜 처리 중 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '딜 처리 중 오류가 발생했습니다.',
            details: error.message
        });
    }
};