import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CollectionsGrid } from "@/components/collections-grid"

export default function CollectionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <CollectionsGrid />
        </div>
      </main>
      <Footer />
    </div>
  )
}
