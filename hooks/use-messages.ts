'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient } from '@/lib/pusher'
import type { Channel } from 'pusher-js'

export function useMessages(conversationId?: string) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [userChannel, setUserChannel] = useState<Channel | null>(null)

  // Get all conversations
  const getConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Use the correct API endpoint
      const response = await fetch('/api/conversations')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch conversations')
        setConversations([])
        return []
      }

      setConversations(data.conversations || [])
      return data.conversations || []
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      setError(err.message || 'Failed to fetch conversations')
      setConversations([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get messages for a conversation
  const getMessages = useCallback(async (convId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch messages')
        setMessages([])
        return []
      }

      setMessages(data.messages || [])
      return data.messages || []
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message || 'Failed to fetch messages')
      setMessages([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Send a message
  const sendMessage = async (receiverId: string, content: string, listingId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content, listingId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to real-time updates for specific conversation
  useEffect(() => {
    if (!conversationId) return

    const channelName = `conversation-${conversationId}`
    const newChannel = pusherClient.subscribe(channelName)
    
    newChannel.bind('new-message', (data: any) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === data.message?.id)) {
          return prev
        }
        return [...prev, data.message]
      })
    })

    newChannel.bind('message-read', (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
        )
      )
    })

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        newChannel.unbind_all()
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [conversationId])

  // Subscribe to real-time updates for user's conversations list
  useEffect(() => {
    if (!session?.user?.id) return

    const channelName = `user-${session.user.id}`
    const newUserChannel = pusherClient.subscribe(channelName)
    
    newUserChannel.bind('new-conversation-message', (data: any) => {
      // Refresh conversations when new message arrives
      getConversations()
    })

    setUserChannel(newUserChannel)

    return () => {
      if (newUserChannel) {
        newUserChannel.unbind_all()
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [session?.user?.id, getConversations])

  return {
    conversations,
    messages,
    getConversations,
    getMessages,
    sendMessage,
    loading,
    error,
  }
}
