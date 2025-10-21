#!/usr/bin/env tsx

/**
 * 🔍 System Audit Script
 * Comprehensive system check for backend/frontend consistency
 * Validates: APIs, components, database schema, quest system, rewards integration
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface AuditResult {
  category: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
  fix?: string
}

const results: AuditResult[] = []

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function addResult(result: AuditResult) {
  results.push(result)
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
  const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow'
  log(`${icon} [${result.category}] ${result.message}`, color)
  if (result.details) {
    console.log('   Details:', result.details)
  }
  if (result.fix) {
    log(`   Fix: ${result.fix}`, 'cyan')
  }
}

// ============================================================================
// 1. DATABASE SCHEMA CHECKS
// ============================================================================

async function auditDatabaseSchema() {
  log('\n📊 Auditing Database Schema...', 'blue')

  try {
    // Check if Quest model exists
    const questCount = await (prisma as any).quest.count()
    addResult({
      category: 'Database',
      status: 'PASS',
      message: `Quest collection exists with ${questCount} documents`,
    })
  } catch (error) {
    addResult({
      category: 'Database',
      status: 'FAIL',
      message: 'Quest collection not found',
      details: error,
      fix: 'Run: npx prisma db push',
    })
  }

  try {
    // Check UserQuest model
    const userQuestCount = await (prisma as any).userQuest.count()
    addResult({
      category: 'Database',
      status: 'PASS',
      message: `UserQuest collection exists with ${userQuestCount} documents`,
    })
  } catch (error) {
    addResult({
      category: 'Database',
      status: 'FAIL',
      message: 'UserQuest collection not found',
      details: error,
      fix: 'Run: npx prisma db push',
    })
  }

  try {
    // Check RewardTransaction model
    const rewardCount = await (prisma as any).rewardTransaction.count()
    addResult({
      category: 'Database',
      status: 'PASS',
      message: `RewardTransaction collection exists with ${rewardCount} documents`,
    })
  } catch (error) {
    addResult({
      category: 'Database',
      status: 'FAIL',
      message: 'RewardTransaction collection not found',
      details: error,
      fix: 'Run: npx prisma db push',
    })
  }

  try {
    // Check RewardTier model
    const tierCount = await (prisma as any).rewardTier.count()
    addResult({
      category: 'Database',
      status: 'PASS',
      message: `RewardTier collection exists with ${tierCount} documents`,
    })
  } catch (error) {
    addResult({
      category: 'Database',
      status: 'FAIL',
      message: 'RewardTier collection not found',
      details: error,
      fix: 'Run: npx prisma db push',
    })
  }
}

// ============================================================================
// 2. QUEST SYSTEM CHECKS
// ============================================================================

async function auditQuestSystem() {
  log('\n🎮 Auditing Quest System...', 'blue')

  try {
    const quests = await (prisma as any).quest.findMany({
      where: { isActive: true },
    })

    if (quests.length === 0) {
      addResult({
        category: 'Quest System',
        status: 'FAIL',
        message: 'No active quests found in database',
        fix: 'Run: npx tsx scripts/seed-quests.ts',
      })
    } else {
      addResult({
        category: 'Quest System',
        status: 'PASS',
        message: `Found ${quests.length} active quests`,
        details: {
          daily: quests.filter((q: any) => q.isDaily).length,
          weekly: quests.filter((q: any) => q.isWeekly).length,
          oneTime: quests.filter((q: any) => !q.isDaily && !q.isWeekly).length,
        },
      })
    }

    // Check quest types
    const validTypes = ['PROFILE_COMPLETION', 'BOOKING', 'REVIEW', 'EXPLORATION', 'SOCIAL', 'DAILY_CHECK_IN', 'STREAK', 'REFERRAL']
    const invalidQuests = quests.filter((q: any) => !validTypes.includes(q.type))
    
    if (invalidQuests.length > 0) {
      addResult({
        category: 'Quest System',
        status: 'FAIL',
        message: `Found ${invalidQuests.length} quests with invalid types`,
        details: invalidQuests.map((q: any) => ({ id: q.id, type: q.type })),
        fix: 'Update quest types to match enum values',
      })
    } else {
      addResult({
        category: 'Quest System',
        status: 'PASS',
        message: 'All quest types are valid',
      })
    }

    // Check quest points
    const questsWithZeroPoints = quests.filter((q: any) => q.points === 0)
    if (questsWithZeroPoints.length > 0) {
      addResult({
        category: 'Quest System',
        status: 'WARNING',
        message: `Found ${questsWithZeroPoints.length} quests with 0 points`,
        details: questsWithZeroPoints.map((q: any) => q.title),
      })
    }

    // Check quest target counts
    const questsWithInvalidTargets = quests.filter((q: any) => q.targetCount <= 0)
    if (questsWithInvalidTargets.length > 0) {
      addResult({
        category: 'Quest System',
        status: 'FAIL',
        message: `Found ${questsWithInvalidTargets.length} quests with invalid target counts`,
        details: questsWithInvalidTargets.map((q: any) => ({ title: q.title, target: q.targetCount })),
        fix: 'Update targetCount to be > 0',
      })
    }

  } catch (error) {
    addResult({
      category: 'Quest System',
      status: 'FAIL',
      message: 'Error accessing quest data',
      details: error,
    })
  }
}

// ============================================================================
// 3. API ENDPOINTS CHECKS
// ============================================================================

async function auditAPIEndpoints() {
  log('\n🌐 Auditing API Endpoints...', 'blue')

  const apiDir = path.join(process.cwd(), 'app', 'api')
  const requiredEndpoints = [
    'quests/route.ts',
    'quests/track/route.ts',
    'quests/[id]/progress/route.ts',
    'rewards/tiers/route.ts',
    'rewards/actions/route.ts',
    'rewards/history/route.ts',
    'user/profile/route.ts',
  ]

  for (const endpoint of requiredEndpoints) {
    const fullPath = path.join(apiDir, endpoint)
    if (fs.existsSync(fullPath)) {
      // Check if file has GET or POST methods
      const content = fs.readFileSync(fullPath, 'utf-8')
      const hasGet = content.includes('export async function GET')
      const hasPost = content.includes('export async function POST')
      
      addResult({
        category: 'API Endpoints',
        status: 'PASS',
        message: `${endpoint} exists`,
        details: {
          methods: [hasGet && 'GET', hasPost && 'POST'].filter(Boolean),
        },
      })
    } else {
      addResult({
        category: 'API Endpoints',
        status: 'FAIL',
        message: `${endpoint} not found`,
        fix: `Create API endpoint at app/api/${endpoint}`,
      })
    }
  }
}

// ============================================================================
// 4. QUEST TRACKING INTEGRATION CHECKS
// ============================================================================

async function auditQuestTracking() {
  log('\n🔗 Auditing Quest Tracking Integration...', 'blue')

  const integrationPoints = [
    {
      file: 'components/booking-widget.tsx',
      keyword: 'trackBookingQuest',
      description: 'Booking tracking',
    },
    {
      file: 'hooks/use-reviews.ts',
      keyword: 'trackReviewQuest',
      description: 'Review tracking',
    },
    {
      file: 'app/api/wishlist/route.ts',
      keyword: 'WISHLIST_ADDED',
      description: 'Wishlist tracking',
    },
    {
      file: 'components/listing-view-tracker.tsx',
      keyword: 'trackListingViewQuest',
      description: 'Listing view tracking',
    },
    {
      file: 'components/share-button.tsx',
      keyword: 'trackListingShareQuest',
      description: 'Share tracking',
    },
  ]

  for (const point of integrationPoints) {
    const fullPath = path.join(process.cwd(), point.file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (content.includes(point.keyword)) {
        addResult({
          category: 'Quest Tracking',
          status: 'PASS',
          message: `${point.description} integrated in ${point.file}`,
        })
      } else {
        addResult({
          category: 'Quest Tracking',
          status: 'FAIL',
          message: `${point.description} not found in ${point.file}`,
          details: `Missing keyword: ${point.keyword}`,
          fix: `Add quest tracking to ${point.file}`,
        })
      }
    } else {
      addResult({
        category: 'Quest Tracking',
        status: 'FAIL',
        message: `Integration file not found: ${point.file}`,
        fix: `Create ${point.file}`,
      })
    }
  }
}

// ============================================================================
// 5. COMPONENT CONSISTENCY CHECKS
// ============================================================================

async function auditComponents() {
  log('\n🎨 Auditing Frontend Components...', 'blue')

  const requiredComponents = [
    'components/quests-panel.tsx',
    'components/quest-completion-modal.tsx',
    'components/points-earned-notification.tsx',
    'components/user-rewards-badge.tsx',
    'components/daily-check-in.tsx',
    'components/listing-view-tracker.tsx',
    'components/share-button.tsx',
  ]

  for (const component of requiredComponents) {
    const fullPath = path.join(process.cwd(), component)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      
      // Check if it's a client component
      const isClientComponent = content.includes("'use client'")
      const hasExport = content.includes('export')
      
      addResult({
        category: 'Components',
        status: 'PASS',
        message: `${component} exists`,
        details: {
          isClientComponent,
          hasExport,
        },
      })
    } else {
      addResult({
        category: 'Components',
        status: 'FAIL',
        message: `${component} not found`,
        fix: `Create component: ${component}`,
      })
    }
  }
}

// ============================================================================
// 6. LIBRARY FUNCTIONS CHECKS
// ============================================================================

async function auditLibraries() {
  log('\n📚 Auditing Library Functions...', 'blue')

  const libFiles = [
    { file: 'lib/quests.ts', functions: ['trackQuestProgress', 'trackBookingQuest', 'trackReviewQuest'] },
    { file: 'lib/rewards.ts', functions: ['awardPoints', 'checkTierUpgrade'] },
  ]

  for (const lib of libFiles) {
    const fullPath = path.join(process.cwd(), lib.file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      const missingFunctions = lib.functions.filter(fn => !content.includes(fn))
      
      if (missingFunctions.length === 0) {
        addResult({
          category: 'Library Functions',
          status: 'PASS',
          message: `${lib.file} has all required functions`,
          details: { functions: lib.functions },
        })
      } else {
        addResult({
          category: 'Library Functions',
          status: 'FAIL',
          message: `${lib.file} missing functions`,
          details: { missing: missingFunctions },
          fix: `Add missing functions to ${lib.file}`,
        })
      }
    } else {
      addResult({
        category: 'Library Functions',
        status: 'FAIL',
        message: `${lib.file} not found`,
        fix: `Create library file: ${lib.file}`,
      })
    }
  }
}

// ============================================================================
// 7. QUEST TYPE MAPPING CONSISTENCY
// ============================================================================

async function auditQuestTypeMapping() {
  log('\n🗺️ Auditing Quest Type Mapping...', 'blue')

  // Check if tracking API has correct mapping
  const trackingApiPath = path.join(process.cwd(), 'app/api/quests/track/route.ts')
  if (fs.existsSync(trackingApiPath)) {
    const content = fs.readFileSync(trackingApiPath, 'utf-8')
    
    const requiredMappings = [
      { trigger: 'BOOKING_CREATED', type: 'BOOKING' },
      { trigger: 'REVIEW_CREATED', type: 'REVIEW' },
      { trigger: 'WISHLIST_ADDED', type: 'EXPLORATION' },
      { trigger: 'LISTING_VIEWED', type: 'EXPLORATION' },
      { trigger: 'LISTING_SHARED', type: 'SOCIAL' },
      { trigger: 'DAILY_CHECK_IN', type: 'DAILY_CHECK_IN' },
    ]

    let allMappingsFound = true
    const missingMappings: string[] = []

    for (const mapping of requiredMappings) {
      if (!content.includes(`'${mapping.trigger}'`) && !content.includes(`"${mapping.trigger}"`)) {
        allMappingsFound = false
        missingMappings.push(mapping.trigger)
      }
    }

    if (allMappingsFound) {
      addResult({
        category: 'Type Mapping',
        status: 'PASS',
        message: 'All quest type mappings are present',
      })
    } else {
      addResult({
        category: 'Type Mapping',
        status: 'FAIL',
        message: 'Missing quest type mappings',
        details: { missing: missingMappings },
        fix: 'Update questTypeMap in app/api/quests/track/route.ts',
      })
    }
  } else {
    addResult({
      category: 'Type Mapping',
      status: 'FAIL',
      message: 'Tracking API not found',
      fix: 'Create app/api/quests/track/route.ts',
    })
  }
}

// ============================================================================
// 8. REWARDS TIER SYSTEM CHECKS
// ============================================================================

async function auditRewardsTiers() {
  log('\n🏆 Auditing Rewards Tier System...', 'blue')

  try {
    const tiers = await (prisma as any).rewardTier.findMany({
      orderBy: { minPoints: 'asc' },
    })

    if (tiers.length === 0) {
      addResult({
        category: 'Rewards Tiers',
        status: 'FAIL',
        message: 'No reward tiers found in database',
        fix: 'Run: npx tsx scripts/seed-rewards.ts',
      })
    } else {
      addResult({
        category: 'Rewards Tiers',
        status: 'PASS',
        message: `Found ${tiers.length} reward tiers`,
        details: tiers.map((t: any) => ({ tier: t.tier, minPoints: t.minPoints })),
      })

      // Check for gaps in tier progression
      for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].minPoints <= tiers[i - 1].minPoints) {
          addResult({
            category: 'Rewards Tiers',
            status: 'FAIL',
            message: 'Tier progression is not sequential',
            details: { tier1: tiers[i - 1], tier2: tiers[i] },
            fix: 'Update minPoints to be sequential',
          })
        }
      }
    }
  } catch (error) {
    addResult({
      category: 'Rewards Tiers',
      status: 'FAIL',
      message: 'Error accessing reward tier data',
      details: error,
    })
  }
}

// ============================================================================
// 9. FRONTEND PAGES CHECKS
// ============================================================================

async function auditPages() {
  log('\n📄 Auditing Frontend Pages...', 'blue')

  const requiredPages = [
    'app/rewards/page.tsx',
    'app/demo/quests/page.tsx',
    'app/trips/page.tsx',
  ]

  for (const page of requiredPages) {
    const fullPath = path.join(process.cwd(), page)
    if (fs.existsSync(fullPath)) {
      addResult({
        category: 'Pages',
        status: 'PASS',
        message: `${page} exists`,
      })
    } else {
      addResult({
        category: 'Pages',
        status: 'FAIL',
        message: `${page} not found`,
        fix: `Create page: ${page}`,
      })
    }
  }
}

// ============================================================================
// 10. DEPENDENCY CHECKS
// ============================================================================

async function auditDependencies() {
  log('\n📦 Auditing Dependencies...', 'blue')

  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const requiredDeps = [
      'framer-motion',
      'canvas-confetti',
      '@types/canvas-confetti',
      'sonner',
    ]

    for (const dep of requiredDeps) {
      if (dependencies[dep]) {
        addResult({
          category: 'Dependencies',
          status: 'PASS',
          message: `${dep} installed (${dependencies[dep]})`,
        })
      } else {
        addResult({
          category: 'Dependencies',
          status: 'FAIL',
          message: `${dep} not installed`,
          fix: `Run: pnpm add ${dep}`,
        })
      }
    }
  }
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

async function runAudit() {
  log('🔍 Starting System Audit...', 'cyan')
  log('=' .repeat(80), 'cyan')

  try {
    await auditDatabaseSchema()
    await auditQuestSystem()
    await auditAPIEndpoints()
    await auditQuestTracking()
    await auditComponents()
    await auditLibraries()
    await auditQuestTypeMapping()
    await auditRewardsTiers()
    await auditPages()
    await auditDependencies()

    // Summary
    log('\n' + '='.repeat(80), 'cyan')
    log('📊 AUDIT SUMMARY', 'cyan')
    log('=' .repeat(80), 'cyan')

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    const warnings = results.filter(r => r.status === 'WARNING').length

    log(`\n✅ Passed: ${passed}`, 'green')
    log(`❌ Failed: ${failed}`, 'red')
    log(`⚠️  Warnings: ${warnings}`, 'yellow')
    log(`📝 Total Checks: ${results.length}`, 'blue')

    const score = Math.round((passed / results.length) * 100)
    log(`\n🎯 System Health Score: ${score}%`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red')

    // List all failures and their fixes
    const failures = results.filter(r => r.status === 'FAIL')
    if (failures.length > 0) {
      log('\n🔧 FIXES NEEDED:', 'yellow')
      failures.forEach((failure, index) => {
        log(`\n${index + 1}. ${failure.message}`, 'yellow')
        if (failure.fix) {
          log(`   Fix: ${failure.fix}`, 'cyan')
        }
      })
    }

    // Save results to file
    const reportPath = path.join(process.cwd(), 'AUDIT_REPORT.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed, failed, warnings, total: results.length, score },
      results,
    }, null, 2))

    log(`\n💾 Full report saved to: AUDIT_REPORT.json`, 'blue')

    if (failed > 0) {
      log('\n❌ Audit completed with failures. Please review and fix issues.', 'red')
      process.exit(1)
    } else {
      log('\n✅ Audit completed successfully! System is healthy.', 'green')
      process.exit(0)
    }

  } catch (error) {
    log('\n💥 Audit failed with error:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the audit
runAudit()
