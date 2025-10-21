'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Sparkles, MapPin, Calendar, Users, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchSuggestion {
  id: string
  text: string
  icon: any
  params: {
    location?: string
    guests?: number
    propertyType?: string
    amenities?: string[]
  }
}

export function NaturalLanguageSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const popularSearches: SearchSuggestion[] = [
    {
      id: '1',
      text: 'Biệt thự có hồ bơi riêng gần biển Vũng Tàu',
      icon: MapPin,
      params: {
        location: 'Vũng Tàu',
        propertyType: 'villa',
        amenities: ['pool', 'beachfront'],
      },
    },
    {
      id: '2',
      text: 'Homestay Đà Lạt cho 8 người có bếp và lò sưởi',
      icon: Users,
      params: {
        location: 'Đà Lạt',
        guests: 8,
        amenities: ['kitchen', 'fireplace'],
      },
    },
    {
      id: '3',
      text: 'Căn hộ view biển Nha Trang cuối tuần này',
      icon: Calendar,
      params: {
        location: 'Nha Trang',
        propertyType: 'apartment',
        amenities: ['ocean_view'],
      },
    },
    {
      id: '4',
      text: 'Chỗ nghỉ cho phép thú cưng gần Hà Nội',
      icon: MapPin,
      params: {
        location: 'Hà Nội',
        amenities: ['pets_allowed'],
      },
    },
    {
      id: '5',
      text: 'Villa sang trọng Phú Quốc có bồn tắm jacuzzi',
      icon: TrendingUp,
      params: {
        location: 'Phú Quốc',
        propertyType: 'villa',
        amenities: ['jacuzzi', 'luxury'],
      },
    },
  ]

  useEffect(() => {
    if (query.length > 2) {
      // AI-powered suggestion logic (simplified)
      const filtered = popularSearches.filter(s =>
        s.text.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions(popularSearches)
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (suggestion?: SearchSuggestion) => {
    if (suggestion) {
      const params = new URLSearchParams()
      if (suggestion.params.location) params.append('location', suggestion.params.location)
      if (suggestion.params.guests) params.append('guests', suggestion.params.guests.toString())
      if (suggestion.params.propertyType) params.append('type', suggestion.params.propertyType)
      if (suggestion.params.amenities) {
        suggestion.params.amenities.forEach(a => params.append('amenities', a))
      }
      router.push(`/search?${params.toString()}`)
    } else if (query) {
      // Parse natural language query (simplified)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground hidden md:block">
            AI Search
          </span>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Tìm kiếm bằng ngôn ngữ tự nhiên: 'biệt thự có hồ bơi cho 10 người gần biển'..."
          className="h-16 pl-28 pr-24 rounded-full text-base shadow-lg border-2 focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button
          onClick={() => handleSearch()}
          size="lg"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
        >
          <Search className="w-5 h-5 mr-2" />
          Tìm kiếm
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {(showSuggestions || query.length === 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-auto shadow-xl">
          <div className="p-2">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
              {query.length > 0 ? 'Gợi ý tìm kiếm' : 'Tìm kiếm phổ biến'}
            </div>
            {(query.length > 0 ? suggestions : popularSearches).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSearch(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <suggestion.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{suggestion.text}</div>
                  {suggestion.params.location && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      📍 {suggestion.params.location}
                      {suggestion.params.guests && ` • ${suggestion.params.guests} khách`}
                    </div>
                  )}
                </div>
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="border-t p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Bộ lọc nhanh
            </div>
            <div className="flex flex-wrap gap-2">
              {['Hồ bơi', 'Gần biển', 'Cho phép thú cưng', 'Miễn phí hủy', 'Wi-Fi nhanh', 'BBQ'].map((filter) => (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(query + ' ' + filter.toLowerCase())}
                  className="rounded-full text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
