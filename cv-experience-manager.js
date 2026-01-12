// CV Deneyim Yönetimi İşlevselliği
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-experiences';
    let editingIndex = null;
    let livePreviewTimeout = null;
    
    // Yıl seçeneklerini doldur (1950'den günümüze)
    function populateYearSelects() {
        const currentYear = new Date().getFullYear();
        const startYearSelect = document.getElementById('experience-start-year');
        const endYearSelect = document.getElementById('experience-end-year');
        
        if (startYearSelect) {
            // Mevcut seçenekleri temizle (varsayılan "Yıl" hariç)
            while (startYearSelect.children.length > 1) {
                startYearSelect.removeChild(startYearSelect.lastChild);
            }
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                startYearSelect.appendChild(option);
            }
        }
        
        if (endYearSelect) {
            // Mevcut seçenekleri temizle (varsayılan "Yıl" hariç)
            while (endYearSelect.children.length > 1) {
                endYearSelect.removeChild(endYearSelect.lastChild);
            }
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                endYearSelect.appendChild(option);
            }
        }
    }
    
    // localStorage'dan deneyimleri oku
    function getExperiences() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // localStorage'a deneyimleri kaydet
    function saveExperiences(experiences) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences));
        } catch (e) {
            console.error('Deneyimler kaydedilemedi:', e);
        }
    }
    
    // Tarih formatını düzenle
    function formatDate(startMonth, startYear, endMonth, endYear, isCurrent) {
        let start = '';
        if (startMonth && startYear) {
            start = `${startMonth} ${startYear}`;
        } else if (startYear) {
            start = startYear.toString();
        }
        
        let end = '';
        if (isCurrent) {
            end = 'Günümüz';
        } else if (endMonth && endYear) {
            end = `${endMonth} ${endYear}`;
        } else if (endYear) {
            end = endYear.toString();
        }
        
        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        }
        return '';
    }
    
    // Açıklamayı liste formatına çevir
    function formatDescription(description) {
        if (!description) return [];
        return description.split('\n').filter(line => line.trim() !== '');
    }
    
    // Önizleme için deneyim kartı oluştur
    function createPreviewExperienceCard(experience) {
        const dateStr = formatDate(
            experience.startMonth,
            experience.startYear,
            experience.endMonth,
            experience.endYear,
            experience.isCurrent
        );
        
        const descriptionLines = formatDescription(experience.description);
        
        const card = document.createElement('div');
        card.className = 'mb-4';
        card.innerHTML = `
            <div class="flex justify-between items-baseline mb-1">
                <h3 class="text-sm font-bold text-slate-900">${experience.jobTitle || ''}</h3>
                <span class="text-xs text-slate-500 font-medium">${dateStr || ''}</span>
            </div>
            <p class="text-xs text-slate-700 italic mb-2">${experience.company || ''}</p>
            ${descriptionLines.length > 0 ? `
            <ul class="list-disc list-inside text-xs text-slate-600 leading-relaxed space-y-1">
                ${descriptionLines.map(line => `<li>${line.trim()}</li>`).join('')}
            </ul>
            ` : ''}
        `;
        
        return card;
    }
    
    // Önizleme alanını render et
    function renderPreviewExperiences() {
        const previewContainer = document.getElementById('experience-preview-container');
        if (!previewContainer) return;
        
        // Formdan mevcut değerleri al (anlık önizleme için)
        const jobTitle = document.getElementById('experience-job-title')?.value.trim() || '';
        const company = document.getElementById('experience-company')?.value.trim() || '';
        const startMonth = document.getElementById('experience-start-month')?.value || '';
        const startYear = document.getElementById('experience-start-year')?.value || '';
        const endMonth = document.getElementById('experience-end-month')?.value || '';
        const endYear = document.getElementById('experience-end-year')?.value || '';
        const isCurrent = document.getElementById('experience-current-job')?.checked || false;
        const description = document.getElementById('experience-description')?.value.trim() || '';
        
        // Eğer form doluysa, önce formdaki değeri göster (anlık önizleme)
        if (jobTitle || company) {
            const tempExperience = {
                jobTitle,
                company,
                startMonth,
                startYear,
                endMonth: isCurrent ? '' : endMonth,
                endYear: isCurrent ? '' : endYear,
                isCurrent,
                description
            };
            
            previewContainer.innerHTML = '';
            const card = createPreviewExperienceCard(tempExperience);
            previewContainer.appendChild(card);
            
            // Kaydedilmiş diğer deneyimleri de ekle
            const experiences = getExperiences();
            experiences.forEach((exp, index) => {
                if (editingIndex === null || index !== editingIndex) {
                    const expCard = createPreviewExperienceCard(exp);
                    previewContainer.appendChild(expCard);
                }
            });
        } else {
            // Form boşsa, sadece kaydedilmiş deneyimleri göster
            const experiences = getExperiences();
            previewContainer.innerHTML = '';
            
            if (experiences.length === 0) {
                // Varsayılan örnek deneyimler
                const defaultExperiences = [
                    {
                        jobTitle: 'Kıdemli Yazılım Mühendisi',
                        company: 'TechSolutions Inc.',
                        startMonth: 'Ocak',
                        startYear: '2021',
                        endMonth: '',
                        endYear: '',
                        isCurrent: true,
                        description: 'Mikroservis mimarisine geçiş projesine liderlik ederek sistem performansını %40 artırdım.\nJunior geliştiricilere mentorluk yaparak ekibin kod kalitesini yükselttim.\nCI/CD süreçlerini optimize ederek deployment süresini 15 dakikadan 3 dakikaya indirdim.'
                    },
                    {
                        jobTitle: 'Frontend Geliştirici',
                        company: 'Creative Web Agency',
                        startMonth: 'Ocak',
                        startYear: '2019',
                        endMonth: 'Aralık',
                        endYear: '2021',
                        isCurrent: false,
                        description: 'React ve Vue.js kullanarak responsive web uygulamaları geliştirdim.\nKullanıcı deneyimini iyileştirmek için A/B testleri yürüttüm.\nEkip içi code review süreçlerine aktif katılım sağladım.'
                    }
                ];
                
                defaultExperiences.forEach(exp => {
                    const card = createPreviewExperienceCard(exp);
                    previewContainer.appendChild(card);
                });
            } else {
                experiences.forEach(exp => {
                    const card = createPreviewExperienceCard(exp);
                    previewContainer.appendChild(card);
                });
            }
        }
    }
    
    // Anlık önizleme güncelle
    function updateLivePreview() {
        // Debounce: Kullanıcı yazmayı bıraktıktan 300ms sonra güncelle
        clearTimeout(livePreviewTimeout);
        livePreviewTimeout = setTimeout(() => {
            renderPreviewExperiences();
        }, 300);
    }
    
    // Deneyim kartı oluştur (liste için)
    function createExperienceCard(experience, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing';
        card.setAttribute('data-experience-index', index);
        
        const dateStr = formatDate(
            experience.startMonth,
            experience.startYear,
            experience.endMonth,
            experience.endYear,
            experience.isCurrent
        );
        
        card.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0">
                    <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${experience.jobTitle || ''}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal truncate">${experience.company || ''}${dateStr ? ' • ' + dateStr : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="experience-edit-btn size-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="experience-delete-btn size-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        `;
        
        return card;
    }
    
    // Deneyim listesini render et
    function renderExperiences() {
        const listContainer = document.getElementById('experience-list');
        if (!listContainer) return;
        
        const experiences = getExperiences();
        listContainer.innerHTML = '';
        
        if (experiences.length === 0) {
            // Varsayılan örnek deneyimler
            const defaultExperiences = [
                {
                    jobTitle: 'Kıdemli Yazılım Mühendisi',
                    company: 'TechSolutions Inc.',
                    startMonth: 'Ocak',
                    startYear: '2021',
                    endMonth: '',
                    endYear: '',
                    isCurrent: true,
                    description: 'Mikroservis mimarisine geçiş projesine liderlik ederek sistem performansını %40 artırdım.\nJunior geliştiricilere mentorluk yaparak ekibin kod kalitesini yükselttim.\nCI/CD süreçlerini optimize ederek deployment süresini 15 dakikadan 3 dakikaya indirdim.'
                },
                {
                    jobTitle: 'Frontend Geliştirici',
                    company: 'Creative Web Agency',
                    startMonth: 'Ocak',
                    startYear: '2019',
                    endMonth: 'Aralık',
                    endYear: '2021',
                    isCurrent: false,
                    description: 'React ve Vue.js kullanarak responsive web uygulamaları geliştirdim.\nKullanıcı deneyimini iyileştirmek için A/B testleri yürüttüm.\nEkip içi code review süreçlerine aktif katılım sağladım.'
                }
            ];
            
            defaultExperiences.forEach((exp, index) => {
                const card = createExperienceCard(exp, index);
                listContainer.appendChild(card);
            });
            
            saveExperiences(defaultExperiences);
        } else {
            experiences.forEach((exp, index) => {
                const card = createExperienceCard(exp, index);
                listContainer.appendChild(card);
            });
        }
        
        // Event listener'ları ekle
        attachEventListeners();
        
        // Önizlemeyi de güncelle
        renderPreviewExperiences();
    }
    
    // Formu temizle
    function clearForm() {
        console.log('🔧 CV Experience Manager: Clearing form');
        
        const jobTitleEl = document.getElementById('experience-job-title');
        const companyEl = document.getElementById('experience-company');
        const startMonthEl = document.getElementById('experience-start-month');
        const startYearEl = document.getElementById('experience-start-year');
        const endMonthEl = document.getElementById('experience-end-month');
        const endYearEl = document.getElementById('experience-end-year');
        const isCurrentEl = document.getElementById('experience-current-job');
        const descriptionEl = document.getElementById('experience-description');
        
        if (jobTitleEl) jobTitleEl.value = '';
        if (companyEl) companyEl.value = '';
        if (startMonthEl) startMonthEl.value = '';
        if (startYearEl) startYearEl.value = '';
        if (endMonthEl) {
            endMonthEl.value = '';
            endMonthEl.disabled = false;
        }
        if (endYearEl) {
            endYearEl.value = '';
            endYearEl.disabled = false;
        }
        if (isCurrentEl) isCurrentEl.checked = false;
        if (descriptionEl) descriptionEl.value = '';
        
        editingIndex = null;
        
        const saveBtn = document.getElementById('experience-save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Ekle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewExperiences();
        
        console.log('✅ CV Experience Manager: Form cleared');
    }
    
    // Formu doldur
    function fillForm(experience) {
        document.getElementById('experience-job-title').value = experience.jobTitle || '';
        document.getElementById('experience-company').value = experience.company || '';
        document.getElementById('experience-start-month').value = experience.startMonth || '';
        document.getElementById('experience-start-year').value = experience.startYear || '';
        document.getElementById('experience-end-month').value = experience.endMonth || '';
        document.getElementById('experience-end-year').value = experience.endYear || '';
        document.getElementById('experience-current-job').checked = experience.isCurrent || false;
        document.getElementById('experience-description').value = experience.description || '';
        
        // "Hala burada çalışıyorum" checkbox'ı için bitiş tarihi alanlarını devre dışı bırak
        const endMonth = document.getElementById('experience-end-month');
        const endYear = document.getElementById('experience-end-year');
        if (experience.isCurrent) {
            if (endMonth) endMonth.disabled = true;
            if (endYear) endYear.disabled = true;
        } else {
            if (endMonth) endMonth.disabled = false;
            if (endYear) endYear.disabled = false;
        }
        
        const saveBtn = document.getElementById('experience-save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Güncelle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewExperiences();
    }
    
    // Deneyim kaydet
    function saveExperience() {
        console.log('🔧 CV Experience Manager: "Ekle" button clicked');
        
        // Verify all form elements exist
        const jobTitleEl = document.getElementById('experience-job-title');
        const companyEl = document.getElementById('experience-company');
        const startMonthEl = document.getElementById('experience-start-month');
        const startYearEl = document.getElementById('experience-start-year');
        const endMonthEl = document.getElementById('experience-end-month');
        const endYearEl = document.getElementById('experience-end-year');
        const isCurrentEl = document.getElementById('experience-current-job');
        const descriptionEl = document.getElementById('experience-description');
        
        // Log element detection
        console.log('🔧 CV Experience Manager: Form elements found:', {
            jobTitle: !!jobTitleEl,
            company: !!companyEl,
            startMonth: !!startMonthEl,
            startYear: !!startYearEl,
            endMonth: !!endMonthEl,
            endYear: !!endYearEl,
            isCurrent: !!isCurrentEl,
            description: !!descriptionEl,
        });
        
        // Check for missing elements
        if (!jobTitleEl || !companyEl) {
            console.error('❌ CV Experience Manager: Required form elements not found!');
            alert('Form hatası: Gerekli alanlar bulunamadı. Lütfen sayfayı yenileyin.');
            return;
        }
        
        // Extract form values with null checks
        const jobTitle = jobTitleEl ? jobTitleEl.value.trim() : '';
        const company = companyEl ? companyEl.value.trim() : '';
        const startMonth = startMonthEl ? startMonthEl.value : '';
        const startYear = startYearEl ? startYearEl.value : '';
        const endMonth = endMonthEl ? endMonthEl.value : '';
        const endYear = endYearEl ? endYearEl.value : '';
        const isCurrent = isCurrentEl ? isCurrentEl.checked : false;
        const description = descriptionEl ? descriptionEl.value.trim() : '';
        
        console.log('🔧 CV Experience Manager: Form data extracted:', {
            jobTitle,
            company,
            startMonth,
            startYear,
            endMonth,
            endYear,
            isCurrent,
            descriptionLength: description.length,
            editingIndex,
        });
        
        // Validation
        if (!jobTitle || !company) {
            console.warn('⚠️ CV Experience Manager: Validation failed - missing jobTitle or company');
            alert('Lütfen iş unvanı ve şirket adını girin.');
            return;
        }
        
        // Get existing experiences
        const experiences = getExperiences();
        console.log('🔧 CV Experience Manager: Current experiences count:', experiences.length);
        
        // Create experience object
        const experience = {
            jobTitle,
            company,
            startMonth,
            startYear,
            endMonth: isCurrent ? '' : endMonth,
            endYear: isCurrent ? '' : endYear,
            isCurrent,
            description
        };
        
        console.log('🔧 CV Experience Manager: Experience object created:', experience);
        
        // Save to array
        if (editingIndex !== null) {
            // Düzenleme modu
            console.log('🔧 CV Experience Manager: Updating experience at index:', editingIndex);
            if (editingIndex >= 0 && editingIndex < experiences.length) {
                experiences[editingIndex] = experience;
            } else {
                console.error('❌ CV Experience Manager: Invalid editingIndex:', editingIndex);
                editingIndex = null; // Reset and add as new
                experiences.push(experience);
            }
        } else {
            // Yeni ekleme
            console.log('🔧 CV Experience Manager: Adding new experience');
            experiences.push(experience);
        }
        
        // Save to localStorage
        try {
            saveExperiences(experiences);
            console.log('🔧 CV Experience Manager: Experiences saved to localStorage, new count:', experiences.length);
            
            // Verify save
            const verifyExperiences = getExperiences();
            if (verifyExperiences.length !== experiences.length) {
                console.error('❌ CV Experience Manager: Save verification failed! Expected:', experiences.length, 'Got:', verifyExperiences.length);
            } else {
                console.log('✅ CV Experience Manager: Save verified successfully');
            }
        } catch (error) {
            console.error('❌ CV Experience Manager: Error saving to localStorage:', error);
            alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            return;
        }
        
        // Update UI
        try {
            renderExperiences();
            console.log('🔧 CV Experience Manager: UI updated');
        } catch (error) {
            console.error('❌ CV Experience Manager: Error rendering experiences:', error);
        }
        
        // Clear form
        try {
            clearForm();
            console.log('🔧 CV Experience Manager: Form cleared');
        } catch (error) {
            console.error('❌ CV Experience Manager: Error clearing form:', error);
        }
        
        // Scroll to form
        const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        console.log('✅ CV Experience Manager: Save operation completed successfully');
    }
    
    // Deneyim sil
    function deleteExperience(index) {
        if (confirm('Bu deneyimi silmek istediğinize emin misiniz?')) {
            const experiences = getExperiences();
            experiences.splice(index, 1);
            saveExperiences(experiences);
            renderExperiences();
        }
    }
    
    // Deneyim düzenle
    function editExperience(index) {
        const experiences = getExperiences();
        if (experiences[index]) {
            editingIndex = index;
            fillForm(experiences[index]);
            
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
        document.querySelectorAll('.experience-edit-btn').forEach(btn => {
            // Önceki listener'ları kaldır
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editExperience(index);
            });
        });
        
        // Sil butonları
        document.querySelectorAll('.experience-delete-btn').forEach(btn => {
            // Önceki listener'ları kaldır
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteExperience(index);
            });
        });
    }
    
    // Anlık önizleme için input listener'ları ekle
    function attachLivePreviewListeners() {
        const inputs = [
            'experience-job-title',
            'experience-company',
            'experience-start-month',
            'experience-start-year',
            'experience-end-month',
            'experience-end-year',
            'experience-description'
        ];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateLivePreview);
                input.addEventListener('change', updateLivePreview);
            }
        });
        
        const checkbox = document.getElementById('experience-current-job');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const endMonth = document.getElementById('experience-end-month');
                const endYear = document.getElementById('experience-end-year');
                
                if (this.checked) {
                    if (endMonth) {
                        endMonth.value = '';
                        endMonth.disabled = true;
                    }
                    if (endYear) {
                        endYear.value = '';
                        endYear.disabled = true;
                    }
                } else {
                    if (endMonth) endMonth.disabled = false;
                    if (endYear) endYear.disabled = false;
                }
                
                updateLivePreview();
            });
        }
    }
    
    // Global olarak erişilebilir yap
    window.renderPreviewExperiences = renderPreviewExperiences;
    window.renderExperiences = renderExperiences;
    
    // Sayfa yüklendiğinde başlat
    function init() {
        populateYearSelects();
        renderExperiences();
        attachLivePreviewListeners();
        
        // Kaydet butonu - ensure single listener
        const saveBtn = document.getElementById('experience-save-btn');
        if (saveBtn) {
            // Remove any existing listeners by cloning
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', saveExperience);
            console.log('✅ CV Experience Manager: "Ekle" button listener attached');
        } else {
            console.warn('⚠️ CV Experience Manager: "Ekle" button not found');
        }
        
        // Vazgeç butonu - ensure single listener
        const cancelBtn = document.getElementById('experience-cancel-btn');
        if (cancelBtn) {
            // Remove any existing listeners by cloning
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', clearForm);
            console.log('✅ CV Experience Manager: "Vazgeç" button listener attached');
        } else {
            console.warn('⚠️ CV Experience Manager: "Vazgeç" button not found');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
