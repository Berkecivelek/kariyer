// Şablon seçimi ve zoom işlevselliği
(function() {
    // Şablon seçimi işlevselliği
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTemplate = urlParams.get('template') || localStorage.getItem('selected-template') || 'modern';
    
    // Şablon seçimini güncelle (global olarak erişilebilir yap)
    window.updateTemplateSelection = function(templateName) {
        // Tüm şablon kartlarını bul
        const templateCards = document.querySelectorAll('.template-card');
        
        templateCards.forEach(card => {
            const template = card.getAttribute('data-template');
            const cardDiv = card.querySelector('div');
            const selectedBadge = card.querySelector('.template-selected');
            const label = card.querySelector('p');
            
            if (template === templateName) {
                // Seçili şablonu vurgula
                card.classList.remove('opacity-70');
                card.classList.add('opacity-100');
                if (cardDiv) {
                    cardDiv.classList.remove('border', 'border-slate-200', 'dark:border-slate-600', 'shadow-sm');
                    cardDiv.classList.add('border-2', 'border-primary', 'ring-2', 'ring-primary/20', 'shadow-md');
                }
                if (selectedBadge) {
                    selectedBadge.classList.remove('hidden');
                }
                if (label) {
                    label.classList.remove('text-slate-600', 'dark:text-slate-400', 'font-medium');
                    label.classList.add('text-primary', 'font-bold');
                }
            } else {
                // Diğer şablonları normal göster
                card.classList.add('opacity-70');
                if (cardDiv) {
                    cardDiv.classList.remove('border-2', 'border-primary', 'ring-2', 'ring-primary/20', 'shadow-md');
                    cardDiv.classList.add('border', 'border-slate-200', 'dark:border-slate-600', 'shadow-sm');
                }
                if (selectedBadge) {
                    selectedBadge.classList.add('hidden');
                }
                if (label) {
                    label.classList.remove('text-primary', 'font-bold');
                    label.classList.add('text-slate-600', 'dark:text-slate-400', 'font-medium');
                }
            }
        });
    }
    
    // İlk yüklemede şablon seçimini güncelle
    updateTemplateSelection(selectedTemplate);
    
    // Şablon kartlarına tıklama event listener'ı ekle
    function initTemplateSelection() {
        const templateCards = document.querySelectorAll('.template-card');
        
        templateCards.forEach(card => {
            card.addEventListener('click', function() {
                const template = card.getAttribute('data-template');
                if (template && window.CVTemplateRenderer) {
                    // Şablon geçmişine ekle
                    if (window.TemplateHistory) {
                        window.TemplateHistory.add(template);
                        // Şablon listesini güncelle
                        window.TemplateHistory.updateList();
                    }
                    // Şablonu değiştir
                    window.CVTemplateRenderer.change(template);
                    // Görsel seçimi güncelle
                    updateTemplateSelection(template);
                }
            });
        });
    }
    
    // Sayfa yüklendiğinde veya dinamik içerik eklendiğinde başlat
    function init() {
        initTemplateSelection();
        
        // Dinamik içerik için MutationObserver
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    const hasNewCards = Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === 1 && node.classList && node.classList.contains('template-card')
                    );
                    if (hasNewCards) {
                        initTemplateSelection();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Zoom işlevselliği
    const a4Paper = document.querySelector('.a4-paper');
    const zoomLevelSpan = document.getElementById('zoom-level');
    const zoomDecreaseBtn = document.getElementById('zoom-decrease');
    const zoomIncreaseBtn = document.getElementById('zoom-increase');
    
    // Zoom seviyesini localStorage'dan oku veya varsayılan olarak 85% kullan
    let currentZoom = parseInt(localStorage.getItem('cv-zoom-level')) || 85;
    
    function updateZoom() {
        if (a4Paper && zoomLevelSpan) {
            // Zoom seviyesini uygula (transform: scale)
            const scale = currentZoom / 100;
            a4Paper.style.transform = `scale(${scale})`;
            a4Paper.style.transformOrigin = 'top center';
            
            // Zoom seviyesini göster
            zoomLevelSpan.textContent = currentZoom + '%';
            
            // localStorage'a kaydet
            localStorage.setItem('cv-zoom-level', currentZoom.toString());
        }
    }
    
    // Zoom azalt (-)
    if (zoomDecreaseBtn) {
        zoomDecreaseBtn.addEventListener('click', function() {
            if (currentZoom > 25) { // Minimum %25
                currentZoom -= 5;
                updateZoom();
            }
        });
    }
    
    // Zoom artır (+)
    if (zoomIncreaseBtn) {
        zoomIncreaseBtn.addEventListener('click', function() {
            if (currentZoom < 150) { // Maksimum %150
                currentZoom += 5;
                updateZoom();
            }
        });
    }
    
    // Sayfa yüklendiğinde zoom seviyesini uygula
    updateZoom();
})();

