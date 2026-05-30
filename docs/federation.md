# NeighborGoods Federation Specification (Draft)

This document outlines the protocol for federating NeighborGoods libraries. It is designed to be compatible with the ActivityPub protocol and uses WebFinger for discovery.

## 1. Discovery via WebFinger

WebFinger (RFC 7033) is used to discover the ActivityPub Actor URI for a given library identifier.

### 1.1 Resource URI
A library is identified by an account-like URI:
`acct:library_name@domain.com`

### 1.2 WebFinger Request
To discover a library, a client performs a GET request to the host's WebFinger endpoint:
`GET /.well-known/webfinger?resource=acct:library_name@domain.com`

### 1.3 WebFinger Response
The response MUST include a link with `rel="self"` pointing to the ActivityPub Actor. It SHOULD also include a NeighborGoods-specific relationship to signal its capability as a federatable library.

```json
{
  "subject": "acct:library_name@domain.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://domain.com/federation/library/library_name"
    },
    {
      "rel": "https://neighborgoods.net/rel/library",
      "type": "application/activity+json",
      "href": "https://domain.com/federation/library/library_name"
    }
  ]
}
```

## 2. Library Actor (ActivityPub)

Each library is represented as an ActivityPub Actor of type `Organization`.

### 2.1 Actor Object
The Actor object provides metadata about the library and links to its collections. It uses the `Organization` type but MUST also include the `ng:Library` type to signal its specific function.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "ng": "https://neighborgoods.net/ns#",
      "Library": "ng:Library",
      "FederationRequest": "ng:FederationRequest",
      "latitude": "ng:latitude",
      "longitude": "ng:longitude",
      "items": "ng:items",
      "members": "ng:members",
      "verification": "ng:verification"
    }
  ],
  "id": "https://domain.com/federation/library/library_name",
  "type": ["Organization", "Library"],
  "preferredUsername": "library_name",
  "name": "The Great Neighborhood Library",
  "summary": "A library for sharing tools and goods.",
  "inbox": "https://domain.com/federation/library/library_name/inbox",
  "outbox": "https://domain.com/federation/library/library_name/outbox",
  "followers": "https://domain.com/federation/library/library_name/followers",
  "following": "https://domain.com/federation/library/library_name/following",

  "location": {
    "type": "Place",
    "name": "Main Street Hub",
    "latitude": 45.523062,
    "longitude": -122.676482
  },

  "items": "https://domain.com/federation/library/library_name/items",
  "members": "https://domain.com/federation/library/library_name/members",

  "publicKey": {
    "id": "https://domain.com/federation/library/library_name#main-key",
    "owner": "https://domain.com/federation/library/library_name",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

## 3. Federation Protocol

Federation is established when one library "follows" another.

### 3.1 Requesting Federation
Library A sends a `Follow` activity to Library B's inbox. To signal that this is a library-to-library federation request (rather than a simple follow from a user), the activity SHOULD include a specific context and a `ng:FederationRequest` type or property.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { "ng": "https://neighborgoods.net/ns#" }
  ],
  "id": "https://library-a.com/activities/1",
  "type": ["Follow", "ng:FederationRequest"],
  "actor": "https://library-a.com/federation/library/a",
  "object": "https://library-b.com/federation/library/b"
}
```

### 3.2 Accepting Federation
Library B responds with an `Accept` activity.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://library-b.com/activities/2",
  "type": "Accept",
  "actor": "https://library-b.com/federation/library/b",
  "object": {
    "id": "https://library-a.com/activities/1",
    "type": "Follow",
    "actor": "https://library-a.com/federation/library/a",
    "object": "https://library-b.com/federation/library/b"
  }
}
```

Once accepted, Library A is added to Library B's `followers` collection, and Library B is added to Library A's `following` collection.

## 4. Resource Retrieval

### 4.1 Items Collection
The `items` link in the Actor object points to an `OrderedCollection` of the library's items. Each item is represented as an object, ideally using the `Note` type for compatibility or a custom `ng:Thing` type.

**Item Object Fields:**
- `name`: Name of the item.
- `content`: Description.
- `ng:status`: Current status (e.g., `READY`, `BORROWED`).
- `ng:verification`: A collection of flags for required borrower verification (e.g., `id`, `deposit`, `in_person`).
- `ng:borrowingTime`: Maximum borrowing time in days.
- `image`: URL to the primary image.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "ng": "https://neighborgoods.net/ns#",
      "verification": "ng:verification"
    }
  ],
  "id": "https://domain.com/federation/library/library_name/items/1",
  "type": "Note",
  "name": "Power Drill",
  "content": "A high-power cordless drill.",
  "attributedTo": "https://domain.com/federation/library/library_name",
  "image": "https://domain.com/media/drill.jpg",
  "ng:status": "READY",
  "ng:verification": ["id", "in_person"],
  "ng:borrowingTime": 7
}
```

### 4.2 Members Collection
The `members` link points to a collection of library members. Members are represented as ActivityPub Actors of type `Person`.

**Member Object Fields:**
- `name`: Public display name.
- `preferredUsername`: Local identifier.

## 5. Hubs and Geographic Discovery

Hubs serve as directories for NeighborGoods libraries. They facilitate discovery and onboarding.

### 5.1 Geographic Metadata
Libraries MUST provide geographic coordinates in their Actor profile to be discoverable via geographic search on Hubs.

```json
{
  "location": {
    "type": "Place",
    "latitude": 45.523062,
    "longitude": -122.676482
  }
}
```

### 5.2 Hub API
Hubs SHOULD provide a searchable API.

**Endpoint:** `GET /v1/libraries`

**Parameters:**
- `near`: `latitude,longitude`
- `radius`: Distance in kilometers (default: 10).
- `q`: Text search for library name or summary.

**Response:**
An `OrderedCollection` of Library Actor URIs or full Actor objects.

### 5.3 Onboarding
New libraries can "announce" themselves to a Hub by sending an `Announce` activity or a simple POST registration. Hubs may then "follow" the library to keep their directory up to date.

## 6. Peer Management

Libraries maintain a list of federated peers.

### 6.1 Pointing to another Library
A library can add a peer by:
1.  **WebFinger Lookup**: Resolving `library@domain.com` to an Actor URI.
2.  **Direct URI**: Manually entering the Actor URI.

### 6.2 Federation State
The relationship between libraries should track state:
- `PENDING`: Follow request sent, awaiting Accept.
- `FEDERATED`: Follow request accepted.
- `DISCONNECTED`: Federation revoked or blocked.

### 6.3 Synchronization
Federated libraries SHOULD periodically poll the `items` collection of their peers to update local caches of available resources, enabling cross-library search.
