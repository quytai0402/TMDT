'use client'

import { useState, useEffect, useCallback } from 'react'
import { pusherClient } from '@/lib/pusher'
import type { Channel } from 'pusher-js'

export function useMessages(conversationId?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)

  // Get all conversations
  const getConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/messages')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      setConversations(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get messages for a conversation
  const getMessages = useCallback(async (convId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return

    const newChannel = pusherClient.subscribe(`private-conversation-${conversationId}`)
    
    newChannel.bind('new-message', (data: any) => {
      setMessages((prev) => [...prev, data])
    })

    newChannel.bind('message-read', (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, readAt: data.readAt } : msg
        )
      )
    })

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        newChannel.unbind_all()
        newChannel.unsubscribe()
      }
    }
  }, [conversationId])

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
