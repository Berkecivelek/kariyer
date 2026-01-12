import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((err: any) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(
      new AppError('Validation failed', 400, {
        errors: errorMessages,
      })
    );
  };
};

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString().withMessage('Last name must be a string'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const coverLetterValidation = [
  body('resumeId')
    .notEmpty()
    .withMessage('resumeId is required')
    .isString()
    .withMessage('resumeId must be a string')
    .trim(),
  body('hedefPozisyon')
    .notEmpty()
    .withMessage('hedefPozisyon is required')
    .isString()
    .withMessage('hedefPozisyon must be a string')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('hedefPozisyon must be between 3 and 200 characters'),
  body('ton')
    .notEmpty()
    .withMessage('ton is required')
    .isIn(['samimi', 'profesyonel', 'resmi'])
    .withMessage('ton must be one of: samimi, profesyonel, resmi'),
];


