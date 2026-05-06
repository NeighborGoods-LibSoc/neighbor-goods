import { getMeUser } from '@/utilities/getMeUser'
import { redirect } from 'next/navigation'
import { getClientSideURL } from '@/utilities/getURL'
import { ModerateLibraryClient } from './page.client'

type Args = {
  params: Promise<{ id: string }>
}

export default async function ModerateLibraryPage({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise

  const { user, token } = await getMeUser({
    nullUserRedirect: '/login',
  })

  // Fetch the library with depth to populate relationships
  const libraryRes = await fetch(
    `${getClientSideURL()}/api/distributedLibraries/${id}?depth=1`,
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )

  if (!libraryRes.ok) {
    redirect('/dashboard')
  }

  const library = await libraryRes.json()

  // Check that the current user is an administrator of this library
  const isAdmin = Array.isArray(library.administrators) &&
    library.administrators.some(
      (admin: any) => (typeof admin === 'string' ? admin : admin?.id) === user.id,
    )

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return <ModerateLibraryClient library={library} user={user} token={token} />
}
