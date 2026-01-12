// CV Eğitim AI Entegrasyonu
// Production-ready AI education description generation

(function () {
  'use strict';

  // DOM Elements
  let aiEducationWriteBtn;
  let aiSuggestionBtn;
  let aiSuggestionBtnText;
  let schoolNameInput;
  let degreeInput;
  let descriptionTextarea;

  // Initialize when DOM is ready
  function init() {
    aiEducationWriteBtn = document.getElementById('ai-education-write-btn');
    aiSuggestionBtn = document.getElementById('ai-education-suggestion-btn');
    aiSuggestionBtnText = document.getElementById('ai-education-suggestion-btn-text');
    schoolNameInput = document.getElementById('education-school-name');
    degreeInput = document.getElementById('education-degree');
    descriptionTextarea = document.getElementById('education-description');

    if (!aiEducationWriteBtn && !aiSuggestionBtn) {
      console.warn('CV Education AI: Required elements not found');
      return;
    }

    // Event listeners
    if (aiEducationWriteBtn) {
      aiEducationWriteBtn.addEventListener('click', handleAIWriteEducation);
    }

    if (aiSuggestionBtn) {
      aiSuggestionBtn.addEventListener('click', handleAISuggestion);
    }
  }

  // Get user's complete information from localStorage
  function getUserCompleteInfo() {
    const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');

    // Get experiences
    let experiences = [];
    try {
      experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
    } catch (e) {
      experiences = [];
    }

    // Get education
    let education = [];
    try {
      education = JSON.parse(localStorage.getItem('cv-education') || '[]');
    } catch (e) {
      education = [];
    }

    // Get skills
    let skills = [];
    try {
      skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
    } catch (e) {
      skills = [];
    }

    // Get languages
    let languages = [];
    try {
      languages = JSON.parse(localStorage.getItem('cv-languages') || '[]');
    } catch (e) {
      languages = [];
    }

    return {
      firstName: cvData['fullname-first'] || cvData.firstName || '',
      lastName: cvData['fullname-last'] || cvData.lastName || '',
      profession: cvData.profession || '',
      experience: experiences,
      education: education,
      skills: skills,
      languages: languages,
    };
  }

  // Handle "AI ile Eğitim Açıklaması Yazın" button click
  async function handleAIWriteEducation() {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
      window.location.href = 'giris.html';
      return;
    }

    // Prompt user for school name
    const schoolName = prompt('Okul adını girin (örn: İstanbul Teknik Üniversitesi):');
    if (!schoolName || schoolName.trim() === '') {
      return;
    }

    // Optional: Ask for degree/field
    const degree = prompt('Bölüm/Derece girin (opsiyonel, örn: Bilgisayar Mühendisliği, Lisans):') || '';

    // Set loading state
    if (aiEducationWriteBtn) {
      setLoadingState(aiEducationWriteBtn, true);
    }

    try {
      // Get user's complete information
      const personalInfo = getUserCompleteInfo();

      // Prepare context with all user information
      const context = {
        existingEducation: personalInfo.education || [],
        personalInfo: personalInfo,
      };

      // Call API
      const response = await window.apiClient.generateEducation(
        schoolName.trim(),
        degree.trim() || undefined,
        undefined, // field parameter
        context
      );

      if (response.success && response.data && response.data.description) {
        // Fill form fields
        if (schoolNameInput) {
          schoolNameInput.value = schoolName.trim();
          schoolNameInput.dispatchEvent(new Event('input'));
        }

        if (degreeInput && degree.trim()) {
          degreeInput.value = degree.trim();
          degreeInput.dispatchEvent(new Event('input'));
        }

        if (descriptionTextarea) {
          descriptionTextarea.value = response.data.description;
          descriptionTextarea.dispatchEvent(new Event('input'));

          // Scroll to textarea
          descriptionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showSuccess('Eğitim açıklaması başarıyla oluşturuldu!');
      } else {
        throw new Error(response.error?.message || 'Eğitim açıklaması oluşturulamadı.');
      }
    } catch (error) {
      console.error('AI education generation error:', error);
      let errorMessage = 'Eğitim açıklaması oluşturulurken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      // Parse specific error messages
      if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
        errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
      } else if (
        errorMsg.toLowerCase().includes('authenticated') ||
        errorMsg.toLowerCase().includes('giriş') ||
        errorMsg.toLowerCase().includes('login')
      ) {
        errorMessage = 'AI özelliğini kullanmak için giriş yapmanız gerekiyor.';
      } else if (
        errorMsg.toLowerCase().includes('not configured') ||
        errorMsg.toLowerCase().includes('contact support')
      ) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
        errorMessage = 'AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      showError(errorMessage);
    } finally {
      if (aiEducationWriteBtn) {
        setLoadingState(aiEducationWriteBtn, false);
      }
    }
  }

  // Handle "AI Önerisi Al" button click
  async function handleAISuggestion() {
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
      window.location.href = 'giris.html';
      return;
    }

    // Validation: Check if school name is filled
    if (!schoolNameInput || !schoolNameInput.value || schoolNameInput.value.trim() === '') {
      showError('Lütfen önce okul adını girin.');
      if (schoolNameInput) {
        schoolNameInput.focus();
      }
      return;
    }

    const schoolName = schoolNameInput.value.trim();
    const degree = degreeInput ? degreeInput.value.trim() : '';

    // Set loading state
    if (aiSuggestionBtn) {
      setLoadingState(aiSuggestionBtn, true);
    }

    if (aiSuggestionBtnText) {
      aiSuggestionBtnText.textContent = 'Yükleniyor...';
    }

    try {
      // Get user's complete information
      const personalInfo = getUserCompleteInfo();

      // Prepare context with all user information
      const context = {
        existingEducation: personalInfo.education || [],
        personalInfo: personalInfo,
      };

      // Call API
      const response = await window.apiClient.generateEducation(
        schoolName,
        degree || undefined,
        undefined, // field parameter
        context
      );

      if (response.success && response.data && response.data.description) {
        // Fill textarea with AI-generated description
        if (descriptionTextarea) {
          // If there's existing text, append with separator
          const existingText = descriptionTextarea.value.trim();
          const newText = response.data.description;

          if (existingText) {
            descriptionTextarea.value = existingText + '\n\n' + newText;
          } else {
            descriptionTextarea.value = newText;
          }

          descriptionTextarea.dispatchEvent(new Event('input'));

          // Scroll to textarea
          descriptionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showSuccess('AI önerisi başarıyla eklendi!');
      } else {
        throw new Error(response.error?.message || 'AI önerisi alınamadı.');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      let errorMessage = 'AI önerisi alınırken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      // Parse specific error messages
      if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
        errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
      } else if (
        errorMsg.toLowerCase().includes('authenticated') ||
        errorMsg.toLowerCase().includes('giriş') ||
        errorMsg.toLowerCase().includes('login')
      ) {
        errorMessage = 'AI özelliğini kullanmak için giriş yapmanız gerekiyor.';
      } else if (
        errorMsg.toLowerCase().includes('not configured') ||
        errorMsg.toLowerCase().includes('contact support')
      ) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
        errorMessage = 'AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.';
      } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      showError(errorMessage);
    } finally {
      if (aiSuggestionBtn) {
        setLoadingState(aiSuggestionBtn, false);
      }

      if (aiSuggestionBtnText) {
        aiSuggestionBtnText.textContent = 'AI Önerisi Al';
      }
    }
  }

  // Set loading state
  function setLoadingState(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Show error message
  function showError(message) {
    alert('Hata: ' + message);
    console.error('CV Education AI Error:', message);
  }

  // Show success message
  function showSuccess(message) {
    console.log('CV Education AI Success:', message);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();





