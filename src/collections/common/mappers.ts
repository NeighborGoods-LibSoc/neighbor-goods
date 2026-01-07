import { Thing } from '@/domain/entities/thing'
import { ID, PersonName, EmailAddress, Money, Currency } from '@/domain/valueItems'
import { PhysicalLocation } from '@/domain/valueItems/location/physicalLocation'
import { ThingTitle } from '@/domain/valueItems/thingTitle'
import { Person } from '@/domain/entities/people/person'
import { MOPServer } from '@/domain/entities/mopServer'
import { URL } from '@/domain/valueItems/url'

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

export function mapUserToPerson(user: any): Person {
  if (!user) throw new Error('User is required to map to Person')
  const personID = new ID(String(user.id || user._id))
  const nameParts = String(user.name || '').split(' ')
  const firstName = nameParts[0] || 'Unknown'
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Unknown'

  return new Person({
    personID,
    name: new PersonName({ firstName, lastName }),
    emails: [new EmailAddress(user.email)],
  })
}

export function mapDataToMoney(data: any): Money {
  if (!data) return new Money({ amount: 0, currency: Currency.USD })
  return new Money({
    amount: data.amount || 0,
    currency: (data.currency as Currency) || Currency.USD,
  })
}

export function mapDataToMopServer(data: any): MOPServer {
  if (!data) return MOPServer.localhost()
  return new MOPServer({
    url: URL.parse(data.url || 'https://localhost'),
    version: data.version || '0.0.0',
  })
}
