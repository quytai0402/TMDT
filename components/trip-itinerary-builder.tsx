"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  MapPin,
  Plus,
  Clock,
  Home,
  Utensils,
  Camera,
  ShoppingBag,
  Mountain,
  Trash2,
  GripVertical,
  Edit,
  Sparkles,
  Loader2,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export interface ItineraryItem {
  id: string
  day: number
  time: string
  type: "accommodation" | "dining" | "activity" | "shopping" | "sightseeing"
  title: string
  location: string
  notes?: string
  duration?: string
  cost?: number
  suggestionId?: string | null
}

export interface PlannerSuggestion {
  id: string
  title: string
  type: "accommodation" | "dining" | "activity" | "shopping" | "sightseeing"
  location: string
  notes?: string | null
  time?: string | null
  dayOffset?: number | null
  distanceKm?: number | null
}

interface TripItineraryBuilderProps {
  bookingId?: string | null
  items?: ItineraryItem[]
  defaultDays?: number
  maxDays?: number
  tripStart?: string | null
  tripEnd?: string | null
  suggestions?: PlannerSuggestion[]
  suggestionsLoading?: boolean
  onRefresh?: (options?: { silent?: boolean }) => Promise<unknown>
}

const activityIcons = {
  accommodation: Home,
  dining: Utensils,
  activity: Mountain,
  shopping: ShoppingBag,
  sightseeing: Camera,
}

const activityColors = {
  accommodation: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  dining: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  activity: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  shopping: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  sightseeing: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
}

const itemTypeOptions: Array<{
  value: ItineraryItem["type"]
  label: string
  description: string
}> = [
  {
    value: "accommodation",
    label: "Lưu trú",
    description: "Check-in/out, dịch vụ phòng, hỗ trợ homestay",
  },
  {
    value: "dining",
    label: "Ăn uống",
    description: "Nhà hàng, quán cafe, bữa tối đặc biệt",
  },
  {
    value: "activity",
    label: "Hoạt động",
    description: "Trải nghiệm, tour, hoạt động thư giãn",
  },
  {
    value: "shopping",
    label: "Mua sắm",
    description: "Chợ đêm, trung tâm thương mại, đặc sản",
  },
  {
    value: "sightseeing",
    label: "Tham quan",
    description: "Danh thắng, điểm check-in, bảo tàng",
  },
]

const allowedTypes = new Set(itemTypeOptions.map((option) => option.value))

const generatePlannerId = () => {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return `planner-${window.crypto.randomUUID()}`
  }
  return `planner-${Date.now()}`
}

type PlannerFormState = {
  title: string
  location: string
  type: ItineraryItem["type"]
  day: number
  time: string
  notes: string
  duration: string
  cost: string
  suggestionId?: string | null
}

const DEFAULT_TIME = "10:00"
const MAX_ALLOWED_DAYS = 60

const createEmptyFormState = (day: number): PlannerFormState => ({
  title: "",
  location: "",
  type: "activity",
  day,
  time: DEFAULT_TIME,
  notes: "",
  duration: "",
  cost: "",
  suggestionId: null,
})

const mapPlannerItemToItinerary = (item: any): ItineraryItem => {
  const fallbackTitle = "Hoạt động concierge"
  const rawType = item?.type
  const resolvedType = allowedTypes.has(rawType) ? rawType : "activity"

  return {
    id: typeof item?.id === "string" ? item.id : generatePlannerId(),
    day: Number.isFinite(Number(item?.day)) && Number(item?.day) > 0 ? Number(item.day) : 1,
    time: typeof item?.time === "string" && item.time ? item.time : DEFAULT_TIME,
    type: resolvedType,
    title: typeof item?.title === "string" && item.title ? item.title : fallbackTitle,
    location:
      typeof item?.location === "string" && item.location ? item.location : "Địa điểm đang cập nhật",
    notes: typeof item?.notes === "string" && item.notes ? item.notes : undefined,
    duration: typeof item?.duration === "string" && item.duration ? item.duration : undefined,
    cost: typeof item?.cost === "number" && Number.isFinite(item.cost) ? item.cost : undefined,
    suggestionId: typeof item?.suggestionId === "string" ? item.suggestionId : null,
  }
}

export function TripItineraryBuilder({
  bookingId,
  items: externalItems,
  defaultDays,
  maxDays,
  tripStart,
  tripEnd,
  suggestions,
  suggestionsLoading,
  onRefresh,
}: TripItineraryBuilderProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [items, setItems] = useState<ItineraryItem[]>(externalItems ?? [])
  const [formState, setFormState] = useState<PlannerFormState>(createEmptyFormState(1))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ItineraryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(null)
  const [suggestionList, setSuggestionList] = useState<PlannerSuggestion[]>(suggestions ?? [])

  const canMutate = Boolean(bookingId)

  const fallbackDays = useMemo(() => Math.max(1, defaultDays ?? 3), [defaultDays])
  const allowedDays = useMemo(() => {
    const limitFromProps = Math.max(1, maxDays ?? fallbackDays)
    return Math.min(MAX_ALLOWED_DAYS, limitFromProps)
  }, [fallbackDays, maxDays])

  const tripWindowLabel = useMemo(() => {
    if (!tripStart || !tripEnd) return null

    const start = new Date(tripStart)
    const end = new Date(tripEnd)

    return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`
  }, [tripStart, tripEnd])

  useEffect(() => {
    setItems(externalItems ?? [])
    if (externalItems && externalItems.length) {
      setSelectedDay((current) => {
        const initialDay = externalItems.some((item) => item.day === current)
          ? current
          : Math.max(1, externalItems[0]?.day ?? 1)
        return Math.min(initialDay, allowedDays)
      })
    } else {
      setSelectedDay(1)
    }
  }, [externalItems, allowedDays])

  useEffect(() => {
    setSuggestionList(suggestions ?? [])
  }, [suggestions])

  useEffect(() => {
    if (!dialogOpen && !editingId) {
      setFormState(createEmptyFormState(selectedDay))
    }
  }, [dialogOpen, editingId, selectedDay])

  const totalDays = useMemo(() => {
    const maxDayFromItems = items.length > 0 ? Math.max(...items.map((item) => item.day || 1)) : 1
    return Math.max(allowedDays, maxDayFromItems)
  }, [items, allowedDays])

  const dayItems = useMemo(() => items.filter((item) => item.day === selectedDay), [items, selectedDay])
  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + (item.cost || 0), 0),
    [items],
  )

  const openCreateDialog = useCallback(
    (day: number) => {
      const safeDay = Math.min(Math.max(day, 1), allowedDays)
      setEditingId(null)
      setFormState(createEmptyFormState(safeDay))
      setDialogOpen(true)
    },
    [allowedDays],
  )

  const openEditDialog = useCallback((item: ItineraryItem) => {
    const safeDay = Math.min(Math.max(item.day ?? 1, 1), allowedDays)
    setEditingId(item.id)
    setFormState({
      title: item.title ?? "",
      location: item.location ?? "",
      type: item.type,
      day: safeDay,
      time: item.time ?? DEFAULT_TIME,
      notes: item.notes ?? "",
      duration: item.duration ?? "",
      cost: typeof item.cost === "number" ? String(item.cost) : "",
      suggestionId: item.suggestionId ?? null,
    })
    setDialogOpen(true)
  }, [allowedDays])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingId(null)
    setSubmitting(false)
  }, [])

  const resolveItemsFromResponse = useCallback((payload: any) => {
    if (!payload) return
    const nextItems = Array.isArray(payload.items)
      ? payload.items.map(mapPlannerItemToItinerary)
      : payload.item
        ? [mapPlannerItemToItinerary(payload.item)]
        : null

    if (Array.isArray(nextItems)) {
      setItems(nextItems)
    }
  }, [])

  const handleFormChange = <Field extends keyof PlannerFormState>(field: Field, value: PlannerFormState[Field]) => {
    setFormState((prev) => {
      if (field === "day") {
        const numericValue = Number(value)
        const sanitized = Number.isFinite(numericValue) ? numericValue : 1
        const clamped = Math.min(Math.max(sanitized, 1), allowedDays)
        return { ...prev, day: clamped }
      }

      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canMutate || !bookingId) {
      toast({
        variant: "destructive",
        title: "Không thể lưu hoạt động",
        description: "Vui lòng chọn một chuyến đi hợp lệ trước khi chỉnh sửa.",
      })
      return
    }

    const trimmedTitle = formState.title.trim()
    const trimmedLocation = formState.location.trim()

    if (!trimmedTitle || !trimmedLocation) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Tiêu đề và vị trí không được để trống.",
      })
      return
    }

    setSubmitting(true)

    const requestedDay = Number.isFinite(Number(formState.day)) ? Number(formState.day) : 1
    const clampedDay = Math.min(Math.max(requestedDay, 1), allowedDays)

    const payload: Record<string, unknown> = {
      title: trimmedTitle,
      location: trimmedLocation,
      type: formState.type,
      day: clampedDay,
      time: formState.time || DEFAULT_TIME,
    }

    const notes = formState.notes.trim()
    if (notes) payload.notes = notes
    const duration = formState.duration.trim()
    if (duration) payload.duration = duration

    const costValue = formState.cost.trim()
    if (costValue) {
      const numericCost = Number(costValue)
      if (Number.isNaN(numericCost) || numericCost < 0) {
        toast({
          variant: "destructive",
          title: "Chi phí không hợp lệ",
          description: "Vui lòng nhập số tiền hợp lệ.",
        })
        setSubmitting(false)
        return
      }
      payload.cost = numericCost
    } else if (editingId) {
      payload.cost = null
    }

    if (formState.suggestionId) {
      payload.suggestionId = formState.suggestionId
    }

    try {
      const endpoint = editingId
        ? `/api/bookings/${bookingId}/planner-items/${editingId}`
        : `/api/bookings/${bookingId}/planner-items`

      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? "Không thể lưu hoạt động")
      }

      const data = await response.json()
      resolveItemsFromResponse(data)
      setSelectedDay(Number(payload.day) || 1)
      toast({
        title: editingId ? "Đã cập nhật hoạt động" : "Đã thêm hoạt động",
        description: editingId
          ? "Hoạt động đã được cập nhật trong lịch trình."
          : "Hoạt động mới đã được thêm vào lịch trình.",
      })
      closeDialog()
      await onRefresh?.({ silent: true })
    } catch (error) {
      console.error("Planner item submit error", error)
      toast({
        variant: "destructive",
        title: "Không thể lưu hoạt động",
        description:
          error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!canMutate || !bookingId || !pendingDelete) {
      setPendingDelete(null)
      if (!canMutate) {
        toast({
          variant: "destructive",
          title: "Không thể xoá hoạt động",
          description: "Vui lòng chọn chuyến đi hợp lệ trước khi xoá.",
        })
      }
      return
    }

    setDeletingId(pendingDelete.id)

    try {
      const response = await fetch(
        `/api/bookings/${bookingId}/planner-items/${pendingDelete.id}`,
        { method: "DELETE" },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? "Không thể xoá hoạt động")
      }

      const data = await response.json()
      resolveItemsFromResponse(data)
      toast({
        title: "Đã xoá hoạt động",
        description: "Hoạt động đã được xoá khỏi lịch trình.",
      })
      await onRefresh?.({ silent: true })
    } catch (error) {
      console.error("Planner item delete error", error)
      toast({
        variant: "destructive",
        title: "Không thể xoá hoạt động",
        description:
          error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.",
      })
    } finally {
      setDeletingId(null)
      setPendingDelete(null)
    }
  }

  const handleSuggestionAdd = async (suggestion: PlannerSuggestion) => {
    if (!canMutate || !bookingId) {
      toast({
        variant: "destructive",
        title: "Không thể thêm gợi ý",
        description: "Vui lòng chọn chuyến đi hợp lệ để lưu gợi ý.",
      })
      return
    }

    setPendingSuggestionId(suggestion.id)

    const suggestedDay =
      suggestion.dayOffset !== null && suggestion.dayOffset !== undefined
        ? Number(suggestion.dayOffset) + 1
        : selectedDay

    const targetDay = Math.min(Math.max(suggestedDay, 1), allowedDays)

    const payload: Record<string, unknown> = {
      title: suggestion.title,
      location: suggestion.location || "Đang cập nhật",
      type: suggestion.type,
      day: targetDay,
      time: suggestion.time || DEFAULT_TIME,
      notes: suggestion.notes ?? undefined,
      suggestionId: suggestion.id,
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/planner-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? "Không thể thêm gợi ý")
      }

      const data = await response.json()
      resolveItemsFromResponse(data)
  setSelectedDay(targetDay)
      setSuggestionList((prev) => prev.filter((item) => item.id !== suggestion.id))
      toast({
        title: "Đã thêm gợi ý",
        description: "Gợi ý concierge đã được thêm vào lịch trình.",
      })
      await onRefresh?.({ silent: true })
    } catch (error) {
      console.error("Planner suggestion add error", error)
      toast({
        variant: "destructive",
        title: "Không thể thêm gợi ý",
        description:
          error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.",
      })
    } finally {
      setPendingSuggestionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Lịch trình chi tiết</h2>
          <p className="text-muted-foreground">
            Sắp xếp và tuỳ chỉnh các hoạt động theo từng ngày của chuyến đi
          </p>
          {tripWindowLabel && (
            <p className="mt-1 text-xs text-muted-foreground">
              Thời gian lưu trú: {tripWindowLabel} · Tối đa {allowedDays} ngày được lưu trong planner.
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Tổng chi phí ước tính</p>
          <p className="text-2xl font-bold text-primary">
            {totalCost.toLocaleString("vi-VN")}₫
          </p>
        </div>
      </div>

      {suggestionsLoading ? (
        <Card className="p-6 border-dashed">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-semibold">Đang chuẩn bị gợi ý concierge...</p>
              <p className="text-sm text-muted-foreground">
                Concierge đang tổng hợp các đề xuất dành riêng cho bạn.
              </p>
            </div>
          </div>
        </Card>
      ) : suggestionList.length > 0 ? (
        <Card className="p-6 border-dashed bg-muted/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary/10 text-primary p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Gợi ý từ concierge</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn nhanh một gợi ý để thêm vào lịch trình của bạn.
                </p>
              </div>
            </div>
            <Badge variant="secondary">{suggestionList.length}</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {suggestionList.map((suggestion) => {
              const Icon = activityIcons[suggestion.type]
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionAdd(suggestion)}
                  disabled={pendingSuggestionId === suggestion.id || !canMutate}
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border bg-background p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow",
                    pendingSuggestionId === suggestion.id && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    activityColors[suggestion.type],
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{suggestion.time ?? DEFAULT_TIME}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{suggestion.location || "Đang cập nhật"}</span>
                    </div>
                    {suggestion.notes && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {suggestion.notes}
                      </p>
                    )}
                    {suggestion.distanceKm !== null && suggestion.distanceKm !== undefined && (
                      <p className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Lightbulb className="mr-1 h-3 w-3" />
                        Cách khoảng {suggestion.distanceKm} km từ homestay
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      ) : null}

      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => {
          const dayItemCount = items.filter((item) => item.day === day).length
          return (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              className={cn(
                "flex-shrink-0 min-w-[100px]",
                selectedDay === day && "shadow-md",
              )}
              onClick={() => setSelectedDay(day)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Ngày {day}
              {dayItemCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  {dayItemCount}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ngày {selectedDay}</h3>
          <Button
            onClick={() => openCreateDialog(selectedDay)}
            size="sm"
            disabled={!canMutate || selectedDay > allowedDays}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm hoạt động
          </Button>
        </div>

        {dayItems.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">Chưa có hoạt động</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Thêm hoạt động, địa điểm ăn uống hoặc gợi ý tham quan để hoàn thiện lịch trình.
            </p>
            <Button onClick={() => openCreateDialog(selectedDay)} size="sm" disabled={!canMutate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm hoạt động đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dayItems.map((item, index) => {
              const Icon = activityIcons[item.type]
              return (
                <div
                  key={item.id}
                  className="group relative flex items-start space-x-4 rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <button className="opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="w-20 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{item.time}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                      activityColors[item.type],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{item.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {item.duration && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {item.duration}
                            </Badge>
                          )}
                          {item.cost && item.cost > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.cost.toLocaleString("vi-VN")}₫
                            </Badge>
                          )}
                          {item.suggestionId && (
                            <Badge variant="secondary" className="text-xs">
                              Concierge
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      disabled={!canMutate}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(item)}
                      disabled={!canMutate}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {index < dayItems.length - 1 && (
                    <div className="absolute left-[106px] top-[60px] h-[calc(100%+16px)] w-[2px] bg-border" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Tổng ngày</div>
          <div className="text-2xl font-bold">{totalDays}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Hoạt động</div>
          <div className="text-2xl font-bold">{items.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Địa điểm khác nhau</div>
          <div className="text-2xl font-bold">
            {new Set(items.map((item) => item.location || "")).size}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Tổng ngân sách</div>
          <div className="text-2xl font-bold text-primary">
            {totalCost.toLocaleString("vi-VN")}₫
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa hoạt động" : "Thêm hoạt động"}</DialogTitle>
            <DialogDescription>
              Nhập thông tin chi tiết để concierge có thể hỗ trợ bạn tốt hơn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planner-title">Tiêu đề</Label>
                <Input
                  id="planner-title"
                  value={formState.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                  placeholder="Ví dụ: Bữa tối tại nhà hàng ẩm thực địa phương"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planner-location">Vị trí</Label>
                <Input
                  id="planner-location"
                  value={formState.location}
                  onChange={(event) => handleFormChange("location", event.target.value)}
                  placeholder="Thành phố, địa chỉ hoặc tên địa điểm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Loại hoạt động</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value: ItineraryItem["type"]) => handleFormChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planner-day">Ngày trong chuyến đi</Label>
                <Input
                  id="planner-day"
                  type="number"
                  min={1}
                  max={allowedDays}
                  value={formState.day}
                  onChange={(event) => handleFormChange("day", Number(event.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Hợp lệ từ ngày 1 đến {allowedDays}. Các hoạt động sau check-out sẽ không được lưu.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planner-time">Giờ</Label>
                <Input
                  id="planner-time"
                  type="time"
                  value={formState.time}
                  onChange={(event) => handleFormChange("time", event.target.value || DEFAULT_TIME)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planner-notes">Ghi chú cho concierge</Label>
              <Textarea
                id="planner-notes"
                value={formState.notes}
                onChange={(event) => handleFormChange("notes", event.target.value)}
                placeholder="Ví dụ: Cần bàn ăn cho 4 người, ưu tiên không gian riêng tư."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planner-duration">Thời lượng (tuỳ chọn)</Label>
                <Input
                  id="planner-duration"
                  value={formState.duration}
                  onChange={(event) => handleFormChange("duration", event.target.value)}
                  placeholder="Ví dụ: 2 giờ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planner-cost">Chi phí ước tính (₫)</Label>
                <Input
                  id="planner-cost"
                  value={formState.cost}
                  onChange={(event) => handleFormChange("cost", event.target.value)}
                  placeholder="Ví dụ: 1500000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Lưu thay đổi" : "Thêm vào lịch trình"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => {
        if (!open) setPendingDelete(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn xoá hoạt động này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xoá hoạt động khỏi lịch trình và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingId !== null}>
              {deletingId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xoá hoạt động
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
