import { supabase } from './supabase'

// VAPID public key - generate at https://vapidkeys.com or use web-push CLI
// npx web-push generate-vapid-keys
// Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to Supabase Edge Function secrets
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function registerPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()

    if (!sub) {
      if (!VAPID_PUBLIC_KEY) {
        console.warn('No VAPID_PUBLIC_KEY set – using browser notifications only')
        return 'browser-only'
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const { endpoint, keys } = sub.toJSON()

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth:   keys.auth,
    }, { onConflict: 'user_id,endpoint' })

    return true
  } catch (e) {
    console.error('Push registration failed:', e)
    return false
  }
}

export async function unregisterPush(userId) {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe()
    await supabase.from('push_subscriptions')
      .delete().eq('user_id', userId).eq('endpoint', sub.endpoint)
  }
}

// Schedule a browser notification (fallback when app is open)
export function scheduleLocalNotif(title, body, delayMs) {
  if (Notification.permission !== 'granted') return
  setTimeout(() => {
    new Notification(title, { body, icon: '/icon-192.png' })
  }, delayMs)
}

// Notify friend request via Supabase
export async function notifyFriendRequest(toUserId, fromName) {
  await supabase.functions.invoke('send-push', {
    body: {
      user_id: toUserId,
      title: 'HabitFlow 🌿',
      body: `${fromName} möchte dein Freund sein!`,
      url: '/social',
    }
  })
}
