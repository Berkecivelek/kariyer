import express from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const interviewController = new InterviewController();

// Yeni mülakat oturumu başlat
router.post('/start', authenticate, (req, res, next) => interviewController.startSession(req, res, next));

// Sonraki soruyu al
router.get('/session/:sessionId/next-question', authenticate, (req, res, next) => interviewController.getNextQuestion(req, res, next));

// Cevap gönder ve analiz et
router.post('/answer', authenticate, (req, res, next) => interviewController.submitAnswer(req, res, next));

// Mülakat oturumunu sonlandır
router.post('/session/:sessionId/end', authenticate, (req, res, next) => interviewController.endSession(req, res, next));

// Mülakat geçmişi
router.get('/history', authenticate, (req, res, next) => interviewController.getHistory(req, res, next));

export default router;

