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

    const { resumeId, hedefPozisyon, ton } = req.body;

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
      ton as 'samimi' | 'profesyonel' | 'resmi'
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


