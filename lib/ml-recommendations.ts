// Similar Listings Algorithm using Cosine Similarity
// Machine Learning approach for recommendation system

interface ListingFeatures {
  id: string
  title: string
  propertyType: string
  city: string
  state?: string | null
  basePrice: number
  bedrooms: number
  maxGuests: number
  averageRating: number
  totalReviews: number
  amenities: string[]
  latitude: number
  longitude: number
  featured?: boolean
  images: string[]
  host: {
    name: string | null
  }
}

// Calculate Euclidean distance for geographical proximity
function calculateGeoDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Normalize value to 0-1 range
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

// Calculate Jaccard similarity for amenities (set similarity)
function jaccardSimilarity(set1: string[], set2: string[]): number {
  const intersection = set1.filter(x => set2.includes(x)).length
  const union = new Set([...set1, ...set2]).size
  return union === 0 ? 0 : intersection / union
}

// Calculate cosine similarity for feature vectors
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) return 0
  
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0)
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0))
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProduct / (magnitudeA * magnitudeB)
}

// Convert listing to feature vector for ML algorithm
function extractFeatureVector(
  listing: ListingFeatures,
  allListings: ListingFeatures[]
): number[] {
  // Get min/max values for normalization
  const prices = allListings.map(l => l.basePrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  
  const guests = allListings.map(l => l.maxGuests)
  const minGuests = Math.min(...guests)
  const maxGuests = Math.max(...guests)
  
  const ratings = allListings.map(l => l.averageRating)
  const minRating = Math.min(...ratings)
  const maxRating = Math.max(...ratings)
  
  // Feature vector: [normalized_price, normalized_guests, normalized_bedrooms, normalized_rating, featured_flag]
  return [
    normalize(listing.basePrice, minPrice, maxPrice),
    normalize(listing.maxGuests, minGuests, maxGuests),
    normalize(listing.bedrooms, 0, 10),
    normalize(listing.averageRating, minRating, maxRating),
    listing.featured ? 1 : 0,
  ]
}

// Calculate similarity score between two listings
export function calculateSimilarityScore(
  listing1: ListingFeatures,
  listing2: ListingFeatures,
  allListings: ListingFeatures[]
): number {
  // 1. Property type match (exact match = 1, no match = 0)
  const typeScore = listing1.propertyType === listing2.propertyType ? 1 : 0
  
  // 2. Location proximity (same city = 1, same state = 0.5, different = 0)
  let locationScore = 0
  if (listing1.city === listing2.city) {
    locationScore = 1
  } else if (listing1.state === listing2.state) {
    locationScore = 0.5
  }
  
  // 3. Geographical distance (closer = higher score)
  const geoDistance = calculateGeoDistance(
    listing1.latitude,
    listing1.longitude,
    listing2.latitude,
    listing2.longitude
  )
  const geoScore = Math.max(0, 1 - geoDistance / 100) // Normalize to 0-1 (100km max)
  
  // 4. Price similarity (closer price = higher score)
  const priceDiff = Math.abs(listing1.basePrice - listing2.basePrice)
  const avgPrice = (listing1.basePrice + listing2.basePrice) / 2
  const priceScore = Math.max(0, 1 - priceDiff / avgPrice)
  
  // 5. Capacity similarity (bedrooms + guests)
  const capacityDiff = Math.abs(listing1.maxGuests - listing2.maxGuests) +
                       Math.abs(listing1.bedrooms - listing2.bedrooms)
  const capacityScore = Math.max(0, 1 - capacityDiff / 10)
  
  // 6. Rating similarity (both high-rated = higher score)
  const ratingDiff = Math.abs(listing1.averageRating - listing2.averageRating)
  const ratingScore = Math.max(0, 1 - ratingDiff / 5)
  
  // 7. Amenities similarity (Jaccard index)
  const amenitiesScore = jaccardSimilarity(listing1.amenities, listing2.amenities)
  
  // 8. Feature vector similarity (cosine similarity)
  const vector1 = extractFeatureVector(listing1, allListings)
  const vector2 = extractFeatureVector(listing2, allListings)
  const featureScore = cosineSimilarity(vector1, vector2)
  
  // Weighted combination of all scores (ML-based weights)
  const weights = {
    type: 0.25,        // Property type is very important
    location: 0.20,    // Location matters a lot
    geo: 0.10,         // Geographical proximity
    price: 0.15,       // Price range similarity
    capacity: 0.10,    // Size similarity
    rating: 0.10,      // Quality similarity
    amenities: 0.05,   // Amenities overlap
    features: 0.05,    // Overall feature similarity
  }
  
  const totalScore =
    typeScore * weights.type +
    locationScore * weights.location +
    geoScore * weights.geo +
    priceScore * weights.price +
    capacityScore * weights.capacity +
    ratingScore * weights.rating +
    amenitiesScore * weights.amenities +
    featureScore * weights.features
  
  return totalScore
}

// Get similar listings using ML algorithm
export function getSimilarListings(
  currentListing: ListingFeatures,
  allListings: ListingFeatures[],
  limit: number = 4
): ListingFeatures[] {
  // Calculate similarity scores for all listings
  const scoredListings = allListings
    .filter(listing => listing.id !== currentListing.id) // Exclude current listing
    .map(listing => ({
      listing,
      score: calculateSimilarityScore(currentListing, listing, allListings),
    }))
    .sort((a, b) => b.score - a.score) // Sort by similarity score (descending)
  
  // Return top N similar listings
  return scoredListings.slice(0, limit).map(item => item.listing)
}

// Smart pricing algorithm using linear regression
export function predictOptimalPrice(listing: Partial<ListingFeatures>, marketData: ListingFeatures[]): number {
  // Simple linear regression based on similar properties
  const similarProperties = marketData.filter(l => 
    l.propertyType === listing.propertyType &&
    l.city === listing.city
  )
  
  if (similarProperties.length === 0) return listing.basePrice || 1000000
  
  // Calculate average price per bedroom in the area
  const pricePerBedroom = similarProperties.reduce((sum, l) => {
    return sum + (l.basePrice / (l.bedrooms || 1))
  }, 0) / similarProperties.length
  
  // Calculate average price per guest
  const pricePerGuest = similarProperties.reduce((sum, l) => {
    return sum + (l.basePrice / (l.maxGuests || 1))
  }, 0) / similarProperties.length
  
  // Predict price based on features
  let predictedPrice = (listing.bedrooms || 1) * pricePerBedroom * 0.5 +
                       (listing.maxGuests || 2) * pricePerGuest * 0.5
  
  // Adjust for rating (premium for high ratings)
  if (listing.averageRating) {
    const ratingMultiplier = 0.8 + (listing.averageRating / 5) * 0.4
    predictedPrice *= ratingMultiplier
  }
  
  // Round to nearest 100k
  return Math.round(predictedPrice / 100000) * 100000
}

// Content-based filtering for personalized recommendations
export function getPersonalizedRecommendations(
  userHistory: ListingFeatures[],
  allListings: ListingFeatures[],
  limit: number = 8
): ListingFeatures[] {
  if (userHistory.length === 0) {
    // No history - return featured/popular listings
    return allListings
      .sort((a, b) => b.averageRating * b.totalReviews - a.averageRating * a.totalReviews)
      .slice(0, limit)
  }
  
  // Calculate user preferences from history
  const userPreferences = {
    avgPrice: userHistory.reduce((sum, l) => sum + l.basePrice, 0) / userHistory.length,
    avgBedrooms: userHistory.reduce((sum, l) => sum + l.bedrooms, 0) / userHistory.length,
    preferredTypes: [...new Set(userHistory.map(l => l.propertyType))],
    preferredCities: [...new Set(userHistory.map(l => l.city))],
  }
  
  // Score all listings based on user preferences
  const scoredListings = allListings.map(listing => {
    let score = 0
    
    // Type preference
    if (userPreferences.preferredTypes.includes(listing.propertyType)) score += 0.3
    
    // Location preference
    if (userPreferences.preferredCities.includes(listing.city)) score += 0.2
    
    // Price similarity
    const priceDiff = Math.abs(listing.basePrice - userPreferences.avgPrice)
    score += Math.max(0, 0.2 - (priceDiff / userPreferences.avgPrice) * 0.2)
    
    // Size similarity
    const bedroomDiff = Math.abs(listing.bedrooms - userPreferences.avgBedrooms)
    score += Math.max(0, 0.15 - bedroomDiff * 0.03)
    
    // Quality (rating)
    score += (listing.averageRating / 5) * 0.15
    
    return { listing, score }
  })
  
  return scoredListings
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.listing)
}
