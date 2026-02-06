# Deployment Guide - TürkHost VPS

Bu doküman, CareerAI backend'ini TürkHost VPS üzerinde deploy etmek için adım adım talimatlar içerir.

## Gereksinimler

- TürkHost VPS (Ubuntu 20.04+ önerilir)
- Root veya sudo erişimi
- Domain adresi (örn: careerai.com)

## Adım 1: Sunucu Hazırlığı

### 1.1 Sistem Güncellemesi
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Node.js Kurulumu (v20+)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v20.x.x olmalı
```

### 1.3 PostgreSQL Kurulumu
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL kullanıcısı oluştur
sudo -u postgres psql
CREATE DATABASE careerai;
CREATE USER careerai_user WITH PASSWORD 'güvenli-şifre-buraya';
GRANT ALL PRIVILEGES ON DATABASE careerai TO careerai_user;
\q
```

### 1.4 PM2 Kurulumu
```bash
sudo npm install -g pm2
```

### 1.5 Nginx Kurulumu
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Adım 2: Proje Kurulumu

### 2.1 Proje Dosyalarını Yükle
```bash
# Git ile veya FTP ile dosyaları yükle
cd /var/www
sudo mkdir -p careerai
sudo chown -R $USER:$USER /var/www/careerai
cd careerai

# Proje dosyalarını buraya kopyala
```

### 2.2 Bağımlılıkları Yükle
```bash
cd backend
npm install
```

### 2.3 Environment Variables
```bash
cp .env.example .env
nano .env
```

`.env` dosyasını düzenle:
```env
NODE_ENV=production
PORT=3000
HOST=localhost

DATABASE_URL="postgresql://careerai_user:güvenli-şifre-buraya@localhost:5432/careerai?schema=public"

JWT_SECRET=çok-güvenli-jwt-secret-key-buraya
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=çok-güvenli-refresh-secret-buraya
JWT_REFRESH_EXPIRES_IN=30d

ANTHROPIC_API_KEY=your-anthropic-api-key-here

CORS_ORIGIN=https://careerai.com
```

### 2.4 Veritabanı Migration
```bash
npx prisma generate
npx prisma migrate deploy
```

## Adım 3: Build ve PM2

### 3.1 TypeScript Build
```bash
npm run build
```

### 3.2 PM2 ile Başlat
```bash
pm2 start dist/server.js --name careerai-backend
pm2 save
pm2 startup  # Sistem başlangıcında otomatik başlatma
```

### 3.3 PM2 Komutları
```bash
pm2 status          # Durum kontrolü
pm2 logs            # Logları görüntüle
pm2 restart careerai-backend  # Yeniden başlat
pm2 stop careerai-backend     # Durdur
```

## Adım 4: Nginx Yapılandırması

### 4.1 Nginx Config Dosyası
```bash
sudo nano /etc/nginx/sites-available/careerai
```

İçeriği:
```nginx
server {
    listen 80;
    server_name careerai.com www.careerai.com;

    # Frontend static files
    root /var/www/careerai/backend/public;
    index index.html;

    # API requests
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4.2 Nginx'i Aktif Et
```bash
sudo ln -s /etc/nginx/sites-available/careerai /etc/nginx/sites-enabled/
sudo nginx -t  # Yapılandırmayı test et
sudo systemctl reload nginx
```

## Adım 5: SSL Sertifikası (Let's Encrypt)

### 5.1 Certbot Kurulumu
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 SSL Sertifikası Al
```bash
sudo certbot --nginx -d careerai.com -d www.careerai.com
```

### 5.3 Otomatik Yenileme
```bash
sudo certbot renew --dry-run  # Test
# Otomatik yenileme zaten cron job olarak kurulur
```

## Adım 6: Firewall Yapılandırması

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Adım 7: Monitoring ve Logs

### 7.1 PM2 Monitoring
```bash
pm2 install pm2-logrotate  # Log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 7.2 Log Konumları
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Application logs: Winston ile yapılandırılabilir

## Adım 8: Güncelleme Süreci

```bash
cd /var/www/careerai/backend
git pull  # veya dosyaları güncelle
npm install
npm run build
npx prisma migrate deploy  # Gerekirse
pm2 restart careerai-backend
```

## Sorun Giderme

### Backend çalışmıyor
```bash
pm2 logs careerai-backend
pm2 restart careerai-backend
```

### Database bağlantı hatası
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Nginx hataları
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## Güvenlik Notları

1. **.env dosyasını asla commit etmeyin**
2. **JWT secret'ları güçlü ve rastgele oluşturun**
3. **PostgreSQL şifresini güçlü yapın**
4. **Firewall'u aktif tutun**
5. **Düzenli güncellemeler yapın**
6. **SSL sertifikasını yenilemeyi unutmayın**

## Performans Optimizasyonu

- Nginx caching eklenebilir
- CDN kullanılabilir (Cloudflare)
- Database connection pooling (Prisma otomatik yapar)
- PM2 cluster mode (çoklu instance)









