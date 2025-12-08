import { describe, it, expect } from 'vitest'

import {
  mapItemToThing,
  mapReturnLocation,
  toPhysicalArea,
  buildDomainDistributedLibraryFromData,
  serializeArea,
} from '@/collections/common/mappers'

import { ID } from '@/domain/valueItems'
import { PhysicalLocation } from '@/domain/valueItems/location/physicalLocation'
import { PhysicalArea } from '@/domain/valueItems/location/physicalArea'
import { Distance } from '@/domain/valueItems/location/distance'

// Helpers
function makeItem(overrides: any = {}) {
  return {
    id: 'item-1',
    name: 'Hammer',
    description: 'A heavy hammer',
    offeredBy: { id: 'user-1' },
    ...overrides,
  }
}

function makeAreaInput(overrides: any = {}) {
  return {
    center_point: {
      latitude: 40.0,
      longitude: -105.0,
      street_address: '1 Main',
      city: 'Boulder',
      state: 'CO',
      zip_code: '80301',
      country: 'US',
    },
    radius_kilometers: 12,
    ...overrides,
  }
}

describe('collections/common/mappers', () => {
  describe('mapItemToThing', () => {
    it('maps basic item fields to Thing', () => {
      const item = makeItem()
      const thing = mapItemToThing(item)

      expect(thing.entityID).toBeInstanceOf(ID)
      expect(thing.entityID.toString()).toBe(String(item.id))
      expect(thing.title.name).toBe('Hammer')
      expect(thing.description).toBe('A heavy hammer')
      // owner id comes from offeredBy
      // mapItemToThing accepts either object with id or plain value
      expect(thing.owner_id).toBeInstanceOf(ID)
      expect(thing.owner_id.toString()).toBe('user-1')
      // storage_location is a PhysicalLocation placeholder
      const loc = thing.storage_location as PhysicalLocation
      expect(loc).toBeInstanceOf(PhysicalLocation)
      expect(loc.streetAddress).toBe('')
      expect(loc.city).toBe('')
    })

    it('uses fallback names and ids if missing', () => {
      const item = makeItem({ id: undefined, _id: 'mongo-id-123', name: undefined, description: undefined, offeredBy: 'user-xyz' })
      const thing = mapItemToThing(item)
      expect(thing.entityID.toString()).toBe('mongo-id-123')
      expect(thing.title.name).toBe('Untitled')
      expect(thing.description).toBeNull()
      expect(thing.owner_id.toString()).toBe('user-xyz')
    })
  })

  describe('mapReturnLocation', () => {
    it('returns null for nullish or empty input', () => {
      expect(mapReturnLocation(null as any)).toBeNull()
      expect(mapReturnLocation(undefined as any)).toBeNull()
      expect(mapReturnLocation({} as any)).toBeNull()
    })

    it('returns PhysicalLocation when any fields are present', () => {
      const input = {
        street_address: '10 Downing',
        city: 'London',
        state: 'LDN',
        zip_code: 'SW1A 2AA',
        country: 'UK',
        latitude: 51.5034,
        longitude: -0.1276,
      }
      const loc = mapReturnLocation(input)
      expect(loc).toBeInstanceOf(PhysicalLocation)
      expect(loc?.streetAddress).toBe('10 Downing')
      expect(loc?.city).toBe('London')
      expect(loc?.zipCode).toBe('SW1A 2AA')
      expect(loc?.latitude).toBe(51.5034)
      expect(loc?.longitude).toBe(-0.1276)
    })
  })

  describe('toPhysicalArea', () => {
    it('returns null when center point is missing', () => {
      const bad = toPhysicalArea({ radius_kilometers: 5 })
      expect(bad).toBeNull()
    })

    it('returns null when radius is invalid', () => {
      const area = makeAreaInput({ radius_kilometers: -1 })
      const bad = toPhysicalArea(area)
      expect(bad).toBeNull()
    })

    it('maps to PhysicalArea with center and radius', () => {
      const input = makeAreaInput()
      const area = toPhysicalArea(input)
      expect(area).toBeInstanceOf(PhysicalArea)
      const cp = area?.centerPoint as PhysicalLocation
      expect(cp).toBeInstanceOf(PhysicalLocation)
      expect(cp.streetAddress).toBe('1 Main')
      expect((area as PhysicalArea).radius.kilometers).toBe(12)
    })
  })

  describe('buildDomainDistributedLibraryFromData', () => {
    it('throws when name is missing', () => {
      const data = {
        library_id: '00000000-0000-4000-8000-000000000000',
        name: '',
      }
      expect(() => buildDomainDistributedLibraryFromData(data)).toThrow('Name is required')
    })

    it('builds with normalized defaults and trims public_url', () => {
      const data = {
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
        default_loan_time_days: 0, // should clamp to >= 1
        public_url: '  https://example.org  ',
      }
      const dl = buildDomainDistributedLibraryFromData(data)
      expect(dl.name).toBe('Neighborhood')
      expect(dl.defaultLoanTime.days).toBeGreaterThanOrEqual(1)
      expect(dl.publicURL).toBe('https://example.org')
    })

    it('accepts null/empty public_url', () => {
      const data = {
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
        public_url: '   ',
      }
      const dl = buildDomainDistributedLibraryFromData(data)
      expect(dl.publicURL).toBeNull()
    })

    it('accepts and maps area when provided', () => {
      const data = {
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
        area: makeAreaInput(),
      }
      const dl = buildDomainDistributedLibraryFromData(data)
      expect(dl.area).toBeInstanceOf(PhysicalArea)
      expect((dl.area as PhysicalArea).radius.kilometers).toBe(12)
    })
  })

  describe('serializeArea', () => {
    it('returns undefined when library has no area', () => {
      const dl = buildDomainDistributedLibraryFromData({
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
      })
      const serialized = serializeArea(dl)
      expect(serialized).toBeUndefined()
    })

    it('serializes area shape correctly', () => {
      const dl = buildDomainDistributedLibraryFromData({
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
        area: makeAreaInput(),
      })
      const serialized = serializeArea(dl) as any
      expect(serialized).toBeTruthy()
      expect(serialized.center_point.street_address).toBe('1 Main')
      expect(serialized.center_point.city).toBe('Boulder')
      expect(serialized.radius_kilometers).toBe(12)
    })

    it('round-trips through serializeArea -> toPhysicalArea', () => {
      const dl = buildDomainDistributedLibraryFromData({
        library_id: '00000000-0000-4000-8000-000000000000',
        name: 'Neighborhood',
        area: makeAreaInput({ radius_kilometers: 25 }),
      })
      const serialized = serializeArea(dl)
      const back = toPhysicalArea(serialized)
      expect(back).toBeInstanceOf(PhysicalArea)
      expect((back as PhysicalArea).radius.kilometers).toBe(25)
    })
  })
})
