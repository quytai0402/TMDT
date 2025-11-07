const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Cleaning orphaned host applications...')
  
  const allApplications = await prisma.hostApplication.findMany({
    select: { id: true, userId: true }
  })
  
  console.log(`Found ${allApplications.length} total applications`)
  
  let deletedCount = 0
  for (const app of allApplications) {
    const user = await prisma.user.findUnique({
      where: { id: app.userId }
    })
    
    if (!user) {
      await prisma.hostApplication.delete({
        where: { id: app.id }
      })
      deletedCount++
      console.log(`Deleted orphaned application: ${app.id}`)
    }
  }
  
  console.log(`✅ Cleaned up ${deletedCount} orphaned applications`)
  await prisma.$disconnect()
}

cleanup().catch(console.error)
