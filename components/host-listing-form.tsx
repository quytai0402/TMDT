"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Loader2, MapPin, ShieldCheck, Star, Upload, X, Plus, AlertCircle, Navigation } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LocationExpansionDialog } from "@/components/location-expansion-dialog"

import { type CreateListingData, type PropertyTypeValue, type RoomTypeValue, useListings } from "@/hooks/use-listings"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { getNearbyPlaces } from "@/lib/nearby-places"
import { geocodeAddress, findNearbyPlaces } from "@/lib/maps-utils"

// Type for nearby places (compatible with both API and local data)
interface NearbyPlace {
  name: string
  type: string
  distance: string
  rating?: number
  address?: string
  placeId?: string
}

// Helper to convert local NearbyPlace to our format
function convertLocalPlace(place: { name: string; type: string; distance: number; rating?: number }): NearbyPlace {
  return {
    name: place.name,
    type: place.type,
    distance: place.distance < 1000 ? `${place.distance}m` : `${(place.distance / 1000).toFixed(1)} km`,
    rating: place.rating,
  }
}

const PROPERTY_TYPES: Array<{ value: PropertyTypeValue; label: string }> = [
  { value: "APARTMENT", label: "Căn hộ" },
  { value: "HOUSE", label: "Nhà nguyên căn" },
  { value: "VILLA", label: "Biệt thự" },
  { value: "CONDO", label: "Chung cư" },
  { value: "TOWNHOUSE", label: "Nhà phố" },
  { value: "BUNGALOW", label: "Bungalow" },
  { value: "CABIN", label: "Cabin" },
  { value: "FARM_STAY", label: "Farm stay" },
  { value: "BOAT", label: "Du thuyền" },
  { value: "UNIQUE", label: "Không gian độc đáo" },
]

const ROOM_TYPES: Array<{ value: RoomTypeValue; label: string }> = [
  { value: "ENTIRE_PLACE", label: "Toàn bộ chỗ ở" },
  { value: "PRIVATE_ROOM", label: "Phòng riêng" },
  { value: "SHARED_ROOM", label: "Phòng chung" },
]

const AMENITIES: Array<{ value: string; label: string }> = [
  { value: "WIFI", label: "Wi-Fi tốc độ cao" },
  { value: "AIR_CONDITIONING", label: "Điều hòa" },
  { value: "KITCHEN", label: "Bếp riêng" },
  { value: "PARKING", label: "Chỗ đỗ xe" },
  { value: "POOL", label: "Hồ bơi" },
  { value: "GYM", label: "Phòng gym" },
  { value: "WORKSPACE", label: "Góc làm việc" },
  { value: "WASHER", label: "Máy giặt" },
  { value: "DRYER", label: "Máy sấy" },
  { value: "TV", label: "TV thông minh" },
  { value: "PET_FRIENDLY", label: "Cho phép thú cưng" },
  { value: "BREAKFAST", label: "Bữa sáng" },
]

const PLACE_TYPE_LABELS: Record<string, string> = {
  restaurant: "Nhà hàng",
  cafe: "Quán cà phê",
  atm: "ATM",
  hospital: "Bệnh viện",
  pharmacy: "Nhà thuốc",
  supermarket: "Siêu thị",
  beach: "Bãi biển",
  attraction: "Địa điểm du lịch",
  transport: "Giao thông",
}

const PLACE_TYPE_BADGE_CLASSES: Record<string, string> = {
  restaurant: "bg-orange-100 text-orange-700",
  cafe: "bg-amber-100 text-amber-700",
  atm: "bg-green-100 text-green-700",
  hospital: "bg-red-100 text-red-700",
  pharmacy: "bg-pink-100 text-pink-700",
  supermarket: "bg-blue-100 text-blue-700",
  beach: "bg-cyan-100 text-cyan-700",
  attraction: "bg-purple-100 text-purple-700",
  transport: "bg-gray-100 text-gray-700",
}

const listingSchema = z.object({
  title: z.string().min(10, "Tiêu đề cần ít nhất 10 ký tự"),
  description: z.string().min(50, "Mô tả cần ít nhất 50 ký tự"),
  propertyType: z.enum(PROPERTY_TYPES.map((option) => option.value) as [PropertyTypeValue, ...PropertyTypeValue[]]),
  roomType: z.enum(ROOM_TYPES.map((option) => option.value) as [RoomTypeValue, ...RoomTypeValue[]]),
  maxGuests: z.number({ invalid_type_error: "Số khách tối đa phải là số" }).min(1, "Tối thiểu 1 khách"),
  bedrooms: z.number({ invalid_type_error: "Số phòng ngủ phải là số" }).min(0, "Không được âm"),
  beds: z.number({ invalid_type_error: "Số giường phải là số" }).min(1, "Tối thiểu 1 giường"),
  bathrooms: z.number({ invalid_type_error: "Số phòng tắm phải là số" }).min(0.5, "Tối thiểu 0.5"),
  country: z.string().min(2, "Vui lòng nhập quốc gia"),
  city: z.string().min(2, "Vui lòng nhập thành phố"),
  address: z.string().min(5, "Địa chỉ chi tiết hơn"),
  latitude: z
    .number({ invalid_type_error: "Vĩ độ phải là số" })
    .min(-90, "Vĩ độ không hợp lệ")
    .max(90, "Vĩ độ không hợp lệ"),
  longitude: z
    .number({ invalid_type_error: "Kinh độ phải là số" })
    .min(-180, "Kinh độ không hợp lệ")
    .max(180, "Kinh độ không hợp lệ"),
  basePrice: z.number({ invalid_type_error: "Giá cơ bản phải là số" }).min(100000, "Giá tối thiểu 100.000đ"),
  cleaningFee: z
    .number({ invalid_type_error: "Phí dọn dẹp phải là số" })
    .min(0, "Không được âm")
    .optional(),
  images: z
    .array(z.string().url("URL ảnh không hợp lệ"))
    .min(5, "Cần ít nhất 5 ảnh chất lượng"),
  amenities: z.array(z.string()).min(1, "Chọn ít nhất 1 tiện nghi"),
  nearbyPlaces: z.array(z.any()).optional(), // Store nearby places data
})

type ListingFormValues = z.infer<typeof listingSchema>

type HostListingFormProps = {
  mode: "create" | "edit"
  listingId?: string
  initialData?: Partial<CreateListingData> & {
    id?: string
    status?: string | null
    slug?: string | null
  }
}

function toFormValues(initial?: HostListingFormProps["initialData"]): ListingFormValues {
  return {
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    propertyType: (initial?.propertyType as PropertyTypeValue) ?? "APARTMENT",
    roomType: (initial?.roomType as RoomTypeValue) ?? "ENTIRE_PLACE",
    maxGuests: initial?.maxGuests ?? 0,
    bedrooms: initial?.bedrooms ?? 0,
    beds: initial?.beds ?? 0,
    bathrooms: initial?.bathrooms ?? 0,
    country: initial?.country ?? "",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    latitude: initial?.latitude ?? 0,
    longitude: initial?.longitude ?? 0,
    basePrice: initial?.basePrice && initial.basePrice > 0 ? initial.basePrice : 0,
    cleaningFee: initial?.cleaningFee,
    images: Array.isArray(initial?.images) ? initial?.images.filter(Boolean) : [],
    amenities: Array.isArray(initial?.amenities) ? initial?.amenities.filter(Boolean) : [],
    nearbyPlaces: initial?.nearbyPlaces ?? [],
  }
}

export function HostListingForm({ mode, listingId, initialData }: HostListingFormProps) {
  const router = useRouter()
  const { createListing, updateListing, loading } = useListings()
  const [imageInput, setImageInput] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [prefilledLocation, setPrefilledLocation] = useState<{ city?: string; country?: string } | null>(null)
  const [locationPrefillAttempted, setLocationPrefillAttempted] = useState(mode !== "create")
  const [isLocationLocked, setIsLocationLocked] = useState(false)
  const [customNearbyPlaces, setCustomNearbyPlaces] = useState<string[]>([])
  const [newNearbyPlace, setNewNearbyPlace] = useState("")
  const [showLocationExpansion, setShowLocationExpansion] = useState(false)

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: toFormValues(initialData),
  })

  const watchedAddress = useWatch({ control: form.control, name: "address" })
  const watchedCity = useWatch({ control: form.control, name: "city" })
  const watchedCountry = useWatch({ control: form.control, name: "country" })
  const watchedLatitude = useWatch({ control: form.control, name: "latitude" })
  const watchedLongitude = useWatch({ control: form.control, name: "longitude" })

  const geocodeSignatureRef = useRef<string>("")
  const [geocodingStatus, setGeocodingStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({ state: "idle" })
  const [hasAttemptedGeocode, setHasAttemptedGeocode] = useState(false)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [visibleNearbyCount, setVisibleNearbyCount] = useState(0)

  useEffect(() => {
    if (initialData) {
      form.reset(toFormValues(initialData))
    }
  }, [initialData, form])

  useEffect(() => {
    if (!prefilledLocation && initialData && (initialData.city || initialData.country)) {
      setPrefilledLocation({
        city: initialData.city ?? undefined,
        country: initialData.country ?? undefined,
      })
    }
  }, [initialData, prefilledLocation])

  useEffect(() => {
    if (nearbyPlaces.length === 0) {
      setVisibleNearbyCount(0)
      return
    }

    setVisibleNearbyCount(Math.min(5, nearbyPlaces.length))
  }, [nearbyPlaces])

  useEffect(() => {
    if (mode !== "create" || locationPrefillAttempted) {
      return
    }

    let cancelled = false

    const prefillLocation = async () => {
      try {
        const response = await fetch("/api/host/profile", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        if (cancelled) {
          return
        }

        const location = payload?.location as
          | {
              city?: string | null
              country?: string | null
              latitude?: number | null
              longitude?: number | null
            }
          | null

        if (!location) {
          return
        }

        const updates: { city?: string; country?: string } = {}

        const currentCountry = form.getValues("country")?.trim()
        if (!currentCountry && location.country) {
          form.setValue("country", location.country, { shouldDirty: false })
          updates.country = location.country
        }

        const currentCity = form.getValues("city")?.trim()
        if (!currentCity && location.city) {
          form.setValue("city", location.city, { shouldDirty: false })
          updates.city = location.city
          // Lock city field when auto-filled from host profile
          setIsLocationLocked(true)
        }

        const currentLatitude = form.getValues("latitude")
        if (
          typeof location.latitude === "number" &&
          (!currentLatitude || Math.abs(currentLatitude) < 0.000001)
        ) {
          form.setValue("latitude", location.latitude, { shouldDirty: false })
        }

        const currentLongitude = form.getValues("longitude")
        if (
          typeof location.longitude === "number" &&
          (!currentLongitude || Math.abs(currentLongitude) < 0.000001)
        ) {
          form.setValue("longitude", location.longitude, { shouldDirty: false })
        }

        if (Object.keys(updates).length > 0) {
          setPrefilledLocation(updates)
        } else if (location.city || location.country) {
          setPrefilledLocation({
            city: location.city ?? undefined,
            country: location.country ?? undefined,
          })
        }
      } catch (error) {
        console.error("Prefill host location error:", error)
      } finally {
        if (!cancelled) {
          setLocationPrefillAttempted(true)
        }
      }
    }

    void prefillLocation()

    return () => {
      cancelled = true
    }
  }, [form, mode, locationPrefillAttempted])

  useEffect(() => {
    const address = typeof watchedAddress === "string" ? watchedAddress.trim() : ""
    const city = typeof watchedCity === "string" ? watchedCity.trim() : ""
    const country = typeof watchedCountry === "string" ? watchedCountry.trim() : ""

    if (!address || address.length < 6 || !city) {
      if (!address) {
        geocodeSignatureRef.current = ""
        setHasAttemptedGeocode(false)
        setGeocodingStatus((current) => (current.state === "idle" ? current : { state: "idle" }))
        setNearbyPlaces([])
      }
      return
    }

    const signature = `${address}|${city}|${country}`
    
    // Log for debugging
    console.log("Geocoding check:", {
      signature,
      previousSignature: geocodeSignatureRef.current,
      willGeocode: signature !== geocodeSignatureRef.current
    })
    
    if (signature === geocodeSignatureRef.current) {
      return
    }

    setGeocodingStatus({ state: "loading" })
    setHasAttemptedGeocode(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        console.log("Starting geocoding for:", signature)
        
        // Use centralized geocoding helper
        const result = await geocodeAddress(address, city, country || "Vietnam")

        console.log("Geocoding result:", result)
        
        // Update signature FIRST, then update coordinates
        geocodeSignatureRef.current = signature
        
        // Always update coordinates, even if they seem the same
        form.setValue("latitude", result.latitude, { shouldDirty: true })
        form.setValue("longitude", result.longitude, { shouldDirty: true })
        
        setGeocodingStatus({
          state: "success",
          message: result.displayName || result.address || "Đã xác định vị trí thành công",
        })

        // Fetch nearby places using helper
        try {
          const places = await findNearbyPlaces(result.latitude, result.longitude, city)
          if (places && places.length > 0) {
            setNearbyPlaces(places)
            // Auto-save top 10 nearby places to form data
            const top10Places = places.slice(0, 10).map(place => ({
              name: place.name,
              type: place.type,
              distance: place.distance,
              rating: place.rating,
              address: place.address,
              placeId: place.placeId,
            }))
            form.setValue("nearbyPlaces", top10Places, { shouldDirty: true })
          } else {
            // Fallback to local data
            const localPlaces = getNearbyPlaces(city, result.latitude, result.longitude)
            const convertedPlaces = localPlaces.map(convertLocalPlace)
            setNearbyPlaces(convertedPlaces)
            // Auto-save local places (up to 10)
            const top10Local = convertedPlaces.slice(0, 10)
            form.setValue("nearbyPlaces", top10Local, { shouldDirty: true })
          }
        } catch (nearbyError) {
          console.warn("Failed to fetch nearby places, using fallback:", nearbyError)
          const localPlaces = getNearbyPlaces(city, result.latitude, result.longitude)
          const convertedPlaces = localPlaces.map(convertLocalPlace)
          setNearbyPlaces(convertedPlaces)
          // Auto-save local places (up to 10)
          const top10Local = convertedPlaces.slice(0, 10)
          form.setValue("nearbyPlaces", top10Local, { shouldDirty: true })
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        geocodeSignatureRef.current = ""
        setGeocodingStatus({
          state: "error",
          message: error instanceof Error ? error.message : "Không thể định vị địa chỉ. Thử mô tả rõ hơn hoặc liên hệ bộ phận hỗ trợ.",
        })
        setNearbyPlaces([])
      }
    }, 700)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [form, watchedAddress, watchedCity, watchedCountry])

  const pendingStatusBanner = useMemo(() => {
    if (!initialData?.status) return null
    if (initialData.status === "PENDING_REVIEW") {
      return {
        tone: "warning" as const,
        title: "Listing đang chờ duyệt",
        description:
          "Đội ngũ quản trị sẽ xem xét và kích hoạt listing của bạn trong vòng 24-48 giờ. Bạn vẫn có thể cập nhật thông tin trong thời gian này.",
      }
    }

    if (initialData.status === "REJECTED") {
      return {
        tone: "destructive" as const,
        title: "Listing đã bị từ chối",
        description: "Hãy cập nhật lại thông tin theo phản hồi từ quản trị viên để gửi duyệt lại.",
      }
    }

    if (initialData.status === "ACTIVE") {
      return {
        tone: "success" as const,
        title: "Listing đang hoạt động",
        description: "Mọi thay đổi sẽ được kiểm duyệt nhanh và áp dụng ngay cho phía khách.",
      }
    }

    return null
  }, [initialData?.status])

  const onSubmit = async (values: ListingFormValues) => {
    const payload: CreateListingData = {
      ...values,
      cleaningFee: values.cleaningFee ?? undefined,
    }

    try {
      if (mode === "create") {
        const response = await createListing(payload)
        const createdId = response?.listing?.id ?? response?.listing?.["_id"] ?? undefined
        toast.listing("Đã gửi listing để duyệt", {
          description: "Chúng tôi sẽ thông báo khi quản trị viên phê duyệt.",
        })
        if (createdId) {
          router.push(`/host/listings/${createdId}/edit`)
        } else {
          router.push("/host/listings")
        }
      } else {
        if (!listingId) {
          toast.error("Không xác định được listing cần cập nhật")
          return
        }
        await updateListing(listingId, payload)
        toast.success("Đã lưu thay đổi", {
          description: "Thông tin listing sẽ được đồng bộ tới phía khách và admin.",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu listing"
      toast.error(message)
    }
  }

  const handleAddImage = (current: string[], onChange: (images: string[]) => void) => {
    const trimmed = imageInput.trim()
    if (!trimmed) return
    try {
      const url = new URL(trimmed)
      if (!url.protocol.startsWith("http")) {
        throw new Error("URL không hợp lệ")
      }
      onChange([...current, trimmed])
      setImageInput("")
      toast.success("Đã thêm ảnh từ URL")
    } catch {
      toast.warning("URL ảnh chưa chính xác", {
        description: "Vui lòng kiểm tra lại đường dẫn hình ảnh.",
      })
    }
  }

  const handleUploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    current: string[],
    onChange: (images: string[]) => void
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Convert FileList to Array
    const fileArray = Array.from(files)

    // Validate all files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" phải là ảnh (JPG, PNG, WebP...)`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" không được vượt quá 10MB`)
        return
      }
    }

    setUploadingImage(true)
    const uploadedUrls: string[] = []
    let successCount = 0
    let failCount = 0

    try {
      // Upload all files in parallel
      const uploadPromises = fileArray.map(async (file) => {
        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          })

          // Try to parse JSON response
          let result
          try {
            result = await response.json()
          } catch (parseError) {
            console.error('Failed to parse response for', file.name, ':', parseError)
            throw new Error('Invalid response from server')
          }
          
          if (!response.ok) {
            console.error('Upload failed for', file.name, ':', result)
            throw new Error(result.error || result.message || 'Upload failed')
          }

          if (!result.url) {
            console.error('No URL in response for', file.name, ':', result)
            throw new Error('No URL in response')
          }

          uploadedUrls.push(result.url)
          successCount++
          return result.url
        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error)
          failCount++
          return null
        }
      })

      await Promise.all(uploadPromises)

      // Update form with successful uploads
      if (uploadedUrls.length > 0) {
        onChange([...current, ...uploadedUrls])
        toast.success(`Đã upload ${successCount} ảnh thành công${failCount > 0 ? `, ${failCount} ảnh thất bại` : ''}`)
      } else {
        toast.error("Không thể upload ảnh. Vui lòng thử lại.")
      }
      
      // Reset input
      event.target.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Có lỗi xảy ra khi upload ảnh")
    } finally {
      setUploadingImage(false)
    }
  }

  const isSubmitting = form.formState.isSubmitting || loading

  return (
    <div className="space-y-6">
      {pendingStatusBanner ? (
        <Card
          className={cn(
            pendingStatusBanner.tone === "warning" && "border-yellow-400 bg-yellow-50",
            pendingStatusBanner.tone === "destructive" && "border-red-400 bg-red-50",
            pendingStatusBanner.tone === "success" && "border-emerald-400 bg-emerald-50",
          )}
        >
          <CardHeader className="flex flex-row items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-foreground" />
            <div>
              <CardTitle className="text-base font-semibold">
                {pendingStatusBanner.title}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingStatusBanner.description}
              </p>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Villa biển Hội An với hồ bơi riêng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Chia sẻ điểm nổi bật, trải nghiệm và những dịch vụ nổi bật mà khách có thể mong đợi. Mẹo: mô tả càng cụ thể càng giúp tăng tỷ lệ duyệt và đặt phòng."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại hình</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại hình chỗ ở" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kiểu phòng</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn kiểu phòng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROOM_TYPES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số khách tối đa</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Nhập số khách"
                          value={field.value && field.value > 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? 0 : Number.parseInt(event.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phòng ngủ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Số phòng ngủ"
                          value={field.value && field.value > 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? 0 : Number.parseInt(event.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số giường</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Số giường"
                          value={field.value && field.value > 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? 0 : Number.parseInt(event.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phòng tắm</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          placeholder="Số phòng tắm"
                          value={field.value && field.value > 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number.parseFloat(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vị trí & định vị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Quốc gia</FormLabel>
                      <FormControl>
                        <Input placeholder="Việt Nam" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        {prefilledLocation?.country
                          ? `Đã tự động lấy theo hồ sơ host: ${prefilledLocation.country}.`
                          : "Nhập quốc gia hiển thị cho khách."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">Thành phố / Tỉnh</FormLabel>
                        {!isLocationLocked ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-primary hover:text-primary/80"
                            onClick={() => setShowLocationExpansion(true)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Đăng ký khu vực mới
                          </Button>
                        ) : null}
                      </div>
                      {isLocationLocked && prefilledLocation?.city ? (
                        <>
                          <Select value={field.value} disabled>
                            <FormControl>
                              <SelectTrigger className="bg-gradient-to-r from-muted to-muted/50 h-12 text-base border-2">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={prefilledLocation.city}>
                                {prefilledLocation.city}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <span className="text-amber-900">
                              Khu vực đã được khóa theo hồ sơ đăng ký của bạn: <strong className="font-bold">{prefilledLocation.city}</strong>.
                              Để mở rộng sang khu vực khác, hãy{" "}
                              <button
                                type="button"
                                onClick={() => setShowLocationExpansion(true)}
                                className="text-primary underline font-semibold transition-colors hover:text-primary/80"
                              >
                                bấm vào đây
                              </button>
                              {" "}để đăng ký khu vực mới.
                            </span>
                          </FormDescription>
                        </>
                      ) : (
                        <>
                          <FormControl>
                            <Input placeholder="Đà Lạt" className="h-12 text-base" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            {prefilledLocation?.city
                              ? `Đã tự động điền theo khu vực bạn đăng ký với LuxeStay: ${prefilledLocation.city}.`
                              : "Tên tỉnh/thành phố giúp listing xuất hiện trong bộ lọc khu vực. Không tìm thấy khu vực? Đăng ký mới phía trên."}
                          </FormDescription>
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ chi tiết</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VD: 123 Lý Thường Kiệt, Cẩm Phô" 
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="flex items-start gap-2 text-xs">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>
                        Vui lòng nhập đúng địa chỉ để tự động xác định tọa độ và tìm địa điểm lân cận.
                      </span>
                    </FormDescription>
                    {hasAttemptedGeocode && (
                      <div className="mt-2">
                        {geocodingStatus.state === "loading" && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-medium">Đang tìm tọa độ và địa điểm lân cận...</span>
                          </div>
                        )}
                        {geocodingStatus.state === "success" && geocodingStatus.message && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                              <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium mb-1">Đã xác định vị trí thành công</p>
                                <p className="text-green-700">{geocodingStatus.message}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {geocodingStatus.state === "error" && (
                          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{geocodingStatus.message || "Không thể tìm tọa độ"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vĩ độ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Tự động điền từ địa chỉ"
                          value={field.value && field.value !== 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number.parseFloat(event.target.value),
                            )
                          }
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kinh độ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Tự động điền từ địa chỉ"
                          value={field.value && field.value !== 0 ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number.parseFloat(event.target.value),
                            )
                          }
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(nearbyPlaces.length > 0 || customNearbyPlaces.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        Địa điểm lân cận
                        <Badge variant="secondary" className="text-xs">
                          {nearbyPlaces.length + customNearbyPlaces.length} địa điểm
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Hiển thị cho khách biết những tiện ích xung quanh chỗ ở
                      </p>
                    </div>
                    {nearbyPlaces.length > visibleNearbyCount && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleNearbyCount(nearbyPlaces.length)}
                      >
                        Xem tất cả ({nearbyPlaces.length})
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    {/* Auto-detected nearby places */}
                    {nearbyPlaces.slice(0, visibleNearbyCount).map((place, index) => (
                      <div
                        key={`auto-${index}`}
                        className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">{place.name}</p>
                              {place.rating && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="font-medium">{place.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {place.distance}
                              {place.address && ` • ${place.address}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={PLACE_TYPE_BADGE_CLASSES[place.type] || ""}
                              >
                                {PLACE_TYPE_LABELS[place.type] || place.type}
                              </Badge>
                              {place.placeId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={() => {
                                    window.open(
                                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`,
                                      "_blank"
                                    )
                                  }}
                                >
                                  <Navigation className="h-3 w-3 mr-1" />
                                  Chỉ đường
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Custom nearby places */}
                    {customNearbyPlaces.map((place, index) => (
                      <div
                        key={`custom-${index}`}
                        className="flex items-center justify-between p-3 border border-dashed rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{place}</p>
                            <p className="text-xs text-muted-foreground">Đã thêm thủ công</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomNearbyPlaces(prev => prev.filter((_, i) => i !== index))
                            toast.success("Đã xóa địa điểm")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add custom place input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm địa điểm lân cận (VD: Chợ Đà Lạt - 500m)"
                      value={newNearbyPlace}
                      onChange={(e) => setNewNearbyPlace(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newNearbyPlace.trim()) {
                            setCustomNearbyPlaces(prev => [...prev, newNearbyPlace.trim()])
                            setNewNearbyPlace("")
                            toast.success("Đã thêm địa điểm lân cận")
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (newNearbyPlace.trim()) {
                          setCustomNearbyPlaces(prev => [...prev, newNearbyPlace.trim()])
                          setNewNearbyPlace("")
                          toast.success("Đã thêm địa điểm lân cận")
                        }
                      }}
                      disabled={!newNearbyPlace.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {visibleNearbyCount === nearbyPlaces.length && nearbyPlaces.length > 5 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setVisibleNearbyCount(5)}
                    >
                      Thu gọn
                    </Button>
                  )}
                </div>
              )}
              
              {nearbyPlaces.length === 0 && customNearbyPlaces.length === 0 && hasAttemptedGeocode && geocodingStatus.state === "success" && (
                <div className="p-4 border border-dashed rounded-lg text-center space-y-2">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chưa tìm thấy địa điểm lân cận tự động
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bạn có thể thêm địa điểm thủ công bằng ô nhập bên dưới
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto pt-2">
                    <Input
                      placeholder="VD: Siêu thị Coopmart - 300m"
                      value={newNearbyPlace}
                      onChange={(e) => setNewNearbyPlace(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newNearbyPlace.trim()) {
                            setCustomNearbyPlaces(prev => [...prev, newNearbyPlace.trim()])
                            setNewNearbyPlace("")
                            toast.success("Đã thêm địa điểm lân cận")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (newNearbyPlace.trim()) {
                          setCustomNearbyPlaces(prev => [...prev, newNearbyPlace.trim()])
                          setNewNearbyPlace("")
                          toast.success("Đã thêm địa điểm lân cận")
                        }
                      }}
                      disabled={!newNearbyPlace.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Giá & phí</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá cơ bản (VNĐ/đêm)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="VD: 500,000"
                        value={
                          field.value && field.value > 0
                            ? field.value.toLocaleString("vi-VN")
                            : ""
                        }
                        onChange={(event) => {
                          const rawValue = event.target.value.replace(/[^\d]/g, "")
                          field.onChange(rawValue === "" ? 0 : Number.parseInt(rawValue, 10))
                        }}
                      />
                    </FormControl>
                    <FormDescription>Nhập số tiền, dấu phẩy sẽ tự động thêm vào</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cleaningFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phí dọn dẹp (tuỳ chọn)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="VD: 100,000"
                        value={
                          field.value && field.value > 0
                            ? field.value.toLocaleString("vi-VN")
                            : ""
                        }
                        onChange={(event) => {
                          const rawValue = event.target.value.replace(/[^\d]/g, "")
                          field.onChange(rawValue === "" ? undefined : Number.parseInt(rawValue, 10))
                        }}
                      />
                    </FormControl>
                    <FormDescription>Phí này sẽ cộng vào đơn giá cuối cùng.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh & tiện nghi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ảnh nổi bật (Tối thiểu 5 ảnh)</FormLabel>
                    <FormDescription>
                      Upload ảnh từ máy tính (có thể chọn nhiều ảnh) hoặc dán URL ảnh trực tiếp. Ảnh chất lượng cao giúp thu hút khách hàng.
                    </FormDescription>
                    <div className="flex flex-col gap-3">
                      {/* Upload from computer */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="image-upload"
                            onChange={(e) => handleUploadImage(e, field.value ?? [], field.onChange)}
                            disabled={uploadingImage}
                          />
                          <Button
                            type="button"
                            variant="default"
                            className="w-full"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload ảnh từ máy tính
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Or paste URL */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Hoặc dán URL</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={imageInput}
                          onChange={(event) => setImageInput(event.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleAddImage(field.value ?? [], field.onChange)}
                        >
                          Thêm URL
                        </Button>
                      </div>

                      {field.value && field.value.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {field.value.length} ảnh đã thêm {field.value.length < 5 && `(còn thiếu ${5 - field.value.length} ảnh)`}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {field.value.map((url, index) => (
                              <div key={url} className="group relative rounded-lg border bg-muted/30 overflow-hidden">
                                <div className="aspect-video relative">
                                  <img 
                                    src={url} 
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Error'
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => {
                                      const next = field.value.filter((_, idx) => idx !== index)
                                      field.onChange(next)
                                      toast.success("Đã xóa ảnh")
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-2 bg-background">
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Chưa có ảnh nào. Upload hoặc dán URL để thêm ảnh.
                          </p>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiện nghi nổi bật</FormLabel>
                    <FormDescription>
                      Những tiện nghi này sẽ hiển thị cho khách và dùng để gợi ý trải nghiệm phù hợp.
                    </FormDescription>
                    <div className="grid gap-2 md:grid-cols-2">
                      {AMENITIES.map((amenity) => {
                        const checked = field.value?.includes(amenity.value)
                        return (
                          <label
                            key={amenity.value}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 hover:border-primary"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const next = new Set(field.value ?? [])
                                if (isChecked) {
                                  next.add(amenity.value)
                                } else {
                                  next.delete(amenity.value)
                                }
                                field.onChange(Array.from(next))
                              }}
                            />
                            <span className="text-sm font-medium text-foreground">{amenity.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Bằng việc {mode === "create" ? "gửi" : "cập nhật"} listing, bạn xác nhận thông tin là chính xác và đồng ý để LuxeStay kiểm duyệt.
            </p>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : mode === "create" ? (
                "Gửi để duyệt"
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Location Expansion Dialog */}
      <LocationExpansionDialog
        open={showLocationExpansion}
        onOpenChange={setShowLocationExpansion}
        onSuccess={() => {
          toast.success("Thành công!", {
            description: "Yêu cầu mở rộng khu vực đã được gửi",
          })
        }}
      />
    </div>
  )
}
