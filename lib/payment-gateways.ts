import crypto from 'crypto'

// VNPay Configuration
export const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNPAY_HASH_SECRET || '',
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/vnpay/callback`,
}

export function createVNPayPaymentUrl(params: {
  amount: number
  orderInfo: string
  orderId: string
  ipAddr: string
}) {
  const date = new Date()
  const createDate = formatDate(date)
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)) // 15 minutes

  let vnpParams: any = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Amount: params.amount * 100, // VNPay uses smallest currency unit
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: params.ipAddr,
    vnp_Locale: 'vn',
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_TxnRef: params.orderId,
    vnp_ExpireDate: expireDate,
  }

  // Sort params
  vnpParams = sortObject(vnpParams)

  // Create signature
  const signData = new URLSearchParams(vnpParams).toString()
  const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
  vnpParams.vnp_SecureHash = signed

  // Create payment URL
  const paymentUrl = vnpayConfig.url + '?' + new URLSearchParams(vnpParams).toString()

  return paymentUrl
}

export function verifyVNPayCallback(params: any): boolean {
  const secureHash = params.vnp_SecureHash
  delete params.vnp_SecureHash
  delete params.vnp_SecureHashType

  const sortedParams = sortObject(params)
  const signData = new URLSearchParams(sortedParams).toString()
  const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  return secureHash === signed
}

// Momo Configuration
export const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/momo/callback`,
  ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/momo/ipn`,
}

export async function createMomoPayment(params: {
  amount: number
  orderInfo: string
  orderId: string
  requestId: string
}) {
  const requestBody = {
    partnerCode: momoConfig.partnerCode,
    partnerName: 'Homestay Booking',
    storeId: 'HomeStay',
    requestId: params.requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    lang: 'vi',
    requestType: 'captureWallet',
    autoCapture: true,
    extraData: '',
  }

  // Create signature
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${requestBody.amount}&extraData=${requestBody.extraData}&ipnUrl=${requestBody.ipnUrl}&orderId=${requestBody.orderId}&orderInfo=${requestBody.orderInfo}&partnerCode=${requestBody.partnerCode}&redirectUrl=${requestBody.redirectUrl}&requestId=${requestBody.requestId}&requestType=${requestBody.requestType}`

  const signature = crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex')

  const requestBodyWithSignature = {
    ...requestBody,
    signature,
  }

  try {
    const response = await fetch(momoConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBodyWithSignature),
    })

    return await response.json()
  } catch (error) {
    console.error('Momo payment error:', error)
    throw error
  }
}

export function verifyMomoCallback(params: any): boolean {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = params

  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

  const calculatedSignature = crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex')

  return signature === calculatedSignature
}

// ZaloPay Configuration
export const zalopayConfig = {
  appId: process.env.ZALOPAY_APP_ID || '',
  key1: process.env.ZALOPAY_KEY1 || '',
  key2: process.env.ZALOPAY_KEY2 || '',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/zalopay/callback`,
}

export async function createZaloPayPayment(params: {
  amount: number
  description: string
  orderId: string
}) {
  const embedData = JSON.stringify({})
  const items = JSON.stringify([])
  const transId = `${Date.now()}`

  const order: any = {
    app_id: zalopayConfig.appId,
    app_trans_id: `${formatDateZalo(new Date())}_${params.orderId}`,
    app_user: 'user123',
    app_time: Date.now(),
    amount: params.amount,
    item: items,
    embed_data: embedData,
    description: params.description,
    bank_code: '',
    callback_url: zalopayConfig.callbackUrl,
  }

  // Create signature
  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`
  order.mac = crypto.createHmac('sha256', zalopayConfig.key1).update(data).digest('hex')

  try {
    const response = await fetch(zalopayConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(order).toString(),
    })

    return await response.json()
  } catch (error) {
    console.error('ZaloPay payment error:', error)
    throw error
  }
}

export function verifyZaloPayCallback(params: any): boolean {
  const dataStr = params.data
  const reqMac = params.mac

  const mac = crypto.createHmac('sha256', zalopayConfig.key2).update(dataStr).digest('hex')

  return reqMac === mac
}

// Helper functions
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hour}${minute}${second}`
}

function formatDateZalo(date: Date): string {
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

function sortObject(obj: any): any {
  const sorted: any = {}
  const keys = Object.keys(obj).sort()
  keys.forEach((key) => {
    sorted[key] = obj[key]
  })
  return sorted
}
