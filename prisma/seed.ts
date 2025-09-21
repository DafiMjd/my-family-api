import { PrismaClient, Gender, Person } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic names for seeding
const maleNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas',
  'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian',
  'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey',
  'Frank', 'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis',
  'Walter', 'Patrick', 'Peter', 'Harold', 'Douglas', 'Henry', 'Carl', 'Arthur', 'Ryan', 'Roger'
];

const femaleNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle',
  'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen',
  'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah',
  'Dorothy', 'Amy', 'Angela', 'Ashley', 'Brenda', 'Emma', 'Olivia', 'Cynthia', 'Marie', 'Janet'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

// Generate random birth date between 18 and 80 years ago
function getRandomBirthDate(): Date {
  const now = new Date();
  const minAge = 18;
  const maxAge = 80;
  const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const birthDate = new Date(now.getFullYear() - randomAge, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  return birthDate;
}

// Generate random bio
function getRandomBio(): string {
  const bios = [
    'Loves spending time with family and friends.',
    'Enjoys outdoor activities and nature walks.',
    'Passionate about cooking and trying new recipes.',
    'Loves reading books and learning new things.',
    'Enjoys gardening and growing vegetables.',
    'Passionate about music and playing instruments.',
    'Loves traveling and exploring new places.',
    'Enjoys sports and staying active.',
    'Passionate about art and creative projects.',
    'Loves animals and has several pets.',
    'Enjoys photography and capturing memories.',
    'Passionate about volunteering and helping others.',
    'Loves technology and learning about new gadgets.',
    'Enjoys dancing and expressing creativity.',
    'Passionate about environmental conservation.',
    'Loves board games and puzzles.',
    'Enjoys hiking and mountain climbing.',
    'Passionate about history and ancient civilizations.',
    'Loves painting and artistic expression.',
    'Enjoys fishing and spending time by the water.'
  ];
  return bios[Math.floor(Math.random() * bios.length)];
}

async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.relationship.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.person.deleteMany();

  // Create 25 men
  console.log('👨 Creating 25 men...');
  const men: Person[] = [];
  for (let i = 0; i < 25; i++) {
    const firstName = maleNames[Math.floor(Math.random() * maleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const birthDate = getRandomBirthDate();
    const bio = getRandomBio();

    const person = await prisma.person.create({
      data: {
        name: `${firstName} ${lastName}`,
        gender: Gender.MAN,
        birthDate,
        bio,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
      },
    });
    men.push(person);
  }

  // Create 25 women
  console.log('👩 Creating 25 women...');
  const women: Person[] = [];
  for (let i = 0; i < 25; i++) {
    const firstName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const birthDate = getRandomBirthDate();
    const bio = getRandomBio();

    const person = await prisma.person.create({
      data: {
        name: `${firstName} ${lastName}`,
        gender: Gender.WOMAN,
        birthDate,
        bio,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
      },
    });
    women.push(person);
  }

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${men.length} men`);
  console.log(`   - ${women.length} women`);
  console.log(`   - Total: ${men.length + women.length} persons`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
