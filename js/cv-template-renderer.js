// CV Şablon Render Motoru
// Her şablon için HTML/CSS render fonksiyonları
(function() {
    'use strict';
    
    // Şablon verilerini localStorage'dan oku
    function getCVData() {
        try {
            const data = localStorage.getItem('cv-builder-data');
            const parsed = data ? JSON.parse(data) : {};
            console.log('🔍 getCVData: localStorage\'dan veri okundu', {
                phone: parsed.phone,
                profession: parsed.profession,
                location: parsed.location,
                email: parsed.email,
                'fullname-first': parsed['fullname-first'],
                'fullname-last': parsed['fullname-last']
            });
            return parsed;
        } catch (e) {
            console.error('❌ getCVData: Parse hatası', e);
            return {};
        }
    }
    
    // 🔒 KRİTİK: DEFAULT OLARAK ÖRNEK VERİLER YOK
    // Kullanıcı verisi yoksa BOŞ gösterilecek - Örnek veriler SADECE görsel placeholder olarak
    // Bu veriler ASLA form alanlarına doldurulmamalı, ASLA localStorage'a kaydedilmemeli
    // ASLA AI parsing'e gönderilmemeli
    const exampleData = {
        isSampleData: true, // 🔒 BU FLAG ÖNEMLİ: Örnek veri olduğunu belirtir
        isPreviewOnly: true, // Alternatif flag - SADECE görsel önizleme için
        'fullname-first': 'İsim',
        'fullname-last': 'Soyisim',
        profession: 'Profesyonel Ünvan',
        email: 'ornek@email.com',
        phone: '+90 5XX XXX XXXX',
        location: 'İl, İlçe, Türkiye',
        summary: 'Profesyonel deneyimlerinizi, yeteneklerinizi ve kariyer hedeflerinizi buraya yazın. Bu alan CV\'nizin özeti olarak işveren tarafından ilk okunan kısımdır.',
        experiences: [], // 🔒 DEFAULT OLARAK BOŞ
        education: [], // 🔒 DEFAULT OLARAK BOŞ
        skills: [], // 🔒 DEFAULT OLARAK BOŞ
        languages: [] // 🔒 DEFAULT OLARAK BOŞ
    };
    
    // 🔒 KRİTİK: TAMAMEN YENİDEN YAZILDI - SADECE localStorage'dan veri yükle, HİÇBİR örnek veri döndürme
    // SINGLE SOURCE OF TRUTH: Reads from both cv-builder-data and separate localStorage keys
    function getDataWithExamples() {
        // 🔒 KRİTİK: localStorage'dan TÜM verileri yükle - DOĞRUDAN OKU
        let userData = {};
        try {
            const rawData = localStorage.getItem('cv-builder-data');
            if (rawData) {
                userData = JSON.parse(rawData);
            }
        } catch (e) {
            console.error('❌ getDataWithExamples: localStorage parse hatası', e);
            userData = {};
        }
        
        console.log('🔍 getDataWithExamples: localStorage\'dan veri okundu', {
            phone: userData.phone,
            profession: userData.profession,
            location: userData.location,
            email: userData.email,
            'fullname-first': userData['fullname-first'],
            'fullname-last': userData['fullname-last'],
            isSampleData: userData.isSampleData,
            isPreviewOnly: userData.isPreviewOnly
        });
        
        const result = {};
        
        // 🔒 KRİTİK: Her zaman localStorage'dan array verilerini yükle
        let experiences = [];
        let education = [];
        let skills = [];
        let languages = [];
        
        try {
            experiences = JSON.parse(localStorage.getItem('cv-experiences') || '[]');
        } catch (e) {
            experiences = [];
        }
        
        try {
            education = JSON.parse(localStorage.getItem('cv-education') || '[]');
        } catch (e) {
            education = [];
        }
        
        try {
            skills = JSON.parse(localStorage.getItem('cv-skills') || '[]');
        } catch (e) {
            skills = [];
        }
        
        try {
            languages = JSON.parse(localStorage.getItem('cv-languages') || '[]');
        } catch (e) {
            languages = [];
        }
        
        // 🔒 KRİTİK: SADECE localStorage'dan gelen verileri kullan, HİÇBİR örnek veri yok
        // String alanlar - EĞER VERİ VARSA KULLAN, YOKSA BOŞ STRING
        // 🔒 KRİTİK: null, undefined veya boş string kontrolü yap
        result['fullname-first'] = (userData['fullname-first'] !== null && userData['fullname-first'] !== undefined) ? userData['fullname-first'] : '';
        result['fullname-last'] = (userData['fullname-last'] !== null && userData['fullname-last'] !== undefined) ? userData['fullname-last'] : '';
        result.email = (userData.email !== null && userData.email !== undefined) ? userData.email : '';
        result.phone = (userData.phone !== null && userData.phone !== undefined) ? userData.phone : '';
        result.location = (userData.location !== null && userData.location !== undefined) ? userData.location : '';
        result.profession = (userData.profession !== null && userData.profession !== undefined) ? userData.profession : '';
        result.website = (userData.website !== null && userData.website !== undefined) ? userData.website : '';
        result.summary = (userData.summary !== null && userData.summary !== undefined) ? userData.summary : '';
        
        // 🔒 KRİTİK: Debug - profession değerini özellikle kontrol et
        if (userData.profession) {
            console.log('✅ getDataWithExamples: profession değeri bulundu:', userData.profession);
        } else {
            console.warn('⚠️ getDataWithExamples: profession değeri YOK veya boş:', userData.profession);
        }
        
        console.log('✅ getDataWithExamples: String alanlar hazırlandı', {
            phone: result.phone,
            profession: result.profession,
            location: result.location,
            email: result.email,
            'fullname-first': result['fullname-first'],
            'fullname-last': result['fullname-last']
        });
        
        // Array alanlar - SADECE localStorage'dan
        result.experiences = experiences;
        result.education = education;
        result.skills = skills;
        result.languages = languages;
        
        // 🔒 KRİTİK: Flag'leri koru
        result.isSampleData = userData.isSampleData || false;
        result.isPreviewOnly = userData.isPreviewOnly || false;
        result.isFromPDFUpload = userData.isFromPDFUpload || false;
        
        console.log('✅ getDataWithExamples: Final result', {
            phone: result.phone,
            profession: result.profession,
            location: result.location,
            email: result.email,
            'fullname-first': result['fullname-first'],
            'fullname-last': result['fullname-last'],
            experiencesCount: result.experiences.length,
            educationCount: result.education.length
        });
        
        return result;
    }
    
    // Deneyimleri render et
    function renderExperiences(experiences) {
        if (!experiences || experiences.length === 0) return '';
        
        return experiences.map(exp => {
            const dateStr = formatExperienceDate(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.isCurrent);
            const descriptionLines = exp.description ? exp.description.split('\n').filter(l => l.trim()) : [];
            
            return `
                <div class="mb-4">
                    <div class="flex justify-between items-baseline mb-1">
                        <h3 class="text-sm font-bold text-slate-900">${exp.jobTitle || 'İş Unvanı'}</h3>
                        <span class="text-xs text-slate-500 font-medium">${dateStr}</span>
                    </div>
                    <p class="text-xs text-slate-700 italic mb-2">${exp.company || 'Şirket Adı'}</p>
                    ${descriptionLines.length > 0 ? `
                        <ul class="list-disc list-inside text-xs text-slate-600 leading-relaxed space-y-1">
                            ${descriptionLines.map(line => `<li>${line.trim()}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    // Deneyimleri preview şablonu için render et (özel format)
    function renderExperiencesForPreview(experiences) {
        if (!experiences || experiences.length === 0) return '';
        
        return experiences.map(exp => {
            const dateStr = formatExperienceDateForPreview(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.isCurrent);
            const descriptionLines = exp.description ? exp.description.split('\n').filter(l => l.trim()) : [];
            
            return `
                <div class="group">
                    <div class="flex justify-between items-baseline mb-1">
                        <h3 class="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">${exp.jobTitle || 'İş Unvanı'}</h3>
                        <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">${dateStr}</span>
                    </div>
                    <p class="text-xs font-bold text-primary mb-3">${exp.company || 'Şirket Adı'}</p>
                    ${descriptionLines.length > 0 ? `
                        <ul class="list-disc list-outside ml-4 text-xs text-slate-600 leading-relaxed space-y-1.5 marker:text-slate-400">
                            ${descriptionLines.map(line => `<li>${line.trim()}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    // Preview şablonu için tarih formatı
    function formatExperienceDateForPreview(startMonth, startYear, endMonth, endYear, isCurrent) {
        let start = '';
        if (startYear) {
            start = startYear.toString();
        }
        
        let end = '';
        if (isCurrent) {
            end = 'Günümüz';
        } else if (endYear) {
            end = endYear.toString();
        }
        
        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        }
        return '';
    }
    
    // Tarih formatını düzenle
    function formatExperienceDate(startMonth, startYear, endMonth, endYear, isCurrent) {
        let start = '';
        if (startMonth && startYear) {
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const monthIndex = parseInt(startMonth) - 1;
            start = monthIndex >= 0 && monthIndex < 12 ? `${monthNames[monthIndex]} ${startYear}` : `${startYear}`;
        } else if (startYear) {
            start = startYear.toString();
        }
        
        let end = '';
        if (isCurrent) {
            end = 'Günümüz';
        } else if (endMonth && endYear) {
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const monthIndex = parseInt(endMonth) - 1;
            end = monthIndex >= 0 && monthIndex < 12 ? `${monthNames[monthIndex]} ${endYear}` : `${endYear}`;
        } else if (endYear) {
            end = endYear.toString();
        }
        
        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        }
        return '';
    }
    
    // Eğitimleri render et
    function renderEducation(education) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!education || education.length === 0) {
            return '';
        }
        
        return education.map(edu => {
            // Format date
            let dateStr = '';
            if (edu.startMonth && edu.startYear) {
                dateStr = `${edu.startMonth} ${edu.startYear}`;
            } else if (edu.startYear) {
                dateStr = edu.startYear.toString();
            }
            
            if (edu.isCurrent) {
                dateStr += dateStr ? ' - Günümüz' : 'Günümüz';
            } else if (edu.endMonth && edu.endYear) {
                dateStr += ` - ${edu.endMonth} ${edu.endYear}`;
            } else if (edu.endYear) {
                dateStr += ` - ${edu.endYear}`;
            }
            
            return `
            <div class="mb-3">
                <h3 class="text-sm font-bold text-slate-900">${edu.degree || edu.department || 'Bölüm'}</h3>
                <p class="text-xs text-slate-700">${edu.school || 'Okul Adı'}</p>
                ${dateStr ? `<p class="text-xs text-slate-500 mt-1">${dateStr}</p>` : ''}
                ${edu.details || edu.description ? `<p class="text-xs text-slate-600 mt-1">${edu.details || edu.description}</p>` : ''}
            </div>
        `;
        }).join('');
    }
    
    // Eğitimleri preview şablonu için render et (özel format)
    function renderEducationForPreview(education) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!education || education.length === 0) {
            return '';
        }
        
        return education.map(edu => {
            // Format date
            let dateStr = '';
            if (edu.startMonth && edu.startYear) {
                dateStr = `${edu.startMonth} ${edu.startYear}`;
            } else if (edu.startYear) {
                dateStr = edu.startYear.toString();
            }
            
            if (edu.isCurrent) {
                dateStr += dateStr ? ' - Günümüz' : 'Günümüz';
            } else if (edu.endMonth && edu.endYear) {
                dateStr += ` - ${edu.endMonth} ${edu.endYear}`;
            } else if (edu.endYear) {
                dateStr += ` - ${edu.endYear}`;
            }
            
            return `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-base font-bold text-slate-900">${edu.degree || edu.department || 'Bölüm'}</h3>
                    <p class="text-xs font-bold text-slate-500 mt-0.5">${edu.school || 'Okul Adı'}</p>
                    ${edu.details || edu.description ? `<p class="text-xs text-slate-500 italic mt-1">${edu.details || edu.description}</p>` : ''}
                </div>
                ${dateStr ? `<span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">${dateStr}</span>` : ''}
            </div>
        `;
        }).join('');
    }
    
    // Yetenekleri render et
    function renderSkills(skills) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!skills || skills.length === 0) {
            return '';
        }
        
        return skills.map(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill.name || '');
            return `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">${skillName}</span>`;
        }).join('');
    }
    
    // Yetenekleri preview şablonu için render et (özel format)
    function renderSkillsForPreview(skills) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!skills || skills.length === 0) {
            return '';
        }
        
        return skills.map(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill.name || '');
            return `<span class="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-bold">${skillName}</span>`;
        }).join('');
    }
    
    // Dilleri render et
    function renderLanguages(languages) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!languages || languages.length === 0) {
            return '';
        }
        
        return languages.map(lang => {
            const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || 'Dil');
            const langLevel = typeof lang === 'string' ? 'Seviye' : (lang.level || lang.levelLabel || 'Seviye');
            return `
            <div class="mb-2">
                <span class="text-xs text-slate-700 font-medium">${langName}</span>
                <span class="text-xs text-slate-500 ml-2">${langLevel}</span>
            </div>
        `;
        }).join('');
    }
    
    // Dilleri preview şablonu için render et (özel format)
    function renderLanguagesForPreview(languages) {
        // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
        if (!languages || languages.length === 0) {
            return '';
        }
        
        return languages.map((lang, index) => {
            const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || 'Dil');
            const langLevel = typeof lang === 'string' ? 'Seviye' : (lang.level || lang.levelLabel || 'Seviye');
            return `
            <div class="flex justify-between items-center text-xs border-b border-dashed border-slate-200 pb-1 ${index === languages.length - 1 ? '' : ''}">
                <span class="font-bold text-slate-700">${langName}</span>
                <span class="text-slate-500 font-medium">${langLevel}</span>
            </div>
        `;
        }).join('');
    }
    
    // Şablon render fonksiyonları
    const templateRenderers = {
        // Modern Şablon (Varsayılan)
        modern: function(data) {
            // 🔒 KRİTİK: Eğer data parametresi yoksa veya boşsa, getDataWithExamples() çağır
            let cvData;
            if (data && Object.keys(data).length > 0 && (data.phone || data.profession || data['fullname-first'])) {
                cvData = data;
                console.log('🎨 Modern template: data parametresi kullanılıyor', {
                    phone: cvData.phone,
                    profession: cvData.profession
                });
            } else {
                cvData = getDataWithExamples();
                console.log('🎨 Modern template: getDataWithExamples() çağrıldı', {
                    phone: cvData.phone,
                    profession: cvData.profession
                });
            }
            
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            console.log('🎨 Modern template render - Final değerler:', {
                fullName: fullName,
                profession: profession,
                email: email,
                phone: phone,
                location: location,
                summary: summary ? summary.substring(0, 50) + '...' : ''
            });
            
            // Deneyimleri, eğitimleri, yetenekleri ve dilleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div>
                        <h1 data-preview-target="fullname" class="text-3xl font-bold uppercase tracking-wide text-slate-900">${fullName.toUpperCase()}</h1>
                        <p data-preview-target="profession" class="text-lg text-slate-600 font-medium mt-1">${profession}</p>
                        <div class="flex gap-4 mt-3 text-xs text-slate-500">
                            <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span> ${email}</span>
                            <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span> ${phone}</span>
                            <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> ${location}</span>
                        </div>
                    </div>
                    <div class="size-20 bg-slate-200 rounded-full bg-cover bg-center" data-alt="User profile picture on resume" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                </div>
                <div class="flex gap-8 flex-1">
                    <div class="w-2/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 text-slate-800">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-600 text-justify">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 text-slate-800">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 text-slate-800">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 text-slate-800">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 text-slate-800">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Kurumsal Şablon
        kurumsal: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="bg-primary text-white p-6 mb-6 -m-8 md:-m-10 mb-6">
                    <div class="flex justify-between items-start">
                        <div>
                            <h1 data-preview-target="fullname" class="text-3xl font-bold uppercase tracking-wide text-white">${fullName.toUpperCase()}</h1>
                            <p data-preview-target="profession" class="text-lg text-blue-100 font-medium mt-2">${profession}</p>
                        </div>
                        <div class="size-24 bg-white rounded-full bg-cover bg-center border-4 border-white shadow-lg" data-alt="User profile picture on resume" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    </div>
                    <div class="flex gap-6 mt-4 text-sm text-blue-100">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex gap-8 flex-1">
                    <div class="w-2/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-primary">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700 text-justify">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-primary">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-primary">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-primary">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-primary">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Yaratıcı Şablon
        yaratici: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="flex items-center gap-6 mb-6 pb-6 border-b-4 border-orange-400">
                    <div class="size-28 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full bg-cover bg-center border-4 border-white shadow-xl" data-alt="User profile picture on resume" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    <div class="flex-1">
                        <h1 data-preview-target="fullname" class="text-4xl font-black uppercase tracking-tight text-orange-600 mb-2">${fullName.toUpperCase()}</h1>
                        <p data-preview-target="profession" class="text-xl text-yellow-600 font-bold mb-3">${profession}</p>
                        <div class="flex gap-4 text-xs text-slate-600">
                            <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span> ${email}</span>
                            <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span> ${phone}</span>
                            <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> ${location}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-8 flex-1">
                    <div class="w-2/3 flex flex-col gap-6">
                        <section class="bg-orange-50 p-4 rounded-lg">
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-orange-400 pb-2 mb-3 text-orange-600">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700 text-justify">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-yellow-400 pb-2 mb-3 text-yellow-600">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-6">
                        <section class="bg-yellow-50 p-4 rounded-lg">
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-yellow-400 pb-2 mb-3 text-yellow-600">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-orange-400 pb-2 mb-3 text-orange-600">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-orange-400 pb-2 mb-3 text-orange-600">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Minimal Şablon
        minimal: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="text-center mb-8 pb-6 border-b border-slate-300">
                    <h1 data-preview-target="fullname" class="text-4xl font-light tracking-wider text-slate-900 mb-2">${fullName.toUpperCase()}</h1>
                    <p data-preview-target="profession" class="text-base text-slate-500 font-light mb-4">${profession}</p>
                    <div class="flex justify-center gap-6 text-xs text-slate-400">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-8">
                    <section>
                        <h2 class="text-xs font-light uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-500">Ön Yazı</h2>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-600 text-center">${summary}</p>
                    </section>
                    <section>
                        <h2 class="text-xs font-light uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-500">Deneyim</h2>
                        <div id="experience-preview-container">${experiencesHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-light uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-500">Eğitim</h2>
                        <div id="education-preview-container">${educationHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-light uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-500">Yetenekler</h2>
                        <div id="skills-preview-container" class="flex flex-wrap gap-1.5 justify-center">${skillsHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-light uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-500">Diller</h2>
                        <div id="languages-preview-container">${languagesHtml}</div>
                    </section>
                </div>
            `;
        },
        
        // Akademik Şablon
        akademik: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="border-b-4 border-slate-900 pb-4 mb-6">
                    <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-1">${fullName}</h1>
                    <p data-preview-target="profession" class="text-base text-slate-600 font-semibold mb-3">${profession}</p>
                    <div class="flex gap-6 text-xs text-slate-500">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-6">
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 text-slate-900">Ön Yazı</h2>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700">${summary}</p>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 text-slate-900">Deneyim</h2>
                        <div id="experience-preview-container">${experiencesHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 text-slate-900">Eğitim</h2>
                        <div id="education-preview-container">${educationHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 text-slate-900">Yetenekler</h2>
                        <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 text-slate-900">Diller</h2>
                        <div id="languages-preview-container">${languagesHtml}</div>
                    </section>
                </div>
            `;
        },
        
        // Executive Şablon
        executive: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="bg-slate-900 text-white p-6 -m-8 md:-m-10 mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 data-preview-target="fullname" class="text-4xl font-black uppercase tracking-tight text-white mb-2">${fullName.toUpperCase()}</h1>
                            <p data-preview-target="profession" class="text-xl text-slate-300 font-bold">${profession}</p>
                        </div>
                        <div class="size-24 bg-white rounded-full bg-cover bg-center border-4 border-slate-700" data-alt="User profile picture on resume" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    </div>
                    <div class="flex gap-6 mt-4 text-sm text-slate-300">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex gap-8 flex-1">
                    <div class="w-2/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-black uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-3 text-slate-900">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700 font-medium">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-black uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-3 text-slate-900">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-black uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-3 text-slate-900">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-black uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-3 text-slate-900">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-black uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-3 text-slate-900">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Basit Şablon
        basit: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // Deneyimleri render et
            const experiencesHtml = renderExperiences(cvData.experiences || []);
            const educationHtml = renderEducation(cvData.education || []);
            const skillsHtml = renderSkills(cvData.skills || []);
            const languagesHtml = renderLanguages(cvData.languages || []);
            
            return `
                <div class="mb-6 pb-4 border-b border-slate-300">
                    <h1 data-preview-target="fullname" class="text-2xl font-semibold text-slate-900 mb-1">${fullName}</h1>
                    <p data-preview-target="profession" class="text-base text-slate-600 mb-2">${profession}</p>
                    <div class="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-5">
                    <section>
                        <h2 class="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 pb-1 mb-2 text-slate-700">Ön Yazı</h2>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-600">${summary}</p>
                    </section>
                    <section>
                        <h2 class="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 pb-1 mb-2 text-slate-700">Deneyim</h2>
                        <div id="experience-preview-container">${experiencesHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 pb-1 mb-2 text-slate-700">Eğitim</h2>
                        <div id="education-preview-container">${educationHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 pb-1 mb-2 text-slate-700">Yetenekler</h2>
                        <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 pb-1 mb-2 text-slate-700">Diller</h2>
                        <div id="languages-preview-container">${languagesHtml}</div>
                    </section>
                </div>
            `;
        },
        
        // Global Tech Şablon
        global: function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="flex items-start gap-6 mb-6 pb-6 border-b-2 border-slate-400">
                    <div class="size-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg bg-cover bg-center border-2 border-slate-300 shadow-md" data-alt="User profile picture on resume" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    <div class="flex-1">
                        <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-1">${fullName}</h1>
                        <p data-preview-target="profession" class="text-lg text-blue-600 font-semibold mb-3">${profession}</p>
                        <div class="flex gap-4 text-xs text-slate-600">
                            <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span> ${email}</span>
                            <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span> ${phone}</span>
                            <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> ${location}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-8 flex-1">
                    <div class="w-2/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-l-4 border-blue-600 pl-2 mb-3 text-blue-600">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-l-4 border-blue-600 pl-2 mb-3 text-blue-600">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-6">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-l-4 border-indigo-600 pl-2 mb-3 text-indigo-600">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-l-4 border-indigo-600 pl-2 mb-3 text-indigo-600">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider border-l-4 border-indigo-600 pl-2 mb-3 text-indigo-600">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Global Tech Şablonu - Modern teknoloji odaklı tasarım
        'global-tech': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="border-l-4 border-indigo-600 pl-4 mb-6">
                    <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-1">${fullName}</h1>
                    <p data-preview-target="profession" class="text-lg text-indigo-600 font-semibold mb-3">${profession}</p>
                    <div class="flex flex-wrap gap-3 text-xs text-slate-600">
                        <span data-preview-target="email" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span> ${email}</span>
                        <span data-preview-target="phone" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span> ${phone}</span>
                        <span data-preview-target="location" class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> ${location}</span>
                    </div>
                </div>
                <div class="flex gap-6 flex-1">
                    <div class="w-2/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-indigo-600 border-b-2 border-indigo-600 pb-1 mb-3">Ön Yazı</h2>
                            <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700">${summary}</p>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-indigo-600 border-b-2 border-indigo-600 pb-1 mb-3">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-300 pb-1 mb-3">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-300 pb-1 mb-3">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-300 pb-1 mb-3">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Evrensel Uyum Şablonu - ATS dostu, uluslararası standart
        'evrensel-uyum': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="border-b-2 border-slate-300 pb-4 mb-6">
                    <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-2">${fullName}</h1>
                    <p data-preview-target="profession" class="text-base text-slate-700 font-medium mb-3">${profession}</p>
                    <div class="flex flex-wrap gap-4 text-xs text-slate-600">
                        <span data-preview-target="email">${email}</span>
                        <span class="text-slate-300">|</span>
                        <span data-preview-target="phone">${phone}</span>
                        <span class="text-slate-300">|</span>
                        <span data-preview-target="location">${location}</span>
                    </div>
                </div>
                <div class="space-y-6">
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Ön Yazı</h2>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700">${summary}</p>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Deneyim</h2>
                        <div id="experience-preview-container">${experiencesHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Eğitim</h2>
                        <div id="education-preview-container">${educationHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Yetenekler</h2>
                        <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Diller</h2>
                        <div id="languages-preview-container">${languagesHtml}</div>
                    </section>
                </div>
            `;
        },
        
        // Overleaf Referans Şablonları
        
        // Overleaf Academic - Tek sütun, temiz ve minimalist (SUNIL KUMAR JAIN referansı)
        'overleaf-academic': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="text-center mb-6 pb-4 border-b-2 border-slate-800">
                    <h1 data-preview-target="fullname" class="text-3xl font-bold uppercase tracking-wide text-slate-900 mb-2">${fullName.toUpperCase()}</h1>
                    <div class="flex justify-center gap-4 text-xs text-slate-600">
                        <span data-preview-target="phone">${phone}</span>
                        <span class="text-slate-300">|</span>
                        <span data-preview-target="email">${email}</span>
                    </div>
                </div>
                <div class="space-y-6">
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Eğitim</h2>
                        <div id="education-preview-container">${educationHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Kariyer Hedefi</h2>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-700">${summary}</p>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Projeler</h2>
                        <div id="experience-preview-container">${experiencesHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Teknik Yetenekler</h2>
                        <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                    </section>
                    <section>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Diller</h2>
                        <div id="languages-preview-container">${languagesHtml}</div>
                    </section>
                </div>
            `;
        },
        
        // Overleaf Professional - İki sütun, koyu gri header (DR. NICO KRIEGER referansı)
        'overleaf-professional': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="bg-slate-800 text-white p-6 mb-6" style="margin-left: -2rem; margin-right: -2rem; margin-top: -2rem;">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h1 data-preview-target="fullname" class="text-3xl font-bold text-white mb-2">${fullName.toUpperCase()}</h1>
                            <p data-preview-target="profession" class="text-sm text-slate-300 leading-relaxed">${profession}</p>
                        </div>
                        <div class="size-20 bg-white rounded-full bg-cover bg-center border-2 border-white ml-4" data-alt="User profile picture" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="w-1/3 bg-slate-100 p-4" style="margin-left: -2rem; margin-right: 0;">
                        <section class="mb-5">
                            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 mb-3">İletişim</h2>
                            <div class="space-y-2 text-xs text-slate-700">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[14px]">mail</span>
                                    <span data-preview-target="email">${email}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[14px]">call</span>
                                    <span data-preview-target="phone">${phone}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[14px]">location_on</span>
                                    <span data-preview-target="location">${location}</span>
                                </div>
                            </div>
                        </section>
                        <section class="mb-5">
                            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 mb-3">Yetenekler</h2>
                            <div id="skills-preview-container" class="space-y-2 text-xs text-slate-700">
                                ${skillsHtml}
                            </div>
                        </section>
                        <section class="mb-5">
                            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 mb-3">Diller</h2>
                            <div id="languages-preview-container" class="text-xs text-slate-700">${languagesHtml}</div>
                        </section>
                    </div>
                    <div class="w-2/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 mb-3">İş Deneyimi</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 mb-3">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Overleaf Modern - İki sütun, yeşil vurgular (CESAR LAURA referansı)
        'overleaf-modern': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="mb-6 pb-4 border-b-2 border-emerald-600">
                    <div class="flex justify-between items-start">
                        <div>
                            <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-1">${fullName.toUpperCase()}</h1>
                            <p data-preview-target="profession" class="text-base text-slate-700 font-medium mb-2">${profession}</p>
                            <div class="flex flex-wrap gap-3 text-xs text-slate-600">
                                <span data-preview-target="email">${email}</span>
                                <span data-preview-target="phone">${phone}</span>
                                <span data-preview-target="location">${location}</span>
                            </div>
                        </div>
                        <div class="size-20 bg-slate-200 rounded-full bg-cover bg-center border-2 border-emerald-600" data-alt="User profile picture" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="w-2/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-600 border-b-2 border-emerald-600 pb-1 mb-3">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-600 border-b-2 border-emerald-600 pb-1 mb-3">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-600 border-b-2 border-emerald-600 pb-1 mb-3">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-600 border-b-2 border-emerald-600 pb-1 mb-3">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Overleaf Business - İki sütun, sol deneyim/eğitim, sağ yetenekler (JAYDEV VARMA referansı)
        'overleaf-business': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : [];
            const experiencesHtml = renderExperiences(experiences);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : [];
            const educationHtml = renderEducation(education);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : [];
            const skillsHtml = renderSkills(skills);
            // 🔒 DEFAULT OLARAK BOŞ ARRAY - Örnek veriler YOK
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : [];
            const languagesHtml = renderLanguages(languages);
            
            return `
                <div class="mb-6 pb-4 border-b-2 border-slate-300">
                    <h1 data-preview-target="fullname" class="text-3xl font-bold text-slate-900 mb-1">${fullName.toUpperCase()}</h1>
                    <p data-preview-target="profession" class="text-base text-slate-700 font-medium mb-2">${profession}</p>
                    <div class="flex flex-wrap gap-3 text-xs text-slate-600">
                        <span data-preview-target="email">${email}</span>
                        <span data-preview-target="phone">${phone}</span>
                        <span data-preview-target="location">${location}</span>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="w-2/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Deneyim</h2>
                            <div id="experience-preview-container">${experiencesHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Eğitim</h2>
                            <div id="education-preview-container">${educationHtml}</div>
                        </section>
                    </div>
                    <div class="w-1/3 flex flex-col gap-5">
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Yetenekler</h2>
                            <div id="skills-preview-container" class="flex flex-wrap gap-1.5">${skillsHtml}</div>
                        </section>
                        <section>
                            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">Diller</h2>
                            <div id="languages-preview-container">${languagesHtml}</div>
                        </section>
                    </div>
                </div>
            `;
        },
        
        // Yeni şablonlar - ek şablonlar için render fonksiyonları
        tech: function(data) {
            // Tech Minimal şablonu - Modern şablonun varyasyonu
            const cvData = data || getCVData();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            
            return templateRenderers.modern(data);
        },
        classic: function(data) {
            // Klasik Pro şablonu - Kurumsal şablonun varyasyonu
            return templateRenderers.kurumsal(data);
        },
        colorful: function(data) {
            // Renkli Express şablonu - Yaratıcı şablonun varyasyonu
            return templateRenderers.yaratici(data);
        },
        elegant: function(data) {
            // Zarif şablonu - Minimal şablonun varyasyonu
            return templateRenderers.minimal(data);
        },
        research: function(data) {
            // Araştırma şablonu - Akademik şablonun varyasyonu
            return templateRenderers.akademik(data);
        },
        leadership: function(data) {
            // Liderlik şablonu - Executive şablonun varyasyonu
            return templateRenderers.executive(data);
        },
        starter: function(data) {
            // Başlangıç şablonu - Basit şablonun varyasyonu
            return templateRenderers.basit(data);
        },
        international: function(data) {
            // Uluslararası şablonu - Global şablonun varyasyonu
            return templateRenderers.global(data);
        },
        // Yeni şablonlar için alias'lar (tum-sablonlar.html için)
        'minimalist-zarafet': function(data) {
            return templateRenderers.basit(data);
        },
        'dinamik-portfoy': function(data) {
            return templateRenderers.yaratici(data);
        },
        'kurumsal-lider': function(data) {
            return templateRenderers.kurumsal(data);
        },
        'dijital-uzman': function(data) {
            return templateRenderers.executive(data);
        },
        'akademik-netlik': function(data) {
            return templateRenderers.akademik(data);
        },
        'girisimci-vizyon': function(data) {
            return templateRenderers.yaratici(data);
        },
        // 'evrensel-uyum' artık yukarıda özel render fonksiyonu olarak tanımlı (satır 714)
        'sanatsal-cizgiler': function(data) {
            return templateRenderers.yaratici(data);
        },
        'yaratici-flow': function(data) {
            return templateRenderers.yaratici(data);
        },
        'minimal-green': function(data) {
            return templateRenderers.minimal(data);
        },
        'akademik-pro': function(data) {
            return templateRenderers.akademik(data);
        },
        'executive-bold': function(data) {
            return templateRenderers.executive(data);
        },
        'basit-start': function(data) {
            return templateRenderers.basit(data);
        },
        // 'global-tech' artık yukarıda özel render fonksiyonu olarak tanımlı (satır 649)
        'dijital-yaratici': function(data) {
            return templateRenderers.yaratici(data);
        },
        'muhendis-pro': function(data) {
            return templateRenderers.executive(data);
        },
        
        // Önizleme Şablonu (Kullanıcının verdiği tasarım)
        'preview': function(data) {
            const cvData = data || getDataWithExamples();
            // 🔒 DEFAULT OLARAK BOŞ - Sadece kullanıcı verisi varsa göster
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || '';
            // 🔒 DEFAULT OLARAK BOŞ - Örnek veriler YOK
            const profession = cvData.profession || '';
            const email = cvData.email || '';
            const phone = cvData.phone || '';
            const location = cvData.location || '';
            const summary = cvData.summary || '';
            const website = cvData.website || cvData.linkedin || '';
            
            // Deneyimleri preview formatında render et
            const experiencesHtml = renderExperiencesForPreview(cvData.experiences || []);
            const educationHtml = renderEducationForPreview(cvData.education || []);
            const skillsHtml = renderSkillsForPreview(cvData.skills || []);
            const languagesHtml = renderLanguagesForPreview(cvData.languages || []);
            
            return `
                <div class="w-[34%] bg-[#f1f5f9] p-8 flex flex-col gap-8 border-r border-slate-200">
                    <div class="flex flex-col items-center text-center pb-6 border-b border-slate-200/60">
                        <div class="size-36 rounded-full border-[6px] border-white shadow-lg bg-cover bg-center mb-5" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU7xB2_IQ8lbwX4zQn0V1IBfpEjSbRbfgLmRmAb04iORv7SQwfwzm1LJ35PRHPBwJM1FxxJENRLD74DfZ2Ypjp8sNjcZiD-hNPnLgf1SYUJ_ByXOISWXPWEczZwXHXiCCBWiUj5CcyCPYwg_LtonY689RqXRAZPIvG8tCQsxHIMrENdBh-H7L7zOaO5MC9U5Dw8RLhLc_mEiFIjcqD13FGctHAV_Qi7q7kanQpN4XkjB5qg4avShtLeYK6ZRNwtSaN8mEk3x5sM5Vf");'></div>
                        <h1 data-preview-target="fullname" class="text-2xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">${fullName}</h1>
                        <p data-preview-target="profession" class="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide">${profession}</p>
                    </div>
                    <div class="flex flex-col gap-4">
                        <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                            <span class="material-symbols-outlined text-[16px]">contacts</span>
                            İletişim
                        </h3>
                        <ul class="flex flex-col gap-3.5 text-xs font-medium text-slate-600">
                            <li class="flex items-start gap-3">
                                <span class="size-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 text-primary">
                                    <span class="material-symbols-outlined text-[14px]">call</span>
                                </span>
                                <span data-preview-target="phone" class="pt-1">${phone}</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="size-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 text-primary">
                                    <span class="material-symbols-outlined text-[14px]">mail</span>
                                </span>
                                <span data-preview-target="email" class="pt-1 break-all">${email}</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="size-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 text-primary">
                                    <span class="material-symbols-outlined text-[14px]">location_on</span>
                                </span>
                                <span data-preview-target="location" class="pt-1">${location}</span>
                            </li>
                            ${website ? `
                            <li class="flex items-start gap-3">
                                <span class="size-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 text-primary">
                                    <span class="material-symbols-outlined text-[14px]">link</span>
                                </span>
                                <span class="pt-1 break-all">${website}</span>
                            </li>
                            ` : ''}
                        </ul>
                    </div>
                    <div class="flex flex-col gap-4">
                        <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                            <span class="material-symbols-outlined text-[16px]">person</span>
                            Hakkımda
                        </h3>
                        <p data-preview-target="summary" class="text-xs leading-relaxed text-slate-600 text-justify font-medium">
                            ${summary}
                        </p>
                    </div>
                    <div class="mt-auto pt-6 border-t border-slate-200/60 flex justify-center gap-4 opacity-60">
                        <span class="material-symbols-outlined text-slate-400">code</span>
                        <span class="material-symbols-outlined text-slate-400">terminal</span>
                        <span class="material-symbols-outlined text-slate-400">cloud</span>
                    </div>
                </div>
                <div class="w-[66%] bg-white p-10 flex flex-col gap-10">
                    <section>
                        <div class="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-3">
                            <span class="size-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
                                <span class="material-symbols-outlined text-[20px]">work_history</span>
                            </span>
                            <h2 class="text-xl font-bold text-slate-900 uppercase tracking-tight">Deneyim</h2>
                        </div>
                        <div id="experience-preview-container" class="flex flex-col gap-6">
                            ${experiencesHtml}
                        </div>
                    </section>
                    <section>
                        <div class="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-3">
                            <span class="size-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
                                <span class="material-symbols-outlined text-[20px]">school</span>
                            </span>
                            <h2 class="text-xl font-bold text-slate-900 uppercase tracking-tight">Eğitim</h2>
                        </div>
                        <div id="education-preview-container" class="flex flex-col gap-4">
                            ${educationHtml}
                        </div>
                    </section>
                    <div class="grid grid-cols-2 gap-8">
                        <section>
                            <div class="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                                <span class="material-symbols-outlined text-[20px] text-slate-900">psychology</span>
                                <h2 class="text-lg font-bold text-slate-900 uppercase tracking-tight">Yetenekler</h2>
                            </div>
                            <div id="skills-preview-container" class="flex flex-wrap gap-2">
                                ${skillsHtml}
                            </div>
                        </section>
                        <section>
                            <div class="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                                <span class="material-symbols-outlined text-[20px] text-slate-900">translate</span>
                                <h2 class="text-lg font-bold text-slate-900 uppercase tracking-tight">Diller</h2>
                            </div>
                            <div id="languages-preview-container" class="flex flex-col gap-2">
                                ${languagesHtml}
                            </div>
                        </section>
                    </div>
                </div>
            `;
        }
    };
    
    // Şablonu render et
    function renderTemplate(templateName, data) {
        const renderer = templateRenderers[templateName] || templateRenderers.modern;
        return renderer(data);
    }
    
    // Şablonu değiştir
    function changeTemplate(templateName) {
        const previewContainer = document.querySelector('.a4-paper');
        if (!previewContainer) {
            console.warn('⚠️ .a4-paper bulunamadı!');
            return;
        }
        
        // 🔒 KRİTİK: Her sayfa geçişinde localStorage'dan TÜM verileri yükle ve render et
        // Bu sayede her sayfada aynı veriler görünür
        const cvData = getDataWithExamples();
        
        console.log('🔄 changeTemplate: Template render ediliyor...', {
            template: templateName,
            cvData: {
                'fullname-first': cvData['fullname-first'],
                'fullname-last': cvData['fullname-last'],
                profession: cvData.profession,
                email: cvData.email,
                phone: cvData.phone,
                location: cvData.location
            }
        });
        
        // 🔒 KRİTİK: Şablonu render et - getDataWithExamples() zaten localStorage'dan veriyi yüklüyor
        const html = renderTemplate(templateName, cvData);
        previewContainer.innerHTML = html;
        
        console.log('✅ Template HTML render edildi');
        
        // 🔒 KRİTİK: Render edilen HTML'de phone ve profession var mı kontrol et
        const phoneInHtml = html.includes(cvData.phone || '');
        const professionInHtml = html.includes(cvData.profession || '');
        console.log('🔍 Render edilen HTML kontrol:', {
            phoneInHtml: phoneInHtml,
            professionInHtml: professionInHtml,
            phoneValue: cvData.phone,
            professionValue: cvData.profession
        });
        
        // localStorage'a kaydet
        localStorage.setItem('selected-template', templateName);
        
        // Şablon geçmişine ekle
        if (window.TemplateHistory) {
            window.TemplateHistory.add(templateName);
            // Şablon listesini güncelle
            window.TemplateHistory.updateList();
        }
        
        // 🔒 KRİTİK: DOM güncellenene kadar bekle, sonra loadPreviewData çağır
        setTimeout(() => {
            console.log('🔄 DOM güncellendi, preview fonksiyonları çağrılıyor...');
            
            // Preview loader'ı çalıştır (ÖNCE BU - çünkü template içindeki verileri günceller)
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            
            // Live preview'ı yeniden başlat
            if (window.initLivePreview) {
                window.initLivePreview();
            }
            
            // Experience manager'ı çalıştır
            if (window.renderPreviewExperiences) {
                window.renderPreviewExperiences();
            }
            
            // Education manager'ı çalıştır
            if (window.renderPreviewEducation) {
                window.renderPreviewEducation();
            }
            
            // Skills manager'ı çalıştır
            if (window.renderPreviewSkills) {
                window.renderPreviewSkills();
            }
            
            // Languages manager'ı çalıştır
            if (window.renderPreviewLanguages) {
                window.renderPreviewLanguages();
            }
        }, 200);
    }
    
    // 🔒 KRİTİK: Her sayfa yüklendiğinde CV preview'ı güncelle
    function updateCVPreview() {
        const previewContainer = document.querySelector('.a4-paper');
        if (!previewContainer) {
            console.warn('⚠️ .a4-paper bulunamadı!');
            return;
        }
        
        // Seçili şablonu al
        const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
        
        // localStorage'dan TÜM verileri yükle
        const cvData = getDataWithExamples();
        
        console.log('🔄 updateCVPreview: Template render ediliyor...', {
            template: selectedTemplate,
            cvData: cvData
        });
        
        // Şablonu render et - localStorage'dan yüklenen verilerle
        const html = renderTemplate(selectedTemplate, cvData);
        previewContainer.innerHTML = html;
        
        console.log('✅ Template HTML güncellendi');
        
        // 🔒 KRİTİK: DOM güncellenene kadar bekle, sonra loadPreviewData çağır
        setTimeout(() => {
            console.log('🔄 DOM güncellendi, loadPreviewData çağrılıyor...');
            if (window.loadPreviewData) {
                window.loadPreviewData();
            }
            if (window.initLivePreview) {
                window.initLivePreview();
            }
            if (window.renderPreviewExperiences) {
                window.renderPreviewExperiences();
            }
            if (window.renderPreviewEducation) {
                window.renderPreviewEducation();
            }
            if (window.renderPreviewSkills) {
                window.renderPreviewSkills();
            }
            if (window.renderPreviewLanguages) {
                window.renderPreviewLanguages();
            }
        }, 200);
    }
    
    // Global olarak erişilebilir yap
    window.CVTemplateRenderer = {
        render: renderTemplate,
        change: changeTemplate,
        update: updateCVPreview,
        templates: Object.keys(templateRenderers)
    };
    window.updateCVPreview = updateCVPreview;
    
    // Sayfa yüklendiğinde seçili şablonu yükle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const templateFromUrl = urlParams.get('template');
            const savedTemplate = localStorage.getItem('selected-template') || 'modern';
            const templateToUse = templateFromUrl || savedTemplate;
            
            console.log('📄 DOMContentLoaded: Template yükleniyor...', templateToUse);
            if (templateToUse) {
                changeTemplate(templateToUse);
            } else {
                updateCVPreview();
            }
        });
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const templateFromUrl = urlParams.get('template');
        const savedTemplate = localStorage.getItem('selected-template') || 'modern';
        const templateToUse = templateFromUrl || savedTemplate;
        
        console.log('📄 Sayfa zaten yüklü: Template yükleniyor...', templateToUse);
        if (templateToUse) {
            changeTemplate(templateToUse);
        } else {
            updateCVPreview();
        }
    }
})();

