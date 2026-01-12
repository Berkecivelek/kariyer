// Global Authentication Header Control
// Bu script tüm sayfalarda header'daki giriş/kullanıcı menüsünü kontrol eder
(function() {
    'use strict';
    
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
                console.warn('API client yüklenemedi, authentication kontrolü atlanıyor');
            }
        }
        check();
    }
    
    // Header'daki auth butonlarını bul ve güncelle
    function updateAuthHeader() {
        // Farklı sayfalarda farklı ID'ler olabilir, hepsini kontrol et
        const loginBtn = document.getElementById('login-btn');
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const logoutBtn = document.getElementById('logout-btn');
        const userName = document.getElementById('user-name');
        
        const token = localStorage.getItem('authToken');
        
        console.log('Auth Header Update:', {
            hasToken: !!token,
            hasApiClient: !!window.apiClient,
            hasLoginBtn: !!loginBtn,
            hasAuthButtons: !!authButtons,
            hasUserMenu: !!userMenu
        });
        
        if (!token || !window.apiClient) {
            // Giriş yapılmamış - login butonunu göster
            if (authButtons) {
                authButtons.classList.remove('hidden');
                authButtons.style.display = '';
                authButtons.style.visibility = 'visible';
            }
            if (loginBtn) {
                loginBtn.style.display = '';
                loginBtn.style.visibility = 'visible';
            }
            if (userMenu) {
                userMenu.classList.add('hidden');
                userMenu.style.display = 'none';
                userMenu.style.visibility = 'hidden';
            }
            return;
        }
        
        // Kullanıcı bilgilerini yükle
        window.apiClient.getCurrentUser()
            .then(response => {
                console.log('getCurrentUser response:', response);
                if (response.success && response.data.user) {
                    const user = response.data.user;
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                    
                    console.log('Kullanıcı giriş yapmış, menü güncelleniyor:', fullName);
                    
                    // Kullanıcı menüsünü göster, login butonunu gizle
                    if (authButtons) {
                        authButtons.classList.add('hidden');
                        authButtons.style.display = 'none';
                        authButtons.style.visibility = 'hidden';
                    }
                    if (loginBtn) {
                        loginBtn.style.display = 'none';
                        loginBtn.style.visibility = 'hidden';
                    }
                    if (userMenu) {
                        userMenu.classList.remove('hidden');
                        userMenu.style.display = 'flex';
                        userMenu.style.visibility = 'visible';
                    } else if (loginBtn) {
                        // user-menu yoksa login butonunu kullanıcı menüsüne çevir
                        createUserMenu(loginBtn, fullName);
                    }
                    if (userName) userName.textContent = fullName;
                } else {
                    console.warn('getCurrentUser başarısız, token geçersiz olabilir');
                    // Token geçersiz
                    if (window.apiClient) {
                        window.apiClient.clearTokens();
                    }
                    if (authButtons) {
                        authButtons.classList.remove('hidden');
                        authButtons.style.display = '';
                        authButtons.style.visibility = 'visible';
                    }
                    if (userMenu) {
                        userMenu.classList.add('hidden');
                        userMenu.style.display = 'none';
                        userMenu.style.visibility = 'hidden';
                    }
                }
            })
            .catch(error => {
                console.error('Kullanıcı bilgisi yüklenemedi:', error);
                // Hata durumunda giriş yapılmamış gibi göster
                if (authButtons) {
                    authButtons.classList.remove('hidden');
                    authButtons.style.display = '';
                    authButtons.style.visibility = 'visible';
                }
                if (userMenu) {
                    userMenu.classList.add('hidden');
                    userMenu.style.display = 'none';
                    userMenu.style.visibility = 'hidden';
                }
            });
    }
    
    // Login butonunu kullanıcı menüsüne çevir (user-menu yoksa)
    function createUserMenu(loginBtn, fullName) {
        if (!loginBtn) return;
        
        const parent = loginBtn.parentElement;
        if (!parent) return;
        
        // Login butonunu gizle
        loginBtn.style.display = 'none';
        
        // Kullanıcı menüsü oluştur
        const userMenuDiv = document.createElement('div');
        userMenuDiv.className = 'flex items-center gap-3';
        userMenuDiv.innerHTML = `
            <a href="dashboard.html" class="flex items-center gap-2 cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[#111218] dark:text-white text-sm font-bold transition-colors">
                <span class="material-symbols-outlined text-lg">dashboard</span>
                <span>${escapeHtml(fullName)}</span>
            </a>
            <a href="profil-ayarlari.html" class="flex items-center justify-center rounded-full size-10 bg-slate-200 dark:bg-slate-700 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <span class="material-symbols-outlined text-lg">person</span>
            </a>
            <button id="logout-btn" class="flex cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[#111218] dark:text-white text-sm font-bold transition-colors">
                Çıkış Yap
            </button>
        `;
        
        parent.appendChild(userMenuDiv);
        
        // Logout butonuna event listener ekle
        const logoutBtn = userMenuDiv.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
    
    // Çıkış yap
    function handleLogout(e) {
        if (e) e.preventDefault();
        
        try {
            if (window.apiClient) {
                window.apiClient.logout().catch(() => {});
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Token'ları temizle
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            // Sayfayı yenile
            window.location.reload();
        }
    }
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Logout butonlarına event listener ekle
    function initLogoutButtons() {
        const logoutBtns = document.querySelectorAll('#logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', handleLogout);
        });
    }
    
    // Sayfa yüklendiğinde başlat
    function init() {
        // Önce DOM'un hazır olduğundan emin ol
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                waitForAPIClient(() => {
                    updateAuthHeader();
                    initLogoutButtons();
                });
            });
        } else {
            // DOM hazırsa direkt başlat
            waitForAPIClient(() => {
                updateAuthHeader();
                initLogoutButtons();
            });
        }
        
        // Ekstra güvenlik: 1 saniye sonra tekrar kontrol et
        setTimeout(() => {
            if (window.apiClient) {
                updateAuthHeader();
            }
        }, 1000);
    }
    
    // Hemen başlat
    init();
})();

