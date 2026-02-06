#!/bin/bash

FILE="cv-olusturucu-egitim.html"

# Backup
cp "$FILE" "$FILE.backup"

# 1. Main container'a relative ve pb-24 ekle
perl -i -pe 's|<div class="flex flex-1 overflow-hidden relative">|<div class="flex flex-1 overflow-hidden relative pb-24">|' "$FILE"

# 2. Bottom navigation'ı absolute'dan fixed'e çevir ve z-index artır
perl -i -0pe 's|<!-- Fixed Bottom Navigation -->.*?<div class="absolute bottom-0 left-0 right-0|<!-- Fixed Bottom Navigation -->\n<div class="fixed bottom-0 left-0 right-0|s' "$FILE"

# 3. z-20'yi z-50 yap
perl -i -pe 's|z-20 shadow-\[0_-4px_6px_-1px_rgba|z-50 shadow-[0_-4px_6px_-1px_rgba|' "$FILE"

# 4. xl:left-72 ekle (sidebar genişliği kadar kaydır)
perl -i -pe 's|(z-50 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.05\)\])|\1 xl:left-64|' "$FILE"

echo "✅ Eğitim sayfası layout düzeltildi"
