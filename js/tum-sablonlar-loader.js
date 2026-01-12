// Tüm Şablonlar Sayfası - Şablon yükleme ve seçim işlevselliği
(function() {
    'use strict';
    
    // Tüm şablonların bilgileri
    const allTemplates = [
        {
            id: 'minimalist-zarafet',
            name: 'Minimalist Zarafet',
            description: 'Sade çizgiler, beyaz alan vurgusu, okunabilir tipografi ile modern ve profesyonel bir görünüm.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s',
            category: 'sade',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'basit' // cv-template-renderer.js'deki şablon anahtarı
        },
        {
            id: 'dinamik-portfoy',
            name: 'Dinamik Portföy',
            description: 'Yaratıcı alanlar için tasarlanmış, görsel öğelere (küçük ikonlar, grafikler) izin veren, renk paleti ile enerji katan bir şablon.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLR1B0q_tfSTrDJ5EeftQ-i7OAxh08pK_58h1vV7wH9aubxDP-qkjDwGxHWjtWDAEQnML5EBT0Ca0_EswEe-vGI_dZMkWrx5z9-7b7TVMMGunma1A0c6Bbk7L4_g_MMu45Ocym0JoGASF7r3G4Ns_UlPhEon1O-C0cN_1qXnNkL6L4ItRAaZL1QfnGo4T4-utryRG_E3jXrmhs2LYRF-4f81m8saY5-w_PE0Ja4SrKAYTeu4qRWejkL7kFanZGtjx6sDnBPNdLiaZQ',
            category: 'yaratici',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'yaratici'
        },
        {
            id: 'kurumsal-lider',
            name: 'Kurumsal Lider',
            description: 'Geleneksel ama güçlü bir yapıya sahip, net başlıklar, kolay erişilebilir bilgiler ve hiyerarşik düzen ile liderlik pozisyonları için ideal.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH',
            category: 'kurumsal',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'kurumsal'
        },
        {
            id: 'dijital-uzman',
            name: 'Dijital Uzman',
            description: 'Teknik becerileri ve projeleri ön plana çıkaran, kodlama veya dijital pazarlama gibi alanlara özel, temiz ve düzenli bir tasarım.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU',
            category: 'modern',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'executive'
        },
        {
            id: 'akademik-netlik',
            name: 'Akademik Netlik',
            description: 'Eğitim ve yayınları detaylandırmak için optimize edilmiş, bilimsel ve akademik kariyerler için uygun, düzenli ve anlaşılır bir şablon.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H',
            category: 'kurumsal',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'akademik'
        },
        {
            id: 'girisimci-vizyon',
            name: 'Girişimci Vizyon',
            description: 'Yenilikçi ve cesur bir tasarıma sahip, başarıları ve potansiyeli vurgulayan, genç ve dinamik profesyoneller için.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH',
            category: 'yaratici',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'yaratici'
        },
        {
            id: 'evrensel-uyum',
            name: 'Evrensel Uyum',
            description: 'Uluslararası başvurular için uygun, ATS dostu, evrensel olarak kabul gören düzen ve stil.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5',
            category: 'kurumsal',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'evrensel-uyum' // Özel render fonksiyonu
        },
        {
            id: 'overleaf-academic',
            name: 'Overleaf Academic',
            description: 'Akademik ve araştırma pozisyonları için optimize edilmiş, temiz ve profesyonel tek sütun düzen.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H',
            category: 'akademik',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'overleaf-academic'
        },
        {
            id: 'overleaf-professional',
            name: 'Overleaf Professional',
            description: 'Koyu gri header ve iki sütunlu düzen ile profesyonel görünüm, sol sütunda iletişim ve yetenekler.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU',
            category: 'kurumsal',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'overleaf-professional'
        },
        {
            id: 'overleaf-modern',
            name: 'Overleaf Modern',
            description: 'Yeşil vurgular ve modern iki sütunlu düzen ile dikkat çekici profesyonel tasarım.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5',
            category: 'modern',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'overleaf-modern'
        },
        {
            id: 'overleaf-business',
            name: 'Overleaf Business',
            description: 'İş dünyası için optimize edilmiş, sol sütunda deneyim ve eğitim, sağ sütunda yetenekler ve sertifikalar.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8azZH4_qdDO8KrrYlNz8KOKF13SnD7MMDT3i07Z7Ew0EYkJK5X5WGKgfzrLYPEJTrhn2txDTIffHPRduCHcuMgDj4Ryop5wbc7zz3DsX8a7GFN5r4a8TfIv56y2TT7v8aQ6pcXSjeTFayplUSMfjNlkbG-JKOQRflSZJTo3E7uQlLxdzTdF4h99h7DjnEjHKJV_8Mexj1Vkk8rlCxAav030rbMJAnAmblo1LmB-9wPWQO0l6TLve6gHzrkFVPa0vSGp_LmQ3UFLA7',
            category: 'kurumsal',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'overleaf-business'
        },
        {
            id: 'sanatsal-cizgiler',
            name: 'Sanatsal Çizgiler',
            description: 'Yaratıcı sektörlerdeki profesyoneller için, özgün bir düzen ve sanatsal dokunuşlarla kişiliği yansıtan.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT',
            category: 'yaratici',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'yaratici'
        },
        {
            id: 'yaratici-flow',
            name: 'Yaratıcı Flow',
            description: 'Tasarımcılar ve sanatçılar için renkli ve dinamik.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT',
            category: 'yaratici',
            badge: 'YENİ',
            badgeColor: 'purple',
            templateKey: 'yaratici'
        },
        {
            id: 'minimal-green',
            name: 'Minimal Green',
            description: 'Doğa dostu ve sade bir görünüm için.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UM6T99vBeyoHvtKzeS1L8QmYxDOPpRNMyina8GiDtfXPGF8no-VXZfzwgLtW3DrkPYmyYs0PoCYkxYwvGqpmp8ev6dR0scq5Yim1fPlM6bgCtih319a68EvZbGUv4rD1mKD-VFkAjt2Zz5wUnkM4RBNmXqM619-Pd3bZo4AWyEm_St4zLqUyM_rhwLIwHwQ7KjSDuFdY1z9bRnPzwMWKFgTOYm-yIasCa_LtvABVNtrYAFKvf43Hdk8Fq5V3akFdQ44ZSlA5UsFC',
            category: 'sade',
            badge: null,
            badgeColor: null,
            templateKey: 'minimal'
        },
        {
            id: 'akademik-pro',
            name: 'Akademik Pro',
            description: 'Eğitmenler ve araştırmacılar için detaylı içerik alanı.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H',
            category: 'kurumsal',
            badge: null,
            badgeColor: null,
            templateKey: 'akademik'
        },
        {
            id: 'executive-bold',
            name: 'Executive Bold',
            description: 'Yöneticiler için güçlü başlıklar ve net yapı.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU',
            category: 'kurumsal',
            badge: 'ATS DOSTU',
            badgeColor: 'blue',
            templateKey: 'executive'
        },
        {
            id: 'basit-start',
            name: 'Basit Start',
            description: 'Yeni mezunlar ve staj başvuruları için ideal.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s',
            category: 'sade',
            badge: null,
            badgeColor: null,
            templateKey: 'basit'
        },
        {
            id: 'global-tech',
            name: 'Global Tech',
            description: 'Uluslararası başvurular için modern standart.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5',
            category: 'modern',
            badge: null,
            badgeColor: null,
            templateKey: 'global-tech' // Özel render fonksiyonu
        },
        {
            id: 'dijital-yaratici',
            name: 'Dijital Yaratıcı',
            description: 'Pazarlama ve medya uzmanları için modern ve renkli bir dokunuş.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT',
            category: 'yaratici',
            badge: 'YENİ',
            badgeColor: 'pink',
            templateKey: 'yaratici'
        },
        {
            id: 'muhendis-pro',
            name: 'Mühendis Pro',
            description: 'Teknik yetkinlikleri ve sertifikaları vurgulayan düzenli yapı.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU',
            category: 'modern',
            badge: null,
            badgeColor: null,
            templateKey: 'executive'
        }
    ];
    
    // Şablon kartı HTML'i oluştur
    function createTemplateCard(template) {
        let badgeHtml = '';
        if (template.badge) {
            let badgeClass = '';
            if (template.badgeColor === 'purple') {
                badgeClass = 'bg-purple-100 text-purple-700';
            } else if (template.badgeColor === 'blue') {
                badgeClass = 'bg-blue-100 text-blue-800';
            } else if (template.badgeColor === 'pink') {
                badgeClass = 'bg-pink-100 text-pink-700';
            }
            badgeHtml = `
                <div class="absolute left-3 top-3">
                    <span class="rounded ${badgeClass} px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">${template.badge}</span>
                </div>
            `;
        }
        
        // Özel önizleme görseli gerektiren şablonlar (html2canvas ile dinamik oluşturulacak)
        const specialPreviewTemplates = ['global-tech', 'evrensel-uyum', 'overleaf-academic', 'overleaf-professional', 'overleaf-modern', 'overleaf-business'];
        const previewId = specialPreviewTemplates.includes(template.templateKey) 
            ? `preview-${template.templateKey}` 
            : '';
        
        return `
            <div class="group flex flex-col overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 template-card-item" data-template-id="${template.id}" data-template-key="${template.templateKey}" data-category="${template.category}">
                <div class="relative aspect-[1/1.41] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div class="absolute inset-0 bg-cover bg-top transition-transform duration-500 group-hover:scale-105" data-alt="${template.name} template preview" id="${previewId}" style='background-image: url("${template.image}");'></div>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button class="template-preview-btn flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg hover:bg-gray-100" data-template-key="${template.templateKey}">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                            Ön İzleme
                        </button>
                    </div>
                    ${badgeHtml}
                </div>
                <div class="flex flex-1 flex-col p-4">
                    <div class="mb-1 flex items-start justify-between">
                        <h3 class="font-bold text-text-main dark:text-white">${template.name}</h3>
                    </div>
                    <p class="mb-4 text-xs text-text-secondary dark:text-gray-400 line-clamp-2">${template.description}</p>
                    <button class="template-select-btn mt-auto w-full rounded-lg bg-primary/10 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white" data-template-key="${template.templateKey}">
                        Şablonu Seç
                    </button>
                </div>
            </div>
        `;
    }
    
    // Şablonları render et
    function renderTemplates(templates = allTemplates) {
        const grid = document.getElementById('templates-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        templates.forEach(template => {
            const cardHtml = createTemplateCard(template);
            grid.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        // Kısa bir gecikme ile event listener'ları ekle (DOM güncellemesi için)
        setTimeout(() => {
            attachEventListeners();
        }, 50);
        
        // Global Tech ve Evrensel Uyum için dinamik önizleme görselleri oluştur
        // html2canvas yüklendikten sonra çalıştır
        if (typeof html2canvas !== 'undefined') {
            setTimeout(() => {
                generateDynamicPreviews();
            }, 500);
        } else {
            // html2canvas yüklenene kadar bekle
            const checkHtml2Canvas = setInterval(() => {
                if (typeof html2canvas !== 'undefined') {
                    clearInterval(checkHtml2Canvas);
                    setTimeout(() => {
                        generateDynamicPreviews();
                    }, 500);
                }
            }, 100);
            
            // 10 saniye sonra timeout
            setTimeout(() => {
                clearInterval(checkHtml2Canvas);
            }, 10000);
        }
    }
    
    // Global Tech ve Evrensel Uyum için dinamik önizleme görselleri oluştur
    function generateDynamicPreviews() {
        // html2canvas yüklü mü kontrol et
        if (typeof html2canvas === 'undefined') {
            console.warn('html2canvas yüklenmedi, önizleme görselleri oluşturulamıyor');
            return;
        }
        
        // Özel önizleme gerektiren şablonlar (html2canvas ile dinamik oluşturulacak)
        const specialTemplates = ['global-tech', 'evrensel-uyum', 'overleaf-academic', 'overleaf-professional', 'overleaf-modern', 'overleaf-business'];
        
        specialTemplates.forEach((templateKey, index) => {
            setTimeout(() => {
                const card = document.querySelector(`.template-card-item[data-template-key="${templateKey}"]`);
                if (!card) {
                    console.warn(`${templateKey} şablonu bulunamadı`);
                    return;
                }
                
                let previewDiv = document.getElementById(`preview-${templateKey}`);
                if (!previewDiv) {
                    // Eğer preview div yoksa, kart içindeki ilk div'i kullan
                    const fallbackDiv = card.querySelector('.relative.aspect-\\[1\\/1\\.41\\]');
                    if (!fallbackDiv) {
                        console.warn(`${templateKey} için önizleme div'i bulunamadı`);
                        return;
                    }
                    // Fallback div'e ID ekle
                    fallbackDiv.id = `preview-${templateKey}`;
                    previewDiv = fallbackDiv;
                }
                
                // Şablonu render et
                if (window.CVTemplateRenderer && window.CVTemplateRenderer.render) {
                    const html = window.CVTemplateRenderer.render(templateKey);
                    
                    // Geçici bir container oluştur
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.top = '-9999px';
                    tempContainer.style.width = '210mm';
                    tempContainer.style.height = '297mm';
                    tempContainer.style.backgroundColor = 'white';
                    tempContainer.style.padding = '20px';
                    tempContainer.style.transform = 'scale(0.15)';
                    tempContainer.style.transformOrigin = 'top left';
                    tempContainer.className = 'a4-paper bg-white';
                    tempContainer.innerHTML = html;
                    document.body.appendChild(tempContainer);
                    
                    // Tailwind CSS stillerini uygula (gerekirse)
                    if (window.tailwind) {
                        window.tailwind.refresh();
                    }
                    
                    // html2canvas ile görsel oluştur
                    setTimeout(() => {
                        html2canvas(tempContainer, {
                            scale: 0.2,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            width: 210,
                            height: 297,
                            logging: false,
                            allowTaint: true
                        }).then(canvas => {
                            const dataUrl = canvas.toDataURL('image/png');
                            // Önizleme görselini güncelle
                            previewDiv.style.backgroundImage = `url("${dataUrl}")`;
                            previewDiv.style.backgroundSize = 'cover';
                            previewDiv.style.backgroundPosition = 'top';
                            document.body.removeChild(tempContainer);
                            console.log(`${templateKey} önizleme görseli oluşturuldu`);
                        }).catch(err => {
                            console.error(`${templateKey} önizleme görseli oluşturulamadı:`, err);
                            document.body.removeChild(tempContainer);
                        });
                    }, 1000);
                } else {
                    console.warn('CVTemplateRenderer bulunamadı');
                }
            }, index * 2000); // Her şablon için 2 saniye bekle
        });
    }
    
    // Filtreleme
    function filterTemplates(category) {
        if (category === 'all') {
            renderTemplates(allTemplates);
        } else {
            const filtered = allTemplates.filter(t => t.category === category);
            renderTemplates(filtered);
        }
        
        // Filtre butonlarını güncelle
        updateFilterButtons(category);
    }
    
    // Filtre butonlarını güncelle
    function updateFilterButtons(activeCategory) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            const filter = btn.getAttribute('data-filter');
            if (filter === activeCategory) {
                btn.classList.remove('border', 'border-gray-200', 'bg-white', 'text-gray-600', 'dark:border-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
                btn.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black');
            } else {
                btn.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black');
                btn.classList.add('border', 'border-gray-200', 'bg-white', 'text-gray-600', 'dark:border-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
            }
        });
    }
    
    // Event listener'ları ekle
    function attachEventListeners() {
        // Şablon seç butonları - önce eski listener'ları temizle
        const selectBtns = document.querySelectorAll('.template-select-btn');
        selectBtns.forEach((btn, index) => {
            // Eski listener'ı kaldır ve yeni ekle
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const templateKey = this.getAttribute('data-template-key');
                if (templateKey) {
                    // Şablon geçmişine ekle
                    if (window.TemplateHistory && window.TemplateHistory.add) {
                        window.TemplateHistory.add(templateKey);
                    }
                    // CV oluşturucu sayfasına yönlendir
                    window.location.href = `cv-olusturucu-kisisel-bilgiler.html?template=${templateKey}`;
                }
            });
        });
        
        // Ön izleme butonları - önce eski listener'ları temizle
        const previewBtns = document.querySelectorAll('.template-preview-btn');
        previewBtns.forEach((btn, index) => {
            // Eski listener'ı kaldır ve yeni ekle
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const templateKey = this.getAttribute('data-template-key');
                if (templateKey) {
                    // Şablon geçmişine ekle
                    if (window.TemplateHistory && window.TemplateHistory.add) {
                        window.TemplateHistory.add(templateKey);
                    }
                    // Önizleme modal'ı aç (veya direkt CV oluşturucuya yönlendir)
                    window.location.href = `cv-olusturucu-kisisel-bilgiler.html?template=${templateKey}`;
                }
            });
        });
        
        // Filtre butonları - sadece bir kez ekle
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            // Önce mevcut listener'ı kontrol et
            if (!btn.hasAttribute('data-filter-listener')) {
                btn.setAttribute('data-filter-listener', 'true');
                btn.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    filterTemplates(filter);
                });
            }
        });
    }
    
    // Sayfa yüklendiğinde başlat
    function init() {
        console.log('Tüm şablonlar yükleniyor...', allTemplates.length, 'şablon');
        renderTemplates();
        
        // Şablonların render edildiğini kontrol et
        setTimeout(() => {
            const grid = document.getElementById('templates-grid');
            if (grid) {
                const cards = grid.querySelectorAll('.template-card-item');
                console.log('Render edilen şablon sayısı:', cards.length);
                
                // Global Tech ve Evrensel Uyum şablonlarını kontrol et
                const globalTech = Array.from(cards).find(card => card.getAttribute('data-template-id') === 'global-tech');
                const evrenselUyum = Array.from(cards).find(card => card.getAttribute('data-template-id') === 'evrensel-uyum');
                
                if (!globalTech) {
                    console.warn('Global Tech şablonu bulunamadı!');
                }
                if (!evrenselUyum) {
                    console.warn('Evrensel Uyum şablonu bulunamadı!');
                }
            }
        }, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

