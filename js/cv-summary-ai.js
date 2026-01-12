// CV Ön Yazı AI Entegrasyonu
(function() {
    'use strict';
    
    // localStorage'dan CV verilerini topla
    function getPersonalInfo() {
        const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
        
        // Deneyimleri al
        let experiences = [];
        try {
            experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
        } catch (e) {
            experiences = [];
        }
        
        // Eğitim bilgilerini al
        let education = [];
        try {
            education = JSON.parse(localStorage.getItem('cv-education') || '[]');
        } catch (e) {
            education = [];
        }
        
        // Yetenekleri al
        let skills = [];
        try {
            skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
        } catch (e) {
            skills = [];
        }
        
        return {
            firstName: cvData['fullname-first'] || '',
            lastName: cvData['fullname-last'] || '',
            profession: cvData.profession || '',
            experience: experiences,
            education: education,
            skills: skills
        };
    }
    
    // Loading state yönetimi
    function setLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> Yükleniyor...';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }
    
    // Textarea'ya ön yazı yaz ve localStorage'a kaydet
    function setSummaryText(text) {
        const textarea = document.getElementById('summary-textarea');
        if (textarea) {
            textarea.value = text;
            // Input event'i tetikle ki live preview güncellensin
            textarea.dispatchEvent(new Event('input'));
            
            // localStorage'a kaydet
            const cvData = JSON.parse(localStorage.getItem('cv-builder-data') || '{}');
            cvData.summary = text;
            localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
        }
    }
    
    // "Oluştur" butonu event listener
    function initGenerateButton() {
        const generateBtn = document.getElementById('ai-generate-btn');
        if (!generateBtn) return;
        
        generateBtn.addEventListener('click', async function() {
            if (!window.apiClient) {
                alert('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
                window.location.href = 'giris.html';
                return;
            }
            
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
                window.location.href = 'giris.html';
                return;
            }
            
            setLoading(generateBtn, true);
            
            try {
                const personalInfo = getPersonalInfo();
                
                const response = await window.apiClient.generateSummary(personalInfo);
                
                if (response.success && response.data && response.data.summary) {
                    setSummaryText(response.data.summary);
                } else {
                    throw new Error('Ön yazı oluşturulamadı.');
                }
            } catch (error) {
                console.error('❌ AI ön yazı oluşturma hatası:', error);
                
                let errorMessage = 'Ön yazı oluşturulurken bir hata oluştu.';
                
                // Backend'den gelen hata mesajını parse et
                let errorMsg = '';
                if (error && typeof error === 'object') {
                    // API client hatası
                    if (error.message) {
                        errorMsg = error.message;
                    }
                    // Response hatası
                    if (error.response && error.response.data) {
                        const responseData = error.response.data;
                        if (responseData.error && responseData.error.message) {
                            errorMsg = responseData.error.message;
                        } else if (responseData.message) {
                            errorMsg = responseData.message;
                        }
                    }
                } else if (typeof error === 'string') {
                    errorMsg = error;
                } else {
                    errorMsg = error?.toString() || '';
                }
                
                console.error('Error message extracted:', errorMsg);
                
                // Hata mesajına göre kullanıcı dostu mesaj oluştur
                const lowerMsg = errorMsg.toLowerCase();
                if (lowerMsg.includes('credits') || lowerMsg.includes('kredi') || lowerMsg.includes('insufficient')) {
                    errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
                } else if (lowerMsg.includes('authenticated') || lowerMsg.includes('giriş') || lowerMsg.includes('login') || lowerMsg.includes('401')) {
                    errorMessage = 'AI özelliğini kullanmak için giriş yapmanız gerekiyor.';
                    setTimeout(() => {
                        window.location.href = 'giris.html';
                    }, 2000);
                } else if (lowerMsg.includes('not configured') || lowerMsg.includes('contact support') || lowerMsg.includes('authentication failed')) {
                    errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
                } else if (lowerMsg.includes('rate limit') || lowerMsg.includes('quota') || lowerMsg.includes('429')) {
                    errorMessage = 'AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.';
                } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch')) {
                    errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
                } else if (errorMsg && errorMsg.trim() !== '') {
                    // Backend'den gelen mesajı kullan
                    errorMessage = errorMsg;
                }
                
                alert(errorMessage);
            } finally {
                setLoading(generateBtn, false);
            }
        });
    }
    
    // "Yeniden Yaz" butonu event listener
    function initRewriteButton() {
        const rewriteBtn = document.getElementById('ai-rewrite-btn');
        if (!rewriteBtn) return;
        
        rewriteBtn.addEventListener('click', async function() {
            if (!window.apiClient) {
                alert('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
                window.location.href = 'giris.html';
                return;
            }
            
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('AI özelliğini kullanmak için giriş yapmanız gerekiyor.');
                window.location.href = 'giris.html';
                return;
            }
            
            const textarea = document.getElementById('summary-textarea');
            const currentText = textarea ? textarea.value.trim() : '';
            
            if (!currentText || currentText.length < 10) {
                alert('Yeniden yazmak için önce bir ön yazı oluşturun veya mevcut ön yazınızı düzenleyin.');
                return;
            }
            
            setLoading(rewriteBtn, true);
            
            try {
                const personalInfo = getPersonalInfo();
                
                const response = await window.apiClient.generateSummary(personalInfo);
                
                if (response.success && response.data && response.data.summary) {
                    setSummaryText(response.data.summary);
                } else {
                    throw new Error('Ön yazı yeniden yazılamadı.');
                }
            } catch (error) {
                console.error('AI ön yazı yeniden yazma hatası:', error);
                
                let errorMessage = 'Ön yazı yeniden yazılırken bir hata oluştu.';
                const errorMsg = error.message || error.toString() || '';
                
                if (errorMsg.toLowerCase().includes('credits') || errorMsg.toLowerCase().includes('kredi')) {
                    errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
                } else if (errorMsg.toLowerCase().includes('authenticated') || errorMsg.toLowerCase().includes('giriş') || errorMsg.toLowerCase().includes('login')) {
                    errorMessage = 'AI özelliğini kullanmak için giriş yapmanız gerekiyor.';
                    setTimeout(() => {
                        window.location.href = 'giris.html';
                    }, 2000);
                } else if (errorMsg.toLowerCase().includes('not configured') || errorMsg.toLowerCase().includes('contact support')) {
                    errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
                } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
                    errorMessage = 'AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.';
                } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
                    errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
                } else if (errorMsg) {
                    errorMessage = errorMsg;
                }
                
                alert(errorMessage);
            } finally {
                setLoading(rewriteBtn, false);
            }
        });
    }
    
    // Öneri kartı oluştur
    function createSuggestionCard(suggestionText, index) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-primary cursor-pointer transition-all group';
        
        const text = document.createElement('p');
        text.className = 'text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3';
        text.textContent = `"${suggestionText}"`;
        
        const button = document.createElement('button');
        button.className = 'flex items-center text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity';
        button.innerHTML = '<span class="material-symbols-outlined text-[16px] mr-1">add_circle</span>Bu ön yazıyı kullan';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            setSummaryText(suggestionText);
        });
        
        card.appendChild(text);
        card.appendChild(button);
        
        return card;
    }
    
    // Önerileri yükle ve göster
    async function loadSuggestions() {
        const container = document.getElementById('suggestions-container');
        if (!container) {
            console.warn('Suggestions container not found');
            return;
        }
        
        if (!window.apiClient) {
            console.warn('API client not available');
            container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Önerileri görmek için giriş yapın.</p>';
            return;
        }
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token found');
            container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Önerileri görmek için giriş yapın.</p>';
            return;
        }
        
        // Loading state
        container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Öneriler yükleniyor...</p>';
        
        try {
            const personalInfo = getPersonalInfo();
            
            const response = await window.apiClient.generateSummarySuggestions(personalInfo);
            
            if (response.success && response.data && response.data.suggestions && Array.isArray(response.data.suggestions)) {
                container.innerHTML = '';
                
                response.data.suggestions.forEach((suggestion, index) => {
                    if (suggestion && suggestion.trim()) {
                        const card = createSuggestionCard(suggestion, index);
                        container.appendChild(card);
                    }
                });
                
                if (container.children.length === 0) {
                    container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Öneri bulunamadı.</p>';
                }
            } else {
                throw new Error('Öneriler alınamadı.');
            }
        } catch (error) {
            console.error('❌ AI öneriler yükleme hatası:', error);
            
            let errorMessage = 'Öneriler yüklenirken bir hata oluştu.';
            
            // Backend'den gelen hata mesajını parse et
            let errorMsg = '';
            if (error && typeof error === 'object') {
                // API client hatası
                if (error.message) {
                    errorMsg = error.message;
                }
                // Response hatası
                if (error.response && error.response.data) {
                    const responseData = error.response.data;
                    if (responseData.error && responseData.error.message) {
                        errorMsg = responseData.error.message;
                    } else if (responseData.message) {
                        errorMsg = responseData.message;
                    }
                }
            } else if (typeof error === 'string') {
                errorMsg = error;
            } else {
                errorMsg = error?.toString() || '';
            }
            
            console.error('Error message extracted:', errorMsg);
            
            // Hata mesajına göre kullanıcı dostu mesaj oluştur
            const lowerMsg = errorMsg.toLowerCase();
            if (lowerMsg.includes('credits') || lowerMsg.includes('kredi') || lowerMsg.includes('insufficient')) {
                errorMessage = 'AI krediniz yetersiz. Lütfen planınızı yükseltin.';
            } else if (lowerMsg.includes('authenticated') || lowerMsg.includes('giriş') || lowerMsg.includes('login') || lowerMsg.includes('401')) {
                errorMessage = 'Önerileri görmek için giriş yapmanız gerekiyor.';
            } else if (lowerMsg.includes('not configured') || lowerMsg.includes('contact support') || lowerMsg.includes('authentication failed')) {
                errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
            } else if (lowerMsg.includes('rate limit') || lowerMsg.includes('quota') || lowerMsg.includes('429')) {
                errorMessage = 'AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.';
            } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch')) {
                errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
            } else if (errorMsg && errorMsg.trim() !== '') {
                // Backend'den gelen mesajı kullan
                errorMessage = errorMsg;
            }
            
            container.innerHTML = `<p class="text-sm text-red-500 dark:text-red-400 text-center py-4">${errorMessage}</p>`;
        }
    }
    
    // Sayfa yüklendiğinde başlat
    function init() {
        // Butonları başlat
        initGenerateButton();
        initRewriteButton();
        
        // Önerileri yükle (biraz gecikme ile, diğer scriptlerin yüklenmesini bekle)
        // API client'ın yüklenmesini bekle
        const checkApiClient = setInterval(() => {
            if (window.apiClient) {
                clearInterval(checkApiClient);
                setTimeout(() => {
                    loadSuggestions();
                }, 500);
            }
        }, 100);
        
        // 5 saniye sonra timeout
        setTimeout(() => {
            clearInterval(checkApiClient);
        }, 5000);
    }
    
    // DOM hazır olduğunda başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

