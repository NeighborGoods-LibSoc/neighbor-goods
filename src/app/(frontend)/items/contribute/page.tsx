import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import { ContributeClient } from './page.client'

export default async function ContributePage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <ContributeClient user={user} />
}
