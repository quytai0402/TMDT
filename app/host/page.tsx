import { redirect } from "next/navigation"

export const metadata = {
  title: "Host Center",
  description: "Quản lý hoạt động host",
}

export default function HostPage() {
  redirect("/host/dashboard")
  return null
}
