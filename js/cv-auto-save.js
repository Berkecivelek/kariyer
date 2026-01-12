// CV Otomatik Kaydetme - Kullanıcı verilerini database'e kaydet
(function() {
    'use strict';
    
    let saveTimeout = null;
    const SAVE_DELAY = 2000; // 2 saniye bekle (debounce)
    
    // CV verilerini database'e kaydet
    async function saveCVToDatabase() {
        if (!window.apiClient || !window.apiClient.token) {
            console.log('Not authenticated, skipping auto-save');
            return;
        }
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No user ID, skipping auto-save');
                return;
            }
            
            // CV verilerini topla
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            const experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
            const education = JSON.parse(localStorage.getItem('cv-education') || '[]');
            const skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
            const languages = JSON.parse(localStorage.getItem('cv-languages') || '[]');
            const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
            
            // Eğer hiç veri yoksa kaydetme
            if (!cvData['fullname-first'] && !cvData['fullname-last'] && experiences.length === 0 && education.length === 0) {
                return;
            }
            
            // Resume ID'yi kontrol et - SADECE URL'den al
            // URL'de resume parametresi varsa edit modu, yoksa yeni CV
            const urlParams = new URLSearchParams(window.location.search);
            let resumeId = urlParams.get('resume');
            
            // KRİTİK: Autosave SADECE URL'den resume_id alır
            // localStorage'dan almak resume karışıklığına neden olur
            if (resumeId) {
                // URL'de resume ID varsa, localStorage'a kaydet (edit modu)
                localStorage.setItem('current-resume-id', resumeId);
                console.log('💾 Auto-save: Using resume_id from URL:', resumeId);
            } else {
                // URL'de resume yoksa, yeni CV oluşturuluyor
                // Autosave yeni resume oluşturmaz, sadece localStorage'da tutar
                console.log('ℹ️ Auto-save: No resume_id in URL, skipping database save');
                return; // Yeni CV için autosave yapma
            }
            
            const resumeData = {
                title: `${cvData['fullname-first'] || ''} ${cvData['fullname-last'] || ''}`.trim() || 'Yeni Özgeçmiş',
                templateId: selectedTemplate,
                status: 'DRAFT', // Auto-save always saves as draft
                firstName: cvData['fullname-first'] || '',
                lastName: cvData['fullname-last'] || '',
                email: cvData.email || '',
                phone: cvData.phone || '',
                location: cvData.location || '',
                profession: cvData.profession || '',
                summary: cvData.summary || '',
                experience: experiences.length > 0 ? experiences : null,
                education: education.length > 0 ? education : null,
                skills: skills.length > 0 ? skills : null,
                languages: languages.length > 0 ? languages : null,
            };
            
            if (resumeId) {
                // Mevcut resume'u güncelle
                try {
                    const updateResponse = await window.apiClient.updateResume(resumeId, resumeData);
                    console.log('✅ CV auto-saved to database (updated):', resumeId);
                    console.log('Update response:', updateResponse);
                } catch (error) {
                    console.error('❌ Auto-save update error:', error);
                    // Resume bulunamadıysa yeni oluştur
                    if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
                        console.log('Resume bulunamadı, yeni oluşturuluyor...');
                        localStorage.removeItem('current-resume-id');
                        resumeId = null;
                    } else {
                        // Diğer hatalar için sessizce devam et (kullanıcı deneyimini bozma)
                        console.warn('Auto-save update failed, but continuing:', error.message);
                    }
                }
            }
            
            // Auto-save SADECE mevcut resume'u günceller
            // Yeni resume oluşturma SADECE "Bitir ve Tamamla" butonunda yapılır
            // Bu sayede dashboard'da sadece tamamlanmış CV'ler görünür
            if (!resumeId) {
                // Resume ID yoksa, auto-save yeni resume oluşturmaz
                // Sadece localStorage'da tutulur, "Bitir ve Tamamla" butonuna basıldığında oluşturulur
                console.log('ℹ️ Auto-save: No resume ID, skipping database save. Resume will be created on "Bitir ve Tamamla"');
                return; // Auto-save'den çık, yeni resume oluşturma
            }
        } catch (error) {
            console.error('Auto-save error:', error);
            // Hata durumunda sessizce devam et (kullanıcı deneyimini bozma)
        }
    }
    
    // Debounced save fonksiyonu
    function scheduleSave() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        saveTimeout = setTimeout(() => {
            saveCVToDatabase();
        }, SAVE_DELAY);
    }
    
    // Input değişikliklerini dinle
    function initAutoSave() {
        // Tüm input, textarea ve select elementlerini dinle
        const formElements = document.querySelectorAll('input, textarea, select');
        
        formElements.forEach(element => {
            element.addEventListener('input', scheduleSave);
            element.addEventListener('change', scheduleSave);
        });
        
        // Deneyim ekleme/silme/güncelleme için özel event dinle
        document.addEventListener('cv-data-changed', scheduleSave);
        
        // Sayfa kapatılmadan önce kaydet
        window.addEventListener('beforeunload', () => {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            // Synchronous save (beforeunload'da async çalışmaz)
            if (window.apiClient && window.apiClient.token) {
                // Son bir kayıt denemesi yap
                saveCVToDatabase();
            }
        });
        
        // Sayfa görünürlüğü değiştiğinde kaydet (tab değişimi)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Sayfa gizlendiğinde kaydet
                if (saveTimeout) {
                    clearTimeout(saveTimeout);
                }
                saveCVToDatabase();
            }
        });
        
        // Periyodik kayıt (her 30 saniyede bir)
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                saveCVToDatabase();
            }
        }, 30000);
    }
    
    // API client yüklendiğinde başlat
    function waitForAPIClient() {
        if (window.apiClient) {
            initAutoSave();
        } else {
            setTimeout(waitForAPIClient, 100);
        }
    }
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForAPIClient);
    } else {
        waitForAPIClient();
    }
    
    // Global olarak erişilebilir yap
    window.saveCVToDatabase = saveCVToDatabase;
})();





