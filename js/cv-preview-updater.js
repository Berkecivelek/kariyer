// CV Preview Güncelleme İşlevselliği
// Her sayfa yüklendiğinde CV preview'ı localStorage'dan günceller
(function() {
    'use strict';
    
    console.log('🔄 CV Preview Updater yüklendi');
    
    let updateAttempts = 0;
    const MAX_ATTEMPTS = 50; // 5 saniye (50 * 100ms)
    
    // Her sayfa yüklendiğinde CV preview'ı güncelle
    function updateCVPreviewOnPageLoad() {
        updateAttempts++;
        
        console.log('🔄 CV Preview güncelleniyor... (Deneme: ' + updateAttempts + ')');
        
        // Template renderer yüklenene kadar bekle
        if (!window.CVTemplateRenderer) {
            if (updateAttempts < MAX_ATTEMPTS) {
                setTimeout(updateCVPreviewOnPageLoad, 100);
            } else {
                console.warn('⚠️ CVTemplateRenderer yüklenemedi');
            }
            return;
        }
        
        console.log('✅ CVTemplateRenderer bulundu, güncelleme başlıyor...');
        
        // 🔒 KRİTİK: changeTemplate kullan - Bu fonksiyon getDataWithExamples() ile verileri yükler
        const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
        if (window.CVTemplateRenderer && window.CVTemplateRenderer.change) {
            console.log('🔄 changeTemplate() çağrılıyor, template:', selectedTemplate);
            window.CVTemplateRenderer.change(selectedTemplate);
            console.log('✅ changeTemplate() çağrıldı');
        } else if (window.updateCVPreview) {
            console.log('⚠️ changeTemplate bulunamadı, updateCVPreview() kullanılıyor');
            window.updateCVPreview();
            console.log('✅ updateCVPreview() çağrıldı');
        } else {
            console.error('❌ CVTemplateRenderer bulunamadı!');
        }
        
        // 2. Preview loader'ı çalıştır (100ms sonra)
        setTimeout(() => {
            if (window.loadPreviewData) {
                window.loadPreviewData();
                console.log('✅ loadPreviewData() çağrıldı');
            }
        }, 100);
        
        // 3. Live preview'ı başlat (200ms sonra)
        setTimeout(() => {
            if (window.initLivePreview) {
                window.initLivePreview();
                console.log('✅ initLivePreview() çağrıldı');
            }
        }, 200);
        
        // 4. Array verilerini render et (300ms sonra)
        setTimeout(() => {
            if (window.renderPreviewExperiences) {
                window.renderPreviewExperiences();
                console.log('✅ renderPreviewExperiences() çağrıldı');
            }
            if (window.renderPreviewEducation) {
                window.renderPreviewEducation();
                console.log('✅ renderPreviewEducation() çağrıldı');
            }
            if (window.renderPreviewSkills) {
                window.renderPreviewSkills();
                console.log('✅ renderPreviewSkills() çağrıldı');
            }
            if (window.renderPreviewLanguages) {
                window.renderPreviewLanguages();
                console.log('✅ renderPreviewLanguages() çağrıldı');
            }
        }, 300);
        
        console.log('✅ CV Preview güncelleme tamamlandı');
    }
    
    // Sayfa yüklendiğinde çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOMContentLoaded - CV Preview güncelleniyor...');
            updateAttempts = 0;
            setTimeout(updateCVPreviewOnPageLoad, 300);
        });
    } else {
        console.log('📄 Sayfa zaten yüklü - CV Preview güncelleniyor...');
        updateAttempts = 0;
        setTimeout(updateCVPreviewOnPageLoad, 300);
    }
    
    // Sayfa görünür olduğunda da güncelle (sayfa geçişlerinde)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('👁️ Sayfa görünür oldu - CV Preview güncelleniyor...');
            updateAttempts = 0;
            setTimeout(updateCVPreviewOnPageLoad, 100);
        }
    });
    
    // 🔒 KRİTİK: Her 3 saniyede bir kontrol et (sayfa geçişlerinde güvenlik)
    setInterval(function() {
        const previewContainer = document.querySelector('.a4-paper');
        if (previewContainer) {
            const isEmpty = previewContainer.innerHTML.trim() === '' || 
                           previewContainer.textContent.trim() === '';
            if (isEmpty) {
                console.log('⚠️ Preview boş tespit edildi - yeniden yükleniyor...');
                updateAttempts = 0;
                updateCVPreviewOnPageLoad();
            }
        }
    }, 3000);
    
    // Global olarak erişilebilir yap
    window.forceUpdateCVPreview = function() {
        console.log('🔄 Manuel CV Preview güncelleme tetiklendi');
        updateAttempts = 0;
        updateCVPreviewOnPageLoad();
    };
})();

