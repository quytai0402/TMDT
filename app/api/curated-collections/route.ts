import { NextResponse } from "next/server"
import { getCuratedCollections } from "@/lib/curated-collections"

export async function GET() {
  try {
    const collections = await getCuratedCollections()
    return NextResponse.json(collections)
  } catch (error) {
    console.error("Failed to fetch curated collections", error)
    return NextResponse.json([], { status: 500 })
  }
}
