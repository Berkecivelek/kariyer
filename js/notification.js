// Modern Notification/Toast System
// Şık ve kullanıcı dostu bildirimler için

(function() {
    'use strict';
    
    // Bildirim göster
    function showNotification(message, type = 'success', duration = 3000) {
        // Mevcut bildirimleri kaldır
        const existingNotifications = document.querySelectorAll('.modern-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Bildirim elementi oluştur
        const notification = document.createElement('div');
        notification.className = 'modern-notification fixed top-4 right-4 z-[9999] transform transition-all duration-300 ease-out opacity-0 translate-x-full';
        
        // Tip'e göre renk ve ikon belirle
        const config = {
            success: {
                bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                icon: 'check_circle',
                iconBg: 'bg-green-400/20'
            },
            error: {
                bg: 'bg-gradient-to-r from-red-500 to-rose-600',
                icon: 'error',
                iconBg: 'bg-red-400/20'
            },
            warning: {
                bg: 'bg-gradient-to-r from-yellow-500 to-amber-600',
                icon: 'warning',
                iconBg: 'bg-yellow-400/20'
            },
            info: {
                bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                icon: 'info',
                iconBg: 'bg-blue-400/20'
            }
        };
        
        const style = config[type] || config.success;
        
        notification.innerHTML = `
            <div class="${style.bg} text-white rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] flex items-start gap-3 backdrop-blur-sm border border-white/20">
                <div class="${style.iconBg} rounded-full p-2 flex-shrink-0">
                    <span class="material-symbols-outlined text-2xl">${style.icon}</span>
                </div>
                <div class="flex-1 pt-0.5">
                    <p class="text-sm font-semibold leading-relaxed">${escapeHtml(message)}</p>
                </div>
                <button class="notification-close flex-shrink-0 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animasyon ile göster
        requestAnimationFrame(() => {
            notification.classList.remove('opacity-0', 'translate-x-full');
            notification.classList.add('opacity-100', 'translate-x-0');
        });
        
        // Kapat butonu
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.classList.remove('opacity-100', 'translate-x-0');
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => notification.remove(), 300);
        };
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeNotification);
        }
        
        // Otomatik kapanma
        if (duration > 0) {
            setTimeout(closeNotification, duration);
        }
        
        return notification;
    }
    
    // HTML escape
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Global olarak erişilebilir yap
    window.showNotification = showNotification;
    window.showSuccess = (message, duration) => showNotification(message, 'success', duration);
    window.showError = (message, duration) => showNotification(message, 'error', duration);
    window.showWarning = (message, duration) => showNotification(message, 'warning', duration);
    window.showInfo = (message, duration) => showNotification(message, 'info', duration);
})();


