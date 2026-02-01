#!/bin/bash

# CareerAI EC2 Deploy Script
# Kullanım: ./deploy.sh

set -e  # Hata durumunda dur

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfigürasyon
EC2_IP="16.170.227.182"
EC2_USER="ubuntu"
EC2_KEY="/Users/berkecenkcivelek/Desktop/kariyer/careerai.pem"
EC2_PROJECT_DIR="/home/ubuntu/kariyer"
LOCAL_PROJECT_DIR="/Users/berkecenkcivelek/Desktop/kariyer"

echo -e "${GREEN}🚀 CareerAI EC2 Deploy Script Başlatılıyor...${NC}"
echo ""

# 1. Git durumunu kontrol et
echo -e "${YELLOW}📋 1. Git durumu kontrol ediliyor...${NC}"
cd "$LOCAL_PROJECT_DIR"

# Değişiklik var mı kontrol et
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Değişiklikler var. Commit edilsin mi? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Commit mesajı girin:"
        read -r commit_msg
        git add -A
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Değişiklikler commit edildi${NC}"
    fi
fi

# 2. Git push
echo -e "${YELLOW}📤 2. Git push yapılıyor...${NC}"
git push
echo -e "${GREEN}✅ Git push tamamlandı${NC}"
echo ""

# 3. EC2'ye bağlan ve deploy
echo -e "${YELLOW}🔌 3. EC2'ye bağlanılıyor...${NC}"
ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'ENDSSH'
    set -e
    
    echo "📁 Proje dizinine gidiliyor..."
    cd /home/ubuntu/kariyer
    
    echo "🔄 Git pull yapılıyor..."
    git stash 2>/dev/null || true
    git pull
    
    echo "📦 Dependencies güncelleniyor..."
    cd backend
    npm install
    
    echo "🔨 Backend build yapılıyor..."
    npm run build || echo "⚠️  Build hatası var ama devam ediliyor..."
    
    echo "🔄 PM2 restart yapılıyor..."
    pm2 restart careerai-backend || pm2 start dist/server.js --name careerai-backend
    pm2 save
    
    echo "🔄 Nginx reload yapılıyor..."
    sudo systemctl reload nginx
    
    echo "✅ Deploy tamamlandı!"
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    
    echo ""
    echo "🔍 Backend Health Check:"
    sleep 2
    curl -s http://localhost:3000/api/health || echo "⚠️  Health check başarısız"
ENDSSH

echo ""
echo -e "${GREEN}✅ Deploy işlemi tamamlandı!${NC}"
echo ""
echo "🌐 Site: http://$EC2_IP"
echo "📊 PM2 Logları: ssh -i $EC2_KEY $EC2_USER@$EC2_IP 'pm2 logs careerai-backend'"

