import { ForgotPasswordForm } from "@/components/forgot-password-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-serif text-2xl font-bold">L</span>
            </div>
            <span className="font-serif text-3xl font-bold text-foreground">LuxeStay</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Quên mật khẩu?</h1>
          <p className="text-muted-foreground">Nhập email của bạn để nhận link đặt lại mật khẩu</p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
