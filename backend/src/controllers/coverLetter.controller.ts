import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as aiService from '../services/aiService';

export const getAllCoverLetters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { coverLetters },
    });
  } catch (error) {
    next(error);
  }
};

export const getCoverLetterById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!coverLetter) {
      throw new AppError('Cover letter not found', 404);
    }

    res.json({
      success: true,
      data: { coverLetter },
    });
  } catch (error) {
    next(error);
  }
};

export const createCoverLetter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { title, content, recipient, company, position, generateWithAI, resumeId, jobDescription } = req.body;

    let finalContent = content;

    // Generate with AI if requested
    if (generateWithAI && resumeId) {
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.userId,
        },
      });

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      finalContent = await aiService.generateCoverLetter(
        req.user.userId,
        resume,
        jobDescription,
        company,
        position
      );
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: req.user.userId,
        title: title || 'Yeni Ön Yazı',
        content: finalContent || '',
        recipient,
        company,
        position,
      },
    });

    res.status(201).json({
      success: true,
      data: { coverLetter },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoverLetter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const { title, content, recipient, company, position } = req.body;

    // Check if cover letter exists and belongs to user
    const existingCoverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingCoverLetter) {
      throw new AppError('Cover letter not found', 404);
    }

    const coverLetter = await prisma.coverLetter.update({
      where: { id },
      data: {
        title,
        content,
        recipient,
        company,
        position,
      },
    });

    res.json({
      success: true,
      data: { coverLetter },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoverLetter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Check if cover letter exists and belongs to user
    const existingCoverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingCoverLetter) {
      throw new AppError('Cover letter not found', 404);
    }

    await prisma.coverLetter.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Cover letter deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};








