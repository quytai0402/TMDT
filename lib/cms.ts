import { prisma } from "@/lib/prisma"

type CmsData = {
  heroBanners: any[]
  featuredCollections: any[]
  blogPosts: any[]
}

const CMS_KEYS = {
  heroBanners: "home.hero_banners",
  featuredCollections: "home.featured_collections",
  blogPosts: "home.blog_posts",
} as const

const DEFAULT_CMS_DATA: CmsData = {
  heroBanners: [
    {
      id: "banner-1",
      title: "Khám phá Việt Nam theo cách riêng của bạn",
      subtitle: "Hơn 10,000+ homestay độc đáo đang chờ bạn",
      imageUrl: "/images/home/hero-1.jpg",
      ctaText: "Khám phá ngay",
      ctaLink: "/search",
      isActive: true,
      order: 1,
    },
    {
      id: "banner-2",
      title: "Ưu đãi mùa hè - Giảm đến 30%",
      subtitle: "Đặt ngay homestay yêu thích với giá tốt nhất",
      imageUrl: "/images/home/hero-2.jpg",
      ctaText: "Xem ưu đãi",
      ctaLink: "/collections",
      isActive: true,
      order: 2,
    },
  ],
  featuredCollections: [
    {
      id: "collection-1",
      name: "Biển xanh cát trắng",
      description: "Homestay view biển tuyệt đẹp",
      imageUrl: "/images/collections/beach.jpg",
      listingIds: [],
      isActive: true,
      order: 1,
    },
    {
      id: "collection-2",
      name: "Núi rừng Đà Lạt",
      description: "Không gian yên tĩnh giữa núi rừng",
      imageUrl: "/images/collections/mountain.jpg",
      listingIds: [],
      isActive: true,
      order: 2,
    },
  ],
  blogPosts: [
    {
      id: "blog-1",
      title: "10 homestay view biển đẹp nhất Việt Nam",
      excerpt: "Khám phá những homestay ven biển tuyệt vời cho kỳ nghỉ hè của bạn.",
      content: "Nội dung bài viết sẽ được cập nhật trong CMS.",
      coverImage: "/images/blog/beach-homestays.jpg",
      author: "LuxeStay Team",
      publishedAt: new Date().toISOString(),
      isPublished: true,
      tags: ["Biển", "Du lịch", "Homestay"],
    },
  ],
}

async function ensureCmsBlock(key: string, data: any, updatedBy?: string) {
  await prisma.cmsBlock.upsert({
    where: { key },
    create: {
      key,
      data,
      updatedBy,
    },
    update: {},
  })
}

export async function ensureCmsDefaults(updatedBy?: string) {
  await Promise.all([
    ensureCmsBlock(CMS_KEYS.heroBanners, DEFAULT_CMS_DATA.heroBanners, updatedBy),
    ensureCmsBlock(CMS_KEYS.featuredCollections, DEFAULT_CMS_DATA.featuredCollections, updatedBy),
    ensureCmsBlock(CMS_KEYS.blogPosts, DEFAULT_CMS_DATA.blogPosts, updatedBy),
  ])
}

export async function getCmsData(): Promise<CmsData> {
  const blocks = await prisma.cmsBlock.findMany({
    where: {
      key: {
        in: Object.values(CMS_KEYS),
      },
    },
  })

  const map = new Map(blocks.map((block) => [block.key, block.data]))

  return {
    heroBanners: (map.get(CMS_KEYS.heroBanners) as any[]) ?? DEFAULT_CMS_DATA.heroBanners,
    featuredCollections:
      (map.get(CMS_KEYS.featuredCollections) as any[]) ?? DEFAULT_CMS_DATA.featuredCollections,
    blogPosts: (map.get(CMS_KEYS.blogPosts) as any[]) ?? DEFAULT_CMS_DATA.blogPosts,
  }
}

export async function saveCmsData(data: Partial<CmsData>, updatedBy?: string) {
  const updates: Array<Promise<unknown>> = []

  if (data.heroBanners) {
    updates.push(
      prisma.cmsBlock.upsert({
        where: { key: CMS_KEYS.heroBanners },
        create: { key: CMS_KEYS.heroBanners, data: data.heroBanners, updatedBy },
        update: { data: data.heroBanners, updatedBy },
      }),
    )
  }

  if (data.featuredCollections) {
    updates.push(
      prisma.cmsBlock.upsert({
        where: { key: CMS_KEYS.featuredCollections },
        create: { key: CMS_KEYS.featuredCollections, data: data.featuredCollections, updatedBy },
        update: { data: data.featuredCollections, updatedBy },
      }),
    )
  }

  if (data.blogPosts) {
    updates.push(
      prisma.cmsBlock.upsert({
        where: { key: CMS_KEYS.blogPosts },
        create: { key: CMS_KEYS.blogPosts, data: data.blogPosts, updatedBy },
        update: { data: data.blogPosts, updatedBy },
      }),
    )
  }

  await Promise.all(updates)
}
