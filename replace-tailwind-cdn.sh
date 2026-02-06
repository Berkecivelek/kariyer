#!/bin/bash
# Tailwind CDN linklerini build edilmiş CSS ile değiştir
find . -name "*.html" -type f ! -path "./backend/*" ! -path "./node_modules/*" | while read file; do
    if grep -q "cdn.tailwindcss" "$file"; then
        # CDN script ve tailwind-config script'ini kaldır, CSS link ekle
        sed -i '' '/cdn.tailwindcss/d' "$file"
        sed -i '' '/tailwind-config/,/<\/script>/d' "$file"
        # Tailwind CSS link'ini ekle (eğer yoksa)
        if ! grep -q "css/tailwind.css" "$file"; then
            # </head> tag'inden önce ekle
            sed -i '' '/<\/head>/i\
<!-- Tailwind CSS -->\
<link rel="stylesheet" href="css/tailwind.css">
' "$file"
        fi
        echo "✅ Güncellendi: $file"
    fi
done
