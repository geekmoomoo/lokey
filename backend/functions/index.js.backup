const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const mime = require('mime-types');

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PARTNERS_COLLECTION = 'partners';
const DEALS_COLLECTION = 'deals';

const corsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  optionsSuccessStatus: 204
});

const wrapHandler = (handler) =>
  functions.https.onRequest(async (req, res) => {
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
  });

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

  console.log('파트너 로그인 성공:', partnerData.store_name);
  res.json({
    success: true,
    message: `${partnerData.store_name}님 환영합니다.`,
    partner: partnerDto(partnerDoc)
  });
};

const listDealsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  let query = db
    .collection(DEALS_COLLECTION)
    .where('is_ghost', '==', false)
    .orderBy('expires_at', 'asc');

  if (req.query.status) {
    query = query.where('status', '==', req.query.status);
  }

  const snapshot = await query.get();
  const deals = snapshot.docs.map(dealDto);

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

  const dealPayload = {
    merchant_id: dealData.restaurant.id || `merchant-${Date.now()}`,
    restaurant_name: dealData.restaurant.name,
    restaurant_category: dealData.restaurant.category,
    restaurant_location: dealData.restaurant.location,
    title: dealData.title,
    original_price: dealData.originalPrice ?? 0,
    discount_amount: dealData.discountAmount ?? 0,
    image_url: dealData.imageUrl ?? '',
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
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: '지원하지 않는 HTTP 메서드입니다.' });
    return;
  }

  const { base64Data, fileName } = req.body;
  if (!base64Data) {
    res.status(400).json({ success: false, error: '이미지 데이터를 지정하세요.' });
    return;
  }

  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    res.status(400).json({ success: false, error: '유효한 base64 이미지 형식이 아닙니다.' });
    return;
  }

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const extension = mime.extension(contentType) || 'png';
  const safeFileName = `${fileName || `deal-${Date.now()}`}.${extension}`;
  const file = bucket.file(`deal-images/${safeFileName}`);

  await file.save(buffer, {
    contentType,
    metadata: {
      firebaseStorageDownloadTokens: crypto.randomUUID()
    }
  });
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  res.json({ success: true, url: publicUrl });
};

exports.generateImage = wrapHandler(generateImageHandler);
exports.registerPartner = wrapHandler(registerPartnerHandler);
exports.loginPartner = wrapHandler(loginPartnerHandler);
exports.createDeal = wrapHandler(createDealHandler);
exports.listDeals = wrapHandler(listDealsHandler);
exports.updateDeal = wrapHandler(updateDealHandler);
exports.uploadImage = wrapHandler(uploadImageHandler);
