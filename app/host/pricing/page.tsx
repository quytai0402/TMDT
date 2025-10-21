"use client"

import { HostLayout } from "@/components/host-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sparkles,
  TrendingUp,
  Calculator,
  Target,
  Zap,
  Info
} from "lucide-react"
import { AIPricingSuggestions } from "@/components/ai-pricing-suggestions"
import { PricingSimulator } from "@/components/pricing-simulator"

export default function SmartPricingPage() {
  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">Smart Pricing Assistant</h1>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Tối ưu giá tự động dựa trên AI, market data và competitor analysis
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Info className="w-4 h-4 mr-2" />
                Hướng dẫn
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Zap className="w-4 h-4 mr-2" />
                Kích hoạt Auto-pricing
              </Button>
            </div>
          </div>
        </div>

        {/* Benefits Banner */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Tăng 25-40% doanh thu</h4>
                <p className="text-sm text-muted-foreground">
                  Tối ưu giá theo thời gian thực để maximize revenue
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Tiết kiệm 10+ giờ/tuần</h4>
                <p className="text-sm text-muted-foreground">
                  Không cần điều chỉnh giá thủ công mỗi ngày
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Luôn cạnh tranh</h4>
                <p className="text-sm text-muted-foreground">
                  Theo dõi 24/7 và điều chỉnh theo đối thủ
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="suggestions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions" className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Đề xuất từ AI</span>
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Mô phỏng chiến lược</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions">
            <AIPricingSuggestions />
          </TabsContent>

          <TabsContent value="simulator">
            <PricingSimulator />
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="p-6 mt-8">
          <h3 className="text-xl font-bold mb-6">Cách Smart Pricing hoạt động</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Thu thập dữ liệu</h4>
              <p className="text-sm text-muted-foreground">
                AI phân tích 12+ đối thủ, booking trends, weather, events
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Dự đoán nhu cầu</h4>
              <p className="text-sm text-muted-foreground">
                Machine learning dự báo occupancy & optimal price
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Tạo đề xuất</h4>
              <p className="text-sm text-muted-foreground">
                AI đưa ra giá tối ưu với confidence score & reasoning
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Tự động áp dụng</h4>
              <p className="text-sm text-muted-foreground">
                Bạn review & approve hoặc để AI tự động cập nhật
              </p>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="p-6 mt-8">
          <h3 className="text-xl font-bold mb-6">Câu hỏi thường gặp</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">AI có thay đổi giá quá thường xuyên không?</h4>
              <p className="text-sm text-muted-foreground">
                Không, AI chỉ thay đổi khi có sự thay đổi đáng kể về nhu cầu hoặc đối thủ. 
                Thông thường 2-3 lần/tuần, tránh confuse khách hàng.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tôi có thể set giá tối thiểu/tối đa không?</h4>
              <p className="text-sm text-muted-foreground">
                Có, bạn có thể set floor price & ceiling price. AI sẽ không bao giờ đề xuất giá ngoài range này.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">AI có tính đến special events không?</h4>
              <p className="text-sm text-muted-foreground">
                Có, AI theo dõi 100+ local events, holidays, festivals, conferences và điều chỉnh giá phù hợp.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </HostLayout>
  )
}
