// Use mock database when DATABASE_URL is not set
import mockDb from './mockDatabase';

// Check if we should use mock database
// IMPORTANT: Only use mock DB if explicitly set to 'true'
// If USE_MOCK_DB is 'false' or not set, use real PostgreSQL database
// If DATABASE_URL exists but connection fails, we should throw an error, not silently fall back to mock
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

let prisma: any = null;

if (!USE_MOCK_DB) {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Test connection on startup
    prisma.$connect()
      .then(() => {
        console.log('✅ PostgreSQL database connected successfully');
      })
      .catch((error: any) => {
        console.error('❌ Database connection failed:', error.message);
        console.error('⚠️  Please check your DATABASE_URL in .env file');
        console.error('⚠️  Make sure PostgreSQL is running and accessible');
        // Don't fall back to mock in production - fail fast
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
      });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  } catch (error: any) {
    console.error('❌ Prisma initialization failed:', error.message);
    console.error('⚠️  Cannot connect to PostgreSQL database');
    console.error('⚠️  Please check your DATABASE_URL in .env file');
    console.error('⚠️  Make sure PostgreSQL is running: brew services start postgresql@16 (macOS) or sudo systemctl start postgresql (Linux)');
    // Don't fall back to mock - fail explicitly so user knows there's a problem
    console.error('⚠️  To use mock database for testing, set USE_MOCK_DB=true in .env');
    // In production, exit. In development, also exit to force user to fix the issue
    if (process.env.NODE_ENV === 'production' || process.env.USE_MOCK_DB !== 'true') {
      console.error('❌ Exiting - database connection required');
      process.exit(1);
    }
    prisma = null;
  }
} else {
  console.warn('⚠️  Using mock database (USE_MOCK_DB=true)');
}

// Create Prisma-like wrapper for mock database
const createMockPrisma = () => {
  return {
    user: {
      findUnique: async (args: { where: { email?: string; id?: string }; select?: any }) => {
        let user = null;
        if (args.where.email) {
          user = await mockDb.findUserByEmail(args.where.email);
        } else if (args.where.id) {
          user = await mockDb.findUserById(args.where.id);
        }
        
        if (!user) return null;
        
        // Select ile filtreleme
        if (args.select) {
          const selected: any = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true && user.hasOwnProperty(key)) {
              selected[key] = (user as any)[key];
            } else if (args.select[key] && typeof args.select[key] === 'object') {
              // Relation (subscriptions gibi) - boş array veya mock data döndür
              if (key === 'subscriptions') {
                // Mock subscription döndür
                selected[key] = [{
                  id: 'sub_1',
                  tier: 'FREE',
                  aiCredits: 10,
                  usedCredits: 0,
                  isActive: true,
                  startDate: new Date(),
                }];
              } else {
                selected[key] = [];
              }
            }
          });
          return selected;
        }
        
        return user;
      },
      create: async (args: { data: any; select?: any }) => {
        const user = await mockDb.createUser(args.data);
        if (args.select) {
          const selected: any = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true && user.hasOwnProperty(key)) {
              selected[key] = (user as any)[key];
            } else if (args.select[key] && typeof args.select[key] === 'object') {
              // Relation (subscriptions gibi)
              selected[key] = [];
            }
          });
          return selected;
        }
        return user;
      },
      findFirst: async (args: { where: any; select?: any }) => {
        let user = null;
        if (args.where.id) {
          user = await mockDb.findUserById(args.where.id);
        } else if (args.where.email) {
          user = await mockDb.findUserByEmail(args.where.email);
        }
        
        if (!user) return null;
        
        // Select ile filtreleme
        if (args.select) {
          const selected: any = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true && user.hasOwnProperty(key)) {
              selected[key] = (user as any)[key];
            } else if (args.select[key] && typeof args.select[key] === 'object') {
              // Relation (subscriptions gibi) - boş array veya mock data döndür
              if (key === 'subscriptions') {
                // Mock subscription döndür
                selected[key] = [{
                  id: 'sub_1',
                  tier: 'FREE',
                  aiCredits: 10,
                  usedCredits: 0,
                  isActive: true,
                  startDate: new Date(),
                }];
              } else {
                selected[key] = [];
              }
            }
          });
          return selected;
        }
        
        return user;
      },
    },
    resume: {
      findMany: async (args: { where?: any; orderBy?: any; select?: any }) => {
        const userId = args.where?.userId;
        if (!userId) return [];
        
        const resumes = await mockDb.findResumesByUserId(userId);
        
        if (args.select) {
          return resumes.map(resume => {
            const selected: any = {};
            Object.keys(args.select).forEach(key => {
              if (args.select[key] && resume.hasOwnProperty(key)) {
                selected[key] = (resume as any)[key];
              }
            });
            return selected;
          });
        }
        return resumes;
      },
      findFirst: async (args: { where: any }) => {
        const resume = await mockDb.findResumeById(args.where.id);
        if (!resume) return null;
        if (resume.userId !== args.where.userId) return null;
        return resume;
      },
      create: async (args: { data: any }) => {
        return await mockDb.createResume(args.data);
      },
      update: async (args: { where: { id: string }; data: any }) => {
        return await mockDb.updateResume(args.where.id, args.data);
      },
      delete: async (args: { where: { id: string } }) => {
        await mockDb.deleteResume(args.where.id);
      },
    },
    coverLetter: {
      findMany: async (args: { where?: any; orderBy?: any }) => {
        const userId = args.where?.userId;
        if (!userId) return [];
        return await mockDb.findCoverLettersByUserId(userId);
      },
      findFirst: async (args: { where: any }) => {
        const coverLetter = await mockDb.findCoverLetterById(args.where.id);
        if (!coverLetter) return null;
        if (coverLetter.userId !== args.where.userId) return null;
        return coverLetter;
      },
      create: async (args: { data: any }) => {
        return await mockDb.createCoverLetter(args.data);
      },
      update: async (args: { where: { id: string }; data: any }) => {
        return await mockDb.updateCoverLetter(args.where.id, args.data);
      },
      delete: async (args: { where: { id: string } }) => {
        await mockDb.deleteCoverLetter(args.where.id);
      },
    },
    portfolio: {
      findMany: async (args: { where?: any; orderBy?: any }) => {
        const userId = args.where?.userId;
        if (!userId) return [];
        return await mockDb.findPortfoliosByUserId(userId);
      },
      findFirst: async (args: { where: any }) => {
        const portfolio = await mockDb.findPortfolioById(args.where.id);
        if (!portfolio) return null;
        if (portfolio.userId !== args.where.userId) return null;
        return portfolio;
      },
      create: async (args: { data: any }) => {
        return await mockDb.createPortfolio(args.data);
      },
      update: async (args: { where: { id: string }; data: any }) => {
        return await mockDb.updatePortfolio(args.where.id, args.data);
      },
      delete: async (args: { where: { id: string } }) => {
        await mockDb.deletePortfolio(args.where.id);
      },
    },
    subscription: {
      findFirst: async (args: { where?: any; orderBy?: any }) => {
        // Mock subscription - her kullanıcı için varsayılan subscription döndür
        const userId = args.where?.userId;
        if (!userId) return null;
        
        // isActive kontrolü varsa kontrol et
        if (args.where?.isActive !== undefined && args.where.isActive !== true) {
          return null;
        }
        
        // Mock subscription objesi döndür
        return {
          id: `sub_${userId}`,
          userId: userId,
          tier: 'FREE',
          aiCredits: 1000,
          usedCredits: 0,
          isActive: true,
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      create: async (args: { data: any }) => {
        // Mock subscription oluştur
        const subscription = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return subscription;
      },
      update: async (args: { where: { id: string }; data: any }) => {
        // Mock subscription güncelle
        const existing = {
          id: args.where.id,
          userId: 'user_1',
          tier: 'FREE',
          aiCredits: 1000,
          usedCredits: 0,
          isActive: true,
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
      },
    },
  };
};

// Export Prisma or mock Prisma wrapper
// Eğer USE_MOCK_DB=true ise mock database kullan
// Değilse gerçek Prisma client kullan (prisma null ise hata ver)
let dbInstance: any;

if (USE_MOCK_DB) {
  console.warn('⚠️  Using mock database (USE_MOCK_DB=true)');
  dbInstance = createMockPrisma();
} else {
  if (!prisma) {
    console.error('❌ Prisma client is not initialized. Cannot use database.');
    throw new Error('Prisma client is not initialized. Please check your DATABASE_URL and ensure PostgreSQL is running.');
  }
  console.log('✅ Using real PostgreSQL database');
  dbInstance = prisma;
}

export default dbInstance;

