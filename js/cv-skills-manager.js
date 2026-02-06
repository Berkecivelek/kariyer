// CV Yetenekler Yönetimi İşlevselliği
// REFERENCE: cv-experience-manager.js ve cv-education-manager.js (GOLD STANDARD)
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-skills';
    let editingIndex = null;
    let selectedLevel = 'Orta';
    let selectedLevelValue = 60;
    let livePreviewTimeout = null;
    
    // Seviye mapping
    const levelMap = {
        'Başlangıç': { value: 20, label: 'Başlangıç' },
        'Temel': { value: 40, label: 'Temel' },
        'Orta': { value: 60, label: 'Orta' },
        'İyi': { value: 80, label: 'İyi' },
        'Uzman': { value: 100, label: 'Uzman' }
    };
    
    // Kategori mapping
    const categoryMap = {
        'Teknik': 'Teknik',
        'Araçlar': 'Araçlar',
        'Kişisel': 'Kişisel',
        'Diller': 'Diller',
        'Sertifikalar': 'Sertifikalar'
    };
    
    // localStorage'dan yetenekleri oku
    function getSkills() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // localStorage'a yetenekleri kaydet
    function saveSkillsToStorage(skills) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
        } catch (e) {
            console.error('Yetenekler kaydedilemedi:', e);
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
    
    // Kategori kısa adını al
    function getCategoryShort(category) {
        if (category.includes('Teknik')) return 'Teknik';
        if (category.includes('Araçlar')) return 'Araçlar';
        if (category.includes('Kişisel')) return 'Kişisel';
        if (category.includes('Diller')) return 'Diller';
        if (category.includes('Sertifikalar')) return 'Sertifikalar';
        return category;
    }
    
    // Yetenek kartı oluştur (liste için)
    function createSkillCard(skill, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-4 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing';
        card.setAttribute('data-skill-index', index);
        
        // Skill name'i güvenli şekilde al (string veya object olabilir)
        let skillName = '';
        let skillLevel = 'Orta';
        let skillCategory = '';
        
        if (typeof skill === 'string') {
            skillName = skill;
        } else if (skill && typeof skill === 'object') {
            skillName = skill.name || '';
            skillLevel = skill.level || 'Orta';
            skillCategory = skill.category || '';
        }
        
        const levelPercentage = getLevelPercentage(skillLevel);
        const categoryShort = getCategoryShort(skillCategory);
        
        card.innerHTML = `
            <div class="flex flex-1 items-center gap-4 overflow-hidden">
                <div class="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                    <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                <div class="flex flex-col justify-center min-w-0 w-full pr-4">
                    <div class="flex justify-between items-center mb-1.5">
                        <p class="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">${skillName || 'Yetenek Adı'}</p>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">${categoryShort || 'Kategori'}</span>
                    </div>
                    <div class="w-full flex items-center gap-3">
                        <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full" style="width: ${levelPercentage}%"></div>
                        </div>
                        <span class="text-xs font-medium text-slate-500 dark:text-slate-400 w-16 text-right">${getLevelLabel(skillLevel)}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="skill-edit-btn size-8 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="skill-delete-btn size-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" data-index="${index}">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        `;
        
        return card;
    }
    
    // Yetenek listesini render et
    function renderSkills() {
        const listContainer = document.getElementById('skills-list');
        if (!listContainer) {
            console.error('❌ CV Skills Manager: skills-list container not found!');
            return;
        }
        
        const skills = getSkills();
        listContainer.innerHTML = '';
        
        skills.forEach((skill, index) => {
            const card = createSkillCard(skill, index);
            listContainer.appendChild(card);
        });
        
        // Event listener'ları ekle
        attachEventListeners();
        
        // Önizlemeyi de güncelle
        renderPreviewSkills();
    }
    
    // Önizleme için yetenekleri render et
    function renderPreviewSkills() {
        const previewContainer = document.getElementById('skills-preview-container');
        if (!previewContainer) return;
        
        const skills = getSkills();
        previewContainer.innerHTML = '';
        
        if (skills.length === 0) {
            // Varsayılan yetenekler
            const defaultSkills = ['JavaScript (ES6+)', 'React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Git', 'Docker'];
            defaultSkills.forEach(skillName => {
                const span = document.createElement('span');
                span.className = 'px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium';
                span.textContent = skillName;
                previewContainer.appendChild(span);
            });
        } else {
            skills.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium';
                // Skill name'i güvenli şekilde al (string veya object olabilir)
                let skillName = '';
                if (typeof skill === 'string') {
                    skillName = skill;
                } else if (skill && typeof skill === 'object') {
                    skillName = skill.name || '';
                }
                span.textContent = skillName;
                previewContainer.appendChild(span);
            });
        }
        
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
        const nameEl = document.getElementById('skill-name');
        const categoryEl = document.getElementById('skill-category');
        const levelDisplayEl = document.getElementById('skill-level-display');
        const saveBtn = document.getElementById('skill-save-btn');
        
        if (nameEl) nameEl.value = '';
        if (categoryEl) categoryEl.value = '';
        
        // Seviye butonlarını sıfırla
        selectedLevel = 'Orta';
        selectedLevelValue = 60;
        updateLevelButtons();
        
        if (levelDisplayEl) levelDisplayEl.textContent = 'Orta Seviye';
        
        editingIndex = null;
        
        if (saveBtn) {
            saveBtn.textContent = 'Ekle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewSkills();
    }
    
    // Formu doldur
    function fillForm(skill) {
        const nameEl = document.getElementById('skill-name');
        const categoryEl = document.getElementById('skill-category');
        const levelDisplayEl = document.getElementById('skill-level-display');
        const saveBtn = document.getElementById('skill-save-btn');
        
        if (nameEl) nameEl.value = skill.name || '';
        if (categoryEl) categoryEl.value = skill.category || '';
        
        // Seviye butonlarını güncelle
        selectedLevel = skill.level || 'Orta';
        selectedLevelValue = getLevelPercentage(selectedLevel);
        updateLevelButtons();
        
        if (levelDisplayEl) {
            levelDisplayEl.textContent = getLevelLabel(selectedLevel) + ' Seviye';
        }
        
        if (saveBtn) {
            saveBtn.textContent = 'Güncelle';
        }
        
        // Önizlemeyi güncelle
        renderPreviewSkills();
    }
    
    // Seviye butonlarını güncelle
    function updateLevelButtons() {
        document.querySelectorAll('.skill-level-btn').forEach(btn => {
            const level = btn.getAttribute('data-level');
            const value = parseInt(btn.getAttribute('data-level-value'));
            
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
    
    // Yetenek kaydet
    function saveSkill() {
        const nameEl = document.getElementById('skill-name');
        const categoryEl = document.getElementById('skill-category');
        
        if (!nameEl || !categoryEl) {
            console.error('❌ CV Skills Manager: Required form elements not found!');
            alert('Form hatası: Gerekli alanlar bulunamadı. Lütfen sayfayı yenileyin.');
            return;
        }
        
        const name = nameEl.value.trim();
        const category = categoryEl.value;
        
        // Validation
        if (!name || !category) {
            alert('Lütfen yetenek adı ve kategori seçin.');
            return;
        }
        
        // Get existing skills
        const skills = getSkills();
        
        // Create skill object
        const skill = {
            id: editingIndex !== null ? skills[editingIndex].id : Date.now().toString(),
            name,
            category,
            level: selectedLevel,
            levelValue: selectedLevelValue
        };
        
        // Save to array
        if (editingIndex !== null) {
            // Düzenleme modu
            if (editingIndex >= 0 && editingIndex < skills.length) {
                skills[editingIndex] = skill;
            } else {
                editingIndex = null;
                skills.push(skill);
            }
        } else {
            // Yeni ekleme
            skills.push(skill);
        }
        
        // Save to localStorage
        try {
            saveSkillsToStorage(skills);
        } catch (error) {
            console.error('❌ CV Skills Manager: Error saving to localStorage:', error);
            alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            return;
        }
        
        // Update UI
        renderSkills();
        
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
    
    // Yetenek sil
    function deleteSkill(index) {
        const skills = getSkills();
        skills.splice(index, 1);
        saveSkillsToStorage(skills);
        renderSkills();
        
        // Ana CV önizlemesini güncelle
        updateLivePreview();
        
        // Auto-save'i tetikle
        document.dispatchEvent(new CustomEvent('cv-data-changed'));
    }
    
    // Yetenek düzenle
    function editSkill(index) {
        const skills = getSkills();
        if (skills[index]) {
            editingIndex = index;
            fillForm(skills[index]);
            
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
        document.querySelectorAll('.skill-edit-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editSkill(index);
            });
        });
        
        // Sil butonları
        document.querySelectorAll('.skill-delete-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteSkill(index);
            });
        });
    }
    
    // Seviye butonları için event listener'ları ekle
    function attachLevelButtonListeners() {
        document.querySelectorAll('.skill-level-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                selectedLevel = this.getAttribute('data-level');
                selectedLevelValue = parseInt(this.getAttribute('data-level-value'));
                
                updateLevelButtons();
                
                const levelDisplayEl = document.getElementById('skill-level-display');
                if (levelDisplayEl) {
                    levelDisplayEl.textContent = getLevelLabel(selectedLevel) + ' Seviye';
                }
            });
        });
    }
    
    // Global olarak erişilebilir yap
    window.renderPreviewSkills = renderPreviewSkills;
    window.renderSkills = renderSkills;
    
    // 🔒 Yeni kullanıcı kontrolü
    function isNewUser() {
        try {
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            const allowedFieldsForNewUser = ['fullname-first', 'fullname-last', 'email'];
            
            const hasOnlyRegistrationData = Object.keys(cvData).filter(k => 
                !allowedFieldsForNewUser.includes(k) && cvData[k] && cvData[k] !== ''
            ).length === 0;
            
            const skills = getSkills();
            const hasNoSkills = !skills || skills.length === 0;
            
            return hasOnlyRegistrationData && hasNoSkills;
        } catch (e) {
            return false;
        }
    }
    
    // Sayfa yüklendiğinde başlat
    function init() {
        // 🔒 KRİTİK: Yeni kullanıcı kontrolü - ÖNCE kontrol et ve temizle
        const newUser = isNewUser();
        if (newUser) {
            console.log('🔒 Yeni kullanıcı tespit edildi: Yetenekler localStorage\'dan temizleniyor');
            saveSkillsToStorage([]); // localStorage'ı temizle
        }
        
        // Mevcut yetenekleri render et
        renderSkills();
        
        // Seviye butonları için listener'ları ekle
        attachLevelButtonListeners();
        
        // Kaydet butonu
        const saveBtn = document.getElementById('skill-save-btn');
        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', saveSkill);
        }
        
        // Vazgeç butonu
        const cancelBtn = document.getElementById('skill-cancel-btn');
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', clearForm);
        }
        
        // AI CV analizi ile otomatik doldurma kontrolü
        try {
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            if (cvData.skills && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
                const existingSkills = getSkills();
                if (existingSkills.length === 0) {
                    // AI'dan gelen yetenekleri ekle
                    cvData.skills.forEach(skill => {
                        if (typeof skill === 'string') {
                            existingSkills.push({
                                id: Date.now().toString() + Math.random(),
                                name: skill,
                                category: 'Teknik',
                                level: 'Orta',
                                levelValue: 60
                            });
                        } else if (skill.name) {
                            existingSkills.push({
                                id: skill.id || Date.now().toString() + Math.random(),
                                name: skill.name,
                                category: skill.category || 'Teknik',
                                level: skill.level || 'Orta',
                                levelValue: skill.levelValue || getLevelPercentage(skill.level || 'Orta')
                            });
                        }
                    });
                    saveSkillsToStorage(existingSkills);
                    renderSkills();
                }
            }
        } catch (e) {
            console.error('AI skills auto-fill error:', e);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

