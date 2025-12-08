import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import { OfferClient } from './page.client'

export default async function OfferPage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <OfferClient user={user} />
}
