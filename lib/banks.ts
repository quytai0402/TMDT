export type BankInfo = {
  code: string
  shortName: string
  name: string
}

export const VIETNAMESE_BANKS: BankInfo[] = [
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu (ACB)" },
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)" },
  { code: "VTB", shortName: "VietinBank", name: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)" },
  { code: "BID", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)" },
  { code: "MB", shortName: "MB Bank", name: "Ngân hàng TMCP Quân Đội (MB Bank)" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
  { code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)" },
  { code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông (OCB)" },
  { code: "SCB", shortName: "SCB", name: "Ngân hàng TMCP Sài Gòn (SCB)" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong (TPBank)" },
  { code: "VIB", shortName: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
  { code: "EIB", shortName: "Eximbank", name: "Ngân hàng TMCP Xuất nhập khẩu Việt Nam (Eximbank)" },
  { code: "MSB", shortName: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam (MSB)" },
  { code: "ABB", shortName: "ABBank", name: "Ngân hàng TMCP An Bình (ABBank)" },
  { code: "LPB", shortName: "LienVietPostBank", name: "Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)" },
]

export function findBankByCode(code: string) {
  const normalized = code.toUpperCase()
  return VIETNAMESE_BANKS.find((bank) => bank.code === normalized || bank.shortName.toUpperCase() === normalized)
}
