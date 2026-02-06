#!/bin/bash

# Backend public HTML dosyalarındaki inline tailwind.config bloklarını kaldır
find backend/public -name "*.html" | while read file; do
    if grep -q "tailwind.config" "$file"; then
        echo "Düzeltiliyor: $file"
        # tailwind.config script bloğunu tamamen kaldır
        perl -i -0pe 's|<script id="tailwind-config">.*?</script>||gs' "$file"
    fi
done

echo "✅ Backend public HTML dosyaları temizlendi!"
