"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  CreditCard, 
  Check,
  AlertCircle,
  TrendingUp,
  Percent
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InstallmentPlan {
  id: string
  name: string
  months: number
  interestRate: number
  monthlyPayment: number
  totalAmount: number
  savings?: number
  popular?: boolean
  provider: string
}

interface InstallmentPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  bookingDate: Date
}

export function InstallmentPaymentModal({ 
  open, 
  onOpenChange, 
  totalAmount,
  bookingDate
}: InstallmentPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  const calculateInstallment = (months: number, interestRate: number) => {
    const monthlyRate = interestRate / 100 / 12
    const totalWithInterest = totalAmount * (1 + (interestRate / 100))
    const monthlyPayment = monthlyRate > 0 
      ? (totalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : totalAmount / months
    
    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalAmount: Math.round(totalWithInterest)
    }
  }

  const installmentPlans: InstallmentPlan[] = [
    {
      id: "3-month",
      name: "3 tháng",
      months: 3,
      interestRate: 0,
      ...calculateInstallment(3, 0),
      popular: true,
      provider: "Booking Now"
    },
    {
      id: "6-month",
      name: "6 tháng",
      months: 6,
      interestRate: 2.5,
      ...calculateInstallment(6, 2.5),
      provider: "Kredivo"
    },
    {
      id: "9-month",
      name: "9 tháng",
      months: 9,
      interestRate: 4.5,
      ...calculateInstallment(9, 4.5),
      provider: "Home Credit"
    },
    {
      id: "12-month",
      name: "12 tháng",
      months: 12,
      interestRate: 6.0,
      ...calculateInstallment(12, 6.0),
      provider: "FE Credit"
    }
  ]

  const selectedPlanDetails = installmentPlans.find(p => p.id === selectedPlan)

  const getPaymentSchedule = () => {
    if (!selectedPlanDetails) return []
    
    const schedule = []
    const startDate = new Date(bookingDate)
    
    for (let i = 0; i < selectedPlanDetails.months; i++) {
      const paymentDate = new Date(startDate)
      paymentDate.setMonth(paymentDate.getMonth() + i)
      
      schedule.push({
        number: i + 1,
        date: paymentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        amount: selectedPlanDetails.monthlyPayment,
        status: i === 0 ? 'due' : 'scheduled'
      })
    }
    
    return schedule
  }

  const confirmInstallment = () => {
    if (selectedPlanDetails) {
      alert(`Đã chọn gói trả góp ${selectedPlanDetails.name}!\nSố tiền/tháng: ${selectedPlanDetails.monthlyPayment.toLocaleString('vi-VN')} ₫`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Thanh toán trả góp
          </DialogTitle>
          <DialogDescription>
            Chọn kỳ hạn trả góp phù hợp. Đặt ngay, trả dần không lo tài chính.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Amount */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Tổng tiền booking</p>
                <p className="text-3xl font-bold text-green-900">
                  {totalAmount.toLocaleString('vi-VN')} ₫
                </p>
                <Badge variant="secondary" className="mt-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  Check-in: {bookingDate.toLocaleDateString('vi-VN')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Lưu ý:</strong> Booking sẽ được xác nhận ngay sau khi thanh toán kỳ đầu tiên. 
              Các kỳ tiếp theo sẽ tự động trừ từ thẻ của bạn.
            </AlertDescription>
          </Alert>

          {/* Installment Plans */}
          <div>
            <Label className="mb-3 block text-base font-semibold">Chọn kỳ hạn trả góp</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="grid md:grid-cols-2 gap-4">
                {installmentPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'border-2 border-blue-600 shadow-md' 
                        : 'hover:border-gray-400'
                    } ${plan.popular ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={plan.id} id={plan.id} />
                          <Label htmlFor={plan.id} className="font-semibold cursor-pointer">
                            {plan.name}
                          </Label>
                        </div>
                        {plan.popular && (
                          <Badge className="bg-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Phổ biến
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {plan.monthlyPayment.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-sm text-gray-500">/tháng</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Percent className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Lãi suất: <span className={plan.interestRate === 0 ? "text-green-600 font-semibold" : ""}>{plan.interestRate}%</span>
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          Tổng thanh toán: <span className="font-semibold">{plan.totalAmount.toLocaleString('vi-VN')} ₫</span>
                        </div>

                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Hỗ trợ bởi: {plan.provider}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Payment Schedule */}
          {selectedPlanDetails && (
            <>
              <Separator />
              
              <div>
                <Label className="mb-3 block text-base font-semibold">Lịch thanh toán chi tiết</Label>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {getPaymentSchedule().map((payment, index) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              payment.status === 'due' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {payment.number}
                            </div>
                            <div>
                              <p className="font-medium">
                                Kỳ {payment.number}
                                {payment.status === 'due' && (
                                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                                    Đến hạn
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {payment.date}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {payment.amount.toLocaleString('vi-VN')} ₫
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="mt-4 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng gốc:</span>
                        <span>{totalAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lãi suất ({selectedPlanDetails.interestRate}%):</span>
                        <span>{(selectedPlanDetails.totalAmount - totalAmount).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Tổng thanh toán:</span>
                        <span className="text-blue-600">{selectedPlanDetails.totalAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Benefits */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-900">
                <Check className="h-5 w-5" />
                Quyền lợi khi trả góp
              </h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Xác nhận booking ngay lập tức</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Hoàn tiền 100% nếu hủy trong 24h</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Tự động gia hạn nếu cần đổi lịch</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Không phí ẩn, không phụ phí</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={confirmInstallment}
            disabled={!selectedPlan}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Xác nhận trả góp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
