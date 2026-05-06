import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { LibrariesClient } from './page.client'

export default async function LibrariesPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <LibrariesClient user={user} />
}
