import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSettingsSchema = z.object({
  // Notifications
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  bookingNotifications: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  reviewNotifications: z.boolean().optional(),
  promotionNotifications: z.boolean().optional(),
  
  // Privacy
  profileVisibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  
  // Language & Display
  language: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  
  // Host Settings
  autoAcceptBookings: z.boolean().optional(),
  instantBookingEnabled: z.boolean().optional(),
  minimumStay: z.number().min(1).optional(),
  maximumStay: z.number().min(1).optional(),
  advanceBookingTime: z.number().min(0).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  
  // Guest Settings
  autoReview: z.boolean().optional(),
  savePaymentMethods: z.boolean().optional(),
})

// GET - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    // If settings don't exist, create default
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PATCH - Update user settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = updateSettingsSchema.parse(body)

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...validated,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        ...validated,
      },
    })

    return NextResponse.json({
      settings,
      message: "Settings updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    )
  }
}
