"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  Home,
  Layout,
  FileText,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react"

type HeroBanner = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  isActive: boolean
  order: number
}

type FeaturedCollection = {
  id: string
  name: string
  description: string
  imageUrl: string
  listingIds: string[]
  isActive: boolean
  order: number
}

type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  publishedAt: string
  isPublished: boolean
  tags: string[]
}

type CmsResponse = {
  heroBanners: HeroBanner[]
  featuredCollections: FeaturedCollection[]
  blogPosts: BlogPost[]
}

export function ContentManagementSystem() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([])
  const [collections, setCollections] = useState<FeaturedCollection[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [editingCollection, setEditingCollection] = useState<FeaturedCollection | null>(null)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    const loadCms = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/cms")
        if (!res.ok) throw new Error("Failed to load CMS")
        const data: CmsResponse = await res.json()
        setHeroBanners(data.heroBanners || [])
        setCollections(data.featuredCollections || [])
        setBlogPosts(data.blogPosts || [])
      } catch (error) {
        console.error("CMS load error:", error)
        toast.error("Không thể tải dữ liệu CMS")
      } finally {
        setLoading(false)
      }
    }
    loadCms()
  }, [])

  const saveCms = async (payload: Partial<CmsResponse>) => {
    try {
      setSaving(true)
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      const data: CmsResponse = await res.json()
      setHeroBanners(data.heroBanners)
      setCollections(data.featuredCollections)
      setBlogPosts(data.blogPosts)
      toast.success("Đã lưu nội dung CMS")
    } catch (error) {
      console.error("CMS save error:", error)
      toast.error("Không thể lưu nội dung CMS")
    } finally {
      setSaving(false)
    }
  }

  const activeCollections = useMemo(() => collections.filter((item) => item.isActive), [collections])

  const moveItem = <T extends { order: number }>(items: T[], id: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => (item as any).id === id)
    if (index < 0) return items
    if (direction === "up" && index === 0) return items
    if (direction === "down" && index === items.length - 1) return items

    const targetIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...items]
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    updated.forEach((item, idx) => {
      item.order = idx + 1
    })
    return updated
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Đang tải dữ liệu CMS...</CardTitle>
            <CardDescription>Vui lòng chờ trong giây lát.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Hệ thống đang tải nội dung hiện có.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trung tâm nội dung</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý hero banner, bộ sưu tập nổi bật và bài viết blog trên trang chủ
          </p>
        </div>
        <Button onClick={() => saveCms({ heroBanners, featuredCollections: collections, blogPosts })} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Lưu toàn bộ
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Hero Banner
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Bộ sưu tập
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hero banner</CardTitle>
                <CardDescription>Hiển thị ở đỉnh trang chủ, giúp thu hút khách.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setEditingBanner({
                    id: "new",
                    title: "",
                    subtitle: "",
                    imageUrl: "",
                    ctaText: "",
                    ctaLink: "",
                    isActive: true,
                    order: heroBanners.length + 1,
                  })
                }
              >
                Thêm banner
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroBanners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{banner.title || "Chưa đặt tiêu đề"}</h3>
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Đang hiển thị" : "Đang ẩn"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setHeroBanners(moveItem(heroBanners, banner.id, "up"))}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setHeroBanners(moveItem(heroBanners, banner.id, "down"))}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingBanner(banner)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const filtered = heroBanners.filter((item) => item.id !== banner.id)
                          setHeroBanners(filtered)
                          await saveCms({ heroBanners: filtered })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" /> {banner.ctaText || "Chưa đặt CTA"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" /> {banner.ctaLink || "/"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {editingBanner && (
            <Card>
              <CardHeader>
                <CardTitle>{editingBanner.id === "new" ? "Thêm banner" : "Chỉnh sửa banner"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tiêu đề</Label>
                    <Input
                      value={editingBanner.title}
                      onChange={(event) =>
                        setEditingBanner((prev) => prev && { ...prev, title: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phụ đề</Label>
                    <Input
                      value={editingBanner.subtitle}
                      onChange={(event) =>
                        setEditingBanner((prev) => prev && { ...prev, subtitle: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA text</Label>
                    <Input
                      value={editingBanner.ctaText}
                      onChange={(event) =>
                        setEditingBanner((prev) => prev && { ...prev, ctaText: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA link</Label>
                    <Input
                      value={editingBanner.ctaLink}
                      onChange={(event) =>
                        setEditingBanner((prev) => prev && { ...prev, ctaLink: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ảnh banner</Label>
                  <Input
                    value={editingBanner.imageUrl}
                    onChange={(event) =>
                      setEditingBanner((prev) => prev && { ...prev, imageUrl: event.target.value })
                    }
                    placeholder="/images/home/hero.jpg"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Hiển thị</Label>
                    <p className="text-xs text-muted-foreground">
                      Tắt nếu muốn ẩn banner tạm thời khỏi trang chủ.
                    </p>
                  </div>
                  <Switch
                    checked={editingBanner.isActive}
                    onCheckedChange={(checked) =>
                      setEditingBanner((prev) => prev && { ...prev, isActive: checked })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingBanner(null)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editingBanner.title || !editingBanner.imageUrl) {
                        toast.error("Vui lòng nhập đầy đủ tiêu đề và hình ảnh")
                        return
                      }
                      const updated =
                        editingBanner.id === "new"
                          ? [...heroBanners, { ...editingBanner, id: `banner-${Date.now()}` }]
                          : heroBanners.map((item) =>
                              item.id === editingBanner.id ? editingBanner : item,
                            )
                      setHeroBanners(updated)
                      setEditingBanner(null)
                      await saveCms({ heroBanners: updated })
                    }}
                  >
                    Lưu banner
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bộ sưu tập nổi bật</CardTitle>
                <CardDescription>
                  Tối đa 6 bộ sưu tập sẽ hiển thị trong mục "Collections".
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setEditingCollection({
                    id: "new",
                    name: "",
                    description: "",
                    imageUrl: "",
                    listingIds: [],
                    isActive: true,
                    order: collections.length + 1,
                  })
                }
              >
                Thêm bộ sưu tập
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {collections.map((collection) => (
                <div key={collection.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{collection.name || "Chưa đặt tên"}</h3>
                      <p className="text-sm text-muted-foreground">{collection.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={collection.isActive ? "default" : "secondary"}>
                        {collection.isActive ? "Đang hiển thị" : "Đang ẩn"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollections(moveItem(collections, collection.id, "up"))}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollections(moveItem(collections, collection.id, "down"))}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingCollection(collection)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const filtered = collections.filter((item) => item.id !== collection.id)
                          setCollections(filtered)
                          await saveCms({ featuredCollections: filtered })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                    <span>
                      Hiển thị: {collection.isActive ? "Có" : "Không"} • Thứ tự {collection.order}
                    </span>
                    <span>
                      Liên kết:{" "}
                      {collection.listingIds.length > 0
                        ? `${collection.listingIds.length} listings`
                        : "Chưa liên kết"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Số bộ sưu tập đang hiển thị</CardTitle>
                  <CardDescription>Giới hạn đề xuất: tối đa 6 bộ sưu tập nổi bật.</CardDescription>
                </div>
                <Badge variant={activeCollections.length > 6 ? "destructive" : "default"}>
                  {activeCollections.length} đang hiển thị
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {editingCollection && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCollection.id === "new" ? "Thêm bộ sưu tập" : "Chỉnh sửa bộ sưu tập"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tên bộ sưu tập</Label>
                    <Input
                      value={editingCollection.name}
                      onChange={(event) =>
                        setEditingCollection((prev) => prev && { ...prev, name: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ảnh đại diện</Label>
                    <Input
                      value={editingCollection.imageUrl}
                      onChange={(event) =>
                        setEditingCollection((prev) => prev && { ...prev, imageUrl: event.target.value })
                      }
                      placeholder="/images/collections/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={editingCollection.description}
                    onChange={(event) =>
                      setEditingCollection((prev) => prev && { ...prev, description: event.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Danh sách listing ID (phân cách bởi dấu phẩy)</Label>
                  <Input
                    value={editingCollection.listingIds.join(",")}
                    onChange={(event) =>
                      setEditingCollection((prev) => prev && {
                        ...prev,
                        listingIds: event.target.value
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="ID listing 1, ID listing 2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị</Label>
                    <p className="text-xs text-muted-foreground">
                      Tắt để ẩn bộ sưu tập khỏi trang chủ.
                    </p>
                  </div>
                  <Switch
                    checked={editingCollection.isActive}
                    onCheckedChange={(checked) =>
                      setEditingCollection((prev) => prev && { ...prev, isActive: checked })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingCollection(null)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editingCollection.name) {
                        toast.error("Vui lòng nhập tên bộ sưu tập")
                        return
                      }
                      const updated =
                        editingCollection.id === "new"
                          ? [...collections, { ...editingCollection, id: `collection-${Date.now()}` }]
                          : collections.map((item) =>
                              item.id === editingCollection.id ? editingCollection : item,
                            )
                      setCollections(updated)
                      setEditingCollection(null)
                      await saveCms({ featuredCollections: updated })
                    }}
                  >
                    Lưu bộ sưu tập
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bài viết blog</CardTitle>
                <CardDescription>
                  Các bài viết hỗ trợ SEO và cập nhật nội dung cho trang chủ.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setEditingPost({
                    id: "new",
                    title: "",
                    excerpt: "",
                    content: "",
                    coverImage: "",
                    author: "LuxeStay Team",
                    publishedAt: new Date().toISOString(),
                    isPublished: false,
                    tags: [],
                  })
                }
              >
                Thêm bài viết
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {blogPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{post.title || "Chưa có tiêu đề"}</h3>
                      <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.isPublished ? "default" : "secondary"}>
                        {post.isPublished ? "Đã xuất bản" : "Bản nháp"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const filtered = blogPosts.filter((item) => item.id !== post.id)
                          setBlogPosts(filtered)
                          await saveCms({ blogPosts: filtered })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Tác giả: {post.author}</span>
                    <span>Ngày xuất bản: {new Date(post.publishedAt).toLocaleDateString("vi-VN")}</span>
                    <span>Tags: {post.tags.join(", ") || "Chưa có"}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {editingPost && (
            <Card>
              <CardHeader>
                <CardTitle>{editingPost.id === "new" ? "Thêm bài viết" : "Chỉnh sửa bài viết"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={editingPost.title}
                    onChange={(event) =>
                      setEditingPost((prev) => prev && { ...prev, title: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Textarea
                    value={editingPost.excerpt}
                    onChange={(event) =>
                      setEditingPost((prev) => prev && { ...prev, excerpt: event.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    value={editingPost.content}
                    onChange={(event) =>
                      setEditingPost((prev) => prev && { ...prev, content: event.target.value })
                    }
                    rows={6}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ảnh bìa</Label>
                    <Input
                      value={editingPost.coverImage}
                      onChange={(event) =>
                        setEditingPost((prev) => prev && { ...prev, coverImage: event.target.value })
                      }
                      placeholder="/images/blog/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (ngăn cách bởi dấu phẩy)</Label>
                    <Input
                      value={editingPost.tags.join(",")}
                      onChange={(event) =>
                        setEditingPost((prev) => prev && {
                          ...prev,
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trạng thái</Label>
                    <p className="text-xs text-muted-foreground">
                      Bật để hiển thị bài viết trên trang blog.
                    </p>
                  </div>
                  <Switch
                    checked={editingPost.isPublished}
                    onCheckedChange={(checked) =>
                      setEditingPost((prev) => prev && { ...prev, isPublished: checked })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingPost(null)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editingPost.title || !editingPost.coverImage) {
                        toast.error("Vui lòng nhập đầy đủ tiêu đề và ảnh bìa")
                        return
                      }
                      const updated =
                        editingPost.id === "new"
                          ? [...blogPosts, { ...editingPost, id: `blog-${Date.now()}` }]
                          : blogPosts.map((item) =>
                              item.id === editingPost.id ? editingPost : item,
                            )
                      setBlogPosts(updated)
                      setEditingPost(null)
                      await saveCms({ blogPosts: updated })
                    }}
                  >
                    Lưu bài viết
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
