import { Lightbulb, ShieldAlert } from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { HostListingForm } from "@/components/host-listing-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export default function HostCreateListingPage() {
  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Tạo listing mới</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Điền đầy đủ thông tin chi tiết để đội ngũ LuxeStay có thể duyệt nhanh chóng. Listing sẽ xuất hiện ở
            chế độ chờ duyệt cho tới khi quản trị viên phê duyệt và đồng bộ tới phía khách.
          </p>
        </div>

        <Alert className="border-primary/60 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <AlertTitle className="text-base font-semibold">Quy trình duyệt 2 bước</AlertTitle>
          <AlertDescription>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Gửi đầy đủ thông tin, hình ảnh và tiện nghi của chỗ ở để LuxeStay tiếp nhận.</li>
              <li>
                Quản trị viên kiểm duyệt, bổ sung chi tiết cần thiết và kích hoạt listing để hiển thị cho khách.
              </li>
            </ol>
            <div className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              Bạn sẽ nhận được email xác nhận ngay khi quá trình duyệt hoàn tất.
            </div>
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
            <Lightbulb className="mt-1 h-4 w-4" />
            <span>
              Gợi ý: ảnh sắc nét (tối thiểu 5 tấm), mô tả rõ ràng các trải nghiệm, tiện nghi và vị trí chính xác sẽ giúp
              tăng tỷ lệ được duyệt và thu hút khách đặt phòng.
            </span>
          </CardContent>
        </Card>

        <HostListingForm mode="create" />
      </div>
    </HostLayout>
  )
}
