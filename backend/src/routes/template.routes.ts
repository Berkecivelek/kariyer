import express from 'express';
import * as templateController from '../controllers/template.controller';

const router = express.Router();

// Templates are public (no auth required)
router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);

export default router;

