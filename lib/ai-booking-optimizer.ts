/**
 * AI-powered booking optimization and dynamic pricing engine
 * Calculates optimal pricing based on various factors like demand, seasonality, and booking patterns
 */

interface PricingResult {
  suggestedPrice: number
  confidence: number
  factors: {
    demandMultiplier: number
    seasonalMultiplier: number
    advanceBookingMultiplier: number
    lengthOfStayMultiplier: number
  }
  priceRange: {
    min: number
    max: number
  }
}

export class DynamicPricingEngine {
  /**
   * Calculate optimal price for a listing based on booking dates and demand
   * @param basePrice - The base price per night
   * @param checkIn - Check-in date
   * @param checkOut - Check-out date
   * @param listingId - The listing ID
   * @returns Pricing result with suggested price and factors
   */
  static async calculateOptimalPrice(
    basePrice: number,
    checkIn: Date,
    checkOut: Date,
    listingId: string
  ): Promise<PricingResult> {
    // Calculate number of nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate factors
    const demandMultiplier = this.calculateDemandMultiplier(checkIn)
    const seasonalMultiplier = this.calculateSeasonalMultiplier(checkIn)
    const advanceBookingMultiplier = this.calculateAdvanceBookingMultiplier(checkIn)
    const lengthOfStayMultiplier = this.calculateLengthOfStayMultiplier(nights)
    
    // Calculate suggested price
    const combinedMultiplier = 
      demandMultiplier * 
      seasonalMultiplier * 
      advanceBookingMultiplier * 
      lengthOfStayMultiplier
    
    const suggestedPrice = Math.round(basePrice * combinedMultiplier)
    
    // Calculate price range (±15%)
    const priceRange = {
      min: Math.round(suggestedPrice * 0.85),
      max: Math.round(suggestedPrice * 1.15)
    }
    
    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(checkIn, nights)
    
    return {
      suggestedPrice,
      confidence,
      factors: {
        demandMultiplier,
        seasonalMultiplier,
        advanceBookingMultiplier,
        lengthOfStayMultiplier
      },
      priceRange
    }
  }
  
  /**
   * Calculate demand multiplier based on day of week and time of year
   */
  private static calculateDemandMultiplier(checkIn: Date): number {
    const dayOfWeek = checkIn.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 // Fri, Sat, Sun
    
    // Weekend bookings typically command higher prices
    return isWeekend ? 1.15 : 0.95
  }
  
  /**
   * Calculate seasonal multiplier based on month
   */
  private static calculateSeasonalMultiplier(checkIn: Date): number {
    const month = checkIn.getMonth() // 0-11
    
    // Peak season: Summer (Jun-Aug) and holidays (Dec-Jan)
    // Shoulder season: Spring (Mar-May) and Fall (Sep-Nov)
    // Low season: Feb
    
    const seasonMultipliers: { [key: number]: number } = {
      0: 1.2,  // January - Tết/New Year
      1: 0.85, // February - Low season
      2: 0.95, // March - Shoulder
      3: 1.0,  // April - Shoulder
      4: 1.05, // May - Shoulder
      5: 1.15, // June - Peak
      6: 1.2,  // July - Peak
      7: 1.15, // August - Peak
      8: 1.0,  // September - Shoulder
      9: 1.0,  // October - Shoulder
      10: 0.95, // November - Shoulder
      11: 1.15  // December - Holidays
    }
    
    return seasonMultipliers[month] || 1.0
  }
  
  /**
   * Calculate advance booking multiplier (early bird discounts)
   */
  private static calculateAdvanceBookingMultiplier(checkIn: Date): number {
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Last minute bookings (< 7 days): higher price
    if (daysUntilCheckIn < 7) return 1.1
    
    // Normal bookings (7-30 days): standard price
    if (daysUntilCheckIn <= 30) return 1.0
    
    // Early bookings (31-60 days): small discount
    if (daysUntilCheckIn <= 60) return 0.95
    
    // Very early bookings (> 60 days): larger discount
    return 0.9
  }
  
  /**
   * Calculate length of stay multiplier (discounts for longer stays)
   */
  private static calculateLengthOfStayMultiplier(nights: number): number {
    // Weekly discount (7+ nights): 10% off
    if (nights >= 7 && nights < 30) return 0.9
    
    // Monthly discount (30+ nights): 20% off
    if (nights >= 30) return 0.8
    
    // Standard rate
    return 1.0
  }
  
  /**
   * Calculate confidence score based on data availability
   */
  private static calculateConfidence(checkIn: Date, nights: number): number {
    let confidence = 0.7 // Base confidence
    
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // More confident for nearer dates
    if (daysUntilCheckIn < 30) confidence += 0.2
    else if (daysUntilCheckIn < 60) confidence += 0.1
    
    // More confident for standard stay lengths
    if (nights >= 2 && nights <= 7) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }
  
  /**
   * Get pricing recommendations for hosts
   */
  static async getPricingRecommendations(
    listingId: string,
    basePrice: number,
    lookAheadDays: number = 90
  ): Promise<{ date: Date; recommendedPrice: number }[]> {
    const recommendations: { date: Date; recommendedPrice: number }[] = []
    const today = new Date()
    
    for (let i = 0; i < lookAheadDays; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const pricing = await this.calculateOptimalPrice(basePrice, date, nextDay, listingId)
      
      recommendations.push({
        date,
        recommendedPrice: pricing.suggestedPrice
      })
    }
    
    return recommendations
  }
  
  /**
   * Analyze pricing competitiveness
   */
  static analyzePricingCompetitiveness(
    listingPrice: number,
    similarListingsPrices: number[]
  ): {
    position: 'low' | 'competitive' | 'high'
    percentile: number
    recommendation: string
  } {
    if (similarListingsPrices.length === 0) {
      return {
        position: 'competitive',
        percentile: 50,
        recommendation: 'Not enough data to compare'
      }
    }
    
    const sortedPrices = [...similarListingsPrices].sort((a, b) => a - b)
    const lowerPrices = sortedPrices.filter(p => p < listingPrice).length
    const percentile = (lowerPrices / sortedPrices.length) * 100
    
    let position: 'low' | 'competitive' | 'high'
    let recommendation: string
    
    if (percentile < 25) {
      position = 'low'
      recommendation = 'Your price is lower than most similar listings. Consider increasing it to maximize revenue.'
    } else if (percentile > 75) {
      position = 'high'
      recommendation = 'Your price is higher than most similar listings. This may reduce booking rates.'
    } else {
      position = 'competitive'
      recommendation = 'Your price is competitively positioned in the market.'
    }
    
    return {
      position,
      percentile: Math.round(percentile),
      recommendation
    }
  }
}

/**
 * Helper function for quick price calculations
 */
export async function calculateOptimalPrice(
  basePrice: number,
  checkIn: Date,
  checkOut: Date,
  listingId: string
): Promise<number> {
  const result = await DynamicPricingEngine.calculateOptimalPrice(basePrice, checkIn, checkOut, listingId)
  return result.suggestedPrice
}
