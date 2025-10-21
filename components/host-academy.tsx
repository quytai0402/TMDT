"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Play, Clock, CheckCircle2, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  level: "beginner" | "intermediate" | "advanced"
  duration: string
  lessons: number
  progress: number
  category: string
  enrolled: boolean
  thumbnail: string
  instructor: string
}

const courses: Course[] = [
  {
    id: "1",
    title: "Bắt đầu với Host Academy",
    description: "Học cách tạo listing đầu tiên, chụp ảnh chuyên nghiệp, và thu hút khách đặt phòng",
    level: "beginner",
    duration: "2 giờ",
    lessons: 8,
    progress: 0,
    category: "Cơ bản",
    enrolled: false,
    thumbnail: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400",
    instructor: "Nguyễn Minh Anh"
  },
  {
    id: "2",
    title: "Tối ưu hóa listing",
    description: "Viết mô tả hấp dẫn, chọn amenities phù hợp, và tối ưu giá để tăng booking",
    level: "intermediate",
    duration: "3 giờ",
    lessons: 12,
    progress: 67,
    category: "Marketing",
    enrolled: true,
    thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
    instructor: "Trần Hương Giang"
  },
  {
    id: "3",
    title: "Quản lý đánh giá & phản hồi",
    description: "Cách nhận và trả lời review, xử lý phàn nàn, và xây dựng danh tiếng tốt",
    level: "intermediate",
    duration: "2.5 giờ",
    lessons: 10,
    progress: 30,
    category: "Dịch vụ khách hàng",
    enrolled: true,
    thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400",
    instructor: "Lê Tuấn Anh"
  },
  {
    id: "4",
    title: "Chiến lược định giá động",
    description: "Học cách sử dụng Smart Pricing, điều chỉnh giá theo mùa và sự kiện",
    level: "advanced",
    duration: "4 giờ",
    lessons: 15,
    progress: 0,
    category: "Định giá",
    enrolled: false,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    instructor: "Phạm Mai Linh"
  },
  {
    id: "5",
    title: "Tự động hóa & tiết kiệm thời gian",
    description: "Thiết lập tin nhắn tự động, check-in không tiếp xúc, và quy trình hiệu quả",
    level: "advanced",
    duration: "3.5 giờ",
    lessons: 14,
    progress: 0,
    category: "Tự động hóa",
    enrolled: false,
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400",
    instructor: "Nguyễn Minh Anh"
  },
  {
    id: "6",
    title: "Luật & thuế cho chủ nhà",
    description: "Hiểu quy định pháp luật, kê khai thuế, và tuân thủ các quy định địa phương",
    level: "intermediate",
    duration: "2 giờ",
    lessons: 8,
    progress: 0,
    category: "Pháp lý",
    enrolled: false,
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
    instructor: "Luật sư Hoàng Anh"
  }
]

const getLevelColor = (level: Course["level"]) => {
  switch (level) {
    case "beginner": return "bg-green-100 text-green-700"
    case "intermediate": return "bg-blue-100 text-blue-700"
    case "advanced": return "bg-purple-100 text-purple-700"
  }
}

const getLevelText = (level: Course["level"]) => {
  switch (level) {
    case "beginner": return "Cơ bản"
    case "intermediate": return "Trung bình"
    case "advanced": return "Nâng cao"
  }
}

export function HostAcademy() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Host Academy</h2>
        <p className="text-muted-foreground">Học hỏi từ các chuyên gia và host hàng đầu</p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Khóa học đã tham gia</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">/ 6 khóa học</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Khóa học</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian học</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2h</div>
            <p className="text-xs text-muted-foreground">Tuần này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chứng chỉ</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Đạt được</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Path Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Lộ trình học tập được đề xuất</h3>
              <p className="text-blue-100">
                Chúng tôi đã chuẩn bị lộ trình phù hợp với kinh nghiệm của bạn
              </p>
              <Button variant="secondary" className="mt-4">
                <TrendingUp className="h-4 w-4 mr-2" />
                Xem lộ trình của tôi
              </Button>
            </div>
            <Award className="h-24 w-24 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="object-cover w-full h-full"
              />
              <Badge className={`absolute top-2 left-2 ${getLevelColor(course.level)}`}>
                {getLevelText(course.level)}
              </Badge>
              {course.enrolled && (
                <Badge className="absolute top-2 right-2 bg-blue-600">
                  Đang học
                </Badge>
              )}
            </div>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline">{course.category}</Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {course.duration}
                </div>
              </div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{course.lessons} bài học</span>
                  <span className="text-muted-foreground">Giảng viên: {course.instructor}</span>
                </div>
                
                {course.enrolled && course.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Tiến độ</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                )}

                <Button className="w-full" variant={course.enrolled ? "default" : "outline"}>
                  {course.enrolled ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục học
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Tham gia khóa học
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certification Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Chứng chỉ chuyên nghiệp
          </CardTitle>
          <CardDescription>
            Hoàn thành khóa học để nhận chứng chỉ và badge đặc biệt trên profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg text-center">
              <Award className="h-12 w-12 mx-auto text-yellow-600 mb-2" />
              <h4 className="font-semibold mb-1">Host cơ bản</h4>
              <p className="text-xs text-muted-foreground mb-2">Hoàn thành 3 khóa cơ bản</p>
              <Badge variant="outline">0/3</Badge>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Award className="h-12 w-12 mx-auto text-blue-600 mb-2" />
              <h4 className="font-semibold mb-1">Host chuyên nghiệp</h4>
              <p className="text-xs text-muted-foreground mb-2">Hoàn thành tất cả khóa học</p>
              <Badge variant="outline">0/6</Badge>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Award className="h-12 w-12 mx-auto text-purple-600 mb-2" />
              <h4 className="font-semibold mb-1">Super Host Expert</h4>
              <p className="text-xs text-muted-foreground mb-2">Đạt tất cả + duy trì 1 năm</p>
              <Badge variant="outline">Chưa đạt</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
