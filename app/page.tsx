import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { TrustBadges } from "@/components/trust-badges"
import { RoleBasedWelcome } from "@/components/role-based-welcome"
import { FlexibleDatesSearch } from "@/components/flexible-dates-search"
import { CategoryFilter } from "@/components/category-filter"
import { FeaturedDestinations } from "@/components/featured-destinations"
import { FlexibleSearchGrid } from "@/components/flexible-search-grid"
import { CuratedCollections } from "@/components/curated-collections"
import { PersonalizedDiscovery } from "@/components/personalized-discovery"
import { ListingsGrid } from "@/components/listings-grid"
import { InteractiveMapPreview } from "@/components/interactive-map-preview"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FeaturesSection } from "@/components/features-section"
import { PersonaShowcase } from "@/components/persona-showcase"
import { Footer } from "@/components/footer"

// Enable Next.js page-level caching with revalidation
export const revalidate = 60 // Revalidate every 60 seconds

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-white to-slate-100">
      <Header />
      <main className="flex-1 space-y-0">
        <HeroSection />
        <TrustBadges />
        <RoleBasedWelcome />
        <FlexibleDatesSearch />
        <CategoryFilter />
        
        {/* Core content - loads immediately */}
        <ListingsGrid />
        
        {/* Secondary content */}
        <FeaturedDestinations />
        <FlexibleSearchGrid />
        <CuratedCollections />
        <PersonalizedDiscovery />
        <PersonaShowcase compact />
        <InteractiveMapPreview />
        <TestimonialsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}
