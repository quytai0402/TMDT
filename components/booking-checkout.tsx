"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookingSummary } from "@/components/booking-summary"
import { GuestInfoForm, GuestInfo } from "@/components/guest-info-form"
import { PaymentMethods } from "@/components/payment-methods"
import { useToast } from "@/hooks/use-toast"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ServicesSelection, type SelectedServiceSummary } from "@/components/services-selection"
import { cn } from "@/lib/utils"

interface HostInfo {
  name?: string | null
  image?: string | null
}

interface ListingCheckoutData {
  id: string
  title: string
  basePrice: number
  cleaningFee?: number
  serviceFee?: number
  city?: string | null
  state?: string | null
  country?: string | null
  images?: string[] | null
  averageRating?: number | null
  reviews?: { id: string }[]
  reviewsCount?: number
  host?: HostInfo | null
}

interface BookingCheckoutProps {
  listing: ListingCheckoutData
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  initialServices?: SelectedServiceSummary[]
  initialServicesTotal?: number
}

type StepStatus = "completed" | "current" | "upcoming"

interface CheckoutStep {
  id: number
  title: string
  description: string
  status: StepStatus
}

interface SplitStayConflictDetail {
  type: "booking" | "blocked"
  range: {
    startDate: string
    endDate: string
  }
  note?: string | null
}

interface AlternativeListingSuggestion {
  id: string
  title: string
  slug?: string
  image?: string | null
  city: string
  state?: string | null
  country: string
  basePrice: number
  estimatedTotal: number
  priceDifference: number
  distanceKm?: number | null
}

interface SplitStaySegment {
  id: string
  type: "primary" | "gap"
  startDate: string
  endDate: string
  nights: number
  estimatedTotal?: number
  conflicts?: SplitStayConflictDetail[]
  alternatives?: AlternativeListingSuggestion[]
}

interface SplitStaySuggestion {
  message: string
  requested: {
    startDate: string
    endDate: string
    nights: number
  }
  primaryListing: {
    id: string
    title: string
    basePrice: number
    cleaningFee: number
    city: string
    state?: string | null
    country: string
  }
  segments: SplitStaySegment[]
}

type ConciergePlanStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"

interface ConciergePartnerInfo {
  id: string
  title: string
  location: string
  basePrice: number
  cleaningFee?: number | null
  status?: string | null
  sameHost?: boolean
}

interface ConciergePlan {
  id: string
  bookingId?: string | null
  listingId: string
  guestId?: string | null
  status: ConciergePlanStatus
  planDetails: {
    segments: SplitStaySegment[]
    selectedAlternatives: Record<string, string>
    generatedAt?: string
  }
  loyaltyOffer?: string | null
  partnerInfo?: ConciergePartnerInfo[] | null
  hostNotes?: string | null
  guestNotes?: string | null
  createdAt: string
  updatedAt: string
}

const conciergeOfferPresets: Array<{ id: string; label: string; description: string }> = [
  {
    id: "upgrade",
    label: "Nâng hạng phòng miễn phí",
    description: "Tặng nâng hạng khi khách quay lại sau đêm trống.",
  },
  {
    id: "breakfast",
    label: "Bữa sáng & tiện ích",
    description: "Miễn phí bữa sáng và late checkout khi quay lại.",
  },
  {
    id: "points",
    label: "Gấp đôi điểm thưởng",
    description: "Nhân đôi điểm loyalty cho toàn bộ kỳ nghỉ.",
  },
]

const formatForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, (month ?? 1) - 1, day, 12, 0, 0)
  return date.toISOString()
}

const calculateNights = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const formatDisplayDate = (value: string) => {
  if (!value) {
    return ""
  }

  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString("vi-VN")
}

const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}₫`

const conciergeOfferCopy: Record<string, string> = {
  upgrade: "Tặng nâng hạng phòng miễn phí khi khách quay lại sau đêm bị trùng lịch.",
  breakfast: "Miễn phí bữa sáng, đồ uống chào mừng và hỗ trợ checkout linh hoạt khi khách quay lại.",
  points: "Nhân đôi số điểm loyalty cho toàn bộ kỳ nghỉ và cộng thêm ưu đãi quay lại.",
}

const conciergePlanStatusLabel: Record<ConciergePlanStatus, string> = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
}

const buildHostNoteFromSuggestion = (suggestion: SplitStaySuggestion) => {
  if (!suggestion) {
    return ""
  }

  const primarySegments = suggestion.segments.filter((segment) => segment.type === "primary")
  const gapSegments = suggestion.segments.filter((segment) => segment.type === "gap")

  const requestedRange =
    primarySegments.length > 0
      ? `${formatDisplayDate(primarySegments[0].startDate)} → ${formatDisplayDate(
          primarySegments[primarySegments.length - 1].endDate,
        )}`
      : `${formatDisplayDate(suggestion.requested.startDate)} → ${formatDisplayDate(
          suggestion.requested.endDate,
        )}`

  const gapSummary =
    gapSegments.length > 0
      ? `Có ${gapSegments.length} đêm trùng lịch cần hỗ trợ (${gapSegments
          .map((segment) => `${formatDisplayDate(segment.startDate)} → ${formatDisplayDate(segment.endDate)}`)
          .join(", ")}).`
      : "Không có đêm nào trùng lịch."

  return [
    `Khách mong muốn lưu trú tại ${suggestion.primaryListing.title} trong khoảng ${requestedRange}.`,
    gapSummary,
    "Vui lòng chuẩn bị để khách quay lại phòng ban đầu ngay sau khi hết lịch trùng.",
  ].join(" ")
}

export function BookingCheckout({
  listing,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialServices,
  initialServicesTotal,
}: BookingCheckoutProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const authModal = useAuthModal()

  const today = new Date()
  const defaultCheckIn = initialCheckIn || formatForInput(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultCheckOut = initialCheckOut || formatForInput(tomorrow)

  const calculateServicesTotal = useCallback(
    (services: SelectedServiceSummary[]) =>
      services.reduce((sum, service) => sum + (service.totalPrice ?? 0), 0),
    [],
  )

  const recalcServicesForTrip = useCallback(
    (services: SelectedServiceSummary[], currentNights: number, currentGuests: number) => {
      return services.map((service) => {
        let quantity = service.quantity
        let totalPrice = service.totalPrice
        let quantityLabel = service.quantityLabel
        let metadata = service.metadata ? { ...service.metadata } : undefined

        switch (service.unit) {
          case "daily": {
            const nightsValue = Math.max(1, currentNights)
            quantity = nightsValue
            totalPrice = service.basePrice * nightsValue
            quantityLabel = `${nightsValue} đêm`
            break
          }
          case "person": {
            const nightsValue = Math.max(1, currentNights)
            const guestsValue = Math.max(1, currentGuests)
            quantity = nightsValue * guestsValue
            totalPrice = service.basePrice * nightsValue * guestsValue
            quantityLabel = `${guestsValue} người × ${nightsValue} đêm`
            break
          }
          case "pet": {
            const nightsValue = Math.max(1, Math.min(metadata?.petNights ?? currentNights, currentNights))
            const petsValue = Math.max(1, metadata?.numberOfPets ?? 1)
            quantity = nightsValue * petsValue
            totalPrice = service.basePrice * nightsValue * petsValue
            quantityLabel = `${petsValue} thú cưng × ${nightsValue} đêm`
            metadata = { ...metadata, petNights: nightsValue, numberOfPets: petsValue }
            break
          }
          default: {
            quantity = 1
            totalPrice = service.basePrice
            quantityLabel = service.quantityLabel ?? ""
            break
          }
        }

        return {
          ...service,
          quantity,
          totalPrice,
          quantityLabel,
          metadata,
        }
      })
    },
    [],
  )

  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [guests, setGuests] = useState(initialGuests ?? 1)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    fullName: "",
    phone: "",
    email: "",
    specialRequests: "",
  })
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const paymentSectionRef = useRef<HTMLDivElement | null>(null)
  const splitSuggestionSectionRef = useRef<HTMLDivElement | null>(null)
  const [splitSuggestion, setSplitSuggestion] = useState<SplitStaySuggestion | null>(null)
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({})
  const [splitPlanApplied, setSplitPlanApplied] = useState(false)
  const [conciergePlan, setConciergePlan] = useState<ConciergePlan | null>(null)
  const [conciergePlansHistory, setConciergePlansHistory] = useState<ConciergePlan[]>([])
  const [isSubmittingConcierge, setIsSubmittingConcierge] = useState(false)
  const [guestConciergeNotes, setGuestConciergeNotes] = useState("")
  const [hostConciergeNotes, setHostConciergeNotes] = useState("")
  const [selectedOffer, setSelectedOffer] = useState(conciergeOfferPresets[0]?.id ?? "upgrade")
  const [selectedServices, setSelectedServices] = useState<SelectedServiceSummary[]>(initialServices ?? [])
  const [servicesTotal, setServicesTotal] = useState<number>(
    initialServicesTotal ?? calculateServicesTotal(initialServices ?? []),
  )
  const [showServicesModal, setShowServicesModal] = useState(false)

  const summaryListing = useMemo(() => {
    const locationParts = [listing.city, listing.state, listing.country].filter(Boolean)
    const location = locationParts.length > 0 ? locationParts.join(", ") : "Việt Nam"

    const basePrice = typeof listing.basePrice === "number" ? listing.basePrice : 0

    return {
      id: listing.id,
      title: listing.title,
      location,
      price: basePrice,
      rating: listing.averageRating ?? 4.8,
      reviews: listing.reviewsCount ?? listing.reviews?.length ?? 0,
      image: listing.images?.[0] || "/placeholder.svg",
      host: {
        name: listing.host?.name ?? "Host",
        avatar: listing.host?.image ?? "/placeholder.svg",
      },
      cleaningFee: listing.cleaningFee ?? 0,
      serviceFee: listing.serviceFee ?? undefined,
    }
  }, [listing])

  const nights = calculateNights(checkIn, checkOut)
  const nightlyRate = typeof listing.basePrice === "number" ? listing.basePrice : 0
  const subtotal = nightlyRate * nights
  const cleaningFee = listing.cleaningFee ?? 0
  const serviceFee = listing.serviceFee ?? (subtotal + servicesTotal) * 0.1
  const totalAmount = subtotal + cleaningFee + serviceFee + servicesTotal
  const tripInfoValid = nights > 0
  const guestInfoCompleted = Boolean(
    guestInfo.fullName.trim() &&
    guestInfo.phone.trim() &&
    guestInfo.email.trim()
  )
  const bookingCreated = Boolean(bookingId)

  const steps = useMemo<CheckoutStep[]>(() => {
    const step1Status: StepStatus = tripInfoValid ? "completed" : "current"
    let step2Status: StepStatus = "upcoming"

    if (tripInfoValid) {
      step2Status = bookingCreated ? "completed" : "current"
    }

    const step3Status: StepStatus = bookingCreated ? "current" : "upcoming"

    return [
      {
        id: 1,
        title: "Thông tin chuyến đi",
        description: "Chọn ngày nhận - trả phòng và số khách",
        status: step1Status,
      },
      {
        id: 2,
        title: "Thông tin khách hàng",
        description: "Liên hệ, số điện thoại và ghi chú cho chủ nhà",
        status: !tripInfoValid ? "upcoming" : step2Status,
      },
      {
        id: 3,
        title: "Thanh toán",
        description: "Chọn phương thức và hoàn tất thanh toán",
        status: step3Status,
      },
    ]
  }, [tripInfoValid, bookingCreated])

  useEffect(() => {
    if (selectedServices.length === 0) {
      setServicesTotal(0)
      return
    }

    if (nights <= 0) {
      return
    }

    const recalculated = recalcServicesForTrip(selectedServices, nights, guests)
    const currentSerialized = JSON.stringify(selectedServices)
    const nextSerialized = JSON.stringify(recalculated)

    if (currentSerialized !== nextSerialized) {
      setSelectedServices(recalculated)
      setServicesTotal(calculateServicesTotal(recalculated))
    } else {
      setServicesTotal(calculateServicesTotal(recalculated))
    }
  }, [nights, guests, selectedServices, recalcServicesForTrip, calculateServicesTotal])

  const handleCheckInChange = (value: string) => {
    setSplitSuggestion(null)
    setSplitPlanApplied(false)
    setSelectedAlternatives({})
    setCheckIn(value)

    if (!value) {
      return
    }

    const checkInDate = new Date(value)
    const currentCheckout = new Date(checkOut)

    if (!checkOut || !(currentCheckout instanceof Date) || currentCheckout <= checkInDate) {
      const next = new Date(checkInDate)
      next.setDate(next.getDate() + 1)
      setCheckOut(formatForInput(next))
    }
  }

  const handleCheckOutChange = (value: string) => {
    setSplitSuggestion(null)
    setSplitPlanApplied(false)
    setSelectedAlternatives({})
    setCheckOut(value)
  }

  const handleSelectAlternative = (segmentId: string, listingId: string) => {
    setSelectedAlternatives((prev) => ({
      ...prev,
      [segmentId]: listingId,
    }))
  }

  const handleApplySegmentDates = (segment: SplitStaySegment) => {
    setCheckIn(segment.startDate)
    setCheckOut(segment.endDate)
    setSplitPlanApplied(true)
    toast({
      title: "Đã áp dụng lịch tạm thời",
      description: `Đặt phòng hiện tại sẽ áp dụng cho giai đoạn ${formatDisplayDate(segment.startDate)} - ${formatDisplayDate(segment.endDate)}.`,
    })
  }

  const handleResetSplitSuggestion = () => {
    setSplitSuggestion(null)
    setSelectedAlternatives({})
    setSplitPlanApplied(false)
  }

  const handleServicesSelectionChange = (total: number, services: SelectedServiceSummary[]) => {
    setSelectedServices(services)
    setServicesTotal(total)
  }

  const handleSubmitConciergePlan = async () => {
    if (!splitSuggestion) {
      toast({
        title: "Chưa có kế hoạch split stay",
        description: "Vui lòng chọn lại ngày và phương án thay thế để concierge có thể xử lý.",
      })
      return
    }

    setIsSubmittingConcierge(true)

    try {
      const response = await fetch("/api/concierge/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingId ?? undefined,
          listingId: listing.id,
          loyaltyOffer: conciergeOfferCopy[selectedOffer] ?? conciergeOfferCopy.upgrade,
          guestNotes: guestConciergeNotes.trim() || undefined,
          hostNotes: hostConciergeNotes.trim() || undefined,
          segments: splitSuggestion.segments,
          selectedAlternatives,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Không thể gửi yêu cầu concierge.")
      }

      const createdPlan = data.plan as ConciergePlan
      setConciergePlan(createdPlan)
      setConciergePlansHistory((prev) => {
        const plans = [createdPlan, ...prev.filter((plan) => plan.id !== createdPlan.id)]
        return plans.slice(0, 5)
      })

      toast({
        title: "Đã gửi yêu cầu concierge",
        description:
          "Đội concierge sẽ giữ chỗ tạm thời và thông báo tới host về kế hoạch di chuyển của bạn.",
      })

      setTimeout(() => {
        splitSuggestionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 200)
    } catch (error: any) {
      console.error("Concierge plan submit error:", error)
      toast({
        title: "Không thể gửi concierge",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingConcierge(false)
    }
  }

  const handleRefreshConciergePlans = () => {
    void fetchConciergePlans()
    toast({
      title: "Đã làm mới concierge plan",
      description: "Thông tin kế hoạch mới nhất đã được cập nhật.",
    })
  }

  const primarySplitSegments = useMemo(
    () => splitSuggestion?.segments.filter((segment) => segment.type === "primary") ?? [],
    [splitSuggestion],
  )
  const gapSplitSegments = useMemo(
    () => splitSuggestion?.segments.filter((segment) => segment.type === "gap") ?? [],
    [splitSuggestion],
  )
  const firstPrimarySegment = primarySplitSegments[0]
  const lastPrimarySegment =
    primarySplitSegments.length > 1 ? primarySplitSegments[primarySplitSegments.length - 1] : null

  useEffect(() => {
    if (splitSuggestion) {
      setHostConciergeNotes(buildHostNoteFromSuggestion(splitSuggestion))
    } else {
      setHostConciergeNotes("")
      setGuestConciergeNotes("")
      setSelectedOffer(conciergeOfferPresets[0]?.id ?? "upgrade")
    }
  }, [splitSuggestion])

  const fetchConciergePlans = useCallback(async () => {
    try {
      const params = bookingId ? `bookingId=${bookingId}` : `listingId=${listing.id}`
      const response = await fetch(`/api/concierge/plans?${params}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Không thể tải concierge plan")
      }
      const data = await response.json()
      const plans = (data?.plans as ConciergePlan[]) || []
      setConciergePlansHistory(plans)
      setConciergePlan(plans[0] ?? null)
    } catch (error) {
      console.warn("Không thể tải concierge plan:", error)
    }
  }, [listing.id, bookingId])

  useEffect(() => {
    fetchConciergePlans()
  }, [fetchConciergePlans])

  const canCreateBooking = tripInfoValid && guestInfoCompleted
  const confirmButtonLabel = isSubmitting
    ? "Đang tạo đặt phòng..."
    : bookingCreated
      ? "Tạo lại đơn đặt phòng"
      : splitPlanApplied
        ? "Tạo đặt phòng cho khoảng đã chọn"
        : "Xác nhận & tạo đơn đặt phòng"

  const conciergeSubmitLabel = isSubmittingConcierge
    ? "Đang gửi concierge..."
    : conciergePlan
      ? "Cập nhật concierge"
      : "Nhờ concierge giữ phòng"

  const handleCreateBooking = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      toast({
        title: "Ngày đặt phòng chưa hợp lệ",
        description: "Vui lòng kiểm tra lại ngày nhận và trả phòng.",
        variant: "destructive",
      })
      return
    }

    if (!guestInfo.fullName.trim() || !guestInfo.phone.trim() || !guestInfo.email.trim()) {
      toast({
        title: "Thiếu thông tin liên hệ",
        description: "Vui lòng cung cấp đầy đủ họ tên, số điện thoại và email để tiếp tục.",
        variant: "destructive",
      })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email.trim())) {
      toast({
        title: "Email chưa hợp lệ",
        description: "Vui lòng kiểm tra lại địa chỉ email.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn: toISODate(checkIn),
          checkOut: toISODate(checkOut),
          adults: guests,
          children: 0,
          infants: 0,
          pets: 0,
          specialRequests: guestInfo.specialRequests,
          guestName: guestInfo.fullName.trim(),
          guestPhone: guestInfo.phone.trim(),
          guestEmail: guestInfo.email.trim(),
          additionalServices: selectedServices,
          additionalServicesTotal: servicesTotal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data?.splitSuggestion) {
          setBookingId(null)
          setBookingCode(null)
          setSplitSuggestion(data.splitSuggestion as SplitStaySuggestion)
          setSelectedAlternatives({})
          setSplitPlanApplied(false)

          toast({
            title: "Một số đêm đã kín phòng",
            description:
              data.error ||
              "Bạn có thể tham khảo gợi ý chia kỳ nghỉ tạm thời trước khi tiếp tục.",
          })

          setTimeout(() => {
            splitSuggestionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 300)

          return
        }

        if (data?.conflict) {
          const formatter = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          const conflictRange = `${formatter.format(new Date(data.conflict.checkIn))} - ${formatter.format(
            new Date(data.conflict.checkOut),
          )}`
          throw new Error(`${data.error || "Khoảng thời gian đã kín."} (${conflictRange})`)
        }

        if (data?.blocked) {
          const formatter = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          const blockedRange = `${formatter.format(new Date(data.blocked.startDate))} - ${formatter.format(
            new Date(data.blocked.endDate),
          )}`
          throw new Error(`${data.error || "Khoảng thời gian đã bị chặn."} (${blockedRange})`)
        }

        throw new Error(data?.error || "Không thể tạo đặt phòng.")
      }

      const booking = data.booking || data
      setSplitSuggestion(null)
      setSelectedAlternatives({})
      setSplitPlanApplied(false)
      setBookingId(booking.id)
      setBookingCode(booking.id?.slice(-8).toUpperCase?.() || null)

      // Award loyalty points & quests for logged-in users (async)
      if (session?.user) {
        import("@/lib/rewards").then(({ awardBookingPoints }) => {
          awardBookingPoints(booking.id, false).catch((err) =>
            console.error("Failed to award booking points:", err),
          )
        })

        import("@/lib/quests").then(({ trackBookingQuest }) => {
          trackBookingQuest(booking.id, false).catch((err) =>
            console.error("Failed to track booking quest:", err),
          )
        })
      }

      toast({
        title: "Đã tạo đơn đặt phòng",
        description: "Bạn có thể tiếp tục lựa chọn phương thức thanh toán để hoàn tất.",
      })

      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 400)
    } catch (error: any) {
      console.error("Create booking error:", error)
      toast({
        title: "Không thể tạo đặt phòng",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {steps.map((step, index) => {
            const isCompleted = step.status === "completed"
            const isCurrent = step.status === "current"
            const circleClasses = [
              "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
              isCompleted
                ? "border-primary bg-primary text-primary-foreground"
                : isCurrent
                  ? "border-primary text-primary"
                  : "border-muted-foreground text-muted-foreground",
            ].join(" ")
            const titleClasses = [
              "text-sm font-semibold",
              isCompleted
                ? "text-foreground"
                : isCurrent
                  ? "text-primary"
                  : "text-muted-foreground",
            ].join(" ")

            return (
              <div key={step.id} className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={circleClasses}>{step.id}</div>
                  <div className="space-y-1">
                    <p className={titleClasses}>{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && <div className="hidden lg:block h-px flex-1 bg-border" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Bước 1 · Thông tin chuyến đi</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Điều chỉnh ngày nhận - trả phòng và số khách trước khi tiếp tục.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Nhận phòng</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    min={formatForInput(new Date())}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Trả phòng</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Số khách</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bạn có thể điều chỉnh thông tin trên nếu kế hoạch thay đổi trước khi thanh toán.
              </p>

              {!tripInfoValid && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertDescription>
                    Ngày trả phòng phải sau ngày nhận phòng. Vui lòng chọn lại để tiếp tục.
                  </AlertDescription>
                </Alert>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Bước 1.1 · Dịch vụ bổ sung</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Concierge sẽ chuẩn bị các dịch vụ bạn chọn trước khi check-in.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowServicesModal(true)}>
              Chọn dịch vụ
              {selectedServices.length > 0 && <span className="ml-2 text-primary">({selectedServices.length})</span>}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedServices.length > 0 ? (
              <div className="space-y-3">
                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      {service.quantityLabel && (
                        <span className="text-xs text-muted-foreground">{service.quantityLabel}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {service.totalPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span className="text-muted-foreground">Tổng dịch vụ</span>
                  <span className="text-primary">{servicesTotal.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Chưa có dịch vụ nào được thêm. Nhấn "Chọn dịch vụ" để bổ sung tiện ích cho chuyến đi.
              </div>
            )}
          </CardContent>
        </Card>

        {splitSuggestion && (
          <div ref={splitSuggestionSectionRef}>
            <Card className="border border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Phát hiện đêm hết phòng · Đề xuất chia kỳ nghỉ
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {splitSuggestion.message}
                </p>
                <div className="mt-3 rounded-md bg-white/60 px-3 py-2 text-sm text-foreground shadow-sm">
                  Khoảng yêu cầu:{" "}
                  <span className="font-semibold text-primary">
                    {formatDisplayDate(splitSuggestion.requested.startDate)} →{" "}
                    {formatDisplayDate(splitSuggestion.requested.endDate)}
                  </span>{" "}
                  · {splitSuggestion.requested.nights} đêm · {splitSuggestion.primaryListing.title}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {splitSuggestion.segments.map((segment) => {
                    const isPrimary = segment.type === "primary"
                    const locationLabel = [splitSuggestion.primaryListing.city, splitSuggestion.primaryListing.state, splitSuggestion.primaryListing.country]
                      .filter(Boolean)
                      .join(", ")
                    const hasAlternatives = (segment.alternatives?.length ?? 0) > 0
                    const selectedAlternative = selectedAlternatives[segment.id]
                    const isCurrentRange = checkIn === segment.startDate && checkOut === segment.endDate

                    return (
                      <div
                        key={segment.id}
                        className={cn(
                          "rounded-lg border bg-white/80 p-4 shadow-sm transition-all",
                          isPrimary ? "border-emerald-200" : "border-amber-200",
                        )}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isPrimary ? "text-emerald-700" : "text-amber-700",
                              )}
                            >
                              {isPrimary ? "Phòng hiện tại còn trống" : "Đêm chưa có phòng phù hợp"}
                            </p>
                            <p className="text-sm text-foreground">
                              {formatDisplayDate(segment.startDate)} → {formatDisplayDate(segment.endDate)} · {segment.nights} đêm
                            </p>
                            {isPrimary ? (
                              <p className="text-xs text-muted-foreground">
                                Địa điểm: {locationLabel}. Ước tính chi phí:{" "}
                                <span className="font-semibold text-foreground">
                                  {segment.estimatedTotal ? formatCurrency(segment.estimatedTotal) : formatCurrency(listing.basePrice * segment.nights)}
                                </span>
                              </p>
                            ) : (
                              <div className="space-y-2 text-xs text-muted-foreground">
                                {segment.conflicts?.map((conflict, conflictIndex) => (
                                  <div key={`${segment.id}-conflict-${conflictIndex}`} className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">
                                    {conflict.type === "booking" ? "Đã có khách" : "Chủ nhà chặn lịch"} từ{" "}
                                    <span className="font-semibold">
                                      {formatDisplayDate(conflict.range.startDate)} → {formatDisplayDate(conflict.range.endDate)}
                                    </span>
                                    {conflict.note ? ` · Ghi chú: ${conflict.note}` : ""}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {isPrimary ? (
                            <div className="flex flex-col items-start gap-2 md:items-end">
                              <Button
                                type="button"
                                size="sm"
                                variant={isCurrentRange && splitPlanApplied ? "secondary" : "outline"}
                                onClick={() => handleApplySegmentDates(segment)}
                                className="w-full md:w-auto"
                              >
                                {isCurrentRange && splitPlanApplied ? "Đang áp dụng" : "Áp dụng ngày này"}
                              </Button>
                              {isCurrentRange && splitPlanApplied && (
                                <span className="text-xs text-emerald-700">Biểu mẫu đang sử dụng khoảng ngày này.</span>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {!isPrimary && (
                          <div className="mt-4 space-y-3">
                            {hasAlternatives ? (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Phòng tương đương còn trống cho đêm này
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  {segment.alternatives?.map((alternative) => {
                                    const isSelected = selectedAlternative === alternative.id
                                    const addressParts = [alternative.city, alternative.state, alternative.country]
                                      .filter(Boolean)
                                      .join(", ")
                                    const alternativeUrl = alternative.slug
                                      ? `/listing/${alternative.slug}`
                                      : `/listing/${alternative.id}`
                                    const bookingLink = `${alternativeUrl}?checkIn=${segment.startDate}&checkOut=${segment.endDate}&guests=${guests}`

                                    return (
                                      <button
                                        key={alternative.id}
                                        type="button"
                                        onClick={() => handleSelectAlternative(segment.id, alternative.id)}
                                        className={cn(
                                          "flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition",
                                          isSelected
                                            ? "border-primary bg-primary/10 shadow-sm"
                                            : "border-border hover:border-primary/40 hover:bg-primary/5",
                                        )}
                                      >
                                        <div className="flex items-start gap-3">
                                          {alternative.image ? (
                                            <img
                                              src={alternative.image}
                                              alt={alternative.title}
                                              className="h-16 w-16 rounded-md object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                              Không ảnh
                                            </div>
                                          )}
                                          <div className="flex-1 space-y-1">
                                            <p className="text-sm font-semibold text-foreground">{alternative.title}</p>
                                            <p className="text-xs text-muted-foreground">{addressParts}</p>
                                            {typeof alternative.distanceKm === "number" && (
                                              <p className="text-xs text-muted-foreground">
                                                Cách khoảng {alternative.distanceKm} km
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-semibold text-foreground">
                                            {formatCurrency(alternative.estimatedTotal)}
                                          </span>
                                          {alternative.priceDifference !== 0 && (
                                            <span
                                              className={cn(
                                                "text-xs font-medium",
                                                alternative.priceDifference > 0 ? "text-amber-600" : "text-emerald-600",
                                              )}
                                            >
                                              {alternative.priceDifference > 0 ? "+" : "−"}
                                              {formatCurrency(Math.abs(alternative.priceDifference))} so với phòng hiện tại
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                          <a
                                            href={bookingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary underline hover:text-primary/80"
                                          >
                                            Mở trang phòng
                                          </a>
                                          {isSelected && <span className="text-primary">Đang chọn làm phòng tạm</span>}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Tạm thời chưa có phòng tương đương trống cho đêm này. Vui lòng thử điều chỉnh ngày hoặc liên hệ đội hỗ trợ để được gợi ý thêm.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-lg border border-primary/30 bg-white/90 p-4 shadow-inner space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-primary">Nhờ concierge giữ chỗ tạm & ưu đãi quay lại</p>
                    <p className="text-xs text-muted-foreground">
                      Concierge sẽ liên hệ host và đối tác để ghép lịch liền mạch, đồng thời ghi chú hành trình giúp bạn quay lại thuận tiện.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Ưu đãi dành cho khách khi quay lại
                    </Label>
                    <RadioGroup
                      value={selectedOffer}
                      onValueChange={setSelectedOffer}
                      className="grid gap-2 md:grid-cols-3"
                    >
                      {conciergeOfferPresets.map((offer) => (
                        <label
                          key={offer.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition",
                            selectedOffer === offer.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-primary/5",
                          )}
                        >
                          <RadioGroupItem value={offer.id} className="mt-1" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{offer.label}</p>
                            <p className="text-xs text-muted-foreground">{offer.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="conciergeGuestNotes" className="text-xs font-semibold uppercase text-muted-foreground">
                        Ghi chú thêm cho concierge (tùy chọn)
                      </Label>
                      <Textarea
                        id="conciergeGuestNotes"
                        placeholder="Ví dụ: gia đình có trẻ nhỏ, cần xe đưa đón giữa hai cơ sở..."
                        value={guestConciergeNotes}
                        onChange={(event) => setGuestConciergeNotes(event.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="conciergeHostNotes" className="text-xs font-semibold uppercase text-muted-foreground">
                          Thông tin gửi host chuẩn bị
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => splitSuggestion && setHostConciergeNotes(buildHostNoteFromSuggestion(splitSuggestion))}
                        >
                          Tạo lại ghi chú
                        </Button>
                      </div>
                      <Textarea
                        id="conciergeHostNotes"
                        value={hostConciergeNotes}
                        onChange={(event) => setHostConciergeNotes(event.target.value)}
                        rows={4}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Concierge sẽ chuyển thẳng ghi chú này cho host để chuẩn bị lúc bạn quay lại.
                      </p>
                    </div>
                  </div>

                  {conciergePlan && (
                    <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-primary">Concierge đã ghi nhận kế hoạch</p>
                          {conciergePlan.hostNotes && (
                            <p className="text-xs text-muted-foreground">
                              Host note: <span className="text-foreground">{conciergePlan.hostNotes}</span>
                            </p>
                          )}
                          {conciergePlan.loyaltyOffer && (
                            <p className="text-xs text-muted-foreground">
                              Ưu đãi: <span className="text-foreground">{conciergePlan.loyaltyOffer}</span>
                            </p>
                          )}
                          {conciergePlan.partnerInfo?.length ? (
                            <p className="text-xs text-muted-foreground">
                              Đối tác dự phòng:{" "}
                              {conciergePlan.partnerInfo
                                .map((partner) => `${partner.title}${partner.sameHost ? " (cùng chuỗi)" : ""}`)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
                          {conciergePlanStatusLabel[conciergePlan.status]}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-blue-800 space-y-1">
                    <span>
                      Hãy tạo đặt phòng riêng cho từng khoảng ngày vẫn còn phòng tại cơ sở này
                      {firstPrimarySegment && (
                        <>
                          :
                          <span className="font-semibold"> {formatDisplayDate(firstPrimarySegment.startDate)} → {formatDisplayDate(firstPrimarySegment.endDate)}</span>
                        </>
                      )}
                      {lastPrimarySegment && lastPrimarySegment !== firstPrimarySegment && (
                        <>
                          {" "}và
                          <span className="font-semibold"> {formatDisplayDate(lastPrimarySegment.startDate)} → {formatDisplayDate(lastPrimarySegment.endDate)}</span>
                        </>
                      )}
                      .
                    </span>
                    {gapSplitSegments.length > 0 && (
                      <span>
                        Với đêm thiếu, chọn một phòng tạm trong danh sách rồi mở tab mới để giữ chỗ. Đội ngũ hỗ trợ sẽ ghi chú để host chuẩn bị khi bạn quay lại.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-primary text-white hover:bg-primary-hover"
                    onClick={handleSubmitConciergePlan}
                    disabled={isSubmittingConcierge}
                  >
                    {conciergeSubmitLabel}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRefreshConciergePlans}>
                    Làm mới concierge plan
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetSplitSuggestion}>
                    Chỉnh lại ngày khác
                  </Button>
                  {gapSplitSegments.length > 0 && selectedAlternatives && Object.keys(selectedAlternatives).length > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        toast({
                          title: "Đã chọn phòng tạm",
                          description: "Bạn có thể mở phòng đã chọn ở tab mới và tiến hành giữ chỗ cho đêm thiếu.",
                        })
                      }
                    >
                      Ghi nhớ phòng tạm đã chọn
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <GuestInfoForm
          onInfoChange={setGuestInfo}
          onLoginClick={authModal.openLogin}
          titlePrefix="Bước 2 ·"
        />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Bước 3 · Xác nhận đặt phòng</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Lưu thông tin liên hệ để tạo yêu cầu đặt phòng trước khi chuyển sang thanh toán.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!guestInfoCompleted && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertDescription>
                    Vui lòng điền đầy đủ họ tên, số điện thoại và email để tạo đơn đặt phòng.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-6 text-lg"
                onClick={handleCreateBooking}
                disabled={isSubmitting || !canCreateBooking}
              >
                {confirmButtonLabel}
              </Button>

              {bookingId ? (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-sm text-green-700">
                    Đặt phòng đã được tạo thành công.
                    {bookingCode && (
                      <>
                        {" "}
                        Mã đặt phòng:{" "}
                        <span className="font-semibold text-green-900">{bookingCode}</span>.
                      </>
                    )}{" "}
                    Tiếp tục thanh toán để hoàn tất.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-700">
                    Vui lòng hoàn tất thông tin khách và xác nhận đặt phòng trước khi thanh toán.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div id="payment-section" ref={paymentSectionRef} className="scroll-mt-24">
            <PaymentMethods
              bookingId={bookingId ?? undefined}
              amount={totalAmount}
              bookingCode={bookingCode ?? undefined}
              disabled={!bookingCreated}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-24 space-y-4">
            {splitSuggestion && (
              <Card className="border border-primary/40 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">Kế hoạch split stay tạm thời</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Tạo hai (hoặc nhiều) đặt phòng riêng biệt để giữ lịch trình liền mạch.
                  </p>
                  {conciergePlan && (
                    <div className="pt-2">
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Concierge: {conciergePlanStatusLabel[conciergePlan.status]}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {splitSuggestion.segments.map((segment) => {
                    const isPrimary = segment.type === "primary"
                    const selectedAlternativeId = selectedAlternatives[segment.id]
                    const selectedAlternative = segment.alternatives?.find((alt) => alt.id === selectedAlternativeId)

                    return (
                      <div
                        key={`summary-${segment.id}`}
                        className={cn(
                          "rounded-md border px-3 py-2",
                          isPrimary ? "border-emerald-200 bg-white" : "border-amber-200 bg-white",
                        )}
                      >
                        <p className="font-semibold text-foreground">
                          {formatDisplayDate(segment.startDate)} → {formatDisplayDate(segment.endDate)} · {segment.nights} đêm
                        </p>
                        {isPrimary ? (
                          <p className="text-xs text-muted-foreground">
                            Ở lại {splitSuggestion.primaryListing.title}. Ước tính: {segment.estimatedTotal ? formatCurrency(segment.estimatedTotal) : formatCurrency(listing.basePrice * segment.nights)}.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {selectedAlternative
                              ? `Tạm chuyển sang ${selectedAlternative.title} (${formatCurrency(selectedAlternative.estimatedTotal)})`
                              : "Chọn một phòng tạm hoặc điều chỉnh ngày để xử lý đêm thiếu."}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {conciergePlan?.loyaltyOffer && (
                    <div className="rounded-md border border-dashed border-primary/30 bg-white/90 px-3 py-2 text-xs text-muted-foreground">
                      Ưu đãi concierge: <span className="text-foreground">{conciergePlan.loyaltyOffer}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sau khi hoàn tất mỗi đặt phòng, hãy cập nhật hành trình của bạn để host biết lịch di chuyển.
                  </p>
                </CardContent>
              </Card>
            )}

            <BookingSummary
              listing={summaryListing}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              additionalServices={selectedServices}
              additionalServicesTotal={servicesTotal}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết chi phí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tiền phòng</span>
                  <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dọn dẹp</span>
                  <span>{cleaningFee.toLocaleString("vi-VN")}₫</span>
                </div>
                {servicesTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Dịch vụ bổ sung</span>
                    <span>{servicesTotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí dịch vụ</span>
                  <span>{serviceFee.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>Tổng cộng</span>
                  <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showServicesModal} onOpenChange={setShowServicesModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chọn dịch vụ bổ sung</DialogTitle>
            <DialogDescription>
              Các dịch vụ sẽ được cộng thêm vào tổng chi phí và concierge sẽ chuẩn bị trước khi bạn đến.
            </DialogDescription>
          </DialogHeader>

          <ServicesSelection
            nights={nights}
            guests={guests}
            value={selectedServices}
            onServicesChange={handleServicesSelectionChange}
          />

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tổng dịch vụ: <span className="font-semibold text-primary">{servicesTotal.toLocaleString("vi-VN")}₫</span>
              </p>
              <Button type="button" onClick={() => setShowServicesModal(false)}>
                Hoàn tất
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
