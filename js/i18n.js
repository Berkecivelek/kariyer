// Basit i18n (Internationalization) Sistemi
// Kullanıcının dil tercihine göre sayfa içeriğini çevirir

(function() {
    'use strict';
    
    // Dil çevirileri
    const translations = {
        tr: {
            // Genel
            'save': 'Kaydet',
            'cancel': 'İptal',
            'delete': 'Sil',
            'edit': 'Düzenle',
            'close': 'Kapat',
            'loading': 'Yükleniyor...',
            'error': 'Hata',
            'success': 'Başarılı',
            // Navigation
            'dashboard': 'Dashboard',
            'resumes': 'Özgeçmişler',
            'cover_letters': 'Ön Yazılar',
            'portfolios': 'Portfolyolar',
            'settings': 'Ayarlar',
            'logout': 'Çıkış Yap',
            // CV Builder
            'personal_info': 'Kişisel Bilgiler',
            'summary': 'Özet',
            'experience': 'Deneyim',
            'education': 'Eğitim',
            'skills': 'Yetenekler',
            'languages': 'Diller',
            // Buttons
            'create': 'Oluştur',
            'update': 'Güncelle',
            'download': 'İndir',
            'preview': 'Önizle',
            'continue': 'Devam Et',
            'back': 'Geri',
            // Messages
            'saved_successfully': 'Başarıyla kaydedildi!',
            'error_occurred': 'Bir hata oluştu',
            'please_wait': 'Lütfen bekleyin...'
        },
        en: {
            // General
            'save': 'Save',
            'cancel': 'Cancel',
            'delete': 'Delete',
            'edit': 'Edit',
            'close': 'Close',
            'loading': 'Loading...',
            'error': 'Error',
            'success': 'Success',
            // Navigation
            'dashboard': 'Dashboard',
            'resumes': 'Resumes',
            'cover_letters': 'Cover Letters',
            'portfolios': 'Portfolios',
            'settings': 'Settings',
            'logout': 'Logout',
            // CV Builder
            'personal_info': 'Personal Information',
            'summary': 'Summary',
            'experience': 'Experience',
            'education': 'Education',
            'skills': 'Skills',
            'languages': 'Languages',
            // Buttons
            'create': 'Create',
            'update': 'Update',
            'download': 'Download',
            'preview': 'Preview',
            'continue': 'Continue',
            'back': 'Back',
            // Messages
            'saved_successfully': 'Saved successfully!',
            'error_occurred': 'An error occurred',
            'please_wait': 'Please wait...'
        },
        de: {
            // General
            'save': 'Speichern',
            'cancel': 'Abbrechen',
            'delete': 'Löschen',
            'edit': 'Bearbeiten',
            'close': 'Schließen',
            'loading': 'Lädt...',
            'error': 'Fehler',
            'success': 'Erfolg',
            // Navigation
            'dashboard': 'Dashboard',
            'resumes': 'Lebensläufe',
            'cover_letters': 'Anschreiben',
            'portfolios': 'Portfolios',
            'settings': 'Einstellungen',
            'logout': 'Abmelden',
            // CV Builder
            'personal_info': 'Persönliche Informationen',
            'summary': 'Zusammenfassung',
            'experience': 'Erfahrung',
            'education': 'Bildung',
            'skills': 'Fähigkeiten',
            'languages': 'Sprachen',
            // Buttons
            'create': 'Erstellen',
            'update': 'Aktualisieren',
            'download': 'Herunterladen',
            'preview': 'Vorschau',
            'continue': 'Weiter',
            'back': 'Zurück',
            // Messages
            'saved_successfully': 'Erfolgreich gespeichert!',
            'error_occurred': 'Ein Fehler ist aufgetreten',
            'please_wait': 'Bitte warten...'
        },
        es: {
            // General
            'save': 'Guardar',
            'cancel': 'Cancelar',
            'delete': 'Eliminar',
            'edit': 'Editar',
            'close': 'Cerrar',
            'loading': 'Cargando...',
            'error': 'Error',
            'success': 'Éxito',
            // Navigation
            'dashboard': 'Panel',
            'resumes': 'Currículums',
            'cover_letters': 'Cartas de Presentación',
            'portfolios': 'Portafolios',
            'settings': 'Configuración',
            'logout': 'Cerrar Sesión',
            // CV Builder
            'personal_info': 'Información Personal',
            'summary': 'Resumen',
            'experience': 'Experiencia',
            'education': 'Educación',
            'skills': 'Habilidades',
            'languages': 'Idiomas',
            // Buttons
            'create': 'Crear',
            'update': 'Actualizar',
            'download': 'Descargar',
            'preview': 'Vista Previa',
            'continue': 'Continuar',
            'back': 'Atrás',
            // Messages
            'saved_successfully': '¡Guardado exitosamente!',
            'error_occurred': 'Ocurrió un error',
            'please_wait': 'Por favor espere...'
        }
    };
    
    // Kullanıcının dil tercihini al
    async function getUserLanguage() {
        // Önce localStorage'dan kontrol et
        const storedLang = localStorage.getItem('userLanguage');
        if (storedLang && translations[storedLang]) {
            return storedLang;
        }
        
        // Backend'den kullanıcı bilgilerini al (eğer giriş yapılmışsa)
        try {
            const token = localStorage.getItem('authToken');
            if (token && window.apiClient) {
                const response = await window.apiClient.getCurrentUser();
                if (response.success && response.data.user && response.data.user.language) {
                    const userLang = response.data.user.language;
                    if (translations[userLang]) {
                        localStorage.setItem('userLanguage', userLang);
                        return userLang;
                    }
                }
            }
        } catch (error) {
            console.log('Kullanıcı dil tercihi alınamadı:', error);
        }
        
        // Varsayılan olarak Türkçe
        return 'tr';
    }
    
    // Dil tercihini ayarla ve sayfayı çevir
    async function setUserLanguage(lang) {
        if (translations[lang]) {
            localStorage.setItem('userLanguage', lang);
            // HTML lang attribute'unu güncelle
            document.documentElement.lang = lang;
            // Sayfayı hemen çevir (yenilemeden)
            await initI18n();
        }
    }
    
    // Çeviri fonksiyonu
    async function t(key, lang = null) {
        const currentLang = lang || await getUserLanguage();
        const translation = translations[currentLang];
        if (translation && translation[key]) {
            return translation[key];
        }
        // Çeviri bulunamazsa key'i döndür
        return key;
    }
    
    // Sayfa yüklendiğinde dil tercihini uygula
    async function initI18n() {
        const lang = await getUserLanguage();
        document.documentElement.lang = lang;
        
        // HTML'deki data-i18n attribute'larına sahip elementleri çevir
        document.querySelectorAll('[data-i18n]').forEach(async element => {
            const key = element.getAttribute('data-i18n');
            const translation = await t(key, lang);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Sayfa başlığını çevir
        translatePageTitle(lang);
        
        // Önemli metinleri çevir (biraz gecikme ile, DOM'un tam yüklenmesi için)
        setTimeout(() => {
            translateCommonTexts(lang);
        }, 100);
    }
    
    // Sayfa başlığını çevir
    function translatePageTitle(lang) {
        const titleMap = {
            tr: {
                'CareerAI - Yapay Zeka Kariyer Asistanı': 'CareerAI - Yapay Zeka Kariyer Asistanı',
                'Dashboard': 'Dashboard',
                'Hesap Ayarları': 'Hesap Ayarları',
                'Profil Bilgileri': 'Profil Bilgileri'
            },
            en: {
                'CareerAI - Yapay Zeka Kariyer Asistanı': 'CareerAI - AI Career Assistant',
                'Dashboard': 'Dashboard',
                'Hesap Ayarları': 'Account Settings',
                'Profil Bilgileri': 'Profile Information'
            },
            de: {
                'CareerAI - Yapay Zeka Kariyer Asistanı': 'CareerAI - KI-Karriere-Assistent',
                'Dashboard': 'Dashboard',
                'Hesap Ayarları': 'Kontoeinstellungen',
                'Profil Bilgileri': 'Profilinformationen'
            },
            es: {
                'CareerAI - Yapay Zeka Kariyer Asistanı': 'CareerAI - Asistente de Carrera con IA',
                'Dashboard': 'Panel',
                'Hesap Ayarları': 'Configuración de Cuenta',
                'Profil Bilgileri': 'Información del Perfil'
            }
        };
        
        if (titleMap[lang] && document.title) {
            const currentTitle = document.title;
            if (titleMap[lang][currentTitle]) {
                document.title = titleMap[lang][currentTitle];
            }
        }
    }
    
    // Yaygın metinleri çevir (akıllı selector'lar ile)
    function translateCommonTexts(lang) {
        const commonTexts = {
            tr: {
                'Giriş Yap': 'Giriş Yap',
                'Kayıt Ol': 'Kayıt Ol',
                'Çıkış Yap': 'Çıkış Yap',
                'Hizmetler': 'Hizmetler',
                'Şablonlar': 'Şablonlar',
                'Fiyatlandırma': 'Fiyatlandırma',
                'Ücretsiz Dene': 'Ücretsiz Dene',
                'Dashboard': 'Dashboard',
                'Ayarlar': 'Ayarlar',
                'Profil Bilgileri': 'Profil Bilgileri',
                'Hesap Ayarları': 'Hesap Ayarları',
                'Bildirim Ayarları': 'Bildirim Ayarları',
                'Şifre ve Güvenlik': 'Şifre ve Güvenlik',
                'Gizlilik Ayarları': 'Gizlilik Ayarları',
                'Değişiklikleri Kaydet': 'Değişiklikleri Kaydet',
                'İptal': 'İptal',
                'Ayarları Kaydet': 'Ayarları Kaydet',
                'Kaydediliyor...': 'Kaydediliyor...',
                'Bölgesel ayarlar başarıyla kaydedildi!': 'Bölgesel ayarlar başarıyla kaydedildi!',
                'Abonelik Planı': 'Abonelik Planı',
                'Ödeme Yöntemleri': 'Ödeme Yöntemleri',
                'Bölgesel Ayarlar': 'Bölgesel Ayarlar',
                'Hesabı Sil': 'Hesabı Sil',
                'Dil Tercihi': 'Dil Tercihi',
                'Zaman Dilimi': 'Zaman Dilimi',
                'Mevcut planınız ve faturalandırma detayları.': 'Mevcut planınız ve faturalandırma detayları.',
                'Kayıtlı ödeme yöntemlerinizi düzenleyin.': 'Kayıtlı ödeme yöntemlerinizi düzenleyin.',
                'Dil ve zaman dilimi tercihlerinizi yapılandırın.': 'Dil ve zaman dilimi tercihlerinizi yapılandırın.',
                'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılacaktır.': 'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılacaktır.',
                'Hesabımı Sil': 'Hesabımı Sil',
                'Panoya Dön': 'Panoya Dön',
                'Profilimi Görüntüle': 'Profilimi Görüntüle'
            },
            en: {
                'Giriş Yap': 'Log In',
                'Kayıt Ol': 'Sign Up',
                'Çıkış Yap': 'Log Out',
                'Hizmetler': 'Services',
                'Şablonlar': 'Templates',
                'Fiyatlandırma': 'Pricing',
                'Ücretsiz Dene': 'Try Free',
                'Dashboard': 'Dashboard',
                'Ayarlar': 'Settings',
                'Profil Bilgileri': 'Profile Information',
                'Hesap Ayarları': 'Account Settings',
                'Bildirim Ayarları': 'Notification Settings',
                'Şifre ve Güvenlik': 'Password and Security',
                'Gizlilik Ayarları': 'Privacy Settings',
                'Değişiklikleri Kaydet': 'Save Changes',
                'İptal': 'Cancel',
                'Ayarları Kaydet': 'Save Settings',
                'Kaydediliyor...': 'Saving...',
                'Bölgesel ayarlar başarıyla kaydedildi!': 'Regional settings saved successfully!',
                'Abonelik Planı': 'Subscription Plan',
                'Ödeme Yöntemleri': 'Payment Methods',
                'Bölgesel Ayarlar': 'Regional Settings',
                'Hesabı Sil': 'Delete Account',
                'Dil Tercihi': 'Language Preference',
                'Zaman Dilimi': 'Time Zone',
                'Mevcut planınız ve faturalandırma detayları.': 'Your current plan and billing details.',
                'Kayıtlı ödeme yöntemlerinizi düzenleyin.': 'Manage your registered payment methods.',
                'Dil ve zaman dilimi tercihlerinizi yapılandırın.': 'Configure your language and time zone preferences.',
                'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılacaktır.': 'When you delete your account, all your data will be permanently removed.',
                'Hesabımı Sil': 'Delete My Account',
                'Panoya Dön': 'Return to Dashboard',
                'Profilimi Görüntüle': 'View Profile'
            },
            de: {
                'Giriş Yap': 'Anmelden',
                'Kayıt Ol': 'Registrieren',
                'Çıkış Yap': 'Abmelden',
                'Hizmetler': 'Dienstleistungen',
                'Şablonlar': 'Vorlagen',
                'Fiyatlandırma': 'Preise',
                'Ücretsiz Dene': 'Kostenlos Testen',
                'Dashboard': 'Dashboard',
                'Ayarlar': 'Einstellungen',
                'Profil Bilgileri': 'Profilinformationen',
                'Hesap Ayarları': 'Kontoeinstellungen',
                'Bildirim Ayarları': 'Benachrichtigungseinstellungen',
                'Şifre ve Güvenlik': 'Passwort und Sicherheit',
                'Gizlilik Ayarları': 'Datenschutzeinstellungen',
                'Değişiklikleri Kaydet': 'Änderungen speichern',
                'İptal': 'Abbrechen',
                'Ayarları Kaydet': 'Einstellungen speichern',
                'Kaydediliyor...': 'Wird gespeichert...',
                'Bölgesel ayarlar başarıyla kaydedildi!': 'Regionale Einstellungen erfolgreich gespeichert!',
                'Abonelik Planı': 'Abonnementplan',
                'Ödeme Yöntemleri': 'Zahlungsmethoden',
                'Bölgesel Ayarlar': 'Regionale Einstellungen',
                'Hesabı Sil': 'Konto löschen',
                'Dil Tercihi': 'Spracheinstellung',
                'Zaman Dilimi': 'Zeitzone',
                'Mevcut planınız ve faturalandırma detayları.': 'Ihr aktueller Plan und Abrechnungsdetails.',
                'Kayıtlı ödeme yöntemlerinizi düzenleyin.': 'Verwalten Sie Ihre registrierten Zahlungsmethoden.',
                'Dil ve zaman dilimi tercihlerinizi yapılandırın.': 'Konfigurieren Sie Ihre Sprach- und Zeitzoneneinstellungen.',
                'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılacaktır.': 'Wenn Sie Ihr Konto löschen, werden alle Ihre Daten dauerhaft entfernt.',
                'Hesabımı Sil': 'Mein Konto löschen',
                'Panoya Dön': 'Zum Dashboard zurückkehren',
                'Profilimi Görüntüle': 'Profil anzeigen'
            },
            es: {
                'Giriş Yap': 'Iniciar Sesión',
                'Kayıt Ol': 'Registrarse',
                'Çıkış Yap': 'Cerrar Sesión',
                'Hizmetler': 'Servicios',
                'Şablonlar': 'Plantillas',
                'Fiyatlandırma': 'Precios',
                'Ücretsiz Dene': 'Probar Gratis',
                'Dashboard': 'Panel',
                'Ayarlar': 'Configuración',
                'Profil Bilgileri': 'Información del Perfil',
                'Hesap Ayarları': 'Configuración de Cuenta',
                'Bildirim Ayarları': 'Configuración de Notificaciones',
                'Şifre ve Güvenlik': 'Contraseña y Seguridad',
                'Gizlilik Ayarları': 'Configuración de Privacidad',
                'Değişiklikleri Kaydet': 'Guardar Cambios',
                'İptal': 'Cancelar',
                'Ayarları Kaydet': 'Guardar Configuración',
                'Kaydediliyor...': 'Guardando...',
                'Bölgesel ayarlar başarıyla kaydedildi!': '¡Configuración regional guardada exitosamente!',
                'Abonelik Planı': 'Plan de Suscripción',
                'Ödeme Yöntemleri': 'Métodos de Pago',
                'Bölgesel Ayarlar': 'Configuración Regional',
                'Hesabı Sil': 'Eliminar Cuenta',
                'Dil Tercihi': 'Preferencia de Idioma',
                'Zaman Dilimi': 'Zona Horaria',
                'Mevcut planınız ve faturalandırma detayları.': 'Su plan actual y detalles de facturación.',
                'Kayıtlı ödeme yöntemlerinizi düzenleyin.': 'Administre sus métodos de pago registrados.',
                'Dil ve zaman dilimi tercihlerinizi yapılandırın.': 'Configure sus preferencias de idioma y zona horaria.',
                'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılacaktır.': 'Cuando elimine su cuenta, todos sus datos se eliminarán permanentemente.',
                'Hesabımı Sil': 'Eliminar Mi Cuenta',
                'Panoya Dön': 'Volver al Panel',
                'Profilimi Görüntüle': 'Ver Perfil'
            }
        };
        
        if (!commonTexts[lang]) return;
        
        const texts = commonTexts[lang];
        
        // Önce data-i18n attribute'larına sahip elementleri çevir
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (texts[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = texts[key];
                } else {
                    element.textContent = texts[key];
                }
            }
        });
        
        // Sonra sayfadaki tüm metinleri çevir (daha kapsamlı yaklaşım)
        Object.keys(texts).forEach(originalText => {
            const translatedText = texts[originalText];
            if (originalText === translatedText) return; // Aynıysa çevirme
            
            // Tüm elementleri kontrol et (sadece text node'ları değil)
            const allElements = document.querySelectorAll('*');
            allElements.forEach(element => {
                // Script ve style tag'lerini atla
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
                
                // Eğer element'in data-i18n attribute'u varsa, onu kullan (öncelik)
                if (element.hasAttribute('data-i18n')) return;
                
                // Element'in textContent'ini kontrol et
                const text = element.textContent.trim();
                if (text === originalText) {
                    // Sadece direkt text node'u olan elementleri güncelle
                    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                        element.textContent = translatedText;
                    } else {
                        // İç içe elementler varsa, sadece text node'ları güncelle
                        const walker = document.createTreeWalker(
                            element,
                            NodeFilter.SHOW_TEXT,
                            null,
                            false
                        );
                        let node;
                        while (node = walker.nextNode()) {
                            if (node.textContent.trim() === originalText) {
                                node.textContent = translatedText;
                            }
                        }
                    }
                }
            });
        });
    }
    
    // Global olarak erişilebilir yap
    window.i18n = {
        t,
        setLanguage: setUserLanguage,
        getLanguage: getUserLanguage,
        init: initI18n,
        translatePage: initI18n
    };
    
    // Sayfa yüklendiğinde otomatik başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // API client yüklendikten sonra başlat
            if (window.apiClient) {
                initI18n();
            } else {
                // API client yüklenene kadar bekle
                const checkInterval = setInterval(() => {
                    if (window.apiClient) {
                        clearInterval(checkInterval);
                        initI18n();
                    }
                }, 100);
                // 5 saniye sonra timeout
                setTimeout(() => {
                    clearInterval(checkInterval);
                    initI18n(); // API client olmasa da başlat
                }, 5000);
            }
        });
    } else {
        // Sayfa zaten yüklendi
        if (window.apiClient) {
            initI18n();
        } else {
            setTimeout(() => initI18n(), 500);
        }
    }
})();

