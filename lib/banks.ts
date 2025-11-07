export type BankInfo = {
  code: string
  shortName: string
  name: string
  vietQR?: string
}

export const VIETNAMESE_BANKS: BankInfo[] = [
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)", vietQR: "970436" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu (ACB)", vietQR: "970416" },
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)", vietQR: "970407" },
  { code: "VTB", shortName: "VietinBank", name: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)", vietQR: "970415" },
  { code: "BID", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)", vietQR: "970418" },
  { code: "MB", shortName: "MB Bank", name: "Ngân hàng TMCP Quân Đội (MB Bank)", vietQR: "970422" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)", vietQR: "970432" },
  { code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)", vietQR: "970405" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)", vietQR: "970437" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)", vietQR: "970443" },
  { code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông (OCB)", vietQR: "970448" },
  { code: "SCB", shortName: "SCB", name: "Ngân hàng TMCP Sài Gòn (SCB)", vietQR: "970429" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong (TPBank)", vietQR: "970423" },
  { code: "VIB", shortName: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)", vietQR: "970441" },
  { code: "EIB", shortName: "Eximbank", name: "Ngân hàng TMCP Xuất nhập khẩu Việt Nam (Eximbank)", vietQR: "970431" },
  { code: "MSB", shortName: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam (MSB)", vietQR: "970426" },
  { code: "ABB", shortName: "ABBank", name: "Ngân hàng TMCP An Bình (ABBank)", vietQR: "970425" },
  { code: "LPB", shortName: "LienVietPostBank", name: "Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)", vietQR: "970449" },
]

const normalizeBankValue = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]/g, "")

export function findBankByCode(code: string) {
  const normalized = normalizeBankValue(code)
  return VIETNAMESE_BANKS.find(
    (bank) =>
      normalizeBankValue(bank.code) === normalized ||
      normalizeBankValue(bank.shortName) === normalized ||
      normalizeBankValue(bank.name) === normalized,
  )
}

export function getBankVietQrCode(query: string) {
  return findBankByCode(query)?.vietQR ?? null
}
