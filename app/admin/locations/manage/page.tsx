"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MapPin, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin-layout"

interface Location {
  id: string
  city: string
  state: string
  country: string
  latitude?: number
  longitude?: number
  isActive: boolean
  description?: string
  imageUrl?: string
  createdAt: string
}

export default function AdminLocationManagementPage() {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    country: "Vietnam",
    latitude: "",
    longitude: "",
    description: "",
    imageUrl: "",
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations")
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khu vực",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.city || !formData.state) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thành phố và tỉnh/bang",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        ...(editingLocation && { id: editingLocation.id }),
      }

      const response = await fetch("/api/admin/locations", {
        method: editingLocation ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể lưu khu vực")
      }

      toast({
        title: "Thành công",
        description: editingLocation
          ? "Đã cập nhật khu vực"
          : "Đã thêm khu vực mới. Host có thể chọn khu vực này ngay bây giờ!",
      })

      setShowDialog(false)
      resetForm()
      fetchLocations()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/admin/locations?id=${deleteId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể xóa khu vực")
      }

      toast({
        title: "Đã xóa",
        description: "Khu vực đã được xóa thành công",
      })

      setDeleteId(null)
      fetchLocations()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (location: Location) => {
    try {
      const response = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: location.id,
          isActive: !location.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái")
      }

      toast({
        title: "Đã cập nhật",
        description: location.isActive
          ? "Đã ẩn khu vực khỏi danh sách. Host sẽ không thấy khu vực này nữa."
          : "Đã kích hoạt khu vực. Host có thể chọn khu vực này ngay!",
      })

      fetchLocations()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      city: location.city,
      state: location.state,
      country: location.country,
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
      description: location.description || "",
      imageUrl: location.imageUrl || "",
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setEditingLocation(null)
    setFormData({
      city: "",
      state: "",
      country: "Vietnam",
      latitude: "",
      longitude: "",
      description: "",
      imageUrl: "",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Khu Vực</h1>
            <p className="text-muted-foreground mt-1">
              Thêm và quản lý các khu vực có sẵn cho hosts đăng listing
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowDialog(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm Khu Vực Mới
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold mb-2">📍 Về quản lý khu vực:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Host chỉ có thể chọn từ các khu vực được admin thêm vào hệ thống</li>
            <li>• Khi thêm khu vực mới, host có thể chọn và đăng tin ngay lập tức</li>
            <li>• Có thể ẩn khu vực tạm thời thay vì xóa hoàn toàn</li>
            <li>• Không thể xóa khu vực đang có listings hoạt động</li>
          </ul>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành phố</TableHead>
                <TableHead>Tỉnh/Bang</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Tọa độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có khu vực nào. Nhấn "Thêm Khu Vực Mới" để bắt đầu.
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.city}</TableCell>
                    <TableCell>{location.state}</TableCell>
                    <TableCell>{location.country}</TableCell>
                    <TableCell>
                      {location.latitude && location.longitude ? (
                        <div className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.isActive ? "default" : "secondary"}>
                        {location.isActive ? "✅ Hoạt động" : "🔒 Ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(location.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(location)}
                          className="h-8 w-8 p-0"
                          title={location.isActive ? "Ẩn khu vực" : "Kích hoạt khu vực"}
                        >
                          {location.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(location)}
                          className="h-8 w-8 p-0"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(location.id)}
                          className="h-8 w-8 p-0 text-destructive"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Chỉnh Sửa Khu Vực" : "Thêm Khu Vực Mới"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Cập nhật thông tin khu vực"
                : "Thêm khu vực mới để hosts có thể đăng listing"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Thành phố *</Label>
                <Input
                  id="city"
                  placeholder="Hà Nội"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Tỉnh/Bang *</Label>
                <Input
                  id="state"
                  placeholder="Hà Nội"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Quốc gia</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Vĩ độ (Latitude)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="21.028511"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Kinh độ (Longitude)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="105.804817"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả (optional)</Label>
              <Textarea
                id="description"
                placeholder="Thủ đô của Việt Nam, nổi tiếng với..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL Hình ảnh (optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lưu ý:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Thành phố và Tỉnh/Bang là bắt buộc</li>
                <li>Tọa độ giúp hiển thị chính xác trên bản đồ và tìm kiếm nearby places</li>
                <li>Sau khi thêm, hosts có thể chọn khu vực này khi đăng listing NGAY LẬP TỨC</li>
                <li>Có thể ẩn khu vực tạm thời thay vì xóa</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                resetForm()
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingLocation ? "Cập Nhật" : "Thêm Khu Vực"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa khu vực này? Hành động này không thể hoàn tác.
              <br />
              <br />
              <strong>Lưu ý:</strong> Không thể xóa khu vực đang có listings hoạt động.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
