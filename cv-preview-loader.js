// CV Önizleme Verilerini Yükleme İşlevselliği
// Bu script tüm CV oluşturucu sayfalarında önizleme alanlarını localStorage'dan yükler
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-builder-data';
    
    // localStorage'dan veri oku
    function getStoredData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
    
    function loadPreviewData() {
        const data = getStoredData();
        
        // Tam İsim - Tüm target'ları güncelle
        if (data['fullname-first'] || data['fullname-last']) {
            const fullNameTargets = document.querySelectorAll('[data-preview-target="fullname"]');
            fullNameTargets.forEach(fullNameTarget => {
                const firstName = data['fullname-first'] || '';
                const lastName = data['fullname-last'] || '';
                const fullName = (firstName + ' ' + lastName).trim() || 'Ad Soyad';
                fullNameTarget.textContent = fullName.toUpperCase();
            });
        }
        
        // Meslek/Unvan - Tüm target'ları güncelle
        if (data['profession']) {
            const professionTargets = document.querySelectorAll('[data-preview-target="profession"]');
            professionTargets.forEach(professionTarget => {
                professionTarget.textContent = data['profession'];
            });
        }
        
        // E-posta - Tüm target'ları güncelle
        if (data['email']) {
            const emailTargets = document.querySelectorAll('[data-preview-target="email"]');
            emailTargets.forEach(emailTarget => {
                const icon = emailTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    emailTarget.innerHTML = iconHTML + ' ' + data['email'];
                } else {
                    emailTarget.textContent = data['email'];
                }
            });
        }
        
        // Telefon - Tüm target'ları güncelle
        if (data['phone']) {
            const phoneTargets = document.querySelectorAll('[data-preview-target="phone"]');
            phoneTargets.forEach(phoneTarget => {
                const icon = phoneTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    phoneTarget.innerHTML = iconHTML + ' ' + data['phone'];
                } else {
                    phoneTarget.textContent = data['phone'];
                }
            });
        }
        
        // Lokasyon - Tüm target'ları güncelle
        if (data['location']) {
            const locationTargets = document.querySelectorAll('[data-preview-target="location"]');
            locationTargets.forEach(locationTarget => {
                const icon = locationTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    locationTarget.innerHTML = iconHTML + ' ' + data['location'];
                } else {
                    locationTarget.textContent = data['location'];
                }
            });
        }
        
        // Özet - Tüm target'ları güncelle
        if (data['summary']) {
            const summaryTargets = document.querySelectorAll('[data-preview-target="summary"]');
            summaryTargets.forEach(summaryTarget => {
                summaryTarget.textContent = data['summary'];
            });
        }
    }
    
    // Global olarak erişilebilir yap
    window.loadPreviewData = loadPreviewData;
    
    // Sayfa yüklendiğinde önizleme verilerini yükle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPreviewData);
    } else {
        loadPreviewData();
    }
})();

