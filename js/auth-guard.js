// Authentication Guard - Sayfa koruma mekanizması
// Bu script korumalı sayfalarda authentication kontrolü yapar
(function() {
    'use strict';
    
    // Korumalı sayfalar listesi (giriş yapmadan erişilemeyen sayfalar)
    const protectedPages = [
        'dashboard.html',
        'cv-olusturucu-kisisel-bilgiler.html',
        'cv-olusturucu-ozet.html',
        'cv-olusturucu-egitim.html',
        'cv-olusturucu-yetenekler.html',
        'cv-olusturucu-diller.html',
        'profil-ayarlari.html',
        'hesap-ayarlari.html',
        'sifre-ve-guvenlik.html',
        'gizlilik-ayarlari.html',
        'bildirim-ayarlari.html'
    ];
    
    // Public sayfalar (giriş yapmadan erişilebilen sayfalar)
    const publicPages = [
        'index.html',
        'giris.html',
        'kayit-ol.html',
        'tum-sablonlar.html',
        'sablonlar.html'
    ];
    
    // Mevcut sayfa adını al
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }
    
    // API client'ın yüklenmesini bekle
    function waitForAPIClient(callback, maxAttempts = 50) {
        let attempts = 0;
        function check() {
            attempts++;
            if (window.apiClient) {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('API client yüklenemedi');
                // API client yüklenemezse bile token kontrolü yap
                checkAuth();
            }
        }
        check();
    }
    
    // Authentication kontrolü
    async function checkAuth() {
        const currentPage = getCurrentPage();
        const token = localStorage.getItem('authToken');
        
        console.log('Auth Guard Check:', {
            currentPage,
            hasToken: !!token,
            isProtected: protectedPages.includes(currentPage),
            isPublic: publicPages.includes(currentPage)
        });
        
        // Public sayfalar için kontrol yapma
        if (publicPages.includes(currentPage)) {
            // Eğer zaten giriş yapmışsa ve login/kayıt sayfasındaysa dashboard'a yönlendir
            if (token && (currentPage === 'giris.html' || currentPage === 'kayit-ol.html')) {
                if (window.apiClient) {
                    try {
                        const response = await window.apiClient.getCurrentUser();
                        if (response.success && response.data.user) {
                            window.location.href = 'dashboard.html';
                            return;
                        }
                    } catch (error) {
                        // Token geçersiz, devam et
                        console.log('Token geçersiz, login sayfasında kal');
                    }
                }
            }
            return;
        }
        
        // Korumalı sayfalar için authentication kontrolü
        if (protectedPages.includes(currentPage)) {
            if (!token) {
                // Token yok, giriş sayfasına yönlendir
                console.log('Token yok, giriş sayfasına yönlendiriliyor');
                const returnUrl = encodeURIComponent(window.location.href);
                window.location.href = `giris.html?return=${returnUrl}`;
                return;
            }
            
            // Token var, geçerliliğini kontrol et
            if (window.apiClient) {
                try {
                    const response = await window.apiClient.getCurrentUser();
                    if (!response.success || !response.data.user) {
                        // Token geçersiz, temizle ve giriş sayfasına yönlendir
                        console.log('Token geçersiz, giriş sayfasına yönlendiriliyor');
                        window.apiClient.clearTokens();
                        const returnUrl = encodeURIComponent(window.location.href);
                        window.location.href = `giris.html?return=${returnUrl}`;
                        return;
                    }
                    // Token geçerli, sayfaya erişim izni ver
                    console.log('Authentication başarılı, sayfaya erişim izni verildi');
                    
                    // Kullanıcı bilgilerini localStorage'a kaydet (session persistence için)
                    if (response.data.user) {
                        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                        localStorage.setItem('userId', response.data.user.id);
                    }
                } catch (error) {
                    console.error('Authentication kontrolü başarısız:', error);
                    // Hata durumunda token'ı temizle ve giriş sayfasına yönlendir
                    if (window.apiClient) {
                        window.apiClient.clearTokens();
                    }
                    const returnUrl = encodeURIComponent(window.location.href);
                    window.location.href = `giris.html?return=${returnUrl}`;
                    return;
                }
            } else {
                // API client yüklenmedi ama token var, yine de kontrol et
                // Token formatını kontrol et (basit kontrol)
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp && payload.exp < now) {
                        // Token süresi dolmuş
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('refreshToken');
                        const returnUrl = encodeURIComponent(window.location.href);
                        window.location.href = `giris.html?return=${returnUrl}`;
                        return;
                    }
                } catch (error) {
                    // Token parse edilemedi, geçersiz
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    const returnUrl = encodeURIComponent(window.location.href);
                    window.location.href = `giris.html?return=${returnUrl}`;
                    return;
                }
            }
        }
    }
    
    // Sayfa yüklendiğinde authentication kontrolü yap
    function init() {
        // DOM hazır olana kadar bekle
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                waitForAPIClient(checkAuth);
            });
        } else {
            waitForAPIClient(checkAuth);
        }
        
        // Sayfa görünürlüğü değiştiğinde kontrol et (tab değişimi)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Sayfa tekrar görünür olduğunda token kontrolü yap
                const currentPage = getCurrentPage();
                if (protectedPages.includes(currentPage)) {
                    waitForAPIClient(checkAuth);
                }
            }
        });
        
        // Storage event listener (başka tab'da logout yapıldığında)
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' && !e.newValue) {
                // Token başka tab'da silindi
                const currentPage = getCurrentPage();
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'giris.html';
                }
            }
        });
    }
    
    // Hemen başlat
    init();
})();


