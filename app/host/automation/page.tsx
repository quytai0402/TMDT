"use client"

import { HostLayout } from "@/components/host-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Zap, Clock, KeyRound, Sparkles, TrendingUp } from "lucide-react"
import { MessagingTemplates } from "@/components/messaging-templates"
import { SavedReplies } from "@/components/saved-replies"
import { MessageScheduler } from "@/components/message-scheduler"
import { AutoCheckIn } from "@/components/auto-check-in"

export default function HostAutomationPage() {
  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Tự động hóa quản lý
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Tiết kiệm thời gian với các công cụ tự động hóa thông minh
            </p>
          </div>
          <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Xem thống kê
        </Button>
      </div>

      {/* Benefits Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Tiết kiệm thời gian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">12+ giờ</div>
            <p className="text-sm text-muted-foreground">Mỗi tuần không cần thao tác thủ công</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Phản hồi nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-1">Tức thì</div>
            <p className="text-sm text-muted-foreground">Tin nhắn tự động gửi ngay lập tức</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Trải nghiệm tốt hơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-1">4.9/5</div>
            <p className="text-sm text-muted-foreground">Đánh giá từ khách về giao tiếp</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Mẫu tin nhắn</span>
            <span className="sm:hidden">Mẫu</span>
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Trả lời nhanh</span>
            <span className="sm:hidden">Nhanh</span>
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Lên lịch</span>
            <span className="sm:hidden">Lịch</span>
          </TabsTrigger>
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Check-in</span>
            <span className="sm:hidden">Check-in</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <MessagingTemplates />
        </TabsContent>

        <TabsContent value="replies">
          <SavedReplies />
        </TabsContent>

        <TabsContent value="scheduler">
          <MessageScheduler />
        </TabsContent>

        <TabsContent value="checkin">
          <AutoCheckIn />
        </TabsContent>
      </Tabs>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>Cách hoạt động</CardTitle>
          <CardDescription>Quy trình tự động hóa 4 bước đơn giản</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold">Thiết lập mẫu</h3>
              <p className="text-sm text-muted-foreground">
                Tạo mẫu tin nhắn và câu trả lời nhanh với biến động
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold">Cấu hình lịch</h3>
              <p className="text-sm text-muted-foreground">
                Chọn thời điểm tự động gửi tin nhắn cho khách
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold">Kích hoạt</h3>
              <p className="text-sm text-muted-foreground">
                Bật tự động hóa và hệ thống sẽ làm việc cho bạn
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-semibold">Theo dõi</h3>
              <p className="text-sm text-muted-foreground">
                Xem báo cáo và tối ưu hóa các mẫu tin nhắn
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Câu hỏi thường gặp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Tôi có thể tùy chỉnh nội dung tin nhắn không?</h3>
            <p className="text-sm text-muted-foreground">
              Hoàn toàn có thể! Bạn có thể chỉnh sửa mọi mẫu tin nhắn và sử dụng biến động như {`{{guestName}}`}, 
              {`{{checkInDate}}`} để cá nhân hóa nội dung cho từng khách.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tin nhắn tự động có gửi vào cuối tuần không?</h3>
            <p className="text-sm text-muted-foreground">
              Có, tin nhắn sẽ gửi theo lịch đã cài đặt bất kể ngày nào trong tuần. Bạn có thể cấu hình 
              tránh gửi vào ban đêm (22:00 - 08:00) trong phần cài đặt.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tôi có thể tạm dừng tự động hóa không?</h3>
            <p className="text-sm text-muted-foreground">
              Có, bạn có thể bật/tắt từng tin nhắn tự động hoặc tạm dừng toàn bộ hệ thống bất cứ lúc nào. 
              Các tin nhắn đã lên lịch sẽ không được gửi khi bị tạm dừng.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Làm sao biết tin nhắn đã được gửi thành công?</h3>
            <p className="text-sm text-muted-foreground">
              Hệ thống sẽ ghi lại trạng thái gửi của mỗi tin nhắn. Bạn có thể xem thống kê chi tiết về 
              số lượng tin đã gửi, tỷ lệ thành công, và nhận thông báo nếu có lỗi xảy ra.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Có giới hạn số lượng tin nhắn không?</h3>
            <p className="text-sm text-muted-foreground">
              Không có giới hạn số lượng mẫu tin nhắn hay tin nhắn tự động bạn có thể tạo. Tuy nhiên, 
              với SMS có thể áp dụng phí dịch vụ tùy thuộc vào gói đăng ký của bạn.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </HostLayout>
  )
}
