// EN ÜSTTE: Environment variables'ı yükle
import dotenv from 'dotenv';
dotenv.config();

// API key kontrolü (sadece varlık kontrolü, değer loglanmıyor)
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === '') {
  console.error('❌ ANTHROPIC_API_KEY is not set in environment variables!');
}

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import aiRoutes from './routes/ai.routes';
import coverLetterRoutes from './routes/coverLetter.routes';
import portfolioRoutes from './routes/portfolio.routes';
import templateRoutes from './routes/template.routes';
import cvAnalysisRoutes from './routes/cv-analysis.routes';
import interviewRoutes from './routes/interview.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Security middleware - CSP configured for Tailwind CDN and external resources
// upgradeInsecureRequests disabled for localhost HTTP development
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false, // Disable defaults to prevent upgrade-insecure-requests
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));
app.use(compression());

// CORS configuration - Güvenli yapılandırma
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Development ortamında localhost'a izin ver
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    // Allow specific origins from env (production ve development için)
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);

    // EC2 IP adresini de ekle
    const ec2Origins = [
      'http://16.170.227.182',
      'https://16.170.227.182'
    ];

    const allAllowedOrigins = [...allowedOrigins, ...ec2Origins];

    if (allAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Development modunda localhost'a da izin ver
    if (process.env.NODE_ENV !== 'production' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }

    // İzin verilmeyen origin
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (frontend) - serve from project root (kariyer folder)
// __dirname will be backend/dist or backend/src, so we need to go up one level to backend, then one more to kariyer
// But if __dirname is already in backend, we only need to go up one level
const backendDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendDir, '..');
console.log('📁 Serving static files from:', projectRoot);
app.use(express.static(projectRoot));

// Serve uploaded files from backend/public/uploads
const backendPublicDir = path.resolve(backendDir, 'public');
const uploadsDir = path.join(backendPublicDir, 'uploads');
console.log('📁 Serving uploaded files from:', uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/cv-analysis', cvAnalysisRoutes);
app.use('/api/interview', interviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend (fallback to index.html for SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return notFoundHandler(req, res);
  }
  const indexPath = path.join(projectRoot, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    notFoundHandler(req, res);
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

