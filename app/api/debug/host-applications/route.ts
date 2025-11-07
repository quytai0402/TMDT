import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const applications = await prisma.hostApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        }
      }
    })

    const userIds = applications.map(app => app.userId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    return NextResponse.json({
      totalApplications: applications.length,
      totalUsers: users.length,
      applications: applications.map(app => ({
        id: app.id,
        userId: app.userId,
        locationName: app.locationName,
        status: app.status,
        hasUser: !!app.user,
        userEmail: app.user?.email || 'NO USER',
        userName: app.user?.name || 'NO NAME',
      })),
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
