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
        
        console.log('🔄 CV Preview Loader: localStorage verileri yükleniyor...', data);
        
        // Tam İsim - Tüm target'ları güncelle
        if (data['fullname-first'] || data['fullname-last']) {
            const fullNameTargets = document.querySelectorAll('[data-preview-target="fullname"]');
            console.log('🔍 Full name targets bulundu:', fullNameTargets.length);
            fullNameTargets.forEach(fullNameTarget => {
                const firstName = data['fullname-first'] || '';
                const lastName = data['fullname-last'] || '';
                const fullName = (firstName + ' ' + lastName).trim();
                if (fullName) {
                    fullNameTarget.textContent = fullName.toUpperCase();
                    console.log('✅ Full name güncellendi:', fullName, fullNameTarget);
                }
            });
        }
        
        // Meslek/Unvan - SADECE dolu ise güncelle
        if (data['profession'] && data['profession'].trim() !== '') {
            const professionTargets = document.querySelectorAll('[data-preview-target="profession"]');
            console.log('🔍 Profession targets bulundu:', professionTargets.length);
            professionTargets.forEach(professionTarget => {
                professionTarget.textContent = data['profession'];
                console.log('✅ Profession güncellendi:', data['profession'], professionTarget);
            });
        }
        
        // E-posta - Tüm target'ları güncelle
        if (data['email'] && data['email'].trim() !== '') {
            const emailTargets = document.querySelectorAll('[data-preview-target="email"]');
            console.log('🔍 Email targets bulundu:', emailTargets.length);
            emailTargets.forEach(emailTarget => {
                const icon = emailTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    emailTarget.innerHTML = iconHTML + ' ' + data['email'];
                } else {
                    emailTarget.textContent = data['email'];
                }
                console.log('✅ Email güncellendi:', data['email'], emailTarget);
            });
        }
        
        // Telefon - SADECE dolu ise güncelle
        if (data['phone'] && data['phone'].trim() !== '') {
            const phoneTargets = document.querySelectorAll('[data-preview-target="phone"]');
            console.log('🔍 Phone targets bulundu:', phoneTargets.length);
            phoneTargets.forEach(phoneTarget => {
                const icon = phoneTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    phoneTarget.innerHTML = iconHTML + ' ' + data['phone'];
                } else {
                    phoneTarget.textContent = data['phone'];
                }
                console.log('✅ Phone güncellendi:', data['phone'], phoneTarget);
            });
        }
        
        // Lokasyon - SADECE dolu ise güncelle
        if (data['location'] && data['location'].trim() !== '') {
            const locationTargets = document.querySelectorAll('[data-preview-target="location"]');
            locationTargets.forEach(locationTarget => {
                const icon = locationTarget.querySelector('.material-symbols-outlined');
                if (icon) {
                    const iconHTML = icon.outerHTML;
                    locationTarget.innerHTML = iconHTML + ' ' + data['location'];
                } else {
                    locationTarget.textContent = data['location'];
                }
                console.log('✅ Location güncellendi:', data['location']);
            });
        }
        
        // Özet - SADECE dolu ise güncelle
        if (data['summary'] && data['summary'].trim() !== '') {
            const summaryTargets = document.querySelectorAll('[data-preview-target="summary"]');
            summaryTargets.forEach(summaryTarget => {
                summaryTarget.textContent = data['summary'];
                console.log('✅ Summary güncellendi:', data['summary']);
            });
        }
        
        // 🔒 KRİTİK: Önyazı sayfasındaki textarea'yı da doldur
        const summaryTextarea = document.getElementById('summary-textarea');
        if (summaryTextarea) {
            if (data['summary'] && data['summary'].trim() !== '') {
                summaryTextarea.value = data['summary'];
                summaryTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ Summary textarea dolduruldu');
            } else {
                summaryTextarea.value = '';
            }
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

