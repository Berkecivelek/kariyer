import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/aiService';
import { AppError } from '../middleware/errorHandler';

export const generateSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📝 generateSummary request received');
    
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { personalInfo } = req.body;

    if (!personalInfo) {
      throw new AppError('Personal info is required', 400);
    }

    console.log('📝 Calling aiService.generateSummary for user:', req.user.userId);
    
    const summary = await aiService.generateSummary(
      req.user.userId,
      personalInfo
    );

    console.log('✅ Summary generated successfully, length:', summary.length);

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('❌ generateSummary controller error:', error);
    next(error);
  }
};

export const generateExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { jobTitle, company, context } = req.body;

    if (!jobTitle) {
      throw new AppError('Job title is required', 400);
    }

    const description = await aiService.generateExperienceDescription(
      req.user.userId,
      jobTitle,
      company,
      context
    );

    res.json({
      success: true,
      data: { description },
    });
  } catch (error) {
    next(error);
  }
};

export const generateEducation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { schoolName, degree, field, context } = req.body;

    if (!schoolName) {
      throw new AppError('School name is required', 400);
    }

    const description = await aiService.generateEducationDescription(
      req.user.userId,
      schoolName,
      degree,
      field,
      context
    );

    res.json({
      success: true,
      data: { description },
    });
  } catch (error) {
    next(error);
  }
};

export const generateSkillsSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { targetPosition, context } = req.body;

    const suggestions = await aiService.generateSkillsSuggestion(
      req.user.userId,
      targetPosition,
      context
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};

export const generateLanguagesSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { targetCountry, context } = req.body;

    const suggestions = await aiService.generateLanguagesSuggestion(
      req.user.userId,
      targetCountry,
      context
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};

export const parseCVFromPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { pdfText } = req.body;

    if (!pdfText || typeof pdfText !== 'string' || pdfText.trim().length < 50) {
      throw new AppError('PDF metni geçersiz veya çok kısa. Lütfen geçerli bir PDF yükleyin.', 400);
    }

    const parsedData = await aiService.parseCVFromPDF(
      req.user.userId,
      pdfText.trim()
    );

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};

export const generateCoverLetter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📝 generateCoverLetter request received');

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { resumeId, hedefPozisyon, ton, jobDescription } = req.body;

    // Validation
    if (!resumeId || typeof resumeId !== 'string' || resumeId.trim() === '') {
      throw new AppError('resumeId is required and must be a non-empty string', 400);
    }

    if (!hedefPozisyon || typeof hedefPozisyon !== 'string' || hedefPozisyon.trim() === '') {
      throw new AppError('hedefPozisyon is required and must be a non-empty string', 400);
    }

    const validTones = ['samimi', 'profesyonel', 'resmi'];
    if (!ton || !validTones.includes(ton)) {
      throw new AppError(
        `ton must be one of: ${validTones.join(', ')}`,
        400
      );
    }

    console.log('📝 Calling aiService.generateCoverLetter for user:', req.user.userId, {
      resumeId,
      hedefPozisyon,
      ton,
    });

    const result = await aiService.generateCoverLetter(
      req.user.userId,
      resumeId.trim(),
      hedefPozisyon.trim(),
      ton as 'samimi' | 'profesyonel' | 'resmi',
      jobDescription ? jobDescription.trim() : undefined
    );

    console.log('✅ Cover letter generated successfully, length:', result.coverLetter.length);

    res.json({
      success: true,
      data: {
        coverLetter: result.coverLetter,
        coverLetterId: result.coverLetterId,
      },
    });
  } catch (error) {
    console.error('❌ generateCoverLetter controller error:', error);
    next(error);
  }
};

export const generateSummarySuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('💡 generateSummarySuggestions request received');
    
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { personalInfo } = req.body;

    if (!personalInfo) {
      throw new AppError('Personal info is required', 400);
    }

    console.log('💡 Calling aiService.generateSummarySuggestions for user:', req.user.userId);
    
    const suggestions = await aiService.generateSummarySuggestions(
      req.user.userId,
      personalInfo
    );

    console.log('✅ Suggestions generated successfully, count:', suggestions.length);

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    console.error('❌ generateSummarySuggestions controller error:', error);
    next(error);
  }
};

// Web scraping endpoint - iş ilanı linkinden metin çekme
export const scrapeJobPosting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new AppError('URL is required', 400);
    }

    // URL validation
    let jobUrl: URL;
    try {
      jobUrl = new URL(url.trim());
    } catch (error) {
      throw new AppError('Geçersiz URL formatı', 400);
    }

    // Desteklenen siteler kontrolü
    const supportedDomains = [
      'linkedin.com',
      'indeed.com',
      'kariyer.net',
      'yeniibiris.com',
      'secretcv.com',
      'monster.com',
      'glassdoor.com',
    ];

    const domain = jobUrl.hostname.toLowerCase();
    const isSupported = supportedDomains.some((supported) =>
      domain.includes(supported)
    );

    if (!isSupported) {
      throw new AppError(
        'Bu site şu anda desteklenmiyor. Desteklenen siteler: LinkedIn, Indeed, Kariyer.net, Yeni İş İris, SecretCV, Monster, Glassdoor',
        400
      );
    }

    const scrapedText = await aiService.scrapeJobPosting(jobUrl.toString());

    res.json({
      success: true,
      data: { jobDescription: scrapedText },
    });
  } catch (error) {
    console.error('❌ scrapeJobPosting error:', error);
    next(error);
  }
};

// ===== YENİ METODLAR - MEVCUT KODLARA DOKUNMA =====

export const scrapeJobPostingNew = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL gerekli'
      });
    }

    console.log('🔗 LinkedIn iş ilanı analizi:', url);

    const { LinkedInScraperService } = await import('../services/linkedin-scraper.service');
    const scraperService = new LinkedInScraperService();
    const result = await scraperService.scrapeLinkedInJob(url);

    if (result.success && result.formattedText) {
      return res.json({
        success: true,
        data: {
          jobText: result.formattedText,
          jobDetails: result.data,
          source: 'backend_scraping'
        }
      });
    }

    if (result.fallbackStrategy === 'frontend_fetch') {
      return res.json({
        success: false,
        needsFrontendFetch: true,
        jobId: result.jobId,
        originalUrl: url,
        message: 'Backend scraping başarısız, manuel giriş öneriliyor'
      });
    }

    return res.status(500).json({
      success: false,
      error: result.error || 'İş ilanı analiz edilemedi'
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    next(error);
  }
};

export const fetchJobWithClaude = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { url } = req.body;
    console.log('🤖 Claude AI fallback:', url);

    // Mevcut AI service'i kullan
    const { scrapeJobPosting } = await import('../services/aiService');
    
    try {
      const jobText = await scrapeJobPosting(url);
      
      if (jobText && jobText.length > 100) {
        return res.json({
          success: true,
          data: {
            jobText: jobText,
            source: 'claude_ai_fallback'
          }
        });
      }
    } catch (puppeteerError) {
      console.log('⚠️ Puppeteer fallback failed, trying LLM direct analysis...');
    }

    // Son çare: LLM ile direkt analiz - mevcut AI service'i kullan
    // Bu durumda kullanıcıya manuel giriş öner
    return res.status(500).json({
      success: false,
      error: 'Backend scraping başarısız. Lütfen iş ilanı metnini manuel olarak yapıştırın veya "Ekran Görüntüsü Yükle" butonunu kullanın.'
    });

  } catch (error) {
    console.error('❌ Claude fetch error:', error);
    next(error);
  }
};

export const parseImageForOCR = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { imageData } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      throw new AppError('Image data is required (base64 string)', 400);
    }

    // Base64 string'i Buffer'a çevir
    const imageBuffer = Buffer.from(
      imageData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const extractedText = await aiService.parseImageForOCR(imageBuffer);

    res.json({
      success: true,
      data: { jobDescription: extractedText },
    });
  } catch (error) {
    console.error('❌ parseImageForOCR error:', error);
    next(error);
  }
};


