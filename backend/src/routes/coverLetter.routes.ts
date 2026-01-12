import express from 'express';
import * as coverLetterController from '../controllers/coverLetter.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', coverLetterController.getAllCoverLetters);
router.post('/', coverLetterController.createCoverLetter);
router.get('/:id', coverLetterController.getCoverLetterById);
router.put('/:id', coverLetterController.updateCoverLetter);
router.delete('/:id', coverLetterController.deleteCoverLetter);

export default router;

