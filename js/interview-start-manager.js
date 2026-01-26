/**
 * Interview Start Manager - Mülakat başlangıç ekranı yönetimi
 * CV seçimi, pozisyon seçimi ve mülakat başlatma işlemlerini yönetir
 */
(function() {
  'use strict';

  class InterviewStartManager {
    constructor() {
      this.userCVs = [];
      this.currentSessionId = null;
      this.init();
    }

    async init() {
      // URL'de sessionId varsa direkt soru ekranına geç
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      
      if (sessionId) {
        this.currentSessionId = sessionId;
        // Interview manager'a session ID'yi ilet ve soru ekranını göster
        if (window.interviewManager) {
          window.interviewManager.currentSession = { id: sessionId };
          this.showInterviewScreen();
          await window.interviewManager.getNextQuestion();
        }
        return;
      }

      // CV'leri yükle
      await this.loadUserCVs();
      
      // Event listener'ları kur
      this.setupEventListeners();
      
      // Validasyon kontrolü
      this.checkValidation();
    }

    setupEventListeners() {
      const cvSelect = document.getElementById('cv-select');
      const startButton = document.getElementById('start-button');
      const positionSelect = document.getElementById('position');

      if (cvSelect) {
        cvSelect.addEventListener('change', () => {
          this.checkValidation();
        });
      }

      if (startButton) {
        startButton.addEventListener('click', () => {
          this.startInterview();
        });
      }

      if (positionSelect) {
        positionSelect.addEventListener('change', () => {
          this.checkValidation();
        });
      }
    }

    async loadUserCVs() {
      try {
        console.log('📂 Kullanıcı CV\'leri yükleniyor...');
        
        if (!window.apiClient) {
          console.error('API client bulunamadı');
          setTimeout(() => this.loadUserCVs(), 500);
          return;
        }

        const response = await window.apiClient.getResumes(true);
        
        if (response.success && response.data && response.data.resumes && Array.isArray(response.data.resumes)) {
          this.userCVs = response.data.resumes;
          this.renderCVSelect();
          console.log('✅ CV\'ler yüklendi:', this.userCVs.length, 'adet');
        } else {
          console.warn('CV bulunamadı');
          this.showNoCVsMessage();
        }

      } catch (error) {
        console.error('❌ CV yükleme hatası:', error);
        this.showError('CV\'leriniz yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    }

    renderCVSelect() {
      const cvSelect = document.getElementById('cv-select');
      if (!cvSelect) return;

      // Mevcut seçimi sakla
      const currentValue = cvSelect.value;

      // Dropdown'u temizle (ilk option hariç)
      while (cvSelect.options.length > 1) {
        cvSelect.remove(1);
      }

      // CV'leri ekle
      this.userCVs.forEach(cv => {
        const option = document.createElement('option');
        option.value = cv.id;
        
        // CV başlığını oluştur
        let title = cv.title || 'İsimsiz Özgeçmiş';
        if (cv.firstName || cv.lastName) {
          const name = `${cv.firstName || ''} ${cv.lastName || ''}`.trim();
          if (name) {
            title = `${name} - ${title}`;
          }
        }
        
        // Güncel olanı işaretle
        if (cv.updatedAt) {
          const updatedDate = new Date(cv.updatedAt);
          const daysAgo = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo <= 7) {
            title += ' (Güncel)';
          }
        }
        
        option.textContent = title;
        cvSelect.appendChild(option);
      });

      // Önceki seçimi geri yükle
      if (currentValue) {
        cvSelect.value = currentValue;
      }

      this.checkValidation();
    }

    checkValidation() {
      const cvSelect = document.getElementById('cv-select');
      const startButton = document.getElementById('start-button');
      const warningText = document.getElementById('warning-text');

      if (!cvSelect || !startButton || !warningText) return;

      if (cvSelect.value && cvSelect.value !== '') {
        startButton.disabled = false;
        warningText.classList.add('invisible');
      } else {
        startButton.disabled = true;
        warningText.classList.remove('invisible');
      }
    }

    async startInterview() {
      try {
        const cvSelect = document.getElementById('cv-select');
        const positionSelect = document.getElementById('position');
        const startButton = document.getElementById('start-button');

        if (!cvSelect || !cvSelect.value || cvSelect.value === '') {
          this.showError('Lütfen bir özgeçmiş seçin');
          return;
        }

        const resumeId = cvSelect.value;
        const targetPosition = positionSelect ? positionSelect.value : 'Senior Frontend Developer';
        const mode = 'BEHAVIORAL'; // Davranışsal mod

        // Butonu devre dışı bırak ve loading göster
        startButton.disabled = true;
        startButton.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Başlatılıyor...';

        console.log('🚀 Mülakat başlatılıyor...', { mode, targetPosition, resumeId });

        // API çağrısı
        const response = await window.apiClient.startInterview(
          mode,
          targetPosition,
          resumeId,
          10 // Toplam soru sayısı
        );

        if (response.success && response.data) {
          this.currentSessionId = response.data.session.id;
          
          // Session ID'yi interview manager'a ilet
          if (window.interviewManager) {
            window.interviewManager.currentSession = response.data.session;
            window.interviewManager.currentQuestion = response.data.question;
            window.interviewManager.currentMode = mode;
            window.interviewManager.startTime = new Date();
          }

          // Soru ekranını göster
          this.showInterviewScreen();
          
          // İlk soruyu göster
          if (response.data.question && window.interviewManager) {
            window.interviewManager.renderQuestion(
              response.data.question,
              1,
              response.data.session.totalQuestions || 10
            );
          }

          // Timer'ı başlat
          if (window.interviewManager) {
            window.interviewManager.startTimer();
          }

          // URL'i güncelle (sessionId ekle)
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('sessionId', this.currentSessionId);
          window.history.replaceState({}, '', newUrl);

        } else {
          throw new Error(response.error || 'Mülakat başlatılamadı');
        }

      } catch (error) {
        console.error('❌ Mülakat başlatma hatası:', error);
        this.showError('Mülakat başlatılırken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        
        // Butonu tekrar aktif et
        const startButton = document.getElementById('start-button');
        if (startButton) {
          startButton.disabled = false;
          startButton.innerHTML = 'Mülakatı Başlat <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>';
        }
      }
    }

    showInterviewScreen() {
      const appContainer = document.getElementById('app-container');
      const prepScreen = document.getElementById('prep-screen');
      const progressFooter = document.querySelector('footer');
      const endInterviewBtn = document.getElementById('end-interview-btn');
      const aiLiveIndicator = document.getElementById('ai-live-indicator');

      // Prep screen'i gizle
      if (prepScreen) {
        prepScreen.style.display = 'none';
      }

      // interview-started class'ı ekle - CSS otomatik olarak ekranları değiştirecek
      if (appContainer) {
        appContainer.classList.add('interview-started');
      }

      // Progress footer'ı aktif et
      if (progressFooter) {
        progressFooter.classList.remove('opacity-50');
      }

      // "Mülakatı Sonlandır" butonunu göster
      if (endInterviewBtn) {
        endInterviewBtn.style.display = 'block';
      }

      // Header divider'ı göster
      const headerDivider = document.getElementById('header-divider');
      if (headerDivider) {
        headerDivider.style.display = 'block';
      }

      // "Canlı" göstergesini göster
      if (aiLiveIndicator) {
        aiLiveIndicator.style.display = 'block';
      }

      // Sidebar bilgilerini güncelle
      if (window.interviewManager) {
        window.interviewManager.updateSidebarInfo();
      }
    }


    showNoCVsMessage() {
      const cvSelect = document.getElementById('cv-select');
      if (cvSelect) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'CV bulunamadı - Önce CV oluşturun';
        option.disabled = true;
        cvSelect.appendChild(option);
      }
    }

    showError(message) {
      // Basit alert (daha iyi bir notification sistemi eklenebilir)
      alert(message);
    }
  }

  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.interviewStartManager = new InterviewStartManager();
    });
  } else {
    window.interviewStartManager = new InterviewStartManager();
  }
})();

