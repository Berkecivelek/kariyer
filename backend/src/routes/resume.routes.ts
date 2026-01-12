import express from 'express';
import * as resumeController from '../controllers/resume.controller';
import * as pdfController from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', resumeController.getAllResumes);
router.post('/', resumeController.createResume);
router.get('/:id', resumeController.getResumeById);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.get('/:id/pdf', pdfController.downloadPDF);

export default router;

