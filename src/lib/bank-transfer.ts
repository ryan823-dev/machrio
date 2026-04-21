export type BankTransferSubmissionStatus = 'submitted' | 'confirmed' | 'not-submitted'

export interface BankTransferSubmission {
  status: BankTransferSubmissionStatus | null
  paymentReference: string
  submittedAt: string | null
  amountPaid: number | null
  transferDate: string | null
  senderName: string | null
  bankName: string | null
  senderCountry: string | null
  notes: string | null
  proofUploaded: boolean
  proofFilename: string | null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
  }

  return null
}

function asBoolean(value: unknown): boolean {
  return value === true
}

export function getBankTransferReference(orderNumber: string): string {
  return orderNumber.trim().toUpperCase()
}

export function getBankTransferSubmission(
  paymentInfoValue: unknown,
  orderNumber: string,
): BankTransferSubmission | null {
  const paymentInfo = asRecord(paymentInfoValue)
  const submission = asRecord(paymentInfo.bankTransferSubmission)
  const parsed: BankTransferSubmission = {
    status: (asString(submission.status) as BankTransferSubmissionStatus | null) || null,
    paymentReference: asString(submission.paymentReference) || getBankTransferReference(orderNumber),
    submittedAt: asString(submission.submittedAt),
    amountPaid: asNumber(submission.amountPaid),
    transferDate: asString(submission.transferDate),
    senderName: asString(submission.senderName),
    bankName: asString(submission.bankName),
    senderCountry: asString(submission.senderCountry),
    notes: asString(submission.notes),
    proofUploaded: asBoolean(submission.proofUploaded),
    proofFilename: asString(submission.proofFilename),
  }

  const hasSubmission =
    Boolean(parsed.status)
    || Boolean(parsed.submittedAt)
    || parsed.amountPaid !== null
    || Boolean(parsed.transferDate)
    || Boolean(parsed.senderName)
    || parsed.proofUploaded

  return hasSubmission ? parsed : null
}
