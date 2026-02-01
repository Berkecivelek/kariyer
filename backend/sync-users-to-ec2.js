// Local database'deki kullanıcıları EC2'ye senkronize et
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📊 Local kullanıcıları alınıyor...');
    
    const localUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        profession: true,
        bio: true,
        profilePhotoUrl: true,
        language: true,
        timezone: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`✅ ${localUsers.length} kullanıcı bulundu\n`);
    
    // JSON olarak kaydet
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'local_users_export.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(localUsers, null, 2));
    
    console.log(`✅ Kullanıcılar export edildi: ${outputPath}`);
    console.log(`\n📋 Export edilen kullanıcılar:`);
    localUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (${u.firstName} ${u.lastName})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
})();

