import crypto from 'crypto'
import { prisma } from './prisma'

export interface WebhookPayload {
  event: string
  user_id: string
  session_id: string
  task?: {
    id: string
    title: string
  }
  start_at: string
  end_at?: string
  duration_planned_sec: number
  duration_actual_sec?: number
  timezone: string
  app_version: string
}

export class WebhookDispatcher {
  private static readonly MAX_RETRIES = 5
  private static readonly RETRY_DELAYS = [2000, 5000, 15000, 45000, 120000] // milliseconds

  static async dispatch(payload: WebhookPayload, userId: string, sessionId: string) {
    // Get user's webhook configuration
    const settings = await prisma.settings.findUnique({
      where: { userId }
    })

    if (!settings?.webhookUrl) {
      console.log('No webhook URL configured for user:', userId)
      return
    }

    // Create webhook delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        userId,
        sessionId,
        event: payload.event,
        payload: JSON.stringify(payload),
        status: 'PENDING'
      }
    })

    // Attempt delivery
    await this.attemptDelivery(delivery.id, settings.webhookUrl, settings.webhookSecret, payload)
  }

  static async attemptDelivery(
    deliveryId: string, 
    webhookUrl: string, 
    webhookSecret: string | null,
    payload: WebhookPayload
  ) {
    try {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId }
      })

      if (!delivery || delivery.status === 'SUCCESS') {
        return
      }

      // Prepare headers
      const body = JSON.stringify(payload)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Timestamp': new Date().toISOString(),
        'Idempotency-Key': payload.session_id
      }

      // Add HMAC signature if secret is provided
      if (webhookSecret) {
        const signature = crypto
          .createHmac('sha256', webhookSecret)
          .update(body)
          .digest('hex')
        headers['X-Signature'] = `sha256=${signature}`
      }

      // Make HTTP request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        // Success
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'SUCCESS',
            attempts: delivery.attempts + 1,
            lastTriedAt: new Date()
          }
        })
        console.log('Webhook delivered successfully:', deliveryId)
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // Client error (non-retryable except 429)
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'FAILED',
            attempts: delivery.attempts + 1,
            lastTriedAt: new Date(),
            lastError: `HTTP ${response.status}: ${response.statusText}`
          }
        })
        console.log('Webhook delivery failed with client error:', deliveryId, response.status)
      } else {
        // Server error or 429 - retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId }
      })

      if (!delivery) return

      const newAttempts = delivery.attempts + 1
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: newAttempts,
          lastTriedAt: new Date(),
          lastError: errorMessage,
          status: newAttempts >= this.MAX_RETRIES ? 'FAILED' : 'PENDING'
        }
      })

      // Schedule retry if not max attempts reached
      if (newAttempts < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[newAttempts - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1]
        console.log(`Scheduling webhook retry ${newAttempts}/${this.MAX_RETRIES} in ${delay}ms:`, deliveryId)
        
        setTimeout(() => {
          this.attemptDelivery(deliveryId, webhookUrl, webhookSecret, payload)
        }, delay)
      } else {
        console.log('Webhook delivery failed after max retries:', deliveryId)
      }
    }
  }

  static async retryFailedDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      }
    })

    if (!delivery || !delivery.user.settings?.webhookUrl) {
      throw new Error('Delivery not found or webhook not configured')
    }

    // Reset delivery status and attempt retry
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        attempts: 0,
        lastError: null
      }
    })

    const payload = JSON.parse(delivery.payload) as WebhookPayload
    await this.attemptDelivery(
      deliveryId,
      delivery.user.settings.webhookUrl,
      delivery.user.settings.webhookSecret,
      payload
    )
  }
}