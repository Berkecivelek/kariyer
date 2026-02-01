import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import puppeteer from 'puppeteer';
import { createWorker } from 'tesseract.js';

// API key kontrolü ve client initialization - Module load time'da
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ANTHROPIC_API_KEY opsiyonel - yoksa AI özellikleri devre dışı
let anthropic: Anthropic | null = null;

if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.trim() === '') {
  console.warn('⚠️  ANTHROPIC_API_KEY is not set in environment variables!');
  console.warn('   AI features will be disabled. Please add ANTHROPIC_API_KEY to your .env file to enable AI features.');
} else {
  // Create single Anthropic client instance at module load time
  anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });
  console.log('✅ Anthropic Claude client initialized at module load');
}

interface AISuggestionRequest {
  userId: string;
  service: string;
  input: any;
  creditsRequired?: number;
}

// Check and deduct AI credits
export const checkAndDeductCredits = async (
  userId: string,
  creditsRequired: number = 1
): Promise<void> => {
  // Prisma client kontrolü
  if (!prisma) {
    console.error('❌ Prisma client is not initialized');
    throw new AppError('Database connection error. Please try again later.', 503);
  }

  if (!prisma.subscription) {
    console.error('❌ Prisma subscription model is not available');
    console.error('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$')).join(', '));
    throw new AppError('Database model error. Please contact support.', 500);
  }

  let subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Eğer subscription yoksa, otomatik olarak oluştur (FREE tier, 1000 kredi)
  if (!subscription) {
    try {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          tier: 'FREE',
          aiCredits: 1000, // Yeterli kredi ver (Claude API kendi limitini kontrol edecek)
          usedCredits: 0,
          isActive: true,
        },
      });
      console.log(`✅ Created subscription for user ${userId}`);
    } catch (error: any) {
      console.error('❌ Failed to create subscription:', error);
      throw new AppError(`Failed to create subscription: ${error.message}`, 500);
    }
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
  if (subscription.usedCredits + creditsRequired > subscription.aiCredits) {
    // Krediler bitmiş ama yine de devam et - Claude API kendi limitini kontrol edecek
    console.warn(`User ${userId} has exceeded internal credit limit, but allowing request to proceed. Claude API will handle its own limits.`);
  }

  // Deduct credits (tracking için)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      usedCredits: subscription.usedCredits + creditsRequired,
    },
  });
};

// Log AI usage
const logUsage = async (
  userId: string,
  service: string,
  input: any,
  output: any,
  creditsUsed: number = 1
): Promise<void> => {
  try {
    if (!prisma || !prisma.usageLog) {
      console.warn('⚠️  Prisma usageLog model not available, skipping log');
      return;
    }
    
    await prisma.usageLog.create({
      data: {
        userId,
        service,
        creditsUsed,
        input: JSON.parse(JSON.stringify(input)),
        output: JSON.parse(JSON.stringify(output)),
      },
    });
  } catch (error: any) {
    // Log hatası kritik değil, sadece uyarı ver
    console.warn('⚠️  Failed to log usage:', error.message);
  }
};

export const generateSummary = async (
  userId: string,
  personalInfo: {
    firstName?: string;
    lastName?: string;
    profession?: string;
    experience?: any[];
    education?: any[];
    skills?: any[];
  }
): Promise<string> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 1);

    const prompt = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak profesyonel bir CV özeti (summary) oluştur. Özet 3-4 cümle olmalı, güçlü ve etkileyici olmalı, Türkçe yazılmalı.

İsim: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek: ${personalInfo.profession || ''}
Deneyim: ${JSON.stringify(personalInfo.experience || [])}
Eğitim: ${JSON.stringify(personalInfo.education || [])}
Yetenekler: ${JSON.stringify(personalInfo.skills || [])}

Lütfen profesyonel, özgün ve etkileyici bir özet oluştur.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summary =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Özet oluşturulamadı.';

    await logUsage(userId, 'summary', personalInfo, { summary });

    return summary;
  } catch (error) {
    console.error('❌ generateSummary error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    // Anthropic API hatalarını daha açıklayıcı hale getir
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      console.error('Error message:', errorMessage);
      
      if (errorMessage.includes('api_key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
        throw new AppError('AI service authentication failed. Please check API key configuration.', 503);
      }
      if (errorMessage.includes('rate_limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('payment')) {
        throw new AppError('AI service quota exceeded. Please check your Claude API account balance.', 402);
      }
    }
    
    // Detaylı hata loglama
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    
    throw new AppError(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`, 500);
  }
};

export const generateExperienceDescription = async (
  userId: string,
  jobTitle: string,
  company?: string,
  context?: {
    existingExperience?: any[];
    skills?: any[];
    profession?: string;
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      profession?: string;
      experience?: any[];
      education?: any[];
      skills?: any[];
      languages?: any[];
    };
  }
): Promise<string> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 1);

    // Kullanıcının tüm bilgilerini topla
    const personalInfo = context?.personalInfo || {};
    const existingExperiences = context?.existingExperience || [];
    const skills = context?.skills || personalInfo.skills || [];
    const profession = context?.profession || personalInfo.profession || '';

    // Prompt engineering - Kullanıcının mesleği, ünvanı, deneyimleri ve tercihlerini analiz et
    const prompt = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak profesyonel bir iş deneyimi açıklaması oluştur.

KURALLAR:
- Açıklama madde işaretli liste formatında 3-4 madde olmalı
- Somut başarılar, metrikler ve sorumluluklar içermeli
- Türkçe yazılmalı
- Kullanıcının mesleği ve sektörüne uygun olmalı
- Mevcut deneyimlerle tutarlı olmalı
- Profesyonel ve etkileyici bir dil kullan

KULLANICI BİLGİLERİ:
Ad Soyad: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek/Ünvan: ${profession || 'Belirtilmemiş'}

HEDEF POZİSYON:
İş Unvanı: ${jobTitle}
Şirket: ${company || 'Belirtilmemiş'}

MEVCUT DENEYİMLER:
${existingExperiences.length > 0 
  ? existingExperiences.map((exp, idx) => 
      `${idx + 1}. ${exp.title || exp.jobTitle || ''} - ${exp.company || ''} (${exp.startMonth || ''} ${exp.startYear || ''} - ${exp.isCurrent ? 'Günümüz' : `${exp.endMonth || ''} ${exp.endYear || ''}`})`
    ).join('\n')
  : 'Henüz deneyim eklenmemiş'}

YETENEKLER:
${Array.isArray(skills) && skills.length > 0
  ? skills.map(s => typeof s === 'string' ? s : s.name || s.skill || '').filter(Boolean).join(', ')
  : 'Belirtilmemiş'}

EĞİTİM:
${personalInfo.education && Array.isArray(personalInfo.education) && personalInfo.education.length > 0
  ? personalInfo.education.map((edu, idx) => 
      `${idx + 1}. ${edu.school || edu.schoolName || ''} - ${edu.degree || edu.field || ''}`
    ).join('\n')
  : 'Belirtilmemiş'}

Lütfen yukarıdaki bilgilere dayanarak, kullanıcının mesleği ve sektörüne uygun, mevcut deneyimleriyle tutarlı, somut başarılar ve metrikler içeren profesyonel bir iş deneyimi açıklaması oluştur.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let description =
      message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'Açıklama oluşturulamadı.';

    // HTML tag'lerini temizle
    description = description.replace(/<[^>]*>/g, '');

    await logUsage(
      userId,
      'experience',
      { jobTitle, company, context: { ...context, profession } },
      { description }
    );

    return description;
  } catch (error) {
    console.error('❌ generateExperienceDescription error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    // Anthropic API hatalarını daha açıklayıcı hale getir
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('payment')) {
        throw new AppError(
          'AI service quota exceeded. Please check your Claude API account balance.',
          402
        );
      }
    }

    throw new AppError(
      `Failed to generate experience description: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

export const generateEducationDescription = async (
  userId: string,
  schoolName: string,
  degree?: string,
  field?: string,
  context?: {
    existingEducation?: any[];
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      profession?: string;
      experience?: any[];
      education?: any[];
      skills?: any[];
      languages?: any[];
    };
  }
): Promise<string> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 1);

    // Kullanıcının tüm bilgilerini topla
    const personalInfo = context?.personalInfo || {};
    const existingEducation = context?.existingEducation || [];
    const profession = personalInfo.profession || '';

    // Prompt engineering - Kullanıcının mesleği, deneyimleri ve tercihlerini analiz et
    const prompt = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak profesyonel bir eğitim açıklaması oluştur.

KURALLAR:
- Açıklama 2-3 cümle olmalı
- Önemli dersler, projeler veya başarılar içermeli
- Türkçe yazılmalı
- Kullanıcının mesleği ve sektörüne uygun olmalı
- Mevcut eğitimlerle tutarlı olmalı
- Profesyonel, özgün ve etkileyici olmalı

KULLANICI BİLGİLERİ:
Ad Soyad: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek/Ünvan: ${profession || 'Belirtilmemiş'}

HEDEF EĞİTİM:
Okul: ${schoolName}
Bölüm/Derece: ${degree || field || 'Belirtilmemiş'}

MEVCUT EĞİTİMLER:
${existingEducation.length > 0
  ? existingEducation.map((edu, idx) =>
      `${idx + 1}. ${edu.school || edu.schoolName || ''} - ${edu.degree || edu.field || ''}`
    ).join('\n')
  : 'Henüz eğitim eklenmemiş'}

DENEYİMLER:
${personalInfo.experience && Array.isArray(personalInfo.experience) && personalInfo.experience.length > 0
  ? personalInfo.experience.map((exp, idx) =>
      `${idx + 1}. ${exp.title || exp.jobTitle || ''} - ${exp.company || ''}`
    ).join('\n')
  : 'Belirtilmemiş'}

YETENEKLER:
${personalInfo.skills && Array.isArray(personalInfo.skills) && personalInfo.skills.length > 0
  ? personalInfo.skills.map(s => typeof s === 'string' ? s : s.name || s.skill || '').filter(Boolean).join(', ')
  : 'Belirtilmemiş'}

Lütfen yukarıdaki bilgilere dayanarak, kullanıcının mesleği ve sektörüne uygun, mevcut eğitimleriyle tutarlı, önemli dersler, projeler veya başarılar içeren profesyonel bir eğitim açıklaması oluştur.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let description =
      message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'Açıklama oluşturulamadı.';

    // HTML tag'lerini temizle
    description = description.replace(/<[^>]*>/g, '');

    await logUsage(
      userId,
      'education',
      { schoolName, degree, field, context },
      { description }
    );

    return description;
  } catch (error) {
    console.error('❌ generateEducationDescription error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    // Anthropic API hatalarını daha açıklayıcı hale getir
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('payment')) {
        throw new AppError(
          'AI service quota exceeded. Please check your Claude API account balance.',
          402
        );
      }
    }

    throw new AppError(
      `Failed to generate education description: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

export const generateCoverLetter = async (
  userId: string,
  resumeId: string,
  hedefPozisyon: string,
  ton: 'samimi' | 'profesyonel' | 'resmi',
  jobDescription?: string
): Promise<{ coverLetter: string; coverLetterId: string }> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    // Prisma client kontrolü
    if (!prisma || !prisma.resume) {
      console.error('❌ Prisma client is not initialized');
      throw new AppError('Database connection error. Please try again later.', 503);
    }

    // Resume verisini Prisma'dan çek
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId, // Güvenlik: Kullanıcının sadece kendi resume'lerine erişebilmesi
      },
    });

    if (!resume) {
      throw new AppError('Resume not found or access denied', 404);
    }

    // Kredi kontrolü ve düşürme
    await checkAndDeductCredits(userId, 2); // Cover letter costs 2 credits

    // Resume verisini formatla
    const resumeData = {
      adSoyad: `${resume.firstName || ''} ${resume.lastName || ''}`.trim(),
      meslek: resume.profession || '',
      deneyim: Array.isArray(resume.experience) ? resume.experience : [],
      egitim: Array.isArray(resume.education) ? resume.education : [],
      yetenekler: Array.isArray(resume.skills) ? resume.skills : [],
      diller: Array.isArray(resume.languages) ? resume.languages : [],
      ozet: resume.summary || '',
    };

    // Ton parametresine göre yazım tarzı belirle
    const tonAciklama = {
      samimi: 'samimi ama profesyonel',
      profesyonel: 'profesyonel ve dengeli',
      resmi: 'resmi ve kurumsal',
    }[ton];

    // Prompt engineering - İş ilanı metni varsa dahil et
    let jobDescriptionSection = '';
    if (jobDescription && jobDescription.trim().length > 50) {
      jobDescriptionSection = `\n\nİŞ İLANI METNİ:\n${jobDescription.trim()}\n\nÖNEMLİ: Yukarıdaki iş ilanındaki anahtar kelimeleri, aranan nitelikleri ve sorumlulukları ön yazıya stratejik olarak dahil et. ATS sistemlerinde öne çıkmak için iş ilanındaki terimleri kullan.`;
    }

    const prompt = `Aşağıdaki CV bilgilerine göre${jobDescription ? ' ve verilen iş ilanına uygun' : ''} profesyonel bir ön yazı üret.

Kurallar:
- Maksimum 3 paragraf
- ${tonAciklama} tonunda yaz
- Samimi ama profesyonel ol
- Genel geçer klişelerden kaçın
- ATS (Applicant Tracking System) uyumlu ol
- Kişisel hitap yok (Sen, Siz gibi)
- Abartı yok, somut ve gerçekçi
- CV içeriğine birebir bağlı kal${jobDescription ? '\n- İş ilanındaki anahtar kelimeleri ve aranan nitelikleri stratejik olarak kullan' : ''}

CV:
Ad Soyad: ${resumeData.adSoyad}
Meslek: ${resumeData.meslek}
Özet: ${resumeData.ozet || 'Belirtilmemiş'}

Deneyim:
${JSON.stringify(resumeData.deneyim, null, 2)}

Eğitim:
${JSON.stringify(resumeData.egitim, null, 2)}

Yetenekler:
${JSON.stringify(resumeData.yetenekler, null, 2)}

Diller:
${JSON.stringify(resumeData.diller, null, 2)}

Hedef Pozisyon: ${hedefPozisyon}${jobDescriptionSection}

Lütfen yukarıdaki kurallara uygun, ${tonAciklama} tonunda, ATS uyumlu ve etkileyici bir ön yazı oluştur.`;

    // Claude API çağrısı
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Response'u sanitize et ve al
    let coverLetter =
      message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'Ön yazı oluşturulamadı.';

    // Basit sanitization - HTML tag'lerini temizle (güvenlik için)
    coverLetter = coverLetter.replace(/<[^>]*>/g, '');

    // CoverLetter tablosuna kaydet
    let coverLetterRecord;
    try {
      if (!prisma.coverLetter) {
        console.warn('⚠️  Prisma coverLetter model not available, skipping save');
      } else {
        coverLetterRecord = await prisma.coverLetter.create({
          data: {
            userId: userId,
            title: `${hedefPozisyon} - ${new Date().toLocaleDateString('tr-TR')}`,
            content: coverLetter,
            position: hedefPozisyon,
            company: null, // İleride eklenebilir
            recipient: null, // İleride eklenebilir
          },
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to save cover letter to database:', error);
      // Cover letter kaydetme hatası kritik değil, devam et
    }

    // UsageLog'a kaydet
    await logUsage(
      userId,
      'cover-letter',
      {
        resumeId,
        hedefPozisyon,
        ton,
        resumeData: {
          adSoyad: resumeData.adSoyad,
          meslek: resumeData.meslek,
          deneyimSayisi: Array.isArray(resumeData.deneyim) ? resumeData.deneyim.length : 0,
          egitimSayisi: Array.isArray(resumeData.egitim) ? resumeData.egitim.length : 0,
        },
      },
      {
        coverLetter: coverLetter.substring(0, 500), // İlk 500 karakteri logla
        coverLetterId: coverLetterRecord?.id || null,
      },
      2
    );

    return {
      coverLetter,
      coverLetterId: coverLetterRecord?.id || '',
    };
  } catch (error) {
    console.error('❌ generateCoverLetter error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    // Anthropic API hatalarını daha açıklayıcı hale getir
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      console.error('Error message:', errorMessage);

      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('payment')) {
        throw new AppError(
          'AI service quota exceeded. Please check your Claude API account balance.',
          402
        );
      }
    }

    // Detaylı hata loglama
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }

    throw new AppError(
      `Failed to generate cover letter: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

export const generateSummarySuggestions = async (
  userId: string,
  personalInfo: {
    firstName?: string;
    lastName?: string;
    profession?: string;
    experience?: any[];
    education?: any[];
    skills?: any[];
  }
): Promise<string[]> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    // 2 öneri için 2 kredi kullan
    await checkAndDeductCredits(userId, 2);

    const baseInfo = `İsim: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek: ${personalInfo.profession || ''}
Deneyim: ${JSON.stringify(personalInfo.experience || [])}
Eğitim: ${JSON.stringify(personalInfo.education || [])}
Yetenekler: ${JSON.stringify(personalInfo.skills || [])}`;

    // İlk öneri: Teknoloji ve başarı odaklı
    const prompt1 = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak profesyonel bir CV özeti (summary) oluştur. Özet 3-4 cümle olmalı, teknoloji ve somut başarılar vurgulanmalı, güçlü ve etkileyici olmalı, Türkçe yazılmalı.

${baseInfo}

Lütfen teknoloji, inovasyon ve somut başarılar üzerine odaklanan profesyonel, özgün ve etkileyici bir özet oluştur.`;

    // İkinci öneri: Liderlik ve ekip çalışması odaklı
    const prompt2 = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak profesyonel bir CV özeti (summary) oluştur. Özet 3-4 cümle olmalı, liderlik, ekip çalışması ve iletişim becerileri vurgulanmalı, güçlü ve etkileyici olmalı, Türkçe yazılmalı.

${baseInfo}

Lütfen liderlik, ekip çalışması ve iletişim becerileri üzerine odaklanan profesyonel, özgün ve etkileyici bir özet oluştur.`;

    // İki öneriyi paralel olarak oluştur
    const [message1, message2] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt1,
          },
        ],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt2,
          },
        ],
      }),
    ]);

    const suggestion1 =
      message1.content[0].type === 'text'
        ? message1.content[0].text
        : 'Öneri oluşturulamadı.';

    const suggestion2 =
      message2.content[0].type === 'text'
        ? message2.content[0].text
        : 'Öneri oluşturulamadı.';

    await logUsage(
      userId,
      'summary-suggestions',
      personalInfo,
      { suggestions: [suggestion1, suggestion2] },
      2
    );

    return [suggestion1, suggestion2];
  } catch (error) {
    console.error('❌ generateSummarySuggestions error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    // Detaylı hata loglama
    if (error && typeof error === 'object') {
      console.error('Error type:', error.constructor.name);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Anthropic API hatalarını kontrol et
      const errorMessage = (error as any).message || '';
      const errorStatus = (error as any).status || (error as any).statusCode || '';
      console.error('Error message:', errorMessage);
      console.error('Error status:', errorStatus);
      
      // API key kontrolü
      if (!anthropic) {
        console.error('❌ Anthropic client is null!');
        throw new AppError('AI service is not configured. Please contact support.', 503);
      }
      
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401') ||
        errorStatus === 401
      ) {
        throw new AppError('AI service authentication failed. Please check API key configuration.', 503);
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429') ||
        errorStatus === 429
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('payment') || errorStatus === 402) {
        throw new AppError('AI service quota exceeded. Please check your Claude API account balance.', 402);
      }
    }
    
    throw new AppError(`Failed to generate summary suggestions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`, 500);
  }
};

export const generateSkillsSuggestion = async (
  userId: string,
  targetPosition?: string,
  context?: {
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      profession?: string;
      experience?: any[];
      education?: any[];
      skills?: any[];
      languages?: any[];
    };
  }
): Promise<string[]> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 2); // 2 öneri için 2 kredi

    const personalInfo = context?.personalInfo || {};
    const profession = personalInfo.profession || '';
    const existingSkills = personalInfo.skills || [];
    const experiences = personalInfo.experience || [];

    const baseInfo = `Ad Soyad: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek/Ünvan: ${profession || 'Belirtilmemiş'}
Hedef Pozisyon: ${targetPosition || 'Belirtilmemiş'}
Mevcut Deneyimler: ${experiences.length > 0 ? experiences.map((exp, idx) => `${idx + 1}. ${exp.title || exp.jobTitle || ''} - ${exp.company || ''}`).join('\n') : 'Belirtilmemiş'}
Mevcut Yetenekler: ${existingSkills.length > 0 ? existingSkills.map(s => typeof s === 'string' ? s : s.name || s.skill || '').filter(Boolean).join(', ') : 'Belirtilmemiş'}`;

    // İlk öneri: Teknik yetenekler odaklı
    const prompt1 = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak kullanıcı için en önemli teknik yetenekleri öner. Sadece yetenek isimlerini liste halinde ver, her satırda bir yetenek. 8-10 teknik yetenek öner.

${baseInfo}

Lütfen kullanıcının mesleği, hedef pozisyonu ve deneyimlerine uygun, sektörde önemli olan teknik yetenekleri öner. Sadece yetenek isimlerini liste halinde ver, açıklama yapma.`;

    // İkinci öneri: Soft skills ve genel yetenekler
    const prompt2 = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak kullanıcı için önemli soft skills ve genel yetenekleri öner. Sadece yetenek isimlerini liste halinde ver, her satırda bir yetenek. 5-7 soft skill öner.

${baseInfo}

Lütfen kullanıcının mesleği ve hedef pozisyonuna uygun, liderlik, iletişim, problem çözme gibi soft skills öner. Sadece yetenek isimlerini liste halinde ver, açıklama yapma.`;

    const [message1, message2] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt1 }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt2 }],
      }),
    ]);

    const technicalSkills =
      message1.content[0].type === 'text'
        ? message1.content[0].text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.match(/^\d+[\.\)]/) && line.length > 1)
            .slice(0, 10)
        : [];

    const softSkills =
      message2.content[0].type === 'text'
        ? message2.content[0].text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.match(/^\d+[\.\)]/) && line.length > 1)
            .slice(0, 7)
        : [];

    const allSuggestions = [...technicalSkills, ...softSkills].filter(Boolean);

    await logUsage(
      userId,
      'skills-suggestions',
      { targetPosition, context },
      { suggestions: allSuggestions },
      2
    );

    return allSuggestions;
  } catch (error) {
    console.error('❌ generateSkillsSuggestion error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
    }

    throw new AppError(
      `Failed to generate skills suggestions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

export const generateLanguagesSuggestion = async (
  userId: string,
  targetCountry?: string,
  context?: {
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      profession?: string;
      experience?: any[];
      education?: any[];
      skills?: any[];
      languages?: any[];
    };
  }
): Promise<string[]> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 1);

    const personalInfo = context?.personalInfo || {};
    const profession = personalInfo.profession || '';
    const existingLanguages = personalInfo.languages || [];

    const prompt = `Sen bir kariyer danışmanısın. Aşağıdaki bilgilere dayanarak kullanıcı için önemli dilleri öner. Sadece dil isimlerini liste halinde ver, her satırda bir dil. 3-5 dil öner.

Kullanıcı Bilgileri:
Ad Soyad: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Meslek/Ünvan: ${profession || 'Belirtilmemiş'}
Hedef Ülke/Bölge: ${targetCountry || 'Belirtilmemiş'}
Mevcut Diller: ${existingLanguages.length > 0 ? existingLanguages.map(l => typeof l === 'string' ? l : l.name || l.language || '').filter(Boolean).join(', ') : 'Belirtilmemiş'}

Lütfen kullanıcının mesleği, sektörü ve hedef ülke/bölgeye göre önemli olabilecek dilleri öner. Sadece dil isimlerini liste halinde ver, açıklama yapma.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestions =
      message.content[0].type === 'text'
        ? message.content[0].text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.match(/^\d+[\.\)]/) && line.length > 1)
            .slice(0, 5)
        : [];

    await logUsage(
      userId,
      'languages-suggestions',
      { targetCountry, context },
      { suggestions },
      1
    );

    return suggestions;
  } catch (error) {
    console.error('❌ generateLanguagesSuggestion error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
    }

    throw new AppError(
      `Failed to generate languages suggestions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

export const parseCVFromPDF = async (
  userId: string,
  pdfText: string
): Promise<{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  profession?: string;
  website?: string;
  summary?: string;
  experiences?: any[];
  education?: any[];
  skills?: any[];
  languages?: any[];
}> => {
  try {
    // Anthropic client kontrolü
    if (!anthropic) {
      throw new AppError('AI service is not configured. Please contact support.', 503);
    }

    await checkAndDeductCredits(userId, 3); // PDF parse için 3 kredi

    // Log input for debugging
    console.log('🔧 parseCVFromPDF: Input received:', {
      pdfTextLength: pdfText.length,
      pdfTextPreview: pdfText.substring(0, 300),
      userId,
    });

    const prompt = `Bu metin bir CV'dir. Deneyimleri, eğitimleri, yetenekleri, özeti ve kişisel bilgileri yapılandırılmış JSON formatında çıkar.

KURALLAR:
- Tüm bilgileri doğru şekilde kategorize et
- Eksik bilgileri boş bırak (null veya boş string)
- Tarihleri standart formatta döndür (Ay Yıl formatında, örn: "Ocak 2021")
- Deneyimler ve eğitimler için tam bilgileri çıkar
- Yetenekleri string array olarak döndür
- Dilleri seviyeleriyle birlikte döndür
- Özet metni 2-3 cümle olarak özetle

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA AÇIKLAMA YOK):
{
  "firstName": "Ad",
  "lastName": "Soyad",
  "email": "email@example.com",
  "phone": "+90 555 123 45 67",
  "location": "İstanbul, Türkiye",
  "profession": "Meslek/Ünvan",
  "website": "linkedin.com/in/...",
  "summary": "Özet metni (2-3 cümle)",
  "experiences": [
    {
      "jobTitle": "İş Unvanı",
      "company": "Şirket Adı",
      "startMonth": "Ocak",
      "startYear": "2021",
      "endMonth": "",
      "endYear": "",
      "isCurrent": true,
      "description": "Açıklama metni (madde işaretli veya paragraf)"
    }
  ],
  
  NOT: Tarihleri "startDate" veya "endDate" olarak DEĞİL, "startMonth", "startYear", "endMonth", "endYear" olarak ayır. Eğer tarih "Ocak 2021" formatındaysa, "startMonth": "Ocak", "startYear": "2021" şeklinde ayır.
  "education": [
    {
      "school": "Okul Adı",
      "degree": "Bölüm/Derece",
      "startYear": "2015",
      "endYear": "2019",
      "isCurrent": false
    }
  ],
  "skills": ["Yetenek1", "Yetenek2", "Yetenek3"],
  "languages": [
    {
      "name": "İngilizce",
      "level": "C1 İleri"
    }
  ]
}

CV METNİ:
${pdfText.substring(0, 15000)}${pdfText.length > 15000 ? '\n\n[... metin devam ediyor ...]' : ''}

ÖNEMLİ NOTLAR:
- Tarihleri "startDate" veya "endDate" olarak DEĞİL, "startMonth", "startYear", "endMonth", "endYear" olarak ayır
- Eğer tarih "Ocak 2021" formatındaysa: "startMonth": "Ocak", "startYear": "2021" şeklinde ayır
- Eğer tarih "2021-01" veya "01/2021" formatındaysa: ayı çıkar, sadece yılı kullan
- "Günümüz", "Present", "Devam ediyor" gibi ifadeler varsa: "isCurrent": true yap ve endMonth/endYear boş bırak
- Deneyim açıklamalarını madde işaretli liste formatında koru (\\n ile ayır)

Lütfen yukarıdaki CV metnini analiz et ve JSON formatında yapılandırılmış veri döndür. SADECE JSON döndür, başka açıklama veya yorum ekleme.`;

    console.log('🔧 parseCVFromPDF: Prompt created, length:', prompt.length);
    console.log('🔧 parseCVFromPDF: Sending to Claude AI...');

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

    let responseText =
      message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : '';

    console.log('📥 parseCVFromPDF: Claude AI response received:', {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 500),
    });

    // JSON'u temizle (markdown code block varsa kaldır)
    const originalResponse = responseText;
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Eğer hala JSON bulunamazsa, ilk { ve son } arasını al
    if (!responseText.startsWith('{')) {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
        console.log('⚠️ parseCVFromPDF: Extracted JSON from response');
      }
    }

    console.log('🔧 parseCVFromPDF: Cleaned response text, length:', responseText.length);
    console.log('🔧 parseCVFromPDF: Cleaned response preview:', responseText.substring(0, 300));

    // JSON parse et
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
      console.log('✅ parseCVFromPDF: JSON parsed successfully');
      console.log('📊 parseCVFromPDF: Parsed data structure:', {
        hasFirstName: !!parsedData.firstName,
        hasLastName: !!parsedData.lastName,
        experiencesCount: Array.isArray(parsedData.experiences) ? parsedData.experiences.length : 0,
        educationCount: Array.isArray(parsedData.education) ? parsedData.education.length : 0,
        skillsCount: Array.isArray(parsedData.skills) ? parsedData.skills.length : 0,
        languagesCount: Array.isArray(parsedData.languages) ? parsedData.languages.length : 0,
      });
    } catch (parseError) {
      console.error('❌ parseCVFromPDF: JSON parse error:', parseError);
      console.error('❌ parseCVFromPDF: Original response:', originalResponse.substring(0, 1000));
      console.error('❌ parseCVFromPDF: Cleaned response:', responseText.substring(0, 1000));
      // Daha açıklayıcı hata mesajı
      const errorDetails = parseError instanceof Error ? parseError.message : 'Bilinmeyen hata';
      throw new AppError(`CV analiz edilemedi: AI yanıtı JSON formatında değil. Lütfen PDF'in okunabilir olduğundan emin olun. (Hata: ${errorDetails})`, 400);
    }

    // Validate and normalize data
    const normalizedData: any = {
      firstName: parsedData.firstName || '',
      lastName: parsedData.lastName || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      location: parsedData.location || '',
      profession: parsedData.profession || '',
      website: parsedData.website || '',
      summary: parsedData.summary || '',
      experiences: Array.isArray(parsedData.experiences) ? parsedData.experiences : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
    };

    await logUsage(
      userId,
      'parse-cv-pdf',
      { pdfTextLength: pdfText.length },
      { parsedData: normalizedData },
      3
    );

    return normalizedData;
  } catch (error) {
    console.error('❌ parseCVFromPDF error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (
        errorMessage.includes('api_key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401')
      ) {
        throw new AppError(
          'AI service authentication failed. Please check API key configuration.',
          503
        );
      }
      if (
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('429')
      ) {
        throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
      }
    }

    throw new AppError(
      `Failed to parse CV from PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
      500
    );
  }
};

// Web scraping - iş ilanı linkinden metin çekme
export const scrapeJobPosting = async (url: string): Promise<string> => {
  try {
    console.log('🔍 Scraping job posting from URL:', url);

    // Puppeteer browser başlat
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // User agent ayarla (bot tespitini önlemek için) - 2026 güncel
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      );
      
      // Ekstra headers (LinkedIn bot korumasını bypass etmek için)
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Viewport ayarla (normal bir tarayıcı gibi görün)
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // Sayfayı yükle - LinkedIn için özel handling
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded', // networkidle2 yerine domcontentloaded (daha hızlı ve güvenilir)
          timeout: 30000,
        });
      } catch (navError) {
        // Navigation hatası - frame detached gibi durumlar için retry
        console.warn('⚠️ Initial navigation failed, retrying with load strategy...', navError);
        try {
          await page.goto(url, {
            waitUntil: 'load',
            timeout: 20000,
          });
        } catch (retryError) {
          throw new AppError(
            'Sayfa yüklenemedi. LinkedIn bot koruması nedeniyle erişim engellenmiş olabilir. Lütfen manuel olarak yapıştırın.',
            408
          );
        }
      }

      // Sayfa yüklenmesini bekle
      await page.waitForTimeout(2000);

      // İş ilanı metnini çek - farklı siteler için farklı selector'lar
      const domain = new URL(url).hostname.toLowerCase();
      let jobText = '';

      if (domain.includes('linkedin.com')) {
        // LinkedIn için - 2026 güncel selector'lar ve gelişmiş strateji
        console.log('🔍 LinkedIn iş ilanı analiz ediliyor...');
        
        // Sayfanın tam yüklenmesini bekle
        await page.waitForTimeout(4000); // LinkedIn'in dinamik içeriği için yeterli bekleme
        
        // Önce sayfa yapısını kontrol et
        const pageStructure = await page.evaluate(() => {
          const doc = (globalThis as any).document;
          return {
            hasDescription: !!doc.querySelector('[class*="description"], [class*="job-details"]'),
            hasShowMore: !!doc.querySelector('button[aria-label*="more"], button[aria-label*="daha"], button[class*="show-more"]'),
            bodyText: doc.body.innerText.substring(0, 500)
          };
        });
        
        console.log('📊 Sayfa yapısı:', pageStructure);
        
        // Güncel LinkedIn selector'ları (2026)
        const selectors = [
          // Yeni LinkedIn UI selector'ları
          '.jobs-description__text',
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          '.show-more-less-html__markup',
          '.description__text',
          '[data-test-id="job-details-description"]',
          '[class*="jobs-description-content"]',
          '[class*="jobs-description__text"]',
          '[class*="job-details"]',
          '[id*="job-details"]',
          '[id*="job-description"]',
          // Genel fallback selector'lar
          '[class*="description"]',
          '[class*="job-details"]',
        ];
        
        let foundText = false;
        
        for (const selector of selectors) {
          try {
            // Selector'ı bekle (daha uzun timeout)
            await page.waitForSelector(selector, { timeout: 10000, visible: true }).catch(() => null);
            
            const element = await page.$(selector);
            if (element) {
              console.log(`✅ Selector bulundu: ${selector}`);
              
              // "Show more" butonunu kontrol et ve tıkla (birden fazla deneme)
              for (let attempt = 0; attempt < 3; attempt++) {
                const showMoreClicked = await page.evaluate((sel: string) => {
                  const doc = (globalThis as any).document;
                  const container = doc.querySelector(sel);
                  if (!container) return false;
                  
                  // Farklı "Show more" buton selector'ları
                  const showMoreSelectors = [
                    'button[aria-label*="more"]',
                    'button[aria-label*="daha"]',
                    'button[aria-label*="Show"]',
                    '.show-more-text',
                    'button[class*="show"]',
                    'button[class*="expand"]',
                    'span.show-more-text',
                    'button.show-more-less-html__button',
                  ];
                  
                  for (const btnSel of showMoreSelectors) {
                    const btn = container.querySelector(btnSel) || doc.querySelector(btnSel);
                    if (btn && (btn as any).offsetParent !== null) {
                      (btn as any).click();
                      return true;
                    }
                  }
                  return false;
                }, selector);
                
                if (showMoreClicked) {
                  console.log(`📖 "Show more" butonu tıklandı (deneme ${attempt + 1})`);
                  await page.waitForTimeout(2000); // Show more sonrası içeriğin yüklenmesini bekle
                } else {
                  break; // Show more butonu yoksa devam et
                }
              }
              
              // Metni çek
              jobText = await page.evaluate((sel: string) => {
                const doc = (globalThis as any).document;
                const el = doc.querySelector(sel);
                if (!el) return '';
                
                // HTML içeriğini al (formatting korunur)
                const htmlContent = el.innerHTML || '';
                // Text içeriğini al
                const textContent = el.textContent || el.innerText || '';
                
                // HTML'den temiz metin çıkar
                const tempDiv = doc.createElement('div');
                tempDiv.innerHTML = htmlContent;
                
                // Script ve style tag'lerini kaldır
                const scripts = tempDiv.querySelectorAll('script, style');
                for (let i = 0; i < scripts.length; i++) {
                  scripts[i].remove();
                }
                
                return tempDiv.textContent || tempDiv.innerText || textContent;
              }, selector);
              
              // Metin yeterli uzunluktaysa kullan
              if (jobText && jobText.trim().length > 200) {
                console.log(`✅ İş ilanı metni çekildi (${jobText.length} karakter)`);
                foundText = true;
                break;
              }
            }
          } catch (e) {
            // Selector bulunamadı, devam et
            console.log(`⚠️ Selector başarısız: ${selector}`, (e as Error).message);
            continue;
          }
        }
        
        // Eğer hala metin bulunamadıysa, genel body'den çek
        if (!foundText || !jobText || jobText.trim().length < 100) {
          console.log('⚠️ Selector\'larla metin bulunamadı, genel body\'den çekiliyor...');
          try {
            jobText = await page.evaluate(() => {
              const doc = (globalThis as any).document;
              
              // Önce tüm olası container'ları bul
              const allContainers = doc.querySelectorAll(
                '[class*="description"], [class*="job-details"], [id*="job-details"], [class*="jobs-description"], [class*="job-description"], main, article, [role="main"]'
              );
              
              // En uzun ve anlamlı metni bul
              let bestText = '';
              let bestLength = 0;
              
              for (let i = 0; i < allContainers.length; i++) {
                const container = allContainers[i];
                const text = container.textContent || container.innerText || '';
                
                // İş ilanı metni olma ihtimali yüksek kriterler
                const hasJobKeywords = /pozisyon|iş|job|görev|sorumluluk|nitelik|yetenek|deneyim|experience|qualification|requirement/i.test(text);
                const isLongEnough = text.length > 200;
                const isNotNavigation = !text.includes('Sign in') && !text.includes('Giriş yap') && !text.includes('Home') && !text.includes('Ana Sayfa');
                
                if (hasJobKeywords && isLongEnough && isNotNavigation && text.length > bestLength) {
                  bestText = text;
                  bestLength = text.length;
                }
              }
              
              if (bestText && bestLength > 200) {
                return bestText;
              }
              
              // Son çare: body'den çek ama navigation ve footer'ı hariç tut
              const bodyClone = doc.body.cloneNode(true);
              const unwanted = bodyClone.querySelectorAll(
                'nav, header, footer, aside, [class*="nav"], [class*="header"], [class*="footer"], [class*="sidebar"], [class*="menu"], script, style'
              );
              for (let i = 0; i < unwanted.length; i++) {
                unwanted[i].remove();
              }
              
              const bodyText = bodyClone.innerText || bodyClone.textContent || '';
              
              // Body text'ten en anlamlı kısmı bul (ortadaki kısım genelde job description)
              const lines = bodyText.split('\n').filter((line) => line.trim().length > 10);
              const startIdx = Math.floor(lines.length * 0.2); // İlk %20'yi atla
              const endIdx = Math.floor(lines.length * 0.9); // Son %10'u atla
              const relevantLines = lines.slice(startIdx, endIdx);
              
              return relevantLines.join('\n');
            });
            
            // Body'den çekilen metin yeterli değilse LLM fallback
            if (!jobText || jobText.trim().length < 100) {
              throw new Error('Body text extraction insufficient');
            }
          } catch (evalError) {
            // Frame detached hatası veya yetersiz metin - LLM fallback kullan
            console.warn('⚠️ Direct extraction failed, trying LLM-based extraction...', (evalError as Error).message);
            try {
              // Sayfanın HTML'ini al
              const pageContent = await page.content();
              console.log('🤖 LLM ile iş ilanı metni çıkarılıyor...');
              // LLM ile job description çıkar
              jobText = await extractJobDescriptionWithLLM(pageContent, url);
              console.log('✅ LLM extraction başarılı, metin uzunluğu:', jobText.length);
            } catch (llmError) {
              console.error('❌ LLM extraction failed:', llmError);
              throw new AppError(
                'LinkedIn sayfasından iş ilanı metni çıkarılamadı. LinkedIn bot koruması nedeniyle erişim engellenmiş olabilir. Lütfen iş ilanı metnini manuel olarak yapıştırın veya "Ekran Görüntüsü Yükle" butonunu kullanın.',
                400
              );
            }
          }
        }
      } else if (domain.includes('indeed.com')) {
        // Indeed için
        const selectors = [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText',
          '[data-testid="job-description"]',
        ];
        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            const element = await page.$(selector);
            if (element) {
              jobText = await page.evaluate((el) => el.textContent || el.innerText || '', element);
              if (jobText.trim().length > 100) break;
            }
          } catch (e) {
            continue;
          }
        }
      } else if (domain.includes('kariyer.net')) {
        // Kariyer.net için
        const selectors = [
          '.job-detail-content',
          '.job-description',
          '[class*="description"]',
        ];
        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            const element = await page.$(selector);
            if (element) {
              jobText = await page.evaluate((el) => el.textContent || el.innerText || '', element);
              if (jobText.trim().length > 100) break;
            }
          } catch (e) {
            continue;
          }
        }
      } else {
        // Genel fallback - body'den metin çek
        jobText = await page.evaluate(() => {
          // Script ve style tag'lerini kaldır
          const doc = (globalThis as any).document;
          const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside');
          for (let i = 0; i < scripts.length; i++) {
            scripts[i].remove();
          }
          return doc.body.innerText || doc.body.textContent || '';
        });
      }

      // Metni temizle ve normalize et
      jobText = jobText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (jobText.length < 50) {
        throw new AppError(
          'İş ilanı metni çekilemedi veya çok kısa. Lütfen manuel olarak yapıştırın.',
          400
        );
      }

      console.log('✅ Job posting scraped successfully, length:', jobText.length);

      return jobText;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('❌ scrapeJobPosting error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    // Timeout veya network hataları
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Navigation')) {
        throw new AppError(
          'Sayfa yüklenemedi veya zaman aşımına uğradı. Lütfen linki kontrol edin veya manuel olarak yapıştırın.',
          408
        );
      }
      if (errorMessage.includes('net::ERR') || errorMessage.includes('Failed to navigate')) {
        throw new AppError(
          'Linke erişilemedi. Lütfen linkin geçerli olduğundan emin olun veya manuel olarak yapıştırın.',
          400
        );
      }
    }

    throw new AppError(
      `İş ilanı metni çekilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Lütfen manuel olarak yapıştırın.`,
      500
    );
  }
};

/**
 * OCR ile görselden metin çıkarır (Backend-only)
 * @param imageBuffer - Görsel buffer'ı (base64 veya Buffer)
 * @returns Çıkarılan metin
 */
export const parseImageForOCR = async (imageBuffer: Buffer | string): Promise<string> => {
  try {
    console.log('🔍 Starting OCR processing...');

    // Tesseract worker oluştur
    const worker = await createWorker('tur+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    try {
      // Buffer'ı işle
      let imageData: Buffer;
      if (typeof imageBuffer === 'string') {
        // Base64 string ise decode et
        const base64Data = imageBuffer.replace(/^data:image\/\w+;base64,/, '');
        imageData = Buffer.from(base64Data, 'base64');
      } else {
        imageData = imageBuffer;
      }

      // OCR işlemini gerçekleştir
      const { data: { text } } = await worker.recognize(imageData);

      // Worker'ı temizle
      await worker.terminate();

      // Metni temizle
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (cleanedText.length < 50) {
        throw new AppError(
          'Görselden yeterli metin ayıklanamadı. Lütfen daha net bir görsel deneyin.',
          400
        );
      }

      console.log('✅ OCR completed successfully, extracted text length:', cleanedText.length);

      return cleanedText;
    } catch (error) {
      // Worker'ı temizle (hata olsa bile)
      await worker.terminate();
      throw error;
    }
  } catch (error) {
    console.error('❌ parseImageForOCR error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    // OCR spesifik hatalar
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (errorMessage.includes('language') || errorMessage.includes('lang')) {
        throw new AppError(
          'OCR dil paketi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          500
        );
      }
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new AppError(
          'OCR servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          503
        );
      }
    }

    throw new AppError(
      `OCR işlemi başarısız oldu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Lütfen manuel olarak yapıştırın.`,
      500
    );
  }
};

/**
 * LLM kullanarak HTML içeriğinden iş ilanı açıklamasını çıkarır
 * LinkedIn bot koruması durumunda fallback olarak kullanılır
 */
async function extractJobDescriptionWithLLM(htmlContent: string, url: string): Promise<string> {
  if (!anthropic) {
    throw new AppError('AI servisi kullanılamıyor.', 503);
  }

  try {
    // HTML'den sadece text içeriğini çıkar (basit temizleme)
    const textContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 50000); // LLM token limiti için kısalt

    const prompt = `Aşağıdaki metin bir LinkedIn iş ilanı sayfasından alınmıştır. Lütfen sadece iş ilanının açıklamasını, gereksinimlerini, sorumluluklarını ve aranan nitelikleri çıkar. Navigasyon, footer, reklam veya diğer sayfa elementlerini hariç tut.

ÖNEMLİ KURALLAR:
- Sadece iş ilanı ile ilgili metni çıkar
- Pozisyon adını, şirket adını, lokasyonu dahil et
- İş tanımını, sorumlulukları, gereksinimleri ve aranan nitelikleri dahil et
- Navigasyon menüleri, footer, reklamlar, cookie uyarıları gibi sayfa elementlerini HİÇBİR ŞEKİLDE dahil etme
- Metni temiz ve okunabilir formatta döndür

URL: ${url}

Sayfa İçeriği:
${textContent}

Lütfen sadece iş ilanı açıklamasını, gereksinimlerini ve aranan nitelikleri döndür. Başka hiçbir şey ekleme.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const extractedText = message.content[0].type === 'text' ? message.content[0].text : '';

    if (!extractedText || extractedText.trim().length < 100) {
      throw new AppError(
        'İş ilanı metni çıkarılamadı. Lütfen manuel olarak yapıştırın.',
        400
      );
    }

    return extractedText.trim();
  } catch (error) {
    console.error('❌ LLM extraction error:', error);
    throw new AppError(
      'AI ile iş ilanı metni çıkarılamadı. Lütfen manuel olarak yapıştırın.',
      500
    );
  }
}


