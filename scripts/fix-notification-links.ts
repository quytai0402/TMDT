import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing notification links...')

  // Fix /admin/host-applications to /admin/hosts/applications
  const result1 = await prisma.notification.updateMany({
    where: {
      link: {
        contains: '/admin/host-applications'
      }
    },
    data: {
      link: '/admin/hosts/applications'
    }
  })

  console.log(`✅ Fixed ${result1.count} notifications with /admin/host-applications`)

  // Fix /admin/hosts/applications?tab=pending to /admin/hosts/applications
  const result2 = await prisma.notification.updateMany({
    where: {
      link: '/admin/hosts/applications?tab=pending'
    },
    data: {
      link: '/admin/hosts/applications'
    }
  })

  console.log(`✅ Fixed ${result2.count} notifications with tab parameter`)

  // Get summary of all notification links
  const notifications = await prisma.notification.findMany({
    where: {
      link: {
        not: null
      }
    },
    select: {
      link: true
    }
  })

  const linkCounts = notifications.reduce((acc, n) => {
    if (n.link) {
      acc[n.link] = (acc[n.link] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  console.log('\n📊 Current notification links:')
  Object.entries(linkCounts).forEach(([link, count]) => {
    console.log(`  ${link}: ${count}`)
  })

  console.log('\n✨ Done!')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
