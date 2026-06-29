import { cookies, headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import type { User } from '../payload-types'

export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<{
  token: string
  user: User
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // Resolve the current user via Payload's in-process local API auth instead of
  // an SSR HTTP self-fetch to /api/users/me. The self-fetch depends on
  // NEXT_PUBLIC_SERVER_URL and a network hop, which can intermittently fail
  // under load (flaky e2e) and leave the user appearing logged out.
  let user: User | null = null
  try {
    const payload = await getPayload({ config: configPromise })
    const { user: authedUser } = await payload.auth({ headers: await getHeaders() })
    user = (authedUser as User) ?? null
  } catch {
    // Not authenticated (or auth could not be resolved) — treated as no user.
    user = null
  }

  if (validUserRedirect && user) {
    redirect(validUserRedirect)
  }

  if (nullUserRedirect && !user) {
    redirect(nullUserRedirect)
  }

  // Token will exist here because if it doesn't the user will be redirected
  return {
    token: token!,
    user: user as User,
  }
}
