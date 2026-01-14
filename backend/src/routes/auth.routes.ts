import express from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { registerValidation, loginValidation, validate } from '../middleware/validation.middleware';

const router = express.Router();

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateUser);

export default router;

