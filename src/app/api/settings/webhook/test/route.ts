import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { webhookUrl, webhookSecret } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
    }

    // Prepare test payload
    const testPayload = {
      event: 'webhook.test',
      user_id: session.user.id,
      session_id: 'test-session',
      message: 'This is a test webhook from Fast Focus Pomodoro',
      timestamp: new Date().toISOString(),
      app_version: process.env.APP_VERSION || '1.0.0'
    }

    const body_string = JSON.stringify(testPayload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timestamp': new Date().toISOString(),
      'Idempotency-Key': 'test-webhook'
    }

    // Add HMAC signature if secret is provided
    if (webhookSecret) {
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body_string)
        .digest('hex')
      headers['X-Signature'] = `sha256=${signature}`
    }

    // Test the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: body_string,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const success = response.ok
    const statusCode = response.status
    const statusText = response.statusText

    return NextResponse.json({
      success,
      statusCode,
      statusText,
      message: success 
        ? 'Webhook test successful!' 
        : `Webhook test failed: ${statusCode} ${statusText}`
    })

  } catch (error) {
    console.error('Webhook test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      message: `Webhook test failed: ${errorMessage}`
    })
  }
}