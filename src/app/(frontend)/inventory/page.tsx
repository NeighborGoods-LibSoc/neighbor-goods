import { getMeUser } from '@/utilities/getMeUser'
import { InventoryClient } from './page.client'

export default async function InventoryPage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <InventoryClient user={user} />
}
