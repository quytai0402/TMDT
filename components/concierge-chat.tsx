"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Bot,
  User,
  Phone,
  MapPin,
  Clock,
  Star,
  Utensils,
  Coffee,
  Send,
  Loader2,
} from "lucide-react"

import { useConciergeContext } from "@/components/concierge-context-provider"

interface RecommendationCard {
  id: string
  title: string
  subtitle?: string
  distanceLabel?: string
  ratingLabel?: string
  highlight?: string
  actionLabel?: string
  type: "restaurant" | "cafe" | "attraction" | "tip"
  image?: string | null
}

type MessageType = "system" | "user" | "bot"

interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  suggestions?: string[]
  recommendations?: RecommendationCard[]
}

interface AssistantListingContext {
  id: string
  title: string
  city: string
  nightlyRate: {
    formatted: string
    amount: number
    currency: string
  }
  availability: {
    status: "AVAILABLE_NOW" | "BOOKED" | "UPCOMING_BLOCKED"
    summary: string
    nextAvailableFrom?: string | null
  }
  amenities: string[]
  recommendations: {
    restaurants: Array<{ name: string; distanceKm?: number | null; description?: string | null }>
    cafes: Array<{ name: string; distanceKm?: number | null; description?: string | null }>
    attractions: Array<{ name: string; distanceKm?: number | null; description?: string | null }>
  }
  host: {
    name?: string | null
    phone?: string | null
    responseRate?: number | null
    responseTimeMinutes?: number | null
    isSuperHost?: boolean
  }
}

interface AssistantBookingContext {
  id: string
  status: string
  checkIn: string
  checkOut: string
  nights: number
  listing: {
    id: string
    title: string
    city: string
  }
}

interface ConciergeAssistantContext {
  listingContext?: AssistantListingContext | null
  latestBooking?: AssistantBookingContext | null
  introMessage: string
  quickReplies: string[]
}

interface ConciergeContextResponse {
  listingContext?: AssistantListingContext | null
  latestBooking?: AssistantBookingContext | null
  introMessage: string
  quickReplies: string[]
}

const SYSTEM_MESSAGE = "Concierge 24/7 đã kết nối"
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400"

function formatDistanceLabel(distanceKm?: number | null) {
  if (distanceKm === null || distanceKm === undefined) return undefined
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`
}

function normalizeVietnamese(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function matches(query: string, keywords: string[]) {
  const normalizedQuery = normalizeVietnamese(query)
  return keywords.some((keyword) => {
    const keywordValue = keyword.toLowerCase()
    const normalizedKeyword = normalizeVietnamese(keyword)
    return query.includes(keywordValue) || normalizedQuery.includes(normalizedKeyword)
  })
}

export function ConciergeChat() {
  const { context } = useConciergeContext()
  const [assistantContext, setAssistantContext] = useState<ConciergeAssistantContext | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const contextKey = useMemo(
    () => JSON.stringify(context ?? {}),
    [context],
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchAssistantContext = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      if (context?.source === 'listing' && context.listingId) {
        params.set('listingId', context.listingId)
      } else if (context?.source === 'booking' && context.bookingId) {
        params.set('bookingId', context.bookingId)
      }

      params.set('includeLatestBooking', 'true')

      const response = await fetch(`/api/concierge/context?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to load concierge context')
      }

      const data = (await response.json()) as ConciergeContextResponse

      const mapped: ConciergeAssistantContext = {
        listingContext: data.listingContext ?? null,
        latestBooking: data.latestBooking ?? null,
        introMessage: data.introMessage,
        quickReplies: data.quickReplies ?? [],
      }

      setAssistantContext(mapped)
      setMessages([
        {
          id: 'system',
          type: 'system',
          content: SYSTEM_MESSAGE,
          timestamp: new Date(),
        },
        {
          id: 'intro',
          type: 'bot',
          content: mapped.introMessage,
          suggestions: mapped.quickReplies,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Failed to fetch concierge context:', error)
      setAssistantContext(null)
      setMessages([
        {
          id: 'system',
          type: 'system',
          content: SYSTEM_MESSAGE,
          timestamp: new Date(),
        },
        {
          id: 'intro-fallback',
          type: 'bot',
          content:
            'Xin chào! Tôi đang sẵn sàng hỗ trợ bạn với thông tin đặt phòng, đề xuất nhà hàng và các dịch vụ bổ sung.',
          suggestions: [
            'Kiểm tra tình trạng phòng',
            'Gợi ý nhà hàng quanh tôi',
            'Đặt xe sân bay',
          ],
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [context?.bookingId, context?.listingId, context?.source])

  useEffect(() => {
    void fetchAssistantContext()
  }, [fetchAssistantContext, contextKey])

  const craftBotResponse = useCallback(
    async (query: string): Promise<Message> => {
      const lowerQuery = query.toLowerCase()
      const normalizedQuery = normalizeVietnamese(lowerQuery)
      const timestamp = new Date()

      const listing = assistantContext?.listingContext
      const booking = assistantContext?.latestBooking

      // Listing-specific responses
      if (listing) {
        if (matches(lowerQuery, ['trống', 'còn phòng', 'availability', 'available', 'có phòng'])) {
          const details = listing.availability.nextAvailableFrom
            ? `${listing.availability.summary} Lịch trống gần nhất từ ${listing.availability.nextAvailableFrom}.`
            : listing.availability.summary

          return {
            id: `availability-${timestamp.getTime()}`,
            type: 'bot',
            content: details,
            timestamp,
            suggestions: ['Đặt giữ phòng', 'Thêm bữa sáng', 'Gửi yêu cầu cho host'],
          }
        }

        if (matches(lowerQuery, ['bữa sáng', 'breakfast'])) {
          const hasBreakfast = listing.amenities.some((amenity) =>
            amenity.toLowerCase().includes('bữa sáng') || amenity.toLowerCase().includes('breakfast'),
          )

          const content = hasBreakfast
            ? 'Căn hộ có phục vụ bữa sáng tiêu chuẩn. Concierge có thể đặt trước hoặc tùy biến thực đơn nếu bạn báo trước tối thiểu 6 giờ.'
            : 'Hiện căn hộ chưa bao gồm bữa sáng. Tôi có thể đặt suất ăn sáng giao tận nơi hoặc gợi ý quán ăn sáng trong bán kính 10 phút di chuyển.'

          return {
            id: `breakfast-${timestamp.getTime()}`,
            type: 'bot',
            content,
            timestamp,
            suggestions: [
              'Đặt bữa sáng giao tận phòng',
              'Gợi ý quán ăn sáng gần đây',
              'Thêm vào ghi chú check-in',
            ],
          }
        }

        if (matches(lowerQuery, ['nhà hàng', 'ăn', 'đồ ăn', 'restaurant', 'food'])) {
          const restaurants = listing.recommendations.restaurants

          if (restaurants.length) {
            const recommendations: RecommendationCard[] = restaurants.map((item, idx) => ({
              id: `${listing.id}-restaurant-${idx}`,
              title: item.name,
              subtitle: item.description ?? 'Được khách LuxeStay đánh giá cao',
              distanceLabel: formatDistanceLabel(item.distanceKm),
              highlight: 'Nhà hàng',
              type: 'restaurant',
              image: FALLBACK_IMAGE,
            }))

            return {
              id: `restaurants-${timestamp.getTime()}`,
              type: 'bot',
              content: `Một vài nhà hàng nổi bật quanh ${listing.city}:`,
              timestamp,
              recommendations,
              suggestions: ['Đặt bàn', 'Gợi ý thêm món ăn địa phương', 'Đặt xe đưa đón'],
            }
          }
        }

        if (matches(lowerQuery, ['cafe', 'cà phê', 'coffee'])) {
          const cafes = listing.recommendations.cafes

          if (cafes.length) {
            const recommendations: RecommendationCard[] = cafes.map((item, idx) => ({
              id: `${listing.id}-cafe-${idx}`,
              title: item.name,
              subtitle: item.description ?? 'Không gian lý tưởng cho làm việc',
              distanceLabel: formatDistanceLabel(item.distanceKm),
              highlight: 'Quán cà phê',
              type: 'cafe',
              image: FALLBACK_IMAGE,
            }))

            return {
              id: `cafes-${timestamp.getTime()}`,
              type: 'bot',
              content: `Các quán cà phê được khách lưu trú tại ${listing.city} yêu thích:`,
              timestamp,
              recommendations,
              suggestions: ['Đặt chỗ làm việc', 'Gợi ý đồ uống signature'],
            }
          }
        }

        if (matches(lowerQuery, ['tham quan', 'đi chơi', 'đi đâu', 'attraction', 'tour'])) {
          const attractions = listing.recommendations.attractions

          if (attractions.length) {
            const recommendations: RecommendationCard[] = attractions.map((item, idx) => ({
              id: `${listing.id}-attraction-${idx}`,
              title: item.name,
              subtitle: item.description ?? 'Địa điểm hot trong khu vực',
              distanceLabel: formatDistanceLabel(item.distanceKm),
              highlight: 'Điểm tham quan',
              type: 'attraction',
              image: FALLBACK_IMAGE,
            }))

            return {
              id: `attractions-${timestamp.getTime()}`,
              type: 'bot',
              content: `Bạn có thể cân nhắc ghé những điểm sau trong lịch trình:`,
              timestamp,
              recommendations,
              suggestions: ['Đặt vé tham quan', 'Đặt xe đưa đón', 'Lên lịch trình chi tiết'],
            }
          }
        }

        if (matches(lowerQuery, ['host', 'chủ nhà', 'liên hệ'])) {
          const host = listing.host
          const parts = [
            host.name ? `Chủ nhà hiện tại là ${host.name}.` : 'Chủ nhà rất thân thiện và phản hồi nhanh.',
          ]

          if (host.isSuperHost) {
            parts.push('Đây là SuperHost được xếp hạng cao trên LuxeStay.')
          }

          if (host.responseRate !== null && host.responseRate !== undefined) {
            parts.push(`Tỷ lệ phản hồi ${Math.round((host.responseRate ?? 0) * 100)}%.`)
          }

          if (host.responseTimeMinutes) {
            parts.push(`Thời gian phản hồi trung bình ${host.responseTimeMinutes} phút.`)
          }

          if (host.phone) {
            parts.push('Tôi có thể kết nối trực tiếp hoặc nhắn với host giúp bạn.')
          }

          return {
            id: `host-${timestamp.getTime()}`,
            type: 'bot',
            content: parts.join(' '),
            timestamp,
            suggestions: ['Nhắn tin cho host', 'Thêm yêu cầu đặc biệt'],
          }
        }

        if (matches(lowerQuery, ['giá', 'bao nhiêu', 'price'])) {
          return {
            id: `price-${timestamp.getTime()}`,
            type: 'bot',
            content: `Giá niêm yết hiện tại là ${listing.nightlyRate.formatted}/đêm (chưa gồm phí dịch vụ). Tôi có thể kiểm tra giúp bạn các ưu đãi hoặc gói dài ngày nếu cần.`,
            timestamp,
            suggestions: ['Kiểm tra ưu đãi', 'Giữ phòng ngay'],
          }
        }

        if (matches(lowerQuery, ['xe', 'sân bay', 'đưa đón', 'transfer'])) {
          const bookingWindow = booking
            ? ` Chuyến lưu trú của bạn bắt đầu ${format(new Date(booking.checkIn), 'd MMMM', { locale: vi })}, tôi sẽ sắp xe khớp giờ đón.`
            : ''

          return {
            id: `transport-${timestamp.getTime()}`,
            type: 'bot',
            content:
              `Concierge có thể đặt xe đón tiễn sân bay hoặc thuê xe riêng theo giờ.${bookingWindow} Bạn chỉ cần cho tôi biết số hiệu chuyến bay, giờ hạ cánh và số lượng hành khách, tôi sẽ xác nhận ngay.`,
            timestamp,
            suggestions: ['Gửi lịch chuyến bay', 'Đặt xe 7 chỗ', 'Đặt xe sang'],
          }
        }

        if (matches(lowerQuery, ['dịch vụ', 'add service', 'service', 'thêm dịch vụ'])) {
          const serviceSuggestions = ['Đặt thêm bữa sáng', 'Trang trí kỷ niệm', 'Thêm hoạt động vào planner']

          if (booking) {
            const checkIn = format(new Date(booking.checkIn), 'd MMMM', { locale: vi })
            const checkOut = format(new Date(booking.checkOut), 'd MMMM', { locale: vi })

            return {
              id: `services-${timestamp.getTime()}`,
              type: 'bot',
              content: `Chuyến đi của bạn tại ${booking.listing.title} (${booking.listing.city}) từ ${checkIn} đến ${checkOut} có thể bổ sung bữa sáng, xe đưa đón hoặc trải nghiệm địa phương. Bạn mô tả nhu cầu (thời gian, số khách) tôi sẽ giữ lịch và báo giá giúp ngay.`,
              timestamp,
              suggestions: serviceSuggestions,
            }
          }

          return {
            id: `services-${timestamp.getTime()}`,
            type: 'bot',
            content: `Tôi có thể chuẩn bị bữa sáng, đặt xe hoặc sắp xếp hoạt động cho khách lưu trú tại ${listing.title}. Bạn cần dịch vụ nào, cứ mô tả chi tiết nhé.`,
            timestamp,
            suggestions: serviceSuggestions,
          }
        }

        if (matches(lowerQuery, ['giữ phòng', 'giu phong', 'giữ chỗ', 'giu cho', 'thanh toán', 'cọc', 'deposit'])) {
          const availability = listing.availability
          const statusNote = availability.status === 'BOOKED'
            ? `Hiện căn đang được đặt đến ${availability.nextAvailableFrom ?? 'khi có lịch trống mới.'}`
            : 'Căn đang trống. Tôi có thể giữ phòng tạm tối đa 12 giờ để bạn hoàn tất thanh toán.'

          return {
            id: `hold-${timestamp.getTime()}`,
            type: 'bot',
            content: `${statusNote} Tôi cũng có thể gửi đường dẫn thanh toán bảo đảm hoặc hỗ trợ chuyển khoản nếu bạn cho biết số đêm và số khách.`,
            timestamp,
            suggestions: ['Giữ phòng 48 giờ', 'Thanh toán ngay', 'Trao đổi với host'],
          }
        }

        if (matches(lowerQuery, ['thông báo', 'notify', 'nhắc tôi', 'follow up'])) {
          const availability = listing.availability

          return {
            id: `alert-${timestamp.getTime()}`,
            type: 'bot',
            content: availability.status === 'BOOKED'
              ? `Tôi sẽ theo dõi lịch và nhắc bạn ngay khi ${listing.title} trống từ ${availability.nextAvailableFrom ?? 'ngày gần nhất'}. Bạn cũng có thể giữ phòng ở thời điểm hiện tại nếu muốn chắc chắn.`
              : `Căn ${listing.title} đang trống. Bạn muốn tôi thiết lập lời nhắc hay giữ phòng giúp bạn trong bao lâu?`,
            timestamp,
            suggestions: ['Giữ phòng ngay', 'Nhắc tôi qua email', 'Liên hệ concierge'],
          }
        }
      }

      // Booking specific queries
      if (booking) {
        if (matches(lowerQuery, ['lịch sử', 'booking', 'đặt phòng', 'lần trước'])) {
          const checkIn = new Date(booking.checkIn)
          const checkOut = new Date(booking.checkOut)

          return {
            id: `booking-${timestamp.getTime()}`,
            type: 'bot',
            content: `Bạn đã đặt ${booking.listing.title} (${booking.listing.city}) từ ${checkIn.toLocaleDateString('vi-VN')} đến ${checkOut.toLocaleDateString('vi-VN')} (${booking.nights} đêm). Tôi có thể hỗ trợ cập nhật hoặc thêm dịch vụ cho lịch này.`,
            timestamp,
            suggestions: ['Thêm dịch vụ cho chuyến này', 'Nhắn với host', 'Đổi lịch trình'],
          }
        }

        if (matches(lowerQuery, ['dịch vụ', 'add service', 'service', 'thêm dịch vụ'])) {
          const checkIn = new Date(booking.checkIn).toLocaleDateString('vi-VN')
          const checkOut = new Date(booking.checkOut).toLocaleDateString('vi-VN')

          return {
            id: `booking-services-${timestamp.getTime()}`,
            type: 'bot',
            content: `Chuyến đi của bạn (${booking.listing.title}, ${booking.listing.city}) từ ${checkIn} đến ${checkOut} có thể bổ sung bữa sáng, xe đưa đón hoặc trang trí theo yêu cầu. Cho tôi biết số khách và thời gian cụ thể, tôi sẽ giữ chỗ và báo giá ngay.`,
            timestamp,
            suggestions: ['Đặt bữa sáng', 'Đặt xe sân bay', 'Trang trí kỷ niệm'],
          }
        }
      }

      if (/^[0-9]+$/.test(normalizedQuery.replace(/\s+/g, ''))) {
        return {
          id: `code-${timestamp.getTime()}`,
          type: 'bot',
          content: 'Tôi nhận được một chuỗi số. Nếu đây là mã đặt phòng hoặc yêu cầu, bạn có thể cho tôi biết rõ hơn để tôi kiểm tra chính xác?',
          timestamp,
          suggestions: assistantContext?.quickReplies ?? undefined,
        }
      }

      // Default fallback
      return {
        id: `default-${timestamp.getTime()}`,
        type: 'bot',
        content: (() => {
          const hintReplies = (assistantContext?.quickReplies ?? []).slice(0, 3)
          if (hintReplies.length === 0) {
            return 'Tôi chưa rõ nhu cầu cụ thể nên chưa phản hồi chính xác được. Bạn có thể hỏi tôi về dịch vụ, ăn uống hoặc lịch trình nhé.'
          }

          return `Tôi chưa rõ nhu cầu cụ thể nên chưa phản hồi chính xác được. Bạn có thể thử các gợi ý như ${hintReplies.join(', ')}.`
        })(),
        timestamp,
        suggestions: assistantContext?.quickReplies ?? undefined,
      }
    },
    [assistantContext],
  )

  const handleSend = useCallback(
    async (preset?: string) => {
      const messageText = (preset ?? input).trim()
      if (!messageText) return

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: messageText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsTyping(true)

      try {
        const response = await craftBotResponse(messageText)
        setMessages((prev) => [...prev, response])
      } catch (error) {
        console.error('Failed to craft concierge response:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            type: 'bot',
            content: 'Xin lỗi, tôi đang gặp trục trặc. Bạn có thể thử lại sau ít phút hoặc gọi hotline 1900 xxxx giúp tôi nhé.',
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [craftBotResponse, input],
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void handleSend(suggestion)
    },
    [handleSend],
  )

  return (
    <Card className="flex flex-col h-[600px] shadow-lg">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=luxe-concierge" />
              <AvatarFallback>
                <Bot />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h3 className="font-semibold">Concierge 24/7</h3>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              {isLoading ? 'Đang đồng bộ bối cảnh...' : 'Đang online'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Phone className="w-4 h-4 mr-2" />
          Gọi hotline
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'system' && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {message.content}
                  </Badge>
                </div>
              )}

              {message.type === 'bot' && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="space-y-2">
                        {message.recommendations.map((rec) => (
                          <Card
                            key={rec.id}
                            className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <img
                                src={rec.image ?? FALLBACK_IMAGE}
                                alt={rec.title}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                                  {rec.highlight && (
                                    <Badge variant="outline" className="text-xs">
                                      {rec.highlight}
                                    </Badge>
                                  )}
                                </div>
                                {rec.subtitle && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {rec.subtitle}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                                  {rec.distanceLabel && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {rec.distanceLabel}
                                    </span>
                                  )}
                                  {rec.ratingLabel && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      {rec.ratingLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={`${message.id}-suggestion-${idx}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {message.type === 'user' && (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 flex flex-col items-end space-y-1">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isLoading ? 'Đang chuẩn bị dữ liệu...' : 'Nhập yêu cầu của bạn (ví dụ: nhà hàng tối nay, đặt xe sân bay...)'}
              disabled={isLoading}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleSend()
                }
              }}
            />
          </div>
          <Button onClick={() => void handleSend()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Utensils className="w-4 h-4" />
            <span>Nhà hàng</span>
            <Coffee className="w-4 h-4" />
            <span>Cà phê</span>
            <Clock className="w-4 h-4" />
            <span>Dịch vụ 24/7</span>
          </div>
          <span>Chat được ghi lại để concierge follow-up</span>
        </div>
      </div>
    </Card>
  )
}
