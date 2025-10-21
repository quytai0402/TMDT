import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Shield, Award, Clock, Headphones } from 'lucide-react'

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Thanh toán an toàn',
      description: 'Bảo mật SSL 256-bit',
    },
    {
      icon: Award,
      title: 'Chỗ nghỉ xác thực',
      description: '100% được kiểm duyệt',
    },
    {
      icon: Clock,
      title: 'Hủy phòng linh hoạt',
      description: 'Hoàn tiền trong 24h',
    },
    {
      icon: Headphones,
      title: 'Hỗ trợ 24/7',
      description: 'Luôn sẵn sàng hỗ trợ',
    },
  ]

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <Card
              key={index}
              className="p-6 text-center hover:shadow-lg transition-all duration-300 border-0 bg-background"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
