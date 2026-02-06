import axios from 'axios';
import * as cheerio from 'cheerio';

interface LinkedInJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  skills: string[];
}

export class LinkedInScraperService {
  
  private async fetchViaPublicAPI(jobId: string): Promise<LinkedInJobData | null> {
    try {
      const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      const jobData: LinkedInJobData = {
        title: $('.top-card-layout__title').text().trim() || 
               $('h1.topcard__title').text().trim() ||
               $('h2.t-24').first().text().trim(),
        
        company: $('.topcard__org-name-link').text().trim() ||
                 $('.top-card-layout__entity-info a').first().text().trim(),
        
        location: $('.topcard__flavor--bullet').text().trim() ||
                  $('.top-card-layout__second-subline').text().trim(),
        
        description: $('.show-more-less-html__markup').text().trim() ||
                     $('.description__text').text().trim() ||
                     $('.core-section-container__content').text().trim(),
        
        requirements: '',
        skills: [],
      };

      const requirementsList: string[] = [];
      $('.description__text ul li, .show-more-less-html__markup ul li').each((_, elem) => {
        const text = $(elem).text().trim();
        if (text) requirementsList.push(text);
      });
      jobData.requirements = requirementsList.join('\n');

      console.log('✅ LinkedIn Public API ile veri çekildi:', jobData.title);
      return jobData;

    } catch (error) {
      console.log('❌ Public API failed:', (error as Error).message);
      return null;
    }
  }

  private async fetchViaGuestURL(url: string): Promise<LinkedInJobData | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      const jobData: LinkedInJobData = {
        title: $('h1').first().text().trim() || $('title').text().split('|')[0].trim(),
        company: $('a[data-tracking-control-name="public_jobs_topcard-org-name"]').text().trim() ||
                 $('.topcard__org-name-link').text().trim(),
        location: $('.topcard__flavor--bullet').text().trim(),
        description: $('#job-details').text().trim() || 
                     $('.show-more-less-html__markup').text().trim(),
        requirements: '',
        skills: [],
      };

      const reqList: string[] = [];
      $('ul li').each((_, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 10 && text.length < 300) {
          reqList.push(text);
        }
      });
      jobData.requirements = reqList.slice(0, 15).join('\n');

      console.log('✅ Guest URL ile veri çekildi:', jobData.title);
      return jobData;

    } catch (error) {
      console.log('❌ Guest URL failed:', (error as Error).message);
      return null;
    }
  }

  private extractJobId(url: string): string | null {
    const match = url.match(/\/jobs\/view\/(\d+)/);
    return match ? match[1] : null;
  }

  async scrapeLinkedInJob(url: string): Promise<{
    success: boolean;
    data?: LinkedInJobData;
    formattedText?: string;
    jobId?: string;
    fallbackStrategy?: 'frontend_fetch';
    error?: string;
  }> {
    
    console.log('🔍 LinkedIn iş ilanı analizi başlıyor:', url);

    if (!url.includes('linkedin.com/jobs')) {
      return {
        success: false,
        error: 'Geçersiz LinkedIn iş ilanı URL\'si'
      };
    }

    const jobId = this.extractJobId(url);
    if (!jobId) {
      return {
        success: false,
        error: 'İş ilanı ID\'si bulunamadı'
      };
    }

    console.log('📡 Public API deneniyor...');
    const apiResult = await this.fetchViaPublicAPI(jobId);
    if (apiResult && apiResult.description.length > 100) {
      return {
        success: true,
        data: apiResult,
        formattedText: this.formatJobData(apiResult)
      };
    }

    console.log('📡 Guest URL deneniyor...');
    const guestResult = await this.fetchViaGuestURL(url);
    if (guestResult && guestResult.description.length > 100) {
      return {
        success: true,
        data: guestResult,
        formattedText: this.formatJobData(guestResult)
      };
    }

    console.log('📡 Frontend fallback gerekiyor');
    return {
      success: false,
      fallbackStrategy: 'frontend_fetch',
      jobId: jobId,
      error: 'Backend scraping başarısız, manuel metin girişi öneriliyor'
    };
  }

  private formatJobData(data: LinkedInJobData): string {
    let formatted = `POZİSYON: ${data.title}\n`;
    formatted += `ŞİRKET: ${data.company}\n`;
    formatted += `LOKASYON: ${data.location}\n\n`;
    formatted += `--- İŞ TANIMI ---\n${data.description}\n`;

    if (data.requirements) {
      formatted += `\n--- ARANAN NİTELİKLER ---\n${data.requirements}\n`;
    }

    if (data.skills.length > 0) {
      formatted += `\n--- GEREKLİ YETKİNLİKLER ---\n${data.skills.join(', ')}\n`;
    }

    return formatted.trim();
  }
}




