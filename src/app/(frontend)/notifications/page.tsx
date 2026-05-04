import type { Metadata } from 'next/types'
import { NotificationsClient } from './page.client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getClientSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/login')
  }

  let user = null
  try {
    const meReq = await fetch(`${getClientSideURL()}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
    })
    if (meReq.ok) {
      const data = await meReq.json()
      user = data.user
    }
  } catch {
    // not logged in
  }

  if (!user) {
    redirect('/login')
  }

  return <NotificationsClient user={user} />
}

export function generateMetadata(): Metadata {
  return {
    title: 'Notifications | NeighborGoods',
  }
}
