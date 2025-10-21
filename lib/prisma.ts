import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma Client with better connection handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings and timeout configurations
  // @ts-ignore - These options work but TypeScript may not recognize them
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 seconds
      queryTimeout: 60000,
    },
  },
})

// Connection retry logic
async function connectWithRetry(maxRetries = 3, retryDelay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected successfully')
      return
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error)
      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        console.error('❌ All database connection attempts failed')
        throw error
      }
    }
  }
}

// Initialize connection with retry
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  connectWithRetry().catch(console.error)
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
