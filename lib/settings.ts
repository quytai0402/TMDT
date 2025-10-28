import { prisma } from "@/lib/prisma"

type GeneralSettings = {
  siteName: string
  siteDescription: string
  supportEmail: string
  supportPhone: string
  address?: string
}

type FeatureToggles = {
  allowRegistration: boolean
  instantBooking: boolean
  aiPricing: boolean
  maintenanceMode: boolean
}

type NotificationSettings = {
  booking: boolean
  newUser: boolean
  dispute: boolean
  payout: boolean
}

type EmailSettings = {
  fromName: string
  fromEmail: string
  replyToEmail: string
}

type PaymentGatewaySetting = {
  gateway: string
  isEnabled: boolean
  config: Record<string, unknown>
}

export type SystemSettingsResponse = {
  general: GeneralSettings
  features: FeatureToggles
  notifications: NotificationSettings
  email: EmailSettings
  paymentGateways: PaymentGatewaySetting[]
}

const SYSTEM_SETTING_KEYS = {
  general: "general",
  features: "features",
  notifications: "notifications",
  email: "email",
} as const

const DEFAULT_SETTINGS: SystemSettingsResponse = {
  general: {
    siteName: "LuxeStay",
    siteDescription: "Nền tảng đặt chỗ nghỉ cao cấp hàng đầu Việt Nam",
    supportEmail: "support@luxestay.vn",
    supportPhone: "1900 1234",
    address: "01 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
  features: {
    allowRegistration: true,
    instantBooking: true,
    aiPricing: false,
    maintenanceMode: false,
  },
  notifications: {
    booking: true,
    newUser: true,
    dispute: true,
    payout: true,
  },
  email: {
    fromName: "LuxeStay",
    fromEmail: "no-reply@luxestay.vn",
    replyToEmail: "support@luxestay.vn",
  },
  paymentGateways: [
    {
      gateway: "VNPAY",
      isEnabled: true,
      config: {
        terminalId: "",
        secretKey: "",
        returnUrl: "",
      },
    },
    {
      gateway: "PAYPAL",
      isEnabled: false,
      config: {
        clientId: "",
        clientSecret: "",
      },
    },
    {
      gateway: "VIETQR",
      isEnabled: true,
      config: {
        bankCode: "970407",
        accountNumber: "",
        accountName: "",
      },
    },
  ],
}

async function ensureSystemSetting(key: string, value: unknown) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
    },
    update: {},
  })
}

async function ensureGatewayConfig(gateway: string, config: PaymentGatewaySetting) {
  await prisma.paymentGatewayConfig.upsert({
    where: { gateway },
    create: {
      gateway,
      config: config.config,
      isEnabled: config.isEnabled,
    },
    update: {},
  })
}

export async function ensureSystemSettingsDefaults() {
  await Promise.all([
    ensureSystemSetting(SYSTEM_SETTING_KEYS.general, DEFAULT_SETTINGS.general),
    ensureSystemSetting(SYSTEM_SETTING_KEYS.features, DEFAULT_SETTINGS.features),
    ensureSystemSetting(SYSTEM_SETTING_KEYS.notifications, DEFAULT_SETTINGS.notifications),
    ensureSystemSetting(SYSTEM_SETTING_KEYS.email, DEFAULT_SETTINGS.email),
    ...DEFAULT_SETTINGS.paymentGateways.map((gateway) =>
      ensureGatewayConfig(gateway.gateway, gateway),
    ),
  ])
}

export async function getSystemSettings(): Promise<SystemSettingsResponse> {
  const [settings, gateways] = await Promise.all([
    prisma.systemSetting.findMany({
      where: {
        key: {
          in: Object.values(SYSTEM_SETTING_KEYS),
        },
      },
    }),
    prisma.paymentGatewayConfig.findMany(),
  ])

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]))

  return {
    general: (settingsMap.get(SYSTEM_SETTING_KEYS.general) as GeneralSettings) ?? DEFAULT_SETTINGS.general,
    features:
      (settingsMap.get(SYSTEM_SETTING_KEYS.features) as FeatureToggles) ?? DEFAULT_SETTINGS.features,
    notifications:
      (settingsMap.get(SYSTEM_SETTING_KEYS.notifications) as NotificationSettings) ??
      DEFAULT_SETTINGS.notifications,
    email: (settingsMap.get(SYSTEM_SETTING_KEYS.email) as EmailSettings) ?? DEFAULT_SETTINGS.email,
    paymentGateways:
      gateways.length > 0
        ? gateways.map((gateway) => ({
            gateway: gateway.gateway,
            isEnabled: gateway.isEnabled,
            config: gateway.config as Record<string, unknown>,
          }))
        : DEFAULT_SETTINGS.paymentGateways,
  }
}

export async function saveSystemSettings(
  payload: Partial<SystemSettingsResponse>,
  updatedBy?: string,
) {
  const updates: Array<Promise<unknown>> = []

  if (payload.general) {
    updates.push(
      prisma.systemSetting.upsert({
        where: { key: SYSTEM_SETTING_KEYS.general },
        create: { key: SYSTEM_SETTING_KEYS.general, value: payload.general, updatedBy },
        update: { value: payload.general, updatedBy },
      }),
    )
  }

  if (payload.features) {
    updates.push(
      prisma.systemSetting.upsert({
        where: { key: SYSTEM_SETTING_KEYS.features },
        create: { key: SYSTEM_SETTING_KEYS.features, value: payload.features, updatedBy },
        update: { value: payload.features, updatedBy },
      }),
    )
  }

  if (payload.notifications) {
    updates.push(
      prisma.systemSetting.upsert({
        where: { key: SYSTEM_SETTING_KEYS.notifications },
        create: { key: SYSTEM_SETTING_KEYS.notifications, value: payload.notifications, updatedBy },
        update: { value: payload.notifications, updatedBy },
      }),
    )
  }

  if (payload.email) {
    updates.push(
      prisma.systemSetting.upsert({
        where: { key: SYSTEM_SETTING_KEYS.email },
        create: { key: SYSTEM_SETTING_KEYS.email, value: payload.email, updatedBy },
        update: { value: payload.email, updatedBy },
      }),
    )
  }

  if (payload.paymentGateways) {
    for (const gateway of payload.paymentGateways) {
      updates.push(
        prisma.paymentGatewayConfig.upsert({
          where: { gateway: gateway.gateway },
          create: {
            gateway: gateway.gateway,
            config: gateway.config,
            isEnabled: gateway.isEnabled,
            updatedBy,
          },
          update: {
            config: gateway.config,
            isEnabled: gateway.isEnabled,
            updatedBy,
          },
        }),
      )
    }
  }

  await Promise.all(updates)
}
