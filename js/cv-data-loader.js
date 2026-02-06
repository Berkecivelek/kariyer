// CV Verilerini Database'den Yükle - Kullanıcı giriş yaptığında verilerini yükle
(function() {
    'use strict';
    
    // 🔒 KRİTİK: Kullanıcı değişikliği kontrolü - ÖNCE kontrol et
    async function checkUserAndClearIfNeeded() {
        try {
            const currentToken = localStorage.getItem('authToken');
            if (!currentToken) {
                // Token yoksa, temizle
                clearAllCVData();
                return;
            }
            
            if (!window.apiClient) {
                // API client hazır değilse bekle
                setTimeout(checkUserAndClearIfNeeded, 100);
                return;
            }
            
            const userResponse = await window.apiClient.getCurrentUser();
            if (userResponse.success && userResponse.data.user) {
                const currentUserId = userResponse.data.user.id;
                const lastUserId = localStorage.getItem('last-logged-in-user-id');
                
                // Eğer farklı kullanıcı ise VEYA yeni kullanıcı ise CV verilerini temizle
                if (!lastUserId || lastUserId !== currentUserId) {
                    console.log('🔒 User check: Clearing CV data for new/different user');
                    clearAllCVData();
                    localStorage.setItem('last-logged-in-user-id', currentUserId);
                }
            }
        } catch (error) {
            console.error('User check failed:', error);
            // Hata durumunda temizle (güvenlik önlemi)
            clearAllCVData();
        }
    }
    
    // TÜM CV verilerini temizle
    function clearAllCVData() {
        console.log('🧹 Clearing all CV data...');
        localStorage.removeItem('cv-builder-data');
        localStorage.removeItem('cv-experiences');
        localStorage.removeItem('cv-education');
        localStorage.removeItem('cv-skills');
        localStorage.removeItem('cv-languages');
        localStorage.removeItem('current-resume-id');
        localStorage.removeItem('selected-template');
    }
    
    // Kullanıcının CV verilerini database'den yükle
    async function loadCVFromDatabase() {
        // 🔒 KRİTİK: ÖNCE kullanıcı kontrolü yap
        await checkUserAndClearIfNeeded();
        
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
                // 🔒 KRİTİK: Eğer localStorage'da ZATEN veri varsa, TEMİZLEME!
                // Kullanıcı "Devam Et" butonuna basıp sonraki sayfaya geçtiğinde
                // localStorage'daki verileri korumalıyız
                const existingData = localStorage.getItem('cv-builder-data');
                
                if (existingData) {
                    try {
                        const parsed = JSON.parse(existingData);
                        // Eğer veri varsa ve kullanıcı verisi ise (isSampleData: false), koru
                        if (parsed.isSampleData !== true && parsed.isPreviewOnly !== true) {
                            console.log('✅ CV Builder: Mevcut veriler korunuyor (sayfa geçişi)');
                            console.log('📊 Mevcut veriler:', {
                                phone: parsed.phone,
                                profession: parsed.profession,
                                location: parsed.location
                            });
                            return; // Mevcut verileri koru, temizleme!
                        }
                    } catch (e) {
                        console.error('Error parsing existing data:', e);
                    }
                }
                
                // SADECE ilk kez CV oluşturuluyorsa (localStorage boşsa) temizle
                console.log('🆕 New CV mode: First time - Initializing empty CV...');
                localStorage.removeItem('current-resume-id');
                
                // 🔒 KRİTİK: SADECE localStorage boşsa veya örnek veri varsa temizle
                if (!existingData) {
                    localStorage.removeItem('cv-builder-data');
                    localStorage.setItem('cv-experiences', '[]');
                    localStorage.setItem('cv-education', '[]');
                    localStorage.setItem('cv-skills', '[]');
                    localStorage.setItem('cv-languages', '[]');
                    localStorage.removeItem('selected-template');
                    
                    console.log('✅ All previous CV data cleared (first time)');
                    
                    // Kullanıcının kayıt bilgilerini API'den al ve SADECE bunları yükle
                    try {
                        const userResponse = await window.apiClient.getCurrentUser();
                        if (userResponse.success && userResponse.data.user) {
                            const user = userResponse.data.user;
                            
                            // 🔒 KRİTİK: SADECE kayıt bilgilerini yükle, diğer alanlar BOŞ
                            // isSampleData: false çünkü bu gerçek kullanıcı verisi
                            const cleanCVData = {
                                isSampleData: false, // 🔒 KRİTİK: Gerçek kullanıcı verisi
                                isPreviewOnly: false, // Gerçek veri
                                'fullname-first': user.firstName || '',
                                'fullname-last': user.lastName || '',
                                email: user.email || '',
                                phone: '', // BOŞ
                                location: '', // BOŞ
                                profession: '', // BOŞ
                                summary: '', // BOŞ
                            };
                            
                            localStorage.setItem('cv-builder-data', JSON.stringify(cleanCVData));
                            console.log('🆕 New CV mode: Loaded ONLY registration data:', {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                isSampleData: false
                            });
                            
                            // Form alanlarını doldur (sadece isim, soyisim, email)
                            fillFormFields(cleanCVData, []);
                        } else {
                            // Kullanıcı bilgisi alınamadı → Sadece temizle, hiçbir şey yükleme
                            console.log('⚠️ User info not available, keeping all fields empty');
                        }
                    } catch (error) {
                        console.error('Error loading user info for new CV:', error);
                        // Hata durumunda da temizle, hiçbir şey yükleme
                    }
                } else {
                    console.log('✅ CV Builder: Mevcut veriler korunuyor (kullanıcı veri girmiş)');
                }
                
                return; // Yeni CV için database'den resume verisi yükleme
            }
            
            // Resume ID varsa, resume'u yükle
            if (resumeId) {
                try {
                    console.log('📥 CV Data Loader: Resume ID ile veri yükleniyor:', resumeId);
                    
                    // 🔒 KRİTİK: Önce localStorage'ı temizle (önceki CV verilerini temizle)
                    localStorage.removeItem('cv-builder-data');
                    localStorage.removeItem('cv-experiences');
                    localStorage.removeItem('cv-education');
                    localStorage.removeItem('cv-skills');
                    localStorage.removeItem('cv-languages');
                    
                    const resumeResponse = await window.apiClient.getResume(resumeId);
                    if (resumeResponse.success && resumeResponse.data.resume) {
                        const resume = resumeResponse.data.resume;
                        
                        console.log('✅ CV Data Loader: Resume verisi yüklendi:', resume);
                        
                        // CV verilerini localStorage'a kaydet
                        const cvData = {
                            'fullname-first': resume.firstName || '',
                            'fullname-last': resume.lastName || '',
                            email: resume.email || '',
                            phone: resume.phone || '',
                            location: resume.location || '',
                            profession: resume.profession || '',
                            summary: resume.summary || '',
                            website: resume.website || '',
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
                        if (resume.templateId || resume.template) {
                            localStorage.setItem('selected-template', resume.templateId || resume.template);
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
    
    // Form alanlarını doldur - SADECE dolu alanları doldur
    function fillFormFields(cvData, experiences) {
        // 🔒 KRİTİK: isSampleData kontrolü - Örnek veriler form alanlarına doldurulmamalı
        if (cvData.isSampleData === true || cvData.isPreviewOnly === true) {
            console.log('🔒 Örnek veri tespit edildi: Form alanları doldurulmadı (sadece preview için)');
            return; // Örnek veri → Form alanlarına doldurma
        }
        
        // Kişisel bilgiler
        const firstNameInput = document.getElementById('cv-firstname');
        const lastNameInput = document.getElementById('cv-lastname');
        const emailInput = document.getElementById('cv-email');
        const phoneInput = document.getElementById('cv-phone');
        const locationInput = document.querySelector('[data-preview="location"]');
        const professionInput = document.querySelector('[data-preview="profession"]');
        const summaryInput = document.querySelector('[data-preview="summary"]');
        
        // 🔒 SADECE dolu alanları doldur, boş alanları placeholder'a bırak
        if (firstNameInput && cvData['fullname-first'] && cvData['fullname-first'].trim() !== '') {
            firstNameInput.value = cvData['fullname-first'];
            firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (firstNameInput) {
            firstNameInput.value = ''; // Boş bırak, placeholder göster
        }
        
        if (lastNameInput && cvData['fullname-last'] && cvData['fullname-last'].trim() !== '') {
            lastNameInput.value = cvData['fullname-last'];
            lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (lastNameInput) {
            lastNameInput.value = ''; // Boş bırak
        }
        
        if (emailInput && cvData.email && cvData.email.trim() !== '') {
            emailInput.value = cvData.email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (emailInput) {
            emailInput.value = ''; // Boş bırak
        }
        
        // 🔒 Phone, location, profession, summary → SADECE dolu ise doldur
        if (phoneInput) {
            if (cvData.phone && cvData.phone.trim() !== '') {
                phoneInput.value = cvData.phone;
                phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                phoneInput.value = ''; // BOŞ - Placeholder göster
            }
        }
        
        if (locationInput) {
            if (cvData.location && cvData.location.trim() !== '') {
                locationInput.value = cvData.location;
                locationInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                locationInput.value = ''; // BOŞ - Placeholder göster
            }
        }
        
        if (professionInput) {
            if (cvData.profession && cvData.profession.trim() !== '') {
                professionInput.value = cvData.profession;
                professionInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                professionInput.value = ''; // BOŞ - Placeholder göster
            }
        }
        
        if (summaryInput) {
            if (cvData.summary && cvData.summary.trim() !== '') {
                summaryInput.value = cvData.summary;
                summaryInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                summaryInput.value = ''; // BOŞ - Placeholder göster
            }
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





