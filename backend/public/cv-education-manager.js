// CV Eğitim Yönetimi İşlevselliği
(function() {
    'use strict';

    let editingIndex = null;

    // Yıl seçeneklerini doldur
    function populateYearSelects() {
        const currentYear = new Date().getFullYear();
        const yearSelects = document.querySelectorAll('#education-start-year, #education-end-year');

        yearSelects.forEach(select => {
            if (!select) return;
            // Mevcut seçenekleri temizle (varsayılan hariç)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
        });
    }

    // Eğitimleri al
    function getEducation() {
        if (window.CVStateManager) {
            return window.CVStateManager.getEducation();
        }
        return [];
    }

    // Eğitimleri kaydet
    function saveEducation(education) {
        if (window.CVStateManager) {
            return window.CVStateManager.setEducation(education);
        }
        return false;
    }

    // Tarih formatla
    function formatDate(startMonth, startYear, endMonth, endYear, isCurrent) {
        let start = startYear || '';
        let end = isCurrent ? 'Devam Ediyor' : (endYear || '');

        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        }
        return '';
    }

    // Eğitim kartı oluştur
    function createEducationCard(edu, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all';
        card.setAttribute('data-education-index', index);

        const dateStr = formatDate(edu.startMonth, edu.startYear, edu.endMonth, edu.endYear, edu.isCurrent);

        card.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0">
                    <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${edu.school || ''}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal truncate">${edu.degree || ''}${dateStr ? ' • ' + dateStr : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="education-edit-btn size-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="education-delete-btn size-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        `;

        return card;
    }

    // Eğitim listesini render et
    function renderEducation() {
        const listContainer = document.getElementById('education-list');
        if (!listContainer) return;

        const education = getEducation();
        listContainer.innerHTML = '';

        if (education.length === 0) {
            listContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Eğitim bilgisi eklenmedi. Yukarıdaki formu kullanarak eğitim bilgilerinizi ekleyin.</p>';
        } else {
            education.forEach((edu, index) => {
                const card = createEducationCard(edu, index);
                listContainer.appendChild(card);
            });
        }

        attachEventListeners();
        renderPreviewEducation();
    }

    // Önizleme için eğitim render et
    function renderPreviewEducation() {
        const previewContainer = document.getElementById('education-preview-container');
        if (!previewContainer) return;

        const education = getEducation();
        previewContainer.innerHTML = '';

        if (education.length === 0) {
            previewContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Eğitim bilgisi eklenmedi</p>';
        } else {
            education.forEach(edu => {
                const dateStr = formatDate(edu.startMonth, edu.startYear, edu.endMonth, edu.endYear, edu.isCurrent);
                const div = document.createElement('div');
                div.className = 'mb-3';
                div.innerHTML = `
                    <h3 class="text-sm font-bold text-slate-900">${edu.degree || ''}</h3>
                    <p class="text-xs text-slate-700">${edu.school || ''}</p>
                    ${dateStr ? `<p class="text-xs text-slate-500 mt-1">${dateStr}</p>` : ''}
                `;
                previewContainer.appendChild(div);
            });
        }

        // Global event fırlat
        window.dispatchEvent(new CustomEvent('cv-education-updated'));
    }

    // Formu temizle
    function clearForm() {
        const fields = ['education-school', 'education-degree', 'education-city', 'education-gpa',
            'education-start-month', 'education-start-year', 'education-end-month', 'education-end-year',
            'education-details'];

        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            }
        });

        const currentCheckbox = document.getElementById('education-current');
        if (currentCheckbox) currentCheckbox.checked = false;

        const endMonth = document.getElementById('education-end-month');
        const endYear = document.getElementById('education-end-year');
        if (endMonth) endMonth.disabled = false;
        if (endYear) endYear.disabled = false;

        editingIndex = null;

        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) saveBtn.textContent = 'Ekle';
    }

    // Formu doldur
    function fillForm(edu) {
        const fields = {
            'education-school': edu.school,
            'education-degree': edu.degree,
            'education-city': edu.city,
            'education-gpa': edu.gpa,
            'education-start-month': edu.startMonth,
            'education-start-year': edu.startYear,
            'education-end-month': edu.endMonth,
            'education-end-year': edu.endYear,
            'education-details': edu.details
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        });

        const currentCheckbox = document.getElementById('education-current');
        if (currentCheckbox) {
            currentCheckbox.checked = edu.isCurrent || false;
            const endMonth = document.getElementById('education-end-month');
            const endYear = document.getElementById('education-end-year');
            if (edu.isCurrent) {
                if (endMonth) endMonth.disabled = true;
                if (endYear) endYear.disabled = true;
            }
        }

        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) saveBtn.textContent = 'Güncelle';
    }

    // Eğitim kaydet
    function saveEducationEntry() {
        const school = document.getElementById('education-school')?.value.trim() || '';
        const degree = document.getElementById('education-degree')?.value.trim() || '';
        const city = document.getElementById('education-city')?.value.trim() || '';
        const gpa = document.getElementById('education-gpa')?.value.trim() || '';
        const startMonth = document.getElementById('education-start-month')?.value || '';
        const startYear = document.getElementById('education-start-year')?.value || '';
        const endMonth = document.getElementById('education-end-month')?.value || '';
        const endYear = document.getElementById('education-end-year')?.value || '';
        const isCurrent = document.getElementById('education-current')?.checked || false;
        const details = document.getElementById('education-details')?.value.trim() || '';

        if (!school || !degree) {
            alert('Lütfen okul adı ve bölüm/derece bilgilerini girin.');
            return;
        }

        const education = getEducation();
        const entry = {
            school,
            degree,
            city,
            gpa,
            startMonth,
            startYear,
            endMonth: isCurrent ? '' : endMonth,
            endYear: isCurrent ? '' : endYear,
            isCurrent,
            details
        };

        if (editingIndex !== null) {
            education[editingIndex] = entry;
        } else {
            education.push(entry);
        }

        saveEducation(education);
        renderEducation();
        clearForm();
    }

    // Eğitim sil
    function deleteEducationEntry(index) {
        if (confirm('Bu eğitim bilgisini silmek istediğinize emin misiniz?')) {
            const education = getEducation();
            if (index >= 0 && index < education.length) {
                education.splice(index, 1);
                saveEducation(education);
                renderEducation();
            }
        }
    }

    // Eğitim düzenle
    function editEducationEntry(index) {
        const education = getEducation();
        if (education[index]) {
            editingIndex = index;
            fillForm(education[index]);

            const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    // Event listener'ları ekle
    function attachEventListeners() {
        document.querySelectorAll('.education-edit-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editEducationEntry(index);
            });
        });

        document.querySelectorAll('.education-delete-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteEducationEntry(index);
            });
        });
    }

    // Init
    function init() {
        populateYearSelects();
        renderEducation();

        // Kaydet butonu
        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', saveEducationEntry);
        }

        // Vazgeç butonu
        const cancelBtn = document.getElementById('education-cancel-btn');
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', clearForm);
        }

        // Hala devam ediyorum checkbox
        const currentCheckbox = document.getElementById('education-current');
        if (currentCheckbox) {
            currentCheckbox.addEventListener('change', function() {
                const endMonth = document.getElementById('education-end-month');
                const endYear = document.getElementById('education-end-year');
                if (this.checked) {
                    if (endMonth) { endMonth.value = ''; endMonth.disabled = true; }
                    if (endYear) { endYear.value = ''; endYear.disabled = true; }
                } else {
                    if (endMonth) endMonth.disabled = false;
                    if (endYear) endYear.disabled = false;
                }
            });
        }

        console.log('CV Education Manager initialized');
    }

    // Global erişim
    window.renderPreviewEducation = renderPreviewEducation;
    window.renderEducation = renderEducation;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
