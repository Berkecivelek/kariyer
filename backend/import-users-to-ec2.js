// EC2'ye kullanıcıları import et
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
        // Upsert: Varsa güncelle, yoksa oluştur
        const result = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            // Sadece şifre ve temel bilgileri güncelle
            password: user.password, // Hash'i olduğu gibi kopyala
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            profession: user.profession,
            bio: user.bio,
            profilePhotoUrl: user.profilePhotoUrl,
            language: user.language,
            timezone: user.timezone,
            updatedAt: new Date()
          },
          create: {
            id: user.id, // ID'yi de koru
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            profession: user.profession,
            bio: user.bio,
            profilePhotoUrl: user.profilePhotoUrl,
            language: user.language,
            timezone: user.timezone,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        
        // Hangi işlem yapıldı?
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { createdAt: true }
        });
        
        if (existing && new Date(existing.createdAt).getTime() === new Date(user.createdAt).getTime()) {
          updated++;
          console.log(`  🔄 Güncellendi: ${user.email}`);
        } else {
          imported++;
          console.log(`  ✅ İçe aktarıldı: ${user.email}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Hata (${user.email}):`, error.message);
        skipped++;
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`  ✅ İçe aktarıldı: ${imported}`);
    console.log(`  🔄 Güncellendi: ${updated}`);
    console.log(`  ⏭️  Atlandı: ${skipped}`);
    
    // Final kontrol
    const totalUsers = await prisma.user.count();
    console.log(`\n✅ Toplam kullanıcı sayısı: ${totalUsers}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
})();

