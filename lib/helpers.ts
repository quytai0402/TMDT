import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

export function generateReferralCode(name: string): string {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  const namePrefix = name.substring(0, 3).toUpperCase()
  return `${namePrefix}${randomStr}`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function calculateServiceFee(basePrice: number, nights: number): number {
  const total = basePrice * nights
  // 10% service fee
  return total * 0.1
}

export function calculateTotalPrice(
  basePrice: number,
  nights: number,
  cleaningFee: number = 0,
  discount: number = 0
): number {
  const subtotal = basePrice * nights
  const serviceFee = calculateServiceFee(basePrice, nights)
  const total = subtotal + cleaningFee + serviceFee - discount
  return Math.max(0, total)
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date, locale: string = 'vi-VN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date, locale: string = 'vi-VN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

export function isDateBlocked(date: Date, blockedDates: Date[]): boolean {
  return blockedDates.some(
    (blocked) =>
      blocked.getFullYear() === date.getFullYear() &&
      blocked.getMonth() === date.getMonth() &&
      blocked.getDate() === date.getDate()
  )
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  const maskedName = name.substring(0, 2) + '*'.repeat(name.length - 2)
  return `${maskedName}@${domain}`
}

export function maskPhone(phone: string): string {
  return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3)
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  const re = /^(\+84|0)[0-9]{9}$/
  return re.test(phone)
}
