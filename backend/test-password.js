// Şifre test script'i
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'berkecenkcivelek@gmail.com' },
      select: { password: true, email: true }
    });

    if (!user) {
      console.log('❌ Kullanıcı bulunamadı');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Kullanıcı bulundu:', user.email);
    console.log('Hash:', user.password.substring(0, 30) + '...');

    // Test şifreleri
    const testPasswords = [
      'test123',
      'Test123',
      'Test123!',
      'berkecenk',
      'BerkeCenk',
      'Berke123',
      'berke123'
    ];

    console.log('\n🔐 Şifre testleri:');
    for (const pwd of testPasswords) {
      try {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`✅ Şifre bulundu: "${pwd}"`);
          break;
        } else {
          console.log(`❌ "${pwd}" eşleşmedi`);
        }
      } catch (error) {
        console.log(`⚠️  "${pwd}" test edilirken hata:`, error.message);
      }
    }

    // Şifre hash'ini yeniden oluştur (test için)
    console.log('\n💡 Yeni şifre hash oluşturma (test amaçlı):');
    const newHash = await bcrypt.hash('test123', 10);
    console.log('Yeni hash (test123 için):', newHash.substring(0, 30) + '...');
    
    const newHashMatch = await bcrypt.compare('test123', newHash);
    console.log('Yeni hash test:', newHashMatch ? '✅ Eşleşti' : '❌ Eşleşmedi');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();

