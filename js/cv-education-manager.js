// CV Eğitim Yönetimi İşlevselliği
// REFERENCE: cv-experience-manager.js (GOLD STANDARD)
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-education';
    let editingIndex = null;
    let livePreviewTimeout = null;
    
    // Yıl seçeneklerini doldur (son 20 yıl + gelecek 5 yıl)
    function populateYearSelects() {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 20; // Son 20 yıl
        const endYear = currentYear + 5; // Gelecek 5 yıl
        const startYearSelect = document.getElementById('education-start-year');
        const endYearSelect = document.getElementById('education-end-year');
        
        if (startYearSelect) {
            // Mevcut seçenekleri temizle (varsayılan "Yıl" hariç)
            while (startYearSelect.children.length > 1) {
                startYearSelect.removeChild(startYearSelect.lastChild);
            }
            for (let year = endYear; year >= startYear; year--) {
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
            for (let year = endYear; year >= startYear; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                endYearSelect.appendChild(option);
            }
        }
    }
    
    // localStorage'dan eğitimleri oku
    function getEducation() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // localStorage'a eğitimleri kaydet
    function saveEducationToStorage(education) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(education));
        } catch (e) {
            console.error('Eğitimler kaydedilemedi:', e);
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
    
    // Önizleme için eğitim kartı oluştur
    function createPreviewEducationCard(education) {
        const dateStr = formatDate(
            education.startMonth,
            education.startYear,
            education.endMonth,
            education.endYear,
            education.isCurrent
        );
        
        const card = document.createElement('div');
        card.className = 'mb-4';
        card.innerHTML = `
            <div class="flex justify-between items-baseline mb-1">
                <h3 class="text-sm font-bold text-slate-900">${education.degree || education.school || ''}</h3>
                <span class="text-xs text-slate-500 font-medium">${dateStr || ''}</span>
            </div>
            <p class="text-xs text-slate-700 italic mb-2">${education.school || ''}</p>
            ${education.details || education.description ? `
            <p class="text-xs text-slate-600 leading-relaxed">${(education.details || education.description).replace(/\n/g, '<br>')}</p>
            ` : ''}
        `;
        
        return card;
    }
    
    // Önizleme alanını render et
    function renderPreviewEducation() {
        const previewContainer = document.getElementById('education-preview-container');
        if (!previewContainer) return;
        
        // Formdan mevcut değerleri al (anlık önizleme için)
        const school = document.getElementById('education-school-name')?.value.trim() || '';
        const degree = document.getElementById('education-degree')?.value.trim() || '';
        const startMonth = document.getElementById('education-start-month')?.value || '';
        const startYear = document.getElementById('education-start-year')?.value || '';
        const endMonth = document.getElementById('education-end-month')?.value || '';
        const endYear = document.getElementById('education-end-year')?.value || '';
        const isCurrent = document.getElementById('education-current')?.checked || false;
        const description = document.getElementById('education-description')?.value.trim() || '';
        
        // Eğer form doluysa, önce formdaki değeri göster (anlık önizleme)
        if (school || degree) {
            const tempEducation = {
                school,
                degree,
                startMonth,
                startYear,
                endMonth: isCurrent ? '' : endMonth,
                endYear: isCurrent ? '' : endYear,
                isCurrent,
                details: description
            };
            
            previewContainer.innerHTML = '';
            const card = createPreviewEducationCard(tempEducation);
            previewContainer.appendChild(card);
            
            // Kaydedilmiş diğer eğitimleri de ekle
            const education = getEducation();
            education.forEach((edu, index) => {
                if (editingIndex === null || index !== editingIndex) {
                    const eduCard = createPreviewEducationCard(edu);
                    previewContainer.appendChild(eduCard);
                }
            });
        } else {
            // Form boşsa, sadece kaydedilmiş eğitimleri göster
            const education = getEducation();
            previewContainer.innerHTML = '';
            
            education.forEach(edu => {
                const card = createPreviewEducationCard(edu);
                previewContainer.appendChild(card);
            });
        }
    }
    
    // Anlık önizleme güncelle
    function updateLivePreview() {
        // Debounce: Kullanıcı yazmayı bıraktıktan 300ms sonra güncelle
        clearTimeout(livePreviewTimeout);
        livePreviewTimeout = setTimeout(() => {
            renderPreviewEducation();
            
            // Ana CV önizlemesini de güncelle (sağ taraftaki canlı önizleme)
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            if (window.initLivePreview) {
                window.initLivePreview();
            }
        }, 300);
    }
    
    // Eğitim kartı oluştur (liste için)
    function createEducationCard(education, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing';
        card.setAttribute('data-education-index', index);
        
        const dateStr = formatDate(
            education.startMonth,
            education.startYear,
            education.endMonth,
            education.endYear,
            education.isCurrent
        );
        
        card.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0">
                    <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${education.school || 'Okul Adı'}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal truncate">${education.degree || ''}${dateStr ? ' • ' + dateStr : ''}</p>
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
            // Varsayılan örnek eğitimler
            const defaultEducation = [
                {
                    school: 'İstanbul Teknik Üniversitesi',
                    degree: 'Bilgisayar Mühendisliği',
                    city: 'İstanbul',
                    grade: '3.5/4.0',
                    startMonth: 'Eylül',
                    startYear: '2018',
                    endMonth: 'Haziran',
                    endYear: '2022',
                    isCurrent: false,
                    details: 'Yazılım geliştirme ve algoritma analizi üzerine odaklandım.\nWeb teknolojileri ve veritabanı yönetimi dersleri aldım.\nBitirme projesi olarak e-ticaret platformu geliştirdim.'
                }
            ];
            
            defaultEducation.forEach((edu, index) => {
                const card = createEducationCard(edu, index);
                listContainer.appendChild(card);
            });
            
            saveEducationToStorage(defaultEducation);
        } else {
            education.forEach((edu, index) => {
                const card = createEducationCard(edu, index);
                listContainer.appendChild(card);
            });
        }
        
        // Event listener'ları ekle
        attachEventListeners();
        
        // Önizlemeyi de güncelle
        renderPreviewEducation();
    }
    
    // Formu temizle
    function clearForm() {
        console.log('🔧 CV Education Manager: Clearing form');
        
        const schoolEl = document.getElementById('education-school-name');
        const degreeEl = document.getElementById('education-degree');
        const cityEl = document.getElementById('education-city');
        const gradeEl = document.getElementById('education-grade');
        const startMonthEl = document.getElementById('education-start-month');
        const startYearEl = document.getElementById('education-start-year');
        const endMonthEl = document.getElementById('education-end-month');
        const endYearEl = document.getElementById('education-end-year');
        const isCurrentEl = document.getElementById('education-current');
        const descriptionEl = document.getElementById('education-description');
        
        if (schoolEl) schoolEl.value = '';
        if (degreeEl) degreeEl.value = '';
        if (cityEl) cityEl.value = '';
        if (gradeEl) gradeEl.value = '';
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
        
        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Ekle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewEducation();
        
        console.log('✅ CV Education Manager: Form cleared');
    }
    
    // Formu doldur
    function fillForm(education) {
        document.getElementById('education-school-name').value = education.school || '';
        document.getElementById('education-degree').value = education.degree || '';
        document.getElementById('education-city').value = education.city || '';
        document.getElementById('education-grade').value = education.grade || '';
        document.getElementById('education-start-month').value = education.startMonth || '';
        document.getElementById('education-start-year').value = education.startYear || '';
        document.getElementById('education-end-month').value = education.endMonth || '';
        document.getElementById('education-end-year').value = education.endYear || '';
        document.getElementById('education-current').checked = education.isCurrent || false;
        document.getElementById('education-description').value = education.details || education.description || '';
        
        // "Hala burada çalışıyorum" checkbox'ı için bitiş tarihi alanlarını devre dışı bırak
        const endMonth = document.getElementById('education-end-month');
        const endYear = document.getElementById('education-end-year');
        if (education.isCurrent) {
            if (endMonth) endMonth.disabled = true;
            if (endYear) endYear.disabled = true;
        } else {
            if (endMonth) endMonth.disabled = false;
            if (endYear) endYear.disabled = false;
        }
        
        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Güncelle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewEducation();
    }
    
    // Eğitim kaydet
    function saveEducation() {
        console.log('🔧 CV Education Manager: "Ekle" button clicked');
        
        // Verify all form elements exist
        const schoolEl = document.getElementById('education-school-name');
        const degreeEl = document.getElementById('education-degree');
        const cityEl = document.getElementById('education-city');
        const gradeEl = document.getElementById('education-grade');
        const startMonthEl = document.getElementById('education-start-month');
        const startYearEl = document.getElementById('education-start-year');
        const endMonthEl = document.getElementById('education-end-month');
        const endYearEl = document.getElementById('education-end-year');
        const isCurrentEl = document.getElementById('education-current');
        const descriptionEl = document.getElementById('education-description');
        
        // Log element detection
        console.log('🔧 CV Education Manager: Form elements found:', {
            school: !!schoolEl,
            degree: !!degreeEl,
            city: !!cityEl,
            grade: !!gradeEl,
            startMonth: !!startMonthEl,
            startYear: !!startYearEl,
            endMonth: !!endMonthEl,
            endYear: !!endYearEl,
            isCurrent: !!isCurrentEl,
            description: !!descriptionEl,
        });
        
        // Check for missing elements
        if (!schoolEl || !degreeEl) {
            console.error('❌ CV Education Manager: Required form elements not found!');
            alert('Form hatası: Gerekli alanlar bulunamadı. Lütfen sayfayı yenileyin.');
            return;
        }
        
        // Extract form values with null checks
        const school = schoolEl ? schoolEl.value.trim() : '';
        const degree = degreeEl ? degreeEl.value.trim() : '';
        const city = cityEl ? cityEl.value.trim() : '';
        const grade = gradeEl ? gradeEl.value.trim() : '';
        const startMonth = startMonthEl ? startMonthEl.value : '';
        const startYear = startYearEl ? startYearEl.value : '';
        const endMonth = endMonthEl ? endMonthEl.value : '';
        const endYear = endYearEl ? endYearEl.value : '';
        const isCurrent = isCurrentEl ? isCurrentEl.checked : false;
        const description = descriptionEl ? descriptionEl.value.trim() : '';
        
        console.log('🔧 CV Education Manager: Form data extracted:', {
            school,
            degree,
            city,
            grade,
            startMonth,
            startYear,
            endMonth,
            endYear,
            isCurrent,
            descriptionLength: description.length,
            editingIndex,
        });
        
        // Validation
        if (!school || !degree) {
            console.warn('⚠️ CV Education Manager: Validation failed - missing school or degree');
            alert('Lütfen okul adı ve bölüm/derece bilgilerini girin.');
            return;
        }
        
        // Get existing education
        const education = getEducation();
        console.log('🔧 CV Education Manager: Current education count:', education.length);
        
        // Create education object
        const educationObj = {
            school,
            degree,
            city,
            grade,
            startMonth,
            startYear,
            endMonth: isCurrent ? '' : endMonth,
            endYear: isCurrent ? '' : endYear,
            isCurrent,
            details: description,
        };
        
        console.log('🔧 CV Education Manager: Education object created:', educationObj);
        
        // Save to array
        if (editingIndex !== null) {
            // Düzenleme modu
            console.log('🔧 CV Education Manager: Updating education at index:', editingIndex);
            if (editingIndex >= 0 && editingIndex < education.length) {
                education[editingIndex] = educationObj;
            } else {
                console.error('❌ CV Education Manager: Invalid editingIndex:', editingIndex);
                editingIndex = null; // Reset and add as new
                education.push(educationObj);
            }
        } else {
            // Yeni ekleme
            console.log('🔧 CV Education Manager: Adding new education');
            education.push(educationObj);
        }
        
        // Save to localStorage
        try {
            saveEducationToStorage(education);
            console.log('🔧 CV Education Manager: Education saved to localStorage, new count:', education.length);
            
            // Verify save
            const verifyEducation = getEducation();
            if (verifyEducation.length !== education.length) {
                console.error('❌ CV Education Manager: Save verification failed! Expected:', education.length, 'Got:', verifyEducation.length);
            } else {
                console.log('✅ CV Education Manager: Save verified successfully');
            }
        } catch (error) {
            console.error('❌ CV Education Manager: Error saving to localStorage:', error);
            alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            return;
        }
        
        // Update UI
        try {
            renderEducation();
            console.log('🔧 CV Education Manager: UI updated');
        } catch (error) {
            console.error('❌ CV Education Manager: Error rendering education:', error);
        }
        
        // Ana CV önizlemesini güncelle (sağ taraftaki canlı önizleme)
        try {
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            if (window.initLivePreview) {
                window.initLivePreview();
            }
            console.log('🔧 CV Education Manager: Live preview updated');
        } catch (error) {
            console.error('❌ CV Education Manager: Error updating live preview:', error);
        }
        
        // Auto-save'i tetikle
        document.dispatchEvent(new CustomEvent('cv-data-changed'));
        
        // Clear form
        try {
            clearForm();
            console.log('🔧 CV Education Manager: Form cleared');
        } catch (error) {
            console.error('❌ CV Education Manager: Error clearing form:', error);
        }
        
        // Scroll to form
        const formContainer = document.querySelector('.bg-slate-50.dark\\:bg-\\[\\#1a1d2d\\]');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        console.log('✅ CV Education Manager: Save operation completed successfully');
    }
    
    // Eğitim sil
    function deleteEducation(index) {
        if (confirm('Bu eğitimi silmek istediğinize emin misiniz?')) {
            const education = getEducation();
            education.splice(index, 1);
            saveEducationToStorage(education);
            renderEducation();
            
            // Ana CV önizlemesini güncelle (sağ taraftaki canlı önizleme)
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            if (window.initLivePreview) {
                window.initLivePreview();
            }
            
            // Auto-save'i tetikle
            document.dispatchEvent(new CustomEvent('cv-data-changed'));
        }
    }
    
    // Eğitim düzenle
    function editEducation(index) {
        const education = getEducation();
        if (education[index]) {
            editingIndex = index;
            fillForm(education[index]);
            
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
        document.querySelectorAll('.education-edit-btn').forEach(btn => {
            // Önceki listener'ları kaldır
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editEducation(index);
            });
        });
        
        // Sil butonları
        document.querySelectorAll('.education-delete-btn').forEach(btn => {
            // Önceki listener'ları kaldır
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteEducation(index);
            });
        });
    }
    
    // Anlık önizleme için input listener'ları ekle
    function attachLivePreviewListeners() {
        const inputs = [
            'education-school-name',
            'education-degree',
            'education-city',
            'education-grade',
            'education-start-month',
            'education-start-year',
            'education-end-month',
            'education-end-year',
            'education-description'
        ];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateLivePreview);
                input.addEventListener('change', updateLivePreview);
            }
        });
        
        const checkbox = document.getElementById('education-current');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const endMonth = document.getElementById('education-end-month');
                const endYear = document.getElementById('education-end-year');
                
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
    window.renderPreviewEducation = renderPreviewEducation;
    window.renderEducation = renderEducation;
    
    // Sayfa yüklendiğinde başlat
    function init() {
        populateYearSelects();
        renderEducation();
        attachLivePreviewListeners();
        
        // Kaydet butonu - ensure single listener
        const saveBtn = document.getElementById('education-save-btn');
        if (saveBtn) {
            // Remove any existing listeners by cloning
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', saveEducation);
            console.log('✅ CV Education Manager: "Ekle" button listener attached');
        } else {
            console.warn('⚠️ CV Education Manager: "Ekle" button not found');
        }
        
        // Vazgeç butonu - ensure single listener
        const cancelBtn = document.getElementById('education-cancel-btn');
        if (cancelBtn) {
            // Remove any existing listeners by cloning
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', clearForm);
            console.log('✅ CV Education Manager: "Vazgeç" button listener attached');
        } else {
            console.warn('⚠️ CV Education Manager: "Vazgeç" button not found');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
