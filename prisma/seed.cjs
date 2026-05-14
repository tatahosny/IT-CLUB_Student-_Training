const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding IT Training System database...')

  // ─── ROLES ───────────────────────────────────────────────
  const roles = await Promise.all([
    'super_admin', 'instructor', 'mentor_manager', 'mentor', 'student', 'oc'
  ].map(role => prisma.role.upsert({
    where: { role_name: role },
    update: {},
    create: { role_name: role },
  })))

  console.log('✅ Roles seeded:', roles.map(r => r.role_name).join(', '))

  // ─── LEVELS ───────────────────────────────────────────────
  const levels = await Promise.all(['Level 1', 'Level 2', 'Level 3'].map(level =>
    prisma.level.upsert({ where: { level_name: level }, update: {}, create: { level_name: level } })
  ))

  // ─── GROUPS ───────────────────────────────────────────────
  const groups = await Promise.all(['Group A', 'Group B', 'Group C'].map(name =>
    prisma.group.upsert({ where: { group_name: name }, update: {}, create: { group_name: name } })
  ))

  console.log('✅ Groups & Levels seeded')

  // ─── SUPER ADMIN ──────────────────────────────────────────
  const superAdminRole = roles.find(r => r.role_name === 'super_admin')
  const instructorRole = roles.find(r => r.role_name === 'instructor')
  const studentRole = roles.find(r => r.role_name === 'student')
  const mentorRole = roles.find(r => r.role_name === 'mentor')

  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@it.training.system' },
    update: {},
    create: {
      full_name: 'Super Admin',
      email: 'admin@it.training.system',
      password: adminPassword,
      role_id: superAdminRole.id,
      first_login: false,
    },
  })

  // ─── INSTRUCTOR ───────────────────────────────────────────
  const instructorPassword = await bcrypt.hash('Instructor@123', 12)
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@it.training.system' },
    update: {},
    create: {
      full_name: 'Ahmed Instructor',
      email: 'instructor@it.training.system',
      password: instructorPassword,
      role_id: instructorRole.id,
      first_login: false,
    },
  })

  // ─── MENTOR ───────────────────────────────────────────────
  const mentorPassword = await bcrypt.hash('Mentor@123', 12)
  await prisma.user.upsert({
    where: { email: 'mentor@it.training.system' },
    update: {},
    create: {
      full_name: 'Sara Mentor',
      email: 'mentor@it.training.system',
      password: mentorPassword,
      role_id: mentorRole.id,
      first_login: false,
    },
  })

  // ─── DEMO STUDENTS ────────────────────────────────────────
  const studentData = [
    { full_name: 'Mohamed Ali', academic_number: '2024001', phone: '01001234567' },
    { full_name: 'Fatima Hassan', academic_number: '2024002', phone: '01112345678' },
    { full_name: 'Omar Khaled', academic_number: '2024003', phone: '01223456789' },
    { full_name: 'Nour Ibrahim', academic_number: '2024004', phone: '01334567890' },
    { full_name: 'Youssef Mahmoud', academic_number: '2024005', phone: '01445678901' },
  ]

  for (const s of studentData) {
    const hashedPwd = await bcrypt.hash(s.phone, 10)
    await prisma.user.upsert({
      where: { academic_number: s.academic_number },
      update: {},
      create: {
        ...s,
        email: `${s.academic_number}@it.training.system`,
        password: hashedPwd,
        registration_number: `IT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        role_id: studentRole.id,
        group_id: groups[0].id,
        level_id: levels[0].id,
      },
    })
  }

  console.log('✅ Demo users seeded')

  // ─── DEMO SESSION ─────────────────────────────────────────
  await prisma.session.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'HTML & CSS Fundamentals',
      instructor_id: instructor.id,
      room_number: 'Lab-1',
      group_id: groups[0].id,
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
      session_type: 'lecture',
      is_active: true,
    },
  }).catch(() => {}) // Ignore if exists

  console.log('✅ Demo session created')
  console.log('')
  console.log('═══════════════════════════════════')
  console.log('🚀 IT Training System — Seed Complete')
  console.log('═══════════════════════════════════')
  console.log('Admin:      admin@it.training.system / Admin@1234')
  console.log('Instructor: instructor@it.training.system / Instructor@123')
  console.log('Mentor:     mentor@it.training.system / Mentor@123')
  console.log('Students:   [academic_number]@it.training.system / [phone_number]')
  console.log('═══════════════════════════════════')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
