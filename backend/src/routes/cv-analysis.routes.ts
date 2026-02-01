import { Router } from 'express';
import { CVAnalysisController } from '../controllers/cvAnalysis.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new CVAnalysisController();

router.post(
  '/analyze',
  authenticate,
  (req, res, next) => controller.analyzeCV(req, res, next)
);

router.post(
  '/fix-issue',
  authenticate,
  (req, res, next) => controller.fixIssue(req, res, next)
);

router.post(
  '/fix-all',
  authenticate,
  (req, res, next) => controller.fixAllIssues(req, res, next)
);

export default router;



