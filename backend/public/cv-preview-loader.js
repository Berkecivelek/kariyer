// CV Önizleme Yükleyici - Dinamik Önizleme Sistemi
// Tüm CV verilerini CVStateManager'dan çekerek önizlemeyi günceller
(function() {
    'use strict';

    // Önizleme verilerini yükle
    function loadPreviewData() {
        // CVStateManager'ın yüklenmesini bekle
        if (!window.CVStateManager) {
            setTimeout(loadPreviewData, 100);
            return;
        }

        const cvData = window.CVStateManager.getCVData();

        // Kişisel Bilgiler
        loadPersonalInfo(cvData.personalInfo);

        // Özet
        loadSummary(cvData.summary);

        // Deneyim
        loadExperiences(cvData.experiences);

        // Eğitim
        loadEducation(cvData.education);

        // Yetenekler
        loadSkills(cvData.skills);

        // Diller
        loadLanguages(cvData.languages);
    }

    // Kişisel bilgileri yükle
    function loadPersonalInfo(info) {
        if (!info) return;

        // İsim
        const fullNameTarget = document.querySelector('[data-preview-target="fullname"]');
        if (fullNameTarget) {
            const firstName = info.firstName || '';
            const lastName = info.lastName || '';
            const fullName = (firstName + ' ' + lastName).trim();
            fullNameTarget.textContent = fullName ? fullName.toUpperCase() : 'AD SOYAD';
        }

        // Meslek
        const professionTarget = document.querySelector('[data-preview-target="profession"]');
        if (professionTarget) {
            professionTarget.textContent = info.profession || 'Meslek / Unvan';
        }

        // E-posta
        const emailTarget = document.querySelector('[data-preview-target="email"]');
        if (emailTarget) {
            updateIconField(emailTarget, info.email || 'email@ornek.com');
        }

        // Telefon
        const phoneTarget = document.querySelector('[data-preview-target="phone"]');
        if (phoneTarget) {
            updateIconField(phoneTarget, info.phone || '+90 5XX XXX XX XX');
        }

        // Lokasyon
        const locationTarget = document.querySelector('[data-preview-target="location"]');
        if (locationTarget) {
            updateIconField(locationTarget, info.location || 'Şehir, Ülke');
        }
    }

    // İkonlu alanı güncelle
    function updateIconField(target, value) {
        const icon = target.querySelector('.material-symbols-outlined');
        if (icon) {
            const iconHTML = icon.outerHTML;
            target.innerHTML = iconHTML + ' ' + value;
        } else {
            target.textContent = value;
        }
    }

    // Özeti yükle
    function loadSummary(summary) {
        const summaryTarget = document.querySelector('[data-preview-target="summary"]');
        if (summaryTarget) {
            summaryTarget.textContent = summary || 'Profesyonel özetinizi buraya yazın...';
        }
    }

    // Deneyimleri yükle
    function loadExperiences(experiences) {
        const container = document.getElementById('experience-preview-container');
        if (!container) return;

        container.innerHTML = '';

        if (!experiences || experiences.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 italic">Deneyim eklenmedi</p>';
            return;
        }

        experiences.forEach(exp => {
            const dateStr = formatExperienceDate(exp);
            const descriptionLines = exp.description ? exp.description.split('\n').filter(l => l.trim()) : [];

            const div = document.createElement('div');
            div.className = 'mb-4';
            div.innerHTML = `
                <div class="flex justify-between items-baseline mb-1">
                    <h3 class="text-sm font-bold text-slate-900">${exp.jobTitle || ''}</h3>
                    <span class="text-xs text-slate-500 font-medium">${dateStr}</span>
                </div>
                <p class="text-xs text-slate-700 italic mb-2">${exp.company || ''}</p>
                ${descriptionLines.length > 0 ? `
                <ul class="list-disc list-inside text-xs text-slate-600 leading-relaxed space-y-1">
                    ${descriptionLines.map(line => `<li>${line.trim()}</li>`).join('')}
                </ul>
                ` : ''}
            `;
            container.appendChild(div);
        });
    }

    // Deneyim tarihi formatla
    function formatExperienceDate(exp) {
        let start = exp.startYear || '';
        if (exp.startMonth && exp.startYear) {
            start = `${exp.startMonth} ${exp.startYear}`;
        }

        let end = '';
        if (exp.isCurrent) {
            end = 'Günümüz';
        } else if (exp.endYear) {
            end = exp.endMonth ? `${exp.endMonth} ${exp.endYear}` : exp.endYear;
        }

        if (start && end) {
            return `${start} - ${end}`;
        }
        return start || '';
    }

    // Eğitimi yükle
    function loadEducation(education) {
        const container = document.getElementById('education-preview-container');
        if (!container) return;

        container.innerHTML = '';

        if (!education || education.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 italic">Eğitim eklenmedi</p>';
            return;
        }

        education.forEach(edu => {
            const dateStr = formatEducationDate(edu);

            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <h3 class="text-sm font-bold text-slate-900">${edu.degree || ''}</h3>
                <p class="text-xs text-slate-700">${edu.school || ''}</p>
                ${dateStr ? `<p class="text-xs text-slate-500 mt-1">${dateStr}</p>` : ''}
            `;
            container.appendChild(div);
        });
    }

    // Eğitim tarihi formatla
    function formatEducationDate(edu) {
        let start = edu.startYear || '';
        let end = edu.isCurrent ? 'Devam Ediyor' : (edu.endYear || '');

        if (start && end) {
            return `${start} - ${end}`;
        }
        return start || '';
    }

    // Yetenekleri yükle
    function loadSkills(skills) {
        const container = document.getElementById('skills-preview-container');
        if (!container) return;

        container.innerHTML = '';

        if (!skills || skills.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 italic">Yetenek eklenmedi</p>';
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-wrap gap-1.5';

        skills.forEach(skill => {
            const name = typeof skill === 'string' ? skill : skill.name;
            const span = document.createElement('span');
            span.className = 'px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium';
            span.textContent = name;
            wrapper.appendChild(span);
        });

        container.appendChild(wrapper);
    }

    // Dilleri yükle
    function loadLanguages(languages) {
        const container = document.getElementById('languages-preview-container');
        if (!container) return;

        container.innerHTML = '';

        if (!languages || languages.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 italic">Dil eklenmedi</p>';
            return;
        }

        const levelLabels = {
            'native': 'Anadil',
            'fluent': 'Akıcı (C2)',
            'advanced': 'İleri (C1)',
            'intermediate': 'Orta (B1-B2)',
            'beginner': 'Başlangıç (A1-A2)'
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-1';

        languages.forEach(lang => {
            const levelLabel = levelLabels[lang.level] || lang.level || '';
            const div = document.createElement('div');
            div.className = 'flex justify-between text-xs';
            div.innerHTML = `
                <span>${lang.name || ''}</span>
                <span class="text-slate-500">${levelLabel}</span>
            `;
            wrapper.appendChild(div);
        });

        container.appendChild(wrapper);
    }

    // CV güncellendi event'ini dinle
    window.addEventListener('cv-data-updated', function() {
        loadPreviewData();
    });

    // Global erişim
    window.loadCVPreview = loadPreviewData;

    // Sayfa yüklendiğinde önizleme verilerini yükle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPreviewData);
    } else {
        loadPreviewData();
    }
})();
