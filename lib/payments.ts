const BANK_CONFIG = {
  bankCode: "970407",
  bankShortCode: "techcombank",
  bankName: "Techcombank",
  accountNumber: "8866997979",
  accountName: "TRAN QUY TAI",
  branch: "Techcombank - Hội sở Hà Nội",
}

type TransferType =
  | "BOOKING"
  | "MEMBERSHIP"
  | "SERVICE"
  | "CONCIERGE"
  | "EXPERIENCE"
  | "LOCATION_EXPANSION"

const TRANSFER_PREFIX: Record<TransferType, string> = {
  BOOKING: "BK",
  MEMBERSHIP: "MEM",
  SERVICE: "SV",
  CONCIERGE: "CX",
  EXPERIENCE: "EXP",
  LOCATION_EXPANSION: "LOC",
}

const sanitizeReference = (value: string) => {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20)
}

export function formatTransferReference(type: TransferType, code: string) {
  const prefix = TRANSFER_PREFIX[type] ?? "BK"
  const sanitized = sanitizeReference(code)
  return `${prefix}${sanitized ? `-${sanitized}` : ""}`
}

export function createVietQRUrl(amount: number, reference: string, template: "compact" | "print" = "compact") {
  const params = new URLSearchParams()
  params.set("amount", Math.max(0, Math.round(amount)).toString())
  params.set("addInfo", reference)
  params.set("accountName", BANK_CONFIG.accountName)
  return `https://img.vietqr.io/image/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNumber}-${template}.png?${params.toString()}`
}

export function getBankTransferInfo() {
  return BANK_CONFIG
}
