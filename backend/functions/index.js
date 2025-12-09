const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
// Firebase Admin SDK imports

// Always use production Firebase
admin.initializeApp({
  projectId: 'lokey-service',
  storageBucket: process.env.STORAGE_BUCKET || 'lokey-service.appspot.com',
  databaseURL: 'https://lokey-service-default-rtdb.firebaseio.com'
});

// Initialize Firestore
const db = admin.firestore();
let bucket;

try {
  // Use the default bucket without specifying name to let Firebase Admin SDK auto-detect
  bucket = admin.storage().bucket();
  console.log('Storage bucket initialized with default bucket:', bucket.name);
} catch (error) {
  console.error('Storage bucket not configured:', error.message);
  bucket = null;
}
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    console.log('Google GenAI initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google GenAI:', error.message);
    genAI = null;
  }
} else {
  console.log('GEMINI_API_KEY environment variable not set');
}

const PARTNERS_COLLECTION = 'partners';
const DEALS_COLLECTION = 'deals';
const USERS_COLLECTION = 'users';

const corsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  optionsSuccessStatus: 204
});

const wrapHandler = (handler) =>
  functions.https.onRequest(
    {
      region: 'us-central1',
      memory: '1GiB',
      timeoutSeconds: 300,
      invoker: 'public',
      minInstances: 0,
      maxInstances: 10
    },
    async (req, res) => {
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      });

      corsMiddleware(req, res, async () => {
        if (req.method === 'OPTIONS') {
          res.status(204).send('');
          return;
        }
        try {
          await handler(req, res);
        } catch (error) {
          console.error('Unhandled backend error:', error);
          res.status(500).json({
            success: false,
            error: '서버 처리 중 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      });
    }
  );

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const partnerDto = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    businessRegNumber: data.business_reg_number,
    storeName: data.store_name,
    storeType: data.store_type,
    category: data.category,
    address: data.address,
    storePhone: data.store_phone,
    ownerName: data.owner_name,
    ownerPhone: data.owner_phone,
    planType: data.plan_type,
    status: data.status
  };
};

const dealDto = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    originalPrice: Number(data.original_price ?? 0),
    discountAmount: Number(data.discount_amount ?? 0),
    imageUrl: data.image_url ?? '',
    totalCoupons: Number(data.total_coupons ?? 0),
    remainingCoupons: Number(data.remaining_coupons ?? 0),
    expiresAt: data.expires_at ? data.expires_at.toDate() : null,
    status: data.status ?? 'ACTIVE',
    isGhost: Boolean(data.is_ghost),
    usageCondition: data.usage_condition,
    benefitType: data.benefit_type,
    customBenefit: data.custom_benefit,
    restaurant: data.restaurant ?? {
      id: data.merchant_id ?? 'unknown',
      name: data.restaurant_name || 'Unknown Restaurant',
      category: data.restaurant_category || 'Uncategorized',
      distance: 0,
      rating: 0,
      reviewCount: 0,
      location: data.restaurant_location || { lat: 0, lng: 0 }
    }
  };
};

const generateImageHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  if (!genAI) {
    res.status(503).json({ success: false, error: '이미지 생성 서비스를 사용할 수 없습니다. API 키가 설정되지 않았습니다.' });
    return;
  }

  const { prompt, style } = req.body;
  if (!prompt) {
    res.status(400).json({ success: false, error: '이미지 생성에 필요한 프롬프트를 입력하세요.' });
    return;
  }

  console.log('이미지 생성 요청:', { prompt: prompt.substring(0, 50) + '...', style });

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: '9:16',
        guidanceScale: 6.2
      }
    }
  });

  const imagePart = response?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!imagePart || !imagePart.inlineData?.data) {
    throw new Error('이미지 데이터를 생성하지 못했습니다.');
  }

  const imageBase64 = imagePart.inlineData.data;
  res.json({ success: true, image: `data:image/png;base64,${imageBase64}` });
};

const registerPartnerHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const {
    businessRegNumber,
    password,
    storeName,
    storeType = '브랜드',
    category,
    categoryCustom = '',
    address,
    storePhone = '',
    ownerName,
    ownerPhone
  } = req.body;

  if (!businessRegNumber || !password || !storeName || !ownerName || !ownerPhone) {
    res.status(400).json({ success: false, error: '필수 항목을 모두 입력해 주세요.' });
    return;
  }

  const snapshot = await db
    .collection(PARTNERS_COLLECTION)
    .where('business_reg_number', '==', businessRegNumber)
    .limit(1)
    .get();
  if (!snapshot.empty) {
    res.status(409).json({
      success: false,
      error: '이미 등록된 사업자번호입니다.'
    });
    return;
  }

  const hashedPassword = hashPassword(password);
  const finalCategory = category === 'OTHER' ? categoryCustom : category;

  const partnerPayload = {
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
    status: 'ACTIVE',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await db.collection(PARTNERS_COLLECTION).add(partnerPayload);
  console.log('신규 파트너 등록:', storeName);

  res.json({
    success: true,
    message: '파트너 등록이 완료되었습니다.',
    partnerId: docRef.id
  });
};

const loginPartnerHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const { businessRegNumber, password } = req.body;
  if (!businessRegNumber || !password) {
    res.status(400).json({ success: false, error: '사업자번호와 비밀번호를 입력하세요.' });
    return;
  }

  const snapshot = await db
    .collection(PARTNERS_COLLECTION)
    .where('business_reg_number', '==', businessRegNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    res.status(404).json({
      success: false,
      error: '등록된 파트너를 찾을 수 없습니다.'
    });
    return;
  }

  const partnerDoc = snapshot.docs[0];
  const partnerData = partnerDoc.data();
  const inputHash = hashPassword(password);

  if (inputHash !== partnerData.password) {
    res.status(401).json({
      success: false,
      error: '비밀번호가 일치하지 않습니다.'
    });
    return;
  }

  const partner = partnerDto(partnerDoc);
  console.log('파트너 로그인 성공:', {
    storeName: partnerData.store_name,
    partnerId: partner.id,
    businessRegNumber: partner.businessRegNumber
  });
  res.json({
    success: true,
    message: `${partnerData.store_name}님 환영합니다.`,
    partner: partner
  });
};

const updatePartnerHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const { partnerId, updates } = req.body;
  if (!partnerId || !updates || typeof updates !== 'object') {
    res.status(400).json({ success: false, error: '유효한 partnerId와 업데이트 데이터를 전달하세요.' });
    return;
  }

  // Check if partner exists
  const partnerDoc = await db.collection(PARTNERS_COLLECTION).doc(partnerId).get();
  if (!partnerDoc.exists) {
    res.status(404).json({ success: false, error: '파트너를 찾을 수 없습니다.' });
    return;
  }

  const fieldsToUpdate = {};

  // Map frontend field names to database field names
  if (updates.storeName !== undefined) fieldsToUpdate.store_name = updates.storeName;
  if (updates.storeType !== undefined) fieldsToUpdate.store_type = updates.storeType;
  if (updates.category !== undefined) fieldsToUpdate.category = updates.category;
  if (updates.address !== undefined) fieldsToUpdate.address = updates.address;
  if (updates.storePhone !== undefined) fieldsToUpdate.store_phone = updates.storePhone;
  if (updates.ownerName !== undefined) fieldsToUpdate.owner_name = updates.ownerName;
  if (updates.ownerPhone !== undefined) fieldsToUpdate.owner_phone = updates.ownerPhone;
  if (updates.planType !== undefined) fieldsToUpdate.plan_type = updates.planType;

  // Add updated timestamp
  fieldsToUpdate.updated_at = admin.firestore.FieldValue.serverTimestamp();

  if (!Object.keys(fieldsToUpdate).length) {
    res.json({ success: true, message: '업데이트할 필드가 없습니다.' });
    return;
  }

  await db.collection(PARTNERS_COLLECTION).doc(partnerId).update(fieldsToUpdate);
  console.log('파트너 정보 업데이트:', partnerId, Object.keys(fieldsToUpdate));

  // Return updated partner data
  const updatedDoc = await db.collection(PARTNERS_COLLECTION).doc(partnerId).get();
  res.json({
    success: true,
    message: '파트너 정보가 업데이트되었습니다.',
    partner: partnerDto(updatedDoc)
  });
};

const listDealsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  let query = db
    .collection(DEALS_COLLECTION)
    .where('is_ghost', '==', false);

  // Filter by partner if merchantId is provided
  if (req.query.merchantId) {
    console.log('딜 조회 필터링 - merchantId:', req.query.merchantId);
    query = query.where('merchant_id', '==', req.query.merchantId);

    // Fallback: if no deals found with merchant_id, try business_reg_number
    const snapshot = await query.get();
    if (snapshot.empty && req.query.businessRegNumber) {
      console.log('merchant_id로 딜을 찾지 못해 business_reg_number로 시도:', req.query.businessRegNumber);
      query = db
        .collection(DEALS_COLLECTION)
        .where('is_ghost', '==', false)
        .where('business_reg_number', '==', req.query.businessRegNumber);
    }
  }

  if (req.query.status) {
    query = query.where('status', '==', req.query.status);
  }

  const snapshot = await query.get();
  const deals = snapshot.docs.map(dealDto);

  console.log('조회된 딜 수:', deals.length);
  deals.forEach(deal => {
    console.log('딜 정보:', {
      title: deal.title,
      merchant_id: deal.restaurant?.id
    });
  });

  // Sort on client side for now (until index is created)
  if (deals.length > 0) {
    deals.sort((a, b) => {
      const dateA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const dateB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  res.json({
    success: true,
    deals
  });
};

const createDealHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const dealData = req.body;
  if (!dealData || !dealData.title || !dealData.restaurant) {
    res.status(400).json({ success: false, error: '필수 딜 정보를 모두 입력해 주세요.' });
    return;
  }

  let imageUrl = '';

  // Handle base64 image data - upload to Storage if it's a data URL
  if (dealData.imageUrl && dealData.imageUrl.startsWith('data:')) {
    if (!bucket) {
      res.status(503).json({ success: false, error: 'Storage 서비스를 사용할 수 없습니다.' });
      return;
    }

    try {
      const matches = dealData.imageUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        res.status(400).json({ success: false, error: '유효하지 않은 이미지 형식입니다.' });
        return;
      }

      const contentType = matches[1];
      const base64Data = matches[2];

      // Check file size (max 5MB in base64)
      const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
      const sizeInMB = sizeInBytes / (1024 * 1024);
      console.log(`Image size: ${sizeInMB.toFixed(2)}MB`);

      if (sizeInMB > 5) {
        res.status(413).json({
          success: false,
          error: '이미지 크기가 5MB를 초과했습니다.'
        });
        return;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const extension = mime.extension(contentType) || 'png';

      // Generate unique filename using UUID to avoid collisions
      const uniqueId = uuidv4();
      const safeFileName = `deal-${uniqueId}-${Date.now()}.${extension}`;
      const file = bucket.file(`deal-images/${safeFileName}`);

      console.log(`Uploading image: ${file.name}, size: ${sizeInMB.toFixed(2)}MB`);

      await file.save(buffer, {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uniqueId,
          originalSize: sizeInBytes,
          uploadTime: new Date().toISOString()
        }
      });

      await file.makePublic();

      imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      console.log('이미지 업로드 성공:', imageUrl);
    } catch (error) {
      console.error('이미지 업로드 실패 상세:', {
        error: error.message,
        stack: error.stack,
        dealTitle: dealData.title,
        imageLength: dealData.imageUrl?.length
      });

      // More specific error messages
      let errorMessage = '이미지 업로드에 실패했습니다.';
      if (error.message.includes('Quota exceeded')) {
        errorMessage = '스토리지 용량이 초과되었습니다.';
      } else if (error.message.includes('Permission denied')) {
        errorMessage = '스토리지 접근 권한이 없습니다.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '업로드 시간이 초과되었습니다.';
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      return;
    }
  } else {
    imageUrl = dealData.imageUrl ?? '';
  }

  const dealPayload = {
    merchant_id: dealData.restaurant.id || `merchant-${Date.now()}`,
    restaurant_name: dealData.restaurant.name,
    restaurant_category: dealData.restaurant.category,
    restaurant_location: dealData.restaurant.location,
    title: dealData.title,
    original_price: dealData.originalPrice ?? 0,
    discount_amount: dealData.discountAmount ?? 0,
    image_url: imageUrl,
    total_coupons: dealData.totalCoupons ?? 0,
    remaining_coupons: dealData.remainingCoupons ?? 0,
    expires_at: dealData.expiresAt ? admin.firestore.Timestamp.fromDate(new Date(dealData.expiresAt)) : null,
    status: dealData.status || 'ACTIVE',
    is_ghost: Boolean(dealData.isGhost),
    usage_condition: dealData.usageCondition ?? null,
    benefit_type: dealData.benefitType ?? null,
    custom_benefit: dealData.customBenefit ?? null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await db.collection(DEALS_COLLECTION).add(dealPayload);
  console.log('딜 생성:', dealData.title);

  res.json({
    success: true,
    message: '딜이 등록되었습니다.',
    dealId: docRef.id
  });
};

const updateDealHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const { dealId, updates } = req.body;
  if (!dealId || !updates || typeof updates !== 'object') {
    res.status(400).json({ success: false, error: '유효한 dealId와 업데이트 데이터를 전달하세요.' });
    return;
  }

  const fieldsToUpdate = {};
  if (updates.status) fieldsToUpdate.status = updates.status;
  if (updates.remainingCoupons !== undefined) fieldsToUpdate.remaining_coupons = updates.remainingCoupons;
  if (updates.totalCoupons !== undefined) fieldsToUpdate.total_coupons = updates.totalCoupons;
  if (updates.expiresAt) {
    fieldsToUpdate.expires_at = admin.firestore.Timestamp.fromDate(new Date(updates.expiresAt));
  }

  if (!Object.keys(fieldsToUpdate).length) {
    res.json({ success: true, message: '업데이트할 필드가 없습니다.' });
    return;
  }

  await db.collection(DEALS_COLLECTION).doc(dealId).update(fieldsToUpdate);
  res.json({ success: true, message: '딜을 업데이트했습니다.' });
};

const uploadImageHandler = async (req, res) => {
  console.log('uploadImageHandler called');

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  console.log('Bucket check:', bucket ? 'bucket exists' : 'bucket is null');

  if (!bucket) {
    console.error('Storage bucket not available');
    res.status(503).json({ success: false, error: 'Storage 서비스를 사용할 수 없습니다.' });
    return;
  }

  const { base64Data, fileName } = req.body;
  console.log('Request data:', { base64Data: base64Data ? 'present' : 'missing', fileName });

  if (!base64Data) {
    res.status(400).json({ success: false, error: '이미지 데이터를 지정하세요.' });
    return;
  }

  try {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid base64 format');
      res.status(400).json({ success: false, error: '유효한 base64 이미지 형식이 아닙니다.' });
      return;
    }

    const contentType = matches[1];
    const base64Image = matches[2];

    // Check file size (max 5MB)
    const sizeInBytes = Buffer.byteLength(base64Image, 'base64');
    const sizeInMB = sizeInBytes / (1024 * 1024);
    console.log(`Upload image size: ${sizeInMB.toFixed(2)}MB`);

    if (sizeInMB > 5) {
      res.status(413).json({
        success: false,
        error: '이미지 크기가 5MB를 초과했습니다.'
      });
      return;
    }

    const buffer = Buffer.from(base64Image, 'base64');
    const extension = mime.extension(contentType) || 'png';

    // Generate unique filename using UUID
    const uniqueId = uuidv4();
    const safeFileName = `${fileName || 'upload'}-${uniqueId}-${Date.now()}.${extension}`;
    const file = bucket.file(`deal-images/${safeFileName}`);

    console.log(`Uploading image: ${file.name}, size: ${sizeInMB.toFixed(2)}MB`);

    await file.save(buffer, {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: uniqueId,
        originalSize: sizeInBytes,
        uploadTime: new Date().toISOString()
      }
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    console.log('Image upload successful:', publicUrl);

    res.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      size: sizeInMB.toFixed(2)
    });
  } catch (error) {
    console.error('Image upload failed:', {
      error: error.message,
      stack: error.stack,
      fileName: fileName
    });

    let errorMessage = '이미지 업로드에 실패했습니다.';
    if (error.message.includes('Quota exceeded')) {
      errorMessage = '스토리지 용량이 초과되었습니다.';
    } else if (error.message.includes('Permission denied')) {
      errorMessage = '스토리지 접근 권한이 없습니다.';
    } else if (error.message.includes('timeout')) {
      errorMessage = '업로드 시간이 초과되었습니다.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Users & Coupons API
const getUserCouponsHandler = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ success: false, error: '사용자 ID가 필요합니다.' });
    return;
  }

  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

  if (!userDoc.exists) {
    res.json({ success: true, coupons: [] });
    return;
  }

  const userData = userDoc.data();
  const coupons = userData.coupons || [];

  res.json({ success: true, coupons });
};

const claimCouponHandler = async (req, res) => {
  const { userId, dealId, dealData } = req.body;

  console.log('🔍 Claim coupon request data:', {
    userId: userId ? 'present' : 'missing',
    dealId: dealId ? 'present' : 'missing',
    dealData: dealData ? 'present' : 'missing',
    fullBody: req.body
  });

  if (!userId || !dealId || !dealData) {
    res.status(400).json({
      success: false,
      error: '필수 정보가 누락되었습니다.',
      details: {
        userId: !!userId,
        dealId: !!dealId,
        dealData: !!dealData
      }
    });
    return;
  }

  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userDoc = await userRef.get();

  let userData;
  let existingCoupons = [];

  if (!userDoc.exists) {
    // Create new user document
    await userRef.set({
      uid: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      coupons: []
    });
    userData = { uid: userId, coupons: [] };
  } else {
    userData = userDoc.data() || {};
    existingCoupons = userData.coupons || [];
  }

  // Check if already claimed
  const alreadyClaimed = existingCoupons.some(coupon =>
    coupon.dealId === dealId && coupon.status === 'AVAILABLE'
  );

  if (alreadyClaimed) {
    res.status(400).json({ success: false, error: '이미 발급된 쿠폰입니다.' });
    return;
  }

  const newCoupon = {
    id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dealId,
    title: dealData.title,
    restaurantName: dealData.restaurantName,
    discountAmount: dealData.discountAmount,
    imageUrl: dealData.imageUrl,
    status: 'AVAILABLE',
    claimedAt: admin.firestore.Timestamp.fromDate(new Date()),
    expiresAt: dealData.expiresAt instanceof Date
      ? admin.firestore.Timestamp.fromDate(dealData.expiresAt)
      : dealData.expiresAt,
    location: dealData.location,
    usageCondition: dealData.usageCondition || ''
  };

  await userRef.set({
    uid: userId,
    coupons: admin.firestore.FieldValue.arrayUnion(newCoupon)
  }, { merge: true });

  // Update deal's remaining coupons
  const dealRef = db.collection(DEALS_COLLECTION).doc(dealId);
  console.log(`📉 Updating remaining coupons for deal ${dealId}`);
  await dealRef.update({
    remaining_coupons: admin.firestore.FieldValue.increment(-1)
  });
  console.log(`✅ Successfully decremented remaining coupons for deal ${dealId}`);

  res.json({ success: true, coupon: newCoupon });
};

const useCouponHandler = async (req, res) => {
  const { userId, couponId } = req.body;

  if (!userId || !couponId) {
    res.status(400).json({ success: false, error: '필수 정보가 누락되었습니다.' });
    return;
  }

  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
    return;
  }

  const userData = userDoc.data();
  const coupons = userData.coupons || [];

  const updatedCoupons = coupons.map(coupon => {
    if (coupon.id === couponId) {
      return {
        ...coupon,
        status: 'USED',
        usedAt: admin.firestore.Timestamp.fromDate(new Date()),
        hasGoldenKey: true
      };
    }
    return coupon;
  });

  await userRef.update({ coupons: updatedCoupons });

  res.json({ success: true });
};

// Temporary function to clear all coupons
const clearAllCouponsHandler = async (req, res) => {
  console.log('🗑️ Clearing all coupons...');

  try {
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();

    if (usersSnapshot.empty) {
      res.json({ success: true, message: 'No users found' });
      return;
    }

    let deletedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      await userDoc.ref.update({
        coupons: admin.firestore.FieldValue.delete()
      });
      deletedCount++;
    }

    console.log(`✅ Cleared coupons for ${deletedCount} users`);
    res.json({ success: true, deletedUsers: deletedCount, message: 'All coupons cleared' });

  } catch (error) {
    console.error('❌ Error clearing coupons:', error);
    res.status(500).json({ success: false, error: 'Failed to clear coupons' });
  }
};

exports.generateImage = wrapHandler(generateImageHandler);
exports.registerPartner = wrapHandler(registerPartnerHandler);
exports.loginPartner = wrapHandler(loginPartnerHandler);
exports.updatePartner = wrapHandler(updatePartnerHandler);
exports.createDeal = wrapHandler(createDealHandler);
exports.listDeals = wrapHandler(listDealsHandler);
exports.updateDeal = wrapHandler(updateDealHandler);
exports.uploadImage = wrapHandler(uploadImageHandler);
exports.getUserCoupons = wrapHandler(getUserCouponsHandler);
exports.claimCoupon = wrapHandler(claimCouponHandler);
exports.useCoupon = wrapHandler(useCouponHandler);
exports.clearAllCoupons = wrapHandler(clearAllCouponsHandler);
