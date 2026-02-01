// EC2'de şifreyi ayarla
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setPassword() {
  const email = 'berkecenkcivelek@gmail.com';
  const newPassword = 'Berke2026!';
  
  try {
    console.log('🔐 Şifre ayarlanıyor...');
    console.log('Email:', email);
    console.log('Yeni Şifre:', newPassword);
    console.log('');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Şifre ayarlandı!');
    console.log('Hash:', hashedPassword.substring(0, 30) + '...');
    console.log('');
    
    // Test et
    const testMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Şifre doğrulama testi:', testMatch ? '✅ BAŞARILI' : '❌ BAŞARISIZ');
    console.log('');
    console.log('🌐 Giriş sayfası: http://16.170.227.182/giris.html');
    console.log('📧 Email:', email);
    console.log('🔑 Şifre:', newPassword);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

setPassword()
  .catch(console.error)
  .finally(() => process.exit());

