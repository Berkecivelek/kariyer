// Giriş test script'i
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
  console.log('🔐 Giriş testi başlatılıyor...');
  console.log('Email:', email);
  console.log('Şifre:', password);
  console.log('');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ Kullanıcı bulunamadı');
      return;
    }
    
    console.log('✅ Kullanıcı bulundu');
    console.log('Hash:', user.password.substring(0, 30) + '...');
    console.log('');
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log('✅✅✅ ŞİFRE DOĞRU! GİRİŞ BAŞARILI! ✅✅✅');
    } else {
      console.log('❌ Şifre yanlış');
      
      // Farklı varyasyonları dene
      console.log('');
      console.log('Diğer olası şifreleri test ediyorum...');
      
      const variations = [
        password.toLowerCase(),
        password.toUpperCase(),
        password + '!',
        password + '123',
        'Test' + password,
      ];
      
      for (const variant of variations) {
        const match = await bcrypt.compare(variant, user.password);
        if (match) {
          console.log('✅ BULUNDU! Doğru şifre:', variant);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test et
const email = process.argv[2] || 'berkecenkcivelek@gmail.com';
const password = process.argv[3] || 'Berke2026!';

testLogin(email, password);


