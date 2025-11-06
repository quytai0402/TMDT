"use client"

import { useEffect, useMemo, useState } from "react"
import { addDays, differenceInCalendarDays, format, formatDistanceToNowStrict, isWithinInterval, startOfDay } from "date-fns"
import { vi } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { CalendarCheck, CalendarX2, CheckCircle2, Loader2, ShieldCheck, Undo2, X } from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useListings } from "@/hooks/use-listings"
import { toast } from "@/lib/toast"

type HostListingSummary = {
  id: string
  title: string
  city?: string | null
  country?: string | null
  status?: string | null
}

type CalendarBlockedDate = {
  id: string
  startDate: Date
  endDate: Date
  reason?: string | null
}

type CalendarBooking = {
  id: string
  checkIn: Date
  checkOut: Date
  status: string
  contactName?: string | null
  guestName?: string | null
}

const now = startOfDay(new Date())

const formatRange = (start: Date, end: Date) => {
  const sameDay = differenceInCalendarDays(end, start) === 0
  if (sameDay) {
    return format(start, "dd/MM/yyyy", { locale: vi })
  }
  return `${format(start, "dd/MM/yyyy", { locale: vi })} - ${format(end, "dd/MM/yyyy", { locale: vi })}`
}

export default function HostCalendarPage() {
  const { getMyListings } = useListings()
  const [listings, setListings] = useState<HostListingSummary[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [blockedDates, setBlockedDates] = useState<CalendarBlockedDate[]>([])
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [blockReason, setBlockReason] = useState("")

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoadingListings(true)
        const response = await getMyListings()
        const extracted: HostListingSummary[] = Array.isArray(response)
          ? response.map((item: any) => ({
              id: item.id ?? item._id,
              title: item.title ?? "Chỗ ở chưa đặt tên",
              city: item.city ?? item.location?.city ?? null,
              country: item.country ?? item.location?.country ?? null,
              status: item.status ?? null,
            }))
          : Array.isArray(response?.listings)
            ? response.listings.map((item: any) => ({
                id: item.id ?? item._id,
                title: item.title ?? "Chỗ ở chưa đặt tên",
                city: item.city ?? item.location?.city ?? null,
                country: item.country ?? item.location?.country ?? null,
                status: item.status ?? null,
              }))
            : []

        setListings(extracted)
        if (extracted.length > 0) {
          setSelectedListingId((current) => current ?? extracted[0]?.id ?? null)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải danh sách listing"
        toast.error(message)
      } finally {
        setLoadingListings(false)
      }
    }

    void fetchListings()
  }, [getMyListings])

  useEffect(() => {
    if (!selectedListingId) {
      setBlockedDates([])
      setBookings([])
      return
    }

    const fetchCalendarData = async () => {
      try {
        setLoadingCalendar(true)

        const [blockedRes, bookingsRes] = await Promise.all([
          fetch(`/api/listings/${selectedListingId}/blocked-dates`, { cache: "no-store" }),
          fetch(`/api/listings/${selectedListingId}/bookings?status=CONFIRMED,PENDING`, { cache: "no-store" }),
        ])

        if (blockedRes.ok) {
          const blocked = await blockedRes.json()
          const normalized: CalendarBlockedDate[] = Array.isArray(blocked)
            ? blocked.map((item: any) => ({
                id: item.id ?? item._id,
                startDate: new Date(item.startDate),
                endDate: new Date(item.endDate),
                reason: item.reason ?? null,
              }))
            : []
          setBlockedDates(normalized)
        } else {
          setBlockedDates([])
        }

        if (bookingsRes.ok) {
          const bookingPayload = await bookingsRes.json()
          const normalized: CalendarBooking[] = Array.isArray(bookingPayload)
            ? bookingPayload.map((item: any) => ({
                id: item.id ?? item._id,
                checkIn: new Date(item.checkIn),
                checkOut: new Date(item.checkOut),
                status: item.status,
                contactName: item.contactName ?? null,
                guestName: item.guest?.name ?? null,
              }))
            : []
          setBookings(normalized)
        } else {
          setBookings([])
        }
      } catch (error) {
        console.error('Failed to load calendar data', error)
        toast.error("Không thể tải dữ liệu lịch")
      } finally {
        setLoadingCalendar(false)
      }
    }

    void fetchCalendarData()
  }, [selectedListingId])

  const isDateBlocked = (date: Date) =>
    blockedDates.some((blocked) => isWithinInterval(date, { start: blocked.startDate, end: blocked.endDate }))

  const isDateBooked = (date: Date) =>
    bookings.some((booking) => isWithinInterval(date, { start: booking.checkIn, end: addDays(booking.checkOut, -1) }))

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.checkOut >= now)
      .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
      .slice(0, 6)
  }, [bookings])

  const handleBlockRange = async () => {
    if (!selectedListingId) return
    if (!dateRange?.from) {
      toast.warning("Chọn khoảng thời gian cần chặn")
      return
    }

    const startDate = dateRange.from
    const endDate = dateRange.to ?? dateRange.from

    try {
      setLoadingCalendar(true)
      const response = await fetch(`/api/listings/${selectedListingId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason: blockReason || undefined }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Không thể chặn lịch")
      }

      const created = payload.blockedDate
      if (created) {
        setBlockedDates((prev) => [
          ...prev,
          {
            id: created.id ?? created._id,
            startDate: new Date(created.startDate),
            endDate: new Date(created.endDate),
            reason: created.reason ?? null,
          },
        ])
      }

      setDateRange(undefined)
      setBlockReason("")
      toast.success("Đã chặn lịch", {
        description: `Khoảng ${formatRange(startDate, endDate)} sẽ không thể đặt phòng cho tới khi bạn mở lại.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể chặn lịch"
      toast.error(message)
    } finally {
      setLoadingCalendar(false)
    }
  }

  const handleUnblock = async (blockedId: string) => {
    if (!selectedListingId) return

    try {
      setLoadingCalendar(true)
      const response = await fetch(`/api/listings/${selectedListingId}/blocked-dates?blockId=${blockedId}`, {
        method: "DELETE",
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Không thể mở lại lịch")
      }

      setBlockedDates((prev) => prev.filter((item) => item.id !== blockedId))
      toast.success("Đã mở lại lịch")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể mở lại lịch"
      toast.error(message)
    } finally {
      setLoadingCalendar(false)
    }
  }

  const resetSelection = () => {
    setDateRange(undefined)
    setBlockReason("")
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lịch đặt phòng</h1>
            <p className="text-sm text-muted-foreground">
              Chọn listing để quản lý lịch trống, chặn ngày và theo dõi các booking đã được xác nhận theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <label className="text-xs font-medium uppercase text-muted-foreground">Quản lý lịch cho</label>
            <Select
              value={selectedListingId ?? undefined}
              onValueChange={(value) => setSelectedListingId(value)}
              disabled={loadingListings || listings.length === 0}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Chọn một listing" />
              </SelectTrigger>
              <SelectContent>
                {listings.map((listing) => (
                  <SelectItem key={listing.id} value={listing.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{listing.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {listing.city ? `${listing.city}${listing.country ? ", " : ""}` : ""}
                        {listing.country ?? ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedListingId ? null : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              {loadingListings ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Đang tải danh sách listing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-6 w-6" />
                  <span>Hãy tạo ít nhất 1 listing để quản lý lịch</span>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {selectedListingId ? (
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="h-fit">
              <CardHeader className="space-y-2">
                <CardTitle>Chọn ngày chặn lịch</CardTitle>
                <CardDescription>
                  Những ngày đã đặt hoặc đang bị chặn sẽ được tô màu. Bạn có thể chọn một hoặc nhiều ngày liên tiếp để chặn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={vi}
                    disabled={(date) => date < now}
                    modifiers={{
                      blocked: (date) => isDateBlocked(date),
                      booked: (date) => isDateBooked(date),
                    }}
                    modifiersStyles={{
                      blocked: { backgroundColor: "#fee2e2", color: "#991b1b" },
                      booked: { backgroundColor: "#fef9c3", color: "#854d0e" },
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ghi chú (tuỳ chọn)</label>
                    <Textarea
                      value={blockReason}
                      onChange={(event) => setBlockReason(event.target.value)}
                      placeholder="Ví dụ: Bảo trì hồ bơi, dùng cho mục đích cá nhân..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button type="button" onClick={handleBlockRange} disabled={loadingCalendar}>
                      {loadingCalendar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CalendarX2 className="mr-2 h-4 w-4" />
                          Chặn khoảng ngày
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetSelection}>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Bỏ chọn
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
                  <p className="font-medium uppercase">Chú thích</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded bg-amber-200" />
                      <span>Đang có booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded bg-rose-200" />
                      <span>Đang bị chặn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded border border-border" />
                      <span>Có thể chặn</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking sắp tới</CardTitle>
                  <CardDescription>
                    Các đơn đã xác nhận hoặc đang chờ xác nhận trong 90 ngày tới.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCalendar ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tải booking...</span>
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
                      <CalendarCheck className="h-6 w-6" />
                      <span>Chưa có booking nào trong thời gian tới</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="rounded-lg border bg-background p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {formatRange(booking.checkIn, addDays(booking.checkOut, -1))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {booking.guestName || booking.contactName || "Khách LuxeStay"}
                              </p>
                            </div>
                            <Badge variant="secondary">{booking.status}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Check-in sau {formatDistanceToNowStrict(booking.checkIn, { locale: vi })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lịch đang bị chặn</CardTitle>
                  <CardDescription>
                    Nhấn “Mở lại” để cho phép khách đặt trong khoảng thời gian tương ứng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCalendar ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  ) : blockedDates.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-6 w-6" />
                      <span>Toàn bộ lịch đang mở cho khách đặt.</span>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[320px] pr-2">
                      <div className="space-y-3">
                        {blockedDates
                          .slice()
                          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                          .map((blocked) => (
                            <div key={blocked.id} className="flex gap-3 rounded-lg border bg-background p-4">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  {formatRange(blocked.startDate, blocked.endDate)}
                                </p>
                                {blocked.reason ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{blocked.reason}</p>
                                ) : null}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0"
                                onClick={() => handleUnblock(blocked.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Mở lại</span>
                              </Button>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </HostLayout>
  )
}
