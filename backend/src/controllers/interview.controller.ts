import { Request, Response, NextFunction } from 'express';
import { InterviewService } from '../services/interview.service';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

const interviewService = new InterviewService();

export class InterviewController {
  /**
   * Yeni mülakat oturumu başlatır
   */
  async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      const { mode, targetPosition, resumeId, totalQuestions = 10 } = req.body;

      if (!mode || !targetPosition) {
        return res.status(400).json({
          success: false,
          error: 'Mode ve targetPosition gerekli'
        });
      }

      // Resume verilerini al (eğer resumeId varsa)
      let resumeData = null;
      if (resumeId) {
        const resume = await prisma.resume.findUnique({
          where: { id: resumeId, userId }
        });
        if (resume) {
          resumeData = {
            summary: resume.summary,
            experience: resume.experience,
            education: resume.education,
            skills: resume.skills,
            profession: resume.profession
          };
        }
      }

      // Yeni session oluştur
      const session = await prisma.interviewSession.create({
        data: {
          userId,
          resumeId: resumeId || null,
          mode: mode.toUpperCase(),
          targetPosition,
          totalQuestions,
          status: 'IN_PROGRESS'
        }
      });

      // İlk soruyu üret
      const questionData = await interviewService.generateQuestion({
        userId,
        sessionId: session.id,
        mode: mode.toUpperCase() as any,
        targetPosition,
        resumeData,
        questionNumber: 1,
        totalQuestions
      });

      // Soruyu kaydet
      const question = await prisma.interviewQuestion.create({
        data: {
          sessionId: session.id,
          questionNumber: 1,
          question: questionData.question,
          hint: questionData.hint || null,
          difficulty: questionData.difficulty || null,
          codeSnippet: questionData.codeSnippet || null
        }
      });

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            mode: session.mode,
            targetPosition: session.targetPosition,
            totalQuestions: session.totalQuestions,
            currentQuestion: session.currentQuestion,
            startTime: session.startTime
          },
          question: {
            id: question.id,
            question: question.question,
            hint: question.hint,
            difficulty: question.difficulty,
            codeSnippet: question.codeSnippet,
            questionNumber: question.questionNumber
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mevcut oturum için yeni soru üretir
   */
  async getNextQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      const { sessionId } = req.params;

      const session = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId, status: 'IN_PROGRESS' },
        include: { questions: true }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session bulunamadı'
        });
      }

      const nextQuestionNumber = session.currentQuestion + 1;
      
      if (nextQuestionNumber > session.totalQuestions) {
        return res.status(400).json({
          success: false,
          error: 'Tüm sorular tamamlandı'
        });
      }

      // Resume verilerini al
      let resumeData = null;
      if (session.resumeId) {
        const resume = await prisma.resume.findUnique({
          where: { id: session.resumeId }
        });
        if (resume) {
          resumeData = {
            summary: resume.summary,
            experience: resume.experience,
            education: resume.education,
            skills: resume.skills,
            profession: resume.profession
          };
        }
      }

      // Yeni soru üret
      const questionData = await interviewService.generateQuestion({
        userId,
        sessionId: session.id,
        mode: session.mode as any,
        targetPosition: session.targetPosition,
        resumeData,
        questionNumber: nextQuestionNumber,
        totalQuestions: session.totalQuestions
      });

      // Soruyu kaydet
      const question = await prisma.interviewQuestion.create({
        data: {
          sessionId: session.id,
          questionNumber: nextQuestionNumber,
          question: questionData.question,
          hint: questionData.hint || null,
          difficulty: questionData.difficulty || null,
          codeSnippet: questionData.codeSnippet || null
        }
      });

      // Session'ı güncelle
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { currentQuestion: nextQuestionNumber }
      });

      res.json({
        success: true,
        data: {
          question: {
            id: question.id,
            question: question.question,
            hint: question.hint,
            difficulty: question.difficulty,
            codeSnippet: question.codeSnippet,
            questionNumber: question.questionNumber
          },
          progress: {
            current: nextQuestionNumber,
            total: session.totalQuestions
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Kullanıcı cevabını kaydeder ve analiz eder
   */
  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      const { questionId, textAnswer, codeAnswer, responseTime, audioAnalysis } = req.body;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          error: 'questionId gerekli'
        });
      }

      // Soruyu ve session'ı al
      const question = await prisma.interviewQuestion.findUnique({
        where: { id: questionId },
        include: { session: true }
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question bulunamadı'
        });
      }

      if (question.session.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Bu soruya erişim yetkiniz yok'
        });
      }

      // Cevabı analiz et
      const analysis = await interviewService.analyzeAnswer({
        userId,
        questionId,
        answer: textAnswer || '',
        codeAnswer,
        mode: question.session.mode as any,
        responseTime,
        audioAnalysis
      });

      // Cevabı kaydet
      const answer = await prisma.interviewAnswer.create({
        data: {
          questionId,
          textAnswer: textAnswer || null,
          codeAnswer: codeAnswer || null,
          responseTime: responseTime || null,
          aiFeedback: analysis as any,
          performanceScores: analysis.performanceScores as any,
          stressMetrics: analysis.stressMetrics as any
        }
      });

      res.json({
        success: true,
        data: {
          answer: {
            id: answer.id,
            aiFeedback: answer.aiFeedback,
            performanceScores: answer.performanceScores,
            stressMetrics: answer.stressMetrics
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mülakat oturumunu sonlandırır
   */
  async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      const { sessionId } = req.params;

      const session = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          questions: {
            include: { answers: true }
          }
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session bulunamadı'
        });
      }

      // Performans metriklerini hesapla
      const allScores: number[] = [];
      session.questions.forEach((q: any) => {
        q.answers.forEach((a: any) => {
          if (a.performanceScores) {
            const scores = a.performanceScores as any;
            Object.values(scores).forEach((score: any) => {
              if (typeof score === 'number') {
                allScores.push(score);
              }
            });
          }
        });
      });

      const overallScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null;

      // Session'ı güncelle
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

      await prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          endTime,
          duration,
          overallScore,
          performanceMetrics: {
            totalQuestions: session.totalQuestions,
            answeredQuestions: session.questions.filter((q: any) => q.answers.length > 0).length,
            averageScore: overallScore
          } as any
        }
      });

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            status: 'COMPLETED',
            overallScore,
            duration
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Kullanıcının mülakat geçmişini getirir
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      const { limit = '10', offset = '0' } = req.query;

      // Pagination limitlerini güvenli hale getir
      const safeLimit = Math.min(Math.max(1, parseInt(limit as string, 10) || 10), 100); // Max 100
      const safeOffset = Math.max(0, parseInt(offset as string, 10) || 0);

      const sessions = await prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        skip: safeOffset,
        include: {
          _count: {
            select: { questions: true }
          }
        }
      });

      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      next(error);
    }
  }
}

