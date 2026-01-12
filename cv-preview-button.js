// CV Önizle Butonu - Tüm CV oluşturucu sayfalarında kullanılabilir
(function() {
    'use strict';
    
    // Önizle butonunu bul ve event listener ekle
    function initPreviewButton() {
        const previewBtn = document.getElementById('preview-btn');
        if (!previewBtn) {
            // Eğer id="preview-btn" yoksa, "Önizle" yazısı içeren butonu bul
            const buttons = document.querySelectorAll('button');
            for (let btn of buttons) {
                if (btn.textContent.includes('Önizle') && !btn.id) {
                    btn.id = 'preview-btn';
                    break;
                }
            }
        }
        
        const previewButton = document.getElementById('preview-btn');
        if (!previewButton) return;
        
        // Eğer zaten event listener eklenmişse, tekrar ekleme
        if (previewButton.dataset.listenerAdded === 'true') return;
        
        previewButton.addEventListener('click', function() {
            // CV verilerini localStorage'a kaydet
            const formData = {};
            
            // Kişisel bilgiler
            const firstName = document.getElementById('cv-firstname')?.value || '';
            const lastName = document.getElementById('cv-lastname')?.value || '';
            const email = document.getElementById('cv-email')?.value || '';
            const phone = document.getElementById('cv-phone')?.value || '';
            const location = document.querySelector('[data-preview="location"]')?.value || '';
            const profession = document.querySelector('[data-preview="profession"]')?.value || '';
            
            if (firstName) formData['fullname-first'] = firstName;
            if (lastName) formData['fullname-last'] = lastName;
            if (email) formData.email = email;
            if (phone) formData.phone = phone;
            if (location) formData.location = location;
            if (profession) formData.profession = profession;
            
            // Özet/Hakkımda
            const summary = document.querySelector('[data-preview="summary"]')?.value || 
                           document.querySelector('textarea[data-preview="summary"]')?.value || '';
            if (summary) formData.summary = summary;
            
            // Mevcut verileri al ve birleştir
            try {
                const existingData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
                Object.assign(existingData, formData);
                localStorage.setItem('cv-builder-data', JSON.stringify(existingData));
            } catch (e) {
                localStorage.setItem('cv-builder-data', JSON.stringify(formData));
            }
            
            // Deneyimleri kaydet (eğer varsa)
            try {
                const experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
                if (experiences.length > 0) {
                    const existingData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
                    existingData.experiences = experiences;
                    localStorage.setItem('cv-builder-data', JSON.stringify(existingData));
                }
            } catch (e) {
                // Hata durumunda devam et
            }
            
            // Eğitim bilgilerini kaydet (eğer varsa)
            try {
                const education = JSON.parse(localStorage.getItem('cv-education') || '[]');
                if (education.length > 0) {
                    const existingData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
                    existingData.education = education;
                    localStorage.setItem('cv-builder-data', JSON.stringify(existingData));
                }
            } catch (e) {
                // Hata durumunda devam et
            }
            
            // Yetenekleri kaydet (eğer varsa)
            try {
                const skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
                if (skills.length > 0) {
                    const existingData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
                    existingData.skills = skills;
                    localStorage.setItem('cv-builder-data', JSON.stringify(existingData));
                }
            } catch (e) {
                // Hata durumunda devam et
            }
            
            // Dilleri kaydet (eğer varsa)
            try {
                const languages = JSON.parse(localStorage.getItem('cv-languages') || '[]');
                if (languages.length > 0) {
                    const existingData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
                    existingData.languages = languages;
                    localStorage.setItem('cv-builder-data', JSON.stringify(existingData));
                }
            } catch (e) {
                // Hata durumunda devam et
            }
            
            // Seçili şablonu kontrol et ve kaydet
            const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
            if (!selectedTemplate || selectedTemplate === '') {
                localStorage.setItem('selected-template', 'modern');
            }
            
            // Önizleme sayfasına yönlendir
            window.location.href = 'cv-onizle.html';
        });
        
        // Event listener eklendiğini işaretle
        previewButton.dataset.listenerAdded = 'true';
    }
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPreviewButton);
    } else {
        initPreviewButton();
    }
    
    // Dinamik içerik için MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const hasPreviewBtn = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && 
                    (node.id === 'preview-btn' || 
                     (node.tagName === 'BUTTON' && node.textContent && node.textContent.includes('Önizle')))
                );
                if (hasPreviewBtn) {
                    setTimeout(initPreviewButton, 100);
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

