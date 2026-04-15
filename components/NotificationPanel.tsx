'use client'

import { useState } from 'react'

type Props = { onClose: () => void }

export default function NotificationPanel({ onClose }: Props) {
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [emailMsg, setEmailMsg] = useState('')
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unsupported'>('idle')
  const [pushMsg, setPushMsg] = useState('')

  const subscribeEmail = async () => {
    if (!email.includes('@')) {
      setEmailMsg('Please enter a valid email.')
      setEmailStatus('error')
      return
    }
    setEmailStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', email }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailStatus('success')
        setEmailMsg('Subscribed! You\'ll get email alerts for new jobs.')
      } else {
        setEmailStatus('error')
        setEmailMsg(data.error || 'Failed to subscribe.')
      }
    } catch {
      setEmailStatus('error')
      setEmailMsg('Network error. Please try again.')
    }
  }

  const subscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      setPushMsg('Push notifications are not supported in this browser.')
      return
    }

    setPushStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('error')
        setPushMsg('Permission denied. Please allow notifications in your browser settings.')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const vapidKeyRes = await fetch('/api/vapid-public-key')
      const { publicKey } = await vapidKeyRes.json()

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const subJson = subscription.toJSON()
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'push',
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        }),
      })

      if (res.ok) {
        setPushStatus('success')
        setPushMsg('Push notifications enabled! You\'ll be alerted when new jobs are posted.')
      } else {
        const data = await res.json()
        setPushStatus('error')
        setPushMsg(data.error || 'Failed to enable push notifications.')
      }
    } catch (err) {
      setPushStatus('error')
      setPushMsg('Error: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 480,
          borderRadius: '16px 16px 0 0',
          padding: '24px 20px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔔 Job Alerts</h2>
          <button onClick={onClose} style={{ fontSize: 22, color: 'var(--gray-500)' }}>×</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>
          Get notified the moment new Biology teacher jobs appear in Dubai.
        </p>

        {/* Email */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            📧 Email Alerts
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailStatus === 'success'}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={subscribeEmail}
              disabled={emailStatus === 'loading' || emailStatus === 'success'}
              style={{
                background: emailStatus === 'success' ? 'var(--green)' : 'var(--blue)',
                color: '#fff',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                opacity: emailStatus === 'loading' ? 0.7 : 1,
              }}
            >
              {emailStatus === 'loading' ? '…' : emailStatus === 'success' ? '✓' : 'Subscribe'}
            </button>
          </div>
          {emailMsg && (
            <p style={{
              marginTop: 6,
              fontSize: 12,
              color: emailStatus === 'error' ? 'var(--red)' : 'var(--green)',
            }}>
              {emailMsg}
            </p>
          )}
        </div>

        {/* Push */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            📱 Browser Push Notifications
          </label>
          <button
            onClick={subscribePush}
            disabled={pushStatus === 'loading' || pushStatus === 'success'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1.5px solid var(--gray-200)',
              background: pushStatus === 'success' ? 'var(--green-light)' : 'var(--gray-50)',
              color: pushStatus === 'success' ? 'var(--green)' : 'var(--gray-700)',
              fontSize: 14,
              fontWeight: 600,
              opacity: pushStatus === 'loading' ? 0.7 : 1,
            }}
          >
            {pushStatus === 'loading'
              ? '⏳ Requesting permission…'
              : pushStatus === 'success'
              ? '✓ Push notifications active'
              : '🔔 Enable Push Notifications'}
          </button>
          {pushMsg && (
            <p style={{
              marginTop: 6,
              fontSize: 12,
              color: pushStatus === 'error' || pushStatus === 'unsupported'
                ? 'var(--red)' : 'var(--green)',
            }}>
              {pushMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}
