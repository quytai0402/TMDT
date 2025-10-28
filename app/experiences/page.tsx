import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExperiencesGrid } from "@/components/experiences-grid"
import { getExperienceSummaries } from "@/lib/experiences"

export const revalidate = 1800

export default async function ExperiencesPage() {
  const experiences = await getExperienceSummaries({ membersOnly: false })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <ExperiencesGrid initialExperiences={experiences} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
