import { Request, Response, NextFunction } from 'express';
import { CVAnalysisService } from '../services/cv-analysis.service';
import { AppError } from '../middleware/errorHandler';

export class CVAnalysisController {
  private analysisService: CVAnalysisService;

  constructor() {
    this.analysisService = new CVAnalysisService();
  }

  async analyzeCV(req: Request, res: Response, next: NextFunction) {
    try {
      const { cvData } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!cvData) {
        return res.status(400).json({
          success: false,
          error: 'CV verisi gerekli',
        });
      }

      console.log('📊 CV analizi başlatılıyor, User ID:', userId);

      const result = await this.analysisService.analyzeCV(cvData);

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error('❌ CV analizi hatası:', error);
      next(error);
    }
  }

  async fixIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { issueId, currentText, context, cvData } = req.body;

      if (!issueId || !currentText) {
        return res.status(400).json({
          success: false,
          error: 'Issue ID ve mevcut metin gerekli',
        });
      }

      console.log('🔧 Hata düzeltiliyor:', issueId);

      const fixedText = await this.analysisService.fixIssueWithAI(
        issueId,
        currentText,
        context,
        cvData
      );

      res.json({
        success: true,
        data: {
          issueId,
          originalText: currentText,
          fixedText,
        },
      });

    } catch (error) {
      console.error('❌ Düzeltme hatası:', error);
      next(error);
    }
  }

  async fixAllIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { issues, cvData } = req.body;

      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({
          success: false,
          error: 'Issues listesi gerekli',
        });
      }

      console.log('🔧 Toplu düzeltme başlatılıyor:', issues.length, 'adet');

      const fixes = await Promise.all(
        issues.map((issue: any) =>
          this.analysisService.fixIssueWithAI(
            issue.id,
            issue.currentText || issue.description,
            issue.description || issue.context || '',
            cvData
          )
        )
      );

      res.json({
        success: true,
        data: {
          fixes: fixes.map((fixedText, index) => ({
            issueId: issues[index].id,
            originalText: issues[index].currentText || issues[index].description,
            fixedText,
          })),
        },
      });

    } catch (error) {
      console.error('❌ Toplu düzeltme hatası:', error);
      next(error);
    }
  }
}


