"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Target } from "lucide-react"

const EXPERIENCE_CATEGORIES = [
  { value: "FOOD_DRINK", label: "Ẩm thực" },
  { value: "ADVENTURE", label: "Phiêu lưu" },
  { value: "CULTURE", label: "Văn hóa" },
  { value: "WELLNESS", label: "Wellness" },
  { value: "WATER_SPORTS", label: "Hoạt động nước" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "SIGHTSEEING", label: "Tham quan" },
  { value: "ENTERTAINMENT", label: "Giải trí" },
  { value: "SHOPPING", label: "Mua sắm" },
  { value: "NIGHTLIFE", label: "Nightlife" },
]

const EXPERIENCE_STATUSES = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "INACTIVE", label: "Ngừng" },
]

const formSchema = z.object({
  title: z.string().min(6, "Tiêu đề tối thiểu 6 ký tự"),
  description: z.string().min(40, "Mô tả tối thiểu 40 ký tự"),
  category: z.string().min(1, "Chọn danh mục"),
  city: z.string().min(2, "Thành phố không hợp lệ"),
  state: z.string().optional().nullable(),
  location: z.string().min(4, "Địa điểm quá ngắn"),
  price: z.coerce.number().min(0, "Giá không hợp lệ"),
  currency: z.string().default("VND"),
  duration: z.string().min(2, "Nhập thời lượng"),
  groupSize: z.string().min(2, "Nhập quy mô nhóm"),
  minGuests: z.coerce.number().int().min(1, "Tối thiểu 1 khách"),
  maxGuests: z.coerce.number().int().min(1, "Tối đa tối thiểu 1 khách"),
  languages: z.string().min(2, "Nhập ít nhất 1 ngôn ngữ"),
  includedItems: z.string().optional().nullable(),
  notIncluded: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  image: z.string().url("Ảnh bìa phải là URL hợp lệ"),
  gallery: z.string().optional().nullable(),
  videoUrl: z.string().url("Link video không hợp lệ").optional().nullable(),
  status: z.string().default("DRAFT"),
  isMembersOnly: z.boolean().default(false),
  featured: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

const parseList = (value?: string | null) =>
  value
    ?.split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0) ?? []

export default function GuideCreateExperiencePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: EXPERIENCE_CATEGORIES[0]?.value ?? "FOOD_DRINK",
      city: "",
      state: "",
      location: "",
      price: 0,
      currency: "VND",
      duration: "",
      groupSize: "Tối đa 6 khách",
      minGuests: 1,
      maxGuests: 6,
      languages: "Tiếng Việt, English",
      includedItems: "Nước uống, Đồ bảo hộ",
      notIncluded: "Vé tham quan",
      requirements: "Trên 12 tuổi",
      tags: "ẩm thực, văn hóa",
      image: "",
      gallery: "",
      videoUrl: "",
      status: "DRAFT",
      isMembersOnly: false,
      featured: false,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true)
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        city: values.city,
        state: values.state || null,
        location: values.location,
        price: values.price,
        currency: values.currency || "VND",
        duration: values.duration,
        groupSize: values.groupSize,
        minGuests: values.minGuests,
        maxGuests: values.maxGuests,
        languages: parseList(values.languages),
        includedItems: parseList(values.includedItems),
        notIncluded: parseList(values.notIncluded),
        requirements: parseList(values.requirements),
        tags: parseList(values.tags),
        image: values.image,
        images: parseList(values.gallery),
        videoUrl: values.videoUrl || null,
        status: values.status,
        isMembersOnly: values.isMembersOnly,
        featured: values.featured,
      }

      const response = await fetch("/api/guide/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || "Không thể tạo trải nghiệm mới")
      }

      toast.success("Đã tạo trải nghiệm thành công")
      router.push("/guide/experiences")
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GuideDashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="space-y-2 text-center md:text-left">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Tạo trải nghiệm hướng dẫn viên</h1>
          <p className="text-sm text-muted-foreground">
            Điền thông tin chi tiết để LuxeStay duyệt và phân phối trải nghiệm của bạn đến khách hàng phù hợp.
          </p>
        </section>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Chúng tôi dùng dữ liệu này để hiển thị và tối ưu hoá tìm kiếm trải nghiệm</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề trải nghiệm</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Tour ẩm thực phố cổ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danh mục</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPERIENCE_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
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
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thành phố</FormLabel>
                        <FormControl>
                          <Input placeholder="Đà Lạt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa điểm cụ thể</FormLabel>
                        <FormControl>
                          <Input placeholder="Ngõ 12, Phường 3, TP. Đà Lạt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả chi tiết</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Chia sẻ hành trình, điểm nhấn và giá trị khách nhận được" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nên bao gồm lịch trình, hoạt động chính, điểm độc đáo và chuẩn bị cần thiết cho khách.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giá trọn gói (VND)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={10000} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thời lượng</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: 4 giờ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="groupSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quy mô nhóm</FormLabel>
                        <FormControl>
                          <Input placeholder="Tối đa 8 khách" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Khách tối thiểu</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Khách tối đa</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngôn ngữ hỗ trợ</FormLabel>
                        <FormControl>
                          <Input placeholder="Ngăn cách bởi dấu phẩy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags nổi bật</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: ẩm thực, văn hóa" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="includedItems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đã bao gồm</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Nước uống, Hướng dẫn viên" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormDescription>Ngăn cách bởi dấu phẩy hoặc xuống dòng</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notIncluded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chưa bao gồm</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Chi phí di chuyển" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yêu cầu khách hàng</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Trên 15 tuổi, sức khỏe tốt" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ảnh bìa (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gallery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bộ sưu tập ảnh</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Mỗi dòng một URL" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video giới thiệu (tuỳ chọn)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtu.be/..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái xuất bản</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPERIENCE_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles className="h-4 w-4 text-amber-500" /> Featured Listing
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Kích hoạt để LuxeStay ưu tiên trải nghiệm trên marketplace và trang chủ.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isMembersOnly"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-primary" /> Dành riêng cho thành viên
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Chỉ khách hàng thuộc gói membership mới thấy và đặt trải nghiệm này.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Gợi ý tối ưu nhanh</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">Ghi rõ USP trải nghiệm</Badge>
                    <Badge variant="secondary">Nêu vật dụng khách cần chuẩn bị</Badge>
                    <Badge variant="secondary">Nhắc lại chính sách hoàn/huỷ</Badge>
                    <Badge variant="secondary">Đưa min/max khách rõ ràng</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Sau khi gửi, đội ngũ vận hành LuxeStay sẽ kiểm duyệt và kích hoạt trong vòng 24 giờ.
                  </p>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Tạo trải nghiệm
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </GuideDashboardLayout>
  )
}
