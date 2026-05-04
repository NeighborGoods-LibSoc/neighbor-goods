import { getMeUser } from '@/utilities/getMeUser'
import { CreateLibraryClient } from './page.client'

export default async function CreateLibraryPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <CreateLibraryClient user={user} />
}
