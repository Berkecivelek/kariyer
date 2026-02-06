# CV Builder State Persistence Fixes - EC2 Deploy Talimatları

## Değiştirilen Dosyalar

1. `js/cv-template-renderer.js` - getDataWithExamples() ve modern template render düzeltmeleri
2. `cv-live-preview.js` - saveData() ve updatePreview() debug logları
3. `js/cv-data-loader.js` - Sayfa geçişlerinde localStorage temizleme sorununu düzelttim

## EC2 Deploy Adımları

### 1. Dosyaları EC2'ye Kopyala

```bash
# Ana dizine kopyala
scp js/cv-template-renderer.js ubuntu@16.170.227.182:/home/ubuntu/kariyer/js/cv-template-renderer.js
scp cv-live-preview.js ubuntu@16.170.227.182:/home/ubuntu/kariyer/cv-live-preview.js
scp js/cv-data-loader.js ubuntu@16.170.227.182:/home/ubuntu/kariyer/js/cv-data-loader.js
```

### 2. Backend/public Klasörüne Kopyala

SSH ile EC2'ye bağlanın:

```bash
ssh ubuntu@16.170.227.182
```

Sonra şu komutları çalıştırın:

```bash
# Backend/public klasörüne kopyala
sudo cp /home/ubuntu/kariyer/js/cv-template-renderer.js /home/ubuntu/kariyer/backend/public/js/cv-template-renderer.js
sudo cp /home/ubuntu/kariyer/cv-live-preview.js /home/ubuntu/kariyer/backend/public/cv-live-preview.js
sudo cp /home/ubuntu/kariyer/js/cv-data-loader.js /home/ubuntu/kariyer/backend/public/js/cv-data-loader.js

# Nginx'i reload et
sudo systemctl reload nginx
```

### 3. Dosya Kontrolü

```bash
# Dosyaların kopyalandığını kontrol et
ls -lh /home/ubuntu/kariyer/js/cv-template-renderer.js
ls -lh /home/ubuntu/kariyer/cv-live-preview.js
ls -lh /home/ubuntu/kariyer/js/cv-data-loader.js
ls -lh /home/ubuntu/kariyer/backend/public/js/cv-template-renderer.js
ls -lh /home/ubuntu/kariyer/backend/public/cv-live-preview.js
ls -lh /home/ubuntu/kariyer/backend/public/js/cv-data-loader.js
```

## Yapılan Düzeltmeler

### 1. js/cv-template-renderer.js
- `getDataWithExamples()` fonksiyonu doğrudan localStorage'dan okuyor
- `modern` template render'da data parametresi kontrolü eklendi
- `profession` için özel debug logları eklendi

### 2. cv-live-preview.js
- `saveData()` fonksiyonuna debug logları eklendi
- `updatePreview()` fonksiyonuna debug logları eklendi
- `profession` için özel kontrol eklendi

### 3. js/cv-data-loader.js
- Sayfa geçişlerinde localStorage temizleme sorunu düzeltildi
- Eğer localStorage'da veri varsa ve `isSampleData: false` ise, veriler korunuyor
- Sadece ilk kez CV oluşturuluyorsa (localStorage boşsa) temizleniyor

## Test

Deploy sonrası test edin:
1. Kişisel Bilgiler sayfasında telefon ve meslek girin
2. "Devam Et" butonuna tıklayın
3. Ön Yazı sayfasında CV önizlemede telefon ve meslek görünmeli
4. Console'da "CV Builder: Mevcut veriler korunuyor" logu görünmeli

