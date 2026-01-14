// Cover Letter AI Integration
// Production-ready AI cover letter generation

(function () {
  'use strict';

  // DOM Elements
  let resumeSelect;
  let jobDescriptionTextarea;
  let toneRadios;
  let generateBtn;
  let generateBtnText;
  let coverLetterEditor;
  let fetchFromLinkBtn;
  let uploadScreenshotBtn;
  let screenshotInput;
  let ocrImageInput;
  let tryOcrBtn;
  let jobDescriptionError;
  let ocrLoading;
  let saveBtn;
  let downloadPdfBtn;
  let currentCoverLetterId = null;
  let linkInputContainer;
  let jobLinkInput;
  let fetchLinkBtn;
  let cancelLinkBtn;
  let selectedResumeData = null;

  // Initialize when DOM is ready
  function init() {
    resumeSelect = document.getElementById('resume-select');
    jobDescriptionTextarea = document.getElementById('job-description');
    toneRadios = document.querySelectorAll('input[name="tone"]');
    generateBtn = document.getElementById('generate-cover-letter-btn');
    generateBtnText = document.getElementById('generate-btn-text');
    coverLetterEditor = document.getElementById('cover-letter-editor');
    fetchFromLinkBtn = document.getElementById('fetch-from-link-btn');
    uploadScreenshotBtn = document.getElementById('upload-screenshot-btn');
    screenshotInput = document.getElementById('screenshot-input');
    ocrImageInput = document.getElementById('ocr-image-input');
    tryOcrBtn = document.getElementById('try-ocr-btn');
    jobDescriptionError = document.getElementById('job-description-error');
    ocrLoading = document.getElementById('ocr-loading');
    saveBtn = document.getElementById('save-cover-letter-btn');
    downloadPdfBtn = document.getElementById('download-pdf-btn');
    linkInputContainer = document.getElementById('link-input-container');
    jobLinkInput = document.getElementById('job-link-input');
    fetchLinkBtn = document.getElementById('fetch-link-btn');
    cancelLinkBtn = document.getElementById('cancel-link-btn');

    if (!generateBtn || !coverLetterEditor) {
      console.warn('Cover letter AI: Required elements not found');
      return;
    }

    // Load user's resumes
    loadResumes();
    
    // Check if editing existing cover letter
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      loadCoverLetterForEdit(editId);
    }

    // Event listeners
    generateBtn.addEventListener('click', handleGenerateCoverLetter);
    if (fetchFromLinkBtn) {
      fetchFromLinkBtn.addEventListener('click', () => {
        if (linkInputContainer) {
          linkInputContainer.classList.remove('hidden');
          if (jobLinkInput) {
            jobLinkInput.focus();
          }
        }
      });
    }
    if (fetchLinkBtn) {
      fetchLinkBtn.addEventListener('click', handleFetchFromLink);
    }
    if (cancelLinkBtn) {
      cancelLinkBtn.addEventListener('click', () => {
        if (linkInputContainer) {
          linkInputContainer.classList.add('hidden');
        }
        if (jobLinkInput) {
          jobLinkInput.value = '';
        }
      });
    }
    if (resumeSelect) {
      resumeSelect.addEventListener('change', () => {
        // CV değiştiğinde header bilgilerini KESİNLİKLE güncelle
        handleResumeSelectionChange();
      });
    }
    if (uploadScreenshotBtn) {
      uploadScreenshotBtn.addEventListener('click', () => screenshotInput?.click());
    }
    if (screenshotInput) {
      screenshotInput.addEventListener('change', handleScreenshotUpload);
    }
    if (tryOcrBtn) {
      tryOcrBtn.addEventListener('click', () => ocrImageInput?.click());
    }
    if (ocrImageInput) {
      ocrImageInput.addEventListener('change', handleOcrImageUpload);
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSaveCoverLetter);
    }
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', handleDownloadPDF);
    }
  }

  // Load user's resumes from API
  async function loadResumes() {
    if (!window.apiClient) {
      console.warn('API client not available');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Not authenticated');
        return;
      }

      const response = await window.apiClient.getResumes(true); // Tüm CV'leri al

      if (response.success && response.data && response.data.resumes && Array.isArray(response.data.resumes)) {
        // Clear existing options (except first one)
        resumeSelect.innerHTML = '<option value="">Özgeçmiş Seçin...</option>';

        // Add resume options
        response.data.resumes.forEach((resume) => {
          const option = document.createElement('option');
          option.value = resume.id;
          option.textContent = `${resume.title || 'Özgeçmiş'} - ${resume.templateId || 'modern'}`;
          option.setAttribute('data-resume', JSON.stringify(resume)); // Resume data'yı sakla
          resumeSelect.appendChild(option);
        });

        // If there's a current resume ID in localStorage, select it
        const currentResumeId = localStorage.getItem('current-resume-id');
        if (currentResumeId) {
          resumeSelect.value = currentResumeId;
          // CV bilgilerini yükle
          setTimeout(() => {
            handleResumeSelectionChange();
          }, 100);
        } else if (response.data.resumes.length > 0) {
          // İlk CV'yi otomatik seç
          resumeSelect.value = response.data.resumes[0].id;
          setTimeout(() => {
            handleResumeSelectionChange();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
      // Show error to user
      showError('Özgeçmişler yüklenirken bir hata oluştu.');
    }
  }

  // Handle resume selection change - CV bilgilerini yükle
  async function handleResumeSelectionChange() {
    const resumeId = resumeSelect.value;
    if (!resumeId || resumeId.trim() === '') {
      selectedResumeData = null;
      updateCoverLetterHeader(null);
      return;
    }

    try {
      // Seçilen option'dan resume data'yı al
      const selectedOption = resumeSelect.options[resumeSelect.selectedIndex];
      const resumeDataStr = selectedOption.getAttribute('data-resume');
      
      if (resumeDataStr) {
        try {
          selectedResumeData = JSON.parse(resumeDataStr);
          // KRİTİK: Header bilgilerini KESİNLİKLE güncelle
          updateCoverLetterHeader(selectedResumeData);
        } catch (parseError) {
          console.warn('Failed to parse resume data from option, fetching from API:', parseError);
          // Parse hatası varsa API'den çek
          await fetchResumeDataFromAPI(resumeId);
        }
      } else {
        // Eğer data yoksa API'den çek
        await fetchResumeDataFromAPI(resumeId);
      }
    } catch (error) {
      console.error('Failed to load resume data:', error);
      selectedResumeData = null;
      updateCoverLetterHeader(null);
    }
  }

  // Fetch resume data from API
  async function fetchResumeDataFromAPI(resumeId) {
    try {
      const response = await window.apiClient.getResume(resumeId);
      if (response.success && response.data && response.data.resume) {
        selectedResumeData = response.data.resume;
        // KRİTİK: Header bilgilerini KESİNLİKLE güncelle
        updateCoverLetterHeader(selectedResumeData);
        
        // Option'a da kaydet ki bir sonraki seferde hızlı yüklensin
        const selectedOption = resumeSelect.options[resumeSelect.selectedIndex];
        if (selectedOption) {
          selectedOption.setAttribute('data-resume', JSON.stringify(selectedResumeData));
        }
      } else {
        throw new Error('Resume data not found');
      }
    } catch (error) {
      console.error('Failed to fetch resume from API:', error);
      selectedResumeData = null;
      updateCoverLetterHeader(null);
      throw error;
    }
  }

  // Update cover letter header with resume data
  function updateCoverLetterHeader(resumeData) {
    const nameEl = document.getElementById('cover-letter-name');
    const emailEl = document.getElementById('cover-letter-email');
    const phoneEl = document.getElementById('cover-letter-phone');
    const locationEl = document.getElementById('cover-letter-location');
    const dateEl = document.getElementById('cover-letter-date');

    if (!resumeData) {
      if (nameEl) nameEl.textContent = 'Ad Soyad';
      if (emailEl) emailEl.textContent = 'email@example.com';
      if (phoneEl) phoneEl.textContent = 'Telefon';
      if (locationEl) locationEl.textContent = 'Konum';
      return;
    }

    const firstName = resumeData.firstName || '';
    const lastName = resumeData.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Ad Soyad';
    const email = resumeData.email || 'email@example.com';
    const phone = resumeData.phone || 'Telefon';
    const location = resumeData.location || 'Konum';

    // KRİTİK: Header bilgilerini KESİNLİKLE güncelle
    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;
    if (locationEl) locationEl.textContent = location;
    
    // Update date to today
    if (dateEl) {
      const today = new Date();
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      dateEl.textContent = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    }
  }

  // Auto-generate cover letter after link analysis
  async function autoGenerateCoverLetterAfterLinkAnalysis() {
    // Validation
    const resumeId = resumeSelect.value;
    if (!resumeId || resumeId.trim() === '') {
      showError('Lütfen bir özgeçmiş seçin.');
      return;
    }

    const jobDesc = jobDescriptionTextarea.value.trim();
    if (!jobDesc || jobDesc.length < 50) {
      showError('İş ilanı metni yeterli değil.');
      return;
    }

    // Try to extract position from job description
    let hedefPozisyon = '';
    const patterns = [
      /(?:pozisyon|position|iş|job|görev|role)[\s:]+([^\n]{5,100})/i,
      /(?:aranan|arıyoruz|looking for|seeking)[\s:]+([^\n]{5,100})/i,
      /(?:başlık|title)[\s:]+([^\n]{5,100})/i,
      /^([A-ZÇĞİÖŞÜ][a-zçğıöşü\s]{5,50})(?:\s+pozisyonu|\s+developer|\s+engineer|\s+manager)/i,
    ];
    
    for (const pattern of patterns) {
      const match = jobDesc.match(pattern);
      if (match && match[1]) {
        hedefPozisyon = match[1].trim();
        hedefPozisyon = hedefPozisyon.replace(/[^\w\sçğıöşüÇĞİÖŞÜ-]/g, '').trim();
        if (hedefPozisyon.length >= 5 && hedefPozisyon.length <= 100) {
          break;
        }
      }
    }

    // If still no position, prompt user
    if (!hedefPozisyon || hedefPozisyon.length < 3) {
      hedefPozisyon = prompt('İş ilanından pozisyon otomatik olarak çıkarılamadı.\n\nLütfen başvurmak istediğiniz pozisyonu girin:\n(örn: Senior Backend Developer, Kıdemli Yazılım Geliştirici)');
      if (!hedefPozisyon || hedefPozisyon.trim() === '') {
        showError('Hedef pozisyon gereklidir. Ön yazı oluşturulamadı.');
        return;
      }
      hedefPozisyon = hedefPozisyon.trim();
    }

    // Get selected tone - KRİTİK: Kullanıcının seçtiği tonu AI'a gönder
    const selectedTone = Array.from(toneRadios).find((radio) => radio.checked);
    if (!selectedTone) {
      showError('Lütfen bir yazı tonu seçin (Resmi, Profesyonel veya Samimi).');
      return;
    }
    const ton = selectedTone.value;
    
    // Validate tone value
    if (!['samimi', 'profesyonel', 'resmi'].includes(ton)) {
      showError('Geçersiz yazı tonu seçildi.');
      return;
    }

    // Set loading state
    setLoadingState(true);

    try {
      const jobDescription = jobDescriptionTextarea.value.trim();
      
      const response = await window.apiClient.generateCoverLetter(
        resumeId, 
        hedefPozisyon, 
        ton,
        jobDescription || undefined
      );

      if (response.success && response.data && response.data.coverLetter) {
        updateEditorContent(response.data.coverLetter);
        currentCoverLetterId = response.data.coverLetterId || null;
        showSuccess('Ön yazı başarıyla oluşturuldu!');
      } else {
        throw new Error(response.error?.message || 'Ön yazı oluşturulamadı.');
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
      let errorMessage = 'Ön yazı oluşturulurken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
        errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
      } else if (errorMsg.toLowerCase().includes('authenticated') || errorMsg.toLowerCase().includes('giriş')) {
        errorMessage = 'Ön yazı oluşturmak için giriş yapmanız gerekiyor.';
      } else if (errorMsg.toLowerCase().includes('not configured')) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('resume not found')) {
        errorMessage = 'Seçilen özgeçmiş bulunamadı. Lütfen başka bir özgeçmiş seçin.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      showError(errorMessage);
    } finally {
      setLoadingState(false);
    }
  }

  // Handle generate cover letter button click
  async function handleGenerateCoverLetter() {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    // Validation
    const resumeId = resumeSelect.value;
    if (!resumeId || resumeId.trim() === '') {
      showError('Lütfen bir özgeçmiş seçin.');
      return;
    }

    // Get hedef pozisyon - ÖNCE job description'dan çıkarmaya çalış, yoksa kullanıcıdan sor
    let hedefPozisyon = '';
    const jobDesc = jobDescriptionTextarea.value.trim();
    
    if (!jobDesc || jobDesc.length < 50) {
      showError('Lütfen önce iş ilanı metnini girin. "Linkten Çek" butonunu kullanarak linkten otomatik çekebilir veya manuel olarak yapıştırabilirsiniz.');
      return;
    }
    
    // Try to extract position from job description (improved heuristics)
    if (jobDesc) {
      // Look for common patterns
      const patterns = [
        /(?:pozisyon|position|iş|job|görev|role)[\s:]+([^\n]{5,100})/i,
        /(?:aranan|arıyoruz|looking for|seeking)[\s:]+([^\n]{5,100})/i,
        /(?:başlık|title)[\s:]+([^\n]{5,100})/i,
        /^([A-ZÇĞİÖŞÜ][a-zçğıöşü\s]{5,50})(?:\s+pozisyonu|\s+developer|\s+engineer|\s+manager)/i,
      ];
      
      for (const pattern of patterns) {
        const match = jobDesc.match(pattern);
        if (match && match[1]) {
          hedefPozisyon = match[1].trim();
          // Clean up the position text
          hedefPozisyon = hedefPozisyon.replace(/[^\w\sçğıöşüÇĞİÖŞÜ-]/g, '').trim();
          if (hedefPozisyon.length >= 5 && hedefPozisyon.length <= 100) {
            break;
          }
        }
      }
    }

    // If still no position, prompt user with a better message
    if (!hedefPozisyon || hedefPozisyon.length < 3) {
      hedefPozisyon = prompt('İş ilanından pozisyon otomatik olarak çıkarılamadı.\n\nLütfen başvurmak istediğiniz pozisyonu girin:\n(örn: Senior Backend Developer, Kıdemli Yazılım Geliştirici)');
      if (!hedefPozisyon || hedefPozisyon.trim() === '') {
        showError('Hedef pozisyon gereklidir. Ön yazı oluşturulamadı.');
        return;
      }
      hedefPozisyon = hedefPozisyon.trim();
    }

    // Get selected tone
    const selectedTone = Array.from(toneRadios).find((radio) => radio.checked);
    if (!selectedTone) {
      showError('Lütfen bir yazı tonu seçin.');
      return;
    }

    const ton = selectedTone.value;

    // Validate tone value
    if (!['samimi', 'profesyonel', 'resmi'].includes(ton)) {
      showError('Geçersiz yazı tonu seçildi.');
      return;
    }

    // Set loading state
    setLoadingState(true);

    try {
      // Get job description from textarea
      const jobDescription = jobDescriptionTextarea.value.trim();
      
      // Call API with job description
      const response = await window.apiClient.generateCoverLetter(
        resumeId, 
        hedefPozisyon, 
        ton,
        jobDescription || undefined
      );

      if (response.success && response.data && response.data.coverLetter) {
        // Update editor with generated cover letter
        updateEditorContent(response.data.coverLetter);
        currentCoverLetterId = response.data.coverLetterId || null;
        showSuccess('Ön yazı başarıyla oluşturuldu!');
      } else {
        throw new Error(response.error?.message || 'Ön yazı oluşturulamadı.');
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
      let errorMessage = 'Ön yazı oluşturulurken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      // Parse specific error messages
      if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
        errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
      } else if (
        errorMsg.toLowerCase().includes('authenticated') ||
        errorMsg.toLowerCase().includes('giriş') ||
        errorMsg.toLowerCase().includes('login')
      ) {
        errorMessage = 'Ön yazı oluşturmak için giriş yapmanız gerekiyor.';
      } else if (
        errorMsg.toLowerCase().includes('not configured') ||
        errorMsg.toLowerCase().includes('contact support')
      ) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('resume not found')) {
        errorMessage = 'Seçilen özgeçmiş bulunamadı. Lütfen başka bir özgeçmiş seçin.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      showError(errorMessage);
    } finally {
      setLoadingState(false);
    }
  }

  // Update editor content with generated cover letter
  function updateEditorContent(coverLetter) {
    if (!coverLetterEditor) return;

    // Sanitize and format the content
    // Split into paragraphs if needed
    const paragraphs = coverLetter.split('\n\n').filter((p) => p.trim());
    
    // Clear existing content
    coverLetterEditor.innerHTML = '';

    // Add paragraphs
    paragraphs.forEach((paragraph) => {
      const p = document.createElement('p');
      p.textContent = paragraph.trim();
      coverLetterEditor.appendChild(p);
    });

    // If no paragraphs, add as single paragraph
    if (paragraphs.length === 0 && coverLetter.trim()) {
      const p = document.createElement('p');
      p.textContent = coverLetter.trim();
      coverLetterEditor.appendChild(p);
    }
    
    // Update date to today
    const dateEl = document.getElementById('cover-letter-date');
    if (dateEl) {
      const today = new Date();
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      dateEl.textContent = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    }
  }

  // Set loading state
  function setLoadingState(isLoading) {
    if (!generateBtn || !generateBtnText) return;

    generateBtn.disabled = isLoading;
    if (isLoading) {
      generateBtnText.textContent = 'Oluşturuluyor...';
      generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      generateBtnText.textContent = 'Oluştur';
      generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Show error message
  function showError(message) {
    // Simple alert for now - can be replaced with a toast notification
    alert('Hata: ' + message);
    console.error('Cover Letter AI Error:', message);
  }

  // Show success message
  function showSuccess(message) {
    // Simple alert for now - can be replaced with a toast notification
    console.log('Cover Letter AI Success:', message);
    // Optionally show a success notification
    // You can integrate a toast library here if needed
  }

  // Handle "Linkten Çek" button click
  async function handleFetchFromLink() {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    // Get URL from input field
    const url = jobLinkInput ? jobLinkInput.value.trim() : '';
    if (!url || url.trim() === '') {
      showError('Lütfen bir link girin.');
      return;
    }

    // URL validation
    try {
      new URL(url);
    } catch (e) {
      showError('Geçersiz URL formatı. Lütfen geçerli bir link girin.');
      return;
    }

    // Hide error message
    if (jobDescriptionError) {
      jobDescriptionError.classList.add('hidden');
    }

    // Hide link input container
    if (linkInputContainer) {
      linkInputContainer.classList.add('hidden');
    }

    // Set loading state
    if (fetchLinkBtn) {
      fetchLinkBtn.disabled = true;
      fetchLinkBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Analiz Ediliyor...</span>';
    }

    try {
      const response = await window.apiClient.scrapeJobPosting(url.trim());

      if (response.success && response.data && response.data.jobDescription) {
        // İş ilanı metnini textarea'ya doldur
        jobDescriptionTextarea.value = response.data.jobDescription;
        
        // Clear link input
        if (jobLinkInput) {
          jobLinkInput.value = '';
        }
        
        showSuccess('İş ilanı metni başarıyla çekildi! Ön yazı oluşturuluyor...');
        
        // Link analiz edildikten sonra direkt ön yazı oluşturma akışını başlat
        // Önce pozisyon sor, sonra ön yazı oluştur
        setTimeout(() => {
          autoGenerateCoverLetterAfterLinkAnalysis();
        }, 500);
      } else {
        throw new Error(response.error?.message || 'İş ilanı metni çekilemedi.');
      }
    } catch (error) {
      console.error('Scrape job posting error:', error);
      
      // Show error message - SADECE hata mesajı göster, HİÇBİR popup açma
      if (jobDescriptionError) {
        jobDescriptionError.classList.remove('hidden');
      }
      
      const errorMsg = error.message || 'Bilinmeyen hata';
      let userFriendlyMsg = 'İş ilanı metni çekilemedi. ';
      
      if (errorMsg.includes('timeout') || errorMsg.includes('Navigation') || errorMsg.includes('detached')) {
        userFriendlyMsg += 'Link analiz edilemedi. Alternatif olarak "Ekran Görüntüsü Yükle" butonunu kullanabilir veya metni manuel olarak yapıştırabilirsiniz.';
      } else if (errorMsg.includes('desteklenmiyor')) {
        userFriendlyMsg += 'Bu site şu anda desteklenmiyor. "Ekran Görüntüsü Yükle" butonunu kullanabilir veya metni manuel olarak yapıştırabilirsiniz.';
      } else {
        userFriendlyMsg += '"Ekran Görüntüsü Yükle" butonunu kullanabilir veya metni manuel olarak yapıştırabilirsiniz.';
      }
      
      showError(userFriendlyMsg);
      
      // KRİTİK: Link analiz hatası sonrası HİÇBİR popup açma, sadece hata mesajı göster
    } finally {
      if (fetchLinkBtn) {
        fetchLinkBtn.disabled = false;
        fetchLinkBtn.innerHTML = 'Linki Analiz Et';
      }
      if (fetchFromLinkBtn) {
        fetchFromLinkBtn.disabled = false;
        fetchFromLinkBtn.innerHTML = '<span class="material-symbols-outlined text-sm">link</span><span>Linkten Çek</span>';
      }
    }
  }

  // Handle screenshot upload (for OCR)
  function handleScreenshotUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Trigger OCR
    processImageWithOCR(file);
  }

  // Handle OCR image upload
  function handleOcrImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Hide error message
    if (jobDescriptionError) {
      jobDescriptionError.classList.add('hidden');
    }

    // Trigger OCR
    processImageWithOCR(file);
  }

  // Process image with OCR using Backend API
  async function processImageWithOCR(imageFile) {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    // Show loading
    if (ocrLoading) {
      ocrLoading.classList.remove('hidden');
    }

    try {
      // Dosyayı base64'e çevir
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Backend API'ye gönder
      const response = await window.apiClient.parseImageForOCR(base64Image);

      if (response.success && response.data && response.data.jobDescription) {
        // Metni textarea'ya yaz
        jobDescriptionTextarea.value = response.data.jobDescription;
        showSuccess('Metin başarıyla ayıklandı! Ön yazı oluşturuluyor...');
        
        // Hide error message if visible
        if (jobDescriptionError) {
          jobDescriptionError.classList.add('hidden');
        }
        
        // OCR'dan sonra direkt ön yazı oluşturma akışını başlat
        setTimeout(() => {
          autoGenerateCoverLetterAfterLinkAnalysis();
        }, 500);
      } else {
        throw new Error(response.error?.message || 'Metin ayıklanamadı.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      
      // Show error message with manual option
      if (jobDescriptionError) {
        jobDescriptionError.classList.remove('hidden');
      }
      
      const errorMsg = error.message || 'Bilinmeyen hata';
      let userFriendlyMsg = 'OCR işlemi başarısız oldu. ';
      
      if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        userFriendlyMsg += 'Backend servisi şu anda kullanılamıyor. Lütfen internet bağlantınızı kontrol edin veya metni manuel olarak yapıştırın.';
      } else if (errorMsg.includes('language') || errorMsg.includes('lang')) {
        userFriendlyMsg += 'OCR dil paketi yüklenemedi. Lütfen daha sonra tekrar deneyin veya metni manuel olarak yapıştırın.';
      } else if (errorMsg.includes('yeterli metin')) {
        userFriendlyMsg += 'Görselden yeterli metin ayıklanamadı. Lütfen daha net bir görsel deneyin veya metni manuel olarak yapıştırın.';
      } else {
        userFriendlyMsg += 'Lütfen metni manuel olarak yapıştırın.';
      }
      
      showError(userFriendlyMsg);
    } finally {
      if (ocrLoading) {
        ocrLoading.classList.add('hidden');
        const progressText = ocrLoading.querySelector('span:last-child');
        if (progressText) {
          progressText.textContent = 'Yapay zeka metni ayıklıyor...';
        }
      }
      if (screenshotInput) screenshotInput.value = '';
      if (ocrImageInput) ocrImageInput.value = '';
    }
  }

  // Handle save cover letter
  async function handleSaveCoverLetter() {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    if (!coverLetterEditor) {
      showError('Ön yazı editörü bulunamadı.');
      return;
    }

    // Editor içeriğini al (plain text olarak)
    const textContent = coverLetterEditor.innerText || coverLetterEditor.textContent || '';

    if (textContent.trim().length < 50) {
      showError('Ön yazı çok kısa. Lütfen en az 50 karakter girin.');
      return;
    }

    // CV bilgilerinden pozisyon ve şirket bilgisini çıkar
    const resumeId = resumeSelect ? resumeSelect.value : null;
    const jobDescription = jobDescriptionTextarea ? jobDescriptionTextarea.value.trim() : '';
    
    // Pozisyon ve şirket bilgisini job description'dan çıkarmaya çalış
    let position = '';
    let company = '';
    
    if (jobDescription) {
      // Pozisyon çıkarma
      const positionMatch = jobDescription.match(/(?:pozisyon|position|iş|job|görev|role)[\s:]+([^\n]{5,100})/i);
      if (positionMatch) {
        position = positionMatch[1].trim();
      }
      
      // Şirket çıkarma
      const companyMatch = jobDescription.match(/(?:şirket|company|firma|firm)[\s:]+([^\n]{3,100})/i);
      if (companyMatch) {
        company = companyMatch[1].trim();
      }
    }

    // Başlık oluştur
    const title = position 
      ? `Ön Yazı - ${position}${company ? ` (${company})` : ''}`
      : `Ön Yazı - ${new Date().toLocaleDateString('tr-TR')}`;

    // Loading state
    if (saveBtn) {
      saveBtn.disabled = true;
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span class="hidden sm:inline">Kaydediliyor...</span>';
      
      try {
        let response;
        
        if (currentCoverLetterId) {
          // Mevcut ön yazıyı güncelle
          response = await window.apiClient.updateCoverLetter(currentCoverLetterId, {
            title,
            content: textContent,
            recipient: 'Sayın İşe Alım Yöneticisi',
            company: company || null,
            position: position || null,
          });
        } else {
          // Yeni ön yazı oluştur
          response = await window.apiClient.createCoverLetter({
            title,
            content: textContent,
            recipient: 'Sayın İşe Alım Yöneticisi',
            company: company || null,
            position: position || null,
          });
          
          if (response.success && response.data && response.data.coverLetter) {
            currentCoverLetterId = response.data.coverLetter.id;
          }
        }

        if (response.success) {
          // Başarılı kayıt - butonu "Kaydedildi" durumuna geçir
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span><span class="hidden sm:inline">Kaydedildi</span>';
            saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            saveBtn.classList.remove('bg-primary', 'hover:bg-primary-dark');
            
            // 3 saniye sonra normal duruma dön
            setTimeout(() => {
              if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                saveBtn.classList.add('bg-primary', 'hover:bg-primary-dark');
              }
            }, 3000);
          }
          
          showSuccess('Ön yazı başarıyla kaydedildi! Belgelerim sayfasından görüntüleyebilirsiniz.');
        } else {
          throw new Error(response.error?.message || 'Kayıt başarısız oldu.');
        }
      } catch (error) {
        console.error('Save cover letter error:', error);
        const errorMsg = error.message || 'Bilinmeyen hata';
        let userFriendlyMsg = 'Ön yazı kaydedilemedi. ';
        
        if (errorMsg.includes('authenticated') || errorMsg.includes('giriş')) {
          userFriendlyMsg += 'Lütfen giriş yapın.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userFriendlyMsg += 'İnternet bağlantınızı kontrol edin.';
        } else {
          userFriendlyMsg += errorMsg;
        }
        
        showError(userFriendlyMsg);
      } finally {
        // Hata durumunda butonu normal duruma döndür
        if (saveBtn && !saveBtn.disabled) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
        }
      }
    }
  }

  // Handle download PDF
  async function handleDownloadPDF() {
    if (!coverLetterEditor) {
      showError('Ön yazı editörü bulunamadı.');
      return;
    }

    const content = coverLetterEditor.innerText || coverLetterEditor.textContent || '';

    if (content.trim().length < 50) {
      showError('Ön yazı çok kısa. Lütfen önce bir ön yazı oluşturun.');
      return;
    }

    // Create a new window with the cover letter content and use window.print()
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Popup engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ön Yazı</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
            }
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            padding: 2cm;
          }
          p {
            margin-bottom: 1em;
          }
        </style>
      </head>
      <body>
        ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  // Load cover letter for editing
  async function loadCoverLetterForEdit(coverLetterId) {
    if (!window.apiClient) {
      console.warn('API client not available');
      return;
    }

    try {
      const response = await window.apiClient.getCoverLetter(coverLetterId);
      if (response.success && response.data && response.data.coverLetter) {
        const coverLetter = response.data.coverLetter;
        currentCoverLetterId = coverLetter.id;
        
        // Editor içeriğini doldur
        if (coverLetterEditor) {
          // Content'i paragraflara böl ve ekle
          const paragraphs = coverLetter.content.split('\n\n').filter(p => p.trim());
          coverLetterEditor.innerHTML = '';
          paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph.trim();
            coverLetterEditor.appendChild(p);
          });
        }
        
        // Job description textarea'yı doldur (eğer position/company varsa)
        if (jobDescriptionTextarea && (coverLetter.position || coverLetter.company)) {
          let jobDesc = '';
          if (coverLetter.position) {
            jobDesc += `Pozisyon: ${coverLetter.position}\n`;
          }
          if (coverLetter.company) {
            jobDesc += `Şirket: ${coverLetter.company}\n`;
          }
          jobDescriptionTextarea.value = jobDesc;
        }
        
        showSuccess('Ön yazı yüklendi. Düzenleyebilirsiniz.');
      }
    } catch (error) {
      console.error('Failed to load cover letter:', error);
      showError('Ön yazı yüklenemedi.');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();





