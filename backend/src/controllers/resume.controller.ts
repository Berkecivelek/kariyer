import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllResumes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // SADECE COMPLETED resume'ları göster (DRAFT'lar dashboard'da görünmemeli)
    const resumes = await prisma.resume.findMany({
      where: { 
        userId: req.user.userId,
        status: 'COMPLETED', // Sadece tamamlanmış CV'ler
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        templateId: true,
        status: true,
        firstName: true,
        lastName: true,
        profession: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { resumes },
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    res.json({
      success: true,
      data: { resume },
    });
  } catch (error) {
    next(error);
  }
};

export const createResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const {
      title,
      templateId,
      status,
      firstName,
      lastName,
      email,
      phone,
      location,
      profession,
      summary,
      experience,
      education,
      skills,
      languages,
    } = req.body;

    const resume = await prisma.resume.create({
      data: {
        userId: req.user.userId,
        title: title || 'Yeni Özgeçmiş',
        templateId: templateId || 'modern',
        status: status || 'DRAFT',
        firstName,
        lastName,
        email,
        phone,
        location,
        profession,
        summary,
        experience: experience ? JSON.parse(JSON.stringify(experience)) : null,
        education: education ? JSON.parse(JSON.stringify(education)) : null,
        skills: skills ? JSON.parse(JSON.stringify(skills)) : null,
        languages: languages ? JSON.parse(JSON.stringify(languages)) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: { resume },
    });
  } catch (error) {
    next(error);
  }
};

export const updateResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if resume exists and belongs to user
    const existingResume = await prisma.resume.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingResume) {
      throw new AppError('Resume not found', 404);
    }

    // Parse JSON fields if they exist
    const parsedData: any = { ...updateData };
    if (updateData.experience) {
      parsedData.experience = JSON.parse(JSON.stringify(updateData.experience));
    }
    if (updateData.education) {
      parsedData.education = JSON.parse(JSON.stringify(updateData.education));
    }
    if (updateData.skills) {
      parsedData.skills = JSON.parse(JSON.stringify(updateData.skills));
    }
    if (updateData.languages) {
      parsedData.languages = JSON.parse(JSON.stringify(updateData.languages));
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: parsedData,
    });

    res.json({
      success: true,
      data: { resume },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Check if resume exists and belongs to user
    const existingResume = await prisma.resume.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingResume) {
      throw new AppError('Resume not found', 404);
    }

    await prisma.resume.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const duplicateResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Find original resume
    const originalResume = await prisma.resume.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!originalResume) {
      throw new AppError('Resume not found', 404);
    }

    // Create duplicate
    const duplicatedResume = await prisma.resume.create({
      data: {
        userId: req.user.userId,
        title: `${originalResume.title} (Kopya)`,
        templateId: originalResume.templateId,
        status: 'DRAFT',
        firstName: originalResume.firstName,
        lastName: originalResume.lastName,
        email: originalResume.email,
        phone: originalResume.phone,
        location: originalResume.location,
        profession: originalResume.profession,
        summary: originalResume.summary,
        experience: originalResume.experience,
        education: originalResume.education,
        skills: originalResume.skills,
        languages: originalResume.languages,
      },
    });

    res.status(201).json({
      success: true,
      data: { resume: duplicatedResume },
    });
  } catch (error) {
    next(error);
  }
};






