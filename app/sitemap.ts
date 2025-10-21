import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Static pages
  const routes = [
    '',
    '/search',
    '/wishlist',
    '/trips',
    '/messages',
    '/profile',
    '/login',
    '/register',
    '/host/dashboard',
    '/host/listings',
    '/host/calendar',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // TODO: Add dynamic listing pages from database
  // const listings = await prisma.listing.findMany({
  //   select: { id: true, updatedAt: true },
  // })
  // const listingRoutes = listings.map((listing) => ({
  //   url: `${baseUrl}/listing/${listing.id}`,
  //   lastModified: listing.updatedAt,
  //   changeFrequency: 'daily' as const,
  //   priority: 0.9,
  // }))

  return [...routes]
}
