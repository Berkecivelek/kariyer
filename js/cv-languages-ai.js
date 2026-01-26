// CV Diller AI Entegrasyonu
// Production-ready AI languages suggestions

(function () {
  'use strict';

  let aiLanguagesBtn;

  function init() {
    aiLanguagesBtn = document.getElementById('ai-languages-suggestion-btn');
    if (!aiLanguagesBtn) {
      console.warn('CV Languages AI: Button not found');
      return;
    }

    aiLanguagesBtn.addEventListener('click', handleAILanguagesSuggestion);
  }

  function getUserCompleteInfo() {
    const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');

    let experiences = [];
    try {
      experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
    } catch (e) {
      experiences = [];
    }

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
      languages: languages,
    };
  }

  async function handleAILanguagesSuggestion() {
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

    const targetCountry = prompt('Hedeflediğiniz ülke/bölgeyi girin (opsiyonel):') || '';

    if (aiLanguagesBtn) {
      setLoadingState(aiLanguagesBtn, true);
      aiLanguagesBtn.textContent = 'Yükleniyor...';
    }

    try {
      const personalInfo = getUserCompleteInfo();
      const context = { personalInfo };

      const response = await window.apiClient.generateLanguagesSuggestions(
        targetCountry || undefined,
        context
      );

      if (response.success && response.data && response.data.suggestions) {
        const suggestions = response.data.suggestions;
        if (suggestions.length > 0) {
          showSuggestionsModal(suggestions);
        } else {
          showError('Öneri bulunamadı. Lütfen tekrar deneyin.');
        }
      } else {
        throw new Error(response.error?.message || 'Dil önerileri alınamadı.');
      }
    } catch (error) {
      console.error('AI languages suggestion error:', error);
      let errorMessage = 'Dil önerileri alınırken bir hata oluştu.';
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
      if (aiLanguagesBtn) {
        setLoadingState(aiLanguagesBtn, false);
        aiLanguagesBtn.textContent = 'Analiz Et';
      }
    }
  }

  function showSuggestionsModal(suggestions) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white dark:bg-[#1e2130] rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">AI Dil Önerileri</h3>
        <div class="flex flex-col gap-2 mb-4">
          ${suggestions
            .map(
              (lang, idx) => `
            <label class="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
              <input type="checkbox" value="${lang}" class="language-checkbox" data-language="${lang}">
              <span class="text-sm text-slate-700 dark:text-slate-300">${lang}</span>
            </label>
          `
            )
            .join('')}
        </div>
        <div class="flex gap-3">
          <button class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark" id="add-selected-languages">
            Seçilenleri Ekle
          </button>
          <button class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800" id="close-languages-modal">
            Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-languages-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('add-selected-languages').addEventListener('click', () => {
      const selected = Array.from(modal.querySelectorAll('.language-checkbox:checked')).map(
        (cb) => cb.dataset.language
      );
      if (selected.length > 0) {
        addLanguagesToList(selected);
      }
      document.body.removeChild(modal);
    });
  }

  function addLanguagesToList(languages) {
    let currentLanguages = [];
    try {
      currentLanguages = JSON.parse(localStorage.getItem('cv-languages') || '[]');
    } catch (e) {
      currentLanguages = [];
    }

    languages.forEach((lang) => {
      const exists = currentLanguages.some(
        (l) => (typeof l === 'string' ? l : l.name || l.language || '') === lang
      );
      if (!exists) {
        currentLanguages.push(lang);
      }
    });

    localStorage.setItem('cv-languages', JSON.stringify(currentLanguages));

    showSuccess(`${languages.length} dil eklendi! Sayfa yenileniyor...`);
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
    console.error('CV Languages AI Error:', message);
  }

  function showSuccess(message) {
    console.log('CV Languages AI Success:', message);
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






