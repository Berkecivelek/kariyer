import { Request, Response, NextFunction } from 'express';
import * as analysisService from '../services/analysisService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const analyzeResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { resumeId } = req.body;

    if (!resumeId) {
      throw new AppError('Resume ID is required', 400);
    }

    // Fetch resume
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: req.user.userId,
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Analyze resume
    const analysis = await analysisService.analyzeResume(
      req.user.userId,
      resumeId,
      resume
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
};

export const optimizeResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { resumeId, jobDescription } = req.body;

    if (!resumeId) {
      throw new AppError('Resume ID is required', 400);
    }

    // Fetch resume
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: req.user.userId,
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Optimize resume
    const optimization = await analysisService.optimizeResume(
      req.user.userId,
      resume,
      jobDescription
    );

    res.json({
      success: true,
      data: { optimization },
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeAnalyses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { resumeId } = req.params;

    // Check if resume belongs to user
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: req.user.userId,
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Get analyses
    const analyses = await prisma.resumeAnalysis.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { analyses },
    });
  } catch (error) {
    next(error);
  }
};






