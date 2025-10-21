import { Suspense } from 'react'
import Link from 'next/link'
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  BarChart3, 
  Settings,
  PlusCircle,
  Star,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export const metadata = {
  title: 'Host Dashboard | Homestay Booking',
  description: 'Manage your properties, bookings, and earnings',
}

// Quick stats component
function QuickStats() {
  const stats = [
    {
      label: 'Active Listings',
      value: '0',
      change: '+0%',
      icon: Home,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total Bookings',
      value: '0',
      change: '+0%',
      icon: Calendar,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Total Earnings',
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Avg Rating',
      value: '0.0',
      change: '0 reviews',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}

// Quick actions component
function QuickActions() {
  const actions = [
    {
      title: 'Create New Listing',
      description: 'Add a new property to your portfolio',
      href: '/host/listings/new',
      icon: PlusCircle,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'View Calendar',
      description: 'Manage availability and bookings',
      href: '/host/calendar',
      icon: Calendar,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Check Messages',
      description: 'Respond to guest inquiries',
      href: '/host/messages',
      icon: MessageSquare,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'View Analytics',
      description: 'Track your performance',
      href: '/host/analytics',
      icon: BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.title}
            href={action.href}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </Link>
        )
      })}
    </div>
  )
}

// Recent activity component
function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <Link
          href="/host/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Welcome to your Host Dashboard! Start by creating your first listing.
            </p>
            <p className="text-xs text-gray-500 mt-1">Just now</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Performance overview component
function PerformanceOverview() {
  const metrics = [
    { label: 'Occupancy Rate', value: '0%', target: '80%' },
    { label: 'Response Time', value: 'N/A', target: '< 1h' },
    { label: 'Acceptance Rate', value: '0%', target: '90%' },
    { label: 'Cancellation Rate', value: '0%', target: '< 5%' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
        <TrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{metric.label}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{metric.value}</span>
                <span className="text-xs text-gray-500 ml-2">Target: {metric.target}</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main page component
export default function HostPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your properties and grow your business
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/host/settings"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link
                href="/host/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                New Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading stats...</div>}>
          <div className="space-y-8">
            {/* Quick Stats */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
              <QuickStats />
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <QuickActions />
            </section>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <RecentActivity />
              
              {/* Performance Overview */}
              <PerformanceOverview />
            </div>

            {/* Getting Started */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-white/10 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Ready to become a Superhost?</h2>
                  <p className="text-blue-100 mb-4">
                    Follow these steps to create an exceptional hosting experience and grow your business.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-1">1</div>
                      <div className="text-sm">Create your first listing</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-1">2</div>
                      <div className="text-sm">Set competitive pricing</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-1">3</div>
                      <div className="text-sm">Respond to guests quickly</div>
                    </div>
                  </div>
                  <Link
                    href="/host/resources"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    View Host Resources
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </Suspense>
      </div>
    </div>
  )
}
