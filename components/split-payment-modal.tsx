"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Copy,
  Mail,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SplitPerson {
  id: string
  name: string
  email: string
  amount: number
  paid: boolean
  avatar?: string
}

interface SplitPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  bookingId: string
}

export function SplitPaymentModal({ 
  open, 
  onOpenChange, 
  totalAmount,
  bookingId 
}: SplitPaymentModalProps) {
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal")
  const [people, setPeople] = useState<SplitPerson[]>([
    { id: "1", name: "Bạn", email: "", amount: 0, paid: true, avatar: "" }
  ])
  const [newPerson, setNewPerson] = useState({ name: "", email: "" })
  const [linkCopied, setLinkCopied] = useState(false)

  const calculateSplitAmounts = () => {
    if (splitMethod === "equal") {
      const amountPerPerson = totalAmount / people.length
      return people.map(p => ({ ...p, amount: amountPerPerson }))
    }
    return people
  }

  const splitPeople = calculateSplitAmounts()
  const totalSplit = splitPeople.reduce((sum, p) => sum + p.amount, 0)
  const isValid = Math.abs(totalSplit - totalAmount) < 1

  const addPerson = () => {
    if (newPerson.name && newPerson.email) {
      setPeople([
        ...people,
        {
          id: Date.now().toString(),
          name: newPerson.name,
          email: newPerson.email,
          amount: 0,
          paid: false
        }
      ])
      setNewPerson({ name: "", email: "" })
    }
  }

  const removePerson = (id: string) => {
    if (people.length > 1) {
      setPeople(people.filter(p => p.id !== id))
    }
  }

  const updateAmount = (id: string, amount: number) => {
    setPeople(people.map(p => p.id === id ? { ...p, amount } : p))
  }

  const copyPaymentLink = () => {
    const link = `https://yourdomain.com/pay/${bookingId}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const sendInvitations = () => {
    // Simulate sending invitations
    alert("Đã gửi lời mời thanh toán đến tất cả thành viên!")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Chia tiền cho nhóm
          </DialogTitle>
          <DialogDescription>
            Chia tiền booking cho nhiều người. Mỗi người sẽ nhận link thanh toán riêng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Amount Display */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Tổng tiền cần thanh toán</p>
                <p className="text-3xl font-bold text-blue-900">
                  {totalAmount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Chia cho {people.length} người
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Split Method */}
          <div>
            <Label className="mb-3 block">Phương thức chia</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={splitMethod === "equal" ? "default" : "outline"}
                onClick={() => setSplitMethod("equal")}
                className="justify-start"
              >
                <Check className={`h-4 w-4 mr-2 ${splitMethod === "equal" ? "" : "invisible"}`} />
                Chia đều
              </Button>
              <Button
                variant={splitMethod === "custom" ? "default" : "outline"}
                onClick={() => setSplitMethod("custom")}
                className="justify-start"
              >
                <Check className={`h-4 w-4 mr-2 ${splitMethod === "custom" ? "" : "invisible"}`} />
                Tùy chỉnh số tiền
              </Button>
            </div>
          </div>

          <Separator />

          {/* People List */}
          <div className="space-y-3">
            <Label>Danh sách người tham gia ({people.length} người)</Label>
            
            {splitPeople.map((person, index) => (
              <Card key={person.id} className={person.paid ? "border-green-200 bg-green-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>{person.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{person.name}</p>
                        {person.paid && (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đã thanh toán
                          </Badge>
                        )}
                        {index === 0 && <Badge variant="secondary">Bạn</Badge>}
                      </div>
                      {person.email && (
                        <p className="text-sm text-gray-500">{person.email}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {splitMethod === "custom" && !person.paid ? (
                        <Input
                          type="number"
                          value={person.amount}
                          onChange={(e) => updateAmount(person.id, parseFloat(e.target.value) || 0)}
                          className="w-32"
                          placeholder="Số tiền"
                        />
                      ) : (
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {person.amount.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      )}

                      {index !== 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePerson(person.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Person */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label>Thêm người mới</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Tên"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                  />
                </div>
                <Button
                  onClick={addPerson}
                  variant="outline"
                  className="w-full"
                  disabled={!newPerson.name || !newPerson.email}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm người
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation */}
          {splitMethod === "custom" && !isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tổng số tiền chia ({totalSplit.toLocaleString('vi-VN')} ₫) không khớp với tổng booking ({totalAmount.toLocaleString('vi-VN')} ₫)
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Link */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <Label className="mb-2 block">Link thanh toán (chia sẻ cho nhóm)</Label>
              <div className="flex gap-2">
                <Input 
                  value={`https://yourdomain.com/pay/${bookingId}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyPaymentLink}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={sendInvitations}
            disabled={!isValid}
          >
            <Mail className="h-4 w-4 mr-2" />
            Gửi lời mời thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
