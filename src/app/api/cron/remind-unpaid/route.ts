import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getBankTransferReference } from '@/lib/bank-transfer'
import { sendEmail } from '@/lib/email'
import { issueOrderAccessLinks } from '@/lib/order-access'

/**
 * Cron job to remind customers about unpaid bank transfer orders
 * Run this endpoint daily via Railway cron or external scheduler
 * 
 * Usage:
 * curl https://machrio.com/api/cron/remind-unpaid
 * 
 * Add to Railway Dashboard > Settings > Cron Jobs:
 * - Schedule: 0 9 * * * (every day at 9 AM UTC)
 * - Command: curl https://machrio.com/api/cron/remind-unpaid
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

    // Find unpaid bank transfer orders older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          {
            'payment.method': { equals: 'bank-transfer' },
          },
          {
            paymentStatus: { equals: 'unpaid' },
          },
          {
            createdAt: {
              greater_than_equal: fourteenDaysAgo.toISOString(),
            },
          },
          {
            createdAt: {
              less_than_equal: sevenDaysAgo.toISOString(),
            },
          },
        ],
      },
      limit: 50,
    })

    const results = {
      total: orders.docs.length,
      reminded: 0,
      errors: [] as string[],
    }

    for (const order of orders.docs) {
      const o = order as unknown as Record<string, unknown>
      const customer = o.customer as Record<string, unknown>
      const customerEmail = customer.email as string
      const customerName = customer.name as string
      const orderNumber = o.orderNumber as string
      const total = o.total as number
      const currency = o.currency as string
      const createdAt = new Date(o.createdAt as string)

      // Calculate days since order
      const daysSinceOrder = Math.floor(
        (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      const { invoiceUrl } = await issueOrderAccessLinks({
        orderNumber,
        email: customerEmail,
        baseUrl: serverUrl,
      })

      try {
        await sendEmail({
          to: customerEmail,
          subject: `Payment Reminder - Order ${orderNumber} (${daysSinceOrder} days overdue)`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
              <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
                <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
              </div>
              <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:16px;margin:0 0 16px">
                  <h2 style="margin:0 0 8px;color:#92400e;font-size:18px">Payment Reminder</h2>
                  <p style="margin:0;color:#92400e">
                    This is a friendly reminder that payment for order ${orderNumber} is still pending.
                  </p>
                </div>
                
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
                  <p style="margin:0 0 8px"><strong>Order Number:</strong> ${orderNumber}</p>
                  <p style="margin:0 0 8px"><strong>Customer:</strong> ${customerName}</p>
                  <p style="margin:0 0 8px"><strong>Order Date:</strong> ${createdAt.toLocaleDateString('en-US')}</p>
                  <p style="margin:0 0 8px"><strong>Days Since Order:</strong> ${daysSinceOrder}</p>
                  <p style="margin:0 0 8px"><strong>Amount Due:</strong> $${total.toFixed(2)} ${currency}</p>
                </div>
                
                <p style="margin:0 0 16px;color:#475569">
                  To complete your payment, please transfer the amount to the bank account shown on your Proforma Invoice:
                </p>
                
                <a href="${invoiceUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:16px">
                  View Proforma Invoice
                </a>
                
                <p style="margin:0 0 16px;color:#475569">
                  Please use payment reference <strong>${getBankTransferReference(orderNumber)}</strong> when sending the transfer.
                </p>

                <p style="margin:0 0 16px;color:#475569">
                  After payment is sent, return to your order page and submit the amount, transfer date, and sender name. Uploading proof is optional.
                </p>
                
                <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:6px;padding:16px;margin:0 0 16px">
                  <p style="margin:0;color:#0369a1;font-size:13px">
                    <strong>Need more time?</strong> If you need an extension or have any questions, please contact us at 
                    <a href="mailto:sales@machrio.com" style="color:#0284c7">sales@machrio.com</a>
                  </p>
                </div>
                
                <p style="margin:0;color:#94a3b8;font-size:12px">
                  If you've already made the payment, please disregard this reminder. Your order will be updated once payment is confirmed.
                </p>
              </div>
            </div>
          `,
        })

        results.reminded++
        console.log(`Sent reminder for order ${orderNumber} to ${customerEmail}`)
      } catch (err) {
        console.error(`Failed to send reminder for order ${orderNumber}:`, err)
        results.errors.push(orderNumber)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.reminded} reminders`,
      results,
    })
  } catch (err) {
    console.error('Failed to process unpaid order reminders:', err)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}
