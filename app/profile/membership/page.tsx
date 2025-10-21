import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MembershipDashboard } from "@/components/membership-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProfileMembershipPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Profile
              </Button>
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Membership của tôi</h1>
            <p className="text-muted-foreground">
              Quản lý gói thành viên và theo dõi quyền lợi của bạn
            </p>
          </div>

          {/* Dashboard */}
          <MembershipDashboard />
        </div>
      </main>
      <Footer />
    </div>
  )
}
