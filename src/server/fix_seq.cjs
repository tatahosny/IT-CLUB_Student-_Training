const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const result = await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('sessions', 'id'), coalesce(max(id),0) + 1, false) FROM sessions;`);
    console.log('Fixed sequence:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
