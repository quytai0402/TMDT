"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { MessageCircle, Zap, Edit2, Trash2, Plus, Copy, Clock, TrendingUp, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SavedReply = {
  id: string
  title: string
  shortcut: string
  content: string
  tags: string[]
  useCount: number
  lastUsed?: string | null
  createdAt: string
}

const emptyForm = {
  title: "",
  shortcut: "",
  content: "",
  tags: "",
}

function formatDate(value?: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("vi-VN")
}

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function SavedReplies() {
  const [replies, setReplies] = useState<SavedReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editingReply, setEditingReply] = useState<SavedReply | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadReplies = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/host/automation/saved-replies", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Không thể tải danh sách trả lời")
      }
      const data = (await response.json()) as { replies?: SavedReply[] }
      setReplies(Array.isArray(data.replies) ? data.replies : [])
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
      setReplies([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReplies()
  }, [loadReplies])

  const filteredReplies = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim()
    if (!keyword) return replies
    return replies.filter(
      (reply) =>
        reply.title.toLowerCase().includes(keyword) ||
        reply.content.toLowerCase().includes(keyword) ||
        reply.shortcut.toLowerCase().includes(keyword) ||
        reply.tags.some((tag) => tag.toLowerCase().includes(keyword)),
    )
  }, [replies, searchQuery])

  const totalUseCount = useMemo(() => replies.reduce((sum, reply) => sum + (reply.useCount ?? 0), 0), [replies])
  const avgUseCount = replies.length ? Math.round(totalUseCount / replies.length) : 0
  const mostUsed = useMemo(() => {
    if (!replies.length) return null
    return replies.reduce((acc, reply) => ((reply.useCount ?? 0) > (acc.useCount ?? 0) ? reply : acc), replies[0])
  }, [replies])

  const handleCreate = useCallback(async () => {
    if (!createForm.title.trim() || !createForm.shortcut.trim() || !createForm.content.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch("/api/host/automation/saved-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title.trim(),
          shortcut: createForm.shortcut.trim(),
          content: createForm.content.trim(),
          tags: parseTags(createForm.tags),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Không thể tạo trả lời mới")
      }

      const data = await response.json()
      if (data?.reply) {
        setReplies((prev) => [data.reply, ...prev])
        toast.success("Đã tạo trả lời mới")
        setCreateForm(emptyForm)
        setIsCreateOpen(false)
      } else {
        await loadReplies()
      }
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [createForm, loadReplies])

  const openEditDialog = (reply: SavedReply) => {
    setEditingReply(reply)
    setEditForm({
      title: reply.title,
      shortcut: reply.shortcut,
      content: reply.content,
      tags: reply.tags.join(", "),
    })
    setIsEditOpen(true)
  }

  const handleUpdate = useCallback(async () => {
    if (!editingReply) return
    if (!editForm.title.trim() || !editForm.shortcut.trim() || !editForm.content.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/host/automation/saved-replies/${editingReply.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          shortcut: editForm.shortcut.trim(),
          content: editForm.content.trim(),
          tags: parseTags(editForm.tags),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Không thể cập nhật trả lời")
      }

      const data = await response.json()
      if (data?.reply) {
        setReplies((prev) => prev.map((reply) => (reply.id === data.reply.id ? data.reply : reply)))
      } else {
        await loadReplies()
      }

      toast.success("Đã cập nhật trả lời")
      setIsEditOpen(false)
      setEditingReply(null)
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [editForm, editingReply, loadReplies])

  const handleDuplicate = useCallback(
    async (replyId: string) => {
      try {
        setActionLoading(true)
        const response = await fetch("/api/host/automation/saved-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceReplyId: replyId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Không thể nhân bản trả lời")
        }

        const data = await response.json()
        if (data?.reply) {
          setReplies((prev) => [data.reply, ...prev])
        } else {
          await loadReplies()
        }

        toast.success("Đã nhân bản trả lời")
      } catch (err) {
        console.error(err)
        toast.error((err as Error).message)
      } finally {
        setActionLoading(false)
      }
    },
    [loadReplies],
  )

  const handleDelete = useCallback(async (replyId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa câu trả lời này?")
    if (!confirmed) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/host/automation/saved-replies/${replyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Không thể xóa trả lời")
      }

      setReplies((prev) => prev.filter((reply) => reply.id !== replyId))
      toast.success("Đã xóa trả lời")
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [])

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Đã sao chép nội dung")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trả lời nhanh</h2>
          <p className="text-muted-foreground">Thiết lập câu trả lời có sẵn với phím tắt</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm trả lời mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo trả lời nhanh mới</DialogTitle>
              <DialogDescription>Thiết lập câu trả lời được lưu với phím tắt</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    placeholder="VD: Xác nhận đặt phòng"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phím tắt</Label>
                  <Input
                    placeholder="VD: /confirm"
                    value={createForm.shortcut}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, shortcut: event.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Gõ phím tắt để sử dụng nhanh</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  rows={6}
                  placeholder="Nội dung trả lời (sử dụng {{variable}} cho biến)"
                  value={createForm.content}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  placeholder="VD: xác nhận, đặt phòng, thanh toán"
                  value={createForm.tags}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo trả lời"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng trả lời</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replies.length}</div>
            <p className="text-xs text-muted-foreground">Câu trả lời được lưu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUseCount}</div>
            <p className="text-xs text-muted-foreground">Tổng lần sử dụng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUseCount}</div>
            <p className="text-xs text-muted-foreground">Lần/trả lời</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phổ biến nhất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">{mostUsed?.title ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{mostUsed ? `${mostUsed.useCount} lần` : "Chưa có dữ liệu"}</p>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Tìm kiếm theo tiêu đề, nội dung, tags hoặc phím tắt..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Không thể tải dữ liệu</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadReplies}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReplies.map((reply) => (
            <Card key={reply.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{reply.title}</CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {reply.shortcut}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-3 text-sm">{reply.content}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {reply.tags.map((tag) => (
                      <Badge key={`${reply.id}-${tag}`} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {!reply.tags.length && <span className="text-xs text-muted-foreground">Chưa có tag</span>}
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {reply.useCount} lần
                      </span>
                      {reply.lastUsed && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(reply.lastUsed)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyContent(reply.content)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(reply)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicate(reply.id)} disabled={actionLoading}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(reply.id)} disabled={actionLoading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !filteredReplies.length && !error && (
        <Card className="p-12">
          <div className="space-y-4 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Không tìm thấy trả lời</h3>
              <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc tạo trả lời mới</p>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trả lời</DialogTitle>
            <DialogDescription>Cập nhật nội dung và phím tắt cho trả lời này</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={editForm.title}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phím tắt</Label>
                <Input
                  value={editForm.shortcut}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, shortcut: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                rows={6}
                value={editForm.content}
                onChange={(event) => setEditForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={editForm.tags}
                onChange={(event) => setEditForm((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
