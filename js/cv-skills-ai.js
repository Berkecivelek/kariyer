// CV Yetenekler AI Entegrasyonu
// Production-ready AI skills suggestions

(function () {
  'use strict';

  let aiSkillsBtn;

  function init() {
    aiSkillsBtn = document.getElementById('ai-skills-suggestion-btn');
    if (!aiSkillsBtn) {
      console.warn('CV Skills AI: Button not found');
      return;
    }

    aiSkillsBtn.addEventListener('click', handleAISkillsSuggestion);
  }

  function getUserCompleteInfo() {
    const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');

    let experiences = [];
    try {
      experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
    } catch (e) {
      experiences = [];
    }

    let education = [];
    try {
      education = JSON.parse(localStorage.getItem('cv-education') || '[]');
    } catch (e) {
      education = [];
    }

    let skills = [];
    try {
      skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
    } catch (e) {
      skills = [];
    }

    return {
      firstName: cvData['fullname-first'] || cvData.firstName || '',
      lastName: cvData['fullname-last'] || cvData.lastName || '',
      profession: cvData.profession || '',
      experience: experiences,
      education: education,
      skills: skills,
    };
  }

  async function handleAISkillsSuggestion() {
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

    const targetPosition = prompt('Hedeflediğiniz pozisyonu girin (opsiyonel):') || '';

    if (aiSkillsBtn) {
      setLoadingState(aiSkillsBtn, true);
      aiSkillsBtn.textContent = 'Yükleniyor...';
    }

    try {
      const personalInfo = getUserCompleteInfo();
      const context = { personalInfo };

      const response = await window.apiClient.generateSkillsSuggestions(
        targetPosition || undefined,
        context
      );

      if (response.success && response.data && response.data.suggestions) {
        const suggestions = response.data.suggestions;
        if (suggestions.length > 0) {
          // Önerileri göster ve kullanıcıya seçtir
          showSuggestionsModal(suggestions);
        } else {
          showError('Öneri bulunamadı. Lütfen tekrar deneyin.');
        }
      } else {
        throw new Error(response.error?.message || 'Yetenek önerileri alınamadı.');
      }
    } catch (error) {
      console.error('AI skills suggestion error:', error);
      let errorMessage = 'Yetenek önerileri alınırken bir hata oluştu.';
      const errorMsg = error.message || error.toString() || '';

      if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
        errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
      } else if (
        errorMsg.toLowerCase().includes('authenticated') ||
        errorMsg.toLowerCase().includes('giriş')
      ) {
        errorMessage = 'AI özelliğini kullanmak için giriş yapmanız gerekiyor.';
      } else if (errorMsg.toLowerCase().includes('not configured')) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      showError(errorMessage);
    } finally {
      if (aiSkillsBtn) {
        setLoadingState(aiSkillsBtn, false);
        aiSkillsBtn.textContent = 'Öner';
      }
    }
  }

  function showSuggestionsModal(suggestions) {
    // Basit bir modal oluştur
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white dark:bg-[#1e2130] rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">AI Yetenek Önerileri</h3>
        <div class="flex flex-col gap-2 mb-4">
          ${suggestions
            .map(
              (skill, idx) => `
            <label class="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
              <input type="checkbox" value="${skill}" class="skill-checkbox" data-skill="${skill}">
              <span class="text-sm text-slate-700 dark:text-slate-300">${skill}</span>
            </label>
          `
            )
            .join('')}
        </div>
        <div class="flex gap-3">
          <button class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark" id="add-selected-skills">
            Seçilenleri Ekle
          </button>
          <button class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800" id="close-skills-modal">
            Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-skills-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('add-selected-skills').addEventListener('click', () => {
      const selected = Array.from(modal.querySelectorAll('.skill-checkbox:checked')).map(
        (cb) => cb.dataset.skill
      );
      if (selected.length > 0) {
        addSkillsToList(selected);
      }
      document.body.removeChild(modal);
    });
  }

  function addSkillsToList(skills) {
    // Mevcut yetenekleri al
    let currentSkills = [];
    try {
      currentSkills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
    } catch (e) {
      currentSkills = [];
    }

    // Yeni yetenekleri ekle (duplikasyon kontrolü)
    skills.forEach((skill) => {
      const exists = currentSkills.some(
        (s) => (typeof s === 'string' ? s : s.name || s.skill || '') === skill
      );
      if (!exists) {
        currentSkills.push(skill);
      }
    });

    // localStorage'a kaydet
    localStorage.setItem('cv-skills', JSON.stringify(currentSkills));

    // Sayfayı yenile veya listeyi güncelle
    showSuccess(`${skills.length} yetenek eklendi! Sayfa yenileniyor...`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

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

  function showError(message) {
    alert('Hata: ' + message);
    console.error('CV Skills AI Error:', message);
  }

  function showSuccess(message) {
    console.log('CV Skills AI Success:', message);
    // Basit bir bildirim göster
    const notification = document.createElement('div');
    notification.className =
      'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();






