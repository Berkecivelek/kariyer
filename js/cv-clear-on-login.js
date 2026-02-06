// Login Sonrası CV Verilerini Temizleme
// Yeni kullanıcı login olduğunda önceki kullanıcının CV verilerini temizle
(function() {
    'use strict';
    
    // Son login yapan kullanıcının ID'sini kontrol et
    const LAST_USER_KEY = 'last-logged-in-user-id';
    
    // Sayfa yüklendiğinde kontrol et
    function checkAndClearOnUserChange() {
        const currentToken = localStorage.getItem('authToken');
        
        if (!currentToken) {
            // Token yoksa, temizle
            clearAllCVData();
            return;
        }
        
        if (!window.apiClient) {
            // API client hazır değilse bekle
            setTimeout(checkAndClearOnUserChange, 100);
            return;
        }
        
        // Mevcut kullanıcıyı al
        window.apiClient.getCurrentUser()
            .then(response => {
                if (response.success && response.data.user) {
                    const currentUserId = response.data.user.id;
                    const lastUserId = localStorage.getItem(LAST_USER_KEY);
                    
                    console.log('🔐 User check:', {
                        current: currentUserId,
                        last: lastUserId,
                        different: lastUserId && lastUserId !== currentUserId
                    });
                    
                    // 🔒 KRİTİK: Eğer farklı bir kullanıcı ise VEYA yeni kullanıcı ise CV verilerini temizle
                    if (!lastUserId) {
                        // Yeni kullanıcı (daha önce login olmamış) → Temizle
                        console.log('🆕 Yeni kullanıcı tespit edildi, CV verileri temizleniyor...');
                        clearAllCVData();
                    } else if (lastUserId !== currentUserId) {
                        // Farklı kullanıcı → Temizle
                        console.log('🔄 Farklı kullanıcı tespit edildi, CV verileri temizleniyor...');
                        clearAllCVData();
                    }
                    
                    // Mevcut kullanıcı ID'sini kaydet
                    localStorage.setItem(LAST_USER_KEY, currentUserId);
                }
            })
            .catch(error => {
                console.error('User check failed:', error);
                // Hata durumunda temizle (güvenlik önlemi)
                clearAllCVData();
            });
    }
    
    // TÜM CV verilerini temizle
    function clearAllCVData() {
        console.log('🧹 Tüm CV verileri temizleniyor...');
        
        localStorage.removeItem('cv-builder-data');
        localStorage.removeItem('cv-experiences');
        localStorage.removeItem('cv-education');
        localStorage.removeItem('cv-skills');
        localStorage.removeItem('cv-languages');
        localStorage.removeItem('current-resume-id');
        localStorage.removeItem('selected-template');
        
        console.log('✅ CV verileri temizlendi');
    }
    
    // Sayfa yüklendiğinde çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndClearOnUserChange);
    } else {
        checkAndClearOnUserChange();
    }
    
    // Global olarak erişilebilir yap
    window.clearAllCVData = clearAllCVData;
})();


