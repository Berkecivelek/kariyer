# CareerAI Backend

AI destekli profesyonel CV oluşturucu backend servisi.

## Teknolojiler

- **Node.js** + **Express.js** (TypeScript)
- **PostgreSQL** + **Prisma ORM**
- **Anthropic Claude API** (AI entegrasyonu)
- **Puppeteer** (PDF generation)

## Kurulum

### Gereksinimler

- Node.js 20+
- PostgreSQL 14+
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

3. Veritabanını oluşturun ve migrate edin:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Development modunda çalıştırın:
```bash
npm run dev
```

5. Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış

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
- `POST /api/ai/analyze` - CV analizi ve puanlama
- `POST /api/ai/optimize` - Optimizasyon önerileri

## Veritabanı

Prisma Studio ile veritabanını görüntüleyin:
```bash
npm run prisma:studio
```

## Environment Variables

Gerekli environment değişkenleri `.env.example` dosyasında bulunmaktadır.







