import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingCheckout } from "@/components/booking-checkout"
import { notFound } from "next/navigation"

async function getListing(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/listings/${id}`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data?.listing ?? null
  } catch (error) {
    console.error("Error fetching listing:", error)
    return null
  }
}

interface BookingPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  const query = await searchParams
  const extractParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value

  const initialCheckIn = extractParam(query?.checkIn)
  const initialCheckOut = extractParam(query?.checkOut)
  const initialGuestsParam = extractParam(query?.guests)
  const initialGuests = initialGuestsParam ? Math.max(1, Number(initialGuestsParam) || 1) : undefined

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              Xác nhận và thanh toán
            </h1>
            <p className="text-muted-foreground">Hoàn tất đặt phòng của bạn</p>
          </div>

          <BookingCheckout
            listing={listing}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
            initialGuests={initialGuests}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
