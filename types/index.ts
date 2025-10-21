// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: "USER" | "HOST" | "ADMIN"
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends User {
  phone?: string | null
  bio?: string | null
  language?: string | null
  currency?: string | null
  listingsCount?: number
  bookingsCount?: number
  reviewsCount?: number
}

// ============================================
// LISTING TYPES
// ============================================

export interface Listing {
  id: string
  hostId: string
  title: string
  description: string
  propertyType: PropertyType
  roomType: RoomType
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  country: string
  city: string
  address: string
  latitude: number
  longitude: number
  basePrice: number
  cleaningFee: number
  serviceFee: number
  currency: string
  images: string[]
  amenities: string[]
  checkInTime: string
  checkOutTime: string
  minNights: number
  maxNights: number
  instantBookable: boolean
  cancellationPolicy: CancellationPolicy
  allowPets: boolean
  isVerified: boolean
  status: ListingStatus
  averageRating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
}

export interface ListingWithHost extends Listing {
  host: {
    id: string
    name: string | null
    email: string
    image: string | null
    isVerified: boolean
  }
}

export interface ListingDetail extends ListingWithHost {
  reviews: Review[]
  bookingsCount: number
}

// ============================================
// BOOKING TYPES
// ============================================

export interface Booking {
  id: string
  listingId: string
  guestId: string | null
  hostId: string
  guestType: BookingGuestType
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactPhoneNormalized?: string | null
  checkIn: Date
  checkOut: Date
  nights: number
  adults: number
  children: number
  infants: number
  pets: number
  basePrice: number
  cleaningFee: number
  serviceFee: number
  discount: number
  totalPrice: number
  currency: string
  status: BookingStatus
  instantBook: boolean
  specialRequests?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BookingWithDetails extends Booking {
  listing: {
    id: string
    title: string
    address: string
    images: string[]
    host: {
      id: string
      name: string | null
      email: string
    }
  }
  guest?: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  payment?: {
    id: string
    amount: number
    status: PaymentStatus
    paymentMethod: PaymentMethodType
  } | null
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  paymentMethod: PaymentMethodType
  paymentGateway: PaymentGateway
  status: PaymentStatus
  transactionId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PaymentIntent {
  clientSecret: string
  paymentUrl?: string
  qrCode?: string
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string
  bookingId: string
  listingId: string
  reviewerId: string
  rating: number
  comment: string
  cleanliness: number
  accuracy: number
  checkIn: number
  communication: number
  location: number
  value: number
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReviewWithUser extends Review {
  reviewer: {
    id: string
    name: string | null
    image: string | null
    isVerified: boolean
  }
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  cleanliness: number
  accuracy: number
  checkIn: number
  communication: number
  location: number
  value: number
  sentiment?: string
  keywords?: string[]
  aiSummary?: string
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  listingId: string
  guestId: string
  hostId: string
  lastMessageAt: Date
  createdAt: Date
  messages: Message[]
}

export interface ConversationWithDetails extends Conversation {
  listing: {
    id: string
    title: string
    images: string[]
  }
  guest: {
    id: string
    name: string | null
    image: string | null
  }
  host: {
    id: string
    name: string | null
    image: string | null
  }
  unreadCount: number
}

// ============================================
// WISHLIST TYPES
// ============================================

export interface Wishlist {
  id: string
  userId: string
  listingIds: string[]
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchParams {
  query?: string
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  propertyType?: PropertyType[]
  amenities?: string[]
  instantBookable?: boolean
  allowPets?: boolean
  minRating?: number
  page?: number
  limit?: number
  sortBy?: "price" | "rating" | "newest" | "popular"
  sortOrder?: "asc" | "desc"
  aiMode?: boolean
}

export interface SearchResult {
  listings: ListingWithHost[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AdminAnalytics {
  overview: {
    totalUsers: number
    totalListings: number
    totalBookings: number
    totalRevenue: number
    newUsersThisPeriod: number
    newListingsThisPeriod: number
    newBookingsThisPeriod: number
    revenueThisPeriod: number
  }
  bookingsByStatus: Array<{
    status: BookingStatus
    count: number
  }>
  topListings: Array<{
    id: string
    title: string
    hostName: string | null
    bookingsCount: number
    basePrice: number
  }>
  topHosts: Array<{
    id: string
    name: string | null
    email: string
    listingsCount: number
    revenue: number
  }>
  recentBookings: Array<{
    id: string
    guestName: string | null
    listingTitle: string
    hostName: string | null
    checkIn: Date
    checkOut: Date
    totalPrice: number
    status: BookingStatus
    createdAt: Date
  }>
  trends: {
    userGrowth: Array<{ date: Date; count: number }>
    bookingTrend: Array<{ date: Date; count: number; revenue: number }>
  }
}

export interface HostDashboardStats {
  totalRevenue: number
  monthlyBookings: number
  pendingBookings: number
  totalBookings: number
  averageRating?: number
  occupancyRate?: number
}

// ============================================
// ENUM TYPES
// ============================================

export type PropertyType =
  | "HOUSE"
  | "APARTMENT"
  | "GUESTHOUSE"
  | "HOTEL"
  | "VILLA"
  | "COTTAGE"
  | "CABIN"
  | "BUNGALOW"
  | "CHALET"
  | "TREEHOUSE"
  | "BOAT"
  | "CASTLE"
  | "CAVE"
  | "ISLAND"

export type RoomType =
  | "ENTIRE_PLACE"
  | "PRIVATE_ROOM"
  | "SHARED_ROOM"

export type CancellationPolicy =
  | "FLEXIBLE"
  | "MODERATE"
  | "STRICT"
  | "SUPER_STRICT"

export type ListingStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "REJECTED"

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED"

export type BookingGuestType =
  | "REGISTERED"
  | "WALK_IN"

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"

export type PaymentMethodType =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "VNPAY"
  | "MOMO"
  | "ZALOPAY"
  | "BANK_TRANSFER"
  | "CASH"

export type PaymentGateway =
  | "VNPAY"
  | "MOMO"
  | "ZALOPAY"
  | "STRIPE"
  | "PAYPAL"

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}

export interface ListingFormData {
  title: string
  description: string
  propertyType: PropertyType
  roomType: RoomType
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  country: string
  city: string
  address: string
  latitude: number
  longitude: number
  basePrice: number
  cleaningFee: number
  serviceFee: number
  images: string[]
  amenities: string[]
  checkInTime: string
  checkOutTime: string
  minNights: number
  maxNights: number
  instantBookable: boolean
  cancellationPolicy: CancellationPolicy
  houseRules?: string
  allowPets: boolean
  allowSmoking: boolean
  allowEvents: boolean
  allowChildren: boolean
}

export interface BookingFormData {
  listingId: string
  checkIn: Date
  checkOut: Date
  adults: number
  children: number
  infants: number
  pets: number
  specialRequests?: string
}

export interface ReviewFormData {
  bookingId: string
  rating: number
  comment: string
  cleanliness: number
  accuracy: number
  checkIn: number
  communication: number
  location: number
  value: number
}

export interface ProfileFormData {
  name?: string
  phone?: string
  bio?: string
  language?: string
  currency?: string
  image?: string
}
