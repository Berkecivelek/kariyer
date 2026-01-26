import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { checkAndDeductCredits } from './aiService';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
let anthropic: Anthropic | null = null;

if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.trim() !== '') {
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

interface GenerateQuestionRequest {
  userId: string;
  sessionId: string;
  mode: 'BEHAVIORAL' | 'TECHNICAL' | 'STRESS';
  targetPosition: string;
  resumeData?: any;
  questionNumber: number;
  totalQuestions: number;
}

interface AnalyzeAnswerRequest {
  userId: string;
  questionId: string;
  answer: string;
  codeAnswer?: string;
  mode: 'BEHAVIORAL' | 'TECHNICAL' | 'STRESS';
  responseTime?: number;
  audioAnalysis?: any;
}

export class InterviewService {
  /**
   * CV ve pozisyona göre mülakat sorusu üretir
   */
  async generateQuestion(request: GenerateQuestionRequest): Promise<{
    question: string;
    hint?: string;
    difficulty?: string;
    codeSnippet?: string;
  }> {
    if (!anthropic) {
      throw new AppError('AI service is not configured', 503);
    }

    await checkAndDeductCredits(request.userId, 1);

    const { mode, targetPosition, resumeData, questionNumber, totalQuestions } = request;

    // CV verilerini formatla
    const cvSummary = this.formatCVForInterview(resumeData);

    // Moda göre prompt oluştur
    let prompt = '';
    
    if (mode === 'BEHAVIORAL') {
      prompt = this.buildBehavioralPrompt(targetPosition, cvSummary, questionNumber, totalQuestions);
    } else if (mode === 'TECHNICAL') {
      prompt = this.buildTechnicalPrompt(targetPosition, cvSummary, questionNumber, totalQuestions);
    } else     if (mode === 'STRESS') {
      prompt = this.buildStressPrompt(targetPosition, cvSummary, questionNumber, totalQuestions);
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new AppError('Unexpected response format from AI', 500);
      }

      const response = content.text;
      return this.parseQuestionResponse(response, mode);
    } catch (error: any) {
      console.error('❌ Interview question generation error:', error);
      throw new AppError(
        error.message || 'Soru üretilirken bir hata oluştu',
        500
      );
    }
  }

  /**
   * Kullanıcı cevabını analiz eder ve geri bildirim üretir
   */
  async analyzeAnswer(request: AnalyzeAnswerRequest): Promise<{
    instantSuggestion?: string;
    successfulPoint?: string;
    performanceScores: {
      clarity?: number;
      confidence?: number;
      technicalDepth?: number;
      decisionSpeed?: number;
      emotionalControl?: number;
      logicalConsistency?: number;
    };
    stressMetrics?: {
      calmnessRate?: number;
      voiceAnalysis?: string;
      crisisManagement?: string;
    };
  }> {
    if (!anthropic) {
      throw new AppError('AI service is not configured', 503);
    }

    await checkAndDeductCredits(request.userId, 1);

    const { questionId, answer, codeAnswer, mode, responseTime, audioAnalysis } = request;

    // Soruyu al
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Moda göre analiz prompt'u oluştur
    let prompt = '';
    
    if (mode === 'BEHAVIORAL') {
      prompt = this.buildBehavioralAnalysisPrompt(question.question, answer, responseTime, audioAnalysis);
    } else if (mode === 'TECHNICAL') {
      prompt = this.buildTechnicalAnalysisPrompt(question.question, answer, codeAnswer, question.codeSnippet);
    } else if (mode === 'STRESS') {
      prompt = this.buildStressAnalysisPrompt(question.question, answer, responseTime, audioAnalysis);
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new AppError('Unexpected response format from AI', 500);
      }

      const response = content.text;
      return this.parseAnalysisResponse(response, mode);
    } catch (error: any) {
      console.error('❌ Answer analysis error:', error);
      throw new AppError(
        error.message || 'Cevap analiz edilirken bir hata oluştu',
        500
      );
    }
  }

  // Helper Methods

  private formatCVForInterview(resumeData: any): string {
    if (!resumeData) return 'CV bilgisi bulunmuyor.';

    let summary = '';
    
    if (resumeData.summary) {
      summary += `Özet: ${resumeData.summary}\n\n`;
    }

    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      summary += 'Deneyimler:\n';
      resumeData.experience.forEach((exp: any, idx: number) => {
        summary += `${idx + 1}. ${exp.jobTitle || 'İş Unvanı'} - ${exp.company || 'Şirket'}\n`;
        if (exp.description) {
          summary += `   ${exp.description.substring(0, 200)}\n`;
        }
      });
      summary += '\n';
    }

    if (resumeData.education && Array.isArray(resumeData.education)) {
      summary += 'Eğitim:\n';
      resumeData.education.forEach((edu: any, idx: number) => {
        summary += `${idx + 1}. ${edu.degree || 'Derece'} - ${edu.school || 'Okul'}\n`;
      });
      summary += '\n';
    }

    if (resumeData.skills && Array.isArray(resumeData.skills)) {
      summary += `Yetenekler: ${resumeData.skills.join(', ')}\n`;
    }

    return summary;
  }

  private buildBehavioralPrompt(position: string, cvSummary: string, questionNumber: number, totalQuestions: number): string {
    return `Sen bir profesyonel mülakat uzmanısın. Kullanıcının CV'sine ve başvurduğu pozisyona göre davranışsal mülakat sorusu üret.

HEDEF POZİSYON: ${position}

KULLANICI CV ÖZETİ:
${cvSummary}

GÖREV:
- ${questionNumber}/${totalQuestions}. soruyu üret
- Soru, kullanıcının geçmiş deneyimlerine ve hedef pozisyona uygun olmalı
- STAR tekniği (Situation, Task, Action, Result) ile cevaplanabilecek bir soru olmalı
- Soru, kullanıcının liderlik, problem çözme, takım çalışması gibi yetkinliklerini test etmeli

ÇIKTI FORMATI (JSON):
{
  "question": "Soru metni",
  "hint": "İpucu metni (kullanıcıya nasıl cevap vermesi gerektiğini söyleyen kısa bir rehber)"
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private buildTechnicalPrompt(position: string, cvSummary: string, questionNumber: number, totalQuestions: number): string {
    return `Sen bir teknik mülakat uzmanısın. Kullanıcının CV'sine ve başvurduğu pozisyona göre teknik mülakat sorusu üret.

HEDEF POZİSYON: ${position}

KULLANICI CV ÖZETİ:
${cvSummary}

GÖREV:
- ${questionNumber}/${totalQuestions}. teknik soruyu üret
- Soru, pozisyona uygun bir teknoloji/konu hakkında olmalı (React, Node.js, Database, Algorithms, vb.)
- Soru, bir kod problemi veya mimari sorun içermeli
- Zorluk seviyesi: ORTA (orta seviye bir geliştirici için uygun)
- Kod örneği ekle (hatalı veya optimize edilmesi gereken)

ÇIKTI FORMATI (JSON):
{
  "question": "Teknik problem açıklaması",
  "hint": "İpucu (hangi teknolojilere odaklanması gerektiği)",
  "difficulty": "ORTA",
  "codeSnippet": "Kod örneği (JavaScript/TypeScript formatında, syntax highlighting için uygun)"
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private buildStressPrompt(position: string, cvSummary: string, questionNumber: number, totalQuestions: number): string {
    return `Sen bir stres testi uzmanısın. Kullanıcıyı baskı altında test edecek provokatif bir soru üret.

HEDEF POZİSYON: ${position}

KULLANICI CV ÖZETİ:
${cvSummary}

GÖREV:
- ${questionNumber}/${totalQuestions}. kritik soruyu üret
- Soru, ahlaki ikilem, kriz yönetimi veya acil durum kararı içermeli
- Kullanıcıyı saniyeler içinde karar vermeye zorlamalı
- Provokatif ve zorlayıcı olmalı
- Gerçek dünya senaryosu olmalı

ÇIKTI FORMATI (JSON):
{
  "question": "Kritik durum sorusu (kısa ve net, aciliyet hissi veren)",
  "hint": "Hızlı yanıt bekleniyor uyarısı"
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private buildBehavioralAnalysisPrompt(question: string, answer: string, responseTime?: number, audioAnalysis?: any): string {
    return `Sen bir mülakat değerlendirme uzmanısın. Kullanıcının verdiği cevabı analiz et.

SORU: ${question}

CEVAP: ${answer}
${responseTime ? `Yanıt Süresi: ${responseTime} saniye` : ''}
${audioAnalysis ? `Ses Analizi: ${JSON.stringify(audioAnalysis)}` : ''}

GÖREV:
1. Anlık Öneri: Cevabın güçlü yönlerini ve iyileştirilebilir noktalarını belirt. STAR tekniği kullanımını değerlendir.
2. Başarılı Nokta: Cevapta neyin iyi olduğunu belirt.
3. Performans Skorları: Netlik (0-100), Özgüven/Ses (0-100) skorlarını ver.

ÇIKTI FORMATI (JSON):
{
  "instantSuggestion": "İyileştirme önerisi",
  "successfulPoint": "Başarılı nokta",
  "performanceScores": {
    "clarity": 85,
    "confidence": 72
  }
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private buildTechnicalAnalysisPrompt(question: string, answer: string, codeAnswer?: string, codeSnippet?: string): string {
    return `Sen bir teknik mülakat değerlendirme uzmanısın. Kullanıcının verdiği teknik cevabı analiz et.

SORU: ${question}
${codeSnippet ? `KOD ÖRNEĞİ:\n${codeSnippet}` : ''}

CEVAP: ${answer}
${codeAnswer ? `KOD ÇÖZÜMÜ:\n${codeAnswer}` : ''}

GÖREV:
1. Teknik Doğruluk: Kavramsal doğruluğu değerlendir (shallow comparison, Virtual DOM, vb.)
2. Kod Optimizasyonu: Kod çözümünün verimliliğini ve best practice'lere uygunluğunu değerlendir
3. Mimari Yaklaşım: Çözümün profesyonel standartlara uygunluğunu değerlendir
4. Performans Skorları: Teknik Derinlik (0-100), Algoritmik Verimlilik (0-100), Hata Yakalama (0-100)

ÇIKTI FORMATI (JSON):
{
  "technicalAccuracy": "Teknik doğruluk geri bildirimi",
  "codeOptimization": "Kod optimizasyonu geri bildirimi",
  "architecturalApproach": "Mimari yaklaşım geri bildirimi",
  "performanceScores": {
    "technicalDepth": 92,
    "algorithmicEfficiency": 78,
    "errorHandling": 85
  }
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private buildStressAnalysisPrompt(question: string, answer: string, responseTime?: number, audioAnalysis?: any): string {
    return `Sen bir stres testi değerlendirme uzmanısın. Kullanıcının baskı altındaki cevabını analiz et.

SORU: ${question}

CEVAP: ${answer}
${responseTime ? `Yanıt Süresi: ${responseTime} saniye` : ''}
${audioAnalysis ? `Ses Analizi: ${JSON.stringify(audioAnalysis)}` : ''}

GÖREV:
1. Ses Analizi: Ses tonundaki titremeler, duraksamalar, özgüven eksikliği belirtileri
2. Kriz Yönetimi: Karar verme hızı, etik risk değerlendirmesi, mantık tutarlılığı
3. Baskı Parametreleri: Karar Hızı, Duygusal Kontrol, Mantık Tutarlılığı (0-100)
4. Sakinliği Koruma Oranı: Genel stres seviyesi (0-100)

ÇIKTI FORMATI (JSON):
{
  "voiceAnalysis": "Ses analizi geri bildirimi",
  "crisisManagement": "Kriz yönetimi geri bildirimi",
  "performanceScores": {
    "decisionSpeed": 95,
    "emotionalControl": 32,
    "logicalConsistency": 58
  },
  "stressMetrics": {
    "calmnessRate": 64,
    "voiceAnalysis": "Detaylı ses analizi metni",
    "crisisManagement": "Kriz yönetimi değerlendirmesi"
  }
}

SADECE JSON DÖNDÜR, BAŞKA AÇIKLAMA YAPMA.`;
  }

  private parseQuestionResponse(response: string, mode: string): {
    question: string;
    hint?: string;
    difficulty?: string;
    codeSnippet?: string;
  } {
    try {
      // JSON'u extract et
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON bulunamadı');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        question: parsed.question || '',
        hint: parsed.hint,
        difficulty: parsed.difficulty,
        codeSnippet: parsed.codeSnippet
      };
    } catch (error) {
      console.error('Parse error:', error);
      // Fallback: Basit format
      return {
        question: response.split('\n')[0] || 'Soru üretilemedi',
        hint: 'Cevabınızı net ve somut örneklerle verin.'
      };
    }
  }

  private parseAnalysisResponse(response: string, mode: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON bulunamadı');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (mode === 'BEHAVIORAL') {
        return {
          instantSuggestion: parsed.instantSuggestion,
          successfulPoint: parsed.successfulPoint,
          performanceScores: parsed.performanceScores || {}
        };
      } else if (mode === 'TECHNICAL') {
        return {
          technicalAccuracy: parsed.technicalAccuracy,
          codeOptimization: parsed.codeOptimization,
          architecturalApproach: parsed.architecturalApproach,
          performanceScores: parsed.performanceScores || {}
        };
      } else if (mode === 'STRESS') {
        return {
          performanceScores: parsed.performanceScores || {},
          stressMetrics: parsed.stressMetrics || {}
        };
      }
    } catch (error) {
      console.error('Parse error:', error);
      return {
        performanceScores: {},
        instantSuggestion: 'Analiz tamamlandı.',
        successfulPoint: 'Cevabınız değerlendirildi.'
      };
    }
  }
}

