-- 기존 평문 비밀번호를 해싱으로 마이그레이션하는 SQL 스크립트
-- 주의: 이 스크립트는 한 번만 실행해야 합니다!

-- 해싱된 비밀번호를 저장할 임시 컬럼 추가
ALTER TABLE partners
ADD COLUMN password_hash VARCHAR(255);

-- 이 스크립트는 Node.js/Python 등에서 실행해야 합니다
-- 아래는 예시 Node.js 스크립트 (migrate-passwords.js)

/*
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase 설정
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // 서비스 롤 키 사용 필수

const supabase = createClient(supabaseUrl, supabaseKey);

// SHA-256 해싱 함수
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function migratePasswords() {
    try {
        // 모든 파트너 데이터 가져오기
        const { data: partners, error } = await supabase
            .from('partners')
            .select('id, business_reg_number, password');

        if (error) {
            console.error('파트너 데이터 조회 실패:', error);
            return;
        }

        console.log(`${partners.length}개의 파트너 데이터 마이그레이션 시작...`);

        for (const partner of partners) {
            // 이미 해싱된 비밀번호는 건너뛰기
            if (partner.password && !partner.password.startsWith('a') && !partner.password.includes('a')) {
                // 평문 비밀번호 해싱
                const hashedPassword = hashPassword(partner.password);

                // 해싱된 비밀번호로 업데이트
                const { error: updateError } = await supabase
                    .from('partners')
                    .update({ password_hash: hashedPassword })
                    .eq('id', partner.id);

                if (updateError) {
                    console.error(`파트너 ${partner.business_reg_number} 업데이트 실패:`, updateError);
                } else {
                    console.log(`✅ ${partner.business_reg_number} 비밀번호 마이그레이션 완료`);
                }
            } else {
                console.log(`⏭️ ${partner.business_reg_number} 이미 해싱됨 또는 빈 비밀번호`);
            }
        }

        // 마이그레이션 완료 후 평문 비밀번호 컬럼 삭제
        console.log('\n=== 마이그레이션 완료 ===');
        console.log('아래 SQL을 Supabase에서 실행하여 평문 비밀번호 컬럼 삭제:');
        console.log('ALTER TABLE partners DROP COLUMN password;');
        console.log('ALTER TABLE partners RENAME COLUMN password_hash TO password;');

    } catch (error) {
        console.error('마이그레이션 중 오류:', error);
    }
}

migratePasswords();
*/