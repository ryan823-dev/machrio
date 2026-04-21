import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getOrderByNumber, getPool } from '@/lib/db'
import { getBankTransferReference, getBankTransferSubmission } from '@/lib/bank-transfer'
import { authorizeOrderAccess } from '@/lib/order-access'
import { recordOrderEvent } from '@/lib/order-events'

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

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
]

function getOptionalFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  return normalized ? normalized : null
}

function isValidTransferDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  try {
    const orderRecord = await getOrderByNumber(orderNumber)
    if (!orderRecord) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 },
      )
    }

    const hasAccess = await authorizeOrderAccess({
      order: orderRecord,
      request: req,
      accessToken: req.nextUrl.searchParams.get('access'),
      allowedPurposes: ['order-access', 'receipt-upload'],
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const formData = await req.formData()
    const amountPaidRaw = getOptionalFormValue(formData, 'amountPaid')
    const transferDate = getOptionalFormValue(formData, 'transferDate')
    const senderName = getOptionalFormValue(formData, 'senderName')
    const bankName = getOptionalFormValue(formData, 'bankName')
    const senderCountry = getOptionalFormValue(formData, 'senderCountry')
    const notes = getOptionalFormValue(formData, 'notes')
    const paymentReference = getBankTransferReference(orderRecord.order_number)
    const receiptValue = formData.get('receipt')
    const file = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null

    if (!amountPaidRaw || !transferDate || !senderName) {
      return NextResponse.json(
        { error: 'Amount paid, transfer date, and sender name are required.' },
        { status: 400 }
      )
    }

    const amountPaid = Number(amountPaidRaw)
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      return NextResponse.json(
        { error: 'Amount paid must be a valid number greater than zero.' },
        { status: 400 }
      )
    }

    if (!isValidTransferDate(transferDate)) {
      return NextResponse.json(
        { error: 'Transfer date must use the YYYY-MM-DD format.' },
        { status: 400 }
      )
    }

    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF' },
          { status: 400 }
        )
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 400 }
        )
      }
    }

    const payload = await getPayload({ config })
    const pool = getPool()
    const canonicalOrderNumber = orderRecord.order_number

    const orderResult = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: canonicalOrderNumber } },
      limit: 1,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderResult.docs[0]
    const existingSubmission = getBankTransferSubmission(orderRecord.payment_info, canonicalOrderNumber)
    const existingPayment = order.payment && typeof order.payment === 'object' && !Array.isArray(order.payment)
      ? order.payment as Record<string, unknown>
      : {}
    const submittedAt = new Date().toISOString()
    let receiptId: number | null = null
    let filename: string | null = null

    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const uploadDir = join(process.cwd(), 'public', 'payment-receipts')
      await mkdir(uploadDir, { recursive: true })

      const fileExtension = file.type === 'application/pdf'
        ? 'pdf'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/gif'
            ? 'gif'
            : 'jpg'
      filename = `receipt-${canonicalOrderNumber}-${uuidv4()}.${fileExtension}`
      const filepath = join(uploadDir, filename)

      await writeFile(filepath, buffer)

      const receiptSummary = [
        `Payment Reference: ${paymentReference}`,
        `Amount Paid: ${amountPaid.toFixed(2)} ${orderRecord.currency || ''}`.trim(),
        `Transfer Date: ${transferDate}`,
        `Sender Name: ${senderName}`,
        bankName ? `Sending Bank: ${bankName}` : null,
        senderCountry ? `Sender Country: ${senderCountry}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join('\n')

      const receipt = await payload.create({
        collection: 'payment-receipts',
        data: {
          filename,
          orderNumber: canonicalOrderNumber,
          orderId: order.id,
          uploadedBy: orderRecord.customer_email || 'unknown',
          fileSize: file.size,
          fileType: file.type,
          notes: receiptSummary || undefined,
        },
      })

      receiptId = Number(receipt.id)
    }

    const nextSubmission = {
      status: 'submitted',
      paymentReference,
      submittedAt,
      amountPaid,
      transferDate,
      senderName,
      bankName,
      senderCountry,
      notes,
      proofUploaded: Boolean(file) || Boolean(existingSubmission?.proofUploaded),
      proofFilename: filename || existingSubmission?.proofFilename || null,
    }

    const orderUpdateData: Record<string, unknown> = {
      payment: {
        ...existingPayment,
        method: 'bank-transfer',
        receiptUploaded: Boolean(file) || existingPayment.receiptUploaded === true,
        receiptUploadDate: file ? submittedAt : existingPayment.receiptUploadDate || null,
        bankTransferSubmissionStatus: 'submitted',
        bankTransferSubmittedAt: submittedAt,
        bankTransferAmountPaid: amountPaid,
        bankTransferTransferDate: transferDate,
        bankTransferSenderName: senderName,
        bankTransferBankName: bankName,
        bankTransferSenderCountry: senderCountry,
        bankTransferReference: paymentReference,
        bankTransferNotes: notes,
      },
    }

    if (receiptId) {
      orderUpdateData.paymentReceipt = receiptId
    }

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: orderUpdateData,
    })

    await pool.query(
      `UPDATE orders
       SET payment_info = COALESCE(payment_info, '{}'::jsonb) || $1::jsonb
       WHERE order_number = $2`,
      [
        JSON.stringify({
          method: 'bank-transfer',
          bankTransferSubmission: nextSubmission,
        }),
        canonicalOrderNumber,
      ],
    )

    await recordOrderEvent({
      orderNumber: canonicalOrderNumber,
      orderId: orderRecord.id,
      type: 'payment.submitted',
      data: {
        paymentMethod: 'bank-transfer',
        amountPaid,
        currency: orderRecord.currency,
        transferDate,
        senderName,
        proofUploaded: nextSubmission.proofUploaded,
      },
    }).catch((orderEventError) => {
      console.error(`Failed to record payment.submitted event for order ${canonicalOrderNumber}:`, orderEventError)
    })

    if (filename && file) {
    await recordOrderEvent({
      orderNumber: canonicalOrderNumber,
      orderId: orderRecord.id,
      type: 'receipt.uploaded',
      data: {
        filename,
        fileType: file.type,
      },
    }).catch((orderEventError) => {
      console.error(`Failed to record receipt upload event for order ${canonicalOrderNumber}:`, orderEventError)
    })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted successfully',
      receiptId,
      filename,
      paymentReference,
    })
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Failed to upload receipt' },
      { status: 500 }
    )
  }
}
