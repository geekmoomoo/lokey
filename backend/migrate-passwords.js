const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 환경 변수 로드
require('dotenv').config();

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수 설정 필요 (.env 파일 확인)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SHA-256 해싱 함수
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// 기존 비밀번호 감지 함수
function isHashedPassword(password) {
    // SHA-256 해시는 64자 16진수 문자열
    return /^[a-f0-9]{64}$/.test(password);
}

async function migratePasswords() {
    try {
        console.log('🔐 LO.KEY 비밀번호 마이그레이션 시작...');
        console.log('=====================================');

        // 모든 파트너 데이터 가져오기
        const { data: partners, error } = await supabase
            .from('partners')
            .select('id, business_reg_number, password, store_name')
            .order('created_at', 'asc');

        if (error) {
            console.error('❌ 파트너 데이터 조회 실패:', error);
            return;
        }

        console.log(`📋 총 ${partners.length}개의 파트너 데이터 확인`);

        let migratedCount = 0;
        let alreadyHashedCount = 0;
        let skippedCount = 0;

        for (const partner of partners) {
            const { id, business_reg_number, password, store_name } = partner;

            // 비밀번호가 없거나 이미 해싱된 경우 건너뛰기
            if (!password) {
                console.log(`⏭️ ${store_name} (${business_reg_number}): 비밀번호 없음`);
                skippedCount++;
                continue;
            }

            if (isHashedPassword(password)) {
                console.log(`✅ ${store_name} (${business_reg_number}): 이미 해싱됨`);
                alreadyHashedCount++;
                continue;
            }

            try {
                // 평문 비밀번호 해싱
                const hashedPassword = hashPassword(password);

                // 해싱된 비밀번호로 업데이트
                const { error: updateError } = await supabase
                    .from('partners')
                    .update({ password: hashedPassword })
                    .eq('id', id);

                if (updateError) {
                    console.error(`❌ ${store_name} 업데이트 실패:`, updateError.message);
                    skippedCount++;
                } else {
                    console.log(`✅ ${store_name} (${business_reg_number}): 비밀번호 해싱 완료`);
                    migratedCount++;
                }
            } catch (hashError) {
                console.error(`❌ ${store_name} 해싱 중 오류:`, hashError.message);
                skippedCount++;
            }
        }

        console.log('=====================================');
        console.log('📊 마이그레이션 결과:');
        console.log(`   ✅ 마이그레이션 완료: ${migratedCount}개`);
        console.log(`   ✅ 이미 해싱됨: ${alreadyHashedCount}개`);
        console.log(`   ⏭️  건너뛰기: ${skippedCount}개`);
        console.log('   📋 총 처리: ${partners.length}개`);

        if (migratedCount > 0) {
            console.log('\n🎉 비밀번호 마이그레이션 성공!');
        }

    } catch (error) {
        console.error('❌ 마이그레이션 중 심각 오류:', error);
        process.exit(1);
    }
}

// 마이그레이션 실행
migratePasswords();