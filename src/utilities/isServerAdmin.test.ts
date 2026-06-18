import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isDevEnv, hasServerAdminPrivileges } from './isServerAdmin'
import type { PayloadRequest } from 'payload'

describe('isServerAdmin utility', () => {
  const originalEnv = process.env.NG_ENV

  afterEach(() => {
    process.env.NG_ENV = originalEnv
  })

  describe('isDevEnv', () => {
    it('should return true when NG_ENV is development', () => {
      process.env.NG_ENV = 'development'
      expect(isDevEnv()).toBe(true)
    })

    it('should return false when NG_ENV is production', () => {
      process.env.NG_ENV = 'production'
      expect(isDevEnv()).toBe(false)
    })

    it('should return false when NG_ENV is undefined', () => {
      delete process.env.NG_ENV
      expect(isDevEnv()).toBe(false)
    })
  })

  describe('hasServerAdminPrivileges', () => {
    describe('when environment is not development', () => {
      beforeEach(() => {
        process.env.NG_ENV = 'production'
      })

      it('should return false for requireUser=true', () => {
        expect(hasServerAdminPrivileges(null, true)).toBe(false)
      })

      it('should return false for requireUser=false', () => {
        expect(hasServerAdminPrivileges(null, false)).toBe(false)
      })

      it('should return false even if user is admin', () => {
        const mockReq = {
          user: {
            collection: 'admins',
          },
        } as unknown as PayloadRequest
        expect(hasServerAdminPrivileges(mockReq, true)).toBe(false)
        expect(hasServerAdminPrivileges(mockReq, false)).toBe(false)
      })
    })

    describe('when environment is development', () => {
      beforeEach(() => {
        process.env.NG_ENV = 'development'
      })

      it('should return false if requireUser=true and no user is present', () => {
        expect(hasServerAdminPrivileges(null, true)).toBe(false)
      })

      it('should return true if requireUser=false and no user is present', () => {
        expect(hasServerAdminPrivileges(null, false)).toBe(true)
      })

      it('should return true if user is from admins collection', () => {
        const mockReq = {
          user: {
            collection: 'admins',
          },
        } as unknown as PayloadRequest
        expect(hasServerAdminPrivileges(mockReq, true)).toBe(true)
        expect(hasServerAdminPrivileges(mockReq, false)).toBe(true)
      })

      it('should return false if user is from users collection', () => {
        const mockReq = {
          user: {
            collection: 'users',
          },
        } as unknown as PayloadRequest
        expect(hasServerAdminPrivileges(mockReq, true)).toBe(false)
        expect(hasServerAdminPrivileges(mockReq, false)).toBe(false)
      })
    })
  })
})
