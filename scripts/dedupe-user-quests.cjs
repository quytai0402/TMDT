const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function dedupeUserQuests() {
  const all = await prisma.userQuest.findMany({
    select: {
      id: true,
      userId: true,
      questId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const map = new Map()
  const idsToDelete = []

  for (const record of all) {
    const key = `${record.userId}:${record.questId}`
    if (!map.has(key)) {
      map.set(key, record)
    } else {
      idsToDelete.push(record.id)
    }
  }

  if (idsToDelete.length === 0) {
    console.log("No duplicate user quests found.")
    return
  }

  await prisma.userQuest.deleteMany({
    where: { id: { in: idsToDelete } },
  })

  console.log(`Removed ${idsToDelete.length} duplicate user quest record(s).`)
}

async function main() {
  try {
    await dedupeUserQuests()
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("Failed to dedupe user quests:", error)
  process.exit(1)
})
