import type { PayloadRequest } from 'payload'

/**
 * Checks if the application is running in development (Server Admin) mode.
 * Defaults to false if NG_ENV is undefined or not explicitly 'development'.
 */
export function isDevEnv(): boolean {
  const ngEnv = process.env.NG_ENV
  return ngEnv === 'development'
}

/**
 * Determines if a given request/user has server admin privileges.
 * 
 * - If the environment is not development, always returns false.
 * - If requireUser is true, it requires the user to be authenticated and belong to the 'admins' collection.
 * - If requireUser is false, it allows unauthenticated requests (useful for loading the admin login page itself),
 *   but will reject authenticated users if they are not from the 'admins' collection.
 */
export function hasServerAdminPrivileges(
  req?: PayloadRequest | null,
  requireUser: boolean = true
): boolean {
  // Defensive check: If not in development mode, reject all access
  if (!isDevEnv()) {
    return false
  }

  if (req) {
    const user = req.user
    if (user) {
      // Must belong to the 'admins' collection
      return user.collection === 'admins'
    }
    
    // If there is no user and we require one, reject
    if (requireUser) {
      return false
    }
  }

  return !requireUser
}
