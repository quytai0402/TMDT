import { RegisterForm } from "@/components/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src="/placeholder.svg?height=1080&width=1080"
          alt="Register background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center">
            <h2 className="font-serif text-4xl font-bold mb-4">Bắt đầu hành trình của bạn</h2>
            <p className="text-xl text-white/90">Tham gia cộng đồng LuxeStay ngay hôm nay</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-serif text-2xl font-bold">L</span>
              </div>
              <span className="font-serif text-3xl font-bold text-foreground">LuxeStay</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Tạo tài khoản</h1>
            <p className="text-muted-foreground">Đăng ký để bắt đầu</p>
          </div>

          <RegisterForm />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
