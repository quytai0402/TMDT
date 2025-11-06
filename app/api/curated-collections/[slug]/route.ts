import { NextResponse } from "next/server"
import { getCuratedCollectionBySlug } from "@/lib/curated-collections"

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const collection = await getCuratedCollectionBySlug(params.slug)

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error(`Failed to fetch curated collection ${params.slug}`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
