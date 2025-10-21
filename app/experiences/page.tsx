import { cache } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExperiencesGrid, type ExperienceSummary } from "@/components/experiences-grid"
import { prisma } from "@/lib/prisma"

export const revalidate = 1800

type ExperienceWithHost = {
  id: string
  title: string
  description: string
  category: string
  city: string
  state: string | null
  duration: string
  groupSize: string
  price: number
  averageRating: number
  totalReviews: number
  tags?: string[] | null
  featured: boolean
  image: string
  host: {
    name: string | null
    image: string | null
    isVerified: boolean | null
    isSuperHost: boolean | null
  } | null
}

const prismaClient = prisma as any

const getExperiences = cache(async (): Promise<ExperienceSummary[]> => {
  const experiences = await prismaClient.experience.findMany({
    where: {
      status: "ACTIVE",
    },
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
  })

  return (experiences as ExperienceWithHost[]).map((experience: ExperienceWithHost) => ({
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
    location: experience.state
      ? `${experience.city}, ${experience.state}`
      : experience.city,
    city: experience.city,
    duration: experience.duration,
    groupSize: experience.groupSize,
    price: experience.price,
    rating: experience.averageRating,
    reviewCount: experience.totalReviews,
    tags: experience.tags ?? [],
    featured: experience.featured,
  }))
})

export default async function ExperiencesPage() {
  const experiences = await getExperiences()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <ExperiencesGrid initialExperiences={experiences} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
