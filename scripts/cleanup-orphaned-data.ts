import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Starting cleanup of orphaned data...')
  
  try {
    // 1. Find all applications
    const allApplications = await prisma.hostApplication.findMany({
      select: { id: true, userId: true }
    })
    
    console.log(`📊 Found ${allApplications.length} total host applications`)
    
    // 2. Check and delete orphaned applications
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
        console.log(`❌ Deleted orphaned application: ${app.id} (user ${app.userId} not found)`)
      }
    }
    
    console.log(`\n✅ Cleanup completed!`)
    console.log(`   - Deleted ${deletedCount} orphaned host applications`)
    console.log(`   - Remaining valid applications: ${allApplications.length - deletedCount}`)
    
  } catch (error) {
    console.error('❌ Cleanup error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
