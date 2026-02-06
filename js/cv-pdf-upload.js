// CV PDF Upload and Parse
// 4-PHASE ARCHITECTURE: File Ownership → Text Acquisition → AI Parsing → Form Population
// PDF upload integrates with EXISTING CV Builder - appears in MAIN template preview

(function () {
  'use strict';

  let pdfUploadBtn;
  let pdfUploadInput;
  let pdfUploadStatus;
  let currentBlobURL = null; // For cleanup (if needed for future features)

  // Initialize
  function init() {
    console.log('🔧 CV PDF Upload: Initializing...');
    
    pdfUploadBtn = document.getElementById('pdf-upload-btn');
    pdfUploadInput = document.getElementById('pdf-upload-input');
    pdfUploadStatus = document.getElementById('pdf-upload-status');

    console.log('🔧 CV PDF Upload: Elements found:', {
      pdfUploadBtn: !!pdfUploadBtn,
      pdfUploadInput: !!pdfUploadInput,
      pdfUploadStatus: !!pdfUploadStatus,
    });

    if (!pdfUploadBtn || !pdfUploadInput) {
      console.warn('⚠️ CV PDF Upload: Required elements not found');
      return;
    }

    // Event listeners - IMMEDIATELY attach, NOT waiting for API client
    pdfUploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📂 Upload button clicked');
      pdfUploadInput.click();
    });

    pdfUploadInput.addEventListener('change', (e) => {
      console.log('📂 File selected:', e.target.files?.[0]?.name || 'no file');
      handlePDFUpload(e);
    });
    
    console.log('✅ CV PDF Upload: Event listeners attached (file selection ready)');
  }

  // ============================================================
  // PHASE 1: FILE OWNERSHIP (NO PREVIEW - PDF will appear in MAIN template preview)
  // ============================================================
  async function phase1_FileOwnership(file) {
    console.log('📄 PHASE 1: File Ownership');
    
    try {
      // Take ownership of File object
      // Note: We don't show PDF preview here - it will appear in MAIN template preview after parsing
      const blob = new Blob([file], { type: 'application/pdf' });
      
      // Generate Blob URL (for potential future use, but not displayed)
      if (currentBlobURL) {
        URL.revokeObjectURL(currentBlobURL); // Cleanup previous
      }
      currentBlobURL = URL.createObjectURL(blob);
      console.log('📄 File owned, blob URL created (not displayed)');
      
      console.log('✅ PHASE 1: COMPLETE - File ownership taken');
      return { blobURL: currentBlobURL, file };
      
    } catch (error) {
      console.error('❌ PHASE 1: FAILED -', error);
      throw new Error('PDF dosyası işlenemedi: ' + error.message);
    }
  }

  // ============================================================
  // PHASE 2: TEXT ACQUISITION (PDF.js + OCR)
  // ============================================================
  async function phase2_TextAcquisition(file) {
    console.log('📊 PHASE 2: Text Acquisition');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('📊 PDF file read, size:', arrayBuffer.byteLength, 'bytes');
      
      // Step 1: Try PDF.js text extraction
      console.log('📊 Attempting PDF.js text extraction...');
      let pdfText = '';
      
      try {
        pdfText = await extractTextFromPDF(arrayBuffer);
        console.log('✅ PDF.js extraction finished');
      } catch (extractError) {
        console.error('❌ PDF.js extraction failed:', extractError);
        throw new Error('PDF okunamadı: ' + (extractError.message || 'Bilinmeyen hata'));
      }
      
      const textLength = pdfText ? pdfText.trim().length : 0;
      console.log('📊 TEXT LENGTH:', textLength);
      console.log('📊 First 200 chars:', pdfText ? pdfText.substring(0, 200) : 'null');
      
      // Decision logic
      if (textLength > 500) {
        console.log('✅ Text length OK (> 500 chars)');
        return pdfText;
      } else if (textLength >= 200) {
        console.log('⚠️ SOFT WARNING: Text length 200-500 chars');
        return pdfText;
      } else {
        // < 200 chars → OCR REQUIRED
        console.log('⚠️ Text length < 200 chars, OCR REQUIRED');
        showStatus('PDF taranmış görünüyor, OCR ile analiz ediliyor...', 'loading');
        
        try {
          const ocrText = await extractTextWithOCR(arrayBuffer);
          const ocrLength = ocrText ? ocrText.trim().length : 0;
          console.log('📊 OCR TEXT LENGTH:', ocrLength);
          
          if (ocrLength >= 300) {
            console.log('✅ OCR successful (>= 300 chars)');
            return ocrText;
          } else if (ocrLength > 0 && textLength > 0) {
            // Combine both
            const combined = pdfText + '\n\n' + ocrText;
            console.log('⚠️ Combining PDF.js + OCR text');
            return combined;
          } else {
            // HARD FAIL
            console.error('❌ HARD FAIL: OCR result < 300 chars and PDF.js < 200 chars');
            throw new Error('PDF\'den yeterli metin çıkarılamadı (OCR: ' + ocrLength + ' chars, PDF.js: ' + textLength + ' chars). PDF\'in okunabilir olduğundan emin olun.');
          }
        } catch (ocrError) {
          console.error('❌ OCR failed:', ocrError);
          if (textLength === 0) {
            throw new Error('PDF\'den metin çıkarılamadı. PDF\'in metin içerdiğinden veya yüksek kaliteli bir tarama olduğundan emin olun.');
          }
          // Use PDF.js text if available
          console.log('⚠️ Using PDF.js text despite OCR failure');
          return pdfText;
        }
      }
    } catch (error) {
      console.error('❌ PHASE 2: FAILED -', error);
      throw error;
    }
  }

  // ============================================================
  // PHASE 3: AI PARSING (CLAUDE)
  // ============================================================
  async function phase3_AIParsing(pdfText) {
    console.log('🧠 PHASE 3: AI Parsing');
    
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('AI parsing requires non-empty text');
    }
    
    // Wait for API client
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('API client yüklenemedi. Lütfen sayfayı yenileyin.'));
      }, 5000);
      
      waitForAPIClient(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    if (!window.apiClient || typeof window.apiClient.parseCVFromPDF !== 'function') {
      throw new Error('parseCVFromPDF fonksiyonu bulunamadı.');
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('CV yüklemek için giriş yapmanız gerekiyor.');
    }
    
    console.log('🧠 Sending to AI, text length:', pdfText.length);
    
    try {
      const response = await window.apiClient.parseCVFromPDF(pdfText);
      
      console.log('🧠 AI response received:', {
        success: response.success,
        hasData: !!(response.data),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });
      
      // Validate JSON schema
      if (!response.success || !response.data) {
        throw new Error('AI yanıtı geçersiz: ' + (response.error?.message || 'Bilinmeyen hata'));
      }
      
      // Validate required fields exist (at least one)
      const hasExperiences = Array.isArray(response.data.experiences) && response.data.experiences.length > 0;
      const hasEducation = Array.isArray(response.data.education) && response.data.education.length > 0;
      const hasSkills = Array.isArray(response.data.skills) && response.data.skills.length > 0;
      const hasPersonalInfo = !!(response.data.firstName || response.data.lastName || response.data.email);
      
      if (!hasExperiences && !hasEducation && !hasSkills && !hasPersonalInfo) {
        throw new Error('AI yanıtı boş: Hiçbir veri çıkarılamadı.');
      }
      
      console.log('✅ PHASE 3: COMPLETE - Valid JSON received');
      return response.data;
      
    } catch (error) {
      console.error('❌ PHASE 3: FAILED -', error);
      throw new Error('CV analiz edilemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  }

  // ============================================================
  // NORMALIZATION LAYER: AI JSON → Internal CV Schema
  // ============================================================
  function normalizeParsedCVToEditorState(parsedData) {
    console.log('🔄 NORMALIZATION: Converting AI JSON to Internal CV Schema');
    
    // Normalize to Internal CV Schema (same as manual CV creation)
    const normalizedState = {
      // Personal Info (cv-builder-data format)
      'fullname-first': parsedData.firstName || '',
      'fullname-last': parsedData.lastName || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      location: parsedData.location || '',
      profession: parsedData.profession || '',
      website: parsedData.website || '',
      summary: parsedData.summary || '',
      
      // Experiences (normalized format)
      experiences: (parsedData.experiences || []).map(exp => ({
        jobTitle: exp.jobTitle || exp.title || '',
        company: exp.company || '',
        startMonth: exp.startMonth || '',
        startYear: exp.startYear || '',
        endMonth: exp.endMonth || '',
        endYear: exp.endYear || '',
        isCurrent: exp.isCurrent || false,
        description: exp.description || '',
      })),
      
      // Education (normalized format)
      education: (parsedData.education || []).map(edu => ({
        school: edu.school || edu.schoolName || '',
        degree: edu.degree || edu.field || '',
        startYear: edu.startYear || '',
        endYear: edu.endYear || '',
        isCurrent: edu.isCurrent || false,
      })),
      
      // Skills (array of strings)
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      
      // Languages (normalized format)
      languages: (parsedData.languages || []).map(lang => ({
        language: lang.name || lang.language || '',
        level: lang.level || '',
      })),
    };
    
    console.log('✅ NORMALIZATION: Complete', {
      personalInfoFields: Object.keys(normalizedState).filter(k => !['experiences', 'education', 'skills', 'languages'].includes(k)).length,
      experiencesCount: normalizedState.experiences.length,
      educationCount: normalizedState.education.length,
      skillsCount: normalizedState.skills.length,
      languagesCount: normalizedState.languages.length,
    });
    
    return normalizedState;
  }

  // ============================================================
  // PHASE 4: FORM POPULATION
  // ============================================================
  async function phase4_FormPopulation(parsedData) {
    console.log('✅ PHASE 4: Form Population');
    
    try {
      // Clear ALL previous CV data FIRST
      console.log('🔧 Clearing previous CV data...');
      
      // Clear localStorage
      localStorage.removeItem('cv-builder-data');
      localStorage.removeItem('cv-experiences');
      localStorage.removeItem('cv-education');
      localStorage.removeItem('cv-skills');
      localStorage.removeItem('cv-languages');
      
      // Clear form fields
      const formFields = [
        'fullname-first', 'fullname-last', 'email', 'phone', 'location', 
        'profession', 'website', 'summary-textarea'
      ];
      
      formFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // Reset UI lists (if functions exist)
      if (window.renderExperiences) {
        const expList = document.getElementById('experience-list');
        if (expList) expList.innerHTML = '';
      }
      
      console.log('✅ Previous data cleared');
      
      // NORMALIZATION LAYER: Convert AI JSON to Internal CV Schema
      const normalizedState = normalizeParsedCVToEditorState(parsedData);
      
      // Write to SINGLE SOURCE OF TRUTH
      // 1. Personal info → cv-builder-data
      // 🔒 KRİTİK: isSampleData: false flag'i ekle - Bu gerçek PDF upload sonrası veri
      const cvBuilderData = {
        isSampleData: false, // 🔒 KRİTİK: Bu gerçek kullanıcı verisi (PDF upload)
        isPreviewOnly: false, // Gerçek veri, sadece preview değil
        isFromPDFUpload: true, // 🔒 KRİTİK: PDF upload ile geldiğini belirt
        'fullname-first': normalizedState['fullname-first'],
        'fullname-last': normalizedState['fullname-last'],
        email: normalizedState.email,
        phone: normalizedState.phone,
        location: normalizedState.location,
        profession: normalizedState.profession,
        website: normalizedState.website,
        summary: normalizedState.summary,
      };
      localStorage.setItem('cv-builder-data', JSON.stringify(cvBuilderData));
      console.log('✅ cv-builder-data written');
      
      // 2. Experiences → cv-experiences (separate localStorage)
      localStorage.setItem('cv-experiences', JSON.stringify(normalizedState.experiences));
      console.log('✅ cv-experiences written:', normalizedState.experiences.length);
      
      // 3. Education → cv-education (separate localStorage)
      localStorage.setItem('cv-education', JSON.stringify(normalizedState.education));
      console.log('✅ cv-education written:', normalizedState.education.length);
      
      // 4. Skills → cv-skills (separate localStorage)
      localStorage.setItem('cv-skills', JSON.stringify(normalizedState.skills));
      console.log('✅ cv-skills written:', normalizedState.skills.length);
      
      // 5. Languages → cv-languages (separate localStorage)
      localStorage.setItem('cv-languages', JSON.stringify(normalizedState.languages));
      console.log('✅ cv-languages written:', normalizedState.languages.length);
      
      // Populate form fields (triggers live preview)
      fillFormWithCVData(normalizedState);
      
      // Verify at least one field changed
      let fieldChanged = false;
      if (normalizedState['fullname-first'] || normalizedState['fullname-last'] || normalizedState.email) {
        fieldChanged = true;
      }
      if (normalizedState.experiences.length > 0) {
        fieldChanged = true;
      }
      if (normalizedState.education.length > 0) {
        fieldChanged = true;
      }
      
      if (!fieldChanged) {
        throw new Error('Form alanları doldurulamadı: Hiçbir veri uygulanamadı.');
      }
      
      // TRIGGER LIVE PREVIEW UPDATE
      console.log('🔄 Triggering live preview update...');
      
      // Wait a bit for DOM updates
      setTimeout(() => {
        // Trigger preview data loader
        if (window.loadPreviewData) {
          window.loadPreviewData();
          console.log('✅ loadPreviewData() called');
        }
        
        // Trigger live preview init
        if (window.initLivePreview) {
          window.initLivePreview();
          console.log('✅ initLivePreview() called');
        }
        
        // Trigger experience render
        if (window.renderExperiences) {
          window.renderExperiences();
          console.log('✅ renderExperiences() called');
        }
        
        // Trigger preview experiences
        if (window.renderPreviewExperiences) {
          window.renderPreviewExperiences();
          console.log('✅ renderPreviewExperiences() called');
        }
        
        // Re-render MAIN template preview with new data (SINGLE SOURCE OF TRUTH)
        if (window.CVTemplateRenderer && window.CVTemplateRenderer.render) {
          const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
          const mainPreviewContainer = document.querySelector('.a4-paper');
          if (mainPreviewContainer) {
            // Render template with current state (from localStorage)
            const html = window.CVTemplateRenderer.render(selectedTemplate);
            mainPreviewContainer.innerHTML = html;
            console.log('✅ MAIN template preview re-rendered with PDF data');
            
            // Re-trigger preview updates after template render
            setTimeout(() => {
              if (window.loadPreviewData) {
                window.loadPreviewData();
                console.log('✅ loadPreviewData() re-triggered after template render');
              }
              if (window.initLivePreview) {
                window.initLivePreview();
                console.log('✅ initLivePreview() re-triggered after template render');
              }
              if (window.renderPreviewExperiences) {
                window.renderPreviewExperiences();
                console.log('✅ renderPreviewExperiences() re-triggered after template render');
              }
            }, 100);
          } else {
            console.error('❌ MAIN preview container (.a4-paper) not found');
          }
        } else {
          console.error('❌ CVTemplateRenderer not available');
        }
      }, 300);
      
      console.log('✅ PHASE 4: COMPLETE - Form populated, state written, preview triggered');
      
    } catch (error) {
      console.error('❌ PHASE 4: FAILED -', error);
      throw error;
    }
  }

  // ============================================================
  // MAIN HANDLER: 4-PHASE FLOW
  // ============================================================
  async function handlePDFUpload(event) {
    // 🔒 KRİTİK: SADECE kullanıcı PDF upload ettiğinde çalışmalı
    // Default örnek CV'ler için bu fonksiyon ÇAĞRILMAMALI
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      showStatus('Lütfen geçerli bir PDF dosyası seçin.', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showStatus('Dosya boyutu 10MB\'dan büyük olamaz.', 'error');
      return;
    }

    // Set loading state
    console.log('🔧 CV PDF Upload: Starting 4-phase flow');
    showStatus('PDF yükleniyor...', 'loading');
    setLoadingState(true);

    let phase1Result = null;
    let phase2Result = null;
    let phase3Result = null;

    try {
      // PHASE 1: File Ownership + Preview
      phase1Result = await phase1_FileOwnership(file);
      
      // PHASE 2: Text Acquisition
      showStatus('PDF metni çıkarılıyor...', 'loading');
      phase2Result = await phase2_TextAcquisition(file);
      
      // PHASE 3: AI Parsing
      showStatus('AI ile CV analiz ediliyor...', 'loading');
      phase3Result = await phase3_AIParsing(phase2Result);
      
      // PHASE 4: Form Population
      showStatus('Form alanları dolduruluyor...', 'loading');
      await phase4_FormPopulation(phase3Result);
      
      // SUCCESS: Verify MAIN template preview is updated
      const mainPreviewContainer = document.querySelector('.a4-paper');
      const previewVisible = mainPreviewContainer && 
                            mainPreviewContainer.offsetParent !== null &&
                            mainPreviewContainer.innerHTML.trim().length > 0;
      
      if (!previewVisible) {
        throw new Error('Ana CV önizleme güncellenemedi - başarı kabul edilemez');
      }
      
      // Verify state was written
      const stateCheck = {
        hasBuilderData: !!localStorage.getItem('cv-builder-data'),
        hasExperiences: !!localStorage.getItem('cv-experiences'),
        experiencesCount: JSON.parse(localStorage.getItem('cv-experiences') || '[]').length,
      };
      
      console.log('✅ State verification:', stateCheck);
      
      if (!stateCheck.hasBuilderData && stateCheck.experiencesCount === 0) {
        throw new Error('CV state yazılamadı - başarı kabul edilemez');
      }
      
      showStatus('CV başarıyla yüklendi ve form alanları dolduruldu!', 'success');
      console.log('✅ ALL PHASES COMPLETE - Upload successful, MAIN preview updated');
      
      // KRİTİK: PDF upload sonrası sadece current-resume-id'yi temizle
      // AI tarafından doldurulan localStorage verileri (cv-builder-data, cv-experiences, vb.) 
      // KALMALI çünkü bunlar form doldurma için gerekli
      // Bu veriler "Bitir ve Tamamla" butonuna basıldığında yeni resume olarak kaydedilecek
      localStorage.removeItem('current-resume-id');
      console.log('🆕 PDF upload: Cleared current-resume-id, CV data preserved for form display');
      
      // Clear file input for next upload
      pdfUploadInput.value = '';
      
    } catch (error) {
      console.error('❌ PDF upload error:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Keep preview visible even on error (user can see what they uploaded)
      // But show error message
      showStatus('Hata: ' + (error.message || 'PDF yüklenirken bir sorun oluştu.'), 'error');
      
    } finally {
      // CRITICAL: Always clear loading state
      console.log('🔧 Loading state cleared');
      setLoadingState(false);
    }
  }

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  // Wait for API client (with timeout)
  function waitForAPIClient(callback, timeout = 5000, startTime = Date.now()) {
    if (window.apiClient && typeof window.apiClient.parseCVFromPDF === 'function') {
      callback();
    } else {
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        throw new Error('API client yüklenemedi. Lütfen sayfayı yenileyin.');
      }
      setTimeout(() => waitForAPIClient(callback, timeout, startTime), 100);
    }
  }

  // Extract text from PDF using PDF.js
  async function extractTextFromPDF(arrayBuffer) {
    if (typeof pdfjsLib === 'undefined') {
      await loadPDFJS();
    }

    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('✅ PDF loaded, pages:', pdf.numPages);

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error('PDF okunamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  }

  // Load PDF.js library
  async function loadPDFJS() {
    return new Promise((resolve, reject) => {
      if (typeof pdfjsLib !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = () => reject(new Error('PDF.js kütüphanesi yüklenemedi'));
      document.head.appendChild(script);
    });
  }

  // Extract text from PDF using OCR (Tesseract.js)
  async function extractTextWithOCR(arrayBuffer) {
    console.log('🔧 Starting OCR extraction...');
    
    if (typeof Tesseract === 'undefined') {
      await loadTesseractJS();
    }

    try {
      if (typeof pdfjsLib === 'undefined') {
        await loadPDFJS();
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('✅ PDF loaded for OCR, pages:', pdf.numPages);

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔧 Processing page ${pageNum}/${pdf.numPages} with OCR...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // OCR with timeout (30 seconds per page)
        const ocrPromise = Tesseract.recognize(canvas, 'tur+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`🔧 OCR progress page ${pageNum}: ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`OCR timeout for page ${pageNum} (30s)`)), 30000);
        });

        const { data: { text } } = await Promise.race([ocrPromise, timeoutPromise]);

        fullText += text.trim() + '\n\n';
        canvas.remove();
      }

      return fullText.trim();
    } catch (error) {
      console.error('❌ OCR extraction error:', error);
      throw new Error('OCR işlemi başarısız: ' + (error.message || 'Bilinmeyen hata'));
    }
  }

  // Load Tesseract.js library
  async function loadTesseractJS() {
    return new Promise((resolve, reject) => {
      if (typeof Tesseract !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Tesseract.js kütüphanesi yüklenemedi'));
      document.head.appendChild(script);
    });
  }

  // Fill form fields with normalized CV data (Internal CV Schema format)
  function fillFormWithCVData(normalizedState) {
    console.log('🔧 Filling form with normalized data:', normalizedState);

    // Personal Information (using normalized state keys)
    if (normalizedState['fullname-first']) {
      const el = document.getElementById('fullname-first');
      if (el) { el.value = normalizedState['fullname-first']; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState['fullname-last']) {
      const el = document.getElementById('fullname-last');
      if (el) { el.value = normalizedState['fullname-last']; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState.email) {
      const el = document.getElementById('email');
      if (el) { el.value = normalizedState.email; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState.phone) {
      const el = document.getElementById('phone');
      if (el) { el.value = normalizedState.phone; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState.location) {
      const el = document.getElementById('location');
      if (el) { el.value = normalizedState.location; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState.profession) {
      const el = document.getElementById('profession');
      if (el) { el.value = normalizedState.profession; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    if (normalizedState.website) {
      const el = document.getElementById('website');
      if (el) { el.value = normalizedState.website; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    // Summary
    if (normalizedState.summary) {
      const el = document.getElementById('summary-textarea');
      if (el) { el.value = normalizedState.summary; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    // Note: Experiences, Education, Skills, Languages are already written to localStorage in phase4
    // Form inputs will be populated by existing form managers (cv-experience-manager.js, etc.)
  }

  // Show status message
  function showStatus(message, type) {
    if (!pdfUploadStatus) return;
    
    pdfUploadStatus.textContent = message;
    pdfUploadStatus.classList.remove('hidden', 'text-slate-500', 'text-red-500', 'text-green-500');
    
    if (type === 'error') {
      pdfUploadStatus.classList.add('text-red-500');
    } else if (type === 'success') {
      pdfUploadStatus.classList.add('text-green-500');
    } else {
      pdfUploadStatus.classList.add('text-slate-500');
    }
  }

  // Set loading state
  function setLoadingState(isLoading) {
    if (!pdfUploadBtn) return;
    
    pdfUploadBtn.disabled = isLoading;
    if (isLoading) {
      pdfUploadBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      pdfUploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔧 CV PDF Upload: DOM ready, initializing...');
      init();
    });
  } else {
    console.log('🔧 CV PDF Upload: DOM already ready, initializing...');
    init();
  }
})();
