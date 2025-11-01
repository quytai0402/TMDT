import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { buildConciergeContext } from '@/lib/concierge/context'

const querySchema = z.object({
  listingId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  bookingId: z.string().trim().optional(),
  includeLatestBooking: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      listingId: searchParams.get('listingId') ?? searchParams.get('id') ?? undefined,
      slug: searchParams.get('slug') ?? undefined,
      bookingId: searchParams.get('bookingId') ?? undefined,
      includeLatestBooking: searchParams.get('includeLatestBooking') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Tham số không hợp lệ' }, { status: 400 })
    }

    const { listingId, slug, bookingId, includeLatestBooking } = parsed.data

    const listingIdentifier = listingId ?? slug
    const session = await getServerSession(authOptions)

    if (!listingIdentifier && !bookingId && !includeLatestBooking) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bối cảnh. Cung cấp listingId, slug hoặc bookingId.' },
        { status: 400 },
      )
    }

    const payload = await buildConciergeContext({
      listingIdentifier: listingIdentifier ?? undefined,
      bookingId: bookingId ?? undefined,
      userId: session?.user?.id,
      includeLatestBooking: includeLatestBooking ?? Boolean(session?.user?.id),
    })

    if (listingIdentifier && !payload.listingContext) {
      return NextResponse.json({ error: 'Không tìm thấy chỗ ở phù hợp' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Failed to build concierge context:', error)
    return NextResponse.json(
      { error: 'Không thể lấy bối cảnh concierge. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

