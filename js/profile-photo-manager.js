// Global Profile Photo Manager
// Tüm sayfalarda profil fotoğrafını yönetmek için merkezi sistem
(function() {
    'use strict';

    // Profil fotoğrafını tüm sayfalarda güncelle
    function updateAllProfilePhotos(photoUrl) {
        if (!photoUrl) {
            console.warn('updateAllProfilePhotos: photoUrl boş');
            return;
        }

        // URL'i düzelt
        const fullUrl = photoUrl.startsWith('http') 
            ? photoUrl 
            : (window.location.origin + (photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl));

        console.log('🖼️ Tüm profil fotoğrafları güncelleniyor:', fullUrl);

        // Test image oluştur
        const testImg = new Image();
        testImg.onload = function() {
            console.log('✅ Fotoğraf yüklendi ve görüntülenebilir:', fullUrl);
            applyPhotoToAllElements(fullUrl);
        };
        testImg.onerror = function() {
            console.error('❌ Fotoğraf yüklenemedi:', fullUrl);
            console.error('❌ Backend static file serving kontrol edilmeli');
        };
        testImg.src = fullUrl;
    }

    // Fotoğrafı tüm elementlere uygula
    function applyPhotoToAllElements(fullUrl) {
        // 1. CV oluşturucu sayfası - cv-profile-photo-preview
        const cvPreview = document.getElementById('cv-profile-photo-preview');
        if (cvPreview) {
            applyPhotoToElement(cvPreview, fullUrl);
            // Placeholder'ı gizle
            const placeholder = document.getElementById('cv-photo-placeholder');
            if (placeholder) {
                hideElement(placeholder);
            }
            // Kaldır butonunu göster
            const removeBtn = document.getElementById('cv-remove-photo-btn');
            if (removeBtn) {
                showElement(removeBtn);
            }
        }

        // 2. Profil ayarları - profile-photo
        const profilePhoto = document.getElementById('profile-photo');
        if (profilePhoto) {
            applyPhotoToElement(profilePhoto, fullUrl);
            // Parent background'ı kaldır
            const parent = profilePhoto.parentElement;
            if (parent) {
                parent.classList.remove('bg-slate-100');
                parent.style.setProperty('background-color', 'transparent', 'important');
            }
            // Kaldır butonunu göster
            const removeBtn = document.getElementById('profile-remove-photo-btn');
            if (removeBtn) {
                showElement(removeBtn);
            }
        }

        // 3. Profil ayarları sidebar - profile-avatar
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            applyPhotoToElement(profileAvatar, fullUrl);
        }

        // 4. Header - header-profile-photo
        const headerPhoto = document.getElementById('header-profile-photo');
        if (headerPhoto) {
            applyPhotoToElement(headerPhoto, fullUrl);
        }

        // 5. Dashboard sidebar - .w-10.h-10.rounded-full.bg-cover
        const dashboardPhoto = document.querySelector('.w-10.h-10.rounded-full.bg-cover');
        if (dashboardPhoto) {
            applyPhotoToElement(dashboardPhoto, fullUrl);
        }

        // 6. Tüm profil avatar gösterilen yerler
        const allAvatars = document.querySelectorAll('[data-profile-photo]');
        allAvatars.forEach(avatar => {
            applyPhotoToElement(avatar, fullUrl);
        });
    }

    // Fotoğrafı bir elemente uygula
    function applyPhotoToElement(element, photoUrl) {
        if (!element) return;

        console.log('📸 Fotoğraf uygulanıyor:', element.id || element.className, photoUrl);

        // Background image'i ayarla - !important ile
        element.style.setProperty('background-image', `url("${photoUrl}")`, 'important');
        element.style.setProperty('background-size', 'cover', 'important');
        element.style.setProperty('background-position', 'center', 'important');
        element.style.setProperty('background-repeat', 'no-repeat', 'important');
        element.style.setProperty('background-color', 'transparent', 'important');

        // Background color class'larını kaldır
        element.classList.remove('bg-white', 'bg-slate-100', 'bg-slate-200', 'dark:bg-[#12141c]', 'dark:bg-slate-700');

        // Flex class'larını kaldır (placeholder icon için)
        if (element.id === 'cv-profile-photo-preview') {
            element.classList.remove('flex', 'items-center', 'justify-center');
        }

        // Z-index ayarla
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('z-index', '1', 'important');

        console.log('✅ Fotoğraf uygulandı:', element.id || element.className);
    }

    // Element'i gizle
    function hideElement(element) {
        if (!element) return;
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        element.classList.add('hidden');
    }

    // Element'i göster
    function showElement(element) {
        if (!element) return;
        element.style.display = '';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        element.style.pointerEvents = '';
        element.classList.remove('hidden');
    }

    // Kullanıcı profil fotoğrafını yükle
    async function loadUserProfilePhoto() {
        try {
            if (!window.apiClient) {
                console.warn('API client yüklenmedi');
                return;
            }

            const response = await window.apiClient.getCurrentUser();
            if (response.success && response.data.user && response.data.user.profilePhotoUrl) {
                const photoUrl = response.data.user.profilePhotoUrl;
                console.log('👤 Kullanıcı profil fotoğrafı yüklendi:', photoUrl);
                updateAllProfilePhotos(photoUrl);
                // localStorage'a kaydet
                localStorage.setItem('profilePhotoUrl', photoUrl);
            } else {
                console.log('👤 Kullanıcının profil fotoğrafı yok');
                localStorage.removeItem('profilePhotoUrl');
            }
        } catch (error) {
            console.error('❌ Profil fotoğrafı yükleme hatası:', error);
        }
    }

    // Public API
    window.profilePhotoManager = {
        updateAll: updateAllProfilePhotos,
        load: loadUserProfilePhoto,
        applyToElement: applyPhotoToElement
    };

    // Sayfa yüklendiğinde veya API client hazır olduğunda yükle
    function init() {
        if (window.apiClient) {
            loadUserProfilePhoto();
        } else {
            // API client'ı bekle
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.apiClient) {
                    clearInterval(checkInterval);
                    loadUserProfilePhoto();
                } else if (attempts > 50) {
                    clearInterval(checkInterval);
                    console.warn('API client yüklenemedi');
                }
            }, 100);
        }
    }

    // DOMContentLoaded veya mevcut durumda çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // localStorage'dan yükle (hızlı görüntüleme için)
    const cachedPhotoUrl = localStorage.getItem('profilePhotoUrl');
    if (cachedPhotoUrl) {
        console.log('💾 Cache\'den profil fotoğrafı yüklendi:', cachedPhotoUrl);
        updateAllProfilePhotos(cachedPhotoUrl);
    }
})();



