import { Thing } from '@/domain/entities/thing'
import { ID } from '@/domain/valueItems'
import { PhysicalLocation } from '@/domain/valueItems/location/physicalLocation'
import { ThingTitle } from '@/domain/valueItems/thingTitle'

export function mapItemToThing(item: any): Thing {
  const thing_id = new ID(String(item?.id || item?._id))
  const title = new ThingTitle({ name: String(item?.name || 'Untitled'), description: item?.description || undefined })
  const owner_id = new ID(String(item?.contributedBy?.id || item?.contributedBy || 'unknown'))
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
