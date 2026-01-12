// Şablon seçimi ve zoom işlevselliği
(function() {
    // Şablon seçimi işlevselliği
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTemplate = urlParams.get('template') || 'modern';
    
    // Tüm şablon kartlarını bul
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        const template = card.getAttribute('data-template');
        const cardDiv = card.querySelector('div');
        const selectedBadge = card.querySelector('.template-selected');
        const label = card.querySelector('p');
        
        if (template === selectedTemplate) {
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

