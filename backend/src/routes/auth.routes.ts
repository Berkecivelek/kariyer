import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { registerValidation, loginValidation, validate } from '../middleware/validation.middleware';

const router: Router = express.Router();

// Rate limiting for auth endpoints - brute force koruması
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 15 dakikada maksimum 5 başarısız deneme
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Başarılı istekleri sayma
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  }
});

// Register için daha yüksek limit (spam hesap koruması)
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 10, // Saatte maksimum 10 kayıt
  message: {
    success: false,
    error: 'Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  }
});

router.post('/register', registerRateLimiter, validate(registerValidation), authController.register);
router.post('/login', authRateLimiter, validate(loginValidation), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateUser);
router.post('/me/photo', authenticate, authController.uploadProfilePhoto);
router.delete('/me/photo', authenticate, authController.removeProfilePhoto);

export default router;

