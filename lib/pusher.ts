import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'ap1',
  useTLS: true,
})

// Client-side Pusher
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    authEndpoint: '/api/pusher/auth',
  }
)

// Helper function to trigger events
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
) {
  try {
    await pusherServer.trigger(channel, event, data)
  } catch (error) {
    console.error('Pusher trigger error:', error)
  }
}

// Get unique conversation ID between two users
export function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-')
}
