// CV Diller Yönetimi İşlevselliği
// REFERENCE: cv-skills-manager.js (GOLD STANDARD)
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-languages';
    let editingIndex = null;
    let selectedLevel = 'Orta';
    let selectedLevelValue = 60;
    let selectedLevelLabel = 'Orta (B1-B2)';
    let livePreviewTimeout = null;
    
    // Seviye mapping
    const levelMap = {
        'Başlangıç': { value: 20, label: 'Başlangıç (A1)' },
        'Temel': { value: 40, label: 'Temel (A2)' },
        'Orta': { value: 60, label: 'Orta (B1-B2)' },
        'İleri': { value: 80, label: 'İleri (C1)' },
        'Ana Dil': { value: 100, label: 'Ana Dil' }
    };
    
    // localStorage'dan dilleri oku
    function getLanguages() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // localStorage'a dilleri kaydet
    function saveLanguagesToStorage(languages) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
        } catch (e) {
            console.error('Diller kaydedilemedi:', e);
        }
    }
    
    // Seviye yüzdesini hesapla
    function getLevelPercentage(level) {
        const levelData = levelMap[level] || levelMap['Orta'];
        return levelData.value;
    }
    
    // Seviye etiketini al
    function getLevelLabel(level) {
        const levelData = levelMap[level] || levelMap['Orta'];
        return levelData.label;
    }
    
    // Dil kartı oluştur (liste için)
    function createLanguageCard(language, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing';
        card.setAttribute('data-language-index', index);
        
        // Language name'i güvenli şekilde al
        let languageName = '';
        let languageLevel = 'Orta';
        
        if (typeof language === 'string') {
            languageName = language;
        } else if (language && typeof language === 'object') {
            languageName = language.name || language.language || '';
            languageLevel = language.level || 'Orta';
        }
        
        const levelPercentage = getLevelPercentage(languageLevel);
        const levelLabel = getLevelLabel(languageLevel);
        
        card.innerHTML = `
            <div class="flex flex-1 items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0 w-full pr-4">
                    <div class="flex justify-between items-center mb-1.5">
                        <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${languageName || 'Dil Adı'}</p>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">Yabancı Dil</span>
                    </div>
                    <div class="w-full flex items-center gap-3">
                        <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full" style="width: ${levelPercentage}%"></div>
                        </div>
                        <span class="text-xs font-medium text-slate-500 dark:text-slate-400 w-16 text-right">${levelLabel}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="language-edit-btn size-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="language-delete-btn size-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        `;
        
        return card;
    }
    
    // Dil listesini render et
    function renderLanguages() {
        const listContainer = document.getElementById('languages-list');
        if (!listContainer) {
            console.error('❌ CV Languages Manager: languages-list container not found!');
            return;
        }
        
        const languages = getLanguages();
        listContainer.innerHTML = '';
        
        languages.forEach((language, index) => {
            const card = createLanguageCard(language, index);
            listContainer.appendChild(card);
        });
        
        // Event listener'ları ekle
        attachEventListeners();
        
        // Önizlemeyi de güncelle
        renderPreviewLanguages();
    }
    
    // Önizleme için dilleri render et
    function renderPreviewLanguages() {
        // Ana CV önizlemesini güncelle
        updateLivePreview();
    }
    
    // Anlık önizleme güncelle
    function updateLivePreview() {
        // Debounce: Kullanıcı yazmayı bıraktıktan 300ms sonra güncelle
        clearTimeout(livePreviewTimeout);
        livePreviewTimeout = setTimeout(() => {
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            if (window.initLivePreview) {
                window.initLivePreview();
            }
        }, 300);
    }
    
    // Formu temizle
    function clearForm() {
        const nameEl = document.getElementById('language-name');
        const levelDisplayEl = document.getElementById('language-level-display');
        const saveBtn = document.getElementById('language-save-btn');
        
        if (nameEl) nameEl.value = '';
        
        // Seviye butonlarını sıfırla
        selectedLevel = 'Orta';
        selectedLevelValue = 60;
        selectedLevelLabel = 'Orta (B1-B2)';
        updateLevelButtons();
        
        if (levelDisplayEl) levelDisplayEl.textContent = 'Orta (B1-B2)';
        
        editingIndex = null;
        
        if (saveBtn) {
            saveBtn.textContent = 'Ekle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewLanguages();
    }
    
    // Formu doldur
    function fillForm(language) {
        const nameEl = document.getElementById('language-name');
        const levelDisplayEl = document.getElementById('language-level-display');
        const saveBtn = document.getElementById('language-save-btn');
        
        if (nameEl) {
            nameEl.value = language.name || language.language || '';
        }
        
        // Seviye butonlarını güncelle
        selectedLevel = language.level || 'Orta';
        selectedLevelValue = getLevelPercentage(selectedLevel);
        selectedLevelLabel = getLevelLabel(selectedLevel);
        updateLevelButtons();
        
        if (levelDisplayEl) {
            levelDisplayEl.textContent = selectedLevelLabel;
        }
        
        if (saveBtn) {
            saveBtn.textContent = 'Güncelle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewLanguages();
    }
    
    // Seviye butonlarını güncelle
    function updateLevelButtons() {
        document.querySelectorAll('.language-level-btn').forEach(btn => {
            const level = btn.getAttribute('data-level');
            const value = parseInt(btn.getAttribute('data-level-value'));
            const label = btn.getAttribute('data-level-label');
            
            if (level === selectedLevel) {
                btn.classList.remove('border-transparent', 'text-slate-400');
                btn.classList.add('border-primary', 'text-primary', 'shadow-md');
                btn.querySelector('div div').classList.remove('bg-slate-300', 'dark:bg-slate-600');
                btn.querySelector('div div').classList.add('bg-primary');
                btn.querySelector('div div').style.width = value + '%';
            } else {
                btn.classList.remove('border-primary', 'text-primary', 'shadow-md');
                btn.classList.add('border-transparent', 'text-slate-400');
                btn.querySelector('div div').classList.remove('bg-primary');
                btn.querySelector('div div').classList.add('bg-slate-300', 'dark:bg-slate-600');
                btn.querySelector('div div').style.width = value + '%';
            }
        });
    }
    
    // Dil kaydet
    function saveLanguage() {
        const nameEl = document.getElementById('language-name');
        
        if (!nameEl) {
            console.error('❌ CV Languages Manager: Required form elements not found!');
            alert('Form hatası: Gerekli alanlar bulunamadı. Lütfen sayfayı yenileyin.');
            return;
        }
        
        const name = nameEl.value.trim();
        
        // Validation
        if (!name) {
            alert('Lütfen dil adını girin.');
            return;
        }
        
        // Get existing languages
        const languages = getLanguages();
        
        // Create language object
        const language = {
            id: editingIndex !== null ? languages[editingIndex].id : Date.now().toString(),
            name: name,
            language: name, // Template renderer compatibility
            level: selectedLevel,
            levelValue: selectedLevelValue,
            levelLabel: selectedLevelLabel
        };
        
        // Save to array
        if (editingIndex !== null) {
            // Düzenleme modu
            if (editingIndex >= 0 && editingIndex < languages.length) {
                languages[editingIndex] = language;
            } else {
                editingIndex = null;
                languages.push(language);
            }
        } else {
            // Yeni ekleme
            languages.push(language);
        }
        
        // Save to localStorage
        try {
            saveLanguagesToStorage(languages);
        } catch (error) {
            console.error('❌ CV Languages Manager: Error saving to localStorage:', error);
            alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            return;
        }
        
        // Update UI
        renderLanguages();
        
        // Ana CV önizlemesini güncelle
        updateLivePreview();
        
        // Auto-save'i tetikle
        document.dispatchEvent(new CustomEvent('cv-data-changed'));
        
        // Clear form
        clearForm();
        
        // Scroll to form
        const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Dil sil
    function deleteLanguage(index) {
        const languages = getLanguages();
        languages.splice(index, 1);
        saveLanguagesToStorage(languages);
        renderLanguages();
        
        // Ana CV önizlemesini güncelle
        updateLivePreview();
        
        // Auto-save'i tetikle
        document.dispatchEvent(new CustomEvent('cv-data-changed'));
    }
    
    // Dil düzenle
    function editLanguage(index) {
        const languages = getLanguages();
        if (languages[index]) {
            editingIndex = index;
            fillForm(languages[index]);
            
            // Forma scroll yap
            const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    // Event listener'ları ekle
    function attachEventListeners() {
        // Düzenle butonları
        document.querySelectorAll('.language-edit-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editLanguage(index);
            });
        });
        
        // Sil butonları
        document.querySelectorAll('.language-delete-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteLanguage(index);
            });
        });
    }
    
    // Seviye butonları için event listener'ları ekle
    function attachLevelButtonListeners() {
        document.querySelectorAll('.language-level-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                selectedLevel = this.getAttribute('data-level');
                selectedLevelValue = parseInt(this.getAttribute('data-level-value'));
                selectedLevelLabel = this.getAttribute('data-level-label');
                
                updateLevelButtons();
                
                const levelDisplayEl = document.getElementById('language-level-display');
                if (levelDisplayEl) {
                    levelDisplayEl.textContent = selectedLevelLabel;
                }
            });
        });
    }
    
    // Bitir ve Tamamla butonu
    async function finishCV() {
        try {
            // CV verilerini kaydet
            const languages = getLanguages();
            saveLanguagesToStorage(languages);
            
            // Tüm CV verilerini topla
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            const experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
            const education = JSON.parse(localStorage.getItem('cv-education') || '[]');
            const skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
            const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
            
            // Validation: En azından kişisel bilgiler olmalı
            if (!cvData['fullname-first'] && !cvData['fullname-last']) {
                alert('Lütfen en azından kişisel bilgilerinizi girin.');
                return;
            }
            
            // Resume ID'yi kontrol et - SADECE URL'den (edit modu)
            // URL'de resume parametresi varsa edit modu, yoksa YENİ CV oluştur
            const urlParams = new URLSearchParams(window.location.search);
            const resumeIdFromUrl = urlParams.get('resume');
            
            // KRİTİK: URL'de resume yoksa, localStorage'daki eski resume_id'yi KULLANMA
            // Bu yeni CV oluşturma akışıdır, her zaman yeni resume oluşturulmalı
            let resumeId = resumeIdFromUrl;
            
            // Eğer URL'de resume ID varsa, edit modu (localStorage'a kaydet)
            if (resumeIdFromUrl) {
                localStorage.setItem('current-resume-id', resumeIdFromUrl);
                console.log('📝 Edit mode: Updating existing resume:', resumeIdFromUrl);
            } else {
                // URL'de resume yoksa, yeni CV oluşturuluyor
                // Eski resume_id'yi temizle (overwrite'i önlemek için)
                localStorage.removeItem('current-resume-id');
                console.log('🆕 New CV mode: Creating new resume (old resume_id cleared)');
            }
            
            const resumeData = {
                title: `${cvData['fullname-first'] || ''} ${cvData['fullname-last'] || ''}`.trim() || 'Yeni Özgeçmiş',
                templateId: selectedTemplate,
                status: 'COMPLETED', // Tamamlanmış CV
                firstName: cvData['fullname-first'] || '',
                lastName: cvData['fullname-last'] || '',
                email: cvData.email || '',
                phone: cvData.phone || '',
                location: cvData.location || '',
                profession: cvData.profession || '',
                summary: cvData.summary || '',
                experience: experiences.length > 0 ? experiences : null,
                education: education.length > 0 ? education : null,
                skills: skills.length > 0 ? skills : null,
                languages: languages.length > 0 ? languages : null,
            };
            
            // API client kontrolü
            if (!window.apiClient || !window.apiClient.token) {
                console.warn('Not authenticated, saving to localStorage only');
                // Yine de success screen'e git (offline mode)
                localStorage.setItem('current-resume-id', resumeId || 'local-' + Date.now());
                window.location.href = 'cv-tamamlandi.html';
                return;
            }
            
            // Database'e kaydet - "Bitir ve Tamamla" butonuna basıldığında
            // Bu tek nokta yeni resume oluşturma noktasıdır
            if (resumeId) {
                // Mevcut resume'u COMPLETED olarak güncelle
                try {
                    await window.apiClient.updateResume(resumeId, resumeData);
                    console.log('✅ CV completed and saved to database (updated):', resumeId);
                } catch (error) {
                    console.error('Error updating resume:', error);
                    // Resume bulunamadıysa yeni oluştur
                    if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
                        console.log('Resume bulunamadı, yeni oluşturuluyor...');
                        resumeId = null;
                    } else {
                        // Hata olsa bile success screen'e git
                    }
                }
            }
            
            if (!resumeId) {
                // Yeni resume oluştur - SADECE "Bitir ve Tamamla" butonunda
                try {
                    const response = await window.apiClient.createResume(resumeData);
                    if (response && response.success && response.data && response.data.resume) {
                        resumeId = response.data.resume.id;
                        console.log('✅ New CV created and completed:', resumeId);
                    } else {
                        console.error('❌ Create response formatı beklenmedik:', response);
                    }
                } catch (error) {
                    console.error('Error creating resume:', error);
                    // Hata olsa bile success screen'e git
                }
            }
            
            // KRİTİK: "Bitir ve Tamamla" sonrası current-resume-id'yi TEMİZLE
            // Bu sayede bir sonraki CV oluşturma akışında yeni resume oluşturulur
            localStorage.removeItem('current-resume-id');
            console.log('🧹 CV finalized: current-resume-id cleared for next CV creation');
            
            // Success screen'e yönlendir
            window.location.href = 'cv-tamamlandi.html';
        } catch (error) {
            console.error('Error finishing CV:', error);
            alert('CV kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    }
    
    // Global olarak erişilebilir yap
    window.renderPreviewLanguages = renderPreviewLanguages;
    window.renderLanguages = renderLanguages;
    
    // Sayfa yüklendiğinde başlat
    function init() {
        // Mevcut dilleri render et
        renderLanguages();
        
        // Seviye butonları için listener'ları ekle
        attachLevelButtonListeners();
        
        // Kaydet butonu
        const saveBtn = document.getElementById('language-save-btn');
        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', saveLanguage);
        }
        
        // Vazgeç butonu
        const cancelBtn = document.getElementById('language-cancel-btn');
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', clearForm);
        }
        
        // Bitir ve Tamamla butonu
        const finishBtn = document.getElementById('finish-cv-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', finishCV);
        }
        
        // AI CV analizi ile otomatik doldurma kontrolü
        try {
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            if (cvData.languages && Array.isArray(cvData.languages) && cvData.languages.length > 0) {
                const existingLanguages = getLanguages();
                if (existingLanguages.length === 0) {
                    // AI'dan gelen dilleri ekle
                    cvData.languages.forEach(lang => {
                        if (typeof lang === 'string') {
                            existingLanguages.push({
                                id: Date.now().toString() + Math.random(),
                                name: lang,
                                language: lang,
                                level: 'Orta',
                                levelValue: 60,
                                levelLabel: 'Orta (B1-B2)'
                            });
                        } else if (lang.name || lang.language) {
                            existingLanguages.push({
                                id: lang.id || Date.now().toString() + Math.random(),
                                name: lang.name || lang.language,
                                language: lang.language || lang.name,
                                level: lang.level || 'Orta',
                                levelValue: lang.levelValue || getLevelPercentage(lang.level || 'Orta'),
                                levelLabel: lang.levelLabel || getLevelLabel(lang.level || 'Orta')
                            });
                        }
                    });
                    saveLanguagesToStorage(existingLanguages);
                    renderLanguages();
                }
            }
        } catch (e) {
            console.error('AI languages auto-fill error:', e);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

