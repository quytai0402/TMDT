import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fix /admin/host-applications to /admin/hosts/applications
    const result1 = await prisma.notification.updateMany({
      where: {
        OR: [
          { link: '/admin/host-applications' },
          { link: { startsWith: '/admin/host-applications?' } }
        ]
      },
      data: {
        link: '/admin/hosts/applications'
      }
    })

    return NextResponse.json({
      success: true,
      fixed: result1.count,
      message: `Đã sửa ${result1.count} thông báo`
    })
  } catch (error) {
    console.error('Fix notifications error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
