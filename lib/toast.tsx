import { toast as sonnerToast } from "sonner"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  Sparkles,
  Heart,
  Home,
  Calendar,
  DollarSign,
  MessageSquare,
  Bell
} from "lucide-react"

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Custom toast với style đẹp
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      className: "border-l-4 border-green-500",
    })
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      ...options,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      className: "border-l-4 border-red-500",
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      ...options,
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      className: "border-l-4 border-yellow-500",
    })
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      icon: <Info className="h-5 w-5 text-blue-500" />,
      className: "border-l-4 border-blue-500",
    })
  },

  loading: (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return sonnerToast.loading(message, {
      ...options,
      icon: <Loader2 className="h-5 w-5 animate-spin text-gray-500" />,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
    })
  },

  // Custom themed toasts
  booking: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      className: "border-l-4 border-blue-500 bg-blue-50",
    })
  },

  wishlist: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />,
      className: "border-l-4 border-pink-500 bg-pink-50",
    })
  },

  listing: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <Home className="h-5 w-5 text-green-500" />,
      className: "border-l-4 border-green-500 bg-green-50",
    })
  },

  payment: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
      className: "border-l-4 border-emerald-500 bg-emerald-50",
    })
  },

  message: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      className: "border-l-4 border-purple-500 bg-purple-50",
    })
  },

  notification: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      icon: <Bell className="h-5 w-5 text-orange-500" />,
      className: "border-l-4 border-orange-500 bg-orange-50",
    })
  },

  premium: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
      className: "border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50",
    })
  },

  // Custom toast với JSX content
  custom: (content: (id: string | number) => React.ReactElement, options?: Omit<ToastOptions, 'description'>) => {
    return sonnerToast.custom(content, options)
  },

  // Dismiss toast
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id)
  },
}

// Toast presets cho các actions phổ biến
export const toastPresets = {
  addedToWishlist: (title: string) => {
    toast.wishlist("Đã thêm vào yêu thích", {
      description: `"${title}" đã được lưu vào danh sách yêu thích của bạn`,
      duration: 3000,
    })
  },

  removedFromWishlist: (title: string) => {
    toast.info("Đã xóa khỏi yêu thích", {
      description: `"${title}" đã được xóa khỏi danh sách yêu thích`,
      duration: 3000,
    })
  },

  bookingCreated: (listingTitle: string) => {
    toast.booking("Đặt phòng thành công!", {
      description: `Đơn đặt phòng "${listingTitle}" đã được tạo`,
      duration: 5000,
    })
  },

  paymentSuccess: (amount: string) => {
    toast.payment("Thanh toán thành công!", {
      description: `Số tiền ${amount} đã được thanh toán`,
      duration: 5000,
    })
  },

  messageReceived: (senderName: string) => {
    toast.message("Tin nhắn mới", {
      description: `${senderName} đã gửi tin nhắn cho bạn`,
      duration: 4000,
    })
  },

  reviewSubmitted: () => {
    toast.success("Đánh giá đã được gửi", {
      description: "Cảm ơn bạn đã chia sẻ trải nghiệm của mình",
      duration: 4000,
    })
  },

  listingPublished: (title: string) => {
    toast.listing("Chỗ ở đã được đăng", {
      description: `"${title}" đã được công khai và có thể được đặt`,
      duration: 5000,
    })
  },

  upgradeToPremium: () => {
    toast.premium("Nâng cấp thành công!", {
      description: "Bạn đã trở thành thành viên Premium",
      duration: 5000,
    })
  },

  copyToClipboard: () => {
    toast.success("Đã sao chép", {
      description: "Nội dung đã được sao chép vào clipboard",
      duration: 2000,
    })
  },

  formError: (field: string) => {
    toast.error("Lỗi form", {
      description: `Vui lòng kiểm tra lại trường "${field}"`,
      duration: 4000,
    })
  },

  networkError: () => {
    toast.error("Lỗi kết nối", {
      description: "Không thể kết nối đến server. Vui lòng thử lại sau",
      duration: 5000,
    })
  },
}
