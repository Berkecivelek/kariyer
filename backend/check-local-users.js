// Local database kullanıcılarını listele
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== LOCAL USERS ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total users: ${users.length}\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || ''}`);
      console.log(`   Hash: ${user.password.substring(0, 30)}...`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();


