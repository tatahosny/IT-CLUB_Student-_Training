const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  const roles = await prisma.role.findMany();
  console.log('Available Roles:', JSON.stringify(roles, null, 2));
  
  const hrUsers = await prisma.user.findMany({
    where: { role: { role_name: { in: ['hr', 'oc'] } } },
    include: { role: true }
  });
  console.log('HR/OC Users:', JSON.stringify(hrUsers.map(u => ({ email: u.email, role: u.role.role_name })), null, 2));
  
  process.exit(0);
}

checkRoles().catch(e => { console.error(e); process.exit(1); });
