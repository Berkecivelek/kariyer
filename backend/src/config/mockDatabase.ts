// Mock in-memory database for development without PostgreSQL
// This allows us to test the backend without setting up a database

interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  status: 'DRAFT' | 'COMPLETED';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  profession?: string;
  summary?: string;
  experience?: any;
  education?: any;
  skills?: any;
  languages?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  content: string;
  jobTitle?: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Portfolio {
  id: string;
  userId: string;
  title: string;
  description?: string;
  projects?: any;
  createdAt: Date;
  updatedAt: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private resumes: Map<string, Resume> = new Map();
  private coverLetters: Map<string, CoverLetter> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();

  // User operations
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  // Resume operations
  async createResume(data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resume> {
    const id = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const resume: Resume = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async findResumeById(id: string): Promise<Resume | null> {
    return this.resumes.get(id) || null;
  }

  async findResumesByUserId(userId: string): Promise<Resume[]> {
    const userResumes: Resume[] = [];
    for (const resume of this.resumes.values()) {
      if (resume.userId === userId) {
        userResumes.push(resume);
      }
    }
    return userResumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateResume(id: string, data: Partial<Resume>): Promise<Resume> {
    const existing = this.resumes.get(id);
    if (!existing) {
      throw new Error('Resume not found');
    }
    const updated: Resume = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.resumes.set(id, updated);
    return updated;
  }

  async deleteResume(id: string): Promise<void> {
    this.resumes.delete(id);
  }

  // Cover Letter operations
  async createCoverLetter(data: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoverLetter> {
    const id = `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const coverLetter: CoverLetter = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.coverLetters.set(id, coverLetter);
    return coverLetter;
  }

  async findCoverLetterById(id: string): Promise<CoverLetter | null> {
    return this.coverLetters.get(id) || null;
  }

  async findCoverLettersByUserId(userId: string): Promise<CoverLetter[]> {
    const userCoverLetters: CoverLetter[] = [];
    for (const coverLetter of this.coverLetters.values()) {
      if (coverLetter.userId === userId) {
        userCoverLetters.push(coverLetter);
      }
    }
    return userCoverLetters.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateCoverLetter(id: string, data: Partial<CoverLetter>): Promise<CoverLetter> {
    const existing = this.coverLetters.get(id);
    if (!existing) {
      throw new Error('Cover letter not found');
    }
    const updated: CoverLetter = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.coverLetters.set(id, updated);
    return updated;
  }

  async deleteCoverLetter(id: string): Promise<void> {
    this.coverLetters.delete(id);
  }

  // Portfolio operations
  async createPortfolio(data: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Portfolio> {
    const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const portfolio: Portfolio = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async findPortfolioById(id: string): Promise<Portfolio | null> {
    return this.portfolios.get(id) || null;
  }

  async findPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
    const userPortfolios: Portfolio[] = [];
    for (const portfolio of this.portfolios.values()) {
      if (portfolio.userId === userId) {
        userPortfolios.push(portfolio);
      }
    }
    return userPortfolios.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    const existing = this.portfolios.get(id);
    if (!existing) {
      throw new Error('Portfolio not found');
    }
    const updated: Portfolio = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.portfolios.set(id, updated);
    return updated;
  }

  async deletePortfolio(id: string): Promise<void> {
    this.portfolios.delete(id);
  }

  // Clear all data (for testing)
  clear(): void {
    this.users.clear();
    this.resumes.clear();
    this.coverLetters.clear();
    this.portfolios.clear();
  }
}

// Export singleton instance
const mockDb = new MockDatabase();
export default mockDb;






