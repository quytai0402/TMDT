#!/usr/bin/env tsx

/**
 * COMPREHENSIVE AUTO-FIX
 * Tự động sửa các vấn đề phổ biến trong toàn bộ hệ thống
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

interface FixResult {
  category: string
  fix: string
  status: 'success' | 'failed' | 'skipped'
  message: string
  details?: any
}

const results: FixResult[] = []

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function addResult(result: FixResult) {
  results.push(result)
  const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'
  const color = result.status === 'success' ? 'green' : result.status === 'failed' ? 'red' : 'yellow'
  log(`${icon} [${result.category}] ${result.message}`, color)
  if (result.details) {
    console.log('   Details:', result.details)
  }
}

// ========================================
// 1. FIX MISSING DIRECTORIES
// ========================================
async function fixMissingDirectories() {
  log('\n📁 Fixing Missing Directories...', 'bright')
  
  const requiredDirs = [
    'app/api',
    'components',
    'lib',
    'types',
    'hooks',
    'public',
    'styles',
    'prisma',
  ]
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true })
        addResult({
          category: 'Directories',
          fix: `Create ${dir}`,
          status: 'success',
          message: `Created directory: ${dir}`
        })
      } catch (error) {
        addResult({
          category: 'Directories',
          fix: `Create ${dir}`,
          status: 'failed',
          message: `Failed to create directory: ${dir}`,
          details: error
        })
      }
    } else {
      addResult({
        category: 'Directories',
        fix: `Create ${dir}`,
        status: 'skipped',
        message: `Directory already exists: ${dir}`
      })
    }
  }
}

// ========================================
// 2. FIX MISSING CORE COMPONENTS
// ========================================
async function fixMissingCoreComponents() {
  log('\n🎨 Fixing Missing Core Components...', 'bright')
  
  // Create basic UI button if missing
  const buttonPath = path.join(process.cwd(), 'components/ui/button.tsx')
  if (!fs.existsSync(buttonPath)) {
    try {
      fs.mkdirSync(path.dirname(buttonPath), { recursive: true })
      fs.writeFileSync(buttonPath, `import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "border border-input hover:bg-accent": variant === "outline",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
`)
      addResult({
        category: 'Core Components',
        fix: 'Create Button component',
        status: 'success',
        message: 'Created components/ui/button.tsx'
      })
    } catch (error) {
      addResult({
        category: 'Core Components',
        fix: 'Create Button component',
        status: 'failed',
        message: 'Failed to create Button component',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Core Components',
      fix: 'Create Button component',
      status: 'skipped',
      message: 'Button component already exists'
    })
  }
}

// ========================================
// 3. FIX MISSING LIB FILES
// ========================================
async function fixMissingLibFiles() {
  log('\n📚 Fixing Missing Library Files...', 'bright')
  
  // Create utils.ts if missing
  const utilsPath = path.join(process.cwd(), 'lib/utils.ts')
  if (!fs.existsSync(utilsPath)) {
    try {
      fs.mkdirSync(path.dirname(utilsPath), { recursive: true })
      fs.writeFileSync(utilsPath, `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`)
      addResult({
        category: 'Library Files',
        fix: 'Create utils.ts',
        status: 'success',
        message: 'Created lib/utils.ts'
      })
    } catch (error) {
      addResult({
        category: 'Library Files',
        fix: 'Create utils.ts',
        status: 'failed',
        message: 'Failed to create utils.ts',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Library Files',
      fix: 'Create utils.ts',
      status: 'skipped',
      message: 'utils.ts already exists'
    })
  }
  
  // Create db.ts if missing
  const dbPath = path.join(process.cwd(), 'lib/db.ts')
  const prismaPath = path.join(process.cwd(), 'lib/prisma.ts')
  if (!fs.existsSync(dbPath) && !fs.existsSync(prismaPath)) {
    try {
      fs.writeFileSync(dbPath, `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
`)
      addResult({
        category: 'Library Files',
        fix: 'Create db.ts',
        status: 'success',
        message: 'Created lib/db.ts'
      })
    } catch (error) {
      addResult({
        category: 'Library Files',
        fix: 'Create db.ts',
        status: 'failed',
        message: 'Failed to create db.ts',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Library Files',
      fix: 'Create db.ts',
      status: 'skipped',
      message: 'Database client already exists'
    })
  }
}

// ========================================
// 4. SEED INITIAL DATA
// ========================================
async function seedInitialData() {
  log('\n🌱 Seeding Initial Data...', 'bright')
  
  // Seed reward tiers
  try {
    const tierCount = await (prisma as any).rewardTier.count()
    if (tierCount === 0) {
      log('   Running reward tiers seed...', 'cyan')
      execSync('npx tsx scripts/seed-rewards.ts', { stdio: 'inherit' })
      addResult({
        category: 'Data Seeding',
        fix: 'Seed reward tiers',
        status: 'success',
        message: 'Reward tiers seeded successfully'
      })
    } else {
      addResult({
        category: 'Data Seeding',
        fix: 'Seed reward tiers',
        status: 'skipped',
        message: `Reward tiers already exist (${tierCount} tiers)`
      })
    }
  } catch (error) {
    addResult({
      category: 'Data Seeding',
      fix: 'Seed reward tiers',
      status: 'failed',
      message: 'Failed to seed reward tiers',
      details: error
    })
  }
  
  // Seed quests
  try {
    const questCount = await (prisma as any).quest.count()
    if (questCount === 0) {
      log('   Running quests seed...', 'cyan')
      execSync('npx tsx scripts/seed-quests.ts', { stdio: 'inherit' })
      addResult({
        category: 'Data Seeding',
        fix: 'Seed quests',
        status: 'success',
        message: 'Quests seeded successfully'
      })
    } else {
      addResult({
        category: 'Data Seeding',
        fix: 'Seed quests',
        status: 'skipped',
        message: `Quests already exist (${questCount} quests)`
      })
    }
  } catch (error) {
    addResult({
      category: 'Data Seeding',
      fix: 'Seed quests',
      status: 'failed',
      message: 'Failed to seed quests',
      details: error
    })
  }
}

// ========================================
// 5. FIX PRISMA SETUP
// ========================================
async function fixPrismaSetup() {
  log('\n🗄️  Fixing Prisma Setup...', 'bright')
  
  // Check if Prisma client is generated
  const prismaClientPath = path.join(process.cwd(), 'node_modules/.prisma/client')
  if (!fs.existsSync(prismaClientPath)) {
    try {
      log('   Generating Prisma client...', 'cyan')
      execSync('npx prisma generate', { stdio: 'inherit' })
      addResult({
        category: 'Prisma Setup',
        fix: 'Generate Prisma client',
        status: 'success',
        message: 'Prisma client generated successfully'
      })
    } catch (error) {
      addResult({
        category: 'Prisma Setup',
        fix: 'Generate Prisma client',
        status: 'failed',
        message: 'Failed to generate Prisma client',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Prisma Setup',
      fix: 'Generate Prisma client',
      status: 'skipped',
      message: 'Prisma client already generated'
    })
  }
}

// ========================================
// 6. FIX SSR ISSUES
// ========================================
async function fixSSRIssues() {
  log('\n🔧 Fixing SSR Issues...', 'bright')
  
  const filesToCheck = [
    'components/share-button.tsx',
    'components/listing-view-tracker.tsx',
    'components/quests-panel.tsx',
  ]
  
  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8')
      let modified = false
      
      // Check for window usage without typeof check
      const windowRegex = /(?<!typeof )window\./g
      if (windowRegex.test(content) && !content.includes("'use client'")) {
        // Check if already has 'use client'
        if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
          content = "'use client'\n\n" + content
          modified = true
        }
      }
      
      if (modified) {
        try {
          fs.writeFileSync(filePath, content)
          addResult({
            category: 'SSR Issues',
            fix: `Fix ${file}`,
            status: 'success',
            message: `Added 'use client' to ${file}`
          })
        } catch (error) {
          addResult({
            category: 'SSR Issues',
            fix: `Fix ${file}`,
            status: 'failed',
            message: `Failed to fix ${file}`,
            details: error
          })
        }
      } else {
        addResult({
          category: 'SSR Issues',
          fix: `Fix ${file}`,
          status: 'skipped',
          message: `${file} already has proper SSR handling`
        })
      }
    }
  }
}

// ========================================
// 7. INSTALL MISSING DEPENDENCIES
// ========================================
async function installMissingDependencies() {
  log('\n📦 Checking Dependencies...', 'bright')
  
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    addResult({
      category: 'Dependencies',
      fix: 'Check dependencies',
      status: 'failed',
      message: 'package.json not found'
    })
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const missingDeps: string[] = []
  const missingDevDeps: string[] = []
  
  // Check required dependencies
  const requiredDeps = ['framer-motion', 'canvas-confetti', 'sonner', 'clsx', 'tailwind-merge']
  const requiredDevDeps = ['@types/canvas-confetti']
  
  for (const dep of requiredDeps) {
    if (!deps[dep]) {
      missingDeps.push(dep)
    }
  }
  
  for (const dep of requiredDevDeps) {
    if (!deps[dep]) {
      missingDevDeps.push(dep)
    }
  }
  
  if (missingDeps.length > 0) {
    try {
      log(`   Installing missing dependencies: ${missingDeps.join(', ')}`, 'cyan')
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' })
      addResult({
        category: 'Dependencies',
        fix: 'Install missing dependencies',
        status: 'success',
        message: `Installed ${missingDeps.length} missing dependencies`
      })
    } catch (error) {
      addResult({
        category: 'Dependencies',
        fix: 'Install missing dependencies',
        status: 'failed',
        message: 'Failed to install dependencies',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Dependencies',
      fix: 'Install missing dependencies',
      status: 'skipped',
      message: 'All required dependencies already installed'
    })
  }
  
  if (missingDevDeps.length > 0) {
    try {
      log(`   Installing missing dev dependencies: ${missingDevDeps.join(', ')}`, 'cyan')
      execSync(`npm install --save-dev ${missingDevDeps.join(' ')}`, { stdio: 'inherit' })
      addResult({
        category: 'Dependencies',
        fix: 'Install missing dev dependencies',
        status: 'success',
        message: `Installed ${missingDevDeps.length} missing dev dependencies`
      })
    } catch (error) {
      addResult({
        category: 'Dependencies',
        fix: 'Install missing dev dependencies',
        status: 'failed',
        message: 'Failed to install dev dependencies',
        details: error
      })
    }
  } else {
    addResult({
      category: 'Dependencies',
      fix: 'Install missing dev dependencies',
      status: 'skipped',
      message: 'All required dev dependencies already installed'
    })
  }
}

// ========================================
// 8. FIX TYPESCRIPT ERRORS
// ========================================
async function fixTypeScriptErrors() {
  log('\n🔍 Checking TypeScript Errors...', 'bright')
  
  try {
    log('   Running TypeScript compiler...', 'cyan')
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    addResult({
      category: 'TypeScript',
      fix: 'Check TypeScript errors',
      status: 'success',
      message: 'No TypeScript errors found'
    })
  } catch (error: any) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || ''
    const errorCount = (errorOutput.match(/error TS/g) || []).length
    
    addResult({
      category: 'TypeScript',
      fix: 'Check TypeScript errors',
      status: 'failed',
      message: `Found ${errorCount} TypeScript errors`,
      details: { 
        message: 'Run "npx tsc --noEmit" to see all errors',
        errorCount 
      }
    })
  }
}

// ========================================
// 9. CREATE MISSING API ROUTES
// ========================================
async function createMissingAPIRoutes() {
  log('\n🌐 Creating Missing API Routes...', 'bright')
  
  // Create basic user profile API if missing
  const userProfileApiPath = path.join(process.cwd(), 'app/api/user/profile/route.ts')
  if (!fs.existsSync(userProfileApiPath)) {
    try {
      fs.mkdirSync(path.dirname(userProfileApiPath), { recursive: true })
      fs.writeFileSync(userProfileApiPath, `import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
`)
      addResult({
        category: 'API Routes',
        fix: 'Create user profile API',
        status: 'success',
        message: 'Created app/api/user/profile/route.ts'
      })
    } catch (error) {
      addResult({
        category: 'API Routes',
        fix: 'Create user profile API',
        status: 'failed',
        message: 'Failed to create user profile API',
        details: error
      })
    }
  } else {
    addResult({
      category: 'API Routes',
      fix: 'Create user profile API',
      status: 'skipped',
      message: 'User profile API already exists'
    })
  }
}

// ========================================
// MAIN AUTO-FIX FUNCTION
// ========================================
async function runComprehensiveAutoFix() {
  log('\n🔧 Starting Comprehensive Auto-Fix...', 'bright')
  log('==========================================================================', 'cyan')
  
  try {
    await fixMissingDirectories()
    await fixMissingLibFiles()
    await fixMissingCoreComponents()
    await fixPrismaSetup()
    await installMissingDependencies()
    await seedInitialData()
    await fixSSRIssues()
    await createMissingAPIRoutes()
    await fixTypeScriptErrors()
    
    // Generate summary
    log('\n==========================================================================', 'cyan')
    log('📊 AUTO-FIX SUMMARY', 'bright')
    log('==========================================================================', 'cyan')
    
    const success = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const total = results.length
    
    log(`\n✅ Fixed: ${success}`, 'green')
    log(`❌ Failed: ${failed}`, 'red')
    log(`⏭️  Skipped: ${skipped}`, 'yellow')
    log(`📝 Total Fixes Attempted: ${total}`)
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        success,
        failed,
        skipped
      },
      results
    }
    
    const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_AUTO_FIX_REPORT.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`\n💾 Full report saved to: COMPREHENSIVE_AUTO_FIX_REPORT.json`, 'blue')
    
    if (failed > 0) {
      log(`\n⚠️  Auto-fix completed with ${failed} failures. Manual intervention may be required.`, 'yellow')
    } else {
      log('\n✅ Auto-fix completed successfully!', 'green')
    }
    
    log('\n💡 Next steps:', 'cyan')
    log('   1. Run: npx tsx scripts/comprehensive-audit.ts', 'cyan')
    log('   2. Review any remaining issues', 'cyan')
    log('   3. Start development server: npm run dev', 'cyan')
    
  } catch (error) {
    log('\n❌ Auto-fix failed with error:', 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the auto-fix
runComprehensiveAutoFix()
