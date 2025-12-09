const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Read service account key
const serviceAccount = JSON.parse(fs.readFileSync('/Users/genie/Desktop/lokey/serviceAccountKey.json', 'utf8'));

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'lokey-service'
});

const db = getFirestore();

async function resetDatabase() {
  console.log('🗑️  데이터베이스 초기화 시작...');

  try {
    // Delete all collections
    const collections = ['partners', 'deals', 'coupons', 'users', 'claimed_coupons'];

    for (const collectionName of collections) {
      console.log(`📁 ${collectionName} 컬렉션 삭제 중...`);

      const snapshot = await db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`   ✅ ${collectionName} 컬렉션이 이미 비어있습니다`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedCount = 0;

      while (deletedCount < snapshot.size) {
        const batch = db.batch();
        const batchEnd = Math.min(deletedCount + batchSize, snapshot.size);

        for (let i = deletedCount; i < batchEnd; i++) {
          batch.delete(snapshot.docs[i].ref);
        }

        await batch.commit();
        deletedCount = batchEnd;
        console.log(`   📊 ${collectionName}에서 ${deletedCount}/${snapshot.size}개 문서 삭제 완료`);
      }

      console.log(`   ✅ ${collectionName} 컬렉션에서 총 ${snapshot.size}개 문서 삭제 완료`);
    }

    console.log('🎉 모든 데이터 삭제 완료!');
    console.log('🔄 데이터베이스가 성공적으로 초기화되었습니다.');

  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류 발생:', error);
    process.exit(1);
  }
}

// 확인 메시지
console.log('⚠️  경고: 이 스크립트는 프로덕션 데이터베이스의 모든 데이터를 영구적으로 삭제합니다.');
console.log('정말 진행하시겠습니까? (yes/no):');

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const answer = chunk.trim().toLowerCase();
    if (answer === 'yes') {
      resetDatabase();
    } else {
      console.log('❌ 데이터 삭제가 취소되었습니다.');
      process.exit(0);
    }
  }
});