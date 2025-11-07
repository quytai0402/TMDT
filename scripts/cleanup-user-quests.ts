import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function removeDuplicateUserQuests() {
  const userQuests = await prisma.userQuest.findMany({
    select: { id: true, userId: true, questId: true },
  })

  const firstSeen = new Map<string, string>()
  const duplicates: string[] = []

  for (const entry of userQuests) {
    const key = `${entry.userId}:${entry.questId}`
    if (firstSeen.has(key)) {
      duplicates.push(entry.id)
      continue
    }
    firstSeen.set(key, entry.id)
  }

  if (!duplicates.length) {
    console.log("No duplicate user quest entries found.")
    return
  }

  console.log(`Removing ${duplicates.length} duplicate user quest entries...`)

  const chunkSize = 200
  for (let i = 0; i < duplicates.length; i += chunkSize) {
    const chunk = duplicates.slice(i, i + chunkSize)
    await prisma.userQuest.deleteMany({ where: { id: { in: chunk } } })
  }

  console.log("Duplicate user quest entries removed.")
}

async function main() {
  try {
    await removeDuplicateUserQuests()
  } catch (error) {
    console.error("Failed to clean up user quests:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
