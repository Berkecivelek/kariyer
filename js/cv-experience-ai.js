// CV Deneyim AI Entegrasyonu
// Production-ready AI experience generation
// REFERENCE: cover-letter-ai.js (GOLD STANDARD)

(function () {
  'use strict';

  // DOM Elements
  let aiExperienceWriteBtn;
  let aiSuggestionBtn;
  let aiSuggestionBtnText;
  let jobTitleInput;
  let companyInput;
  let descriptionTextarea;

  // Initialize when DOM is ready
  function init() {
    console.log('🔧 CV Experience AI: Initializing...');
    
    aiExperienceWriteBtn = document.getElementById('ai-experience-write-btn');
    aiSuggestionBtn = document.getElementById('ai-experience-suggestion-btn');
    aiSuggestionBtnText = document.getElementById('ai-suggestion-btn-text');
    jobTitleInput = document.getElementById('experience-job-title');
    companyInput = document.getElementById('experience-company');
    descriptionTextarea = document.getElementById('experience-description');

    // Log element detection
    console.log('🔧 CV Experience AI: Elements found:', {
      aiExperienceWriteBtn: !!aiExperienceWriteBtn,
      aiSuggestionBtn: !!aiSuggestionBtn,
      jobTitleInput: !!jobTitleInput,
      companyInput: !!companyInput,
      descriptionTextarea: !!descriptionTextarea,
    });

    if (!aiExperienceWriteBtn && !aiSuggestionBtn) {
      console.warn('CV Experience AI: Required elements not found');
      return;
    }

    // Event listeners - exactly once, following Cover Letter pattern
    if (aiExperienceWriteBtn) {
      // Remove any existing listeners by cloning
      const newBtn = aiExperienceWriteBtn.cloneNode(true);
      aiExperienceWriteBtn.parentNode.replaceChild(newBtn, aiExperienceWriteBtn);
      aiExperienceWriteBtn = newBtn;
      
      aiExperienceWriteBtn.addEventListener('click', handleAIWriteExperience);
      console.log('✅ CV Experience AI: "AI ile Deneyim Yazın" button listener attached');
    }

    if (aiSuggestionBtn) {
      // Remove any existing listeners by cloning
      const newBtn = aiSuggestionBtn.cloneNode(true);
      aiSuggestionBtn.parentNode.replaceChild(newBtn, aiSuggestionBtn);
      aiSuggestionBtn = newBtn;
      
      aiSuggestionBtn.addEventListener('click', handleAISuggestion);
      console.log('✅ CV Experience AI: "AI Önerisi Al" button listener attached');
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

  // Handle "AI ile Deneyim Yazın" button click
  // REFERENCE: handleGenerateCoverLetter from cover-letter-ai.js
  async function handleAIWriteExperience() {
    console.log('🔧 CV Experience AI: "AI ile Deneyim Yazın" button clicked');
    
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    // Validation - following Cover Letter pattern
    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
      window.location.href = 'giris.html';
      return;
    }

    // Prompt user for job title (required)
    const jobTitle = prompt('İş unvanınızı girin (örn: Reklamcı, Yazılım Mühendisi):');
    if (!jobTitle || jobTitle.trim() === '') {
      console.log('🔧 CV Experience AI: User cancelled or empty job title');
      return;
    }

    // Optional: Ask for company
    const company = prompt('Şirket adını girin (opsiyonel):') || '';

    // Set loading state - following Cover Letter pattern
    setLoadingState(true);

    try {
      console.log('🔧 CV Experience AI: Calling API with:', { jobTitle: jobTitle.trim(), company: company.trim() || undefined });
      
      // Get user's complete information
      const personalInfo = getUserCompleteInfo();

      // Prepare context with all user information
      const context = {
        existingExperience: personalInfo.experience || [],
        skills: personalInfo.skills || [],
        profession: personalInfo.profession || '',
        personalInfo: personalInfo,
      };

      // Call API - following Cover Letter pattern exactly
      console.log('🔧 CV Experience AI: Calling API with payload:', {
        jobTitle: jobTitle.trim(),
        company: company.trim() || undefined,
        contextKeys: Object.keys(context),
        contextExperienceCount: context.existingExperience?.length || 0,
        contextSkillsCount: context.skills?.length || 0,
      });
      
      const response = await window.apiClient.generateExperience(
        jobTitle.trim(),
        company.trim() || undefined,
        context
      );

      console.log('🔧 CV Experience AI: API response received:', {
        success: response.success,
        hasData: !!(response.data),
        hasDescription: !!(response.data && response.data.description),
        descriptionLength: response.data?.description?.length || 0,
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      // Response validation - following Cover Letter AI pattern exactly
      console.log('🔧 CV Experience AI: Response validation:', {
        hasSuccess: 'success' in response,
        success: response.success,
        hasData: !!(response.data),
        hasDescription: !!(response.data && response.data.description),
        descriptionType: response.data?.description ? typeof response.data.description : 'undefined',
        descriptionLength: response.data?.description?.length || 0,
      });

      if (response.success && response.data && response.data.description) {
        const description = response.data.description;
        console.log('🔧 CV Experience AI: Description received, length:', description.length);
        
        // Fill form fields - following Cover Letter pattern
        if (jobTitleInput) {
          jobTitleInput.value = jobTitle.trim();
          jobTitleInput.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('✅ CV Experience AI: Job title field updated');
        } else {
          console.warn('⚠️ CV Experience AI: jobTitleInput element not found');
        }

        if (companyInput && company.trim()) {
          companyInput.value = company.trim();
          companyInput.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('✅ CV Experience AI: Company field updated');
        }

        if (descriptionTextarea) {
          descriptionTextarea.value = description;
          descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('✅ CV Experience AI: Description field updated, length:', description.length);

          // Scroll to textarea
          descriptionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.error('❌ CV Experience AI: descriptionTextarea element not found!');
          throw new Error('Açıklama alanı bulunamadı.');
        }

        showSuccess('Deneyim açıklaması başarıyla oluşturuldu!');
        console.log('✅ CV Experience AI: Experience description generated successfully');
      } else {
        console.error('❌ CV Experience AI: Invalid response structure:', {
          response,
          expected: { success: true, data: { description: 'string' } },
        });
        throw new Error(response.error?.message || 'Deneyim açıklaması oluşturulamadı.');
      }
    } catch (error) {
      console.error('❌ CV Experience AI: Generation error:', error);
      let errorMessage = 'Deneyim açıklaması oluşturulurken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      // Parse specific error messages - following Cover Letter pattern
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
      setLoadingState(false);
    }
  }

  // Handle "AI Önerisi Al" button click
  // REFERENCE: handleGenerateCoverLetter from cover-letter-ai.js
  async function handleAISuggestion() {
    console.log('🔧 CV Experience AI: "AI Önerisi Al" button clicked');
    
    if (!window.apiClient) {
      showError('API client bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    // Validation - following Cover Letter pattern
    const token = localStorage.getItem('authToken');
    if (!token) {
      showError('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
      window.location.href = 'giris.html';
      return;
    }

    // Validation: Check if job title is filled
    if (!jobTitleInput || !jobTitleInput.value || jobTitleInput.value.trim() === '') {
      showError('Lütfen önce iş unvanını girin.');
      if (jobTitleInput) {
        jobTitleInput.focus();
      }
      return;
    }

    const jobTitle = jobTitleInput.value.trim();
    const company = companyInput ? companyInput.value.trim() : '';

    // Set loading state - following Cover Letter pattern
    setLoadingState(true);

    try {
      console.log('🔧 CV Experience AI: Calling API for suggestion with:', { jobTitle, company: company || undefined });
      
      // Get user's complete information
      const personalInfo = getUserCompleteInfo();

      // Prepare context with all user information
      const context = {
        existingExperience: personalInfo.experience || [],
        skills: personalInfo.skills || [],
        profession: personalInfo.profession || '',
        personalInfo: personalInfo,
      };

      // Call API - following Cover Letter pattern exactly
      console.log('🔧 CV Experience AI: Calling API for suggestion with payload:', {
        jobTitle,
        company: company || undefined,
        contextKeys: Object.keys(context),
        contextExperienceCount: context.existingExperience?.length || 0,
        contextSkillsCount: context.skills?.length || 0,
      });
      
      const response = await window.apiClient.generateExperience(
        jobTitle,
        company || undefined,
        context
      );

      console.log('🔧 CV Experience AI: Suggestion API response received:', {
        success: response.success,
        hasData: !!(response.data),
        hasDescription: !!(response.data && response.data.description),
        descriptionLength: response.data?.description?.length || 0,
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      // Response validation - following Cover Letter AI pattern exactly
      console.log('🔧 CV Experience AI: Suggestion response validation:', {
        hasSuccess: 'success' in response,
        success: response.success,
        hasData: !!(response.data),
        hasDescription: !!(response.data && response.data.description),
        descriptionType: response.data?.description ? typeof response.data.description : 'undefined',
        descriptionLength: response.data?.description?.length || 0,
      });

      if (response.success && response.data && response.data.description) {
        const newText = response.data.description;
        console.log('🔧 CV Experience AI: Suggestion received, length:', newText.length);
        
        // Fill textarea with AI-generated description - following Cover Letter pattern
        if (descriptionTextarea) {
          // If there's existing text, append with separator
          const existingText = descriptionTextarea.value.trim();

          if (existingText) {
            descriptionTextarea.value = existingText + '\n\n' + newText;
            console.log('✅ CV Experience AI: Suggestion appended to existing text');
          } else {
            descriptionTextarea.value = newText;
            console.log('✅ CV Experience AI: Suggestion set as new text');
          }

          descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('✅ CV Experience AI: Input event dispatched');

          // Scroll to textarea
          descriptionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.error('❌ CV Experience AI: descriptionTextarea element not found!');
          throw new Error('Açıklama alanı bulunamadı.');
        }

        showSuccess('AI önerisi başarıyla eklendi!');
        console.log('✅ CV Experience AI: Suggestion added successfully');
      } else {
        console.error('❌ CV Experience AI: Invalid suggestion response structure:', {
          response,
          expected: { success: true, data: { description: 'string' } },
        });
        throw new Error(response.error?.message || 'AI önerisi alınamadı.');
      }
    } catch (error) {
      console.error('❌ CV Experience AI: Suggestion error:', error);
      let errorMessage = 'AI önerisi alınırken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      // Parse specific error messages - following Cover Letter pattern
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
      setLoadingState(false);
    }
  }

  // Set loading state
  // REFERENCE: setLoadingState from cover-letter-ai.js
  function setLoadingState(isLoading) {
    // Handle "AI ile Deneyim Yazın" button
    if (aiExperienceWriteBtn) {
      aiExperienceWriteBtn.disabled = isLoading;
      if (isLoading) {
        aiExperienceWriteBtn.textContent = 'Oluşturuluyor...';
        aiExperienceWriteBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        aiExperienceWriteBtn.textContent = 'Dene';
        aiExperienceWriteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    // Handle "AI Önerisi Al" button
    if (aiSuggestionBtn) {
      aiSuggestionBtn.disabled = isLoading;
      if (isLoading) {
        if (aiSuggestionBtnText) {
          aiSuggestionBtnText.textContent = 'Yükleniyor...';
        }
        aiSuggestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        if (aiSuggestionBtnText) {
          aiSuggestionBtnText.textContent = 'AI Önerisi Al';
        }
        aiSuggestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  // Show error message
  // REFERENCE: showError from cover-letter-ai.js
  function showError(message) {
    alert('Hata: ' + message);
    console.error('CV Experience AI Error:', message);
  }

  // Show success message
  // REFERENCE: showSuccess from cover-letter-ai.js
  function showSuccess(message) {
    console.log('CV Experience AI Success:', message);
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

