import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

interface GuideLayoutProps {
  children: ReactNode
}

export const metadata = {
  title: "Guide Center",
  description: "Quản lý trải nghiệm hướng dẫn viên LuxeStay",
}

export default async function GuideLayout({ children }: GuideLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/login?callbackUrl=/guide/dashboard`)
  }

  if (!session.user.isGuide) {
    redirect("/become-guide")
  }

  return <>{children}</>
}
