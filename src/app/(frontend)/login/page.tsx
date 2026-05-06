import React, { Suspense } from 'react'
import { LoginClient } from './page.client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
