// CV Diller Yönetimi İşlevselliği
(function() {
    'use strict';

    const LEVEL_LABELS = {
        'native': 'Anadil',
        'fluent': 'Akıcı (C2)',
        'advanced': 'İleri (C1)',
        'intermediate': 'Orta (B1-B2)',
        'beginner': 'Başlangıç (A1-A2)'
    };

    // Dilleri al
    function getLanguages() {
        if (window.CVStateManager) {
            return window.CVStateManager.getLanguages();
        }
        return [];
    }

    // Dilleri kaydet
    function saveLanguages(languages) {
        if (window.CVStateManager) {
            return window.CVStateManager.setLanguages(languages);
        }
        return false;
    }

    // Dil kartı oluştur
    function createLanguageCard(lang, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all';
        card.setAttribute('data-language-index', index);

        const levelLabel = LEVEL_LABELS[lang.level] || lang.level || '';

        card.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0">
                    <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${lang.name || ''}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal truncate">${levelLabel}</p>
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
        if (!listContainer) return;

        const languages = getLanguages();
        listContainer.innerHTML = '';

        if (languages.length === 0) {
            listContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Dil eklenmedi. Yukarıdaki formu kullanarak dil bilgilerinizi ekleyin.</p>';
        } else {
            languages.forEach((lang, index) => {
                const card = createLanguageCard(lang, index);
                listContainer.appendChild(card);
            });
        }

        attachEventListeners();
        renderPreviewLanguages();
    }

    // Önizleme için dilleri render et
    function renderPreviewLanguages() {
        const previewContainer = document.getElementById('languages-preview-container');
        if (!previewContainer) return;

        const languages = getLanguages();
        previewContainer.innerHTML = '';

        if (languages.length === 0) {
            previewContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Dil eklenmedi</p>';
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-1';
            languages.forEach(lang => {
                const levelLabel = LEVEL_LABELS[lang.level] || lang.level || '';
                const div = document.createElement('div');
                div.className = 'flex justify-between text-xs';
                div.innerHTML = `
                    <span>${lang.name || ''}</span>
                    <span class="text-slate-500">${levelLabel}</span>
                `;
                wrapper.appendChild(div);
            });
            previewContainer.appendChild(wrapper);
        }

        // Global event fırlat
        window.dispatchEvent(new CustomEvent('cv-languages-updated'));
    }

    let editingIndex = null;

    // Formu temizle
    function clearForm() {
        const nameInput = document.getElementById('language-name');
        const levelSelect = document.getElementById('language-level');

        if (nameInput) nameInput.value = '';
        if (levelSelect) levelSelect.value = '';

        editingIndex = null;

        const saveBtn = document.getElementById('language-save-btn');
        if (saveBtn) saveBtn.textContent = 'Ekle';
    }

    // Formu doldur
    function fillForm(lang) {
        const nameInput = document.getElementById('language-name');
        const levelSelect = document.getElementById('language-level');

        if (nameInput) nameInput.value = lang.name || '';
        if (levelSelect) levelSelect.value = lang.level || '';

        const saveBtn = document.getElementById('language-save-btn');
        if (saveBtn) saveBtn.textContent = 'Güncelle';
    }

    // Dil kaydet/ekle
    function saveLanguage() {
        const nameInput = document.getElementById('language-name');
        const levelSelect = document.getElementById('language-level');

        const name = nameInput?.value.trim() || '';
        const level = levelSelect?.value || '';

        if (!name) {
            alert('Lütfen bir dil adı girin.');
            return;
        }

        if (!level) {
            alert('Lütfen seviye seçin.');
            return;
        }

        const languages = getLanguages();
        const entry = { name, level };

        if (editingIndex !== null) {
            languages[editingIndex] = entry;
        } else {
            // Aynı dil var mı kontrol et
            const exists = languages.some(l => l.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert('Bu dil zaten eklenmiş.');
                return;
            }
            languages.push(entry);
        }

        saveLanguages(languages);
        renderLanguages();
        clearForm();
    }

    // Dil sil
    function deleteLanguage(index) {
        if (confirm('Bu dili silmek istediğinize emin misiniz?')) {
            const languages = getLanguages();
            if (index >= 0 && index < languages.length) {
                languages.splice(index, 1);
                saveLanguages(languages);
                renderLanguages();
            }
        }
    }

    // Dil düzenle
    function editLanguage(index) {
        const languages = getLanguages();
        if (languages[index]) {
            editingIndex = index;
            fillForm(languages[index]);

            const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    // Event listener'ları ekle
    function attachEventListeners() {
        document.querySelectorAll('.language-edit-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editLanguage(index);
            });
        });

        document.querySelectorAll('.language-delete-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteLanguage(index);
            });
        });
    }

    // Init
    function init() {
        renderLanguages();

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

        console.log('CV Languages Manager initialized');
    }

    // Global erişim
    window.renderPreviewLanguages = renderPreviewLanguages;
    window.renderLanguages = renderLanguages;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
