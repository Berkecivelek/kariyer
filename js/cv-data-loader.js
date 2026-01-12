// CV Verilerini Database'den Yükle - Kullanıcı giriş yaptığında verilerini yükle
(function() {
    'use strict';
    
    // Kullanıcının CV verilerini database'den yükle
    async function loadCVFromDatabase() {
        if (!window.apiClient || !window.apiClient.token) {
            console.log('Not authenticated, skipping CV load');
            return;
        }
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No user ID, skipping CV load');
                return;
            }
            
            // Resume ID'yi kontrol et - SADECE URL'den al
            // URL'de resume parametresi varsa o resume'u yükle
            // YOKSA yeni CV oluşturuluyor demektir, resume ID kullanma
            const urlParams = new URLSearchParams(window.location.search);
            let resumeId = urlParams.get('resume');
            
            // Eğer URL'de resume ID varsa, localStorage'a kaydet (edit modu)
            if (resumeId) {
                localStorage.setItem('current-resume-id', resumeId);
                console.log('📝 Edit mode: Loading resume from URL:', resumeId);
            } else {
                // URL'de resume ID yoksa, yeni CV oluşturuluyor demektir
                // Eski resume ID'yi temizle
                localStorage.removeItem('current-resume-id');
                console.log('🆕 New CV mode: Cleared old resume ID');
                return; // Yeni CV için database'den veri yükleme
            }
            
            // Resume ID varsa, resume'u yükle
            if (resumeId) {
                try {
                    const resumeResponse = await window.apiClient.getResume(resumeId);
                    if (resumeResponse.success && resumeResponse.data.resume) {
                        const resume = resumeResponse.data.resume;
                        
                        // CV verilerini localStorage'a kaydet
                        const cvData = {
                            'fullname-first': resume.firstName || '',
                            'fullname-last': resume.lastName || '',
                            email: resume.email || '',
                            phone: resume.phone || '',
                            location: resume.location || '',
                            profession: resume.profession || '',
                            summary: resume.summary || '',
                        };
                        
                        localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
                        
                        // Deneyimleri kaydet
                        if (resume.experience && Array.isArray(resume.experience)) {
                            localStorage.setItem('cv-experiences', JSON.stringify(resume.experience));
                        } else {
                            localStorage.setItem('cv-experiences', '[]');
                        }
                        
                        // Eğitim bilgilerini kaydet
                        if (resume.education && Array.isArray(resume.education)) {
                            localStorage.setItem('cv-education', JSON.stringify(resume.education));
                        } else {
                            localStorage.setItem('cv-education', '[]');
                        }
                        
                        // Yetenekleri kaydet
                        if (resume.skills && Array.isArray(resume.skills)) {
                            localStorage.setItem('cv-skills', JSON.stringify(resume.skills));
                        } else {
                            localStorage.setItem('cv-skills', '[]');
                        }
                        
                        // Dilleri kaydet
                        if (resume.languages && Array.isArray(resume.languages)) {
                            localStorage.setItem('cv-languages', JSON.stringify(resume.languages));
                        } else {
                            localStorage.setItem('cv-languages', '[]');
                        }
                        
                        // Şablonu kaydet
                        if (resume.templateId) {
                            localStorage.setItem('selected-template', resume.templateId);
                        }
                        
                        console.log('✅ CV data loaded from database (all sections):', {
                            resumeId,
                            hasExperience: resume.experience?.length > 0,
                            hasEducation: resume.education?.length > 0,
                            hasSkills: resume.skills?.length > 0,
                            hasLanguages: resume.languages?.length > 0,
                        });
                        
                        // Form alanlarını doldur (eğer sayfa yüklendiyse)
                        fillFormFields(cvData, resume.experience || []);
                        
                        // CV preview'ı güncelle (eğer renderer yüklendiyse)
                        if (window.updateLivePreview) {
                            setTimeout(() => {
                                window.updateLivePreview();
                            }, 500);
                        }
                    }
                } catch (error) {
                    console.error('Error loading resume:', error);
                    // Resume bulunamadıysa, resume ID'yi temizle
                    if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
                        localStorage.removeItem('current-resume-id');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading CV from database:', error);
        }
    }
    
    // Form alanlarını doldur
    function fillFormFields(cvData, experiences) {
        // Kişisel bilgiler
        const firstNameInput = document.getElementById('cv-firstname');
        const lastNameInput = document.getElementById('cv-lastname');
        const emailInput = document.getElementById('cv-email');
        const phoneInput = document.getElementById('cv-phone');
        const locationInput = document.querySelector('[data-preview="location"]');
        const professionInput = document.querySelector('[data-preview="profession"]');
        const summaryInput = document.querySelector('[data-preview="summary"]');
        
        if (firstNameInput && cvData['fullname-first']) {
            firstNameInput.value = cvData['fullname-first'];
            firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (lastNameInput && cvData['fullname-last']) {
            lastNameInput.value = cvData['fullname-last'];
            lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (emailInput && cvData.email) {
            emailInput.value = cvData.email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (phoneInput && cvData.phone) {
            phoneInput.value = cvData.phone;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (locationInput && cvData.location) {
            locationInput.value = cvData.location;
            locationInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (professionInput && cvData.profession) {
            professionInput.value = cvData.profession;
            professionInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (summaryInput && cvData.summary) {
            summaryInput.value = cvData.summary;
            summaryInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // API client ve authentication kontrolü
    function waitForAuth() {
        if (window.apiClient) {
            // Token kontrolü
            const token = localStorage.getItem('authToken');
            if (token) {
                // Token varsa, kullanıcı bilgilerini kontrol et
                window.apiClient.getCurrentUser()
                    .then(response => {
                        if (response.success && response.data.user) {
                            // Kullanıcı bilgilerini localStorage'a kaydet
                            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                            localStorage.setItem('userId', response.data.user.id);
                            
                            // CV verilerini yükle
                            loadCVFromDatabase();
                        } else {
                            // Token geçersiz
                            window.apiClient.clearTokens();
                        }
                    })
                    .catch(error => {
                        console.error('Auth check failed:', error);
                        // Hata durumunda token'ı temizle
                        if (window.apiClient) {
                            window.apiClient.clearTokens();
                        }
                    });
            }
        } else {
            setTimeout(waitForAuth, 100);
        }
    }
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForAuth);
    } else {
        waitForAuth();
    }
    
    // Global olarak erişilebilir yap
    window.loadCVFromDatabase = loadCVFromDatabase;
})();





