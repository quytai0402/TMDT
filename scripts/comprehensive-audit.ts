#!/usr/bin/env tsx

/**
 * COMPREHENSIVE SYSTEM AUDIT
 * Kiểm tra toàn bộ hệ thống homestay-booking
 * Bao gồm: Database, APIs, Components, Features, Integration, Performance
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

interface AuditResult {
  category: string
  check: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  fix?: string
}

const results: AuditResult[] = []
const fixes: string[] = []

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function addResult(result: AuditResult) {
  results.push(result)
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow'
  log(`${icon} [${result.category}] ${result.message}`, color)
  if (result.details) {
    console.log('   Details:', result.details)
  }
  if (result.fix) {
    log(`   Fix: ${result.fix}`, 'cyan')
    fixes.push(result.fix)
  }
}

// ========================================
// 1. DATABASE SCHEMA AUDIT
// ========================================
async function auditDatabaseSchema() {
  log('\n📊 Auditing Database Schema...', 'bright')
  
  const models = [
    // Core models
    'User', 'Account', 'Session', 'VerificationToken',
    // Listings
    'Listing', 'BlockedDate', 'PricingRule', 'Amenity', 'NeighborhoodGuide',
    // Bookings
    'Booking',
    // Payments
    'Payment', 'PaymentMethod', 'Transaction',
    // Reviews
    'Review',
    // Messaging
    'Message', 'Conversation',
    // Notifications
    'Notification',
    // Wishlist & Collections
    'Wishlist', 'Collection',
    // Rewards & Loyalty
    'Quest', 'UserQuest', 'RewardTier', 'RewardBadge', 'UserBadge', 
    'RewardAction', 'RewardTransaction', 'RewardCatalogItem', 'RewardRedemption',
    // Host
    'HostProfile', 'TeamMember',
    // Additional
    'Dispute', 'Promotion', 'AuditLog',
    // Services & Experiences
    'Service', 'ServiceBooking', 'Experience', 'ExperienceBooking', 'ExperienceReview',
    // Community
    'Post', 'Comment'
  ]

  for (const model of models) {
    try {
      const count = await (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)].count()
      addResult({
        category: 'Database Schema',
        check: `${model} collection`,
        status: 'pass',
        message: `${model} collection exists with ${count} documents`,
        details: { model, count }
      })
    } catch (error) {
      addResult({
        category: 'Database Schema',
        check: `${model} collection`,
        status: 'fail',
        message: `${model} collection missing or inaccessible`,
        fix: `Check Prisma schema for ${model} model definition`
      })
    }
  }
}

// ========================================
// 2. API ENDPOINTS AUDIT
// ========================================
async function auditAPIEndpoints() {
  log('\n🌐 Auditing API Endpoints...', 'bright')
  
  const apiEndpoints = [
    // Auth
    { path: 'app/api/auth', name: 'Authentication API', required: true },
    
    // User
    { path: 'app/api/user/profile/route.ts', name: 'User Profile API', required: true },
    
    // Listings
    { path: 'app/api/listings/route.ts', name: 'Listings API', required: true },
    { path: 'app/api/listings/[id]/route.ts', name: 'Listing Detail API', required: true },
    
    // Bookings
    { path: 'app/api/bookings/route.ts', name: 'Bookings API', required: true },
    { path: 'app/api/bookings/[id]/route.ts', name: 'Booking Detail API', required: true },
    
    // Payments
    { path: 'app/api/payments/route.ts', name: 'Payments API', required: true },
    
    // Reviews
    { path: 'app/api/reviews/route.ts', name: 'Reviews API', required: true },
    
    // Messages
    { path: 'app/api/messages/route.ts', name: 'Messages API', required: true },
    { path: 'app/api/conversations/route.ts', name: 'Conversations API', required: true },
    
    // Notifications
    { path: 'app/api/notifications/route.ts', name: 'Notifications API', required: true },
    
    // Wishlist
    { path: 'app/api/wishlist/route.ts', name: 'Wishlist API', required: true },
    
    // Rewards & Quests
    { path: 'app/api/quests/route.ts', name: 'Quests API', required: true },
    { path: 'app/api/quests/track/route.ts', name: 'Quest Tracking API', required: true },
    { path: 'app/api/rewards/tiers/route.ts', name: 'Reward Tiers API', required: true },
    { path: 'app/api/rewards/actions/route.ts', name: 'Reward Actions API', required: true },
    { path: 'app/api/rewards/history/route.ts', name: 'Reward History API', required: true },
    
    // Search
    { path: 'app/api/search/route.ts', name: 'Search API', required: true },
    
    // Experiences
    { path: 'app/api/experiences/route.ts', name: 'Experiences API', required: false },
    
    // Services
    { path: 'app/api/services/route.ts', name: 'Services API', required: false },
    
    // Community
    { path: 'app/api/community/route.ts', name: 'Community API', required: false },
    
    // Admin
    { path: 'app/api/admin', name: 'Admin APIs', required: false },
    
    // AI Features
    { path: 'app/api/ai', name: 'AI APIs', required: false },
  ]

  for (const endpoint of apiEndpoints) {
    const fullPath = path.join(process.cwd(), endpoint.path)
    const exists = fs.existsSync(fullPath)
    
    if (exists) {
      addResult({
        category: 'API Endpoints',
        check: endpoint.name,
        status: 'pass',
        message: `${endpoint.name} exists`,
        details: { path: endpoint.path }
      })
    } else if (endpoint.required) {
      addResult({
        category: 'API Endpoints',
        check: endpoint.name,
        status: 'fail',
        message: `${endpoint.name} missing (REQUIRED)`,
        fix: `Create ${endpoint.path}`
      })
    } else {
      addResult({
        category: 'API Endpoints',
        check: endpoint.name,
        status: 'warning',
        message: `${endpoint.name} missing (optional)`,
        details: { path: endpoint.path }
      })
    }
  }
}

// ========================================
// 3. FRONTEND PAGES AUDIT
// ========================================
async function auditFrontendPages() {
  log('\n📄 Auditing Frontend Pages...', 'bright')
  
  const pages = [
    // Core pages
    { path: 'app/page.tsx', name: 'Home Page', required: true },
    { path: 'app/search/page.tsx', name: 'Search Page', required: true },
    { path: 'app/listing/[id]/page.tsx', name: 'Listing Detail Page', required: true },
    
    // Auth pages
    { path: 'app/login/page.tsx', name: 'Login Page', required: true },
    { path: 'app/register/page.tsx', name: 'Register Page', required: true },
    
    // User pages
    { path: 'app/profile/page.tsx', name: 'Profile Page', required: true },
    { path: 'app/dashboard/page.tsx', name: 'Dashboard Page', required: true },
    { path: 'app/trips/page.tsx', name: 'Trips Page', required: true },
    { path: 'app/wishlist/page.tsx', name: 'Wishlist Page', required: true },
    { path: 'app/messages/page.tsx', name: 'Messages Page', required: true },
    
    // Booking
    { path: 'app/booking/[id]/page.tsx', name: 'Booking Page', required: true },
    
    // Rewards
    { path: 'app/rewards/page.tsx', name: 'Rewards Page', required: true },
    { path: 'app/loyalty/page.tsx', name: 'Loyalty Page', required: false },
    
    // Host pages
    { path: 'app/host/page.tsx', name: 'Host Dashboard', required: true },
    
    // Static pages
    { path: 'app/about/page.tsx', name: 'About Page', required: false },
    { path: 'app/help/page.tsx', name: 'Help Page', required: false },
    { path: 'app/terms/page.tsx', name: 'Terms Page', required: false },
    { path: 'app/privacy/page.tsx', name: 'Privacy Page', required: false },
    
    // Feature pages
    { path: 'app/experiences/page.tsx', name: 'Experiences Page', required: false },
    { path: 'app/collections/page.tsx', name: 'Collections Page', required: false },
    { path: 'app/community/page.tsx', name: 'Community Page', required: false },
    
    // Admin
    { path: 'app/admin/page.tsx', name: 'Admin Dashboard', required: false },
  ]

  for (const page of pages) {
    const fullPath = path.join(process.cwd(), page.path)
    const exists = fs.existsSync(fullPath)
    
    if (exists) {
      addResult({
        category: 'Frontend Pages',
        check: page.name,
        status: 'pass',
        message: `${page.name} exists`,
        details: { path: page.path }
      })
    } else if (page.required) {
      addResult({
        category: 'Frontend Pages',
        check: page.name,
        status: 'fail',
        message: `${page.name} missing (REQUIRED)`,
        fix: `Create ${page.path}`
      })
    } else {
      addResult({
        category: 'Frontend Pages',
        check: page.name,
        status: 'warning',
        message: `${page.name} missing (optional)`,
        details: { path: page.path }
      })
    }
  }
}

// ========================================
// 4. CORE COMPONENTS AUDIT
// ========================================
async function auditCoreComponents() {
  log('\n🎨 Auditing Core Components...', 'bright')
  
  const components = [
    // Layout
    { name: 'Header/Navbar', path: 'components/header.tsx', alt: ['components/navbar.tsx'], required: true },
    { name: 'Footer', path: 'components/footer.tsx', required: true },
    
    // Listings
    { name: 'Listing Card', path: 'components/listing-card.tsx', required: true },
    { name: 'Listing Grid', path: 'components/listing-grid.tsx', required: true },
    { name: 'Search Bar', path: 'components/search-bar.tsx', alt: ['components/enhanced-search-bar.tsx'], required: true },
    { name: 'Filters', path: 'components/filters.tsx', alt: ['components/advanced-filters.tsx'], required: true },
    
    // Booking
    { name: 'Booking Widget', path: 'components/booking-widget.tsx', alt: ['components/booking-widget-enhanced.tsx'], required: true },
    { name: 'Booking Summary', path: 'components/booking-summary.tsx', required: true },
    { name: 'Calendar', path: 'components/calendar.tsx', alt: ['components/availability-calendar.tsx'], required: true },
    
    // Reviews
    { name: 'Review Card', path: 'components/review-card.tsx', required: true },
    { name: 'Rating Stars', path: 'components/rating-stars.tsx', alt: ['components/star-rating.tsx'], required: true },
    
    // User
    { name: 'User Avatar', path: 'components/user-avatar.tsx', alt: ['components/avatar.tsx'], required: true },
    { name: 'User Profile Card', path: 'components/user-profile-card.tsx', required: false },
    
    // Auth
    { name: 'Auth Modal', path: 'components/auth-modal.tsx', required: true },
    { name: 'Auth Provider', path: 'components/auth-provider.tsx', required: true },
    
    // Messaging
    { name: 'Message Thread', path: 'components/message-thread.tsx', required: true },
    { name: 'Conversation List', path: 'components/conversation-list.tsx', alt: ['components/conversations-list.tsx'], required: true },
    
    // Rewards & Quests
    { name: 'Quests Panel', path: 'components/quests-panel.tsx', required: true },
    { name: 'Quest Completion Modal', path: 'components/quest-completion-modal.tsx', required: true },
    { name: 'Points Notification', path: 'components/points-earned-notification.tsx', required: true },
    { name: 'User Rewards Badge', path: 'components/user-rewards-badge.tsx', required: true },
    { name: 'Daily Check-in', path: 'components/daily-check-in.tsx', required: true },
    
    // Map
    { name: 'Map Component', path: 'components/map.tsx', alt: ['components/listing-map.tsx'], required: true },
    
    // UI Components
    { name: 'Button', path: 'components/ui/button.tsx', required: true },
    { name: 'Input', path: 'components/ui/input.tsx', required: true },
    { name: 'Modal/Dialog', path: 'components/ui/modal.tsx', alt: ['components/ui/dialog.tsx'], required: true },
    { name: 'Toast', path: 'components/ui/toast.tsx', alt: ['components/ui/sonner.tsx'], required: true },
  ]

  for (const component of components) {
    const mainPath = path.join(process.cwd(), component.path)
    const mainExists = fs.existsSync(mainPath)
    
    let exists = mainExists
    let usedPath = component.path
    
    if (!mainExists && component.alt) {
      for (const altPath of component.alt) {
        const fullAltPath = path.join(process.cwd(), altPath)
        if (fs.existsSync(fullAltPath)) {
          exists = true
          usedPath = altPath
          break
        }
      }
    }
    
    if (exists) {
      addResult({
        category: 'Core Components',
        check: component.name,
        status: 'pass',
        message: `${component.name} exists`,
        details: { path: usedPath }
      })
    } else if (component.required) {
      addResult({
        category: 'Core Components',
        check: component.name,
        status: 'fail',
        message: `${component.name} missing (REQUIRED)`,
        fix: `Create ${component.path}`
      })
    } else {
      addResult({
        category: 'Core Components',
        check: component.name,
        status: 'warning',
        message: `${component.name} missing (optional)`,
        details: { path: component.path }
      })
    }
  }
}

// ========================================
// 5. LIBRARY FUNCTIONS AUDIT
// ========================================
async function auditLibraryFunctions() {
  log('\n📚 Auditing Library Functions...', 'bright')
  
  const libraries = [
    {
      name: 'Quests Library',
      path: 'lib/quests.ts',
      functions: ['trackQuestProgress', 'trackBookingQuest', 'trackReviewQuest'],
      required: true
    },
    {
      name: 'Rewards Library',
      path: 'lib/rewards.ts',
      functions: ['awardPoints', 'checkTierUpgrade'],
      required: true
    },
    {
      name: 'Database Library',
      path: 'lib/db.ts',
      alt: ['lib/prisma.ts'],
      functions: ['prisma'],
      required: true
    },
    {
      name: 'Auth Library',
      path: 'lib/auth.ts',
      functions: ['getSession', 'getCurrentUser'],
      required: true
    },
    {
      name: 'Utils Library',
      path: 'lib/utils.ts',
      functions: ['cn'],
      required: true
    },
    {
      name: 'Validation Library',
      path: 'lib/validations.ts',
      alt: ['lib/validation.ts'],
      functions: [],
      required: false
    },
  ]

  for (const lib of libraries) {
    const mainPath = path.join(process.cwd(), lib.path)
    let exists = fs.existsSync(mainPath)
    let usedPath = lib.path
    
    if (!exists && lib.alt) {
      for (const altPath of lib.alt) {
        const fullAltPath = path.join(process.cwd(), altPath)
        if (fs.existsSync(fullAltPath)) {
          exists = true
          usedPath = altPath
          break
        }
      }
    }
    
    if (exists) {
      const content = fs.readFileSync(path.join(process.cwd(), usedPath), 'utf-8')
      const missingFunctions = lib.functions.filter(fn => !content.includes(`function ${fn}`) && !content.includes(`const ${fn}`))
      
      if (missingFunctions.length === 0) {
        addResult({
          category: 'Library Functions',
          check: lib.name,
          status: 'pass',
          message: `${lib.name} has all required functions`,
          details: { functions: lib.functions }
        })
      } else {
        addResult({
          category: 'Library Functions',
          check: lib.name,
          status: 'fail',
          message: `${lib.name} missing functions: ${missingFunctions.join(', ')}`,
          fix: `Add missing functions to ${usedPath}`
        })
      }
    } else if (lib.required) {
      addResult({
        category: 'Library Functions',
        check: lib.name,
        status: 'fail',
        message: `${lib.name} file missing (REQUIRED)`,
        fix: `Create ${lib.path}`
      })
    }
  }
}

// ========================================
// 6. FEATURE INTEGRATION AUDIT
// ========================================
async function auditFeatureIntegration() {
  log('\n🔗 Auditing Feature Integration...', 'bright')
  
  // Check booking -> quest tracking
  const bookingFiles = [
    'components/booking-widget.tsx',
    'components/booking-checkout.tsx',
  ]

  const bookingQuestIntegrated = bookingFiles.some(file => {
    const bookingPath = path.join(process.cwd(), file)
    if (!fs.existsSync(bookingPath)) return false
    const content = fs.readFileSync(bookingPath, 'utf-8')
    return content.includes('trackBookingQuest') || content.includes('/api/quests/track')
  })

  addResult({
    category: 'Feature Integration',
    check: 'Booking Quest Tracking',
    status: bookingQuestIntegrated ? 'pass' : 'warning',
    message: bookingQuestIntegrated
      ? 'Booking flow integrates quest tracking'
      : 'Booking flow may not track quest progress',
    fix: bookingQuestIntegrated ? undefined : 'Add quest tracking to booking completion flow'
  })
  
  // Check review -> quest tracking
  const reviewFiles = [
    'hooks/use-reviews.ts',
    'app/trips/[id]/review/page.tsx',
  ]

  const reviewQuestIntegrated = reviewFiles.some(file => {
    const reviewPath = path.join(process.cwd(), file)
    if (!fs.existsSync(reviewPath)) return false
    const content = fs.readFileSync(reviewPath, 'utf-8')
    return content.includes('trackReviewQuest') || content.includes('/api/quests/track')
  })

  addResult({
    category: 'Feature Integration',
    check: 'Review Quest Tracking',
    status: reviewQuestIntegrated ? 'pass' : 'warning',
    message: reviewQuestIntegrated
      ? 'Review submission integrates quest tracking'
      : 'Review submission may not track quest progress',
    fix: reviewQuestIntegrated ? undefined : 'Add quest tracking to review submission flow'
  })
  
  // Check wishlist -> quest tracking
  const wishlistApiPath = path.join(process.cwd(), 'app/api/wishlist/route.ts')
  if (fs.existsSync(wishlistApiPath)) {
    const content = fs.readFileSync(wishlistApiPath, 'utf-8')
    if (content.includes('trackQuest') || content.includes('/api/quests/track')) {
      addResult({
        category: 'Feature Integration',
        check: 'Wishlist Quest Tracking',
        status: 'pass',
        message: 'Wishlist actions integrated with quest tracking'
      })
    } else {
      addResult({
        category: 'Feature Integration',
        check: 'Wishlist Quest Tracking',
        status: 'warning',
        message: 'Wishlist actions may not track quest progress',
        fix: 'Add quest tracking to wishlist add/remove flow'
      })
    }
  }
  
  // Check auth -> rewards
  const authApiPath = path.join(process.cwd(), 'app/api/auth')
  if (fs.existsSync(authApiPath)) {
    addResult({
      category: 'Feature Integration',
      check: 'Auth Integration',
      status: 'pass',
      message: 'Authentication system configured'
    })
  } else {
    addResult({
      category: 'Feature Integration',
      check: 'Auth Integration',
      status: 'fail',
      message: 'Authentication system missing',
      fix: 'Set up NextAuth.js authentication'
    })
  }
  
  // Check payment integration
  const paymentApiPath = path.join(process.cwd(), 'app/api/payments/route.ts')
  if (fs.existsSync(paymentApiPath)) {
    const content = fs.readFileSync(paymentApiPath, 'utf-8')
    if (content.includes('stripe') || content.includes('Stripe')) {
      addResult({
        category: 'Feature Integration',
        check: 'Payment Integration',
        status: 'pass',
        message: 'Payment system (Stripe) integrated'
      })
    } else {
      addResult({
        category: 'Feature Integration',
        check: 'Payment Integration',
        status: 'warning',
        message: 'Payment API exists but Stripe integration unclear',
        fix: 'Verify Stripe configuration in payment API'
      })
    }
  } else {
    addResult({
      category: 'Feature Integration',
      check: 'Payment Integration',
      status: 'fail',
      message: 'Payment API missing',
      fix: 'Create payment API with Stripe integration'
    })
  }
}

// ========================================
// 7. DEPENDENCIES AUDIT
// ========================================
async function auditDependencies() {
  log('\n📦 Auditing Dependencies...', 'bright')
  
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    addResult({
      category: 'Dependencies',
      check: 'package.json',
      status: 'fail',
      message: 'package.json not found',
      fix: 'Create package.json file'
    })
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const requiredDeps = [
    { name: 'next', category: 'Core Framework' },
    { name: 'react', category: 'Core Framework' },
    { name: 'react-dom', category: 'Core Framework' },
    { name: '@prisma/client', category: 'Database' },
    { name: 'prisma', category: 'Database', dev: true },
    { name: 'next-auth', category: 'Authentication' },
    { name: 'stripe', category: 'Payments' },
    { name: 'framer-motion', category: 'Animations' },
    { name: 'canvas-confetti', category: 'Animations' },
    { name: 'sonner', category: 'Notifications' },
    { name: 'tailwindcss', category: 'Styling' },
    { name: 'typescript', category: 'Development', dev: true },
    { name: '@types/node', category: 'Development', dev: true },
    { name: '@types/react', category: 'Development', dev: true },
  ]
  
  for (const dep of requiredDeps) {
    if (deps[dep.name]) {
      addResult({
        category: 'Dependencies',
        check: dep.name,
        status: 'pass',
        message: `${dep.name} installed (${deps[dep.name]})`,
        details: { category: dep.category }
      })
    } else {
      addResult({
        category: 'Dependencies',
        check: dep.name,
        status: 'fail',
        message: `${dep.name} not installed`,
        fix: `npm install ${dep.dev ? '--save-dev' : ''} ${dep.name}`
      })
    }
  }
}

// ========================================
// 8. CONFIGURATION FILES AUDIT
// ========================================
async function auditConfigFiles() {
  log('\n⚙️  Auditing Configuration Files...', 'bright')
  
  const configFiles = [
    { path: 'next.config.mjs', alt: ['next.config.js'], name: 'Next.js Config', required: true },
    { path: 'tsconfig.json', name: 'TypeScript Config', required: true },
    { path: 'tailwind.config.ts', alt: ['tailwind.config.js'], name: 'Tailwind Config', required: true },
    { path: 'postcss.config.mjs', alt: ['postcss.config.js'], name: 'PostCSS Config', required: true },
    { path: 'prisma/schema.prisma', name: 'Prisma Schema', required: true },
    { path: '.env', name: 'Environment Variables', required: true },
    { path: '.env.local', name: 'Local Environment Variables', required: false },
    { path: '.eslintrc.json', alt: ['.eslintrc.js'], name: 'ESLint Config', required: false },
    { path: '.prettierrc', alt: ['.prettierrc.json'], name: 'Prettier Config', required: false },
  ]
  
  for (const file of configFiles) {
    const mainPath = path.join(process.cwd(), file.path)
    let exists = fs.existsSync(mainPath)
    let usedPath = file.path
    
    if (!exists && file.alt) {
      for (const altPath of file.alt) {
        const fullAltPath = path.join(process.cwd(), altPath)
        if (fs.existsSync(fullAltPath)) {
          exists = true
          usedPath = altPath
          break
        }
      }
    }
    
    if (exists) {
      addResult({
        category: 'Configuration Files',
        check: file.name,
        status: 'pass',
        message: `${file.name} exists`,
        details: { path: usedPath }
      })
    } else if (file.required) {
      addResult({
        category: 'Configuration Files',
        check: file.name,
        status: 'fail',
        message: `${file.name} missing (REQUIRED)`,
        fix: `Create ${file.path}`
      })
    } else {
      addResult({
        category: 'Configuration Files',
        check: file.name,
        status: 'warning',
        message: `${file.name} missing (optional)`,
        details: { path: file.path }
      })
    }
  }
}

// ========================================
// 9. ENVIRONMENT VARIABLES AUDIT
// ========================================
async function auditEnvironmentVariables() {
  log('\n🔐 Auditing Environment Variables...', 'bright')
  
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent += fs.readFileSync(envPath, 'utf-8')
  }
  if (fs.existsSync(envLocalPath)) {
    envContent += fs.readFileSync(envLocalPath, 'utf-8')
  }
  
  if (!envContent) {
    addResult({
      category: 'Environment Variables',
      check: 'Environment Files',
      status: 'fail',
      message: 'No .env or .env.local file found',
      fix: 'Create .env.local file with required environment variables'
    })
    return
  }
  
  const requiredEnvVars = [
    { name: 'DATABASE_URL', description: 'MongoDB connection string' },
    { name: 'NEXTAUTH_SECRET', description: 'NextAuth secret key' },
    { name: 'NEXTAUTH_URL', description: 'NextAuth URL' },
    { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key', optional: true },
    { name: 'STRIPE_PUBLISHABLE_KEY', description: 'Stripe publishable key', optional: true },
    { name: 'NEXT_PUBLIC_APP_URL', description: 'App URL', optional: true },
  ]
  
  for (const envVar of requiredEnvVars) {
    if (envContent.includes(envVar.name)) {
      addResult({
        category: 'Environment Variables',
        check: envVar.name,
        status: 'pass',
        message: `${envVar.name} configured`,
        details: { description: envVar.description }
      })
    } else if (!envVar.optional) {
      addResult({
        category: 'Environment Variables',
        check: envVar.name,
        status: 'fail',
        message: `${envVar.name} missing (REQUIRED)`,
        fix: `Add ${envVar.name}=${envVar.description} to .env.local`
      })
    } else {
      addResult({
        category: 'Environment Variables',
        check: envVar.name,
        status: 'warning',
        message: `${envVar.name} missing (optional)`,
        details: { description: envVar.description }
      })
    }
  }
}

// ========================================
// 10. TYPE SAFETY AUDIT
// ========================================
async function auditTypeSafety() {
  log('\n🔍 Auditing Type Safety...', 'bright')
  
  const typesDir = path.join(process.cwd(), 'types')
  if (fs.existsSync(typesDir)) {
    addResult({
      category: 'Type Safety',
      check: 'Types Directory',
      status: 'pass',
      message: 'Types directory exists'
    })
    
    const typeFiles = [
      'index.ts',
      'models.ts',
      'api.ts',
      'user.ts',
      'listing.ts',
      'booking.ts',
    ]
    
    for (const file of typeFiles) {
      const filePath = path.join(typesDir, file)
      if (fs.existsSync(filePath)) {
        addResult({
          category: 'Type Safety',
          check: `types/${file}`,
          status: 'pass',
          message: `Type file ${file} exists`
        })
      }
    }
  } else {
    addResult({
      category: 'Type Safety',
      check: 'Types Directory',
      status: 'warning',
      message: 'Types directory missing',
      fix: 'Create types/ directory for TypeScript type definitions'
    })
  }
  
  // Check if Prisma types are generated
  const prismaClientPath = path.join(process.cwd(), 'node_modules/.prisma/client')
  if (fs.existsSync(prismaClientPath)) {
    addResult({
      category: 'Type Safety',
      check: 'Prisma Client Types',
      status: 'pass',
      message: 'Prisma client types generated'
    })
  } else {
    addResult({
      category: 'Type Safety',
      check: 'Prisma Client Types',
      status: 'warning',
      message: 'Prisma client types not generated',
      fix: 'Run: npx prisma generate'
    })
  }
}

// ========================================
// MAIN AUDIT FUNCTION
// ========================================
async function runComprehensiveAudit() {
  log('\n🔍 Starting Comprehensive System Audit...', 'bright')
  log('==========================================================================', 'cyan')
  
  try {
    await auditDatabaseSchema()
    await auditAPIEndpoints()
    await auditFrontendPages()
    await auditCoreComponents()
    await auditLibraryFunctions()
    await auditFeatureIntegration()
    await auditDependencies()
    await auditConfigFiles()
    await auditEnvironmentVariables()
    await auditTypeSafety()
    
    // Generate summary
    log('\n==========================================================================', 'cyan')
    log('📊 AUDIT SUMMARY', 'bright')
    log('==========================================================================', 'cyan')
    
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const warnings = results.filter(r => r.status === 'warning').length
    const total = results.length
    
    log(`\n✅ Passed: ${passed}`, 'green')
    log(`❌ Failed: ${failed}`, 'red')
    log(`⚠️  Warnings: ${warnings}`, 'yellow')
    log(`📝 Total Checks: ${total}`)
    
    const healthScore = Math.round((passed / total) * 100)
    const scoreColor = healthScore >= 90 ? 'green' : healthScore >= 70 ? 'yellow' : 'red'
    log(`\n🎯 System Health Score: ${healthScore}%`, scoreColor)
    
    if (fixes.length > 0) {
      log('\n🔧 FIXES NEEDED:\n', 'bright')
      fixes.forEach((fix, index) => {
        log(`${index + 1}. ${fix}`, 'cyan')
      })
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        warnings,
        healthScore
      },
      results,
      fixes
    }
    
    const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_AUDIT_REPORT.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`\n💾 Full report saved to: COMPREHENSIVE_AUDIT_REPORT.json`, 'blue')
    
    if (failed > 0) {
      log('\n❌ Audit completed with failures. Please review and fix issues.', 'red')
      process.exit(1)
    } else if (warnings > 0) {
      log('\n⚠️  Audit completed with warnings. System is functional but could be improved.', 'yellow')
    } else {
      log('\n✅ Audit completed successfully! System is healthy.', 'green')
    }
    
  } catch (error) {
    log('\n❌ Audit failed with error:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the audit
runComprehensiveAudit()
