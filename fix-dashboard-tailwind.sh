#!/bin/bash

FILE="backend/public/dashboard.html"

# Backup
cp "$FILE" "$FILE.bak"

# tailwind.config script bloğunu kaldır (daha güçlü pattern)
perl -i -0pe 's|<script>.*?tailwind\.config\s*=\s*\{.*?\}.*?</script>||gs' "$FILE"

echo "✅ Dashboard tailwind.config kaldırıldı"
