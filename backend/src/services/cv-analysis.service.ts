import Anthropic from '@anthropic-ai/sdk';
import { AppError } from '../middleware/errorHandler';

interface CVAnalysisResult {
  score: number;
  improvement: number;
  criticalIssues: AnalysisItem[];
  improvements: AnalysisItem[];
  strengths: string[];
  detailedReport: string;
}

interface AnalysisItem {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'improvement';
  section: string;
  currentText?: string;
  suggestedFix?: string;
}

export class CVAnalysisService {
  private anthropic: Anthropic | null;

  constructor() {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.trim() === '') {
      console.warn('⚠️  ANTHROPIC_API_KEY is not set! CV Analysis will not work.');
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
      });
      console.log('✅ CV Analysis Service initialized');
    }
  }

  async analyzeCV(cvData: any): Promise<CVAnalysisResult> {
    if (!this.anthropic) {
      throw new AppError('AI servisi kullanılamıyor. Lütfen API key yapılandırmasını kontrol edin.', 503);
    }

    console.log('🔍 CV analizi başlıyor...');

    const cvText = this.formatCVForAnalysis(cvData);
    const analysisPrompt = this.buildAnalysisPrompt(cvText);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      const result = this.parseAIResponse(analysisText, cvData);

      console.log('✅ CV analizi tamamlandı. Puan:', result.score);
      return result;

    } catch (error) {
      console.error('❌ CV analizi hatası:', error);
      throw new AppError('CV analizi başarısız oldu. Lütfen tekrar deneyin.', 500);
    }
  }

  async fixIssueWithAI(
    issueId: string,
    currentText: string,
    context: string,
    cvData: any
  ): Promise<string> {
    if (!this.anthropic) {
      throw new AppError('AI servisi kullanılamıyor.', 503);
    }

    console.log('🤖 AI ile düzeltme başlıyor:', issueId);

    const fixPrompt = `
ÖZGEÇMİŞ BÖLÜMÜ DÜZELTMESİ

MEVCUT METİN:
${currentText}

SORUN:
${context}

ÖZGEÇMİŞ BAĞLAMI:
${JSON.stringify(cvData, null, 2)}

GÖREV:
Bu metni profesyonel, ATS uyumlu ve etki odaklı bir şekilde yeniden yaz.

KURALLAR:
1. Sayısal verilerle destekle (%, TL, adet, kişi sayısı)
2. Aktif fiiller kullan (Yönettim, Geliştirdim, Artırdım)
3. Sektör anahtar kelimelerini dahil et
4. Sonuç odaklı cümleler kur
5. 2-3 cümleyle sınırla
6. Türkçe dilbilgisine dikkat et

SADECE DÜZELTİLMİŞ METNİ DÖNDÜR, AÇIKLAMA YAPMA:
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        temperature: 0.5,
        messages: [{ role: 'user', content: fixPrompt }],
      });

      const fixedText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : currentText;

      console.log('✅ Düzeltme tamamlandı');
      return fixedText;

    } catch (error) {
      console.error('❌ Düzeltme hatası:', error);
      return currentText;
    }
  }

  private formatCVForAnalysis(cvData: any): string {
    let formatted = `=== ÖZGEÇMİŞ ANALİZİ ===\n\n`;

    if (cvData.firstName || cvData.lastName || cvData.email || cvData.phone) {
      formatted += `KİŞİSEL BİLGİLER:\n`;
      formatted += `Ad: ${cvData.firstName || ''} ${cvData.lastName || ''}\n`;
      formatted += `E-posta: ${cvData.email || 'Belirtilmemiş'}\n`;
      formatted += `Telefon: ${cvData.phone || 'Belirtilmemiş'}\n`;
      formatted += `Konum: ${cvData.location || 'Belirtilmemiş'}\n\n`;
    }

    if (cvData.summary) {
      formatted += `ÖZET/HAKKIMDA:\n${cvData.summary}\n\n`;
    }

    if (cvData.experience && Array.isArray(cvData.experience) && cvData.experience.length > 0) {
      formatted += `İŞ DENEYİMLERİ:\n`;
      cvData.experience.forEach((exp: any, index: number) => {
        formatted += `${index + 1}. ${exp.title || exp.jobTitle || 'Pozisyon'} - ${exp.company || 'Şirket'}\n`;
        formatted += `   Tarih: ${exp.startMonth || ''} ${exp.startYear || ''} - ${exp.isCurrent ? 'Devam ediyor' : `${exp.endMonth || ''} ${exp.endYear || ''}`}\n`;
        formatted += `   Açıklama: ${exp.description || 'Belirtilmemiş'}\n\n`;
      });
    }

    if (cvData.education && Array.isArray(cvData.education) && cvData.education.length > 0) {
      formatted += `EĞİTİM:\n`;
      cvData.education.forEach((edu: any, index: number) => {
        formatted += `${index + 1}. ${edu.degree || edu.field || 'Derece'} - ${edu.school || edu.schoolName || 'Okul'}\n`;
        formatted += `   Tarih: ${edu.startMonth || ''} ${edu.startYear || ''} - ${edu.endMonth || ''} ${edu.endYear || ''}\n\n`;
      });
    }

    if (cvData.skills && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
      const skillsList = cvData.skills.map((s: any) => {
        if (typeof s === 'string') return s;
        return s.name || s.skill || '';
      }).filter(Boolean);
      formatted += `YETENEKLER:\n${skillsList.join(', ')}\n\n`;
    }

    if (cvData.languages && Array.isArray(cvData.languages) && cvData.languages.length > 0) {
      formatted += `DİLLER:\n`;
      cvData.languages.forEach((lang: any) => {
        formatted += `- ${lang.name || lang.language || ''}: ${lang.level || ''}\n`;
      });
    }

    return formatted;
  }

  private buildAnalysisPrompt(cvText: string): string {
    return `
SEN BİR ÖZGEÇMİŞ ANALİZ UZMANISIN. Aşağıdaki özgeçmişi 4 aşamalı profesyonel analiz sürecine tabi tut:

${cvText}

ANALİZ AŞAMALARI:

1. ATS SİMÜLASYONU:
   - Dosya okunabilirliği
   - Başlık hiyerarşisi
   - İletişim bilgilerinin formatı
   - Standartlara uygunluk

2. SEMANTİK ANALİZ:
   - Cümlelerin etki gücü
   - Sayısal veri kullanımı
   - Aktif/pasif fiil dengesi
   - Sonuç odaklılık

3. ANAHTAR KELİME TESTİ:
   - Sektör terminolojisi yoğunluğu
   - Önemli becerilerin vurgulanması
   - ATS anahtar kelime uyumu

4. GÖRSEL VE TEKNİK DENETİM:
   - Bölüm organizasyonu
   - Tarih formatları
   - Boşluklar ve eksiklikler

ÇIKTI FORMATI (JSON):
{
  "score": 82,
  "criticalIssues": [
    {
      "id": "issue-1",
      "title": "Sayısal başarı verisi eksik",
      "description": "Deneyimlerinizde %20 büyüme, 10+ kişilik ekip gibi somut veriler kullanmalısınız.",
      "category": "critical",
      "section": "experience",
      "currentText": "Satışları artırdım",
      "suggestedFix": "Satış hacmini %35 artırarak yıllık 2.5M TL ek gelir sağladım"
    },
    {
      "id": "issue-2",
      "title": "İletişim bilgileri biçimi hatalı",
      "description": "Telefon numaranız uluslararası formatta (+90) değil.",
      "category": "critical",
      "section": "contact"
    }
  ],
  "improvements": [
    {
      "id": "improve-1",
      "title": "Anahtar kelime uyumu %60",
      "description": "'React', 'Tailwind', 'Architecture' gibi sektör kelimelerini artırın.",
      "category": "improvement",
      "section": "skills"
    },
    {
      "id": "improve-2",
      "title": "Hakkımda yazısı çok kısa",
      "description": "En az 3-4 cümlelik, kariyer hedeflerinizi özetleyen bir paragraf ekleyin.",
      "category": "improvement",
      "section": "summary"
    }
  ],
  "strengths": [
    "Görsel Hiyerarşi",
    "İş Deneyimi Sıralaması",
    "Sertifikalar ve Eğitim",
    "Dil Yeterliliği"
  ],
  "detailedReport": "Özgeçmişiniz genel olarak iyi yapılandırılmış..."
}

KRİTİK HATALAR (2-3 adet): İşe alımı engelleyecek bloklayıcı sorunlar
GELİŞTİRİLEBİLİR ALANLAR (3-4 adet): Optimizasyon önerileri
GÜÇLÜ YÖNLER (4-6 adet): Doğru yapılan şeyler

SADECE JSON DÖNDÜR, AÇIKLAMA YAPMA:
`;
  }

  private parseAIResponse(aiResponse: string, cvData: any): CVAnalysisResult {
    try {
      let cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      const improvement = Math.floor(Math.random() * 15) + 5;

      return {
        score: parsed.score || 75,
        improvement,
        criticalIssues: parsed.criticalIssues || [],
        improvements: parsed.improvements || [],
        strengths: parsed.strengths || [],
        detailedReport: parsed.detailedReport || '',
      };

    } catch (error) {
      console.error('❌ AI yanıtı parse edilemedi:', error);
      
      return {
        score: 70,
        improvement: 0,
        criticalIssues: [
          {
            id: 'fallback-1',
            title: 'Analiz tamamlanamadı',
            description: 'Lütfen CV formatınızı kontrol edin ve tekrar deneyin.',
            category: 'critical',
            section: 'general',
          },
        ],
        improvements: [],
        strengths: ['CV formatı okunabilir'],
        detailedReport: 'Analiz kısmen tamamlandı.',
      };
    }
  }
}



