#!/usr/bin/env tsx

/**
 * Seed Reward Tiers
 * Seeds the database with default reward tiers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedRewardTiers() {
  console.log('🏆 Seeding Reward Tiers...\n')

  const tiers = [
    {
      tier: 'BRONZE',
      name: 'Bronze',
      description: 'Welcome tier for new members',
      minPoints: 0,
      maxPoints: 499,
      bonusMultiplier: 1.0,
      benefits: ['Basic rewards', 'Member support', '5% booking discount'],
      displayOrder: 1,
    },
    {
      tier: 'SILVER',
      name: 'Silver',
      description: 'Active member tier with enhanced benefits',
      minPoints: 500,
      maxPoints: 1999,
      bonusMultiplier: 1.1,
      benefits: [
        '10% bonus points on all actions',
        'Priority customer support',
        'Early access to new listings',
        '10% booking discount',
        'Free cancellation up to 24h',
      ],
      displayOrder: 2,
    },
    {
      tier: 'GOLD',
      name: 'Gold',
      description: 'Loyal member tier with premium perks',
      minPoints: 2000,
      maxPoints: 4999,
      bonusMultiplier: 1.25,
      benefits: [
        '25% bonus points on all actions',
        'VIP customer support',
        'Exclusive deals and offers',
        '15% booking discount',
        'Free room upgrades (subject to availability)',
        'Late checkout',
        'Welcome gift at properties',
      ],
      displayOrder: 3,
    },
    {
      tier: 'PLATINUM',
      name: 'Platinum',
      description: 'Premium member tier with exclusive benefits',
      minPoints: 5000,
      maxPoints: 9999,
      bonusMultiplier: 1.5,
      benefits: [
        '50% bonus points on all actions',
        'Dedicated concierge service',
        'Premium exclusive listings',
        '20% booking discount',
        'Guaranteed room upgrades',
        'Complimentary breakfast',
        'Airport transfer discounts',
        'Priority booking during peak seasons',
      ],
      displayOrder: 4,
    },
    {
      tier: 'DIAMOND',
      name: 'Diamond',
      description: 'Elite member tier with ultimate luxury',
      minPoints: 10000,
      maxPoints: null,
      bonusMultiplier: 2.0,
      benefits: [
        '100% bonus points on all actions',
        'Personal travel advisor',
        'Access to ultra-luxury properties',
        '30% booking discount',
        'Complimentary suite upgrades',
        'Complimentary meals and minibar',
        'Free airport transfers',
        'Exclusive events and experiences',
        'Annual gift package',
      ],
      displayOrder: 5,
    },
  ]

  for (const tierData of tiers) {
    try {
      const existing = await (prisma as any).rewardTier.findFirst({
        where: { tier: tierData.tier },
      })

      if (existing) {
        console.log(`⏭️  ${tierData.name} tier already exists`)
        // Update existing tier
        await (prisma as any).rewardTier.update({
          where: { id: existing.id },
          data: tierData,
        })
        console.log(`✅ Updated ${tierData.name} tier`)
      } else {
        await (prisma as any).rewardTier.create({
          data: tierData,
        })
        console.log(`✅ Created ${tierData.name} tier`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${tierData.name} tier:`, error)
    }
  }

  console.log('\n✨ Reward tiers seeding completed!')
  console.log(`📊 Total tiers: ${tiers.length}`)
}

async function main() {
  try {
    await seedRewardTiers()
  } catch (error) {
    console.error('Error seeding reward tiers:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
