const admin = require('firebase-admin');

// Initialize with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'lokey-service'
});

const db = admin.firestore();

async function deleteAllData() {
  console.log('🗑️  모든 데이터 삭제 시작...');

  try {
    // 컬렉션 목록 가져오기
    const collections = ['partners', 'deals'];

    for (const collectionName of collections) {
      console.log(`📁 ${collectionName} 컬렉션 삭제 중...`);

      const snapshot = await db.collection(collectionName).get();
      const batchSize = snapshot.size;

      if (batchSize === 0) {
        console.log(`   ✅ ${collectionName} 컬렉션이 이미 비어있습니다`);
        continue;
      }

      // Batch로 삭제
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`   ✅ ${collectionName}에서 ${batchSize}개 문서 삭제 완료`);
    }

    console.log('🎉 모든 데이터 삭제 완료!');

  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류 발생:', error);
    process.exit(1);
  }
}

deleteAllData();