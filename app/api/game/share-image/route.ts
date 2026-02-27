import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
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

    // Save to public/share-images/ directory
    const dir = join(process.cwd(), 'public', 'share-images')
    await mkdir(dir, { recursive: true })

    const filename = `${randomUUID()}.png`
    const filepath = join(dir, filename)
    await writeFile(filepath, buffer)

    // Return the public URL
    const origin = request.headers.get('origin') || request.headers.get('host') || ''
    const protocol = origin.startsWith('http') ? '' : 'https://'
    const baseUrl = origin.startsWith('http') ? origin : `${protocol}${origin}`
    const imageUrl = `${baseUrl}/share-images/${filename}`

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('[v0] share-image error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
