import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'Machrio <orders@machrio.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sales@machrio.com'

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  company: string
  total: number
  currency: string
  paymentMethod: 'stripe' | 'bank-transfer'
  itemCount: number
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  if (!resend) {
    console.warn('Resend not configured, skipping order confirmation email')
    return
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const orderUrl = `${serverUrl}/order/${data.orderNumber}`
  const invoiceUrl = `${orderUrl}/invoice`

  const paymentSection = data.paymentMethod === 'bank-transfer'
    ? `<p style="margin:0 0 8px"><strong>Payment Method:</strong> Bank Transfer</p>
       <p style="margin:0 0 8px">Please view your <a href="${invoiceUrl}" style="color:#2563eb">Proforma Invoice</a> for bank transfer details.</p>
       <p style="margin:0 0 8px">Payment is due within 14 days.</p>`
    : `<p style="margin:0 0 8px"><strong>Payment Method:</strong> Online (Stripe)</p>
       <p style="margin:0 0 8px">Your payment is being processed.</p>`

  // Email to customer
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px">Thank you for your order!</h2>
            <p style="margin:0 0 8px;color:#475569">Hi ${data.customerName},</p>
            <p style="margin:0 0 16px;color:#475569">Your order has been placed successfully. Here are the details:</p>
            
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
              <p style="margin:0 0 8px"><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p style="margin:0 0 8px"><strong>Company:</strong> ${data.company}</p>
              <p style="margin:0 0 8px"><strong>Items:</strong> ${data.itemCount}</p>
              <p style="margin:0 0 8px"><strong>Total:</strong> $${data.total.toFixed(2)} ${data.currency}</p>
              ${paymentSection}
            </div>
            
            <a href="${orderUrl}" style="display:inline-block;background:#1a3c6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">View Order Details</a>
            
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
              If you have any questions, please contact us at <a href="mailto:sales@machrio.com" style="color:#2563eb">sales@machrio.com</a>
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send customer order email:', err)
  }

  // Email to admin
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Order: ${data.orderNumber} - $${data.total.toFixed(2)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
          <h2 style="margin:0 0 16px">New Order Received</h2>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px">
            <p style="margin:0 0 8px"><strong>Order:</strong> ${data.orderNumber}</p>
            <p style="margin:0 0 8px"><strong>Customer:</strong> ${data.customerName} (${data.company})</p>
            <p style="margin:0 0 8px"><strong>Email:</strong> ${data.customerEmail}</p>
            <p style="margin:0 0 8px"><strong>Items:</strong> ${data.itemCount}</p>
            <p style="margin:0 0 8px"><strong>Total:</strong> $${data.total.toFixed(2)} ${data.currency}</p>
            <p style="margin:0 0 8px"><strong>Payment:</strong> ${data.paymentMethod === 'stripe' ? 'Stripe (Online)' : 'Bank Transfer'}</p>
          </div>
          <p style="margin:16px 0 0"><a href="${serverUrl}/admin/collections/orders" style="color:#2563eb">View in Admin Panel</a></p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send admin order notification:', err)
  }
}

interface RFQEmailData {
  name: string
  email: string
  phone?: string
  company: string
  message: string
  sourcePage?: string
}

export async function sendRFQConfirmationEmail(data: RFQEmailData) {
  if (!resend) {
    console.warn('Resend not configured, skipping RFQ confirmation email')
    return
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'We received your quote request - Machrio',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px">Thank you for your inquiry!</h2>
            <p style="margin:0 0 8px;color:#475569">Hi ${data.name},</p>
            <p style="margin:0 0 16px;color:#475569">We have received your quote request and our team will review it shortly. You can expect a response within 1-2 business days.</p>
            
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
              <p style="margin:0 0 8px"><strong>Your inquiry:</strong></p>
              <p style="margin:0;color:#475569;white-space:pre-wrap">${data.message}</p>
            </div>
            
            <p style="margin:0 0 16px;color:#475569">In the meantime, feel free to browse our product catalog:</p>
            
            <a href="${serverUrl}/category" style="display:inline-block;background:#1a3c6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Browse Products</a>
            
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
              If you have urgent questions, please contact us at <a href="mailto:sales@machrio.com" style="color:#2563eb">sales@machrio.com</a>
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send RFQ confirmation email:', err)
  }
}

export async function sendRFQNotificationEmail(data: RFQEmailData) {
  if (!resend) {
    console.warn('Resend not configured, skipping RFQ admin notification')
    return
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New RFQ from ${data.company} - ${data.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
          <h2 style="margin:0 0 16px">New Quote Request</h2>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 8px"><strong>Name:</strong> ${data.name}</p>
            <p style="margin:0 0 8px"><strong>Company:</strong> ${data.company}</p>
            <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#2563eb">${data.email}</a></p>
            ${data.phone ? `<p style="margin:0 0 8px"><strong>Phone:</strong> ${data.phone}</p>` : ''}
            <p style="margin:0 0 8px"><strong>Source:</strong> ${data.sourcePage || '/rfq'}</p>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 8px"><strong>Inquiry:</strong></p>
            <p style="margin:0;white-space:pre-wrap">${data.message}</p>
          </div>
          <p style="margin:0"><a href="${serverUrl}/admin/collections/rfq-submissions" style="color:#2563eb">View in Admin Panel</a></p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send RFQ admin notification:', err)
  }
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Customer Support',
  order: 'Order Status',
  return: 'Returns & Refunds',
  partnership: 'Business Partnership',
  other: 'Other',
}

interface ContactEmailData {
  name: string
  email: string
  phone?: string
  company?: string
  subject: string
  message: string
}

export async function sendContactConfirmationEmail(data: ContactEmailData) {
  if (!resend) {
    console.warn('Resend not configured, skipping contact confirmation email')
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'We received your message - Machrio',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px">Thank you for reaching out!</h2>
            <p style="margin:0 0 8px;color:#475569">Hi ${data.name},</p>
            <p style="margin:0 0 16px;color:#475569">We have received your message and will get back to you within 1 business day.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
              <p style="margin:0 0 8px"><strong>Subject:</strong> ${SUBJECT_LABELS[data.subject] || data.subject}</p>
              <p style="margin:0;color:#475569;white-space:pre-wrap">${data.message}</p>
            </div>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
              If you have urgent questions, please email <a href="mailto:support@machrio.com" style="color:#2563eb">support@machrio.com</a>
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send contact confirmation email:', err)
  }
}

export async function sendContactNotificationEmail(data: ContactEmailData) {
  if (!resend) {
    console.warn('Resend not configured, skipping contact admin notification')
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Contact] ${SUBJECT_LABELS[data.subject] || data.subject} - ${data.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
          <h2 style="margin:0 0 16px">New Contact Form Submission</h2>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 8px"><strong>Name:</strong> ${data.name}</p>
            ${data.company ? `<p style="margin:0 0 8px"><strong>Company:</strong> ${data.company}</p>` : ''}
            <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#2563eb">${data.email}</a></p>
            ${data.phone ? `<p style="margin:0 0 8px"><strong>Phone:</strong> ${data.phone}</p>` : ''}
            <p style="margin:0 0 8px"><strong>Subject:</strong> ${SUBJECT_LABELS[data.subject] || data.subject}</p>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 8px"><strong>Message:</strong></p>
            <p style="margin:0;white-space:pre-wrap">${data.message}</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send contact admin notification:', err)
  }
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  if (!resend) {
    console.warn('Resend not configured, skipping verification code email')
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Machrio verification code: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="margin:0;color:#fff;font-size:20px">Mach<span style="color:#f59e0b">rio</span></h1>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px">Your Verification Code</h2>
            <p style="margin:0 0 16px;color:#475569">Use the code below to access your account:</p>
            <div style="background:#f8fafc;border:2px solid #1a3c6e;border-radius:8px;padding:24px;margin:0 0 16px;text-align:center">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a3c6e">${code}</span>
            </div>
            <p style="margin:0 0 16px;color:#94a3b8;font-size:13px">This code expires in 5 minutes.</p>
            <p style="margin:0;color:#94a3b8;font-size:12px">
              If you didn&apos;t request this code, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send verification code email:', err)
  }
}
