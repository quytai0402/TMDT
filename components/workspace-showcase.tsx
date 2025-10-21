"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Laptop, Monitor, Coffee, Lightbulb, Armchair, CheckCircle2, Eye } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WorkspaceItem {
  id: string
  name: string
  image: string
  features: string[]
}

interface WorkspaceShowcaseProps {
  listingId: string
}

export function WorkspaceShowcase({ listingId }: WorkspaceShowcaseProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceItem | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/listings/${listingId}/workspaces`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces')
        }

        const data = await response.json()
        setWorkspaces(data.workspaces || [])
      } catch (error) {
        console.error('Error fetching workspaces:', error)
        setWorkspaces([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [listingId])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-muted-foreground">Đang tải không gian làm việc...</div>
      </Card>
    )
  }

  if (workspaces.length === 0) {
    return null
  }

  return (
    <>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Laptop className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Không gian làm việc</h3>
              <p className="text-sm text-muted-foreground">
                {workspaces.length} khu vực làm việc chuyên dụng
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200">
            Workation Ready
          </Badge>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Monitor className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Màn hình</p>
              <p className="font-medium text-sm">27" 4K</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Armchair className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Ghế ngồi</p>
              <p className="font-medium text-sm">Ergonomic</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Ánh sáng</p>
              <p className="font-medium text-sm">Tự nhiên</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Coffee className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Coffee</p>
              <p className="font-medium text-sm">Miễn phí</p>
            </div>
          </div>
        </div>

        {/* Workspace Gallery */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Khu vực làm việc</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaces.map((workspace: WorkspaceItem) => (
              <div
                key={workspace.id}
                className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setSelectedWorkspace(workspace)}
              >
                {/* Image */}
                <div className="relative h-48 bg-muted">
                  <Image
                    src={workspace.image}
                    alt={workspace.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3">
                      <Button size="sm" variant="secondary" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h5 className="font-semibold mb-2">{workspace.name}</h5>
                  <div className="space-y-1">
                    {workspace.features.slice(0, 2).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {workspace.features.length > 2 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{workspace.features.length - 2} tính năng khác
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Amenities */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <h4 className="font-medium mb-3 text-sm">Tiện ích bổ sung cho Workation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Máy in & máy scan</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Phòng họp riêng (miễn phí 2h/ngày)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Whiteboard & flipchart</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Cà phê & trà không giới hạn</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedWorkspace} onOpenChange={() => setSelectedWorkspace(null)}>
        <DialogContent className="max-w-2xl">
          {selectedWorkspace && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedWorkspace.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image */}
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedWorkspace.image}
                    alt={selectedWorkspace.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-3">Tính năng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedWorkspace.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
