import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ConnectionStatus } from "@/components/connection-status"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "LuxeStay - Premium Homestay Booking",
  description: "Discover and book unique homestays around the world",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <ConnectionStatus />
          {children}
        </Providers>
      </body>
    </html>
  )
}
