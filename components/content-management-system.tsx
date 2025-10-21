"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Image as ImageIcon,
  Plus,
  Save,
  Eye,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Edit2,
  Home,
  FileText,
  Layout,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface HeroBanner {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  isActive: boolean
  order: number
}

interface FeaturedCollection {
  id: string
  name: string
  description: string
  imageUrl: string
  listings: string[]
  isActive: boolean
  order: number
}

interface BlogPost {
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

export function ContentManagementSystem() {
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([
    {
      id: "1",
      title: "Khám phá Việt Nam theo cách riêng của bạn",
      subtitle: "Hơn 10,000+ homestay độc đáo đang chờ bạn",
      imageUrl: "/hero1.jpg",
      ctaText: "Khám phá ngay",
      ctaLink: "/search",
      isActive: true,
      order: 1,
    },
    {
      id: "2",
      title: "Ưu đãi mùa hè - Giảm đến 30%",
      subtitle: "Đặt ngay homestay yêu thích với giá tốt nhất",
      imageUrl: "/hero2.jpg",
      ctaText: "Xem ưu đãi",
      ctaLink: "/deals",
      isActive: true,
      order: 2,
    },
  ])

  const [collections, setCollections] = useState<FeaturedCollection[]>([
    {
      id: "1",
      name: "Biển xanh cát trắng",
      description: "Homestay view biển tuyệt đẹp",
      imageUrl: "/collection-beach.jpg",
      listings: ["L001", "L002", "L003"],
      isActive: true,
      order: 1,
    },
    {
      id: "2",
      name: "Núi rừng Đà Lạt",
      description: "Không gian yên tĩnh giữa núi rừng",
      imageUrl: "/collection-mountain.jpg",
      listings: ["L004", "L005"],
      isActive: true,
      order: 2,
    },
  ])

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([
    {
      id: "1",
      title: "10 homestay view biển đẹp nhất Việt Nam",
      excerpt: "Khám phá những homestay ven biển tuyệt vời cho kỳ nghỉ hè của bạn",
      content: "Nội dung bài viết đầy đủ...",
      coverImage: "/blog1.jpg",
      author: "Admin",
      publishedAt: "2024-01-15",
      isPublished: true,
      tags: ["Biển", "Du lịch", "Homestay"],
    },
  ])

  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [editingCollection, setEditingCollection] = useState<FeaturedCollection | null>(null)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Hero Banner Functions
  const handleSaveBanner = () => {
    if (!editingBanner) return

    if (editingBanner.id === "new") {
      setHeroBanners([
        ...heroBanners,
        { ...editingBanner, id: Date.now().toString(), order: heroBanners.length + 1 },
      ])
    } else {
      setHeroBanners(heroBanners.map((b) => (b.id === editingBanner.id ? editingBanner : b)))
    }

    setEditingBanner(null)
    toast.success("Đã lưu hero banner")
  }

  const handleDeleteBanner = (id: string) => {
    setHeroBanners(heroBanners.filter((b) => b.id !== id))
    toast.success("Đã xóa hero banner")
  }

  const moveBanner = (id: string, direction: "up" | "down") => {
    const index = heroBanners.findIndex((b) => b.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === heroBanners.length - 1)
    )
      return

    const newBanners = [...heroBanners]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]]

    // Update order
    newBanners.forEach((b, i) => {
      b.order = i + 1
    })

    setHeroBanners(newBanners)
    toast.success("Đã cập nhật thứ tự")
  }

  // Collection Functions
  const handleSaveCollection = () => {
    if (!editingCollection) return

    if (editingCollection.id === "new") {
      setCollections([
        ...collections,
        { ...editingCollection, id: Date.now().toString(), order: collections.length + 1 },
      ])
    } else {
      setCollections(
        collections.map((c) => (c.id === editingCollection.id ? editingCollection : c))
      )
    }

    setEditingCollection(null)
    toast.success("Đã lưu collection")
  }

  const handleDeleteCollection = (id: string) => {
    setCollections(collections.filter((c) => c.id !== id))
    toast.success("Đã xóa collection")
  }

  // Blog Post Functions
  const handleSavePost = () => {
    if (!editingPost) return

    if (editingPost.id === "new") {
      setBlogPosts([
        ...blogPosts,
        { ...editingPost, id: Date.now().toString(), publishedAt: new Date().toISOString() },
      ])
    } else {
      setBlogPosts(blogPosts.map((p) => (p.id === editingPost.id ? editingPost : p)))
    }

    setEditingPost(null)
    toast.success("Đã lưu bài viết")
  }

  const handleDeletePost = (id: string) => {
    setBlogPosts(blogPosts.filter((p) => p.id !== id))
    toast.success("Đã xóa bài viết")
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Management System</h1>
        <p className="text-muted-foreground">
          Quản lý nội dung homepage, collections, và blog posts
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
          <TabsTrigger value="hero">
            <Layout className="h-4 w-4 mr-2" />
            Hero Banner
          </TabsTrigger>
          <TabsTrigger value="collections">
            <Sparkles className="h-4 w-4 mr-2" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="featured">
            <Home className="h-4 w-4 mr-2" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="blog">
            <FileText className="h-4 w-4 mr-2" />
            Blog
          </TabsTrigger>
        </TabsList>

        {/* Hero Banner Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hero Banners</CardTitle>
                  <CardDescription>
                    Quản lý banner hiển thị trên trang chủ
                  </CardDescription>
                </div>
                <Button
                  onClick={() =>
                    setEditingBanner({
                      id: "new",
                      title: "",
                      subtitle: "",
                      imageUrl: "",
                      ctaText: "Khám phá",
                      ctaLink: "/search",
                      isActive: true,
                      order: heroBanners.length + 1,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {heroBanners.map((banner, index) => (
                  <Card key={banner.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{banner.title}</h3>
                            <Badge variant={banner.isActive ? "default" : "secondary"}>
                              {banner.isActive ? "Đang hiển thị" : "Ẩn"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{banner.subtitle}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>CTA: {banner.ctaText}</span>
                            <span>→</span>
                            <span>{banner.ctaLink}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveBanner(banner.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveBanner(banner.id, "down")}
                            disabled={index === heroBanners.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBanner(banner)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBanner(banner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hero Banner Editor */}
          {editingBanner && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingBanner.id === "new" ? "Thêm Hero Banner" : "Chỉnh sửa Hero Banner"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">Tiêu đề</Label>
                  <Input
                    id="banner-title"
                    value={editingBanner.title}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, title: e.target.value })
                    }
                    placeholder="VD: Khám phá Việt Nam..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle">Phụ đề</Label>
                  <Input
                    id="banner-subtitle"
                    value={editingBanner.subtitle}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                    }
                    placeholder="VD: Hơn 10,000+ homestay..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-image">URL Hình ảnh</Label>
                  <div className="flex gap-2">
                    <Input
                      id="banner-image"
                      value={editingBanner.imageUrl}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, imageUrl: e.target.value })
                      }
                      placeholder="/hero.jpg"
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-cta">Text CTA</Label>
                    <Input
                      id="banner-cta"
                      value={editingBanner.ctaText}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, ctaText: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner-link">Link CTA</Label>
                    <Input
                      id="banner-link"
                      value={editingBanner.ctaLink}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, ctaLink: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="banner-active"
                    checked={editingBanner.isActive}
                    onCheckedChange={(checked) =>
                      setEditingBanner({ ...editingBanner, isActive: checked })
                    }
                  />
                  <Label htmlFor="banner-active">Hiển thị banner</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveBanner}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                  <Button variant="outline" onClick={() => setEditingBanner(null)}>
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Featured Collections</CardTitle>
                  <CardDescription>
                    Quản lý bộ sưu tập homestay nổi bật
                  </CardDescription>
                </div>
                <Button
                  onClick={() =>
                    setEditingCollection({
                      id: "new",
                      name: "",
                      description: "",
                      imageUrl: "",
                      listings: [],
                      isActive: true,
                      order: collections.length + 1,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Collection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collections.map((collection) => (
                  <Card key={collection.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{collection.name}</h3>
                        <Badge variant={collection.isActive ? "default" : "secondary"}>
                          {collection.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {collection.description}
                      </p>
                      <div className="text-xs text-muted-foreground mb-3">
                        {collection.listings.length} listings
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCollection(collection)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCollection(collection.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collection Editor */}
          {editingCollection && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCollection.id === "new" ? "Thêm Collection" : "Chỉnh sửa Collection"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên Collection</Label>
                  <Input
                    value={editingCollection.name}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={editingCollection.description}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Hình ảnh</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingCollection.imageUrl}
                      onChange={(e) =>
                        setEditingCollection({ ...editingCollection, imageUrl: e.target.value })
                      }
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingCollection.isActive}
                    onCheckedChange={(checked) =>
                      setEditingCollection({ ...editingCollection, isActive: checked })
                    }
                  />
                  <Label>Hiển thị collection</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCollection}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                  <Button variant="outline" onClick={() => setEditingCollection(null)}>
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Featured Listings Tab */}
        <TabsContent value="featured" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Listings</CardTitle>
              <CardDescription>
                Chọn các homestay nổi bật hiển thị trên trang chủ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tính năng đang được phát triển...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Tab */}
        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Quản lý bài viết blog</CardDescription>
                </div>
                <Button
                  onClick={() =>
                    setEditingPost({
                      id: "new",
                      title: "",
                      excerpt: "",
                      content: "",
                      coverImage: "",
                      author: "Admin",
                      publishedAt: new Date().toISOString(),
                      isPublished: false,
                      tags: [],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Viết bài mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{post.title}</h3>
                            <Badge variant={post.isPublished ? "default" : "secondary"}>
                              {post.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {post.author} • {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blog Post Editor */}
          {editingPost && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPost.id === "new" ? "Viết bài mới" : "Chỉnh sửa bài viết"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    placeholder="Tiêu đề bài viết..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Textarea
                    value={editingPost.excerpt}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    placeholder="Mô tả ngắn về bài viết..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    placeholder="Nội dung bài viết..."
                    className="min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ảnh bìa</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingPost.coverImage}
                      onChange={(e) =>
                        setEditingPost({ ...editingPost, coverImage: e.target.value })
                      }
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags (phân cách bởi dấu phẩy)</Label>
                  <Input
                    value={editingPost.tags.join(", ")}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        tags: e.target.value.split(",").map((t) => t.trim()),
                      })
                    }
                    placeholder="Du lịch, Homestay, Biển"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPost.isPublished}
                    onCheckedChange={(checked) =>
                      setEditingPost({ ...editingPost, isPublished: checked })
                    }
                  />
                  <Label>Publish bài viết</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePost}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                  <Button variant="outline" onClick={() => setEditingPost(null)}>
                    Hủy
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
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
