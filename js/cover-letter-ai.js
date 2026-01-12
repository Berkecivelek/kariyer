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

  // Initialize when DOM is ready
  function init() {
    resumeSelect = document.getElementById('resume-select');
    jobDescriptionTextarea = document.getElementById('job-description');
    toneRadios = document.querySelectorAll('input[name="tone"]');
    generateBtn = document.getElementById('generate-cover-letter-btn');
    generateBtnText = document.getElementById('generate-btn-text');
    coverLetterEditor = document.getElementById('cover-letter-editor');

    if (!generateBtn || !coverLetterEditor) {
      console.warn('Cover letter AI: Required elements not found');
      return;
    }

    // Load user's resumes
    loadResumes();

    // Event listeners
    generateBtn.addEventListener('click', handleGenerateCoverLetter);
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

      const response = await window.apiClient.getResumes();

      if (response.success && Array.isArray(response.data)) {
        // Clear existing options (except first one)
        resumeSelect.innerHTML = '<option value="">Özgeçmiş Seçin...</option>';

        // Add resume options
        response.data.forEach((resume) => {
          const option = document.createElement('option');
          option.value = resume.id;
          option.textContent = `${resume.title || 'Özgeçmiş'} - ${resume.templateId || 'modern'}`;
          resumeSelect.appendChild(option);
        });

        // If there's a current resume ID in localStorage, select it
        const currentResumeId = localStorage.getItem('current-resume-id');
        if (currentResumeId) {
          resumeSelect.value = currentResumeId;
        }
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
      // Show error to user
      showError('Özgeçmişler yüklenirken bir hata oluştu.');
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

    // Get hedef pozisyon from job description or prompt user
    let hedefPozisyon = '';
    const jobDesc = jobDescriptionTextarea.value.trim();
    
    // Try to extract position from job description (simple heuristic)
    if (jobDesc) {
      // Look for common patterns like "Pozisyon:", "İlan:", etc.
      const positionMatch = jobDesc.match(/(?:pozisyon|ilan|iş|görev)[\s:]+([^\n]+)/i);
      if (positionMatch) {
        hedefPozisyon = positionMatch[1].trim();
      }
    }

    // If still no position, prompt user
    if (!hedefPozisyon || hedefPozisyon.length < 3) {
      hedefPozisyon = prompt('Hedef pozisyonu girin (örn: Kıdemli Yazılım Geliştirici):');
      if (!hedefPozisyon || hedefPozisyon.trim() === '') {
        showError('Hedef pozisyon gereklidir.');
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
      // Call API
      const response = await window.apiClient.generateCoverLetter(resumeId, hedefPozisyon, ton);

      if (response.success && response.data && response.data.coverLetter) {
        // Update editor with generated cover letter
        updateEditorContent(response.data.coverLetter);
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();





