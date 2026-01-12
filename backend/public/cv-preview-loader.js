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
        
        // Tam İsim
        if (data['fullname-first'] || data['fullname-last']) {
            const fullNameTarget = document.querySelector('[data-preview-target="fullname"]');
            if (fullNameTarget) {
                const firstName = data['fullname-first'] || '';
                const lastName = data['fullname-last'] || '';
                const fullName = (firstName + ' ' + lastName).trim() || 'Ad Soyad';
                fullNameTarget.textContent = fullName.toUpperCase();
            }
        }
        
        // Meslek/Unvan
        if (data['profession']) {
            const professionTarget = document.querySelector('[data-preview-target="profession"]');
            if (professionTarget) {
                professionTarget.textContent = data['profession'];
            }
        }
        
        // E-posta
        if (data['email']) {
            const emailTarget = document.querySelector('[data-preview-target="email"]');
            if (emailTarget) {
                const icon = emailTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    emailTarget.innerHTML = iconHTML + ' ' + data['email'];
                } else {
                    emailTarget.textContent = data['email'];
                }
            }
        }
        
        // Telefon
        if (data['phone']) {
            const phoneTarget = document.querySelector('[data-preview-target="phone"]');
            if (phoneTarget) {
                const icon = phoneTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    phoneTarget.innerHTML = iconHTML + ' ' + data['phone'];
                } else {
                    phoneTarget.textContent = data['phone'];
                }
            }
        }
        
        // Lokasyon
        if (data['location']) {
            const locationTarget = document.querySelector('[data-preview-target="location"]');
            if (locationTarget) {
                const icon = locationTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    locationTarget.innerHTML = iconHTML + ' ' + data['location'];
                } else {
                    locationTarget.textContent = data['location'];
                }
            }
        }
        
        // Özet
        if (data['summary']) {
            const summaryTarget = document.querySelector('[data-preview-target="summary"]');
            if (summaryTarget) {
                summaryTarget.textContent = data['summary'];
            }
        }
    }
    
    // Sayfa yüklendiğinde önizleme verilerini yükle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPreviewData);
    } else {
        loadPreviewData();
    }
})();

