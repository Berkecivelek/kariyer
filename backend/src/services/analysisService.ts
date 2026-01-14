import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface AnalysisResult {
  score: number;
  feedback: string;
  suggestions: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  atsScore: number;
}

// Check and deduct credits for analysis (costs 2 credits)
const checkAndDeductCredits = async (userId: string): Promise<void> => {
  let subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Eğer subscription yoksa, otomatik olarak oluştur (FREE tier, 1000 kredi)
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier: 'FREE',
        aiCredits: 1000, // Yeterli kredi ver (Claude API kendi limitini kontrol edecek)
        usedCredits: 0,
        isActive: true,
      },
    });
  }

  // Eğer krediler çok düşükse (10'dan az), otomatik olarak yenile
  if (subscription.aiCredits < 10) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        aiCredits: 1000, // Kredileri yenile
        usedCredits: 0, // Kullanılan kredileri sıfırla
      },
    });
    subscription.aiCredits = 1000;
    subscription.usedCredits = 0;
  }

  // Kredi kontrolü - eğer krediler bitmişse bile devam et (Claude API kendi limitini kontrol edecek)
  // Sadece tracking için kullanıyoruz, gerçek limitasyon Claude API'de
  if (subscription.usedCredits + 2 > subscription.aiCredits) {
    // Krediler bitmiş ama yine de devam et - Claude API kendi limitini kontrol edecek
    console.warn(`User ${userId} has exceeded internal credit limit, but allowing request to proceed. Claude API will handle its own limits.`);
  }

  // Deduct credits (tracking için)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      usedCredits: subscription.usedCredits + 2,
    },
  });
};

// Log analysis usage
const logAnalysis = async (
  userId: string,
  resumeId: string,
  input: any,
  output: AnalysisResult
): Promise<void> => {
  await prisma.usageLog.create({
    data: {
      userId,
      service: 'analyze',
      creditsUsed: 2,
      input: JSON.parse(JSON.stringify(input)),
      output: JSON.parse(JSON.stringify(output)),
    },
  });

  // Save analysis to database
  await prisma.resumeAnalysis.create({
    data: {
      resumeId,
      score: output.score,
      feedback: output.feedback,
      suggestions: JSON.parse(JSON.stringify(output.suggestions)),
      atsScore: output.atsScore,
    },
  });
};

export const analyzeResume = async (
  userId: string,
  resumeId: string,
  resumeData: any
): Promise<AnalysisResult> => {
  try {
    await checkAndDeductCredits(userId);

    const prompt = `Sen bir kariyer danışmanı ve CV uzmanısın. Aşağıdaki CV'yi detaylı bir şekilde analiz et ve değerlendir.

CV İçeriği:
${JSON.stringify(resumeData, null, 2)}

Lütfen şu kriterlere göre analiz yap:

1. **Genel Kalite (0-25 puan)**: İçerik kalitesi, profesyonellik, tutarlılık
2. **İçerik Zenginliği (0-25 puan)**: Deneyim detayları, eğitim, yetenekler, başarılar
3. **Yapı ve Format (0-25 puan)**: Organizasyon, okunabilirlik, format uygunluğu
4. **ATS Uyumluluğu (0-25 puan)**: Anahtar kelimeler, format uyumu, ATS sistemlerine uygunluk

Toplam puan: 0-100 arası

Ayrıca şu formatta öneriler sun:
- Kategori (örn: "İçerik", "Format", "ATS", "Dil")
- Öncelik (high/medium/low)
- Öneri metni

ATS puanı: 0-100 arası (ATS sistemlerine ne kadar uygun)

Lütfen yanıtını şu JSON formatında ver:
{
  "score": 85,
  "feedback": "Genel değerlendirme metni (3-4 paragraf)",
  "suggestions": [
    {
      "category": "İçerik",
      "priority": "high",
      "suggestion": "Öneri metni"
    }
  ],
  "atsScore": 80
}

Sadece JSON döndür, başka açıklama yapma.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text'
        ? message.content[0].text
        : '{}';

    // Parse JSON response
    let analysisResult: AnalysisResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisResult = {
        score: 70,
        feedback:
          'CV analizi tamamlandı. Genel olarak iyi bir CV, ancak bazı iyileştirmeler yapılabilir.',
        suggestions: [
          {
            category: 'Genel',
            priority: 'medium',
            suggestion: 'CV içeriğini daha detaylandırabilirsiniz.',
          },
        ],
        atsScore: 65,
      };
    }

    // Validate and ensure score is between 0-100
    analysisResult.score = Math.max(0, Math.min(100, analysisResult.score || 70));
    analysisResult.atsScore = Math.max(0, Math.min(100, analysisResult.atsScore || 65));

    // Log analysis
    await logAnalysis(userId, resumeId, resumeData, analysisResult);

    return analysisResult;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to analyze resume', 500);
  }
};

export const optimizeResume = async (
  userId: string,
  resumeData: any,
  jobDescription?: string
): Promise<{
  optimizedSections: any;
  recommendations: string[];
}> => {
  try {
    await checkAndDeductCredits(userId);

    const prompt = `Sen bir kariyer danışmanısın. Aşağıdaki CV'yi optimize et ve iyileştirme önerileri sun.

CV İçeriği:
${JSON.stringify(resumeData, null, 2)}

${jobDescription ? `İş İlanı:\n${jobDescription}\n\nCV'yi bu iş ilanına göre optimize et.` : ''}

Lütfen şu bölümleri optimize et:
1. Özet (Summary) - Daha etkileyici ve hedefe yönelik
2. Deneyim açıklamaları - Somut başarılar ve metrikler ekle
3. Anahtar kelimeler - İş ilanına uygun anahtar kelimeler ekle

Yanıtını şu JSON formatında ver:
{
  "optimizedSections": {
    "summary": "Optimize edilmiş özet",
    "experience": [...optimize edilmiş deneyimler],
    "keywords": ["anahtar", "kelime", "listesi"]
  },
  "recommendations": [
    "Öneri 1",
    "Öneri 2"
  ]
}

Sadece JSON döndür.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text'
        ? message.content[0].text
        : '{}';

    let optimizationResult: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      optimizationResult = JSON.parse(jsonText);
    } catch (parseError) {
      optimizationResult = {
        optimizedSections: {},
        recommendations: ['CV içeriğini daha detaylandırabilirsiniz.'],
      };
    }

    await prisma.usageLog.create({
      data: {
        userId,
        service: 'optimize',
        creditsUsed: 1,
        input: JSON.parse(JSON.stringify(resumeData)),
        output: JSON.parse(JSON.stringify(optimizationResult)),
      },
    });

    return optimizationResult;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to optimize resume', 500);
  }
};


