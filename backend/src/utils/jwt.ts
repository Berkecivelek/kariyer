import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Production'da güçlü secret'lar zorunlu
const validateSecrets = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('Production modunda JWT_SECRET en az 32 karakter olmalıdır');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('Production modunda JWT_REFRESH_SECRET en az 32 karakter olmalıdır');
    }
  }
};

// Geliştirme için varsayılan secret (sadece development)
const getDefaultSecret = (name: string): string => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} environment variable bulunamadı`);
  }
  // Development için rastgele secret oluştur (her restart'ta değişir)
  console.warn(`⚠️ ${name} ayarlanmamış, geçici secret kullanılıyor (sadece development için)`);
  return crypto.randomBytes(32).toString('hex');
};

validateSecrets();

const JWT_SECRET: Secret = process.env.JWT_SECRET || getDefaultSecret('JWT_SECRET');
// Token expiry'yi saniye cinsinden hesapla
const JWT_EXPIRES_IN_SECONDS = 24 * 60 * 60; // 1 gün = 86400 saniye
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || getDefaultSecret('JWT_REFRESH_SECRET');
const JWT_REFRESH_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 gün = 604800 saniye

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN_SECONDS };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN_SECONDS };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET as string) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};








