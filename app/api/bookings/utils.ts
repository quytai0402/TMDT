import type { Prisma } from "@prisma/client"

export const cloneMetadata = (metadata: unknown): Prisma.JsonObject => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return { ...(metadata as Record<string, Prisma.JsonValue>) }
  }

  return {}
}

export const normalizePhone = (value: string) => value.replace(/\D/g, "")

export const formatBookingResponse = (booking: any, userId: string) => {
  const guestContact = {
    name: booking.contactName || booking.guest?.name || "Khách vãng lai",
    email: booking.contactEmail || booking.guest?.email || null,
    phone: booking.contactPhone || booking.guest?.phone || null,
    guestType: booking.guestType,
  }

  const hasReview = Boolean(booking.review)
  const canReview =
    booking.status === "COMPLETED" &&
    userId === booking.guestId &&
    !hasReview

  const additionalServices = Array.isArray(booking.additionalServices)
    ? booking.additionalServices
    : []

  return {
    ...booking,
    additionalServices,
    guestContact,
    canReview,
    hasReview,
    reviewUrl: canReview ? `/trips/${booking.id}/review` : null,
  }
}
