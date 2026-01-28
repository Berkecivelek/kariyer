// CareerAI API Client
class APIClient {
  constructor(baseURL = `${window.location.origin}/api`) {
    this.baseURL = baseURL;
    // Token'ları localStorage'dan yükle - her instance oluşturulduğunda
    this.loadTokens();
  }
  
  // Token'ları localStorage'dan yükle
  loadTokens() {
    try {
      this.token = localStorage.getItem('authToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      
      // Token varsa ve geçerliyse, kullanıcı bilgilerini kontrol et
      if (this.token) {
        // Token'ın geçerliliğini kontrol et (basit kontrol)
        try {
          const payload = JSON.parse(atob(this.token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            // Token süresi dolmuş, temizle
            console.warn('Token expired, clearing...');
            this.clearTokens();
          }
        } catch (e) {
          // Token parse edilemedi, geçersiz
          console.warn('Invalid token format, clearing...');
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      this.token = null;
      this.refreshToken = null;
    }
  }

  // Set authentication tokens
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear tokens
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('current-resume-id');
    // CV verilerini temizleme - kullanıcı çıkış yapana kadar tutulabilir
    // localStorage.removeItem('cv-builder-data');
    // localStorage.removeItem('cv-experiences');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const responseType = options.responseType || 'json';
    const config = {
      ...options,
      headers: {
        ...(responseType === 'json' && { 'Content-Type': 'application/json' }),
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    // responseType'ı config'den kaldır (fetch API'de yok)
    delete config.responseType;

    try {
      const response = await fetch(url, config);
      
      // Handle 401 - try to refresh token (tüm response type'lar için)
      if (!response.ok && response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          
          if (!retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type');
            let errorData;
            if (contentType && contentType.includes('application/json')) {
              errorData = await retryResponse.json();
            } else {
              const text = await retryResponse.text();
              throw new Error(text || 'Request failed');
            }
            const errorMsg = errorData.error?.message || errorData.message || 'Request failed';
            throw new Error(errorMsg);
          }
          
          // Retry başarılı, response'u işle
          if (responseType === 'blob') {
            return await retryResponse.blob();
          } else {
            const contentType = retryResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await retryResponse.json();
            } else {
              return await retryResponse.text();
            }
          }
        }
      }

      if (!response.ok) {
        // Hata durumu
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        const errorMsg = errorData.error?.message || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      // Başarılı response
      if (responseType === 'blob') {
        return await response.blob();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          // JSON değilse text olarak döndür
          return await response.text();
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      // Eğer zaten Error objesi ise direkt fırlat, değilse yeni Error oluştur
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data.tokens) {
        this.setTokens(
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken
        );
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
    }

    return false;
  }

  // Authentication
  async register(email, password, firstName, lastName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async login(email, password) {
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success && data.data.tokens) {
        this.setTokens(
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken
        );
        
        // Kullanıcı bilgilerini de localStorage'a kaydet (session persistence için)
        if (data.data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.data.user));
          localStorage.setItem('userId', data.data.user.id);
        }
        
        console.log('✅ Login successful, tokens saved');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearTokens();
    return result;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateUser(userData) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Resumes
  async getResumes(includeAll = false) {
    const url = includeAll ? '/resumes?all=true' : '/resumes';
    return this.request(url);
  }

  async getResume(id) {
    return this.request(`/resumes/${id}`);
  }

  async createResume(resumeData) {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify(resumeData),
    });
  }

  async updateResume(id, resumeData) {
    return this.request(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resumeData),
    });
  }

  async deleteResume(id) {
    return this.request(`/resumes/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateResume(id) {
    return this.request(`/resumes/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async downloadPDF(resumeId) {
    // request() metodunu kullan ki otomatik token yenileme çalışsın
    try {
      const response = await this.request(`/resumes/${resumeId}/pdf`, {
        method: 'GET',
        responseType: 'blob', // Blob response için özel işaret
      });

      // Eğer response blob ise (PDF)
      if (response instanceof Blob) {
        const blob = response;
        
        // Blob boyutu kontrolü
        if (blob.size === 0) {
          throw new Error('PDF dosyası boş');
        }
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `resume-${resumeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        }, 100);
      } else {
        throw new Error('Beklenmeyen response formatı');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      // Eğer zaten Error objesi ise direkt fırlat
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'PDF indirme sırasında bir hata oluştu');
    }
  }

  // AI Services
  async generateSummary(personalInfo) {
    return this.request('/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ personalInfo }),
    });
  }

  async generateSummarySuggestions(personalInfo) {
    return this.request('/ai/summary-suggestions', {
      method: 'POST',
      body: JSON.stringify({ personalInfo }),
    });
  }

  async generateExperience(jobTitle, company, context) {
    return this.request('/ai/experience', {
      method: 'POST',
      body: JSON.stringify({ jobTitle, company, context }),
    });
  }

  async generateEducation(schoolName, degree, field, context) {
    return this.request('/ai/education', {
      method: 'POST',
      body: JSON.stringify({ schoolName, degree, field, context }),
    });
  }

  async generateSkillsSuggestions(targetPosition, context) {
    return this.request('/ai/skills-suggestions', {
      method: 'POST',
      body: JSON.stringify({ targetPosition, context }),
    });
  }

  async generateLanguagesSuggestions(targetCountry, context) {
    return this.request('/ai/languages-suggestions', {
      method: 'POST',
      body: JSON.stringify({ targetCountry, context }),
    });
  }

  async generateCoverLetter(resumeId, hedefPozisyon, ton, jobDescription) {
    return this.request('/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ resumeId, hedefPozisyon, ton, jobDescription }),
    });
  }

  async scrapeJobPosting(url) {
    return this.request('/ai/scrape-job-posting', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Yeni LinkedIn scraping metodu (cheerio/axios tabanlı)
  async scrapeJobPostingNew(url) {
    return this.request('/ai/scrape-job', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }
  
  async parseImageForOCR(imageData) {
    // Backend'e base64 string gönder
    return this.request('/ai/parse-image-ocr', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  }

  // Parse CV from PDF - following Cover Letter pattern exactly
  async parseCVFromPDF(pdfText) {
    return this.request('/ai/parse-cv-pdf', {
      method: 'POST',
      body: JSON.stringify({ pdfText }),
    });
  }

  async analyzeResume(resumeId) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeId }),
    });
  }

  async optimizeResume(resumeId, jobDescription) {
    return this.request('/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescription }),
    });
  }

  // Cover Letters
  async getCoverLetters() {
    return this.request('/cover-letters');
  }

  async getCoverLetter(id) {
    return this.request(`/cover-letters/${id}`);
  }

  async createCoverLetter(coverLetterData) {
    return this.request('/cover-letters', {
      method: 'POST',
      body: JSON.stringify(coverLetterData),
    });
  }

  async updateCoverLetter(id, coverLetterData) {
    return this.request(`/cover-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coverLetterData),
    });
  }

  async getCoverLetters() {
    return this.request('/cover-letters');
  }

  async updateCoverLetter(id, coverLetterData) {
    return this.request(`/cover-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coverLetterData),
    });
  }

  async deleteCoverLetter(id) {
    return this.request(`/cover-letters/${id}`, {
      method: 'DELETE',
    });
  }

  // Portfolios
  async getPortfolios() {
    return this.request('/portfolios');
  }

  async getPortfolio(id) {
    return this.request(`/portfolios/${id}`);
  }

  async createPortfolio(portfolioData) {
    return this.request('/portfolios', {
      method: 'POST',
      body: JSON.stringify(portfolioData),
    });
  }

  async updatePortfolio(id, portfolioData) {
    return this.request(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(portfolioData),
    });
  }

  async deletePortfolio(id) {
    return this.request(`/portfolios/${id}`, {
      method: 'DELETE',
    });
  }

  // Templates
  async getTemplates() {
    return this.request('/templates');
  }

  async getTemplate(id) {
    return this.request(`/templates/${id}`);
  }

  // CV Analiz metodları
  async analyzeCV(cvData) {
    return this.request('/cv-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ cvData })
    });
  }

  async fixIssue(issueId, currentText, context, cvData) {
    return this.request('/cv-analysis/fix-issue', {
      method: 'POST',
      body: JSON.stringify({ issueId, currentText, context, cvData })
    });
  }

  async fixAllIssues(issues, cvData) {
    return this.request('/cv-analysis/fix-all', {
      method: 'POST',
      body: JSON.stringify({ issues, cvData })
    });
  }

  // Interview Methods
  async startInterview(mode, targetPosition, resumeId, totalQuestions = 10) {
    return this.request('/interview/start', {
      method: 'POST',
      body: JSON.stringify({ mode, targetPosition, resumeId, totalQuestions })
    });
  }

  async getNextQuestion(sessionId) {
    return this.request(`/interview/session/${sessionId}/next-question`);
  }

  async submitAnswer(questionId, textAnswer, codeAnswer, responseTime, audioAnalysis) {
    return this.request('/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId, textAnswer, codeAnswer, responseTime, audioAnalysis })
    });
  }

  async endInterview(sessionId) {
    return this.request(`/interview/session/${sessionId}/end`, {
      method: 'POST'
    });
  }

  async getInterviewHistory(limit = 10, offset = 0) {
    return this.request(`/interview/history?limit=${limit}&offset=${offset}`);
  }
}

// Create global instance
const apiClient = new APIClient();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}


