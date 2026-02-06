// CV Builder Backend Sync Utility
// Bu script CV builder verilerini backend'e kaydeder
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-builder-data';
    const EXPERIENCES_KEY = 'cv-experiences';
    let currentResumeId = null;
    let syncTimeout = null;
    
    // API client'ın yüklendiğini kontrol et
    function waitForAPIClient(callback) {
        if (window.apiClient) {
            callback();
        } else {
            setTimeout(() => waitForAPIClient(callback), 100);
        }
    }
    
    // localStorage'dan tüm CV verilerini al
    function getAllCVData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const experiences = localStorage.getItem(EXPERIENCES_KEY);
            
            return {
                personalInfo: data ? JSON.parse(data) : {},
                experiences: experiences ? JSON.parse(experiences) : []
            };
        } catch (e) {
            // CV data okuma hatası - sessizce devam et
            return { personalInfo: {}, experiences: [] };
        }
    }
    
    // Backend'e resume kaydet/güncelle
    async function saveToBackend() {
        if (!window.apiClient) {
            console.log('API client henüz yüklenmedi');
            return;
        }
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('Kullanıcı giriş yapmamış, backend kaydı atlanıyor');
            return;
        }
        
        try {
            const { personalInfo, experiences } = getAllCVData();
            
            // Resume verisi hazırla
            const resumeData = {
                title: personalInfo.title || 'Yeni Özgeçmiş',
                templateId: personalInfo.templateId || getTemplateFromURL() || 'modern',
                status: 'DRAFT',
                firstName: personalInfo['fullname-first'] || '',
                lastName: personalInfo['fullname-last'] || '',
                email: personalInfo.email || '',
                phone: personalInfo.phone || '',
                location: personalInfo.location || '',
                profession: personalInfo.profession || '',
                summary: personalInfo.summary || '',
                experience: experiences.length > 0 ? experiences : null,
                education: personalInfo.education || null,
                skills: personalInfo.skills || null,
                languages: personalInfo.languages || null,
            };
            
            // Mevcut resume ID'yi kontrol et
            if (!currentResumeId) {
                // Kullanıcının draft resume'unu bul
                try {
                    const resumesResponse = await window.apiClient.getResumes();
                    if (resumesResponse.success && resumesResponse.data.resumes) {
                        const draftResume = resumesResponse.data.resumes.find(
                            r => r.status === 'DRAFT'
                        );
                        if (draftResume) {
                            currentResumeId = draftResume.id;
                        }
                    }
                } catch (error) {
                    // 🔒 CORS/Network hatası - sessizce devam et (offline mode)
                    // Console'a hata yazdırma - kullanıcıya gösterilmemeli
                }
            }
            
            if (currentResumeId) {
                // Mevcut resume'u güncelle
                await window.apiClient.updateResume(currentResumeId, resumeData);
                console.log('Resume güncellendi:', currentResumeId);
            } else {
                // Yeni resume oluştur
                const response = await window.apiClient.createResume(resumeData);
                if (response.success && response.data.resume) {
                    currentResumeId = response.data.resume.id;
                    localStorage.setItem('current-resume-id', currentResumeId);
                    console.log('Yeni resume oluşturuldu:', currentResumeId);
                }
            }
        } catch (error) {
            // 🔒 Backend kayıt hatası - sessizce devam et (offline mode desteklenir)
            // Network sorunu, CORS hatası veya backend erişilemez durumunda normal
            // Console'a hata yazdırma - kullanıcıya gösterilmemeli
        }
    }
    
    // URL'den template ID'yi al
    function getTemplateFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('template');
    }
    
    // Debounced save - çok sık kayıt yapmayı önler
    function debouncedSave() {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(() => {
            saveToBackend();
        }, 2000); // 2 saniye bekle
    }
    
    // localStorage değişikliklerini dinle
    function initStorageListener() {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            if (key === STORAGE_KEY || key === EXPERIENCES_KEY) {
                debouncedSave();
            }
        };
    }
    
    // "Devam Et" butonlarına tıklandığında kaydet
    function initContinueButtons() {
        document.addEventListener('click', (e) => {
            const continueBtn = e.target.closest('a[href*="cv-olusturucu"]');
            if (continueBtn && continueBtn.textContent.includes('Devam Et')) {
                // Butona tıklandığında hemen kaydet
                if (syncTimeout) {
                    clearTimeout(syncTimeout);
                }
                saveToBackend();
            }
        });
    }
    
    // Sayfa yüklendiğinde başlat
    function init() {
        waitForAPIClient(() => {
            // Mevcut resume ID'yi yükle
            currentResumeId = localStorage.getItem('current-resume-id');
            
            // Storage listener'ı başlat
            initStorageListener();
            
            // Continue button listener'ı başlat
            initContinueButtons();
            
            // İlk kayıt
            debouncedSave();
            
            console.log('CV Backend Sync başlatıldı');
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Global fonksiyon - manuel kayıt için
    window.saveCVToBackend = saveToBackend;
})();








