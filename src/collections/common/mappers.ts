import { Thing } from '@/domain/entities/thing'
import { DistributedLibrary as DomainDistributedLibrary } from '@/domain/entities/libraries/distributedLibrary'
import { MOPServer } from '@/domain/entities/mopServer'
import { ID, WaitingListType, Money, Currency, ThingStatus } from '@/domain/valueItems'
import type { FeeSchedule } from '@/domain/valueItems'
import { PhysicalLocation } from '@/domain/valueItems/location/physicalLocation'
import { PhysicalArea } from '@/domain/valueItems/location/physicalArea'
import { Distance } from '@/domain/valueItems/location/distance'
import { ThingTitle } from '@/domain/valueItems/thingTitle'

export function mapItemToThing(item: any): Thing {
  const thing_id = new ID(String(item?.id || item?._id))
  const title = new ThingTitle({ name: String(item?.name || 'Untitled'), description: item?.description || undefined })
  const owner_id = new ID(String(item?.offeredBy?.id || item?.offeredBy || 'unknown'))
  const storage_location = new PhysicalLocation({
    latitude: null,
    longitude: null,
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })
  return new Thing({
    thing_id,
    title,
    description: item?.description ?? null,
    owner_id,
    storage_location,
    image_urls: [],
    purchase_cost: null,
  })
}

export function mapReturnLocation(loc: any) {
  if (!loc) return null
  const hasAny = ['street_address','city','state','zip_code','country','latitude','longitude'].some(k => loc?.[k])
  if (!hasAny) return null
  return new PhysicalLocation({
    latitude: loc.latitude ?? null,
    longitude: loc.longitude ?? null,
    streetAddress: String(loc.street_address || ''),
    city: String(loc.city || ''),
    state: String(loc.state || ''),
    zipCode: String(loc.zip_code || ''),
    country: String(loc.country || ''),
  })
}

class ZeroFeeSchedule implements FeeSchedule {
  feeForOverdueItem() { return new Money({ amount: 0, currency: Currency.USD }) }
  feeForDamagedItem() { return new Money({ amount: 0, currency: Currency.USD }) }
}

export function buildDomainDistributedLibraryFromData(data: any): DomainDistributedLibrary {
  const libraryID = new ID(String(data.library_id))
  const name = String(data.name || '')
  if (!name) throw new Error('Name is required')

  const defaultDays = Math.max(1, Number(data.default_loan_time_days ?? 14))
  const publicURL = typeof data.public_url === 'string' && data.public_url.trim().length > 0
    ? data.public_url.trim()
    : null

  const dl = new DomainDistributedLibrary({
    libraryID,
    name,
    administrators: [],
    waitingListType: WaitingListType.FIRST_COME_FIRST_SERVE,
    maxFinesBeforeSuspension: new Money({ amount: 100, currency: Currency.USD }),
    feeSchedule: new ZeroFeeSchedule(),
    defaultLoanTime: { days: defaultDays },
    mopServer: MOPServer.localhost(),
    publicURL: publicURL,
  })

  const area = toPhysicalArea(data.area)
  if (area) {
    dl.area = area
  }

  return dl
}

export function toPhysicalArea(area: any): PhysicalArea | null {
  if (!area) return null
  const cp = area.center_point || {}
  const hasCenter = ['street_address','city','state','zip_code','country','latitude','longitude'].some(k => cp?.[k])
  const radiusKm = typeof area.radius_kilometers === 'number' ? area.radius_kilometers : Number(area.radius_kilometers)
  if (!hasCenter || !(radiusKm >= 0)) return null

  const center = new PhysicalLocation({
    latitude: cp.latitude ?? null,
    longitude: cp.longitude ?? null,
    streetAddress: String(cp.street_address || ''),
    city: String(cp.city || ''),
    state: String(cp.state || ''),
    zipCode: String(cp.zip_code || ''),
    country: String(cp.country || ''),
  })
  const radius = new Distance(radiusKm)
  return new PhysicalArea({ centerPoint: center, radius })
}

export function serializeArea(dl: DomainDistributedLibrary) {
  const a = dl.area
  if (!a) return undefined
  const cp = a.centerPoint as PhysicalLocation
  return {
    center_point: {
      latitude: cp.latitude ?? null,
      longitude: cp.longitude ?? null,
      street_address: cp.streetAddress,
      city: cp.city,
      state: cp.state,
      zip_code: cp.zipCode,
      country: cp.country,
    },
    radius_kilometers: a.radius.kilometers,
  }
}

/**
 * Build a domain Thing from Payload document data.
 * Used by Things collection hooks for domain-driven validation.
 */
export function buildDomainThingFromData(doc: any): Thing {
  if (!doc) {
    throw new Error('Cannot build Thing from null document')
  }

  const ownerId =
    typeof doc.offeredBy === 'object' ? doc.offeredBy.id : doc.offeredBy

  const requestedById = doc.requestedToBorrowBy
    ? typeof doc.requestedToBorrowBy === 'object'
      ? doc.requestedToBorrowBy.id
      : doc.requestedToBorrowBy
    : null

  const storage_location = new PhysicalLocation({
    latitude: null,
    longitude: null,
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })

  return new Thing({
    thing_id: ID.parse(doc.id),
    title: new ThingTitle({
      name: String(doc.name || 'Untitled'),
      description: doc.description || undefined,
    }),
    description: doc.description || null,
    owner_id: ID.parse(ownerId),
    storage_location,
    image_urls: [],
    purchase_cost: null,
    status: (doc.status as ThingStatus) || ThingStatus.READY,
    requestedToBorrowBy: requestedById ? ID.parse(requestedById) : null,
  })
}

/**
 * Convert a domain Thing back to Payload data format.
 * Preserves fields that shouldn't change through domain operations.
 */
export function thingToPayloadData(thing: Thing, originalDoc: any): any {
  return {
    ...originalDoc,
    status: thing.status,
    requestedToBorrowBy: thing.requestedToBorrowBy?.toString() || null,
    offeredBy: thing.owner_id.toString(),
  }
}
