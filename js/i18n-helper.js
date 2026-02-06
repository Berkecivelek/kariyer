// i18n Helper - Sayfa çevirisi için yardımcı fonksiyonlar
// Bu dosya sayfaların dinamik olarak çevrilmesini sağlar

(function() {
    'use strict';
    
    // Sayfa yüklendiğinde çeviriyi uygula
    function applyTranslations() {
        if (window.i18n) {
            const lang = localStorage.getItem('userLanguage') || 'tr';
            if (lang && lang !== 'tr') {
                // Sayfayı çevir
                window.i18n.translatePage();
            }
        }
    }
    
    // MutationObserver ile dinamik içerik değişikliklerini izle
    if (window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
            // Yeni elementler eklendiğinde çeviriyi uygula
            let shouldTranslate = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    shouldTranslate = true;
                }
            });
            
            if (shouldTranslate && window.i18n) {
                const lang = localStorage.getItem('userLanguage') || 'tr';
                if (lang && lang !== 'tr') {
                    setTimeout(() => {
                        window.i18n.translatePage();
                    }, 100);
                }
            }
        });
        
        // Observer'ı başlat
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }
    
    // Sayfa yüklendiğinde çeviriyi uygula
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyTranslations, 500);
        });
    } else {
        setTimeout(applyTranslations, 500);
    }
})();



