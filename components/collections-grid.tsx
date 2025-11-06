"use client"

import { CollectionCard } from "@/components/collection-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface Collection {
  id: string
  title: string
  description: string
  image: string
  listingsCount: number
  location?: string
  tags: string[]
  category: string
  featured?: boolean
}

export function CollectionsGrid() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchCollections() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/curated-collections")

        if (!response.ok) {
          throw new Error("Không thể tải bộ sưu tập")
        }

        const data: Collection[] = await response.json()

        if (isMounted) {
          setCollections(data)
          setError(null)
        }
      } catch (err) {
        console.error("Failed to load curated collections", err)
        if (isMounted) {
          setError("Không thể tải bộ sưu tập lúc này. Vui lòng thử lại sau.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchCollections()

    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>()

    collections.forEach((collection) => {
      const entry = map.get(collection.category)
      if (entry) {
        entry.count += 1
      } else {
        const labelMap: Record<string, string> = {
          healing: "Chữa lành",
          island: "Đảo biển",
          weekend: "Cuối tuần",
          heritage: "Heritage",
          culture: "Văn hoá",
          workation: "Workation",
          secret: "Secret Collection",
        }
        map.set(collection.category, {
          value: collection.category,
          label: labelMap[collection.category] ?? collection.category,
          count: 1,
        })
      }
    })

    const categoryOrder = ["healing", "island", "weekend", "culture", "heritage", "workation", "secret"]

    const sortedCategories = Array.from(map.values()).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.value)
      const bIndex = categoryOrder.indexOf(b.value)
      if (aIndex === -1 && bIndex === -1) return a.value.localeCompare(b.value)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    return [
      { value: "all", label: "Tất cả", count: collections.length },
      ...sortedCategories,
    ]
  }, [collections])

  const renderCollections = (items: Collection[]) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((collection) => (
        <CollectionCard key={collection.id} {...collection} />
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Curated Collections</span>
          </div>
          <h1 className="text-4xl font-bold">Bộ sưu tập được chọn lọc</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá những homestays được biên tập viên chúng tôi tuyển chọn kỹ càng cho từng chủ đề
          </p>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" />
            <span>Đang tải bộ sưu tập...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Curated Collections</span>
        </div>
        <h1 className="text-4xl font-bold">Bộ sưu tập được chọn lọc</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">{error}</p>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="space-y-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Curated Collections</span>
        </div>
        <h1 className="text-4xl font-bold">Bộ sưu tập đang được cập nhật</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Chúng tôi sẽ sớm đăng tải các bộ sưu tập tuyệt vời dành riêng cho bạn.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Curated Collections</span>
        </div>
        <h1 className="text-4xl font-bold">Bộ sưu tập được chọn lọc</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Khám phá những homestays được biên tập viên chúng tôi tuyển chọn kỹ càng cho từng chủ đề
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="gap-2">
              {category.label}
              <span className="text-xs opacity-60">({category.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-8">
          {renderCollections(collections)}
        </TabsContent>

        {categories
          .filter((category) => category.value !== "all")
          .map((category) => (
            <TabsContent key={category.value} value={category.value}>
              {renderCollections(collections.filter((collection) => collection.category === category.value))}
            </TabsContent>
          ))}
      </Tabs>
    </div>
  )
}
