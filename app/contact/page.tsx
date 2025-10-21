"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Building2 } from "lucide-react"

const contactMethods = [
  {
    icon: Phone,
    title: "Hotline",
    value: "1900 1234",
    description: "Hỗ trợ 24/7",
    color: "from-blue-500 to-cyan-500",
    href: "tel:1900-1234",
  },
  {
    icon: Mail,
    title: "Email",
    value: "support@luxestay.vn",
    description: "Phản hồi trong 24h",
    color: "from-green-500 to-emerald-500",
    href: "mailto:support@luxestay.vn",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    value: "Trò chuyện ngay",
    description: "Phản hồi tức thì",
    color: "from-purple-500 to-pink-500",
    href: "/messages",
  },
]

const offices = [
  {
    city: "Hà Nội",
    address: "Tầng 15, Tòa nhà Keangnam, Phạm Hùng, Nam Từ Liêm",
    phone: "024 1234 5678",
    email: "hanoi@luxestay.vn",
  },
  {
    city: "Hồ Chí Minh",
    address: "Tầng 20, Bitexco Financial Tower, Hải Triều, Quận 1",
    phone: "028 1234 5678",
    email: "hcm@luxestay.vn",
  },
  {
    city: "Đà Nẵng",
    address: "Tầng 10, Trung tâm Thương mại Indochina, Hải Châu",
    phone: "0236 1234 567",
    email: "danang@luxestay.vn",
  },
]

const workingHours = [
  { day: "Thứ Hai - Thứ Sáu", time: "8:00 - 20:00" },
  { day: "Thứ Bảy - Chủ Nhật", time: "9:00 - 18:00" },
  { day: "Hotline", time: "24/7" },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Contact form submitted:", formData)
    alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.")
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-500/10 via-cyan-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl mb-4">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Liên hệ
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <a key={index} href={method.href}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
                    <CardContent className="p-6 space-y-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <method.icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-foreground mb-1">{method.title}</h3>
                        <p className="text-lg text-primary font-semibold">{method.value}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Gửi tin nhắn</h2>
                      <p className="text-muted-foreground">
                        Điền thông tin dưới đây và chúng tôi sẽ liên hệ lại với bạn trong 24 giờ
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Họ và tên *</Label>
                          <Input
                            id="name"
                            placeholder="Nguyễn Văn A"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Số điện thoại *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="0901234567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Chủ đề *</Label>
                        <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn chủ đề" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="booking">Vấn đề đặt phòng</SelectItem>
                            <SelectItem value="payment">Thanh toán & Hoàn tiền</SelectItem>
                            <SelectItem value="host">Trở thành chủ nhà</SelectItem>
                            <SelectItem value="technical">Lỗi kỹ thuật</SelectItem>
                            <SelectItem value="partnership">Hợp tác kinh doanh</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Nội dung *</Label>
                        <Textarea
                          id="message"
                          placeholder="Mô tả chi tiết vấn đề của bạn..."
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full gap-2" size="lg">
                        <Send className="h-5 w-5" />
                        Gửi tin nhắn
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Working Hours */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">Giờ làm việc</h3>
                  </div>
                  <div className="space-y-3">
                    {workingHours.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-muted last:border-0">
                        <span className="text-sm font-medium text-foreground">{schedule.day}</span>
                        <span className="text-sm text-muted-foreground">{schedule.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-gradient-to-br from-teal-50 to-cyan-50">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold text-foreground">Cần hỗ trợ gấp?</h3>
                  <p className="text-sm text-muted-foreground">
                    Liên hệ hotline để được hỗ trợ ngay lập tức
                  </p>
                  <a href="tel:1900-1234">
                    <Button className="w-full gap-2" size="lg">
                      <Phone className="h-5 w-5" />
                      Gọi 1900 1234
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl mb-2">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-foreground">Văn phòng</h2>
              <p className="text-lg text-muted-foreground">Địa chỉ các văn phòng của LuxeStay</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {offices.map((office, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-foreground mb-3">{office.city}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{office.address}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <a href={`tel:${office.phone}`} className="hover:text-primary">
                            {office.phone}
                          </a>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <a href={`mailto:${office.email}`} className="hover:text-primary">
                            {office.email}
                          </a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
