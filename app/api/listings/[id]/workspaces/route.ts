import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // In a real application, you would have a workspaces table
    // For now, return empty array - you need to create workspace schema first
    return NextResponse.json({
      workspaces: []
    })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { workspaces: [] },
      { status: 200 }
    )
  }
}
