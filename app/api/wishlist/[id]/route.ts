import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist/[id]/check - Check if listing is in wishlist
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ isInWishlist: false })
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    })

    const isInWishlist = wishlist?.listingIds.includes(id) || false

    return NextResponse.json({ isInWishlist })
  } catch (error: any) {
    console.error('Error checking wishlist:', error)
    return NextResponse.json({ isInWishlist: false })
  }
}

// DELETE /api/wishlist/[id] - Remove from wishlist
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    })

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    // Remove listing ID from array
    const updatedListingIds = wishlist.listingIds.filter(listingId => listingId !== id)

    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: {
        listingIds: updatedListingIds,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
