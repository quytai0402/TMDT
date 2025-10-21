/**
 * Performance Optimization Utilities
 * Image optimization, lazy loading, and caching helpers
 */

// Cloudinary image optimization
export function getOptimizedImageUrl(
  imageUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  } = {}
): string {
  const { width, height, quality = 80, format = 'auto' } = options

  // If not a Cloudinary URL, return as-is
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl
  }

  // Extract public ID from Cloudinary URL
  const parts = imageUrl.split('/upload/')
  if (parts.length !== 2) return imageUrl

  const [base, path] = parts

  // Build transformations
  const transformations: string[] = []
  
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  transformations.push(`q_${quality}`)
  transformations.push(`f_${format}`)
  transformations.push('c_fill') // Crop to fill dimensions
  transformations.push('g_auto') // Auto gravity for smart cropping

  const transform = transformations.join(',')
  return `${base}/upload/${transform}/${path}`
}

// Generate responsive image srcset
export function generateSrcSet(imageUrl: string, widths: number[]): string {
  return widths
    .map((width) => {
      const url = getOptimizedImageUrl(imageUrl, { width, format: 'webp' })
      return `${url} ${width}w`
    })
    .join(', ')
}

// Lazy load images with Intersection Observer
export function useLazyLoad() {
  if (typeof window === 'undefined') return

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src) {
            img.src = src
            img.classList.add('loaded')
            observer.unobserve(img)
          }
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  )

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img)
  })
}

// Preload critical images
export function preloadImage(src: string): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
}

// Cache API responses with TTL
export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }>
  private defaultTTL: number

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttl || this.defaultTTL),
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Debounce function for search/filter inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Measure component render time
export function measurePerformance(
  componentName: string,
  callback: () => void
): void {
  if (typeof window === 'undefined') return

  const startTime = performance.now()
  callback()
  const endTime = performance.now()
  
  console.log(`${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`)
}

// Prefetch data for faster navigation
export async function prefetchData(urls: string[]): Promise<void> {
  if (typeof window === 'undefined') return

  const promises = urls.map((url) =>
    fetch(url, {
      method: 'GET',
      credentials: 'include',
    }).catch((err) => console.error(`Prefetch failed for ${url}:`, err))
  )

  await Promise.allSettled(promises)
}

// Web Vitals tracking helper
export function reportWebVitals(metric: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(metric)
  }

  // Send to analytics
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

// Compress images before upload
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas to Blob conversion failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = reject
    }
    
    reader.onerror = reject
  })
}

// Batch API requests
export class BatchRequestManager {
  private queue: Array<{ url: string; resolve: Function; reject: Function }>
  private batchSize: number
  private delay: number
  private timer: NodeJS.Timeout | null

  constructor(batchSize: number = 10, delay: number = 100) {
    this.queue = []
    this.batchSize = batchSize
    this.delay = delay
    this.timer = null
  }

  async request(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, resolve, reject })
      
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch()
        }, this.delay)
      }
      
      if (this.queue.length >= this.batchSize) {
        if (this.timer) {
          clearTimeout(this.timer)
          this.timer = null
        }
        this.processBatch()
      }
    })
  }

  private async processBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.batchSize)
    
    try {
      const results = await Promise.all(
        batch.map(({ url }) => fetch(url).then((r) => r.json()))
      )
      
      batch.forEach(({ resolve }, index) => {
        resolve(results[index])
      })
    } catch (error) {
      batch.forEach(({ reject }) => {
        reject(error)
      })
    }
    
    this.timer = null
    
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => {
        this.processBatch()
      }, this.delay)
    }
  }
}

// Export singleton instances
export const apiCache = new CacheManager()
export const batchRequestManager = new BatchRequestManager()
