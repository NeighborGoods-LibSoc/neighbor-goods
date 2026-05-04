import React, { Suspense } from 'react'
import { ResetPasswordClient } from './page.client'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  )
}
