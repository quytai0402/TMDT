"use client"

import { HostDashboardLayout, type HostDashboardLayoutProps } from "@/components/host-dashboard-layout"

type HostLayoutProps = Pick<HostDashboardLayoutProps, "metrics" | "children">

export function HostLayout({ children, metrics }: HostLayoutProps) {
  return <HostDashboardLayout metrics={metrics}>{children}</HostDashboardLayout>
}
