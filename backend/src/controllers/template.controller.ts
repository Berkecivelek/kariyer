import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        previewUrl: true,
      },
    });

    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};






