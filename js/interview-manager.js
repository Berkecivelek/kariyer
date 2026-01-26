/**
 * Interview Manager - Mülakat Hazırlığı Ekranı Yönetimi
 * 3 mod destekler: Davranışsal, Teknik, Stres Modu
 */
class InterviewManager {
  constructor() {
    this.currentSession = null;
    this.currentQuestion = null;
    this.currentMode = null;
    this.startTime = null;
    this.timerInterval = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.responseStartTime = null;
    this.speechRecognition = null;
    this.recognizedText = '';
    
    this.init();
  }

  init() {
    // Sayfa yüklendiğinde modu belirle
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'mulakat-hazirligi.html') {
      this.currentMode = 'BEHAVIORAL';
    } else if (currentPage === 'mulakat-hazirligi-teknik.html') {
      this.currentMode = 'TECHNICAL';
    } else if (currentPage === 'mulakat-hazirligi-stres.html') {
      this.currentMode = 'STRESS';
    }

    // Event listener'ları ekle
    this.setupEventListeners();
    
    // URL'de sessionId varsa otomatik olarak session'ı yükle ve soruyu getir
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    if (sessionId) {
      this.currentSession = { id: sessionId };
      // İlk soruyu getir
      this.getNextQuestion();
      this.startTimer();
    }
  }

  setupEventListeners() {
    // Pozisyon seçimi değiştiğinde
    const positionSelect = document.getElementById('position');
    if (positionSelect) {
      positionSelect.addEventListener('change', () => {
        if (this.currentSession) {
          // Yeni pozisyon için yeni session başlat
          this.startInterview();
        }
      });
    }

    // Cevap gönder butonu
    const sendButton = document.getElementById('submit-answer-btn');
    if (sendButton) {
      sendButton.addEventListener('click', () => this.submitAnswer());
    }

    // Sesli yanıt butonu
    const voiceButton = document.getElementById('voice-record-btn');
    if (voiceButton) {
      voiceButton.addEventListener('click', () => this.toggleVoiceRecording());
    }

    // Mülakatı bitir butonu
    const endButton = document.getElementById('end-interview-btn');
    if (endButton) {
      endButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Modal zaten açılacak (href="#termination-modal")
      });
    }

    // Modal'daki onay butonu
    const confirmEndBtn = document.getElementById('confirm-end-btn');
    if (confirmEndBtn) {
      confirmEndBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.endInterview();
      });
    }

    // Sayfa yüklendiğinde otomatik başlat (opsiyonel)
    // this.startInterview();
  }

  /**
   * Mülakat oturumunu başlatır
   */
  async startInterview() {
    try {
      // Pozisyon seçimini al
      const positionSelect = document.getElementById('position');
      const targetPosition = positionSelect ? positionSelect.value : 'Senior Frontend Developer';

      // Aktif CV'yi al (eğer varsa)
      const resumeId = localStorage.getItem('current-resume-id') || null;

      // Loading göster
      this.showLoading('Mülakat hazırlanıyor...');

      // API çağrısı
      const response = await window.apiClient.startInterview(
        this.currentMode,
        targetPosition,
        resumeId,
        10 // Toplam soru sayısı
      );

      if (response.success) {
        this.currentSession = response.data.session;
        this.currentQuestion = response.data.question;
        this.startTime = new Date();
        
        // UI'ı güncelle
        this.renderQuestion(this.currentQuestion);
        this.startTimer();
        this.hideLoading();
      } else {
        throw new Error(response.error || 'Mülakat başlatılamadı');
      }
    } catch (error) {
      console.error('Interview start error:', error);
      this.hideLoading();
      this.showError('Mülakat başlatılırken bir hata oluştu: ' + error.message);
    }
  }

  /**
   * Soruyu ekranda gösterir
   */
  renderQuestion(question, questionNumber, totalQuestions) {
    if (!question) return;

    // Soru metnini güncelle (yeni HTML yapısına göre)
    const questionText = document.getElementById('question-text');
    if (questionText) {
      let questionHtml = '';
      
      if (question.questionText) {
        questionHtml = question.questionText;
      } else if (question.question) {
        questionHtml = question.question;
      }
      
      // Soru metnindeki önemli kelimeleri vurgula (tırnak içindeki veya büyük harfle başlayan kelimeler)
      // Örnek: "Next Gen Dashboard" gibi proje isimlerini vurgula
      questionHtml = questionHtml.replace(/"([^"]+)"/g, '<span class="text-primary font-extrabold underline decoration-primary/30 underline-offset-4">$1</span>');
      
      questionText.innerHTML = questionHtml;
    }

    // İpucu metnini güncelle
    const hintText = document.getElementById('question-hint');
    const hintContainer = document.getElementById('hint-container');
    if (hintText && hintContainer) {
      if (question.hint) {
        hintText.textContent = question.hint;
        hintContainer.style.display = 'flex';
      } else {
        hintContainer.style.display = 'none';
      }
    }

    // Teknik mod için kod snippet'i göster
    if (this.currentMode === 'TECHNICAL' && question.codeSnippet) {
      const codeBlock = document.querySelector('.code-syntax, pre.code-syntax');
      if (codeBlock) {
        codeBlock.innerHTML = this.highlightCode(question.codeSnippet);
      }
    }

    // Cevap alanını temizle
    const answerTextarea = document.getElementById('answer-textarea');
    if (answerTextarea) {
      answerTextarea.value = '';
      this.responseStartTime = Date.now();
    }

    // İlerleme göstergesini güncelle
    const qNum = questionNumber || question.order || 1;
    const total = totalQuestions || this.currentSession?.totalQuestions || 10;
    this.updateProgress(qNum, total);

    // Sidebar bilgilerini güncelle
    this.updateSidebarInfo();
  }

  /**
   * Kod syntax highlighting (basit)
   */
  highlightCode(code) {
    // Basit keyword highlighting
    const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'map', 'filter'];
    let highlighted = code;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="token-keyword">${keyword}</span>`);
    });

    // Function calls
    highlighted = highlighted.replace(/(\w+)\s*\(/g, '<span class="token-function">$1</span>(');
    
    // Strings
    highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span class="token-string">$1$2$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="token-comment">$&</span>');

    return highlighted;
  }

  /**
   * Cevabı gönderir ve analiz eder
   */
  async submitAnswer() {
    try {
      if (!this.currentQuestion || !this.currentSession) {
        // Eğer interview-start-manager varsa, onun üzerinden başlat
        if (window.interviewStartManager) {
          this.showError('Lütfen önce bir mülakat başlatın. Sayfayı yenileyip CV seçerek mülakatı başlatın.');
        } else {
          this.showError('Lütfen önce bir mülakat başlatın');
        }
        return;
      }

      const answerTextarea = document.getElementById('answer-textarea');
      const textAnswer = answerTextarea ? answerTextarea.value.trim() : '';

      if (!textAnswer && this.currentMode !== 'TECHNICAL') {
        this.showError('Lütfen bir cevap girin');
        return;
      }

      // Teknik mod için kod cevabını al
      let codeAnswer = null;
      if (this.currentMode === 'TECHNICAL') {
        const codeEditor = document.querySelector('textarea.font-mono');
        codeAnswer = codeEditor ? codeEditor.value.trim() : textAnswer;
      }

      // Yanıt süresini hesapla
      const responseTime = this.responseStartTime 
        ? Math.floor((Date.now() - this.responseStartTime) / 1000)
        : null;

      // Ses analizi (eğer kayıt varsa)
      const audioAnalysis = this.isRecording ? this.getAudioAnalysis() : null;

      // Loading göster
      this.showLoading('Cevabınız analiz ediliyor...');

      // API çağrısı
      const response = await window.apiClient.submitAnswer(
        this.currentQuestion.id,
        textAnswer,
        codeAnswer,
        responseTime,
        audioAnalysis
      );

      if (response.success) {
        // AI geri bildirimini göster
        this.renderFeedback(response.data.answer);
        
        // Textarea'yı temizle
        const answerTextarea = document.getElementById('answer-textarea');
        if (answerTextarea) {
          answerTextarea.value = '';
        }
        this.recognizedText = '';

        // Sonraki soruya geç (otomatik veya buton ile)
        setTimeout(() => {
          this.getNextQuestion();
        }, 3000); // 3 saniye bekle

        this.hideLoading();
      } else {
        throw new Error(response.error || 'Cevap gönderilemedi');
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      this.hideLoading();
      
      // Hata mesajını parse et
      let errorMessage = 'Cevap gönderilirken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';
      
      // 401 hatası (unauthorized) kontrolü
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('token')) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        // Logout yapma, sadece hata göster
        setTimeout(() => {
          if (confirm('Oturum süreniz dolmuş. Giriş sayfasına yönlendirilmek ister misiniz?')) {
            window.location.href = 'giris.html';
          }
        }, 1000);
      } else {
        errorMessage = 'Cevap gönderilirken bir hata oluştu: ' + errorMsg;
      }
      
      this.showError(errorMessage);
    }
  }

  /**
   * Sonraki soruyu getirir
   */
  async getNextQuestion() {
    try {
      if (!this.currentSession) {
        return;
      }

      this.showLoading('Sonraki soru hazırlanıyor...');

      const response = await window.apiClient.getNextQuestion(this.currentSession.id);

      if (response.success) {
        this.currentQuestion = response.data.question;
        this.responseStartTime = Date.now();
        const progress = response.data.progress || {};
        this.renderQuestion(
          this.currentQuestion,
          progress.current,
          progress.total
        );
        this.hideLoading();
      } else {
        throw new Error(response.error || 'Soru alınamadı');
      }
    } catch (error) {
      console.error('Get next question error:', error);
      this.hideLoading();
      this.showError('Soru alınırken bir hata oluştu: ' + error.message);
    }
  }

  /**
   * AI geri bildirimini gösterir
   */
  renderFeedback(answerData) {
    const feedback = answerData.aiFeedback || {};
    const scores = answerData.performanceScores || {};
    const stressMetrics = answerData.stressMetrics || {};

    // AI aktif durumunu göster
    const aiWaitingState = document.getElementById('ai-waiting-state');
    const aiActiveState = document.getElementById('ai-active-state');
    if (aiWaitingState) aiWaitingState.style.display = 'none';
    if (aiActiveState) aiActiveState.classList.remove('hidden');

    // Davranışsal mod geri bildirimi
    if (this.currentMode === 'BEHAVIORAL') {
      // AI Önerisi
      const aiSuggestionText = document.getElementById('ai-suggestion-text');
      const aiSuggestionContainer = document.getElementById('ai-suggestion-container');
      if (aiSuggestionText && feedback.instantSuggestion) {
        aiSuggestionText.textContent = feedback.instantSuggestion;
        if (aiSuggestionContainer) aiSuggestionContainer.style.display = 'block';
      }

      // STAR Tekniği Akışı
      this.updateSTARTechnique(feedback);

      // Performans skorları
      this.updatePerformanceBars(scores);
    }

    // Teknik mod geri bildirimi
    if (this.currentMode === 'TECHNICAL') {
      // Teknik Doğruluk
      if (feedback.technicalAccuracy) {
        this.updateFeedbackCard('Teknik Doğruluk', feedback.technicalAccuracy, 'blue');
      }

      // Kod Optimizasyonu
      if (feedback.codeOptimization) {
        this.updateFeedbackCard('Kod Optimizasyonu', feedback.codeOptimization, 'purple');
      }

      // Mimari Yaklaşım
      if (feedback.architecturalApproach) {
        this.updateFeedbackCard('Mimari Yaklaşım', feedback.architecturalApproach, 'emerald');
      }

      // Performans skorları
      this.updatePerformanceBars(scores);
    }

    // Stres modu geri bildirimi
    if (this.currentMode === 'STRESS') {
      // Ses Analizi
      if (stressMetrics.voiceAnalysis) {
        this.updateFeedbackCard('Ses Analizi', stressMetrics.voiceAnalysis, 'red');
      }

      // Kriz Yönetimi
      if (stressMetrics.crisisManagement) {
        this.updateFeedbackCard('Kriz Yönetimi', stressMetrics.crisisManagement, 'amber');
      }

      // Sakinliği koruma oranı
      if (stressMetrics.calmnessRate !== undefined) {
        this.updateCalmnessRate(stressMetrics.calmnessRate);
      }

      // Baskı parametreleri
      this.updateStressBars(scores);
    }
  }

  /**
   * Geri bildirim kartını günceller
   */
  updateFeedbackCard(title, content, color) {
    // Mevcut kartları bul ve güncelle veya yeni oluştur
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;

    // İlgili renk kartını bul
    const card = sidebar.querySelector(`.bg-${color}-50, .bg-${color}-900\\/20`);
    if (card) {
      const text = card.querySelector('p');
      if (text) {
        text.textContent = content;
      }
    }
  }

  /**
   * Performans çubuklarını günceller
   */
  updatePerformanceBars(scores) {
    // Netlik
    if (scores.clarity !== undefined) {
      const clarityScore = document.getElementById('clarity-score');
      const clarityBar = document.getElementById('clarity-bar');
      if (clarityScore) clarityScore.textContent = `${scores.clarity}%`;
      if (clarityBar) clarityBar.style.width = `${scores.clarity}%`;
    }

    // Özgüven (Ses)
    if (scores.confidence !== undefined) {
      const confidenceScore = document.getElementById('confidence-score');
      const confidenceBar = document.getElementById('confidence-bar');
      if (confidenceScore) confidenceScore.textContent = `${scores.confidence}%`;
      if (confidenceBar) confidenceBar.style.width = `${scores.confidence}%`;
    }

    // Teknik Derinlik
    if (scores.technicalDepth !== undefined) {
      const technicalDepthScore = document.getElementById('technical-depth-score');
      const technicalDepthBar = document.getElementById('technical-depth-bar');
      if (technicalDepthScore) technicalDepthScore.textContent = `${scores.technicalDepth}%`;
      if (technicalDepthBar) technicalDepthBar.style.width = `${scores.technicalDepth}%`;
    }
  }

  /**
   * Stres modu çubuklarını günceller
   */
  updateStressBars(scores) {
    this.updatePerformanceBars(scores);
  }

  /**
   * Sakinliği koruma oranını günceller
   */
  updateCalmnessRate(rate) {
    const chart = document.querySelector('.h-32');
    if (chart) {
      const rateText = chart.querySelector('span.text-3xl');
      if (rateText) {
        rateText.textContent = `${rate}%`;
      }
    }
  }

  /**
   * İlerleme göstergesini günceller
   */
  updateProgress(current, total) {
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `${current} / ${total} Soru`;
    }

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * Timer başlatır
   */
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.startTime) return;

      const elapsed = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Timer'ı güncelle (header'daki timer)
      const timerElement = document.getElementById('timer') || document.getElementById('interview-timer');
      if (timerElement) {
        timerElement.textContent = timeString;
      }
    }, 1000);
  }

  /**
   * Ses kaydını başlatır/durdurur
   */
  async toggleVoiceRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  /**
   * Ses kaydını başlatır (Web Speech API ile)
   */
  async startRecording() {
    try {
      // Web Speech API kontrolü
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.showError('Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome veya Edge kullanın.');
        return;
      }

      // Speech Recognition başlat
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'tr-TR';

      this.recognizedText = '';
      const answerTextarea = document.getElementById('answer-textarea');
      const currentText = answerTextarea ? answerTextarea.value : '';

      // Sonuçları işle
      this.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        this.recognizedText = currentText + finalTranscript;
        if (answerTextarea) {
          answerTextarea.value = this.recognizedText + interimTranscript;
        }
      };

      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Sessizlik hatası, devam et
          return;
        }
        this.showError('Ses tanıma hatası: ' + event.error);
        this.stopRecording();
      };

      this.speechRecognition.onend = () => {
        // Otomatik olarak durduysa tekrar başlat (kullanıcı durdurmadıysa)
        if (this.isRecording) {
          try {
            this.speechRecognition.start();
          } catch (e) {
            // Zaten çalışıyor olabilir
          }
        }
      };

      // Mikrofon erişimi için MediaRecorder da başlat (analiz için)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.start();
      } catch (error) {
        console.warn('MediaRecorder başlatılamadı:', error);
      }

      // Speech Recognition başlat
      this.speechRecognition.start();
      this.isRecording = true;

      // UI güncelle
      const voiceButton = document.getElementById('voice-record-btn');
      if (voiceButton) {
        voiceButton.classList.add('animate-pulse', 'bg-red-500', 'hover:bg-red-600');
        voiceButton.innerHTML = '<span class="material-symbols-outlined text-sm">mic</span> Kayıt Durdur';
      }
    } catch (error) {
      console.error('Recording error:', error);
      this.showError('Mikrofon erişimi reddedildi veya ses tanıma başlatılamadı');
      this.isRecording = false;
    }
  }

  /**
   * Ses kaydını durdurur
   */
  stopRecording() {
    this.isRecording = false;

    // Speech Recognition durdur
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        console.warn('Speech recognition durdurulamadı:', e);
      }
      this.speechRecognition = null;
    }

    // MediaRecorder durdur
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.warn('MediaRecorder durdurulamadı:', e);
      }
    }

    // Final text'i kaydet
    const answerTextarea = document.getElementById('answer-textarea');
    if (answerTextarea && this.recognizedText) {
      answerTextarea.value = this.recognizedText.trim();
    }

    // UI güncelle
    const voiceButton = document.getElementById('voice-record-btn');
    if (voiceButton) {
      voiceButton.classList.remove('animate-pulse', 'bg-red-500', 'hover:bg-red-600');
      voiceButton.classList.add('bg-orange-500', 'hover:bg-orange-600');
      voiceButton.innerHTML = '<span class="material-symbols-outlined text-sm">mic</span> Konuşarak Yanıtla';
    }
  }

  /**
   * Ses analizi verilerini döndürür
   */
  getAudioAnalysis() {
    // Basit analiz (gerçek implementasyon için Web Speech API veya backend analizi gerekir)
    return {
      duration: this.audioChunks.length,
      hasAudio: this.audioChunks.length > 0
    };
  }

  /**
   * Mülakat oturumunu sonlandırır
   */
  async endInterview() {
    if (!this.currentSession) {
      return;
    }

    try {
      this.showLoading('Mülakat sonlandırılıyor...');

      const response = await window.apiClient.endInterview(this.currentSession.id);

      if (response.success) {
        // Modal'ı kapat
        window.location.hash = '';
        // Sonuç sayfasına yönlendir veya özet göster
        alert(`Mülakat tamamlandı! Genel Puan: ${response.data.session.overallScore || 'N/A'}`);
        window.location.href = 'dashboard.html';
      } else {
        throw new Error(response.error || 'Mülakat sonlandırılamadı');
      }
    } catch (error) {
      console.error('End interview error:', error);
      this.showError('Mülakat sonlandırılırken bir hata oluştu: ' + error.message);
      // Modal'ı kapat
      window.location.hash = '';
    } finally {
      this.hideLoading();
    }
  }

  /**
   * STAR Tekniği akışını günceller
   */
  updateSTARTechnique(feedback) {
    const starContainer = document.getElementById('star-technique-container');
    if (!starContainer) return;

    const starSteps = [
      { key: 'situation', label: 'Situation (Durum)', icon: 'radio_button_unchecked' },
      { key: 'task', label: 'Task (Görev)', icon: 'radio_button_unchecked' },
      { key: 'action', label: 'Action (Eylem)', icon: 'radio_button_unchecked' },
      { key: 'result', label: 'Result (Sonuç)', icon: 'radio_button_unchecked' }
    ];

    // Feedback'ten STAR bilgilerini al
    const starData = feedback.starTechnique || {};

    starContainer.innerHTML = starSteps.map((step, index) => {
      const stepData = starData[step.key];
      const isCompleted = stepData && stepData.completed;
      const isPending = stepData && stepData.pending;
      const feedbackText = stepData ? stepData.feedback : 'Bekleniyor...';

      let bgColor = 'bg-slate-50 dark:bg-slate-800';
      let borderColor = 'border-slate-100 dark:border-slate-700';
      let textColor = 'text-slate-400';
      let icon = 'radio_button_unchecked';
      let opacity = 'opacity-50';

      if (isCompleted) {
        bgColor = 'bg-green-50 dark:bg-green-900/10';
        borderColor = 'border-green-100 dark:border-green-900/20';
        textColor = 'text-green-500';
        icon = 'check_circle';
        opacity = '';
      } else if (isPending) {
        bgColor = 'bg-blue-50 dark:bg-blue-900/10';
        borderColor = 'border-blue-100 dark:border-blue-900/20';
        textColor = 'text-blue-500';
        icon = 'pending';
        opacity = '';
      }

      return `
        <div class="flex items-start gap-3 p-3 rounded-xl ${bgColor} ${borderColor} border ${opacity}">
          <span class="material-symbols-outlined ${textColor} text-sm">${icon}</span>
          <div>
            <p class="text-xs font-bold ${isCompleted ? 'text-green-800 dark:text-green-300' : isPending ? 'text-blue-800 dark:text-blue-300' : ''}">${step.label}</p>
            <p class="text-[11px] ${isCompleted ? 'text-green-700/80 dark:text-green-400/80' : isPending ? 'text-blue-700/80 dark:text-blue-400/80' : ''}">${feedbackText}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Sidebar bilgilerini günceller
   */
  updateSidebarInfo() {
    // Aktif mülakat bilgilerini göster
    const activeInterviewInfo = document.getElementById('active-interview-info');
    if (activeInterviewInfo) {
      activeInterviewInfo.style.display = 'block';
    }

    // Pozisyon bilgisini güncelle
    const positionSelect = document.getElementById('position');
    const sidebarPosition = document.getElementById('sidebar-position');
    if (positionSelect && sidebarPosition) {
      sidebarPosition.textContent = positionSelect.value || 'Senior Frontend Developer';
    }

    // CV bilgisini güncelle
    const cvSelect = document.getElementById('cv-select');
    const sidebarResume = document.getElementById('sidebar-resume');
    if (cvSelect && sidebarResume) {
      const selectedOption = cvSelect.options[cvSelect.selectedIndex];
      sidebarResume.textContent = selectedOption && selectedOption.value ? selectedOption.text : 'CV Seçilmedi';
    }
  }

  // UI Helper Methods

  showLoading(message) {
    // Loading overlay göster (eğer varsa)
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
      const text = loadingOverlay.querySelector('p');
      if (text) {
        text.textContent = message;
      }
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
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
    window.interviewManager = new InterviewManager();
  });
} else {
  window.interviewManager = new InterviewManager();
}

