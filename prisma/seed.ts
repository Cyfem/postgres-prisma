import prisma from '../lib/prisma'

async function main() {
  // Create a demo user for testing
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      password: 'demo123',
      email: 'demo@example.com',
    },
  })

  console.log('Demo user created:', demoUser)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
