import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Generate listing title suggestions
export async function generateListingTitle(params: {
  propertyType: string
  city: string
  highlights: string[]
}): Promise<string[]> {
  try {
    const prompt = `Generate 5 catchy, SEO-friendly titles for a ${params.propertyType} in ${params.city}. 
Highlights: ${params.highlights.join(', ')}
Format: Return only the titles, one per line.
Language: Vietnamese with some English keywords for appeal.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    })

    const titles = completion.choices[0].message.content?.split('\n').filter(t => t.trim()) || []
    return titles
  } catch (error) {
    console.error('AI title generation error:', error)
    return []
  }
}

// Generate listing description
export async function generateListingDescription(params: {
  title: string
  propertyType: string
  amenities: string[]
  location: string
}): Promise<string> {
  try {
    const prompt = `Write an engaging, detailed description for this vacation rental:
Title: ${params.title}
Type: ${params.propertyType}
Location: ${params.location}
Amenities: ${params.amenities.join(', ')}

Write in Vietnamese, about 200-300 words. Make it inviting and highlight unique features.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    return completion.choices[0].message.content || ''
  } catch (error) {
    console.error('AI description generation error:', error)
    return ''
  }
}

// Semantic search
export async function semanticSearch(query: string): Promise<string> {
  try {
    const prompt = `Convert this natural language search query into structured search parameters:
Query: "${query}"

Extract and return JSON with:
- location (city/area)
- checkIn (date if mentioned)
- checkOut (date if mentioned)
- guests (number)
- propertyType (villa/apartment/house etc)
- amenities (array)
- priceRange (min/max if mentioned)
- specialRequirements (any specific needs)

Example: "villa có hồ bơi cho 10 người gần biển Vũng Tàu cuối tuần này"
Output: {"location": "Vũng Tàu", "propertyType": "villa", "amenities": ["pool", "beach nearby"], "guests": 10}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    })

    return completion.choices[0].message.content || '{}'
  } catch (error) {
    console.error('Semantic search error:', error)
    return '{}'
  }
}

// Dynamic pricing suggestions
export async function generatePricingSuggestions(params: {
  basePrice: number
  propertyType: string
  city: string
  season: string
  events: string[]
  occupancyRate: number
  competitorPrices: number[]
}): Promise<{
  suggestedPrice: number
  reasoning: string
  adjustmentPercentage: number
}> {
  try {
    const competitorCount = params.competitorPrices.length
    const avgCompetitorPrice =
      competitorCount > 0
        ? params.competitorPrices.reduce((a, b) => a + b, 0) / competitorCount
        : params.basePrice

    const prompt = `As a dynamic pricing expert, suggest optimal pricing:

Current Base Price: ${params.basePrice} VND/night
Property: ${params.propertyType} in ${params.city}
Season: ${params.season}
Upcoming Events: ${params.events.join(', ')}
Current Occupancy Rate: ${params.occupancyRate}%
Average Competitor Price: ${avgCompetitorPrice} VND

Consider:
1. Market demand and seasonality
2. Local events and holidays
3. Occupancy rate (optimal is 75-85%)
4. Competitive positioning

Provide pricing recommendation with reasoning. Return JSON:
{
  "suggestedPrice": number,
  "reasoning": "brief explanation in Vietnamese",
  "adjustmentPercentage": number (can be negative)
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.5,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result
  } catch (error) {
    console.error('Pricing suggestion error:', error)
    return {
      suggestedPrice: params.basePrice,
      reasoning: 'Không thể tạo gợi ý, giữ giá hiện tại',
      adjustmentPercentage: 0,
    }
  }
}

// Personalized recommendations
export async function generateRecommendations(params: {
  userHistory: Array<{ city: string; propertyType: string; priceRange: string }>
  preferences: string[]
}): Promise<string> {
  try {
    const prompt = `Based on user's booking history and preferences, suggest search criteria:

Booking History:
${params.userHistory.map((h, i) => `${i + 1}. ${h.propertyType} in ${h.city} (${h.priceRange})`).join('\n')}

Preferences: ${params.preferences.join(', ')}

Generate personalized recommendations for their next stay. Return JSON with suggested locations, property types, and price ranges.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    return completion.choices[0].message.content || '{}'
  } catch (error) {
    console.error('Recommendations error:', error)
    return '{}'
  }
}
