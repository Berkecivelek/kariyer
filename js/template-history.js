// Şablon geçmişi yönetimi - Son seçilen şablonları takip eder
(function() {
    'use strict';
    
    // Şablon bilgileri (isim ve görsel URL'leri)
    const templateInfo = {
        modern: {
            name: 'Modern',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALjwu3aDJotkiRF1rvGxmBC6a2qwLwte0POnHgSjd6vfTjXkGK7y3gwNMjBl0MgNSYAvTUc1PDpYCBHaBaZOBUNhkCgQK0yWkzOw1CNeOQLZ0Ied4-1kn-zZEPOFswM4KcQHrTqUbC9f8xa2G7hnUofE3L-wsp9tuQ_jve9X-8nKP9B0rDQwTehvy_kKQgY4CAObuazw3MnNiZmDUkBSZRRiRBT-33JpBEinxh84zydmwG1uX_De6NgnsshbEGe1fjKS-l3FmnVGm9'
        },
        kurumsal: {
            name: 'Kurumsal',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8azZH4_qdDO8KrrYlNz8KOKF13SnD7MMDT3i07Z7Ew0EYkJK5X5WGKgfzrLYPEJTrhn2txDTIffHPRduCHcuMgDj4Ryop5wbc7zz3DsX8a7GFN5r4a8TfIv56y2TT7v8aQ6pcXSjeTFayplUSMfjNlkbG-JKOQRflSZJTo3E7uQlLxdzTdF4h99h7DjnEjHKJV_8Mexj1Vkk8rlCxAav030rbMJAnAmblo1LmB-9wPWQO0l6TLve6gHzrkFVPa0vSGp_LmQ3UFLA7'
        },
        yaratici: {
            name: 'Yaratıcı',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOpp_lZfJOM66t5PT9MchICoiqhP_5RuH6d-ExrkvZZh3JQapxbmBpyELirRjyH7LNl-umkRao5PoC_boHHz31trhD5aOXOdXWjA7oK1ktHgRFTerIim9ZDsLN93o8dvcU4u-8KHvsHVf0-BFic8U5JznLako_hQhiPmWWzAqHnTQei8kTTq7deYAQQIIiqgacM5lHYORnfG1sPg-IQBihU09-3CKmzhaJyqg_qLPVoIaZVRxqqVk5k-sM1hi4TXgj1CHGal3GbPXt'
        },
        minimal: {
            name: 'Minimal',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UM6T99vBeyoHvtKzeS1L8QmYxDOPpRNMyina8GiDtfXPGF8no-VXZfzwgLtW3DrkPYmyYs0PoCYkxYwvGqpmp8ev6dR0scq5Yim1fPlM6bgCtih319a68EvZbGUv4rD1mKD-VFkAjt2Zz5wUnkM4RBNmXqM619-Pd3bZo4AWyEm_St4zLqUyM_rhwLIwHwQ7KjSDuFdY1z9bRnPzwMWKFgTOYm-yIasCa_LtvABVNtrYAFKvf43Hdk8Fq5V3akFdQ44ZSlA5UsFC'
        },
        akademik: {
            name: 'Akademik Netlik',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H'
        },
        executive: {
            name: 'Executive Bold',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        basit: {
            name: 'Basit Start',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s'
        },
        global: {
            name: 'Global Tech',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZBc7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        },
        tech: {
            name: 'Tech Minimal',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLR1B0q_tfSTrDJ5EeftQ-i7OAxh08pK_58h1vV7wH9aubxDP-qkjDwGxHWjtWDAEQnML5EBT0Ca0_EswEe-vGI_dZMkWrx5z9-7b7TVMMGunma1A0c6Bbk7L4_g_MMu45Ocym0JoGASF7r3G4Ns_UlPhEon1O-C0cN_1qXnNkL6L4ItRAaZL1QfnGo4T4-utryRG_E3jXrmhs2LYRF-4f81m8saY5-w_PE0Ja4SrKAYTeu4qRWejkL7kFanZGtjx6sDnBPNdLiaZQ'
        },
        'minimalist-zarafet': {
            name: 'Minimalist Zarafet',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s'
        },
        'dinamik-portfoy': {
            name: 'Dinamik Portföy',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLR1B0q_tfSTrDJ5EeftQ-i7OAxh08pK_58h1vV7wH9aubxDP-qkjDwGxHWjtWDAEQnML5EBT0Ca0_EswEe-vGI_dZMkWrx5z9-7b7TVMMGunma1A0c6Bbk7L4_g_MMu45Ocym0JoGASF7r3G4Ns_UlPhEon1O-C0cN_1qXnNkL6L4ItRAaZL1QfnGo4T4-utryRG_E3jXrmhs2LYRF-4f81m8saY5-w_PE0Ja4SrKAYTeu4qRWejkL7kFanZGtjx6sDnBPNdLiaZQ'
        },
        'kurumsal-lider': {
            name: 'Kurumsal Lider',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH'
        },
        'dijital-uzman': {
            name: 'Dijital Uzman',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        'akademik-netlik': {
            name: 'Akademik Netlik',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H'
        },
        'girisimci-vizyon': {
            name: 'Girişimci Vizyon',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH'
        },
        'evrensel-uyum': {
            name: 'Evrensel Uyum',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        },
        'overleaf-academic': {
            name: 'Overleaf Academic',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H'
        },
        'overleaf-professional': {
            name: 'Overleaf Professional',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        'overleaf-modern': {
            name: 'Overleaf Modern',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        },
        'overleaf-business': {
            name: 'Overleaf Business',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8azZH4_qdDO8KrrYlNz8KOKF13SnD7MMDT3i07Z7Ew0EYkJK5X5WGKgfzrLYPEJTrhn2txDTIffHPRduCHcuMgDj4Ryop5wbc7zz3DsX8a7GFN5r4a8TfIv56y2TT7v8aQ6pcXSjeTFayplUSMfjNlkbG-JKOQRflSZJTo3E7uQlLxdzTdF4h99h7DjnEjHKJV_8Mexj1Vkk8rlCxAav030rbMJAnAmblo1LmB-9wPWQO0l6TLve6gHzrkFVPa0vSGp_LmQ3UFLA7'
        },
        'sanatsal-cizgiler': {
            name: 'Sanatsal Çizgiler',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT'
        },
        'yaratici-flow': {
            name: 'Yaratıcı Flow',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT'
        },
        'minimal-green': {
            name: 'Minimal Green',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UM6T99vBeyoHvtKzeS1L8QmYxDOPpRNMyina8GiDtfXPGF8no-VXZfzwgLtW3DrkPYmyYs0PoCYkxYwvGqpmp8ev6dR0scq5Yim1fPlM6bgCtih319a68EvZbGUv4rD1mKD-VFkAjt2Zz5wUnkM4RBNmXqM619-Pd3bZo4AWyEm_St4zLqUyM_rhwLIwHwQ7KjSDuFdY1z9bRnPzwMWKFgTOYm-yIasCa_LtvABVNtrYAFKvf43Hdk8Fq5V3akFdQ44ZSlA5UsFC'
        },
        'akademik-pro': {
            name: 'Akademik Pro',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H'
        },
        'executive-bold': {
            name: 'Executive Bold',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        'basit-start': {
            name: 'Basit Start',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s'
        },
        'global-tech': {
            name: 'Global Tech',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        },
        'evrensel-uyum': {
            name: 'Evrensel Uyum',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZB7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        },
        'dijital-yaratici': {
            name: 'Dijital Yaratıcı',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT'
        },
        'muhendis-pro': {
            name: 'Mühendis Pro',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        classic: {
            name: 'Klasik Pro',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfOu3z3efo-UPPH5Hug_Lo6YB90pNCPwlK_RhIsEb2u2hQxaQz-HIwXnP8bABg4oQFrqUdWGezP_3CIuXuIn5_7eRdAuO8awSc_YVvNqcu1B0LKpkL8OqWu54O8opgHJHQIVAO_eewRU7KxC3CIzhiEzVZSIPyQnV20-57IbDBNQDNOj_vHkc59gzdz_EF4qm2FrgtEWKpWiaqMq72LmIZPZo0U7_tjjsJ9Dtlbbnna1518sAS-LgJv63iWfiNpogVqdq22UqK54jH'
        },
        colorful: {
            name: 'Renkli Express',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uZ41eYxv13ym70t8I76T_wvjMTGowCJ2MowBsPEnVM5bcfTSNmy2gu5b2JnbrychebS09jk-HxkTAtgv-Zduos7VvN_JjBcK6RB7bhRRVQliVvFb0D3YAQa33nozHg56Jj3EkIc5_B2I81ybn8FKDKroKqQMfv1pCsrjzcpXA_o1FE0KNE8A6cNsoAwe5dg52bZqSeDdRvC7gxhd0TQfll9bmavBPvUtNOmHp6LCrF5NGEFOjGzZyK8XnQXw01078PJA-xANPawT'
        },
        elegant: {
            name: 'Zarif',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UM6T99vBeyoHvtKzeS1L8QmYxDOPpRNMyina8GiDtfXPGF8no-VXZfzwgLtW3DrkPYmyYs0PoCYkxYwvGqpmp8ev6dR0scq5Yim1fPlM6bgCtih319a68EvZbGUv4rD1mKD-VFkAjt2Zz5wUnkM4RBNmXqM619-Pd3bZo4AWyEm_St4zLqUyM_rhwLIwHwQ7KjSDuFdY1z9bRnPzwMWKFgTOYm-yIasCa_LtvABVNtrYAFKvf43Hdk8Fq5V3akFdQ44ZSlA5UsFC'
        },
        research: {
            name: 'Araştırma',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0_chTAZiKUpGwcU4tgGaJ-oVI3LV3nltD1HK1OoxUELXbJ3pvbXZwc13Ra3p8RH_a-YQ_4wMsaNARMw3KmhQ3jTBrCg3II1-rDDVrOqOLNnHNFrIaOpgVMKPWLhnfJ1RXBoXBP0a4mYelOwYi9MqQ7FhEo4G0Kg4OP_x3HhVTDZTe5tXIhZQTWTOxlukd01Vq8iuuqktmxOM6sXeQjyD-YlODOr6vubpcPVQGSMZedSd4Mhu4LU4pY4YS300DsbLpWJO2uobrTo6H'
        },
        leadership: {
            name: 'Liderlik',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWXl0arlkzv5A8rfVGAcBLfXrzJPGUPQHxDXMEeU_0BUrj6rmYjY3p3Z4lbRmFxSQ6vuGL-K_FcsBbSS0JN9_DNN0EcRB94tXSFDgeqpQQso8Iu5Vgz-YW-Woz2_3pFBNkVjFmcgURkvhRATEFZWHW-JG3Nk40rO_LQWO9G4qImwaklL_HKitWCBGxaEGcd9eulGm2ewLgin_3zL08ukT8S0125i_jytegjJQn9ghZ-ObvUYfNjNh-LinCi5syl3HGjTBp-70n7lU'
        },
        starter: {
            name: 'Başlangıç',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFXIjzAYHT1zUj74LYt1fz5f38Zm8mki9XxdHNyJ_UXzQ5qUO400t8jYPYTUVw35gqMxqNJmRJCQ2i7sulaHok2QNynlVtLffQeG6htfrMy7f5cRyHOT7YtSKoqALEpTgmZH689WlgJ5X7z0nAyPr2lZzXnxWbcjRaB2TIrIO2prLxBWw_6mkl38IbXAx_D5ZIoya_7U5BdiQoyKdKh_b2pvlfHVpLRrqOPRsl4-ONHfZLQijiWnWE_aJ-lsnC5HriC1VdHNeCc43s'
        },
        international: {
            name: 'Uluslararası',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLRD9NiqoX5OZkAMhIC8SJFAmiJJxvKuIC_qvNusE_xEYwSCYs6bOZZBc7vTG-40QTViHEnodpimsHmi-61nyw837sdKTHWUyijdR4lqNeB7CaOssyFCwdgRAffPN22t7Xx203d2_jTd-HqpjLYiRP5ncpT6i2qEzhCrpm70h14vP6Hf0OMkyxnRX0dKKKpEXFZE7mj2Mv43XX8NIq_ftPcZUmLxqNuidNhp7eY0xW_v51qoEdUfhJuHA9N6zYRTa4K9R5amrZEF5'
        }
    };
    
    // Şablon geçmişini localStorage'dan oku
    function getTemplateHistory() {
        try {
            const history = localStorage.getItem('template-history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }
    
    // Şablon geçmişini localStorage'a kaydet
    function saveTemplateHistory(history) {
        try {
            localStorage.setItem('template-history', JSON.stringify(history));
        } catch (e) {
            console.error('Şablon geçmişi kaydedilemedi:', e);
        }
    }
    
    // Şablon seçildiğinde geçmişe ekle (LIFO - son giren son çıkar)
    function addToHistory(templateId) {
        if (!templateId) return;
        
        // TemplateId templateInfo'da yoksa da kabul et (yeni şablonlar için)
        // Template key'ler de geçerli (modern, kurumsal, yaratici, vb.)
        let history = getTemplateHistory();
        
        // Eğer şablon zaten listede varsa, önce kaldır
        history = history.filter(id => id !== templateId);
        
        // Yeni şablonu başa ekle
        history.unshift(templateId);
        
        // Maksimum 5 şablon tut
        if (history.length > 5) {
            history = history.slice(0, 5);
        }
        
        saveTemplateHistory(history);
    }
    
    // Son seçilen şablonları al (varsayılan şablonları da ekle)
    function getRecentTemplates() {
        const history = getTemplateHistory();
        const defaultTemplates = ['modern', 'kurumsal', 'yaratici', 'minimal', 'akademik'];
        
        // Geçmişteki şablonları al
        const recentTemplates = history.filter(id => templateInfo[id]);
        
        // Eğer 5'ten az şablon varsa, varsayılan şablonlardan ekle
        const missingCount = 5 - recentTemplates.length;
        if (missingCount > 0) {
            defaultTemplates.forEach(id => {
                if (!recentTemplates.includes(id) && recentTemplates.length < 5) {
                    recentTemplates.push(id);
                }
            });
        }
        
        return recentTemplates.slice(0, 5);
    }
    
    // Şablon kartı HTML'i oluştur
    function createTemplateCard(templateId, isSelected = false) {
        const info = templateInfo[templateId];
        if (!info) return '';
        
        const selectedClasses = isSelected 
            ? 'border-2 border-primary ring-2 ring-primary/20 shadow-md opacity-100' 
            : 'border border-slate-200 dark:border-slate-600 shadow-sm opacity-70 hover:opacity-100';
        
        const labelClasses = isSelected
            ? 'text-primary font-bold'
            : 'text-slate-600 dark:text-slate-400 font-medium';
        
        const badgeHtml = isSelected 
            ? '<div class="template-selected absolute bottom-1 right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">Seçili</div>'
            : '<div class="template-selected absolute bottom-1 right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold hidden">Seçili</div>';
        
        // Tam ismi kelimelere ayır ve alt alta yaz
        const nameWords = info.name.split(' ');
        const nameHtml = nameWords.map(word => `<span class="block">${word}</span>`).join('');
        
        return `
            <div class="flex flex-col gap-2 min-w-[100px] cursor-pointer group template-card transition-opacity" data-template="${templateId}">
                <div class="relative w-full aspect-[3/4] rounded-lg overflow-hidden ${selectedClasses} transition-all">
                    <div class="w-full h-full bg-cover bg-top" data-alt="${info.name} resume template" style='background-image: url("${info.image}");'></div>
                    ${isSelected ? '<div class="absolute inset-0 bg-primary/10"></div>' : ''}
                    ${badgeHtml}
                </div>
                <div class="text-xs text-center ${labelClasses} transition-colors leading-tight mt-1">
                    ${nameHtml}
                </div>
            </div>
        `;
    }
    
    // CV oluşturucu sayfalarında şablon listesini güncelle
    function updateTemplateList() {
        // Önce id ile bul, yoksa class ile bul
        let templateContainer = document.getElementById('template-list-container');
        if (!templateContainer) {
            templateContainer = document.querySelector('.flex.gap-3.overflow-x-auto.no-scrollbar');
        }
        if (!templateContainer) return;
        
        const selectedTemplate = localStorage.getItem('selected-template') || 'modern';
        const recentTemplates = getRecentTemplates();
        
        // Container'ı temizle
        templateContainer.innerHTML = '';
        
        // Son şablonları ekle
        recentTemplates.forEach(templateId => {
            const isSelected = templateId === selectedTemplate;
            const cardHtml = createTemplateCard(templateId, isSelected);
            templateContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        // Şablon kartlarına tıklama event listener'ı ekle
        setTimeout(() => {
            const templateCards = templateContainer.querySelectorAll('.template-card');
            templateCards.forEach(card => {
                // Eğer zaten event listener varsa tekrar ekleme
                if (card.hasAttribute('data-listener-added')) return;
                card.setAttribute('data-listener-added', 'true');
                
                card.addEventListener('click', function() {
                    const template = card.getAttribute('data-template');
                    if (template && window.CVTemplateRenderer) {
                        // Şablon geçmişine ekle
                        addToHistory(template);
                        // Şablonu değiştir
                        window.CVTemplateRenderer.change(template);
                        // Listeyi güncelle
                        updateTemplateList();
                        // Şablon seçimini güncelle
                        if (window.updateTemplateSelection) {
                            window.updateTemplateSelection(template);
                        }
                    }
                });
            });
        }, 50);
    }
    
    // Global olarak erişilebilir yap
    window.TemplateHistory = {
        add: addToHistory,
        getRecent: getRecentTemplates,
        updateList: updateTemplateList,
        getInfo: (id) => templateInfo[id] || null
    };
    
    // Sayfa yüklendiğinde şablon listesini güncelle
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // URL'den şablon al
            const urlParams = new URLSearchParams(window.location.search);
            const templateFromUrl = urlParams.get('template');
            
            if (templateFromUrl) {
                addToHistory(templateFromUrl);
            }
            
            updateTemplateList();
        });
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const templateFromUrl = urlParams.get('template');
        
        if (templateFromUrl) {
            addToHistory(templateFromUrl);
        }
        
        updateTemplateList();
    }
})();

