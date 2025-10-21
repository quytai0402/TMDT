#!/bin/bash

# 🚀 HOMESTAY BOOKING - SYSTEM HEALTH CHECK
# Quick script to audit and fix the entire system

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}🏠 HOMESTAY BOOKING SYSTEM HEALTH CHECK${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Found package.json - in correct directory\n"

# Menu
echo -e "${CYAN}What would you like to do?${NC}"
echo "1) 🔍 Run Comprehensive Audit (check entire system)"
echo "2) 🔧 Run Auto-Fix (fix common issues automatically)"
echo "3) 🔄 Audit + Auto-Fix + Re-Audit (full health check)"
echo "4) 📊 View Last Audit Report"
echo "5) 📈 View System Status Summary"
echo "6) 🌱 Seed Data (quests + rewards)"
echo "7) 🧹 Clean & Regenerate (Prisma + install deps)"
echo "8) 🚀 Full Setup (clean + seed + audit)"
echo "9) ❌ Exit"
echo ""
read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        print_info "Running comprehensive system audit...\n"
        npx tsx scripts/comprehensive-audit.ts
        echo ""
        print_info "Audit complete! Check COMPREHENSIVE_AUDIT_REPORT.json for details"
        ;;
    
    2)
        print_info "Running auto-fix script...\n"
        npx tsx scripts/comprehensive-auto-fix.ts
        echo ""
        print_info "Auto-fix complete! Check COMPREHENSIVE_AUTO_FIX_REPORT.json for details"
        ;;
    
    3)
        print_info "Running full health check cycle...\n"
        
        print_info "Step 1/3: Initial audit..."
        npx tsx scripts/comprehensive-audit.ts || true
        echo ""
        
        print_info "Step 2/3: Auto-fixing issues..."
        npx tsx scripts/comprehensive-auto-fix.ts
        echo ""
        
        print_info "Step 3/3: Re-audit to verify fixes..."
        npx tsx scripts/comprehensive-audit.ts || true
        echo ""
        
        print_success "Health check cycle complete!"
        print_info "Compare the two audit reports to see improvements"
        ;;
    
    4)
        print_info "Last audit report:\n"
        if [ -f "COMPREHENSIVE_AUDIT_REPORT.json" ]; then
            cat COMPREHENSIVE_AUDIT_REPORT.json | jq '.summary'
            echo ""
            print_info "Full report: COMPREHENSIVE_AUDIT_REPORT.json"
        else
            print_warning "No audit report found. Run audit first."
        fi
        ;;
    
    5)
        print_info "System Status Summary:\n"
        
        if [ -f "COMPREHENSIVE_AUDIT_REPORT.json" ]; then
            HEALTH_SCORE=$(cat COMPREHENSIVE_AUDIT_REPORT.json | jq -r '.summary.healthScore')
            PASSED=$(cat COMPREHENSIVE_AUDIT_REPORT.json | jq -r '.summary.passed')
            FAILED=$(cat COMPREHENSIVE_AUDIT_REPORT.json | jq -r '.summary.failed')
            WARNINGS=$(cat COMPREHENSIVE_AUDIT_REPORT.json | jq -r '.summary.warnings')
            TOTAL=$(cat COMPREHENSIVE_AUDIT_REPORT.json | jq -r '.summary.total')
            
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}🎯 System Health Score: ${HEALTH_SCORE}%${NC}"
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "✅ Passed:   ${GREEN}${PASSED}${NC}/${TOTAL}"
            echo -e "❌ Failed:   ${RED}${FAILED}${NC}/${TOTAL}"
            echo -e "⚠️  Warnings: ${YELLOW}${WARNINGS}${NC}/${TOTAL}"
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
            
            if [ "$HEALTH_SCORE" -ge 95 ]; then
                print_success "Excellent! System is production-ready 🚀"
            elif [ "$HEALTH_SCORE" -ge 85 ]; then
                print_success "Good! System is mostly healthy 👍"
            elif [ "$HEALTH_SCORE" -ge 70 ]; then
                print_warning "Fair. Some issues need attention ⚠️"
            else
                print_error "Poor. Multiple issues require fixing 🔧"
            fi
        else
            print_warning "No audit data available. Run audit first."
        fi
        ;;
    
    6)
        print_info "Seeding data...\n"
        
        print_info "Seeding reward tiers..."
        npx tsx scripts/seed-rewards.ts
        echo ""
        
        print_info "Seeding quests..."
        npx tsx scripts/seed-quests.ts
        echo ""
        
        print_success "Data seeding complete!"
        ;;
    
    7)
        print_info "Cleaning and regenerating...\n"
        
        print_info "Generating Prisma client..."
        npx prisma generate
        echo ""
        
        print_info "Installing dependencies..."
        npm install
        echo ""
        
        print_success "Clean & regenerate complete!"
        ;;
    
    8)
        print_info "Running full setup...\n"
        
        print_info "Step 1/4: Generating Prisma client..."
        npx prisma generate
        echo ""
        
        print_info "Step 2/4: Installing dependencies..."
        npm install
        echo ""
        
        print_info "Step 3/4: Seeding data..."
        npx tsx scripts/seed-rewards.ts
        npx tsx scripts/seed-quests.ts
        echo ""
        
        print_info "Step 4/4: Running audit..."
        npx tsx scripts/comprehensive-audit.ts || true
        echo ""
        
        print_success "Full setup complete! 🎉"
        print_info "Next: npm run dev"
        ;;
    
    9)
        print_info "Goodbye! 👋"
        exit 0
        ;;
    
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📚 Documentation:${NC}"
echo "   - COMPREHENSIVE_AUDIT_README.md"
echo "   - COMPREHENSIVE_AUDIT_COMPLETION.md"
echo "   - QUEST_SYSTEM_TEST_GUIDE.md"
echo ""
echo -e "${CYAN}📊 Reports:${NC}"
echo "   - COMPREHENSIVE_AUDIT_REPORT.json"
echo "   - COMPREHENSIVE_AUTO_FIX_REPORT.json"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
