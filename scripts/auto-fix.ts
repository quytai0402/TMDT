#!/usr/bin/env tsx

/**
 * 🔧 Auto-Fix Script
 * Automatically fixes common issues found in system audit
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

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

interface FixResult {
  issue: string
  action: string
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  details?: string
}

const fixes: FixResult[] = []

function addFix(fix: FixResult) {
  fixes.push(fix)
  const icon = fix.status === 'SUCCESS' ? '✅' : fix.status === 'FAILED' ? '❌' : '⏭️'
  const color = fix.status === 'SUCCESS' ? 'green' : fix.status === 'FAILED' ? 'red' : 'yellow'
  log(`${icon} ${fix.issue}: ${fix.action}`, color)
  if (fix.details) {
    log(`   Details: ${fix.details}`, 'cyan')
  }
}

// ============================================================================
// FIX 1: Ensure Quests are Seeded
// ============================================================================

async function fixQuestsSeeding() {
  log('\n🎮 Checking Quest Seeding...', 'blue')
  
  try {
    const questCount = await (prisma as any).quest.count()
    
    if (questCount === 0) {
      log('No quests found. Running seed script...', 'yellow')
      try {
        execSync('npx tsx scripts/seed-quests.ts', { stdio: 'inherit' })
        addFix({
          issue: 'No quests in database',
          action: 'Seeded quests',
          status: 'SUCCESS',
        })
      } catch (error) {
        addFix({
          issue: 'No quests in database',
          action: 'Failed to seed quests',
          status: 'FAILED',
          details: String(error),
        })
      }
    } else {
      addFix({
        issue: 'Quest seeding',
        action: `${questCount} quests already exist`,
        status: 'SKIPPED',
      })
    }
  } catch (error) {
    addFix({
      issue: 'Quest collection check',
      action: 'Failed to check quests',
      status: 'FAILED',
      details: String(error),
    })
  }
}

// ============================================================================
// FIX 2: Fix Quest Type Mapping in Tracking API
// ============================================================================

async function fixQuestTypeMapping() {
  log('\n🗺️ Fixing Quest Type Mapping...', 'blue')
  
  const trackingApiPath = path.join(process.cwd(), 'app/api/quests/track/route.ts')
  
  if (!fs.existsSync(trackingApiPath)) {
    addFix({
      issue: 'Quest tracking API missing',
      action: 'Cannot fix - file does not exist',
      status: 'FAILED',
    })
    return
  }

  let content = fs.readFileSync(trackingApiPath, 'utf-8')
  let changed = false

  // Define correct mappings
  const correctMappings: Record<string, string[]> = {
    'BOOKING_CREATED': ['BOOKING'],
    'BOOKING_COMPLETED': ['BOOKING'],
    'REVIEW_CREATED': ['REVIEW'],
    'WISHLIST_ADDED': ['EXPLORATION'],
    'PROFILE_COMPLETED': ['PROFILE_COMPLETION'],
    'PROFILE_UPDATED': ['PROFILE_COMPLETION'],
    'EMAIL_VERIFIED': ['PROFILE_COMPLETION'],
    'PHONE_VERIFIED': ['PROFILE_COMPLETION'],
    'PAYMENT_METHOD_ADDED': ['PROFILE_COMPLETION'],
    'COLLECTION_CREATED': ['SOCIAL'],
    'LISTING_VIEWED': ['EXPLORATION'],
    'LISTING_SHARED': ['SOCIAL'],
    'POST_CREATED': ['SOCIAL'],
    'DAILY_CHECK_IN': ['DAILY_CHECK_IN'],
    'REFERRAL_COMPLETED': ['REFERRAL'],
    'STREAK_MILESTONE': ['STREAK'],
  }

  // Check if old mapping exists and needs update
  const oldMappings = [
    'FIRST_BOOKING',
    'COMPLETE_BOOKING',
    'WRITE_REVIEW',
    'ADD_WISHLIST',
    'VIEW_LISTINGS',
    'SHARE_LISTING',
  ]

  for (const oldMapping of oldMappings) {
    if (content.includes(`'${oldMapping}'`) || content.includes(`"${oldMapping}"`)) {
      changed = true
      break
    }
  }

  if (changed) {
    // Create new mapping string
    const mappingStr = Object.entries(correctMappings)
      .map(([trigger, types]) => `      '${trigger}': ${JSON.stringify(types)},`)
      .join('\n')

    // Replace the questTypeMap
    const mapRegex = /const questTypeMap: Record<string, string\[]> = \{[^}]+\}/
    if (mapRegex.test(content)) {
      content = content.replace(
        mapRegex,
        `const questTypeMap: Record<string, string[]> = {\n${mappingStr}\n    }`
      )
      
      fs.writeFileSync(trackingApiPath, content, 'utf-8')
      addFix({
        issue: 'Quest type mapping outdated',
        action: 'Updated questTypeMap with correct enum values',
        status: 'SUCCESS',
      })
    } else {
      addFix({
        issue: 'Quest type mapping',
        action: 'Could not find questTypeMap to update',
        status: 'FAILED',
      })
    }
  } else {
    addFix({
      issue: 'Quest type mapping',
      action: 'Already correct',
      status: 'SKIPPED',
    })
  }
}

// ============================================================================
// FIX 3: Fix SSR Issues in Components
// ============================================================================

async function fixSSRIssues() {
  log('\n🖥️ Fixing SSR Issues...', 'blue')
  
  const componentsToCheck = [
    'components/share-button.tsx',
  ]

  for (const componentPath of componentsToCheck) {
    const fullPath = path.join(process.cwd(), componentPath)
    
    if (!fs.existsSync(fullPath)) {
      addFix({
        issue: `SSR check: ${componentPath}`,
        action: 'File not found',
        status: 'SKIPPED',
      })
      continue
    }

    let content = fs.readFileSync(fullPath, 'utf-8')
    let changed = false

    // Check for window.location without typeof check
    const windowLocationRegex = /window\.location(?!.*typeof window)/g
    if (windowLocationRegex.test(content)) {
      // Add typeof check
      content = content.replace(
        /(\s+)(const \w+ = .*?)window\.location/g,
        '$1$2typeof window !== \'undefined\' ? window.location'
      )
      changed = true
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf-8')
      addFix({
        issue: `SSR issue in ${componentPath}`,
        action: 'Added typeof window checks',
        status: 'SUCCESS',
      })
    } else {
      addFix({
        issue: `SSR check: ${componentPath}`,
        action: 'No issues found',
        status: 'SKIPPED',
      })
    }
  }
}

// ============================================================================
// FIX 4: Ensure Reward Tiers Exist
// ============================================================================

async function fixRewardTiers() {
  log('\n🏆 Checking Reward Tiers...', 'blue')
  
  try {
    const tierCount = await (prisma as any).rewardTier.count()
    
    if (tierCount === 0) {
      addFix({
        issue: 'No reward tiers',
        action: 'Please run: npx tsx scripts/seed-rewards.ts',
        status: 'FAILED',
        details: 'Reward tiers must be seeded using the dedicated script',
      })
    } else {
      addFix({
        issue: 'Reward tiers',
        action: `${tierCount} tiers already exist`,
        status: 'SKIPPED',
      })
    }
  } catch (error) {
    addFix({
      issue: 'Reward tier check',
      action: 'Failed to check tiers',
      status: 'FAILED',
      details: String(error),
    })
  }
}

// ============================================================================
// FIX 5: Install Missing Dependencies
// ============================================================================

async function fixDependencies() {
  log('\n📦 Checking Dependencies...', 'blue')
  
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  const requiredDeps = [
    'framer-motion',
    'canvas-confetti',
    '@types/canvas-confetti',
  ]

  const missingDeps = requiredDeps.filter(dep => !allDeps[dep])

  if (missingDeps.length > 0) {
    log(`Installing missing dependencies: ${missingDeps.join(', ')}`, 'yellow')
    try {
      execSync(`pnpm add ${missingDeps.join(' ')}`, { stdio: 'inherit' })
      addFix({
        issue: 'Missing dependencies',
        action: `Installed ${missingDeps.length} packages`,
        status: 'SUCCESS',
        details: missingDeps.join(', '),
      })
    } catch (error) {
      addFix({
        issue: 'Installing dependencies',
        action: 'Failed to install',
        status: 'FAILED',
        details: String(error),
      })
    }
  } else {
    addFix({
      issue: 'Dependencies',
      action: 'All required packages installed',
      status: 'SKIPPED',
    })
  }
}

// ============================================================================
// FIX 6: Create Missing Directories
// ============================================================================

async function fixDirectories() {
  log('\n📁 Checking Directories...', 'blue')
  
  const requiredDirs = [
    'app/demo/quests',
    'scripts',
    'components',
  ]

  for (const dir of requiredDirs) {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true })
        addFix({
          issue: `Missing directory: ${dir}`,
          action: 'Created directory',
          status: 'SUCCESS',
        })
      } catch (error) {
        addFix({
          issue: `Creating directory: ${dir}`,
          action: 'Failed',
          status: 'FAILED',
          details: String(error),
        })
      }
    } else {
      addFix({
        issue: `Directory: ${dir}`,
        action: 'Already exists',
        status: 'SKIPPED',
      })
    }
  }
}

// ============================================================================
// MAIN AUTO-FIX FUNCTION
// ============================================================================

async function runAutoFix() {
  log('🔧 Starting Auto-Fix...', 'cyan')
  log('=' .repeat(80), 'cyan')

  try {
    await fixDirectories()
    await fixDependencies()
    await fixQuestsSeeding()
    await fixRewardTiers()
    await fixQuestTypeMapping()
    await fixSSRIssues()

    // Summary
    log('\n' + '='.repeat(80), 'cyan')
    log('📊 AUTO-FIX SUMMARY', 'cyan')
    log('=' .repeat(80), 'cyan')

    const success = fixes.filter(f => f.status === 'SUCCESS').length
    const failed = fixes.filter(f => f.status === 'FAILED').length
    const skipped = fixes.filter(f => f.status === 'SKIPPED').length

    log(`\n✅ Fixed: ${success}`, 'green')
    log(`❌ Failed: ${failed}`, 'red')
    log(`⏭️  Skipped: ${skipped}`, 'yellow')
    log(`📝 Total Fixes Attempted: ${fixes.length}`, 'blue')

    // List failures
    const failures = fixes.filter(f => f.status === 'FAILED')
    if (failures.length > 0) {
      log('\n❌ MANUAL INTERVENTION NEEDED:', 'red')
      failures.forEach((failure, index) => {
        log(`\n${index + 1}. ${failure.issue}: ${failure.action}`, 'red')
        if (failure.details) {
          log(`   Details: ${failure.details}`, 'yellow')
        }
      })
    }

    // Save results
    const reportPath = path.join(process.cwd(), 'AUTO_FIX_REPORT.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { success, failed, skipped, total: fixes.length },
      fixes,
    }, null, 2))

    log(`\n💾 Full report saved to: AUTO_FIX_REPORT.json`, 'blue')

    if (failed > 0) {
      log('\n⚠️  Some fixes failed. Please review and fix manually.', 'yellow')
      process.exit(1)
    } else {
      log('\n✅ All fixes applied successfully!', 'green')
      log('💡 Run "npx tsx scripts/audit-system.ts" to verify fixes.', 'cyan')
      process.exit(0)
    }

  } catch (error) {
    log('\n💥 Auto-fix failed with error:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run auto-fix
runAutoFix()
