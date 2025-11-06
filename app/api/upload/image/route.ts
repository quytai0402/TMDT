import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    console.log(`Uploading image to Cloudinary: ${file.name} (${file.size} bytes)`)

    // Convert file to base64 data URI for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'homestay-listings',
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // Max dimensions
        { quality: 'auto' }, // Auto quality
        { fetch_format: 'auto' }, // Auto format (WebP when supported)
      ],
    })

    if (!uploadResponse.secure_url) {
      console.error('Invalid Cloudinary response:', uploadResponse)
      return NextResponse.json(
        { error: 'Invalid response from Cloudinary' },
        { status: 500 }
      )
    }

    const imageUrl = uploadResponse.secure_url
    console.log(`Successfully uploaded image: ${imageUrl}`)

    return NextResponse.json({ 
      url: imageUrl,
      publicId: uploadResponse.public_id,
      width: uploadResponse.width,
      height: uploadResponse.height,
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
