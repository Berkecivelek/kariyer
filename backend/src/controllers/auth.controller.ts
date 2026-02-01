import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Create default subscription (FREE tier) - Daha fazla kredi ver
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: 'FREE',
        aiCredits: 1000, // Yeterli kredi ver (Claude API kendi limitini kontrol edecek)
        usedCredits: 0,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. For enhanced security, you could implement
    // a token blacklist in Redis or database.
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profession: true,
        bio: true,
        profilePhotoUrl: true,
        language: true,
        timezone: true,
        createdAt: true,
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { firstName, lastName, phone, profession, bio, language, timezone, profilePhotoUrl } = req.body;

    // Update data object - sadece gönderilen alanları güncelle
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (profession !== undefined) updateData.profession = profession;
    if (bio !== undefined) updateData.bio = bio;
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl;

    // Email değiştirilemez (unique constraint)
    // Password değiştirme ayrı bir endpoint'te olmalı

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profession: true,
        bio: true,
        profilePhotoUrl: true,
        language: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Profil fotoğrafı yükle
export const uploadProfilePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { imageData } = req.body; // Base64 string

    if (!imageData || typeof imageData !== 'string') {
      throw new AppError('Image data is required (base64 string)', 400);
    }

    // Base64 string'i parse et
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Dosya boyutu kontrolü (1MB)
    if (imageBuffer.length > 1024 * 1024) {
      throw new AppError('Image size must be less than 1MB', 400);
    }

    // Format kontrolü (JPG, GIF, PNG)
    const imageType = imageData.match(/data:image\/(\w+);base64/)?.[1]?.toLowerCase();
    if (!imageType || !['jpeg', 'jpg', 'gif', 'png'].includes(imageType)) {
      throw new AppError('Image format must be JPG, GIF, or PNG', 400);
    }

    // Uploads klasörünü oluştur
    const backendDir = path.resolve(__dirname, '..', '..');
    const uploadsDir = path.join(backendDir, 'public', 'uploads', 'profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Dosya adı oluştur (userId-timestamp.extension)
    const userId = req.user.userId;
    const timestamp = Date.now();
    const extension = imageType === 'jpeg' ? 'jpg' : imageType;
    const fileName = `${userId}-${timestamp}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Dosyayı kaydet
    fs.writeFileSync(filePath, imageBuffer);

    // URL oluştur
    const photoUrl = `/uploads/profiles/${fileName}`;

    // Eski fotoğrafı sil (varsa)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoUrl: true },
    });

    if (user?.profilePhotoUrl) {
      const oldFilePath = path.join(backendDir, 'public', user.profilePhotoUrl);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (error) {
          console.warn('Eski profil fotoğrafı silinemedi:', error);
        }
      }
    }

    // Database'e kaydet
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: photoUrl },
      select: {
        id: true,
        profilePhotoUrl: true,
      },
    });

    res.json({
      success: true,
      data: { profilePhotoUrl: updatedUser.profilePhotoUrl },
    });
  } catch (error) {
    next(error);
  }
};

// Profil fotoğrafı kaldır
export const removeProfilePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userId = req.user.userId;

    // Kullanıcının mevcut fotoğrafını al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoUrl: true },
    });

    // Dosyayı sil
    if (user?.profilePhotoUrl) {
      const backendDir = path.resolve(__dirname, '..', '..');
      const filePath = path.join(backendDir, 'public', user.profilePhotoUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.warn('Profil fotoğrafı silinemedi:', error);
        }
      }
    }

    // Database'den kaldır
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: null },
    });

    res.json({
      success: true,
      data: { message: 'Profile photo removed successfully' },
    });
  } catch (error) {
    next(error);
  }
};
