const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, deleteDoc, doc, getDocs, collection } = require('firebase-admin/firestore');

// Use application default credentials
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');

if (!serviceAccount.private_key) {
  console.error('❌ Google Application Credentials not found');
  console.log('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'lokey-service'
});

const db = getFirestore(app);

async function deleteAllCoupons() {
  console.log('🗑️  모든 사용자 쿠폰 데이터 삭제 시작...');

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));

    if (usersSnapshot.empty) {
      console.log('📭 사용자 데이터가 없습니다.');
      return;
    }

    console.log(`👥 ${usersSnapshot.size}명의 사용자 데이터를 찾았습니다.`);

    // Delete coupons for each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🗑️  사용자 ${userId}의 쿠폰 데이터 삭제 중...`);

      await deleteDoc(doc(db, 'users', userId));

      console.log(`✅ 사용자 ${userId}의 데이터 삭제 완료`);
    }

    console.log('🎉 모든 사용자 쿠폰 데이터 삭제 완료!');

  } catch (error) {
    console.error('❌ 쿠폰 데이터 삭제 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

deleteAllCoupons();