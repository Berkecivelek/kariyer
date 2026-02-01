import express, { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { registerValidation, loginValidation, validate } from '../middleware/validation.middleware';

const router: Router = express.Router();

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateUser);
router.post('/me/photo', authenticate, authController.uploadProfilePhoto);
router.delete('/me/photo', authenticate, authController.removeProfilePhoto);

export default router;

