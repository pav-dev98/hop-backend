import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpieza idempotente (respeta orden de FKs).
  await prisma.attendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.member.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();
  await prisma.people.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Personas ---
  const adminPerson = await prisma.people.create({
    data: { name: 'Ana', lastName: 'Admin', email: 'admin@peacehouses.test' },
  });
  const leaderPerson = await prisma.people.create({
    data: { name: 'Luis', lastName: 'Líder', email: 'leader@peacehouses.test' },
  });
  const member1 = await prisma.people.create({
    data: { name: 'María', lastName: 'Pérez', email: 'maria@example.test' },
  });
  const member2 = await prisma.people.create({
    data: { name: 'Carlos', lastName: 'Gómez', email: 'carlos@example.test' },
  });
  const otherHouseMember = await prisma.people.create({
    data: { name: 'Sofía', lastName: 'Ramírez', email: 'sofia@example.test' },
  });
  const externalVisitor = await prisma.people.create({
    data: { name: 'Pedro', lastName: 'Visitante', email: 'pedro@example.test' },
  });

  // --- Usuarios ---
  await prisma.user.create({
    data: {
      email: 'admin@peacehouses.test',
      passwordHash,
      role: 'ADMIN',
      personalDataId: adminPerson.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'leader@peacehouses.test',
      passwordHash,
      role: 'LEADER',
      personalDataId: leaderPerson.id,
    },
  });

  // --- Casas ---
  const houseA = await prisma.house.create({
    data: {
      name: 'Casa de Paz Central',
      address: 'Calle 1 #100',
      leaderId: leaderPerson.id,
      meetingDay: 'WEDNESDAY',
      startTime: '19:00',
      endTime: '21:00',
    },
  });
  const houseB = await prisma.house.create({
    data: {
      name: 'Casa de Paz Norte',
      address: 'Av. Norte #200',
      meetingDay: 'FRIDAY',
      startTime: '20:00',
      endTime: '22:00',
    },
  });

  // --- Miembros ---
  const memberMaria = await prisma.member.create({
    data: { personalDataId: member1.id, houseId: houseA.id, memberType: 'MEMBER' },
  });
  await prisma.member.create({
    data: { personalDataId: member2.id, houseId: houseA.id, memberType: 'MEMBER' },
  });
  // Sofía es miembro de la casa B (visitará la casa A).
  const memberSofia = await prisma.member.create({
    data: { personalDataId: otherHouseMember.id, houseId: houseB.id, memberType: 'MEMBER' },
  });

  // --- Reunión de la casa A ---
  const meeting = await prisma.meeting.create({
    data: {
      houseId: houseA.id,
      date: new Date('2026-06-03'),
      startTime: '19:00',
      endTime: '21:00',
      status: 'COMPLETED',
      topic: 'Estudio bíblico semanal',
    },
  });

  // --- Asistencias: los 3 casos ---
  // Caso 1: miembro regular asiste a su casa.
  await prisma.attendance.create({
    data: {
      meetingId: meeting.id,
      memberId: memberMaria.id,
      peopleId: member1.id,
      isGuest: false,
      isMemberFromOtherHouse: null,
      present: true,
    },
  });
  // Caso 2: miembro de otra casa visita.
  await prisma.attendance.create({
    data: {
      meetingId: meeting.id,
      memberId: null,
      peopleId: otherHouseMember.id,
      isGuest: true,
      isMemberFromOtherHouse: memberSofia.id,
      present: true,
    },
  });
  // Caso 3: visitante externo (nunca fue miembro).
  await prisma.attendance.create({
    data: {
      meetingId: meeting.id,
      memberId: null,
      peopleId: externalVisitor.id,
      isGuest: true,
      isMemberFromOtherHouse: null,
      present: true,
    },
  });

  console.log('✅ Seed completed.');
  console.log('   Admin login:  admin@peacehouses.test / password123');
  console.log('   Leader login: leader@peacehouses.test / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
