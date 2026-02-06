// CV State Manager - Merkezi CV Veri Yönetimi
// Tüm CV verilerini tek localStorage key'inde yönetir
(function() {
    'use strict';

    const CV_STORAGE_KEY = 'cv-unified-data';
    const LEGACY_KEYS = ['cv-builder-data', 'cv-experiences', 'cv-education', 'cv-skills', 'cv-languages'];

    // Boş CV şablonu
    function getEmptyCV() {
        return {
            personalInfo: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                location: '',
                country: '',
                city: '',
                profession: '',
                website: '',
                photo: ''
            },
            summary: '',
            experiences: [],
            education: [],
            skills: [],
            languages: [],
            template: 'modern',
            lastModified: null,
            initialized: false
        };
    }

    // localStorage'dan CV verisini oku
    function getCVData() {
        try {
            const data = localStorage.getItem(CV_STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // Eksik alanları doldur
                return { ...getEmptyCV(), ...parsed };
            }
            return getEmptyCV();
        } catch (e) {
            console.error('CV verisi okunamadı:', e);
            return getEmptyCV();
        }
    }

    // localStorage'a CV verisini kaydet
    function saveCVData(data, dispatchEvent = true) {
        try {
            data.lastModified = new Date().toISOString();
            localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(data));
            console.log('CV verisi kaydedildi');

            // CV güncellendi event'i fırlat
            if (dispatchEvent) {
                window.dispatchEvent(new CustomEvent('cv-data-updated', { detail: data }));
            }

            return true;
        } catch (e) {
            console.error('CV verisi kaydedilemedi:', e);
            return false;
        }
    }

    // Eski localStorage key'lerinden veri migrate et
    function migrateFromLegacyKeys() {
        const cvData = getCVData();

        // Eğer zaten initialize edilmişse migrate etme
        if (cvData.initialized) {
            return cvData;
        }

        let hasLegacyData = false;

        // cv-builder-data'dan kişisel bilgileri al
        try {
            const builderData = localStorage.getItem('cv-builder-data');
            if (builderData) {
                const parsed = JSON.parse(builderData);
                if (parsed['fullname-first']) cvData.personalInfo.firstName = parsed['fullname-first'];
                if (parsed['fullname-last']) cvData.personalInfo.lastName = parsed['fullname-last'];
                if (parsed.email) cvData.personalInfo.email = parsed.email;
                if (parsed.phone) cvData.personalInfo.phone = parsed.phone;
                if (parsed.location) cvData.personalInfo.location = parsed.location;
                if (parsed.profession) cvData.personalInfo.profession = parsed.profession;
                if (parsed.summary) cvData.summary = parsed.summary;
                hasLegacyData = true;
            }
        } catch (e) {}

        // cv-experiences'dan deneyimleri al
        try {
            const expData = localStorage.getItem('cv-experiences');
            if (expData) {
                const parsed = JSON.parse(expData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Örnek verileri filtrele
                    const realExperiences = parsed.filter(exp => {
                        const isSample = (
                            (exp.jobTitle === 'Kıdemli Yazılım Mühendisi' && exp.company === 'TechSolutions Inc.') ||
                            (exp.jobTitle === 'Frontend Geliştirici' && exp.company === 'Creative Web Agency')
                        );
                        return !isSample;
                    });
                    if (realExperiences.length > 0) {
                        cvData.experiences = realExperiences;
                        hasLegacyData = true;
                    }
                }
            }
        } catch (e) {}

        // Eğer legacy veri varsa kaydet ve işaretle
        if (hasLegacyData) {
            cvData.initialized = true;
            saveCVData(cvData);
            console.log('Legacy veriler migrate edildi');
        }

        return cvData;
    }

    // Kullanıcının kayıt bilgilerini yükle (login sonrası)
    function loadUserRegistrationData() {
        try {
            // Backend'den gelen kullanıcı bilgileri
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                const cvData = getCVData();

                // Sadece boşsa doldur
                if (!cvData.personalInfo.firstName && user.firstName) {
                    cvData.personalInfo.firstName = user.firstName;
                }
                if (!cvData.personalInfo.lastName && user.lastName) {
                    cvData.personalInfo.lastName = user.lastName;
                }
                if (!cvData.personalInfo.email && user.email) {
                    cvData.personalInfo.email = user.email;
                }

                saveCVData(cvData);
                return cvData;
            }
        } catch (e) {
            console.error('Kullanıcı bilgileri yüklenemedi:', e);
        }
        return getCVData();
    }

    // CV'yi tamamen sıfırla
    function resetCV() {
        const emptyCV = getEmptyCV();
        emptyCV.initialized = true;
        saveCVData(emptyCV);

        // Legacy key'leri temizle
        LEGACY_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('CV sıfırlandı');
        return emptyCV;
    }

    // Bölüm bazlı getter'lar
    function getPersonalInfo() {
        return getCVData().personalInfo;
    }

    function getSummary() {
        return getCVData().summary;
    }

    function getExperiences() {
        return getCVData().experiences || [];
    }

    function getEducation() {
        return getCVData().education || [];
    }

    function getSkills() {
        return getCVData().skills || [];
    }

    function getLanguages() {
        return getCVData().languages || [];
    }

    function getTemplate() {
        return getCVData().template || 'modern';
    }

    // Bölüm bazlı setter'lar
    function setPersonalInfo(info) {
        const cvData = getCVData();
        cvData.personalInfo = { ...cvData.personalInfo, ...info };
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function setSummary(summary) {
        const cvData = getCVData();
        cvData.summary = summary;
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function setExperiences(experiences) {
        const cvData = getCVData();
        cvData.experiences = experiences;
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function addExperience(experience) {
        const cvData = getCVData();
        cvData.experiences.push(experience);
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function updateExperience(index, experience) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.experiences.length) {
            cvData.experiences[index] = experience;
            return saveCVData(cvData);
        }
        return false;
    }

    function deleteExperience(index) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.experiences.length) {
            cvData.experiences.splice(index, 1);
            return saveCVData(cvData);
        }
        return false;
    }

    function setEducation(education) {
        const cvData = getCVData();
        cvData.education = education;
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function addEducation(edu) {
        const cvData = getCVData();
        cvData.education.push(edu);
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function updateEducation(index, edu) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.education.length) {
            cvData.education[index] = edu;
            return saveCVData(cvData);
        }
        return false;
    }

    function deleteEducation(index) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.education.length) {
            cvData.education.splice(index, 1);
            return saveCVData(cvData);
        }
        return false;
    }

    function setSkills(skills) {
        const cvData = getCVData();
        cvData.skills = skills;
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function addSkill(skill) {
        const cvData = getCVData();
        cvData.skills.push(skill);
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function deleteSkill(index) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.skills.length) {
            cvData.skills.splice(index, 1);
            return saveCVData(cvData);
        }
        return false;
    }

    function setLanguages(languages) {
        const cvData = getCVData();
        cvData.languages = languages;
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function addLanguage(language) {
        const cvData = getCVData();
        cvData.languages.push(language);
        cvData.initialized = true;
        return saveCVData(cvData);
    }

    function deleteLanguage(index) {
        const cvData = getCVData();
        if (index >= 0 && index < cvData.languages.length) {
            cvData.languages.splice(index, 1);
            return saveCVData(cvData);
        }
        return false;
    }

    function setTemplate(template) {
        const cvData = getCVData();
        cvData.template = template;
        return saveCVData(cvData);
    }

    // AI parsing sonucu tüm CV'yi güncelle
    function updateFromAIParsing(parsedData) {
        const cvData = getCVData();

        // Kişisel bilgiler
        if (parsedData.personalInfo) {
            cvData.personalInfo = { ...cvData.personalInfo, ...parsedData.personalInfo };
        }

        // Özet
        if (parsedData.summary) {
            cvData.summary = parsedData.summary;
        }

        // Deneyimler
        if (parsedData.experiences && Array.isArray(parsedData.experiences)) {
            cvData.experiences = parsedData.experiences;
        }

        // Eğitim
        if (parsedData.education && Array.isArray(parsedData.education)) {
            cvData.education = parsedData.education;
        }

        // Yetenekler
        if (parsedData.skills && Array.isArray(parsedData.skills)) {
            cvData.skills = parsedData.skills;
        }

        // Diller
        if (parsedData.languages && Array.isArray(parsedData.languages)) {
            cvData.languages = parsedData.languages;
        }

        cvData.initialized = true;
        saveCVData(cvData); // saveCVData otomatik olarak cv-data-updated event'ini fırlatır

        console.log('AI parsing verileri kaydedildi');

        return cvData;
    }

    // Global API
    window.CVStateManager = {
        // Genel
        getCVData,
        saveCVData,
        resetCV,
        migrateFromLegacyKeys,
        loadUserRegistrationData,
        updateFromAIParsing,

        // Kişisel Bilgiler
        getPersonalInfo,
        setPersonalInfo,

        // Özet
        getSummary,
        setSummary,

        // Deneyim
        getExperiences,
        setExperiences,
        addExperience,
        updateExperience,
        deleteExperience,

        // Eğitim
        getEducation,
        setEducation,
        addEducation,
        updateEducation,
        deleteEducation,

        // Yetenekler
        getSkills,
        setSkills,
        addSkill,
        deleteSkill,

        // Diller
        getLanguages,
        setLanguages,
        addLanguage,
        deleteLanguage,

        // Şablon
        getTemplate,
        setTemplate
    };

    // Sayfa yüklendiğinde legacy verileri migrate et ve kullanıcı bilgilerini yükle
    function init() {
        migrateFromLegacyKeys();
        loadUserRegistrationData();
        console.log('CV State Manager initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
