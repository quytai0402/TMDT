import Link from "next/link"
import { Suspense } from "react"
import { Loader2, Plus } from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { HostListings } from "@/components/host-listings"
import { Button } from "@/components/ui/button"

function HostListingsContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chỗ nghỉ</h1>
          <p className="text-muted-foreground">
            Theo dõi và cập nhật các listing đang hoạt động của bạn theo thời gian thực.
          </p>
        </div>
        <Button asChild>
          <Link href="/host/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm listing mới
          </Link>
        </Button>
      </div>

      <HostListings />
    </div>
  )
}

export default function HostListingsPage() {
  return (
    <HostLayout>
      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <HostListingsContent />
      </Suspense>
    </HostLayout>
  )
}
