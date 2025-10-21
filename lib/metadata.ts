import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Homestay Booking - Đặt phòng homestay cao cấp tại Việt Nam',
    template: '%s | Homestay Booking',
  },
  description:
    'Nền tảng đặt phòng homestay, villa cao cấp với AI tìm kiếm thông minh, thanh toán đa kênh và chat real-time. Khám phá hàng nghìn chỗ ở độc đáo tại Việt Nam.',
  keywords: [
    'homestay',
    'villa',
    'đặt phòng',
    'booking',
    'du lịch việt nam',
    'chỗ ở cao cấp',
    'airbnb vietnam',
    'vacation rental',
    'homestay việt nam',
    'villa biển',
    'homestay đà lạt',
    'villa nha trang',
  ],
  authors: [{ name: 'Homestay Booking Team' }],
  creator: 'Homestay Booking',
  publisher: 'Homestay Booking',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Homestay Booking',
    title: 'Homestay Booking - Đặt phòng homestay cao cấp',
    description:
      'Khám phá hàng nghìn homestay, villa cao cấp với AI tìm kiếm thông minh và thanh toán an toàn',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Homestay Booking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homestay Booking - Đặt phòng homestay cao cấp',
    description:
      'Khám phá hàng nghìn homestay, villa cao cấp với AI tìm kiếm thông minh',
    images: ['/og-image.jpg'],
    creator: '@homestaybooking',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: '/',
    languages: {
      'vi-VN': '/',
      'en-US': '/en',
    },
  },
  category: 'travel',
}

// JSON-LD Structured Data
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Homestay Booking',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description:
      'Nền tảng đặt phòng homestay, villa cao cấp với AI tìm kiếm thông minh',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Homestay Booking',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
    description:
      'Nền tảng đặt phòng homestay, villa cao cấp tại Việt Nam',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-123-456-789',
      contactType: 'customer service',
      areaServed: 'VN',
      availableLanguage: ['vi', 'en'],
    },
    sameAs: [
      'https://facebook.com/homestaybooking',
      'https://twitter.com/homestaybooking',
      'https://instagram.com/homestaybooking',
    ],
  }
}

export function generateListingSchema(listing: {
  id: string
  title: string
  description: string
  images: string[]
  pricePerNight: number
  rating?: number
  reviewCount?: number
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  amenities: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: listing.title,
    description: listing.description,
    image: listing.images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressCountry: listing.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
    aggregateRating: listing.rating && listing.reviewCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: listing.rating,
          reviewCount: listing.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    priceRange: `₫${listing.pricePerNight.toLocaleString('vi-VN')}`,
    amenityFeature: listing.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
    })),
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/listing/${listing.id}`,
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${item.url}`,
    })),
  }
}

export function generateReviewSchema(review: {
  author: string
  rating: number
  comment: string
  date: string
  listingTitle: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment,
    datePublished: review.date,
    itemReviewed: {
      '@type': 'LodgingBusiness',
      name: review.listingTitle,
    },
  }
}
