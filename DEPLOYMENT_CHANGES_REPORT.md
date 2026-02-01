# Deploy İşlemleri ve URL Değişiklikleri Detaylı Rapor

## 📋 Özet
Bu rapor, son deploy işlemlerinde ve öncesinde yapılan tüm URL ve yapılandırma değişikliklerini detaylı olarak açıklamaktadır.

---

## 🔄 1. API Client BaseURL Değişiklikleri

### Önceki Durum
- API Client sabit bir baseURL kullanıyordu: `${window.location.origin}/api`
- EC2 için özel bir kontrol yoktu

### Yeni Durum (Değişiklikler)
**Dosya:** `js/api-client.js` ve `backend/public/js/api-client.js`

**Değişiklikler:**
1. **Constructor Değişikliği:**
   ```javascript
   // ÖNCE:
   constructor(baseURL = `${window.location.origin}/api`) {
     this.baseURL = baseURL;
   }
   
   // SONRA:
   constructor(baseURL = null) {
     this.baseURL = baseURL || this.detectBaseURL();
     this.loadTokens(); // Token yükleme eklendi
   }
   ```

2. **Yeni `detectBaseURL()` Metodu Eklendi:**
   ```javascript
   detectBaseURL() {
     // 1. Environment variable kontrolü
     if (typeof window !== 'undefined' && window.API_BASE_URL) {
       return window.API_BASE_URL;
     }
     
     const hostname = window.location.hostname;
     const protocol = window.location.protocol;
     
     // 2. EC2 IP kontrolü (YENİ)
     if (hostname === '16.170.227.182' || hostname.includes('16.170.227.182')) {
       return `${protocol}//${hostname}/api`;
     }
     
     // 3. Localhost kontrolü
     if (hostname === 'localhost' || hostname === '127.0.0.1') {
       return 'http://localhost:3000/api';
     }
     
     // 4. Diğer durumlar
     return `${protocol}//${hostname}/api`;
   }
   ```

3. **Token Yönetimi Eklendi:**
   - `loadTokens()` metodu eklendi
   - Token geçerlilik kontrolü eklendi
   - Otomatik token temizleme eklendi

**Etkisi:**
- ✅ EC2'de (`16.170.227.182`) otomatik olarak `http://16.170.227.182/api` kullanılır
- ✅ Localhost'ta `http://localhost:3000/api` kullanılır

---

## 🔧 2. Backend Server.ts Değişiklikleri

### Yeni Eklenenler

**Dosya:** `backend/src/server.ts`

**Değişiklikler:**

1. **Static File Serving:**
   ```typescript
   // ÖNCE: Sadece project root serve ediliyordu
   app.use(express.static(projectRoot));
   
   // SONRA: İki ayrı static serving eklendi
   app.use(express.static(projectRoot)); // Frontend dosyaları
   app.use('/uploads', express.static(uploadsDir)); // Upload edilen dosyalar
   ```

2. **Uploads Dizini:**
   ```typescript
   const backendPublicDir = path.resolve(backendDir, 'public');
   const uploadsDir = path.join(backendPublicDir, 'uploads');
   console.log('📁 Serving uploaded files from:', uploadsDir);
   app.use('/uploads', express.static(uploadsDir));
   ```

**Etkisi:**
- ✅ Profil fotoğrafları `/uploads/profiles/...` URL'i ile erişilebilir
- ✅ Backend direkt olarak upload edilen dosyaları serve eder

---

## 🌐 3. Nginx Yapılandırması (SORUN TESPİT EDİLDİ)

### Mevcut Nginx Config
**Dosya:** `/etc/nginx/sites-available/careerai`
**Durum:** ✅ Aktif (symlink var)

**Mevcut Config:**
```nginx
server {
    listen 80;
    server_name 16.170.227.182;

    # Frontend files
    root /home/ubuntu/kariyer;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads folder
    location /uploads/ {
        alias /home/ubuntu/kariyer/backend/uploads/;
        autoindex off;
    }
}
```

### ⚠️ TESPİT EDİLEN SORUNLAR

#### Sorun 1: Trailing Slash Uyumsuzluğu
**Durum:** ❌ KRİTİK
**Açıklama:** 
- Nginx: `location /api/` (trailing slash ile)
- Frontend: `/api/auth/login` (trailing slash olmadan)
- Nginx trailing slash'i kaldırmıyor, bu yüzden `/api/auth/login` → `/api//auth/login` olabilir

**Çözüm:**
```nginx
# ÖNCE:
location /api/ {
    proxy_pass http://localhost:3000;
}

# SONRA:
location /api {
    proxy_pass http://localhost:3000/api;
    # veya
    proxy_pass http://localhost:3000/;
}
```

#### Sorun 2: Uploads Dizini Uyumsuzluğu
**Durum:** ⚠️ ORTA
**Açıklama:**
- Nginx: `alias /home/ubuntu/kariyer/backend/uploads/;`
- Backend: `/home/ubuntu/kariyer/backend/public/uploads/`
- Dizin yolu yanlış!

**Çözüm:**
```nginx
location /uploads/ {
    alias /home/ubuntu/kariyer/backend/public/uploads/;
    autoindex off;
}
```

#### Sorun 3: Proxy Pass URL
**Durum:** ⚠️ ORTA
**Açıklama:**
- `proxy_pass http://localhost:3000;` kullanılıyor
- Trailing slash olmadan `/api/` location'ı kullanılırsa, path kaybolabilir

**Test Sonuçları:**
- ✅ `/api/health` → Backend'e ulaşıyor (200 OK)
- ❌ `/api/auth/login` → 404 Not Found
- **Neden:** Trailing slash sorunu

---

## 📁 4. Dosya Yapısı Değişiklikleri

### Yeni Eklenen Dosyalar
1. `js/profile-photo-manager.js` - Global profil fotoğrafı yönetimi
2. `js/notification.js` - Toast notification sistemi
3. `js/i18n.js` - Internationalization sistemi
4. `js/i18n-helper.js` - i18n helper fonksiyonları

### Değiştirilen Dosyalar
1. `js/api-client.js` - BaseURL tespiti eklendi
2. `backend/public/js/api-client.js` - BaseURL tespiti eklendi
3. `backend/src/server.ts` - Uploads static serving eklendi
4. `cv-olusturucu-kisisel-bilgiler.html` - Profil fotoğrafı yükleme
5. `profil-ayarlari.html` - Profil fotoğrafı yükleme
6. `dashboard.html` - Profil fotoğrafı görüntüleme

---

## ⚠️ 5. Giriş Yapamama Sorunu Analizi

### Test Sonuçları

1. **Backend Health Check:**
   ```bash
   curl http://16.170.227.182/api/health
   # Sonuç: ✅ {"status":"ok",...}
   ```

2. **API Login Test:**
   ```bash
   curl -X POST http://16.170.227.182/api/auth/login
   # Sonuç: ❌ 404 Not Found
   ```

3. **Backend Direkt Test:**
   ```bash
   curl http://localhost:3000/api/health
   # Sonuç: ✅ Backend çalışıyor
   ```

### Olası Nedenler

1. **Nginx Trailing Slash Sorunu (EN MUHTEMEL):**
   - `location /api/` trailing slash ile tanımlı
   - Frontend `/api/auth/login` gönderiyor (trailing slash yok)
   - Nginx path'i yanlış yönlendiriyor

2. **Proxy Pass URL Sorunu:**
   - `proxy_pass http://localhost:3000;` kullanılıyor
   - `/api/` location'ı ile birlikte path kaybolabilir

3. **CORS Sorunu:**
   - Backend CORS ayarları kontrol edilmeli
   - `CORS_ORIGIN` environment variable kontrol edilmeli

---

## 🛠️ 6. Çözüm Adımları

### Adım 1: Nginx Config Düzelt

```bash
sudo nano /etc/nginx/sites-available/careerai
```

**Düzeltilmiş Config:**
```nginx
server {
    listen 80;
    server_name 16.170.227.182;

    # Frontend files
    root /home/ubuntu/kariyer;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy - DÜZELTME: Trailing slash kaldırıldı
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads folder - DÜZELTME: Doğru dizin yolu
    location /uploads {
        alias /home/ubuntu/kariyer/backend/public/uploads;
        autoindex off;
    }
}
```

### Adım 2: Nginx Test ve Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Adım 3: Test
```bash
# Health check
curl http://16.170.227.182/api/health

# Login test
curl -X POST http://16.170.227.182/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## 📊 7. Değişiklik Özeti Tablosu

| Dosya | Değişiklik Tipi | Etki | Durum |
|-------|----------------|------|-------|
| `js/api-client.js` | BaseURL tespiti eklendi | ✅ EC2 otomatik tespit | ✅ Çalışıyor |
| `backend/src/server.ts` | Uploads static serving | ✅ Profil fotoğrafları | ✅ Çalışıyor |
| `backend/public/js/api-client.js` | BaseURL tespiti | ✅ EC2 otomatik tespit | ✅ Çalışıyor |
| Nginx Config | **Trailing slash sorunu** | ❌ API route 404 | ❌ Düzeltilmeli |
| Nginx Config | **Uploads dizin yolu** | ⚠️ Profil fotoğrafları | ⚠️ Düzeltilmeli |

---

## ✅ Sonuç ve Öneriler

### Acil Düzeltmeler
1. **KRİTİK:** Nginx `/api` location'ından trailing slash kaldırılmalı
2. **ÖNEMLİ:** `proxy_pass` URL'i düzeltilmeli: `http://localhost:3000/api`
3. **ÖNEMLİ:** Uploads dizin yolu düzeltilmeli: `/backend/public/uploads`

### Test Edilmesi Gerekenler
1. ✅ Backend çalışıyor
2. ✅ Nginx çalışıyor
3. ❌ API route'ları 404 döner (trailing slash sorunu)
4. ⚠️ Uploads route test edilmeli

### En Kritik Sorun
**Nginx'te `/api/` location'ı trailing slash ile tanımlı, bu yüzden `/api/auth/login` gibi istekler 404 döner. Trailing slash kaldırılmalı ve `proxy_pass` URL'i düzeltilmeli.**

---

## 📝 Notlar

- Backend sağlıklı çalışıyor (PM2: online, Health check: OK)
- Frontend dosyaları doğru dizinde (`/home/ubuntu/kariyer`)
- Nginx config genel olarak doğru, sadece trailing slash ve proxy_pass URL'i düzeltilmeli
- Uploads dizin yolu yanlış, düzeltilmeli
