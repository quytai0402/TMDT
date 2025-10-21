"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PawPrint, Check, X, Info, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PetPolicyProps {
  allowsPets?: boolean
  maxPets?: number
  allowedPetTypes?: string[]
  petFee?: {
    perNight?: number
    perStay?: number
    cleaningFee?: number
  }
  weightLimit?: number
  restrictions?: string[]
  amenities?: string[]
}

export function PetPolicyDetails({
  allowsPets = true,
  maxPets = 2,
  allowedPetTypes = ["Chó", "Mèo"],
  petFee = {
    perNight: 100000,
    cleaningFee: 200000
  },
  weightLimit = 15,
  restrictions = [
    "Thú cưng không được lên giường/sofa",
    "Phải giữ vệ sinh chung",
    "Không để thú cưng chạy tự do trong khu vực chung"
  ],
  amenities = [
    "Bát ăn & bát nước",
    "Nệm/giường cho thú cưng",
    "Khu vực vui chơi ngoài trời",
    "Đồ chơi cho thú cưng"
  ]
}: PetPolicyProps) {
  if (!allowsPets) {
    return (
      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <X className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Không cho phép thú cưng</h3>
            <p className="text-sm text-muted-foreground">
              Chỗ nghỉ này không cho phép mang theo thú cưng.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <PawPrint className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Chính sách thú cưng</h3>
            <p className="text-sm text-muted-foreground">
              Chào đón thú cưng của bạn với điều kiện phù hợp
            </p>
          </div>
        </div>
        <Badge className="bg-green-600">
          <PawPrint className="w-3 h-3 mr-1" />
          Pet-Friendly
        </Badge>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Số lượng tối đa</p>
          <p className="font-semibold text-lg">{maxPets} con</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Giới hạn cân nặng</p>
          <p className="font-semibold text-lg">{weightLimit} kg</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Phí/đêm</p>
          <p className="font-semibold text-lg">{(petFee.perNight || 0).toLocaleString("vi-VN")}₫</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Phí vệ sinh</p>
          <p className="font-semibold text-lg">{(petFee.cleaningFee || 0).toLocaleString("vi-VN")}₫</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Allowed Pet Types */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 flex items-center">
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Loại thú cưng được chấp nhận
        </h4>
        <div className="flex flex-wrap gap-2">
          {allowedPetTypes.map((type, idx) => (
            <Badge key={idx} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Pet Amenities */}
      {amenities.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 flex items-center">
            <PawPrint className="w-4 h-4 mr-2 text-purple-600" />
            Tiện nghi cho thú cưng
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {amenities.map((amenity, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-orange-600" />
            Quy định cần lưu ý
          </h4>
          <div className="space-y-2">
            {restrictions.map((restriction, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{restriction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <DollarSign className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Chi tiết phí thú cưng
          </p>
          <div className="space-y-1 text-blue-700 dark:text-blue-300">
            {petFee.perNight && (
              <div className="flex justify-between">
                <span>Phí mỗi đêm (mỗi con):</span>
                <span className="font-medium">{petFee.perNight.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            {petFee.cleaningFee && (
              <div className="flex justify-between">
                <span>Phí vệ sinh (một lần):</span>
                <span className="font-medium">{petFee.cleaningFee.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <Separator className="my-2" />
            <p className="text-xs">
              * Phí sẽ được tính vào tổng chi phí đặt phòng
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Contact Host */}
      <div className="mt-6">
        <Button variant="outline" className="w-full">
          Liên hệ chủ nhà về thú cưng
        </Button>
      </div>
    </Card>
  )
}
