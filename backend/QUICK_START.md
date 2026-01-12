# CareerAI Backend - Hızlı Başlangıç

## Hızlı Kurulum

### 1. Bağımlılıkları Yükle
```bash
cd backend
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# .env dosyasını düzenle ve gerekli değerleri gir
```

### 3. PostgreSQL Veritabanı
```bash
# PostgreSQL'de veritabanı oluştur
createdb careerai

# Prisma migration çalıştır
npx prisma migrate dev
npx prisma generate
```

### 4. Development Server
```bash
npm run dev
```

Server `http://localhost:3000` adresinde çalışacak.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Resumes
- `GET /api/resumes` - Tüm CV'ler
- `POST /api/resumes` - Yeni CV oluştur
- `GET /api/resumes/:id` - CV detayı
- `PUT /api/resumes/:id` - CV güncelle
- `DELETE /api/resumes/:id` - CV sil
- `GET /api/resumes/:id/pdf` - PDF indir

### AI Services
- `POST /api/ai/summary` - Özet önerisi
- `POST /api/ai/experience` - Deneyim açıklaması
- `POST /api/ai/education` - Eğitim açıklaması
- `POST /api/ai/analyze` - CV analizi
- `POST /api/ai/optimize` - CV optimizasyonu

### Cover Letters
- `GET /api/cover-letters` - Tüm ön yazılar
- `POST /api/cover-letters` - Yeni ön yazı
- `PUT /api/cover-letters/:id` - Ön yazı güncelle
- `DELETE /api/cover-letters/:id` - Ön yazı sil

### Portfolios
- `GET /api/portfolios` - Tüm portfolyolar
- `POST /api/portfolios` - Yeni portfolyo
- `PUT /api/portfolios/:id` - Portfolyo güncelle
- `DELETE /api/portfolios/:id` - Portfolyo sil

## Frontend Entegrasyonu

Frontend dosyaları `backend/public/` klasöründe. API client `backend/public/js/api-client.js` dosyasında.

### Kullanım Örneği
```javascript
// API client kullanımı
await window.apiClient.login('email@example.com', 'password');
const resumes = await window.apiClient.getResumes();
await window.apiClient.downloadPDF(resumeId);
```

## Test

```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Production Build

```bash
npm run build
npm start
```

## Sorun Giderme

### Database bağlantı hatası
- `.env` dosyasındaki `DATABASE_URL` değerini kontrol et
- PostgreSQL'in çalıştığından emin ol: `sudo systemctl status postgresql`

### Prisma hataları
```bash
npx prisma generate
npx prisma migrate reset  # Dikkat: Tüm verileri siler
```

### Port zaten kullanılıyor
- `.env` dosyasında `PORT` değerini değiştir
- Veya kullanan process'i bul: `lsof -i :3000`






