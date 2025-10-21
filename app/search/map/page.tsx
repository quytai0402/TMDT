import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MapSearchView } from '@/components/map-search-view'

export default function MapSearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <MapSearchView />
      </main>
    </div>
  )
}
