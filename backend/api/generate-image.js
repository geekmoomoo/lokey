const { GoogleGenerativeAI } = require('@google/generative-ai');

// Google AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        const { prompt, style } = req.body;

        console.log('🎨 이미지 생성 요청:', { prompt: prompt.substring(0, 50) + '...', style });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: Buffer.alloc(0)
                }
            }
        ]);

        const imageBase64 = result.response.candidates[0].content.parts
            .find(part => part.inlineData)?.data
            .toString('base64');

        res.json({ success: true, image: `data:image/png;base64,${imageBase64}` });
    } catch (error) {
        console.error('❌ 이미지 생성 오류:', error.message);
        res.status(500).json({
            success: false,
            error: '이미지 생성 중 오류 발생',
            details: error.message
        });
    }
};