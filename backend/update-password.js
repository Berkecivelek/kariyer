// Şifre güncelleme script'i
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePassword() {
  const email = 'berkecenkcivelek@gmail.com';
  const newPassword = 'Berke2026!';
  
  try {
    console.log('🔐 Şifre güncelleniyor...');
    console.log('Email:', email);
    console.log('');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ ŞİFRE GÜNCELLENDİ!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Yeni Şifre:', newPassword);
    console.log('');
    
    // Test et
    const testMatch = await bcrypt.compare(newPassword, user.password);
    console.log('🧪 Şifre doğrulama testi:', testMatch ? '✅ BAŞARILI' : '❌ BAŞARISIZ');
    console.log('');
    console.log('🌐 Giriş sayfası: http://16.170.227.182/giris.html');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword()
  .catch(console.error)
  .finally(() => process.exit());

