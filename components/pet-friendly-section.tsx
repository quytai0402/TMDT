"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PawPrint, FileText, Calculator, MapPin, Heart, ChevronDown, ChevronUp } from "lucide-react"
import { PetPolicyDetails } from "@/components/pet-policy-details"
import { PetFeesCalculator } from "@/components/pet-fees-calculator"
import NearbyPetServices from "@/components/nearby-pet-services"
import { useState } from "react"

interface PetFriendlySectionProps {
  dailyPrice: number
  petPolicy?: {
    allowsPets: boolean
    maxPets: number
    allowedPetTypes: string[]
    petFee: {
      perNight: number
      cleaningFee: number
    }
    weightLimit: number
    restrictions: string[]
    amenities: string[]
  }
}

export function PetFriendlySection({ 
  dailyPrice,
  petPolicy = {
    allowsPets: true,
    maxPets: 2,
    allowedPetTypes: ["Chó", "Mèo"],
    petFee: {
      perNight: 100000,
      cleaningFee: 200000
    },
    weightLimit: 15,
    restrictions: [
      "Thú cưng không được lên giường/sofa",
      "Phải giữ vệ sinh chung",
      "Không để thú cưng chạy tự do trong khu vực chung",
      "Chủ nhà có quyền từ chối nếu thú cưng quá hiếu động hoặc có hành vi nguy hiểm"
    ],
    amenities: [
      "Bát ăn & bát nước",
      "Nệm/giường cho thú cưng",
      "Khu vực vui chơi ngoài trời",
      "Đồ chơi cho thú cưng",
      "Túi rác cho vệ sinh thú cưng",
      "Vòi nước để tắm thú cưng"
    ]
  }
}: PetFriendlySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!petPolicy.allowsPets) {
    return null // Don't show section if pets not allowed
  }

  return (
    <div className="space-y-6">
      {/* Compact Header - Always Visible */}
      <Card 
        className="p-6 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <PawPrint className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-lg">Bạn có mang thú cưng không?</h3>
                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <PawPrint className="w-3 h-3 mr-1" />
                  Pet-Friendly
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Chỗ nghỉ này chào đón thú cưng với chính sách phù hợp. 
                {!isExpanded && " Nhấn để xem chi tiết."}
              </p>
              {!isExpanded && (
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <PawPrint className="w-4 h-4 text-green-600" />
                    <span>Tối đa {petPolicy.maxPets} con</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-blue-600" />
                    <span>{petPolicy.weightLimit} kg</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span>{petPolicy.petFee.perNight.toLocaleString("vi-VN")}₫/đêm</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-4">
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
                <PawPrint className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold mb-1">Tối đa {petPolicy.maxPets} con</p>
              <p className="text-xs text-muted-foreground">Số lượng thú cưng</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold mb-1">{petPolicy.weightLimit} kg</p>
              <p className="text-xs text-muted-foreground">Giới hạn cân nặng</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold mb-1">{petPolicy.petFee.perNight.toLocaleString("vi-VN")}₫</p>
              <p className="text-xs text-muted-foreground">Phí mỗi đêm</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <p className="font-semibold mb-1">4 dịch vụ</p>
              <p className="text-xs text-muted-foreground">Gần đây</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="policy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="policy" className="text-xs md:text-sm">
                <FileText className="w-4 h-4 mr-2" />
                Chính sách
              </TabsTrigger>
              <TabsTrigger value="calculator" className="text-xs md:text-sm">
                <Calculator className="w-4 h-4 mr-2" />
                Tính phí
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs md:text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                Dịch vụ gần đây
              </TabsTrigger>
            </TabsList>

            <TabsContent value="policy" className="mt-6">
              <PetPolicyDetails
                allowsPets={petPolicy.allowsPets}
                maxPets={petPolicy.maxPets}
                allowedPetTypes={petPolicy.allowedPetTypes}
                petFee={petPolicy.petFee}
                weightLimit={petPolicy.weightLimit}
                restrictions={petPolicy.restrictions}
                amenities={petPolicy.amenities}
              />
            </TabsContent>

            <TabsContent value="calculator" className="mt-6">
              <PetFeesCalculator
                basePrice={dailyPrice}
                petFeePerNight={petPolicy.petFee.perNight}
                cleaningFee={petPolicy.petFee.cleaningFee}
                maxPets={petPolicy.maxPets}
              />
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <NearbyPetServices />
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <Card className="p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10 border-green-200 dark:border-green-800">
            <h3 className="font-semibold mb-3 flex items-center">
              <PawPrint className="w-5 h-5 mr-2 text-green-600" />
              Tại sao chọn nơi này cho thú cưng?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Không gian rộng rãi:</span> Sân vườn riêng để thú cưng chạy nhảy
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ An toàn:</span> Hàng rào bao quanh, không có cầu thang nguy hiểm
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Tiện nghi đầy đủ:</span> Bát ăn, nệm, đồ chơi cho thú cưng
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Dịch vụ gần đây:</span> Phòng khám thú y, công viên chỉ vài phút đi bộ
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Chủ nhà yêu động vật:</span> Có kinh nghiệm chăm sóc thú cưng
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Cộng đồng thân thiện:</span> Nhiều hàng xóm cũng nuôi thú cưng
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
