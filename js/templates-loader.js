// Şablonlar sayfası için "Daha Fazla Göster" butonu ve dinamik şablon yükleme
(function() {
    'use strict';
    
    // Ek şablonlar (ilk 8'den sonra gösterilecek)
    const additionalTemplates = [
        {
            id: 'tech',
            name: 'Tech Minimal',
            description: 'Teknoloji sektörü için sade ve modern tasarım.',
            category: 'Modern',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLR1B0q_tfSTrDJ5EeftQ-i7OAxh08pK_58h1vV7wH9aubxDP-qkjDwGxHWjtWDAEQnML5EBT0Ca0_EswEe-vGI_dZMkWrx5z9-7b7TVMMGunma1A0c6Bbk7L4_g_MMu45Ocym0JoGASF7r3G4Ns_UlPhEon1O-C0cN_1qXnNkL6L4ItRAaZL1QfnGo4T4-utryRG_E3jXrmhs2LYRF-4f81m8saY5-w_PE0Ja4SrKAYTeu4qRWejkL7kFanZGtjx6sDnBPNdLiaZQ',
            badge: null
        },
        {
            id: 'classic',
            name: 'Klasik Pro',
            description: 'Geleneksel ve profesyonel görünüm için ideal.',
            category: 'Kurumsal',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH',
            badge: null
        },
        {
            id: 'colorful',
            name: 'Renkli Express',
            description: 'Yaratıcı sektörler için canlı renkler.',
            category: 'Yaratıcı',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT',
            badge: 'YENİ'
        },
        {
            id: 'elegant',
            name: 'Zarif',
            description: 'Şık ve sofistike bir görünüm.',
            category: 'Sade',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UM6T99vBeyoHvtKzeS1L8QmYxDOPpRNMyina8GiDtfXPGF8no-VXZfzwgLtW3DrkPYmyYs0PoCYkxYwvGqpmp8ev6dR0scq5Yim1fPlM6bgCtih319a68EvZbGUv4rD1mKD-VFkAjt2Zz5wUnkM4RBNmXqM619-Pd3bZo4AWyEm_St4zLqUyM_rhwLIwHwQ7KjSDuFdY1z9bRnPzwMWKFgTOYm-yIasCa_LtvABVNtrYAFKvf43Hdk8Fq5V3akFdQ44ZSlA5UsFC',
            badge: null
        },
        {
            id: 'research',
            name: 'Araştırma',
            description: 'Akademik ve araştırma pozisyonları için.',
            category: 'Akademik',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H',
            badge: null
        },
        {
            id: 'leadership',
            name: 'Liderlik',
            description: 'Yönetici pozisyonları için güçlü tasarım.',
            category: 'Executive',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU',
            badge: 'ATS DOSTU'
        },
        {
            id: 'starter',
            name: 'Başlangıç',
            description: 'Yeni mezunlar için basit ve anlaşılır.',
            category: 'Basit',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s',
            badge: null
        },
        {
            id: 'international',
            name: 'Uluslararası',
            description: 'Global başvurular için standart format.',
            category: 'Global',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZBc7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5',
            badge: null
        }
    ];
    
    // Şablon kartı HTML'i oluştur
    function createTemplateCard(template) {
        const badgeHtml = template.badge ? `
            <div class="absolute left-3 top-3">
                <span class="rounded ${template.badge === 'YENİ' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-800'} px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">${template.badge}</span>
            </div>
        ` : '';
        
        return `
            <div class="group flex flex-col overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div class="relative aspect-[1/1.41] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div class="absolute inset-0 bg-cover bg-top transition-transform duration-500 group-hover:scale-105" data-alt="${template.name} resume template preview" style='background-image: url("${template.image}");'></div>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg hover:bg-gray-100">
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
                    <a href="cv-olusturucu-kisisel-bilgiler.html?template=${template.id}" class="mt-auto w-full rounded-lg bg-primary/10 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white text-center">
                        Şablonu Seç
                    </a>
                </div>
            </div>
        `;
    }
    
    // "Daha Fazla Göster" butonunu başlat
    function initLoadMoreButton() {
        const loadMoreBtn = document.querySelector('button:has(span.material-symbols-outlined)');
        if (!loadMoreBtn) return;
        
        // Butonun içeriğini kontrol et
        const btnText = loadMoreBtn.textContent.trim();
        if (!btnText.includes('Daha Fazla')) return;
        
        let templatesShown = 0;
        const templatesGrid = document.querySelector('.grid.grid-cols-1');
        if (!templatesGrid) return;
        
        loadMoreBtn.addEventListener('click', function() {
            // Tüm şablonlar sayfasına yönlendir
            window.location.href = 'tum-sablonlar.html';
        });
    }
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoadMoreButton);
    } else {
        initLoadMoreButton();
    }
})();

