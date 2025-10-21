"use client"

import { HostLayout } from "@/components/host-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, Video, Award, HelpCircle } from "lucide-react"
import { HostAcademy } from "@/components/host-academy"
import { HostCommunityForum } from "@/components/host-community-forum"

const resources = [
  {
    title: "Hướng dẫn bắt đầu",
    description: "Tất cả những gì bạn cần để trở thành host thành công",
    icon: BookOpen,
    items: [
      "Tạo listing đầu tiên",
      "Chính sách giá & hủy phòng",
      "Chuẩn bị nhà cho khách",
      "Quy tắc nhà & an toàn"
    ],
    link: "/host/resources/getting-started"
  },
  {
    title: "Video hướng dẫn",
    description: "Học qua video từ các chuyên gia",
    icon: Video,
    items: [
      "Chụp ảnh chuyên nghiệp",
      "Viết mô tả hấp dẫn",
      "Tối ưu giá cả",
      "Xử lý tình huống khó"
    ],
    link: "/host/resources/videos"
  },
  {
    title: "Pháp lý & thuế",
    description: "Hiểu rõ nghĩa vụ pháp lý của bạn",
    icon: FileText,
    items: [
      "Quy định địa phương",
      "Kê khai thuế thu nhập",
      "Bảo hiểm cho chủ nhà",
      "Hợp đồng & điều khoản"
    ],
    link: "/host/resources/legal"
  }
]

const successStories = [
  {
    name: "Nguyễn Minh Anh",
    location: "Đà Lạt",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh",
    story: "Từ 1 phòng nhỏ, sau 2 năm tôi đã có 5 căn homestay và thu nhập 150 triệu/tháng",
    revenue: "150tr/tháng",
    properties: 5,
    rating: 4.95
  },
  {
    name: "Trần Hương Giang",
    location: "Hội An",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=giang",
    story: "Nhờ tối ưu hóa listing và giá, tôi tăng được 60% booking chỉ trong 3 tháng",
    revenue: "80tr/tháng",
    properties: 2,
    rating: 4.98
  },
  {
    name: "Lê Tuấn Anh",
    location: "Nha Trang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tuan",
    story: "Tự động hóa giúp tôi tiết kiệm 15 giờ/tuần và có thể mở rộng quy mô",
    revenue: "120tr/tháng",
    properties: 4,
    rating: 4.92
  }
]

export default function HostResourcesPage() {
  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Tài nguyên & học tập
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Award className="h-3 w-3 mr-1" />
            Education
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Học hỏi, kết nối và phát triển cùng cộng đồng host
        </p>
      </div>

      {/* Quick Resources */}
      <div className="grid gap-6 md:grid-cols-3">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <Card key={resource.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {resource.items.map((item) => (
                    <li key={item} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="academy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="academy" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Host Academy
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cộng đồng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academy">
          <HostAcademy />
        </TabsContent>

        <TabsContent value="forum">
          <HostCommunityForum />
        </TabsContent>
      </Tabs>

      {/* Success Stories */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Câu chuyện thành công</h2>
          <p className="text-muted-foreground">Cảm hứng từ những host xuất sắc</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {successStories.map((story) => (
            <Card key={story.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{story.name}</h3>
                    <p className="text-sm text-muted-foreground">{story.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        ⭐ {story.rating}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {story.properties} BĐS
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 italic">"{story.story}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Doanh thu</p>
                    <p className="font-bold text-green-600">{story.revenue}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Đọc thêm
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Cần hỗ trợ?
          </CardTitle>
          <CardDescription>
            Chúng tôi luôn sẵn sàng giúp đỡ bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <BookOpen className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Trung tâm trợ giúp</span>
              <span className="text-xs text-muted-foreground">
                Tìm câu trả lời nhanh chóng
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Users className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Hỏi cộng đồng</span>
              <span className="text-xs text-muted-foreground">
                Nhận lời khuyên từ host khác
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <HelpCircle className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Liên hệ hỗ trợ</span>
              <span className="text-xs text-muted-foreground">
                Nhận hỗ trợ 1-1 từ chúng tôi
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </HostLayout>
  )
}
