import { getMeUser } from '@/utilities/getMeUser'
import { redirect } from 'next/navigation'
import { getClientSideURL } from '@/utilities/getURL'
import { EditLibraryClient } from './page.client'

type Args = {
  params: Promise<{ id: string }>
}

export default async function EditLibraryPage({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise

  const { user, token } = await getMeUser({
    nullUserRedirect: '/login',
  })

  const libraryRes = await fetch(
    `${getClientSideURL()}/api/distributedLibraries/${id}?depth=1`,
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )

  if (!libraryRes.ok) {
    redirect('/libraries')
  }

  const library = await libraryRes.json()

  // Only library administrators may edit settings.
  const isAdmin =
    Array.isArray(library.administrators) &&
    library.administrators.some(
      (admin: any) => (typeof admin === 'string' ? admin : admin?.id) === user.id,
    )

  if (!isAdmin) {
    redirect('/libraries')
  }

  return <EditLibraryClient library={library} user={user} token={token} />
}
