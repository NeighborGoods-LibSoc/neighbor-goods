import { getMeUser } from '@/utilities/getMeUser'
import { BrowseClient } from './page.client'

export default async function BrowsePage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <BrowseClient user={user} />
}
