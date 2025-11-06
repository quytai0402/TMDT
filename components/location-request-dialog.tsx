"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationRequestDialogProps {
  trigger?: React.ReactNode
}

export function LocationRequestDialog({ trigger }: LocationRequestDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    country: "Vietnam",
    reason: "",
  })

  const handleSubmit = async () => {
    // Validate
    if (!formData.city.trim() || !formData.state.trim() || !formData.reason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      })
      return
    }

    if (formData.reason.length < 20) {
      toast({
        title: "Lý do quá ngắn",
        description: "Vui lòng mô tả chi tiết lý do đăng ký (ít nhất 20 ký tự)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/locations/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu")
      }

      toast({
        title: "✅ Đã gửi yêu cầu",
        description: "Admin sẽ xem xét và phản hồi trong vòng 24-48 giờ",
      })

      setOpen(false)
      setFormData({ city: "", state: "", country: "Vietnam", reason: "" })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MapPin className="h-4 w-4" />
            Đăng ký khu vực mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Đăng ký khu vực mới
          </DialogTitle>
          <DialogDescription>
            Nếu khu vực bạn muốn đăng listing chưa có trong danh sách, 
            gửi yêu cầu để admin xem xét và thêm vào hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city">
              Thành phố <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              placeholder="Ví dụ: Đà Nẵng"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">
              Tỉnh/Bang <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              placeholder="Ví dụ: Đà Nẵng"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Quốc gia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Lý do đăng ký <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ví dụ: Tôi có 3 căn villa ở khu vực này và muốn đăng trên LuxeStay. Đây là khu du lịch nổi tiếng với nhu cầu thuê cao."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.reason.length}/500 ký tự (tối thiểu 20 ký tự)
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-2">Quy trình xử lý:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Admin sẽ xem xét yêu cầu trong vòng <strong>24-48 giờ</strong></li>
                <li>Bạn sẽ nhận <strong>thông báo</strong> khi yêu cầu được phê duyệt hoặc từ chối</li>
                <li>Sau khi được duyệt, khu vực sẽ xuất hiện trong danh sách để bạn đăng listing</li>
                <li>Mỗi host chỉ có thể gửi <strong>1 yêu cầu pending</strong> cho cùng 1 khu vực</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
