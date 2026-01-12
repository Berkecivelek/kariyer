// CV Şablon Render Motoru
// Her şablon için HTML/CSS render fonksiyonları
(function() {
    'use strict';
    
    // Şablon verilerini localStorage'dan oku
    function getCVData() {
        try {
            const data = localStorage.getItem('cv-builder-data');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
    
    // Örnek veriler (kullanıcı verisi yoksa gösterilecek)
    const exampleData = {
        'fullname-first': 'Ahmet',
        'fullname-last': 'Yılmaz',
        profession: 'Kıdemli Yazılım Mühendisi',
        email: 'ahmet@example.com',
        phone: '+90 555 123 45 67',
        location: 'İstanbul, TR',
        summary: '5+ yıllık deneyime sahip, yüksek performanslı web uygulamaları geliştirmede uzmanlaşmış sonuç odaklı yazılım mühendisi. Modern JavaScript frameworkleri ve bulut teknolojileri konusunda derin bilgi sahibi. Mikroservis mimarileri, CI/CD süreçleri ve ekip liderliği deneyimine sahip.',
        experiences: [
            {
                jobTitle: 'Kıdemli Yazılım Mühendisi',
                company: 'TechSolutions Inc.',
                startMonth: '01',
                startYear: '2021',
                endMonth: '',
                endYear: '',
                isCurrent: true,
                description: 'Mikroservis mimarisine geçiş projesine liderlik ederek sistem performansını %40 artırdım.\nJunior geliştiricilere mentorluk yaparak ekibin kod kalitesini yükselttim.\nCI/CD süreçlerini optimize ederek deployment süresini 15 dakikadan 3 dakikaya indirdim.'
            },
            {
                jobTitle: 'Frontend Geliştirici',
                company: 'Creative Web Agency',
                startMonth: '06',
                startYear: '2019',
                endMonth: '12',
                endYear: '2021',
                isCurrent: false,
                description: '20\'den fazla kurumsal müşteri için responsive web arayüzleri geliştirdim.\nReact ve Redux kullanarak karmaşık state yönetimi gerektiren dashboardlar tasarladım.'
            }
        ],
        education: [
            {
                school: 'İstanbul Teknik Üniversitesi',
                department: 'Bilgisayar Mühendisliği',
                startYear: '2015',
                endYear: '2019',
                description: 'Lisans derecesi, 3.5/4.0 GPA'
            }
        ],
        skills: ['JavaScript (ES6+)', 'React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Git', 'Docker', 'AWS'],
        languages: [
            { language: 'Türkçe', level: 'Anadil' },
            { language: 'İngilizce', level: 'C1 İleri' }
        ]
    };
    
    // Kullanıcı verisi varsa onu kullan, yoksa örnek veriyi kullan
    // SINGLE SOURCE OF TRUTH: Reads from both cv-builder-data and separate localStorage keys
    function getDataWithExamples() {
        const userData = getCVData();
        const result = {};
        
        // Read from separate localStorage keys (for PDF uploads and manual entries)
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
        
        // Her alan için kullanıcı verisi varsa onu kullan, yoksa örnek veriyi kullan
        Object.keys(exampleData).forEach(key => {
            if (key === 'experiences') {
                // Priority: separate localStorage > cv-builder-data > example
                result[key] = (experiences.length > 0) ? experiences : 
                             ((userData[key] && userData[key].length > 0) ? userData[key] : exampleData[key]);
            } else if (key === 'education') {
                result[key] = (education.length > 0) ? education : 
                             ((userData[key] && userData[key].length > 0) ? userData[key] : exampleData[key]);
            } else if (key === 'skills') {
                result[key] = (skills.length > 0) ? skills : 
                             ((userData[key] && userData[key].length > 0) ? userData[key] : exampleData[key]);
            } else if (key === 'languages') {
                result[key] = (languages.length > 0) ? languages : 
                             ((userData[key] && userData[key].length > 0) ? userData[key] : exampleData[key]);
            } else {
                // String alanlar için
                result[key] = (userData[key] && userData[key].trim() !== '') ? userData[key] : exampleData[key];
            }
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
        if (!education || education.length === 0) {
            return `
                <div class="mb-3">
                    <h3 class="text-sm font-bold text-slate-900">Bilgisayar Mühendisliği</h3>
                    <p class="text-xs text-slate-700">İstanbul Teknik Üniversitesi</p>
                    <p class="text-xs text-slate-500 mt-1">2015 - 2019</p>
                </div>
            `;
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
        if (!education || education.length === 0) {
            return `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-base font-bold text-slate-900">Bilgisayar Mühendisliği</h3>
                        <p class="text-xs font-bold text-slate-500 mt-0.5">İstanbul Teknik Üniversitesi</p>
                        <p class="text-xs text-slate-500 italic mt-1">3.50 not ortalaması ile mezuniyet</p>
                    </div>
                    <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">2015 - 2019</span>
                </div>
            `;
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
        if (!skills || skills.length === 0) {
            return ['JavaScript (ES6+)', 'React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Git', 'Docker'].map(skill => 
                `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">${skill}</span>`
            ).join('');
        }
        
        return skills.map(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill.name || '');
            return `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">${skillName}</span>`;
        }).join('');
    }
    
    // Yetenekleri preview şablonu için render et (özel format)
    function renderSkillsForPreview(skills) {
        if (!skills || skills.length === 0) {
            return ['JavaScript (ES6+)', 'React & Redux', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Git & GitHub', 'Docker'].map(skill => 
                `<span class="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-bold">${skill}</span>`
            ).join('');
        }
        
        return skills.map(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill.name || '');
            return `<span class="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-bold">${skillName}</span>`;
        }).join('');
    }
    
    // Dilleri render et
    function renderLanguages(languages) {
        if (!languages || languages.length === 0) {
            return `
                <div class="mb-2">
                    <span class="text-xs text-slate-700 font-medium">Türkçe</span>
                    <span class="text-xs text-slate-500 ml-2">Anadil</span>
                </div>
                <div class="mb-2">
                    <span class="text-xs text-slate-700 font-medium">İngilizce</span>
                    <span class="text-xs text-slate-500 ml-2">C1 İleri</span>
                </div>
            `;
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
        if (!languages || languages.length === 0) {
            return `
                <div class="flex justify-between items-center text-xs border-b border-dashed border-slate-200 pb-1">
                    <span class="font-bold text-slate-700">Türkçe</span>
                    <span class="text-slate-500 font-medium">Anadil</span>
                </div>
                <div class="flex justify-between items-center text-xs border-b border-dashed border-slate-200 pb-1">
                    <span class="font-bold text-slate-700">İngilizce</span>
                    <span class="text-slate-500 font-medium">C1 İleri</span>
                </div>
            `;
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
            const cvData = data || getDataWithExamples();
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            // Deneyimleri render et (örnek veri ile fallback)
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            
            // Eğitimleri render et (örnek veri ile fallback)
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            
            // Yetenekleri render et (örnek veri ile fallback)
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            
            // Dilleri render et (örnek veri ile fallback)
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            // Deneyimleri render et (örnek veri ile fallback)
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            
            // Eğitimleri render et (örnek veri ile fallback)
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            
            // Yetenekleri render et (örnek veri ile fallback)
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            
            // Dilleri render et (örnek veri ile fallback)
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            // Deneyimleri render et (örnek veri ile fallback)
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            
            // Eğitimleri render et (örnek veri ile fallback)
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            
            // Yetenekleri render et (örnek veri ile fallback)
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            
            // Dilleri render et (örnek veri ile fallback)
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
            const experiences = (cvData.experiences && cvData.experiences.length > 0) ? cvData.experiences : exampleData.experiences;
            const experiencesHtml = renderExperiences(experiences);
            const education = (cvData.education && cvData.education.length > 0) ? cvData.education : exampleData.education;
            const educationHtml = renderEducation(education);
            const skills = (cvData.skills && cvData.skills.length > 0) ? cvData.skills : exampleData.skills;
            const skillsHtml = renderSkills(skills);
            const languages = (cvData.languages && cvData.languages.length > 0) ? cvData.languages : exampleData.languages;
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
            const fullName = (cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '') || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
            
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
            const fullName = ((cvData['fullname-first'] || '') + ' ' + (cvData['fullname-last'] || '')).trim() || 'Ad Soyad';
            const profession = cvData.profession || 'Meslek';
            const email = cvData.email || 'email@example.com';
            const phone = cvData.phone || '+90 555 123 45 67';
            const location = cvData.location || 'İstanbul, TR';
            const summary = cvData.summary || 'Profesyonel özetinizi buraya yazın...';
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
        if (!previewContainer) return;
        
        // Şablonu render et
        const html = renderTemplate(templateName);
        previewContainer.innerHTML = html;
        
        // localStorage'a kaydet
        localStorage.setItem('selected-template', templateName);
        
        // Şablon geçmişine ekle
        if (window.TemplateHistory) {
            window.TemplateHistory.add(templateName);
            // Şablon listesini güncelle
            window.TemplateHistory.updateList();
        }
        
        // Kısa bir gecikme ile live preview'ı yeniden başlat (DOM güncellemesi için)
        setTimeout(() => {
            // Live preview'ı yeniden başlat
            if (window.initLivePreview) {
                window.initLivePreview();
            }
            
            // Preview loader'ı çalıştır
            if (window.loadPreviewData) {
                window.loadPreviewData();
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
        }, 50);
    }
    
    // Global olarak erişilebilir yap
    window.CVTemplateRenderer = {
        render: renderTemplate,
        change: changeTemplate,
        templates: Object.keys(templateRenderers)
    };
    
    // Sayfa yüklendiğinde seçili şablonu yükle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const templateFromUrl = urlParams.get('template');
            const savedTemplate = localStorage.getItem('selected-template') || 'modern';
            const templateToUse = templateFromUrl || savedTemplate;
            
            if (templateToUse) {
                changeTemplate(templateToUse);
            }
        });
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const templateFromUrl = urlParams.get('template');
        const savedTemplate = localStorage.getItem('selected-template') || 'modern';
        const templateToUse = templateFromUrl || savedTemplate;
        
        if (templateToUse) {
            changeTemplate(templateToUse);
        }
    }
})();

