import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllPortfolios = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { portfolios },
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    res.json({
      success: true,
      data: { portfolio },
    });
  } catch (error) {
    next(error);
  }
};

export const createPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { title, description, url, imageUrl, technologies } = req.body;

    if (!title) {
      throw new AppError('Title is required', 400);
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: req.user.userId,
        title,
        description,
        url,
        imageUrl,
        technologies: technologies ? JSON.parse(JSON.stringify(technologies)) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: { portfolio },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const { title, description, url, imageUrl, technologies } = req.body;

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingPortfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (technologies !== undefined) {
      updateData.technologies = JSON.parse(JSON.stringify(technologies));
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { portfolio },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingPortfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};









