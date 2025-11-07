import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const normalizedSlug = slug.trim().toLowerCase()
      if (!normalizedSlug) {
        return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
      }

      const plan = await prisma.membershipPlan.findUnique({
        where: { slug: normalizedSlug },
      })

      if (!plan) {
        return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
      }

      return NextResponse.json({ plan })
    }

    const plans = await prisma.membershipPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Membership plans error:', error)
    return NextResponse.json({ error: 'Failed to load membership plans' }, { status: 500 })
  }
}
