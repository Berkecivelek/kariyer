// CV Anlık Önizleme ve Veri Kaydetme İşlevselliği
(function() {
    'use strict';
    
    const STORAGE_KEY = 'cv-builder-data';
    
    // localStorage'dan veri oku
    function getStoredData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
    
    // localStorage'a veri kaydet
    function saveData(key, value) {
        const data = getStoredData();
        data[key] = value;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Veri kaydedilemedi:', e);
        }
    }
    
    // localStorage'dan veri yükle
    function loadStoredValue(input, previewType) {
        const data = getStoredData();
        if (data[previewType] !== undefined) {
            input.value = data[previewType];
            // Input değiştiğinde önizlemeyi güncelle
            input.dispatchEvent(new Event('input'));
        }
    }
    
    function initLivePreview() {
        // Önce tüm initialized flag'lerini temizle (şablon değiştiğinde yeniden başlatmak için)
        const allInputs = document.querySelectorAll('[data-preview]');
        allInputs.forEach(input => {
            input.removeAttribute('data-preview-initialized');
        });
        
        // Tüm preview attribute'lu input ve textarea'ları bul
        const previewInputs = document.querySelectorAll('[data-preview]');
        
        previewInputs.forEach(input => {
            const previewType = input.getAttribute('data-preview');
            
            // Özel durum: Ad ve Soyad birleştirme
            if (previewType === 'fullname-first' || previewType === 'fullname-last') {
                const firstNameInput = document.querySelector('[data-preview="fullname-first"]');
                const lastNameInput = document.querySelector('[data-preview="fullname-last"]');
                const fullNameTarget = document.querySelector('[data-preview-target="fullname"]');
                
                if (firstNameInput && lastNameInput && fullNameTarget) {
                    // Kaydedilmiş değerleri yükle
                    loadStoredValue(firstNameInput, 'fullname-first');
                    loadStoredValue(lastNameInput, 'fullname-last');
                    
                    function updateFullName() {
                        const firstName = firstNameInput.value.trim() || '';
                        const lastName = lastNameInput.value.trim() || '';
                        const fullName = (firstName + ' ' + lastName).trim() || 'Ad Soyad';
                        
                        // Tüm fullname target'larını güncelle (şablon değiştiğinde birden fazla olabilir)
                        const allFullNameTargets = document.querySelectorAll('[data-preview-target="fullname"]');
                        allFullNameTargets.forEach(target => {
                            target.textContent = fullName.toUpperCase();
                        });
                        
                        // Verileri kaydet
                        saveData('fullname-first', firstName);
                        saveData('fullname-last', lastName);
                    }
                    
                    // Her iki input için de event listener ekle (sadece bir kez)
                    if (!firstNameInput.hasAttribute('data-preview-initialized')) {
                        firstNameInput.addEventListener('input', updateFullName);
                        firstNameInput.setAttribute('data-preview-initialized', 'true');
                    }
                    if (!lastNameInput.hasAttribute('data-preview-initialized')) {
                        lastNameInput.addEventListener('input', updateFullName);
                        lastNameInput.setAttribute('data-preview-initialized', 'true');
                    }
                    
                    // İlk yüklemede güncelle
                    updateFullName();
                }
            } else {
                // Diğer alanlar için normal güncelleme
                const targets = document.querySelectorAll(`[data-preview-target="${previewType}"]`);
                
                if (targets.length > 0 && !input.hasAttribute('data-preview-initialized')) {
                    // Kaydedilmiş değeri yükle
                    loadStoredValue(input, previewType);
                    
                    function updatePreview() {
                        const value = input.value.trim();
                        const displayValue = value || input.placeholder || '';
                        
                        // Tüm target'ları güncelle (şablon değiştiğinde birden fazla olabilir)
                        targets.forEach(target => {
                            if (previewType === 'email' || previewType === 'phone' || previewType === 'location') {
                                // İkonlu span'lar için özel işlem
                                const icon = target.querySelector('.material-symbols-outlined');
                                if (icon) {
                                    // İkonun HTML'ini koruyarak sadece metni güncelle
                                    const iconHTML = icon.outerHTML;
                                    target.innerHTML = iconHTML + ' ' + displayValue;
                                } else {
                                    // İkon yoksa direkt metni güncelle
                                    target.textContent = displayValue;
                                }
                            } else if (previewType === 'summary') {
                                // Özet için özel işlem (çok satırlı metin)
                                target.textContent = displayValue || 'Profesyonel özetinizi buraya yazın...';
                            } else {
                                // Normal text güncelleme
                                target.textContent = displayValue;
                            }
                        });
                        
                        // Veriyi kaydet
                        saveData(previewType, value);
                    }
                    
                    input.addEventListener('input', updatePreview);
                    input.addEventListener('change', updatePreview);
                    input.setAttribute('data-preview-initialized', 'true');
                    
                    // İlk yüklemede güncelle
                    updatePreview();
                }
            }
        });
    }
    
    // Global olarak erişilebilir yap
    window.initLivePreview = initLivePreview;
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLivePreview);
    } else {
        initLivePreview();
    }
    
    // Dinamik içerik için MutationObserver (eğer sayfa dinamik olarak yükleniyorsa)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Yeni eklenen input'ları kontrol et
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-preview')) {
                        initLivePreview();
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
