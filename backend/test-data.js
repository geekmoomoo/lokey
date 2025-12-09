const admin = require('firebase-admin');
const serviceAccount = require('./lokey-service-firebase-adminsdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'lokey-service'
});

const db = admin.firestore();

async function createTestData() {
  console.log('Creating test data...');

  // Create a test partner
  const partnerData = {
    business_reg_number: '1112233333',
    password: 'test123',
    store_name: '테스트 매장',
    store_type: '본점',
    category: 'KOREAN',
    address: '테스트 주소',
    store_phone: '010-1234-5678',
    owner_name: '테스트 사장',
    owner_phone: '010-1234-5678',
    plan_type: 'REGULAR',
    status: 'ACTIVE',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  const partnerRef = await db.collection('partners').add(partnerData);
  console.log('Created partner:', partnerRef.id);

  // Create test deals for this partner
  const deal1 = {
    merchant_id: partnerRef.id,
    business_reg_number: '1112233333',
    restaurant_name: '테스트 매장',
    restaurant_category: 'KOREAN',
    title: '테스트 광고 1',
    original_price: 10000,
    discount_amount: 2000,
    image_url: 'https://via.placeholder.com/300x400',
    total_coupons: 50,
    remaining_coupons: 30,
    expires_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'ACTIVE',
    is_ghost: false,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  const deal2 = {
    merchant_id: partnerRef.id,
    business_reg_number: '1112233333',
    restaurant_name: '테스트 매장',
    restaurant_category: 'KOREAN',
    title: '테스트 광고 2',
    original_price: 15000,
    discount_amount: 3000,
    image_url: 'https://via.placeholder.com/300x400',
    total_coupons: 100,
    remaining_coupons: 80,
    expires_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    status: 'ACTIVE',
    is_ghost: false,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('deals').add(deal1);
  await db.collection('deals').add(deal2);

  console.log('Created test deals');
  process.exit(0);
}

createTestData().catch(console.error);