import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Get the order
    const orderResult = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderResult.docs[0]

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), 'public', 'payment-receipts')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.type === 'application/pdf' ? 'pdf' : 
                         file.type === 'image/png' ? 'png' :
                         file.type === 'image/gif' ? 'gif' : 'jpg'
    const filename = `receipt-${orderNumber}-${uuidv4()}.${fileExtension}`
    const filepath = join(uploadDir, filename)

    // Save file
    await writeFile(filepath, buffer)

    // Create payment receipt record
    const receipt = await payload.create({
      collection: 'payment-receipts',
      data: {
        filename: filename,
        orderNumber: orderNumber,
        orderId: order.id,
        uploadedBy: (order.customer as Record<string, unknown>)?.email as string || 'unknown',
        fileSize: file.size,
        fileType: file.type,
        notes: formData.get('notes') as string || undefined,
      },
    })

    // Update order with receipt reference
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        paymentReceipt: receipt.id,
        payment: {
          ...(order.payment as Record<string, unknown>),
          receiptUploaded: true,
          receiptUploadDate: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receiptId: receipt.id,
      filename: filename,
    })
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Failed to upload receipt' },
      { status: 500 }
    )
  }
}
