// CV Analysis Manager
// Handles CV analysis, scoring, and AI-powered fixes

(function () {
  'use strict';

  class CVAnalysisManager {
    constructor() {
      this.userCVs = [];
      this.selectedCV = null;
      this.currentAnalysis = null;
      this.init();
    }

    async init() {
      await this.loadUserCVs();
      this.initializeEventListeners();
    }

    initializeEventListeners() {
      const fixAllBtn = document.getElementById('fix-all-btn');
      if (fixAllBtn) {
        fixAllBtn.addEventListener('click', () => this.fixAllIssues());
      }

      const downloadBtn = document.getElementById('download-pdf-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => this.downloadReport());
      }

      // Önizleme zoom butonu
      const zoomBtn = document.getElementById('preview-zoom-btn');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => this.zoomPreview());
      }

      // Önizleme indirme butonu
      const previewDownloadBtn = document.getElementById('preview-download-btn');
      if (previewDownloadBtn) {
        previewDownloadBtn.addEventListener('click', () => this.downloadPreviewPDF());
      }

      // CV seçim butonları için event delegation
      document.addEventListener('click', (e) => {
        if (e.target.closest('.fix-issue-btn')) {
          const btn = e.target.closest('.fix-issue-btn');
          this.fixSingleIssue(
            btn.dataset.issueId,
            btn.dataset.currentText,
            btn.dataset.context,
            btn
          );
        }
      });
    }

    async loadUserCVs() {
      try {
        console.log('📂 Kullanıcı CV\'leri yükleniyor...');
        
        if (!window.apiClient) {
          console.error('API client bulunamadı');
          return;
        }

        const response = await window.apiClient.getResumes(true);
        
        if (response.success && response.data && response.data.resumes && Array.isArray(response.data.resumes)) {
          this.userCVs = response.data.resumes;
          this.renderCVList();
          console.log('✅ CV\'ler yüklendi:', this.userCVs.length, 'adet');
        } else {
          this.showNoCVsMessage();
        }

      } catch (error) {
        console.error('❌ CV yükleme hatası:', error);
        this.showError('CV\'leriniz yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    }

    renderCVList() {
      // Dropdown'u bul
      const resumeSelect = document.getElementById('resume-select');
      if (!resumeSelect) {
        console.error('CV seçim dropdown\'u bulunamadı');
        return;
      }

      // Dropdown'u temizle (sadece placeholder option kalacak)
      resumeSelect.innerHTML = '<option value="">Özgeçmiş Seçin...</option>';

      if (this.userCVs.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Henüz CV oluşturmamışsınız';
        option.disabled = true;
        resumeSelect.appendChild(option);
        return;
      }

      // CV'leri dropdown'a ekle
      this.userCVs.forEach(cv => {
        const option = document.createElement('option');
        option.value = cv.id;
        option.textContent = `${cv.title || 'İsimsiz CV'} - ${cv.firstName || ''} ${cv.lastName || ''}`.trim();
        option.dataset.cv = JSON.stringify(cv);
        resumeSelect.appendChild(option);
      });

      // Dropdown değişikliğini dinle
      resumeSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (!selectedValue) {
          this.selectedCV = null;
          const analyzeBtn = document.getElementById('analyze-btn');
          if (analyzeBtn) analyzeBtn.disabled = true;
          return;
        }

        const selectedOption = e.target.options[e.target.selectedIndex];
        const cvData = JSON.parse(selectedOption.dataset.cv);
        this.selectCV(cvData, null);
      });

      // Analiz butonunu bağla
      const analyzeBtn = document.getElementById('analyze-btn');
      if (analyzeBtn && !analyzeBtn.hasAttribute('data-listener-attached')) {
        analyzeBtn.setAttribute('data-listener-attached', 'true');
        analyzeBtn.addEventListener('click', () => this.startAnalysis());
      }
    }

    async selectCV(cv, cardElement) {
      this.selectedCV = cv;
      const analyzeBtn = document.getElementById('analyze-btn');
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
      }
      
      console.log('✅ CV seçildi:', cv.title);
      
      // CV önizlemesini render et
      await this.renderCVPreview(cv);
    }

    async renderCVPreview(cv) {
      try {
        // CV'nin tam verilerini al
        const response = await window.apiClient.getResume(cv.id);
        if (!response.success || !response.data) {
          console.error('CV verileri alınamadı');
          // Fallback: Mevcut CV objesini kullan
          this.renderPreviewFromCVObject(cv);
          return;
        }

        const resumeData = response.data.resume || response.data;
        
        // CV verilerini template renderer formatına dönüştür
        const cvDataForPreview = {
          'fullname-first': resumeData.firstName || '',
          'fullname-last': resumeData.lastName || '',
          profession: resumeData.profession || '',
          email: resumeData.email || '',
          phone: resumeData.phone || '',
          location: resumeData.location || '',
          summary: resumeData.summary || '',
          experiences: Array.isArray(resumeData.experience) ? resumeData.experience : [],
          education: Array.isArray(resumeData.education) ? resumeData.education : [],
          skills: Array.isArray(resumeData.skills) ? resumeData.skills : [],
          languages: Array.isArray(resumeData.languages) ? resumeData.languages : []
        };

        // Template renderer'ı kontrol et
        if (!window.CVTemplateRenderer || !window.CVTemplateRenderer.render) {
          console.error('CVTemplateRenderer bulunamadı');
          // Fallback: Basit bir önizleme göster
          this.showSimplePreview(cvDataForPreview);
          return;
        }

        // Template adını al (varsayılan: modern)
        const templateName = resumeData.templateId || 'modern';
        
        // CV'yi render et
        const html = window.CVTemplateRenderer.render(templateName, cvDataForPreview);
        
        // Önizleme container'ını bul ve güncelle
        const previewContainer = document.getElementById('cv-preview-content');
        if (previewContainer) {
          previewContainer.innerHTML = html;
          
          // Scale ayarla (küçük önizleme için - A4 boyutunu küçült)
          // A4: 210mm x 297mm -> yaklaşık 794px x 1123px (96 DPI'da)
          // Önizleme için: 400px genişlik -> scale: 400/794 ≈ 0.5
          previewContainer.style.transform = 'scale(0.5)';
          previewContainer.style.transformOrigin = 'top center';
          previewContainer.style.width = '794px'; // A4 genişliği
          previewContainer.style.height = 'auto';
          previewContainer.style.minHeight = '1123px'; // A4 yüksekliği
          previewContainer.style.margin = '0 auto';
        }

      } catch (error) {
        console.error('❌ CV önizleme render hatası:', error);
        this.renderPreviewFromCVObject(cv);
      }
    }

    renderPreviewFromCVObject(cv) {
      const cvDataForPreview = {
        'fullname-first': cv.firstName || '',
        'fullname-last': cv.lastName || '',
        profession: cv.profession || '',
        email: cv.email || '',
        phone: cv.phone || '',
        location: cv.location || '',
        summary: cv.summary || '',
        experiences: Array.isArray(cv.experience) ? cv.experience : [],
        education: Array.isArray(cv.education) ? cv.education : [],
        skills: Array.isArray(cv.skills) ? cv.skills : [],
        languages: Array.isArray(cv.languages) ? cv.languages : []
      };

      if (window.CVTemplateRenderer && window.CVTemplateRenderer.render) {
        const templateName = cv.templateId || 'modern';
        const html = window.CVTemplateRenderer.render(templateName, cvDataForPreview);
        const previewContainer = document.getElementById('cv-preview-content');
        if (previewContainer) {
          previewContainer.innerHTML = html;
          previewContainer.style.transform = 'scale(0.5)';
          previewContainer.style.transformOrigin = 'top center';
          previewContainer.style.width = '794px'; // A4 genişliği
          previewContainer.style.height = 'auto';
          previewContainer.style.minHeight = '1123px'; // A4 yüksekliği
          previewContainer.style.margin = '0 auto';
        }
      } else {
        this.showSimplePreview(cvDataForPreview);
      }
    }

    showSimplePreview(cvData) {
      const previewContainer = document.getElementById('cv-preview-content');
      if (!previewContainer) return;

      const fullName = `${cvData['fullname-first'] || ''} ${cvData['fullname-last'] || ''}`.trim() || 'Ad Soyad';
      
      previewContainer.innerHTML = `
        <div class="border-b-2 border-primary pb-4">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">${this.escapeHtml(fullName)}</h1>
          <p class="text-sm text-gray-600">${this.escapeHtml(cvData.profession || 'Meslek')}</p>
        </div>
        <div class="space-y-2">
          <p class="text-xs text-gray-600"><strong>Email:</strong> ${this.escapeHtml(cvData.email || 'email@example.com')}</p>
          <p class="text-xs text-gray-600"><strong>Telefon:</strong> ${this.escapeHtml(cvData.phone || '+90 555 123 45 67')}</p>
          <p class="text-xs text-gray-600"><strong>Konum:</strong> ${this.escapeHtml(cvData.location || 'İstanbul, TR')}</p>
        </div>
        ${cvData.summary ? `<div class="mt-4"><p class="text-xs text-gray-700">${this.escapeHtml(cvData.summary)}</p></div>` : ''}
      `;
      
      previewContainer.style.transform = 'none';
      previewContainer.style.width = '100%';
    }

    async startAnalysis() {
      if (!this.selectedCV) {
        this.showNotification('Lütfen bir CV seçin', 'warning');
        return;
      }

      const analyzeBtn = document.getElementById('analyze-btn');
      if (!analyzeBtn) return;

      // Bekleme ekranını göster
      this.showAnalysisLoadingScreen();

      try {
        console.log('🔍 CV analizi başlatılıyor...');

        // İlerleme simülasyonunu başlat
        const progressInterval = this.simulateProgress();

        // Analiz API çağrısı
        const response = await window.apiClient.analyzeCV(this.selectedCV);

        // İlerleme simülasyonunu durdur
        clearInterval(progressInterval);
        this.updateProgress(100);

        if (response.success && response.data) {
          this.currentAnalysis = response.data;
          
          // Kısa bir gecikme sonrası bekleme ekranını kapat ve sonuçları göster
          setTimeout(() => {
            this.hideAnalysisLoadingScreen();
            this.renderAnalysisResults(response.data);
            document.getElementById('analysis-results')?.classList.remove('hidden');
            this.showNotification('✅ Analiz tamamlandı!', 'success');
          }, 500);

        } else {
          throw new Error('Analiz başarısız');
        }

      } catch (error) {
        console.error('❌ Analiz hatası:', error);
        this.hideAnalysisLoadingScreen();
        this.showNotification('Analiz sırasında hata oluştu', 'error');
        this.showErrorState();

      } finally {
        if (analyzeBtn) {
          analyzeBtn.disabled = false;
        }
      }
    }

    showAnalysisLoadingScreen() {
      const overlay = document.getElementById('analysis-loading-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        // İlk adımı aktif yap
        this.updateStep(1, 'active');
        this.updateProgress(0);
      }
    }

    hideAnalysisLoadingScreen() {
      const overlay = document.getElementById('analysis-loading-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
        // Adımları sıfırla
        this.resetSteps();
      }
    }

    simulateProgress() {
      let currentProgress = 0;
      const targetProgress = 95; // %95'e kadar simüle et, gerçek analiz bitince %100 olacak
      const duration = 12000; // 12 saniye
      const interval = 50; // Her 50ms'de bir güncelle
      const increment = (targetProgress / duration) * interval;

      const progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
        }
        
        this.updateProgress(Math.floor(currentProgress));
        
        // Adımları güncelle
        if (currentProgress >= 0 && currentProgress < 30) {
          this.updateStep(1, 'active');
        } else if (currentProgress >= 30 && currentProgress < 70) {
          this.updateStep(1, 'completed');
          this.updateStep(2, 'active');
        } else if (currentProgress >= 70) {
          this.updateStep(1, 'completed');
          this.updateStep(2, 'completed');
          this.updateStep(3, 'active');
        }

      }, interval);

      return progressInterval;
    }

    updateProgress(percentage) {
      const progressCircle = document.getElementById('progress-circle');
      const progressText = document.getElementById('progress-percentage');
      
      if (progressCircle && progressText) {
        const circumference = 2 * Math.PI * 40; // r = 40
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${percentage}%`;
      }
    }

    updateStep(stepNumber, status) {
      const stepElement = document.getElementById(`step-${stepNumber}`);
      if (!stepElement) return;

      const icon = stepElement.querySelector('.material-symbols-outlined');
      const text = stepElement.querySelector('span:last-child');

      // Önceki durumu temizle
      stepElement.classList.remove('opacity-40', 'bg-white/50', 'bg-white', 'border-gray-100', 'border-primary/20');
      stepElement.classList.remove('dark:bg-surface-dark/50', 'dark:bg-surface-dark');

      if (status === 'active') {
        stepElement.classList.add('bg-white', 'dark:bg-surface-dark', 'border-primary/20', 'shadow-sm');
        stepElement.classList.remove('opacity-40');
        if (icon) {
          icon.textContent = 'progress_activity';
          icon.className = 'material-symbols-outlined text-primary text-xl animate-spin';
        }
        if (text) {
          text.classList.add('text-primary', 'font-bold');
          text.classList.remove('text-gray-500', 'font-medium');
        }
      } else if (status === 'completed') {
        stepElement.classList.add('bg-white/50', 'dark:bg-surface-dark/50', 'border-gray-100', 'dark:border-gray-800');
        stepElement.classList.remove('opacity-40');
        if (icon) {
          icon.textContent = 'check_circle';
          icon.className = 'material-symbols-outlined text-success text-xl';
        }
        if (text) {
          text.classList.add('text-gray-700', 'dark:text-gray-300', 'font-semibold');
          text.classList.remove('text-gray-500', 'font-medium', 'text-primary', 'font-bold');
        }
      } else {
        stepElement.classList.add('opacity-40');
        if (icon) {
          icon.textContent = 'radio_button_unchecked';
          icon.className = 'material-symbols-outlined text-gray-400 text-xl';
        }
        if (text) {
          text.classList.add('text-gray-500', 'font-medium');
          text.classList.remove('text-primary', 'font-bold', 'text-gray-700', 'dark:text-gray-300', 'font-semibold');
        }
      }
    }

    resetSteps() {
      for (let i = 1; i <= 3; i++) {
        this.updateStep(i, 'pending');
      }
    }

    renderAnalysisResults(data) {
      this.animateScore(data.score);

      // İyileşme badge
      const improvementBadge = document.getElementById('improvement-badge');
      const improvementText = document.getElementById('improvement-text');
      if (improvementBadge && improvementText && data.improvement > 0) {
        improvementBadge.textContent = 'trending_up';
        improvementText.textContent = `GEÇEN AYDAN %${data.improvement} DAHA İYİ`;
      } else {
        const badgeContainer = document.getElementById('improvement-badge-container');
        if (badgeContainer) badgeContainer.classList.add('hidden');
      }

      // Başlık ve açıklama
      const title = document.getElementById('score-title');
      const description = document.getElementById('score-description');
      
      if (title && description) {
        if (data.score >= 90) {
          title.textContent = 'Mükemmel CV!';
          description.textContent = 'Özgeçmişiniz tüm standartları karşılıyor ve ATS sistemlerinden kolayca geçecek.';
        } else if (data.score >= 75) {
          title.textContent = 'Harika Bir Temel!';
          description.textContent = 'Özgeçmişiniz çoğu ATS filtresinden başarıyla geçiyor. Bazı kritik dokunuşlarla daha iyi olabilir.';
        } else {
          title.textContent = 'Geliştirilmeli';
          description.textContent = 'Özgeçmişinizde kritik hatalar var. AI önerilerimizle hızlıca düzeltebilirsiniz.';
        }
      }

      this.renderIssues(data.criticalIssues, 'critical');
      this.renderIssues(data.improvements, 'improvement');
      this.renderStrengths(data.strengths);
    }

    renderIssues(issues, type) {
      const containerId = type === 'critical' ? 'critical-issues-container' : 'improvements-container';
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';

      if (issues.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-gray-500">
            <span class="material-symbols-outlined text-4xl mb-2">check_circle</span>
            <p>Bu kategoride sorun bulunamadı!</p>
          </div>
        `;
        return;
      }

      issues.forEach(issue => {
        const issueEl = document.createElement('div');
        issueEl.className = 'p-6 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors';
        issueEl.innerHTML = `
          <div class="flex items-start gap-4 flex-1">
            <span class="material-symbols-outlined ${type === 'critical' ? 'text-red-400' : 'text-amber-500'} mt-1">
              ${type === 'critical' ? 'warning' : 'info'}
            </span>
            <div>
              <h4 class="font-bold text-sm mb-1">${this.escapeHtml(issue.title)}</h4>
              <p class="text-xs text-gray-500">${this.escapeHtml(issue.description)}</p>
            </div>
          </div>
          <button 
            class="fix-issue-btn flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all border border-primary/20"
            data-issue-id="${issue.id}"
            data-current-text="${this.escapeHtml(issue.currentText || issue.description)}"
            data-context="${this.escapeHtml(issue.description)}"
          >
            <span class="material-symbols-outlined text-sm">magic_button</span>
            AI ile Düzelt
          </button>
        `;
        container.appendChild(issueEl);
      });
    }

    renderStrengths(strengths) {
      const container = document.getElementById('strengths-container');
      if (!container) return;

      // Count element'i güncelle
      const countEl = document.getElementById('strengths-count');
      if (countEl) {
        countEl.textContent = `Mükemmel seviyedeki ${strengths.length} alan`;
      }

      container.innerHTML = '';

      if (strengths.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">Güçlü yön bulunamadı</p>';
        return;
      }

      strengths.forEach(strength => {
        const strengthEl = document.createElement('div');
        strengthEl.className = 'flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800';
        strengthEl.innerHTML = `
          <span class="material-symbols-outlined text-emerald-500">check_circle</span>
          <span class="text-sm font-medium">${this.escapeHtml(strength)}</span>
        `;
        container.appendChild(strengthEl);
      });
    }

    async fixSingleIssue(issueId, currentText, context, button) {
      // Butonu geçici olarak devre dışı bırak (modal açılırken)
      const originalHTML = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Hazırlanıyor...';

      try {
        console.log('🔧 AI düzeltme önerisi alınıyor:', issueId);

        // API çağrısı yap - sadece öneriyi al
        const response = await window.apiClient.fixIssue(issueId, currentText, context, this.selectedCV);

        if (response.success && response.data) {
          // Modal'ı göster - kullanıcı onaylayana kadar hiçbir şey yapma
          this.showFixModal(response.data.originalText, response.data.fixedText, issueId, context);
        } else {
          throw new Error('Düzeltme önerisi alınamadı');
        }

      } catch (error) {
        console.error('❌ Düzeltme hatası:', error);
        this.showNotification('Düzeltme önerisi alınamadı. Lütfen tekrar deneyin.', 'error');

      } finally {
        // Butonu tekrar aktif et
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    }

    async fixAllIssues() {
      if (!this.currentAnalysis) {
        this.showNotification('Önce analiz yapmalısınız', 'warning');
        return;
      }

      const allIssues = [
        ...this.currentAnalysis.criticalIssues,
        ...this.currentAnalysis.improvements,
      ];

      if (allIssues.length === 0) {
        this.showNotification('Düzeltilecek hata bulunamadı', 'info');
        return;
      }

      // Direkt bekleme ekranını göster (confirm dialog yok)
      this.showAIImprovementLoadingScreen();
      this.updateAIImprovementProgress(0);
      this.updateAIStep(1, 'pending');
      this.updateAIStep(2, 'pending');
      this.updateAIStep(3, 'pending');

      let progressInterval = null;

      try {
        // API çağrısını başlat (asenkron)
        const apiCallPromise = window.apiClient.fixAllIssues(allIssues, this.selectedCV);
        
        // İlerleme simülasyonunu başlat (API çağrısı ile paralel)
        progressInterval = this.simulateAIImprovementProgress(allIssues.length);

        // API çağrısını bekle
        const response = await apiCallPromise;

        // İlerleme simülasyonunu durdur
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (response.success && response.data) {
          // Gerçek düzeltmeleri sırayla uygula
          const fixes = response.data.fixes || [];
          
          if (fixes.length === 0) {
            throw new Error('Düzeltme verisi bulunamadı');
          }

          // CV verilerini başlangıçta bir kez al
          let cvResponse = await window.apiClient.getResume(this.selectedCV.id);
          if (!cvResponse.success) {
            throw new Error('CV verileri alınamadı');
          }
          
          let resumeData = cvResponse.data.resume || cvResponse.data;
          
          // Her fix için ilerleme güncelle ve uygula
          // İlerleme: %30 (API tamamlandı) -> %90 (fix'ler) -> %100 (kayıt)
          const startProgress = 30;
          const endProgress = 90;
          const progressRange = endProgress - startProgress;
          
          for (let i = 0; i < fixes.length; i++) {
            const fix = fixes[i];
            const progress = Math.floor(startProgress + ((i + 1) / fixes.length) * progressRange);
            this.updateAIImprovementProgress(progress);
            
            // Adımları güncelle
            if (i < fixes.length / 3) {
              this.updateAIStep(1, 'active');
            } else if (i < (fixes.length * 2) / 3) {
              this.updateAIStep(1, 'completed');
              this.updateAIStep(2, 'active');
            } else {
              this.updateAIStep(1, 'completed');
              this.updateAIStep(2, 'completed');
              this.updateAIStep(3, 'active');
            }
            
            // Fix'i CV verisine uygula
            const issue = {
              id: fix.issueId || fix.id,
              title: fix.title || '',
              description: fix.description || '',
              context: fix.context || '',
              currentText: fix.originalText || fix.currentText || ''
            };
            
            const fixedText = fix.fixedText || fix.suggestion || fix.text || '';
            if (fixedText) {
              resumeData = this.updateCVSection(resumeData, issue, fixedText);
            }
            
            // Kısa bir gecikme (animasyon için)
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // %95'e ulaştır (kayıt başlıyor)
          this.updateAIImprovementProgress(95);
          this.updateAIStep(1, 'completed');
          this.updateAIStep(2, 'completed');
          this.updateAIStep(3, 'active');

          // CV'yi backend'e kaydet
          const updateResponse = await window.apiClient.updateResume(this.selectedCV.id, resumeData);
          
          if (!updateResponse.success) {
            throw new Error('CV güncellenemedi');
          }

          // Güncellenmiş CV'yi tekrar yükle
          cvResponse = await window.apiClient.getResume(this.selectedCV.id);
          if (cvResponse.success) {
            this.selectedCV = cvResponse.data.resume || cvResponse.data;
          }

          // %100'e ulaştır
          this.updateAIImprovementProgress(100);
          this.updateAIStep(1, 'completed');
          this.updateAIStep(2, 'completed');
          this.updateAIStep(3, 'completed');

          // Kısa bir gecikme sonrası ekranı kapat
          setTimeout(() => {
            this.hideAIImprovementLoadingScreen();
            this.showNotification('✅ Tüm düzeltmeler tamamlandı!', 'success');
            
            // Önizlemeyi yeniden render et
            if (this.selectedCV) {
              this.renderCVPreview(this.selectedCV);
            }
            
            // Puanı güncelle (tüm hatalar düzeltildi, maksimum puan artışı)
            const estimatedScoreIncrease = allIssues.length * 2;
            const newScore = Math.min(this.currentAnalysis.score + estimatedScoreIncrease, 100);
            this.animateScore(newScore);
            this.currentAnalysis.score = newScore;
            
            // Tüm hataları listeden kaldır
            this.currentAnalysis.criticalIssues = [];
            this.currentAnalysis.improvements = [];
            this.renderIssues([], 'critical');
            this.renderIssues([], 'improvement');
          }, 1000);

        } else {
          throw new Error('Toplu düzeltme başarısız');
        }

      } catch (error) {
        console.error('❌ Toplu düzeltme hatası:', error);
        
        // İlerleme simülasyonunu durdur
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        this.hideAIImprovementLoadingScreen();
        this.showNotification('Toplu düzeltme başarısız oldu', 'error');
      }
    }


    showAIImprovementLoadingScreen() {
      const overlay = document.getElementById('ai-improvement-loading-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        // İlerlemeyi 0'dan başlat
        this.updateAIImprovementProgress(0);
        // İlk adımı aktif yap
        this.updateAIStep(1, 'pending');
        this.updateAIStep(2, 'pending');
        this.updateAIStep(3, 'pending');
      }
    }

    hideAIImprovementLoadingScreen() {
      const overlay = document.getElementById('ai-improvement-loading-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }

    simulateAIImprovementProgress(totalIssues) {
      let currentProgress = 0;
      const targetProgress = 30; // %30'a kadar simüle et (API çağrısı sırasında), gerçek işlemler %100'e tamamlayacak
      const duration = 8000; // 8 saniye (API çağrısı için)
      const interval = 50;
      const increment = (targetProgress / duration) * interval;

      const progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          // %30'da durdur, gerçek işlemler devam edecek
        }
        
        this.updateAIImprovementProgress(Math.floor(currentProgress));
        
        // Adımları güncelle (sadece simülasyon için, gerçek işlemler override edecek)
        if (currentProgress >= 0 && currentProgress < 10) {
          this.updateAIStep(1, 'active');
        } else if (currentProgress >= 10 && currentProgress < 20) {
          this.updateAIStep(1, 'completed');
          this.updateAIStep(2, 'active');
        } else if (currentProgress >= 20) {
          this.updateAIStep(1, 'completed');
          this.updateAIStep(2, 'completed');
          this.updateAIStep(3, 'active');
        }

      }, interval);

      return progressInterval;
    }

    updateAIImprovementProgress(percentage) {
      const progressText = document.getElementById('ai-improvement-progress');
      if (progressText) {
        progressText.innerHTML = `${percentage}<span class="text-3xl">%</span>`;
      }
    }

    updateAIStep(stepNumber, status) {
      const stepElement = document.getElementById(`ai-step-${stepNumber}`);
      if (!stepElement) return;

      const icon = stepElement.querySelector('.material-symbols-outlined, div');
      const text = stepElement.querySelector('span:last-child');

      stepElement.classList.remove('opacity-60', 'text-gray-400', 'text-gray-500', 'text-primary', 'font-bold', 'font-medium');
      stepElement.classList.remove('dark:text-gray-600', 'dark:text-gray-400');

      if (status === 'active') {
        stepElement.classList.add('text-primary', 'font-bold');
        stepElement.classList.remove('opacity-60');
        if (icon && icon.tagName === 'DIV') {
          icon.className = 'w-2 h-2 rounded-full bg-primary animate-pulse';
        }
        if (text) {
          text.classList.add('text-primary', 'font-bold');
        }
      } else if (status === 'completed') {
        stepElement.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
        stepElement.classList.remove('opacity-60');
        if (icon) {
          if (icon.tagName === 'SPAN') {
            icon.textContent = 'check_circle';
            icon.className = 'material-symbols-outlined text-success text-xl';
          } else {
            icon.className = 'w-2 h-2 rounded-full bg-success';
          }
        }
        if (text) {
          text.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
          text.classList.remove('text-primary', 'font-bold');
        }
      } else {
        stepElement.classList.add('opacity-60', 'text-gray-400', 'dark:text-gray-600', 'font-medium');
        if (icon) {
          if (icon.tagName === 'SPAN') {
            icon.textContent = 'radio_button_unchecked';
            icon.className = 'material-symbols-outlined text-gray-400 text-xl';
          } else {
            icon.className = 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700';
          }
        }
        if (text) {
          text.classList.add('text-gray-400', 'dark:text-gray-600', 'font-medium');
          text.classList.remove('text-primary', 'font-bold');
        }
      }
    }

    async applyAllFixes(fixes) {
      // Bu fonksiyon artık kullanılmıyor, her fix ayrı ayrı applySingleFixToCV ile uygulanıyor
      // Ama geriye dönük uyumluluk için bırakıyoruz
      if (!this.selectedCV) return;

      // CV verilerini al
      const response = await window.apiClient.getResume(this.selectedCV.id);
      if (!response.success) return;

      const resumeData = response.data.resume || response.data;

      // Tüm düzeltmeleri uygula
      for (const fix of fixes) {
        const issue = {
          id: fix.issueId || fix.id,
          title: fix.title || '',
          description: fix.description || '',
          context: fix.context || '',
          currentText: fix.originalText || fix.currentText || ''
        };
        this.updateCVSection(resumeData, issue, fix.fixedText || fix.suggestion || '');
      }

      // Backend'e kaydet
      await window.apiClient.updateResume(this.selectedCV.id, resumeData);
    }

    showFixModal(originalText, fixedText, issueId, context) {
      // Eğer zaten bir modal açıksa kapat
      const existingModal = document.querySelector('.fix-modal-overlay');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = document.createElement('div');
      modal.className = 'fix-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">magic_button</span>
              AI Düzeltme Önizleme
            </h3>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" data-action="close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2 text-red-600 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">close</span>
                Eski Metin:
              </label>
              <div class="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <p class="text-sm whitespace-pre-wrap">${this.escapeHtml(originalText)}</p>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-2 text-green-600 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">check</span>
                Yeni Metin (Düzenlenebilir):
              </label>
              <textarea id="fixed-text-editor" class="w-full p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 text-sm whitespace-pre-wrap min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="AI önerisini buradan düzenleyebilirsiniz...">${this.escapeHtml(fixedText)}</textarea>
            </div>
          </div>
          
          <div class="flex gap-4 mt-6">
            <button class="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed" data-action="apply" data-issue-id="${issueId}">
              <span class="apply-button-text">Onayla ve CV'ye Uygula</span>
            </button>
            <button class="flex-1 border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all" data-action="cancel">
              İptal
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Onayla butonu
      const applyButton = modal.querySelector('[data-action="apply"]');
      const fixedTextEditor = modal.querySelector('#fixed-text-editor');
      
      applyButton.addEventListener('click', async () => {
        const buttonText = applyButton.querySelector('.apply-button-text');
        const originalButtonText = buttonText.textContent;
        
        // Düzenlenmiş metni al
        const editedFixedText = fixedTextEditor ? fixedTextEditor.value.trim() : fixedText;
        
        if (!editedFixedText) {
          this.showNotification('Lütfen düzeltilmiş metni girin', 'warning');
          return;
        }
        
        // Butonu devre dışı bırak ve loading göster
        applyButton.disabled = true;
        buttonText.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm inline-block mr-2">progress_activity</span> Uygulanıyor...';

        try {
          // Düzeltmeyi uygula (düzenlenmiş metinle)
          await this.applyFix(issueId, editedFixedText, context);
          
          // Modal'ı kapat
          modal.remove();
          
          // Başarı bildirimi
          this.showNotification('✅ Düzeltme CV\'ye uygulandı!', 'success');
          
        } catch (error) {
          console.error('❌ Uygulama hatası:', error);
          this.showNotification('Düzeltme uygulanamadı', 'error');
          
          // Butonu tekrar aktif et
          applyButton.disabled = false;
          buttonText.textContent = originalButtonText;
        }
      });

      // İptal butonu
      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.remove();
      });

      // Kapat butonu
      modal.querySelector('[data-action="close"]').addEventListener('click', () => {
        modal.remove();
      });

      // Dışarı tıklanınca kapat
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    showBulkFixModal(fixes) {
      this.showNotification(`${fixes.length} adet düzeltme tamamlandı! CV'nizi kontrol edin.`, 'success');
    }

    async applyFix(issueId, fixedText, context) {
      try {
        if (!this.selectedCV || !this.currentAnalysis) {
          this.showNotification('CV verisi bulunamadı', 'error');
          return;
        }

        // İlgili hatayı bul
        const issue = [...this.currentAnalysis.criticalIssues, ...this.currentAnalysis.improvements]
          .find(i => i.id === issueId);

        if (!issue) {
          this.showNotification('Hata bulunamadı', 'error');
          return;
        }

        // CV verilerini güncelle
        const response = await window.apiClient.getResume(this.selectedCV.id);
        if (!response.success) {
          throw new Error('CV verileri alınamadı');
        }

        const resumeData = response.data.resume || response.data;
        
        // Hatanın hangi bölümde olduğunu tespit et ve güncelle
        const updatedData = this.updateCVSection(resumeData, issue, fixedText);
        
        // Backend'e kaydet
        const updateResponse = await window.apiClient.updateResume(this.selectedCV.id, updatedData);
        
        if (!updateResponse.success) {
          throw new Error('CV güncellenemedi');
        }

        console.log('✅ CV backend\'e kaydedildi, önizleme güncelleniyor...');

        // Güncellenmiş CV'yi tekrar yükle ve önizlemeyi güncelle
        const refreshedResponse = await window.apiClient.getResume(this.selectedCV.id);
        if (refreshedResponse.success) {
          // CV objesini güncelle
          this.selectedCV = refreshedResponse.data.resume || refreshedResponse.data;
          
          // Önizlemeyi güncelle (parlama efekti ile)
          await this.updatePreviewWithGlow(issue, fixedText);
        } else {
          // Fallback: Sadece önizlemeyi güncelle
          await this.updatePreviewWithGlow(issue, fixedText);
        }

        // Puanı güncelle (tahmini artış: kritik hata için +3, geliştirme için +1)
        const scoreIncrease = issue.severity === 'critical' ? 3 : 1;
        const newScore = Math.min(this.currentAnalysis.score + scoreIncrease, 100);
        this.animateScore(newScore);
        this.currentAnalysis.score = newScore;

        // Hatayı listeden kaldır
        this.removeIssueFromList(issueId);

      } catch (error) {
        console.error('❌ Uygulama hatası:', error);
        this.showNotification('Düzeltme uygulanamadı', 'error');
      }
    }

    updateCVSection(resumeData, issue, fixedText) {
      // Context'e göre hangi bölümü güncellememiz gerektiğini belirle
      const context = (issue.context || issue.description || '').toLowerCase();
      const title = (issue.title || '').toLowerCase();
      
      // Markdown formatını temizle (eğer varsa)
      let cleanText = fixedText.replace(/^#+\s*[^\n]+\n*/gm, '').trim();
      
      // Deneyim bölümü
      if (context.includes('deneyim') || context.includes('experience') || title.includes('deneyim') || title.includes('experience')) {
        const experiences = Array.isArray(resumeData.experience) ? resumeData.experience : [];
        
        // İlgili deneyimi bul ve güncelle
        const currentText = (issue.currentText || '').toLowerCase();
        let found = false;
        
        for (let exp of experiences) {
          const expDescription = (exp.description || '').toLowerCase();
          
          // Eğer mevcut metin deneyim açıklamasında varsa
          if (expDescription.includes(currentText) || currentText.includes(expDescription.substring(0, 50))) {
            // ESKİ METNİ TAMAMEN DEĞİŞTİR (ekleme yapma)
            // Eğer fixedText birden fazla satır içeriyorsa (bullet points), bunları birleştir
            if (cleanText.includes('\n') || cleanText.includes('•') || cleanText.includes('-')) {
              exp.description = cleanText.split('\n').map(line => line.trim()).filter(line => line).join('\n');
            } else {
              exp.description = cleanText;
            }
            found = true;
            break;
          }
        }
        
        // Eğer bulunamadıysa, ilk deneyimi güncelle (ekleme yapma, değiştir)
        if (!found && experiences.length > 0) {
          // İlk deneyimin açıklamasını tamamen değiştir
          if (cleanText.includes('\n') || cleanText.includes('•') || cleanText.includes('-')) {
            experiences[0].description = cleanText.split('\n').map(line => line.trim()).filter(line => line).join('\n');
          } else {
            experiences[0].description = cleanText;
          }
        }
        
        resumeData.experience = experiences;
      }
      // Eğitim bölümü
      else if (context.includes('eğitim') || context.includes('education') || title.includes('eğitim') || title.includes('education') || title.includes('gpa') || title.includes('not')) {
        const education = Array.isArray(resumeData.education) ? resumeData.education : [];
        
        // Eğitim bilgilerini parse et (markdown formatından)
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
        
        // İlgili eğitimi bul (currentText'e göre)
        const currentText = (issue.currentText || '').toLowerCase();
        let foundEducation = false;
        
        for (let edu of education) {
          const eduDetails = (edu.details || '').toLowerCase();
          const eduSchool = (edu.school || '').toLowerCase();
          const eduDegree = (edu.degree || '').toLowerCase();
          
          // Eğer mevcut metin bu eğitim kaydında varsa
          if (eduDetails.includes(currentText) || eduSchool.includes(currentText) || eduDegree.includes(currentText) || currentText.includes(eduSchool) || currentText.includes(eduDegree)) {
            foundEducation = true;
            
            // GPA bilgisini çıkar ve güncelle
            const gpaMatch = cleanText.match(/GPA[:\s]*([\d.]+)\s*\/?\s*([\d.]+)?/i);
            if (gpaMatch) {
              edu.gpa = gpaMatch[1];
              if (gpaMatch[2]) {
                edu.gpaScale = gpaMatch[2];
              }
            }
            
            // İlgili dersleri çıkar ve güncelle
            const coursesMatch = cleanText.match(/İlgili Dersler?[:\s]*(.+)/i) || cleanText.match(/Relevant Courses?[:\s]*(.+)/i);
            if (coursesMatch) {
              const courses = coursesMatch[1].split(',').map(c => c.trim()).filter(c => c);
              edu.courses = courses;
            }
            
            // Details/description'ı TAMAMEN DEĞİŞTİR (ekleme yapma)
            if (cleanText && !cleanText.includes('GPA') && !cleanText.includes('İlgili Dersler')) {
              // Sadece metin varsa, direkt değiştir
              edu.details = cleanText;
            } else {
              // GPA ve/veya dersler varsa, bunları formatla ve ESKİ DETAILS'İ KALDIR
              let details = [];
              if (edu.gpa) {
                details.push(`GPA: ${edu.gpa}${edu.gpaScale ? '/' + edu.gpaScale : ''}`);
              }
              if (edu.courses && edu.courses.length > 0) {
                details.push(`İlgili Dersler: ${edu.courses.join(', ')}`);
              }
              // ESKİ DETAILS'İ KALDIR, YENİSİNİ KOY
              edu.details = details.length > 0 ? details.join('\n') : '';
            }
            break;
          }
        }
        
        // Eğer eğitim bulunamadıysa, ilk eğitimi güncelle
        if (!foundEducation && education.length > 0) {
          const edu = education[0];
          
          // GPA bilgisini çıkar
          const gpaMatch = cleanText.match(/GPA[:\s]*([\d.]+)\s*\/?\s*([\d.]+)?/i);
          if (gpaMatch) {
            edu.gpa = gpaMatch[1];
            if (gpaMatch[2]) {
              edu.gpaScale = gpaMatch[2];
            }
          }
          
          // İlgili dersleri çıkar
          const coursesMatch = cleanText.match(/İlgili Dersler?[:\s]*(.+)/i) || cleanText.match(/Relevant Courses?[:\s]*(.+)/i);
          if (coursesMatch) {
            const courses = coursesMatch[1].split(',').map(c => c.trim()).filter(c => c);
            edu.courses = courses;
          }
          
          // Details'i TAMAMEN DEĞİŞTİR
          if (cleanText && !cleanText.includes('GPA') && !cleanText.includes('İlgili Dersler')) {
            edu.details = cleanText;
          } else {
            let details = [];
            if (edu.gpa) {
              details.push(`GPA: ${edu.gpa}${edu.gpaScale ? '/' + edu.gpaScale : ''}`);
            }
            if (edu.courses && edu.courses.length > 0) {
              details.push(`İlgili Dersler: ${edu.courses.join(', ')}`);
            }
            edu.details = details.length > 0 ? details.join('\n') : '';
          }
        }
        
        resumeData.education = education;
      }
      // Özet bölümü
      else if (context.includes('özet') || context.includes('summary') || title.includes('özet') || title.includes('summary')) {
        resumeData.summary = cleanText;
      }
      // Yetenekler bölümü
      else if (context.includes('yetenek') || context.includes('skill') || title.includes('yetenek') || title.includes('skill')) {
        // Yetenekler için özel işlem
        // Eğer fixedText virgülle ayrılmış liste ise, TAMAMEN DEĞİŞTİR
        if (cleanText.includes(',')) {
          const newSkills = cleanText.split(',').map(s => s.trim()).filter(s => s);
          // ESKİ YETENEKLERİ KALDIR, YENİLERİNİ KOY
          resumeData.skills = newSkills;
        } else {
          // Tek bir yetenek ise, mevcut yetenekleri koru ama bu yeteneği ekle (eğer yoksa)
          const skills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
          if (cleanText && !skills.includes(cleanText)) {
            skills.push(cleanText);
          }
          resumeData.skills = skills;
        }
      }
      // Proje bölümü (eğer varsa)
      else if (context.includes('proje') || context.includes('project') || title.includes('proje') || title.includes('project')) {
        // Proje bölümü için özel işlem gerekebilir
        // Şimdilik summary'ye ekleyebiliriz veya ayrı bir proje alanı oluşturabiliriz
        if (!resumeData.projects) {
          resumeData.projects = [];
        }
        resumeData.projects.push({
          title: 'Proje',
          description: cleanText
        });
      }

      return resumeData;
    }

    async updatePreviewWithGlow(issue, fixedText) {
      const previewContainer = document.getElementById('cv-preview-content');
      if (!previewContainer || !this.selectedCV) {
        console.error('Önizleme container veya CV bulunamadı');
        return;
      }

      console.log('🔄 Önizleme güncelleniyor...');

      // Önizlemeyi yeniden render et (güncel verilerle)
      try {
        await this.renderCVPreview(this.selectedCV);
        console.log('✅ Önizleme render edildi');
      } catch (error) {
        console.error('❌ Önizleme render hatası:', error);
      }

      // Parlama efekti için container'ı vurgula
      if (previewContainer) {
        previewContainer.style.transition = 'all 0.5s ease';
        previewContainer.style.boxShadow = '0 0 30px rgba(19, 55, 236, 0.6)';
        previewContainer.style.transform = 'scale(1.01)';

        // Efekti kaldır
        setTimeout(() => {
          if (previewContainer) {
            previewContainer.style.boxShadow = '';
            previewContainer.style.transform = '';
          }
        }, 1500);
      }
    }

    removeIssueFromList(issueId) {
      // Kritik hatalardan kaldır
      this.currentAnalysis.criticalIssues = this.currentAnalysis.criticalIssues.filter(i => i.id !== issueId);
      // Geliştirmelerden kaldır
      this.currentAnalysis.improvements = this.currentAnalysis.improvements.filter(i => i.id !== issueId);
      
      // UI'ı güncelle
      this.renderIssues(this.currentAnalysis.criticalIssues, 'critical');
      this.renderIssues(this.currentAnalysis.improvements, 'improvement');
    }

    animateScore(targetScore) {
      const scoreEl = document.getElementById('cv-score');
      if (!scoreEl) return;

      let currentScore = 0;
      const duration = 2000;
      const increment = targetScore / (duration / 16);

      const animate = () => {
        currentScore += increment;
        if (currentScore >= targetScore) {
          scoreEl.textContent = targetScore;
          return;
        }
        scoreEl.textContent = Math.floor(currentScore);
        requestAnimationFrame(animate);
      };

      animate();

      const progressCircle = document.querySelector('.circular-progress');
      if (progressCircle) {
        const degrees = (targetScore / 100) * 360;
        progressCircle.style.background = `conic-gradient(var(--primary-color) ${degrees}deg, #e5e7eb 0deg)`;
      }
    }

    showLoadingState() {
      const scoreEl = document.getElementById('cv-score');
      const titleEl = document.getElementById('score-title');
      const descEl = document.getElementById('score-description');
      
      if (scoreEl) scoreEl.textContent = '--';
      if (titleEl) titleEl.textContent = 'Analiz ediliyor...';
      if (descEl) descEl.textContent = 'CV\'niz AI tarafından inceleniyor. Bu 10-15 saniye sürebilir.';
      
      const resultsEl = document.getElementById('analysis-results');
      if (resultsEl) resultsEl.classList.remove('hidden');
    }

    showErrorState() {
      const scoreEl = document.getElementById('cv-score');
      const titleEl = document.getElementById('score-title');
      const descEl = document.getElementById('score-description');
      
      if (scoreEl) scoreEl.textContent = '!';
      if (titleEl) titleEl.textContent = 'Analiz Başarısız';
      if (descEl) descEl.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }

    showNoCVsMessage() {
      const resumeSelect = document.getElementById('resume-select');
      if (!resumeSelect) return;

      resumeSelect.innerHTML = '<option value="" disabled>Henüz CV oluşturmamışsınız</option>';
    }

    showError(message) {
      this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
      } text-white font-bold`;
      
      const icon = type === 'success' ? 'check_circle' :
                   type === 'error' ? 'error' :
                   type === 'warning' ? 'warning' : 'info';
      
      notification.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span>${this.escapeHtml(message)}</span>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }

    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    formatDate(dateString) {
      if (!dateString) return 'Tarih belirtilmemiş';
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    async downloadReport() {
      if (!this.currentAnalysis) {
        this.showNotification('Önce analiz yapmalısınız', 'warning');
        return;
      }

      if (!this.selectedCV) {
        this.showNotification('CV bulunamadı', 'error');
        return;
      }

      try {
        // PDF indirme butonunu devre dışı bırak
        const downloadBtn = document.getElementById('download-pdf-btn');
        if (downloadBtn) {
          downloadBtn.disabled = true;
          const originalText = downloadBtn.innerHTML;
          downloadBtn.innerHTML = '<span class="material-symbols-outlined text-sm mr-2 animate-spin">sync</span> İndiriliyor...';
          
          try {
            // Backend'den PDF indir
            await window.apiClient.downloadPDF(this.selectedCV.id);
            
            // Başarılı
            this.showNotification('PDF başarıyla indirildi', 'success');
          } catch (error) {
            console.error('PDF indirme hatası:', error);
            
            // Eğer token hatası varsa, kullanıcıyı bilgilendir
            if (error.message && (error.message.includes('token') || error.message.includes('401') || error.message.includes('unauthorized'))) {
              this.showNotification('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
              // Token'ı temizle ve giriş sayfasına yönlendir
              setTimeout(() => {
                if (window.apiClient) {
                  window.apiClient.clearTokens();
                }
                window.location.href = 'giris.html';
              }, 2000);
            } else {
              // Diğer hatalar için fallback: print dialog
              this.showNotification('PDF indirilemedi, yazdırma ekranı açılıyor...', 'warning');
              setTimeout(() => {
                window.print();
              }, 1000);
            }
          } finally {
            // Butonu tekrar aktif et
            if (downloadBtn) {
              downloadBtn.disabled = false;
              downloadBtn.innerHTML = 'Raporu İndir (PDF)';
            }
          }
        }
      } catch (error) {
        console.error('PDF indirme hatası:', error);
        this.showNotification('PDF indirilemedi', 'error');
      }
    }

    zoomPreview() {
      const previewContainer = document.getElementById('cv-preview-content');
      if (!previewContainer) return;

      // Mevcut scale değerini al (varsayılan: 0.5)
      const currentTransform = previewContainer.style.transform || 'scale(0.5)';
      const match = currentTransform.match(/scale\(([\d.]+)\)/);
      const currentScale = match ? parseFloat(match[1]) : 0.5;

      // %5 artır (maksimum %200 = 2.0)
      const newScale = Math.min(currentScale + 0.05, 2.0);
      previewContainer.style.transform = `scale(${newScale})`;

      console.log(`🔍 Önizleme yakınlaştırıldı: ${(newScale * 100).toFixed(0)}%`);
    }

    async downloadPreviewPDF() {
      if (!this.selectedCV) {
        this.showNotification('Lütfen bir CV seçin', 'warning');
        return;
      }

      try {
        // PDF indirme endpoint'ini çağır
        const token = localStorage.getItem('token');
        if (!token) {
          this.showNotification('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
          return;
        }

        const pdfUrl = `${window.apiClient.baseURL}/resumes/${this.selectedCV.id}/pdf`;
        
        // Authorization header eklemek için fetch kullan
        const pdfResponse = await fetch(pdfUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!pdfResponse.ok) {
          throw new Error('PDF oluşturulamadı');
        }

        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.selectedCV.title || 'ozgecmis'}.pdf`;
        link.click();
        
        window.URL.revokeObjectURL(url);

        this.showNotification('✅ PDF indiriliyor...', 'success');

      } catch (error) {
        console.error('❌ PDF indirme hatası:', error);
        this.showNotification('PDF indirilemedi. Lütfen tekrar deneyin.', 'error');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new CVAnalysisManager();
    });
  } else {
    new CVAnalysisManager();
  }
})();

