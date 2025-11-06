import { redirect } from "next/navigation"

export const metadata = {
  title: "Guide Center",
  description: "Trung tâm quản lý hướng dẫn viên",
}

export default function GuideRootPage() {
  redirect("/guide/dashboard")
  return null
}
