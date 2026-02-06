// CV Yetenekler Yönetimi İşlevselliği
(function() {
    'use strict';

    // Yetenekleri al
    function getSkills() {
        if (window.CVStateManager) {
            return window.CVStateManager.getSkills();
        }
        return [];
    }

    // Yetenekleri kaydet
    function saveSkills(skills) {
        if (window.CVStateManager) {
            return window.CVStateManager.setSkills(skills);
        }
        return false;
    }

    // Yetenek kartı oluştur
    function createSkillCard(skill, index) {
        const card = document.createElement('div');
        card.className = 'group flex items-center justify-between gap-3 bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 shadow-sm hover:border-primary/50 transition-all';
        card.setAttribute('data-skill-index', index);

        const levelText = skill.level ? ` (${skill.level})` : '';

        card.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <span class="text-slate-900 dark:text-white text-sm font-medium truncate">${skill.name || skill}${levelText}</span>
            </div>
            <button class="skill-delete-btn size-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" data-index="${index}">
                <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
        `;

        return card;
    }

    // Yetenek listesini render et
    function renderSkills() {
        const listContainer = document.getElementById('skills-list');
        if (!listContainer) return;

        const skills = getSkills();
        listContainer.innerHTML = '';

        if (skills.length === 0) {
            listContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Yetenek eklenmedi. Yukarıdaki formu kullanarak yeteneklerinizi ekleyin.</p>';
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-wrap gap-2';
            skills.forEach((skill, index) => {
                const card = createSkillCard(skill, index);
                wrapper.appendChild(card);
            });
            listContainer.appendChild(wrapper);
        }

        attachEventListeners();
        renderPreviewSkills();
    }

    // Önizleme için yetenekleri render et
    function renderPreviewSkills() {
        const previewContainer = document.getElementById('skills-preview-container');
        if (!previewContainer) return;

        const skills = getSkills();
        previewContainer.innerHTML = '';

        if (skills.length === 0) {
            previewContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Yetenek eklenmedi</p>';
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-wrap gap-1.5';
            skills.forEach(skill => {
                const name = typeof skill === 'string' ? skill : skill.name;
                const span = document.createElement('span');
                span.className = 'px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium';
                span.textContent = name;
                wrapper.appendChild(span);
            });
            previewContainer.appendChild(wrapper);
        }

        // Global event fırlat
        window.dispatchEvent(new CustomEvent('cv-skills-updated'));
    }

    // Formu temizle
    function clearForm() {
        const skillInput = document.getElementById('skill-name');
        const levelSelect = document.getElementById('skill-level');

        if (skillInput) skillInput.value = '';
        if (levelSelect) levelSelect.value = '';
    }

    // Yetenek ekle
    function addSkill() {
        const skillInput = document.getElementById('skill-name');
        const levelSelect = document.getElementById('skill-level');

        const name = skillInput?.value.trim() || '';
        const level = levelSelect?.value || '';

        if (!name) {
            alert('Lütfen bir yetenek adı girin.');
            return;
        }

        const skills = getSkills();

        // Aynı yetenek var mı kontrol et
        const exists = skills.some(s => {
            const existingName = typeof s === 'string' ? s : s.name;
            return existingName.toLowerCase() === name.toLowerCase();
        });

        if (exists) {
            alert('Bu yetenek zaten eklenmiş.');
            return;
        }

        const skill = level ? { name, level } : name;
        skills.push(skill);

        saveSkills(skills);
        renderSkills();
        clearForm();

        // Input'a fokusla
        if (skillInput) skillInput.focus();
    }

    // Yetenek sil
    function deleteSkill(index) {
        const skills = getSkills();
        if (index >= 0 && index < skills.length) {
            skills.splice(index, 1);
            saveSkills(skills);
            renderSkills();
        }
    }

    // Event listener'ları ekle
    function attachEventListeners() {
        document.querySelectorAll('.skill-delete-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteSkill(index);
            });
        });
    }

    // Init
    function init() {
        renderSkills();

        // Ekle butonu
        const addBtn = document.getElementById('skill-add-btn');
        if (addBtn) {
            const newAddBtn = addBtn.cloneNode(true);
            addBtn.parentNode.replaceChild(newAddBtn, addBtn);
            newAddBtn.addEventListener('click', addSkill);
        }

        // Enter ile ekleme
        const skillInput = document.getElementById('skill-name');
        if (skillInput) {
            skillInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                }
            });
        }

        console.log('CV Skills Manager initialized');
    }

    // Global erişim
    window.renderPreviewSkills = renderPreviewSkills;
    window.renderSkills = renderSkills;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
