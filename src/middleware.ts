import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isDevEnv } from './utilities/isServerAdmin'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  // Match all Payload admin and internal developer endpoints
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admins') ||
    pathname.startsWith('/api/graphql') ||
    pathname.startsWith('/api/graphql-playground') ||
    pathname.startsWith('/swagger') ||
    pathname === '/openapi.json'

  if (isAdminRoute) {
    // If not in development environment, completely hide the endpoints
    if (!isDevEnv()) {
      return new NextResponse(null, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
