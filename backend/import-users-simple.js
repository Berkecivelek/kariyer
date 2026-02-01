// Basit kullanıcı import script'i (profilePhotoUrl olmadan)
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📥 Kullanıcılar import ediliyor...\n');
    
    const filePath = path.join(__dirname, 'local_users_export.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ local_users_export.json dosyası bulunamadı!');
      process.exit(1);
    }
    
    const localUsers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`📊 ${localUsers.length} kullanıcı import edilecek\n`);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const user of localUsers) {
      try {
        // Sadece mevcut alanları kullan
        const updateData = {
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          profession: user.profession || null,
          bio: user.bio || null,
          language: user.language || 'tr',
          timezone: user.timezone || 'Europe/Istanbul',
          updatedAt: new Date()
        };
        
        const createData = {
          id: user.id,
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          profession: user.profession || null,
          bio: user.bio || null,
          language: user.language || 'tr',
          timezone: user.timezone || 'Europe/Istanbul',
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        };
        
        const result = await prisma.user.upsert({
          where: { email: user.email },
          update: updateData,
          create: createData
        });
        
        // Kontrol et
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { createdAt: true }
        });
        
        if (existing && Math.abs(new Date(existing.createdAt).getTime() - new Date(user.createdAt).getTime()) < 1000) {
          updated++;
          console.log(`  🔄 Güncellendi: ${user.email}`);
        } else {
          imported++;
          console.log(`  ✅ İçe aktarıldı: ${user.email}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Hata (${user.email}):`, error.message.substring(0, 100));
        skipped++;
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`  ✅ İçe aktarıldı: ${imported}`);
    console.log(`  🔄 Güncellendi: ${updated}`);
    console.log(`  ⏭️  Atlandı: ${skipped}`);
    
    const totalUsers = await prisma.user.count();
    console.log(`\n✅ Toplam kullanıcı sayısı: ${totalUsers}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
})();

