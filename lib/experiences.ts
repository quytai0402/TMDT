import { prisma } from "@/lib/prisma"

export interface ExperienceSummary {
  id: string
  title: string
  description: string
  category: string
  location: string
  city: string
  duration: string
  groupSize: string
  price: number
  rating: number
  reviewCount: number
  tags: string[]
  featured?: boolean
  membersOnly?: boolean
  image: string
  host: {
    name: string
    avatar?: string | null
    verified?: boolean
  }
}

type ExperienceQueryOptions = {
  membersOnly?: boolean
  limit?: number
}

type ExperienceWithHost = Awaited<
  ReturnType<typeof prisma.experience.findMany>
>[number] & {
  host: {
    name: string | null
    image: string | null
    isVerified: boolean | null
    isSuperHost: boolean | null
  } | null
}

export async function getExperienceSummaries(
  options: ExperienceQueryOptions = {}
): Promise<ExperienceSummary[]> {
  const { membersOnly = false, limit } = options

  const where = membersOnly
    ? { status: "ACTIVE" as const, isMembersOnly: true }
    : {
        status: "ACTIVE" as const,
        isMembersOnly: false,
      }

  const experiences = await prisma.experience.findMany({
    where,
    include: {
      host: {
        select: {
          name: true,
          image: true,
          isVerified: true,
          isSuperHost: true,
        },
      },
    },
    orderBy: [
      { featured: "desc" },
      { averageRating: "desc" },
      { createdAt: "desc" },
    ],
    ...(limit ? { take: limit } : {}),
  })

  return (experiences as ExperienceWithHost[]).map((experience) => ({
    id: experience.id,
    title: experience.title,
    description: experience.description,
    image: experience.image,
    host: {
      name: experience.host?.name ?? "Host",
      avatar: experience.host?.image ?? undefined,
      verified: Boolean(experience.host?.isVerified || experience.host?.isSuperHost),
    },
    category: experience.category,
    location: experience.state ? `${experience.city}, ${experience.state}` : experience.city,
    city: experience.city,
    duration: experience.duration,
    groupSize: experience.groupSize,
    price: experience.price,
    rating: experience.averageRating,
    reviewCount: experience.totalReviews,
    tags: experience.tags ?? [],
    featured: experience.featured,
    membersOnly: experience.isMembersOnly ?? false,
  }))
}
