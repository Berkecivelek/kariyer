#!/bin/bash
# CV Builder State Persistence Fixes - EC2 Deploy Script

echo "🚀 CV Builder State Persistence Fixes - EC2 Deploy Başlatılıyor..."
echo ""

# Değiştirilen dosyalar
FILES=(
    "js/cv-template-renderer.js"
    "cv-live-preview.js"
    "js/cv-data-loader.js"
)

# EC2 bilgileri
EC2_HOST="16.170.227.182"
EC2_USER="ubuntu"
EC2_BASE="/home/ubuntu/kariyer"

echo "📦 Deploy edilecek dosyalar:"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (BULUNAMADI!)"
        exit 1
    fi
done

echo ""
echo "📤 Dosyalar EC2'ye kopyalanıyor..."
echo ""

# Her dosyayı EC2'ye kopyala
for file in "${FILES[@]}"; do
    echo "  📤 $file → $EC2_HOST:$EC2_BASE/$file"
    scp -o StrictHostKeyChecking=no "$file" "$EC2_USER@$EC2_HOST:$EC2_BASE/$file"
    
    if [ $? -eq 0 ]; then
        echo "    ✅ Başarılı"
    else
        echo "    ❌ HATA! Manuel olarak kopyalayın:"
        echo "       scp $file $EC2_USER@$EC2_HOST:$EC2_BASE/$file"
    fi
done

echo ""
echo "📋 Backend/public klasörüne kopyalama komutları:"
echo ""
echo "SSH ile EC2'ye bağlanın ve şu komutları çalıştırın:"
echo ""
for file in "${FILES[@]}"; do
    filename=$(basename "$file")
    dirname=$(dirname "$file" | sed 's|^js/||')
    if [ "$dirname" = "js" ]; then
        echo "sudo cp $EC2_BASE/$file $EC2_BASE/backend/public/js/$filename"
    else
        echo "sudo cp $EC2_BASE/$file $EC2_BASE/backend/public/$filename"
    fi
done
echo ""
echo "sudo systemctl reload nginx"
echo ""
echo "✅ Deploy script tamamlandı!"
