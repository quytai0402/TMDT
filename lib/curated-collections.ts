import { prisma } from "@/lib/prisma"

const prismaAny = prisma as unknown as {
  curatedCollection?: {
    findMany: (args: unknown) => Promise<unknown>
    findUnique: (args: unknown) => Promise<unknown>
  }
}

const listingCardSelect = {
  id: true,
  slug: true,
  title: true,
  city: true,
  country: true,
  basePrice: true,
  averageRating: true,
  totalReviews: true,
  images: true,
  maxGuests: true,
  bedrooms: true,
  host: {
    select: {
      id: true,
      name: true,
    },
  },
} as const

type CuratedCollectionSummary = {
  slug: string
  title: string
  subtitle: string
  cardImage: string
  tags: string[]
  location: string | null
  category: string
  listingsCount: number
  featured: boolean
}

function mapSummary(collection: CuratedCollectionSummary) {
  return {
    id: collection.slug,
    title: collection.title,
    description: collection.subtitle,
    image: collection.cardImage,
    tags: collection.tags,
    location: collection.location ?? undefined,
    category: collection.category,
    listingsCount: collection.listingsCount,
    featured: collection.featured,
  }
}

async function fetchCollectionsViaClient() {
  const collections = (await prismaAny.curatedCollection!.findMany({
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      slug: true,
      title: true,
      subtitle: true,
      cardImage: true,
      tags: true,
      location: true,
      category: true,
      listingsCount: true,
      featured: true,
    },
  })) as CuratedCollectionSummary[]

  return collections.map(mapSummary)
}

async function fetchCollectionsViaRaw() {
  const result = (await prisma.$runCommandRaw({
    aggregate: "curated_collections",
    pipeline: [
      { $sort: { featured: -1, createdAt: -1 } },
      {
        $project: {
          _id: 0,
          slug: 1,
          title: 1,
          subtitle: 1,
          cardImage: 1,
          tags: 1,
          location: 1,
          category: 1,
          listingsCount: 1,
          featured: 1,
        },
      },
    ],
    cursor: {},
  })) as { cursor?: { firstBatch?: CuratedCollectionSummary[] } }

  const collections = result.cursor?.firstBatch ?? []
  return collections.map(mapSummary)
}

export async function getCuratedCollections() {
  const hasModel = typeof prismaAny.curatedCollection?.findMany === "function"

  if (hasModel) {
    return fetchCollectionsViaClient()
  }

  return fetchCollectionsViaRaw()
}

type CuratedCollectionDetail = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  heroImage: string
  cardImage: string
  tags: string[]
  location: string | null
  category: string
  listingsCount: number
  listingIds: string[]
  featured: boolean
  curatorName: string | null
  curatorTitle: string | null
  curatorAvatar: string | null
}

async function fetchCollectionViaClient(slug: string) {
  return (await prismaAny.curatedCollection!.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      heroImage: true,
      cardImage: true,
      tags: true,
      location: true,
      category: true,
      listingsCount: true,
      listingIds: true,
      featured: true,
      curatorName: true,
      curatorTitle: true,
      curatorAvatar: true,
    },
  })) as CuratedCollectionDetail | null
}

async function fetchCollectionViaRaw(slug: string) {
  const result = (await prisma.$runCommandRaw({
    find: "curated_collections",
    filter: { slug },
    projection: {
      _id: 0,
      id: 1,
      slug: 1,
      title: 1,
      subtitle: 1,
      description: 1,
      heroImage: 1,
      cardImage: 1,
      tags: 1,
      location: 1,
      category: 1,
      listingsCount: 1,
      listingIds: 1,
      featured: 1,
      curatorName: 1,
      curatorTitle: 1,
      curatorAvatar: 1,
    },
  })) as { documents?: CuratedCollectionDetail[] }

  return result.documents?.[0] ?? null
}

export async function getCuratedCollectionBySlug(slug: string) {
  const hasModel = typeof prismaAny.curatedCollection?.findUnique === "function"

  const collection = hasModel
    ? await fetchCollectionViaClient(slug)
    : await fetchCollectionViaRaw(slug)

  if (!collection) {
    return null
  }

  const listingIds = Array.isArray(collection.listingIds)
    ? collection.listingIds.map((id) => String(id))
    : []

  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    select: listingCardSelect,
  })

  const listingLookup = new Map(listings.map((listing) => [listing.id, listing]))
  const orderedListings = listingIds
    .map((listingId) => listingLookup.get(listingId))
    .filter((listing): listing is (typeof listings)[number] => Boolean(listing))

  return {
    ...collection,
    listingIds,
    listings: orderedListings,
  }
}

export { evaluateCollectionAccess } from "@/lib/collection-access"
export type { CollectionAccessInfo } from "@/lib/collection-access"
