import express from 'express';
import { rateLimit } from 'express-rate-limit';
import * as aiController from '../controllers/ai.controller';
import * as analysisController from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, coverLetterValidation } from '../middleware/validation.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Rate limiter for cover letter generation (kullanıcı bazlı)
// 10 istek / 15 dakika (her kullanıcı için)
const coverLetterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // Her kullanıcı için maksimum 10 istek
  message: {
    success: false,
    error: 'Too many cover letter generation requests. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Kullanıcı bazlı rate limiting için keyGenerator kullan
  keyGenerator: (req) => {
    // req.user authenticate middleware'den geliyor
    return req.user?.userId || req.ip;
  },
  skip: (req) => {
    // Eğer kullanıcı yoksa (teorik olarak olmamalı çünkü authenticate middleware var)
    // ama yine de kontrol edelim
    return !req.user;
  },
});

router.post('/summary', aiController.generateSummary);
router.post('/summary-suggestions', aiController.generateSummarySuggestions);
router.post('/experience', aiController.generateExperience);
router.post('/education', aiController.generateEducation);
router.post('/skills-suggestions', aiController.generateSkillsSuggestions);
router.post('/languages-suggestions', aiController.generateLanguagesSuggestions);
router.post('/parse-cv-pdf', aiController.parseCVFromPDF);
router.post(
  '/cover-letter',
  coverLetterRateLimiter,
  validate(coverLetterValidation),
  aiController.generateCoverLetter
);
router.post('/analyze', analysisController.analyzeResume);
router.post('/optimize', analysisController.optimizeResume);
router.get('/analyses/:resumeId', analysisController.getResumeAnalyses);
router.post('/scrape-job-posting', aiController.scrapeJobPosting);
router.post('/parse-image-ocr', aiController.parseImageForOCR);

export default router;

