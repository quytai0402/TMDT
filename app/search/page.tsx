import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchResultsView } from "@/components/search-results-view"

// Enable page-level caching
export const revalidate = 60 // 60 seconds

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <SearchResultsView initialParams={params} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
