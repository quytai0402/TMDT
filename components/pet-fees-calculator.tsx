"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Calculator, PawPrint, Plus, Minus } from "lucide-react"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"

interface PetFeesCalculatorProps {
  basePrice: number
  petFeePerNight: number
  cleaningFee: number
  maxPets?: number
}

export function PetFeesCalculator({
  basePrice,
  petFeePerNight,
  cleaningFee,
  maxPets = 3
}: PetFeesCalculatorProps) {
  const [nights, setNights] = useState(3)
  const [numberOfPets, setNumberOfPets] = useState(1)

  const roomTotal = basePrice * nights
  const petNightlyTotal = petFeePerNight * nights * numberOfPets
  const totalPetFees = petNightlyTotal + cleaningFee
  const grandTotal = roomTotal + totalPetFees

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price))
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Calculator className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Tính phí thú cưng</h3>
          <p className="text-sm text-muted-foreground">
            Xem trước chi phí khi mang theo thú cưng
          </p>
        </div>
      </div>

      {/* Number of Pets */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Số lượng thú cưng</label>
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNumberOfPets(Math.max(1, numberOfPets - 1))}
              disabled={numberOfPets <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="w-16 text-center">
              <span className="text-2xl font-bold">{numberOfPets}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNumberOfPets(Math.min(maxPets, numberOfPets + 1))}
              disabled={numberOfPets >= maxPets}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Tối đa {maxPets} thú cưng
        </p>
      </div>

      <Separator className="my-6" />

      {/* Number of Nights */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Số đêm lưu trú</label>
          <div className="text-right">
            <span className="text-2xl font-bold">{nights}</span>
            <span className="text-sm text-muted-foreground ml-1">đêm</span>
          </div>
        </div>
        <Slider
          value={[nights]}
          onValueChange={(value) => setNights(value[0])}
          min={1}
          max={30}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 đêm</span>
          <span>30 đêm</span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Cost Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-sm">Chi tiết chi phí</h4>
        
        {/* Room Cost */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Phòng: {formatPrice(basePrice)}₫ x {nights} đêm
          </span>
          <span className="font-medium">{formatPrice(roomTotal)}₫</span>
        </div>

        {/* Pet Nightly Fee */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <PawPrint className="w-4 h-4 text-purple-600" />
            <span className="text-muted-foreground">
              Phí thú cưng: {formatPrice(petFeePerNight)}₫ x {nights} đêm x {numberOfPets} con
            </span>
          </div>
          <span className="font-medium text-purple-600">{formatPrice(petNightlyTotal)}₫</span>
        </div>

        {/* Cleaning Fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Phí vệ sinh (một lần)</span>
          <span className="font-medium text-purple-600">{formatPrice(cleaningFee)}₫</span>
        </div>

        <Separator />

        {/* Pet Fees Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Tổng phí thú cưng</span>
          <span className="font-semibold text-purple-600">{formatPrice(totalPetFees)}₫</span>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold text-lg">Tổng cộng</span>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatPrice(grandTotal)}₫</div>
            <div className="text-xs text-muted-foreground">
              ≈ {formatPrice(grandTotal / nights)}₫/đêm
            </div>
          </div>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Phòng</span>
          <span className="font-medium">{Math.round((roomTotal / grandTotal) * 100)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-500"
            style={{ width: `${(roomTotal / grandTotal) * 100}%` }}
          />
          <div 
            className="bg-purple-500"
            style={{ width: `${(totalPetFees / grandTotal) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Phí thú cưng</span>
          <span className="font-medium">{Math.round((totalPetFees / grandTotal) * 100)}%</span>
        </div>
      </div>

      {/* Action Button */}
      <Button className="w-full" size="lg">
        <PawPrint className="w-4 h-4 mr-2" />
        Đặt phòng với {numberOfPets} thú cưng
      </Button>

      {/* Info Note */}
      <p className="mt-4 text-xs text-center text-muted-foreground">
        Phí thú cưng sẽ được thu cùng với tiền phòng
      </p>
    </Card>
  )
}
