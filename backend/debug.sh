#!/bin/bash

# CareerAI EC2 Debug Script
# Kullanım: ./debug.sh

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 CareerAI EC2 Debug Script${NC}"
echo "=================================="
echo ""

# 1. Environment Variables Kontrolü
echo -e "${YELLOW}📋 1. Environment Variables Kontrolü${NC}"
cd /home/ubuntu/kariyer/backend

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env dosyası bulundu${NC}"
    echo ""
    echo "Önemli değişkenler:"
    grep -E "DATABASE_URL|NODE_ENV|PORT|JWT_SECRET|ANTHROPIC_API_KEY" .env | sed 's/=.*/=***/' || echo "Bazı değişkenler bulunamadı"
else
    echo -e "${RED}❌ .env dosyası bulunamadı!${NC}"
fi
echo ""

# 2. Database Bağlantısı Testi
echo -e "${YELLOW}📊 2. Database Bağlantısı Testi${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.\$connect();
    console.log('✅ Database bağlantısı başarılı');
    
    const userCount = await prisma.user.count();
    console.log('📊 Toplam kullanıcı sayısı:', userCount);
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Database hatası:', error.message);
    process.exit(1);
  }
})();
" || echo -e "${RED}❌ Database bağlantısı başarısız${NC}"
echo ""

# 3. Kullanıcı Kontrolü
echo -e "${YELLOW}👤 3. Kullanıcı Kontrolü (berkecenkcivelek@gmail.com)${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'berkecenkcivelek@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: false
      }
    });
    
    if (user) {
      console.log('✅ Kullanıcı bulundu:');
      console.log('   Email:', user.email);
      console.log('   İsim:', user.firstName || 'N/A', user.lastName || '');
      console.log('   ID:', user.id);
    } else {
      console.log('⚠️  Kullanıcı bulunamadı: berkecenkcivelek@gmail.com');
      console.log('');
      console.log('📋 Mevcut kullanıcılar (ilk 5):');
      const users = await prisma.user.findMany({
        take: 5,
        select: { email: true, firstName: true }
      });
      users.forEach((u, i) => {
        console.log(\`   \${i+1}. \${u.email} (\${u.firstName || 'N/A'})\`);
      });
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
})();
"
echo ""

# 4. Şifre Hash Kontrolü
echo -e "${YELLOW}🔐 4. Şifre Hash Kontrolü${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'berkecenkcivelek@gmail.com' },
      select: { password: true }
    });
    
    if (user) {
      const hash = user.password;
      console.log('Hash formatı:', hash.substring(0, 7));
      console.log('Hash uzunluğu:', hash.length);
      
      if (hash.startsWith('\$2a\$') || hash.startsWith('\$2b\$')) {
        console.log('✅ Bcrypt hash formatı doğru');
      } else {
        console.log('⚠️  Hash formatı beklenmedik');
      }
    } else {
      console.log('⚠️  Kullanıcı bulunamadı, hash kontrolü yapılamadı');
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
})();
"
echo ""

# 5. API Endpoint Testleri
echo -e "${YELLOW}🌐 5. API Endpoint Testleri${NC}"

# Health check
echo "Health Check:"
HEALTH=$(curl -s http://localhost:3000/api/health || echo "FAILED")
if [[ "$HEALTH" == *"status"* ]]; then
    echo -e "${GREEN}✅ Health endpoint çalışıyor${NC}"
    echo "$HEALTH" | head -1
else
    echo -e "${RED}❌ Health endpoint çalışmıyor${NC}"
fi
echo ""

# Login endpoint test (yanlış şifre ile)
echo "Login Endpoint Test (test amaçlı):"
LOGIN_TEST=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' || echo "FAILED")

if [[ "$LOGIN_TEST" == *"Invalid email or password"* ]]; then
    echo -e "${GREEN}✅ Login endpoint çalışıyor (beklenen hata)${NC}"
elif [[ "$LOGIN_TEST" == *"success"* ]]; then
    echo -e "${YELLOW}⚠️  Login başarılı (test kullanıcısı)${NC}"
else
    echo -e "${RED}❌ Login endpoint çalışmıyor${NC}"
    echo "Response: $LOGIN_TEST"
fi
echo ""

# 6. PM2 Status
echo -e "${YELLOW}⚙️  6. PM2 Status${NC}"
pm2 status | grep careerai || echo -e "${RED}❌ PM2 process bulunamadı${NC}"
echo ""

# 7. PM2 Logs (Son 50 satır)
echo -e "${YELLOW}📝 7. PM2 Logs (Son 50 satır)${NC}"
echo "---"
pm2 logs careerai-backend --lines 50 --nostream | tail -50 || echo "Log bulunamadı"
echo "---"
echo ""

# 8. Nginx Status
echo -e "${YELLOW}🌐 8. Nginx Status${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx çalışıyor${NC}"
else
    echo -e "${RED}❌ Nginx çalışmıyor${NC}"
fi
echo ""

# 9. Port Kontrolü
echo -e "${YELLOW}🔌 9. Port Kontrolü${NC}"
if netstat -tuln | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000 dinleniyor${NC}"
    netstat -tuln | grep ":3000"
else
    echo -e "${RED}❌ Port 3000 dinlenmiyor${NC}"
fi
echo ""

# 10. API Client BaseURL Kontrolü
echo -e "${YELLOW}🔗 10. Frontend API Client Kontrolü${NC}"
if [ -f /home/ubuntu/kariyer/js/api-client.js ]; then
    if grep -q "detectBaseURL\|16.170.227.182" /home/ubuntu/kariyer/js/api-client.js; then
        echo -e "${GREEN}✅ API client EC2 IP desteği var${NC}"
    else
        echo -e "${YELLOW}⚠️  API client EC2 IP desteği yok${NC}"
    fi
else
    echo -e "${RED}❌ API client dosyası bulunamadı${NC}"
fi
echo ""

# 11. Özet
echo -e "${BLUE}📊 ÖZET${NC}"
echo "=================================="
echo ""
echo "✅ Kontroller tamamlandı!"
echo ""
echo "💡 Sonraki Adımlar:"
echo "  1. Browser'da http://16.170.227.182 adresine gidin"
echo "  2. F12 ile Developer Tools açın"
echo "  3. Console ve Network tab'larını kontrol edin"
echo "  4. Giriş yapmayı deneyin"
echo "  5. Network tab'da /api/auth/login isteğini kontrol edin"
echo "  6. Response status ve body'yi kontrol edin"
echo ""
echo "📝 PM2 loglarını canlı izlemek için:"
echo "  pm2 logs careerai-backend --lines 100 -f"
echo ""

