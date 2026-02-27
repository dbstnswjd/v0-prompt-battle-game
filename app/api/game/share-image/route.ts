import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    // Extract base64 data from data URL
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Vercel Blob
    const filename = `share-images/${randomUUID()}.png`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    })

    return NextResponse.json({ imageUrl: blob.url })
  } catch (error) {
    console.error('[v0] share-image error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
