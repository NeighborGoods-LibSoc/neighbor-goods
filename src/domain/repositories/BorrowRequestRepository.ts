import { ID } from '../valueItems'

export interface BorrowRequest {
  id: string
  itemId: ID
  requesterId: ID
  requestedAt: Date
}

export interface BorrowRequestRepository {
  findLastRequest(itemId: ID, requesterId: ID): Promise<BorrowRequest | null>
  recordRequest(itemId: ID, requesterId: ID): Promise<void>
  updateRequestTime(requestId: string): Promise<void>
}
