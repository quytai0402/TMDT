"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VRTourViewer } from "@/components/vr-tour-viewer"
import { ARPreview } from "@/components/ar-preview"
import { Eye, Smartphone, Video } from "lucide-react"

interface ImmersiveMediaSectionProps {
  listingId: string
}

// Mock data
const vrPanoramas = [
  {
    id: "living-room",
    title: "Phòng khách",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
    hotspots: [
      { x: 70, y: 50, label: "Đến phòng ngủ", target: "bedroom" },
      { x: 30, y: 60, label: "Đến bếp", target: "kitchen" }
    ]
  },
  {
    id: "bedroom",
    title: "Phòng ngủ",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200",
    hotspots: [
      { x: 50, y: 70, label: "Quay lại phòng khách", target: "living-room" },
      { x: 80, y: 50, label: "Đến phòng tắm", target: "bathroom" }
    ]
  },
  {
    id: "kitchen",
    title: "Nhà bếp",
    image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200",
    hotspots: [
      { x: 50, y: 60, label: "Quay lại phòng khách", target: "living-room" }
    ]
  },
  {
    id: "bathroom",
    title: "Phòng tắm",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200",
    hotspots: [
      { x: 50, y: 70, label: "Quay lại phòng ngủ", target: "bedroom" }
    ]
  }
]

const arFurnitureItems = [
  {
    id: "sofa",
    name: "Sofa",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300",
    category: "seating"
  },
  {
    id: "table",
    name: "Bàn",
    image: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=300",
    category: "table"
  },
  {
    id: "chair",
    name: "Ghế",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?w=300",
    category: "seating"
  },
  {
    id: "lamp",
    name: "Đèn",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300",
    category: "lighting"
  },
  {
    id: "plant",
    name: "Cây",
    image: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=300",
    category: "decor"
  },
  {
    id: "rug",
    name: "Thảm",
    image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=300",
    category: "decor"
  }
]

export function ImmersiveMediaSection({ listingId }: ImmersiveMediaSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            Công nghệ mới
          </Badge>
          <Badge variant="outline">AR/VR</Badge>
        </div>
        <h2 className="text-3xl font-bold">Trải nghiệm nhập vai</h2>
        <p className="text-muted-foreground">
          Khám phá homestay với công nghệ AR và VR tiên tiến
        </p>
      </div>

      <Tabs defaultValue="vr" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vr" className="gap-2">
            <Eye className="h-4 w-4" />
            360° VR Tour
          </TabsTrigger>
          <TabsTrigger value="ar" className="gap-2">
            <Smartphone className="h-4 w-4" />
            AR Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Virtual Reality Tour
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Khám phá từng góc của homestay với tour 360° tương tác
              </p>
            </CardHeader>
            <CardContent>
              <VRTourViewer
                panoramas={vrPanoramas}
                initialPanorama="living-room"
              />

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Xem 360°</h4>
                        <p className="text-sm text-muted-foreground">
                          Xoay view tự do để xem toàn cảnh không gian
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center shrink-0">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Di chuyển tự do</h4>
                        <p className="text-sm text-muted-foreground">
                          Click hotspots để di chuyển giữa các phòng
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Augmented Reality Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Đặt đồ nội thất ảo để hình dung không gian theo ý bạn
              </p>
            </CardHeader>
            <CardContent>
              <ARPreview
                roomName="Phòng khách"
                roomImage="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200"
                furnitureItems={arFurnitureItems}
              />

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">Tính năng AR Preview</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-semibold">Đặt đồ ảo</p>
                        <p className="text-xs text-muted-foreground">
                          Thêm nội thất vào không gian
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-semibold">Xem trước</p>
                        <p className="text-xs text-muted-foreground">
                          Hình dung phòng với đồ mới
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-semibold">Tùy chỉnh</p>
                        <p className="text-xs text-muted-foreground">
                          Thay đổi vị trí, xoay, phóng to
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tech Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Công nghệ AR/VR</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Chúng tôi sử dụng công nghệ AR/VR tiên tiến để mang đến trải nghiệm xem nhà tuyệt vời nhất. 
                Bạn có thể khám phá homestay như đang ở đó thực sự, giúp ra quyết định đặt phòng dễ dàng và chính xác hơn.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">360° Panorama</Badge>
                <Badge variant="secondary">Interactive Hotspots</Badge>
                <Badge variant="secondary">AR Furniture Placement</Badge>
                <Badge variant="secondary">Real-time Rendering</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
