# CareerAI Proje Analiz Raporu

**Tarih:** 3 Şubat 2026
**Analiz Kapsamı:** Backend, Frontend, Veritabanı, Güvenlik, Bağlantılar

---

## BAĞLANTI DURUMU

| Ortam | Durum | Endpoint |
|-------|-------|----------|
| Local Backend | ✅ Çalışıyor | http://localhost:3000/api/health |
| EC2 Production | ✅ Çalışıyor | http://16.170.227.182/api/health |

---

## KRİTİK GÜVENLİK AÇIKLARI (HEMEN DÜZELTİLMELİ)

### 1. API Anahtarı Git'te Açıkta
**Dosya:** `backend/.env` (satır 18)
```
ANTHROPIC_API_KEY=sk-ant-api03-***REDACTED***
```
**Risk:** Repository'ye erişen herkes API anahtarını görebilir ve kullanabilir. Bu anahtar hemen iptal edilip yenisi oluşturulmalı.
**Durum:** ✅ Düzeltildi - Anahtar .env.example'da gösterilmiyor, gerçek anahtar .gitignore'da

### 2. Zayıf JWT Secret'ları
**Dosya:** `backend/.env` (satır 12-15)
```
JWT_SECRET=careerai-jwt-secret-key-change-in-production-2024
JWT_REFRESH_SECRET=careerai-refresh-secret-key-change-in-production-2024
```
**Risk:** Bu secret'lar tahmin edilebilir. Saldırgan JWT token'ları oluşturabilir ve hesapları ele geçirebilir.

### 3. CORS Tüm Origin'lere Açık
**Dosya:** `backend/src/server.ts` (satır 74)
```typescript
callback(null, true); // Tüm origin'lere izin veriyor!
```
**Risk:** Herhangi bir web sitesi, kullanıcının tarayıcısından API'ye istek gönderebilir (CSRF saldırısı).

### 4. localStorage'da Token Saklama
**Dosya:** `js/api-client.js` (satır 66-70)
```javascript
localStorage.setItem('authToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```
**Risk:** XSS saldırısında tüm token'lar çalınabilir. httpOnly cookie kullanılmalı.

### 5. Hardcoded IP Adresi
**Dosya:** `js/api-client.js` (satır 22)
```javascript
if (hostname === '16.170.227.182' || hostname.includes('16.170.227.182')) {
```
**Risk:** Production IP adresi kaynak kodda açık. Environment variable kullanılmalı.

### 6. Auth Endpoint'lerinde Rate Limiting Yok
**Dosya:** `backend/src/routes/auth.routes.ts`
- Login ve register endpoint'lerinde rate limiting yok
- Brute force saldırılarına açık

---

## YÜKSEK ÖNCELİKLİ SORUNLAR

### 7. Kredi Sistemi Çalışmıyor
**Dosya:** `backend/src/services/aiService.ts` (satır 88-93)
```typescript
if (subscription.usedCredits + creditsRequired > subscription.aiCredits) {
  // Krediler bitmiş ama yine de devam et
  console.warn(`User ${userId} has exceeded internal credit limit...`);
}
```
**Sorun:** Kredi limitleri enforce edilmiyor, kullanıcılar sınırsız AI servisi kullanabilir.

### 8. Token Logout'ta İptal Edilmiyor
**Dosya:** `backend/src/controllers/auth.controller.ts` (satır 196-213)
- Logout sadece client-side
- Token 7 gün boyunca geçerli kalmaya devam ediyor
- Token blacklist mekanizması yok

### 9. Zayıf Şifre Politikası
**Dosya:** `backend/src/middleware/validation.middleware.ts` (satır 29-31)
```typescript
body('password').isLength({ min: 6 })
```
**Sorun:** Minimum 6 karakter yetersiz. OWASP minimum 12 karakter öneriyor. Büyük/küçük harf, rakam, özel karakter zorunlu olmalı.

### 10. Email Doğrulaması Yok
- Kullanıcılar sahte email ile kayıt olabiliyor
- Spam hesap riski
- Hesap kurtarma mekanizması yok

### 11. Şifre Sıfırlama Mekanizması Yok
- Kullanıcı şifresini unutursa hesaba erişemez
- Password reset endpoint'i mevcut değil

### 12. CSP 'unsafe-inline' Kullanıyor
**Dosya:** `backend/src/server.ts` (satır 45)
```typescript
scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"]
```
**Risk:** XSS koruması devre dışı.

---

## VERİTABANI SORUNLARI

### 13. Transaction Kullanılmıyor (Race Condition)
**Dosya:** `backend/src/services/aiService.ts` (satır 48-102)
```typescript
let subscription = await prisma.subscription.findFirst({...});
if (!subscription) {
  subscription = await prisma.subscription.create({...}); // Query 1
}
await prisma.subscription.update({...}); // Query 2
await prisma.usageLog.create({...}); // Query 3
```
**Risk:** Eş zamanlı isteklerde kredi çift düşebilir veya veri tutarsızlığı oluşabilir.

### 14. InterviewSession → Resume İlişkisi Eksik
**Dosya:** `backend/prisma/schema.prisma`
```prisma
model InterviewSession {
  resumeId String? // Foreign key yok!
}
```
**Sorun:** Referential integrity sağlanmıyor.

### 15. JSON Field'larda Aşırı Kullanım
```prisma
experience Json?
education Json?
skills Json?
languages Json?
```
**Sorun:**
- Veritabanı seviyesinde şema doğrulaması yok
- JSON içinde sorgulama verimsiz
- Ayrı tablolar (ResumeExperience, ResumeEducation) oluşturulmalı

### 16. N+1 Query Sorunu
**Dosya:** `backend/src/controllers/interview.controller.ts` (satır 306-313)
```typescript
include: {
  questions: {
    include: { answers: true }
  }
}
```
- Tüm sorular ve cevaplar yükleniyor
- Sadece özet gerektiğinde bile full data çekiliyor

### 17. Eksik Index'ler
Aşağıdaki composite index'ler eklenmeli:
```sql
CREATE INDEX "subscription_userId_isActive_idx" ON "subscriptions"("userId", "isActive");
CREATE INDEX "resume_userId_status_idx" ON "resumes"("userId", "status");
CREATE INDEX "interviewSession_userId_status_idx" ON "interview_sessions"("userId", "status");
```

### 18. Aktif Subscription için Unique Constraint Yok
```sql
-- Kullanıcı başına tek aktif subscription olmalı
CREATE UNIQUE INDEX "one_active_subscription_per_user"
ON "subscriptions"("userId") WHERE "isActive" = true;
```

---

## FRONTEND SORUNLARI

### 19. Duplicate Metodlar
**Dosya:** `js/api-client.js`
- `getCoverLetters()` iki kez tanımlı (satır 448 ve 470)
- `updateCoverLetter()` iki kez tanımlı (satır 463-468 ve 474-478)

### 20. XSS Açığı - innerHTML
**Dosya:** `js/cv-analysis.js` (satır 790)
```javascript
previewContainer.innerHTML = html; // API'den gelen veri direkt inject
```
**Risk:** Backend'den gelen kötü niyetli HTML çalıştırılabilir.

### 21. XSS Açığı - Inline Event Handler
**Dosya:** `dashboard.html`
```html
<button onclick="deleteResume('${resume.id}')" ...>
```
**Risk:** `resume.id` içinde `'); alert('XSS');` varsa çalışır.

### 22. Memory Leak - setInterval Temizlenmiyor
**Dosya:** `js/cv-auto-save.js` (satır 155)
```javascript
setInterval(() => {
    saveCVToDatabase();
}, 30000);
// clearInterval() yok!
```

### 23. Aşırı Console.log (303 adet)
- Production'da debug logları açık
- Token ve kullanıcı bilgileri console'a yazılıyor
- Performans etkisi

### 24. Input Validation Eksik
- Email formatı kontrol edilmiyor (client-side)
- Dosya upload'da tip/boyut kontrolü yok
- UUID formatı doğrulanmıyor

### 25. CSS Bundle Çok Büyük (103KB)
- PurgeCSS optimizasyonu yapılmamış
- Kullanılmayan stiller dahil

---

## BACKEND KOD KALİTESİ

### 26. File Upload Güvenlik Açığı
**Dosya:** `backend/src/controllers/auth.controller.ts` (satır 315-400)
- MIME type client tarafından geliyor (sahte olabilir)
- Magic number doğrulaması yok
- Virus/malware taraması yok

### 27. Web Scraping Güvenlik Sorunu
**Dosya:** `backend/src/services/aiService.ts`
- Timeout yok (sonsuz bekleme)
- robots.txt kontrolü yok
- Memory leak potansiyeli (Puppeteer kapatılmıyor)

### 28. Prompt Injection Riski
**Dosya:** `backend/src/services/aiService.ts` (satır 246-270)
```typescript
const prompt = `...
İsim: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}
Yetenekler: ${JSON.stringify(personalInfo.skills || [])}`;
```
**Risk:** Kullanıcı input'u direkt prompt'a ekleniyor. Kötü niyetli input ile AI manipüle edilebilir.

### 29. Pagination Limit Yok
**Dosya:** `backend/src/controllers/interview.controller.ts` (satır 388)
```typescript
take: Number(limit), // limit=1000000 olabilir!
```
**Risk:** DoS saldırısı, memory exhaustion.

### 30. Mock Database Hardcoded Değerler
**Dosya:** `backend/src/config/database.ts` (satır 277)
```typescript
const existing = {
  userId: 'user_1', // HARDCODED!
  aiCredits: 1000,
};
```

---

## EKSİK GÜVENLİK ÖNLEMLERİ

| Özellik | Durum |
|---------|-------|
| HTTPS Redirect | ❌ Yok |
| CSRF Token | ❌ Yok |
| Account Lockout | ❌ Yok (brute force koruması) |
| 2FA/MFA | ❌ Yok |
| Audit Logging | ❌ Yok |
| Row-Level Security (PostgreSQL) | ❌ Yok |
| HSTS Header | ❌ Yok |
| Login Attempt Tracking | ❌ Yok |
| API Key Rotation | ❌ Yok |

---

## ÖNCELİK SIRASI

### Hemen (24 Saat İçinde)
1. Anthropic API anahtarını iptal et ve yenisini oluştur
2. JWT secret'larını kriptografik olarak güçlü değerlerle değiştir
3. CORS'u düzelt (sadece izin verilen origin'ler)
4. .env dosyasını .gitignore'a ekle

### Bu Hafta
5. Auth endpoint'lerine rate limiting ekle
6. Token blacklist mekanizması (Redis) kur
7. Şifre politikasını güçlendir (min 12 karakter + complexity)
8. XSS açıklarını kapat (DOMPurify kullan)
9. localStorage yerine httpOnly cookie kullan

### Bu Ay
10. Email doğrulama sistemi ekle
11. Şifre sıfırlama mekanizması ekle
12. Transaction'ları implement et
13. N+1 query'leri optimize et
14. Eksik index'leri ekle
15. Console.log'ları temizle
16. Input validation ekle

### Gelecekte
17. 2FA/MFA ekle
18. Audit logging sistemi kur
19. Row-Level Security (PostgreSQL)
20. Monitoring ve alerting sistemi

---

## DOSYA REFERANSLARI

| Dosya | Kritik Sorun Sayısı |
|-------|---------------------|
| `backend/.env` | 3 (API key, JWT secrets) |
| `backend/src/server.ts` | 2 (CORS, CSP) |
| `backend/src/services/aiService.ts` | 3 (kredi, prompt injection, scraping) |
| `js/api-client.js` | 4 (hardcoded IP, duplicate, localStorage, validation) |
| `backend/src/controllers/auth.controller.ts` | 3 (logout, file upload, rate limit) |
| `backend/prisma/schema.prisma` | 3 (JSON fields, missing FK, missing indexes) |

---

## SONUÇ

Proje fonksiyonel durumda ve hem local hem EC2 ortamında çalışıyor. Ancak **kritik güvenlik açıkları** mevcut:

1. **API anahtarı ve JWT secret'ları açıkta** - Bu repository'yi gören herkes hesapları ele geçirebilir
2. **CORS tüm origin'lere açık** - CSRF saldırılarına tamamen açık
3. **Token güvenliği yetersiz** - XSS ile çalınabilir, logout'ta iptal edilmiyor
4. **Veritabanı işlemleri atomic değil** - Veri tutarsızlığı riski

**Öneri:** Production'a deploy etmeden önce en azından "Hemen" ve "Bu Hafta" kategorisindeki düzeltmeler yapılmalı.
