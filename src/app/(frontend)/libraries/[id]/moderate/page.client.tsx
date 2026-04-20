'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { User, DistributedLibrary, Item, Loan } from '@/payload-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ModerateLibraryClientProps {
  library: DistributedLibrary
  user: User
  token: string
}

type MemberWithDetails = {
  id: string
  name: string
  email: string
  loans: Loan[]
  borrowedItems: Item[]
  availableItems: Item[]
}

type ItemsTab = 'all' | 'available' | 'borrowed' | 'damaged'

export const ModerateLibraryClient: React.FC<ModerateLibraryClientProps> = ({
  library,
                                                                              token,
}) => {
  const [items, setItems] = useState<Item[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [memberDetails, setMemberDetails] = useState<MemberWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemsTab, setItemsTab] = useState<ItemsTab>('all')
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch all items belonging to this library
      const libraryItemIds = (library.items || []).map((item) =>
        typeof item === 'string' ? item : item.id,
      )

      let fetchedItems: Item[] = []
      if (libraryItemIds.length > 0) {
        const itemsRes = await fetch(
          `/api/items?where[id][in]=${libraryItemIds.join(',')}&depth=1&limit=100`,
          { headers: { Authorization: `JWT ${token}` } },
        )
        if (itemsRes.ok) {
          const data = await itemsRes.json()
          fetchedItems = data.docs || []
        }
      }
      setItems(fetchedItems)

      // Fetch active loans for library items
      let fetchedLoans: Loan[] = []
      if (libraryItemIds.length > 0) {
        const loansRes = await fetch(
          `/api/loans?where[item][in]=${libraryItemIds.join(',')}&depth=1&limit=100`,
          { headers: { Authorization: `JWT ${token}` } },
        )
        if (loansRes.ok) {
          const data = await loansRes.json()
          fetchedLoans = data.docs || []
        }
      }
      setLoans(fetchedLoans)

      // Build member details
      const members = (library.members || []).map((m) =>
        typeof m === 'string' ? { id: m, name: m, email: '' } : { id: m.id, name: m.name || m.email, email: m.email },
      )

      const details: MemberWithDetails[] = members.map((member) => {
        const memberLoans = fetchedLoans.filter((loan) => {
          const borrowerId = typeof loan.borrower === 'string' ? loan.borrower : loan.borrower?.id
          return borrowerId === member.id
        })

        const borrowedItems = fetchedItems.filter((item) => {
          return memberLoans.some((loan) => {
            const loanItemId = typeof loan.item === 'string' ? loan.item : loan.item?.id
            return loanItemId === item.id && loan.status !== 'RETURNED'
          })
        })

        const availableItems = fetchedItems.filter((item) => {
          const offeredById = typeof item.offeredBy === 'string' ? item.offeredBy : item.offeredBy?.id
          return offeredById === member.id && item.status === 'READY'
        })

        return {
          ...member,
          loans: memberLoans,
          borrowedItems,
          availableItems,
        }
      })

      setMemberDetails(details)
    } catch (error) {
      console.error('Error fetching moderator data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [library, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = items.filter((item) => {
    switch (itemsTab) {
      case 'available':
        return item.status === 'READY'
      case 'borrowed':
        return item.status === 'BORROWED' || item.status === 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW'
      case 'damaged':
        return item.status === 'DAMAGED'
      default:
        return true
    }
  })

  const itemCounts = {
    all: items.length,
    available: items.filter((i) => i.status === 'READY').length,
    borrowed: items.filter((i) => i.status === 'BORROWED' || i.status === 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW').length,
    damaged: items.filter((i) => i.status === 'DAMAGED').length,
  }

  const activeLoans = loans.filter((l) => l.status !== 'RETURNED')

  const formatLocation = (area?: DistributedLibrary['area']) => {
    if (!area?.center_point) return 'No location set'
    const parts = [
      area.center_point.street_address,
      area.center_point.city,
      area.center_point.state,
      area.center_point.zip_code,
      area.center_point.country,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'No location set'
  }
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      READY: 'bg-green-100 text-green-800',
      BORROWED: 'bg-blue-100 text-blue-800',
      WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'bg-yellow-100 text-yellow-800',
      DAMAGED: 'bg-red-100 text-red-800',
      RESERVED: 'bg-purple-100 text-purple-800',
      OVERDUE: 'bg-orange-100 text-orange-800',
      RETURN_STARTED: 'bg-teal-100 text-teal-800',
      WAITING_ON_LENDER_ACCEPTANCE: 'bg-yellow-100 text-yellow-800',
      RETURNED_DAMAGED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      READY: 'Available',
      BORROWED: 'Borrowed',
      WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'Pending Approval',
      DAMAGED: 'Damaged',
      RESERVED: 'Reserved',
      OVERDUE: 'Overdue',
      RETURN_STARTED: 'Return Started',
      WAITING_ON_LENDER_ACCEPTANCE: 'Awaiting Acceptance',
      RETURNED_DAMAGED: 'Returned Damaged',
      RETURNED: 'Returned',
    }
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <p className="text-muted-foreground">Loading library data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{library.name}</h1>
          <p className="mt-1 text-muted-foreground">Library Moderator View</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to User Dashboard</Button>
        </Link>
      </div>

      {/* 1) Library Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Library Information</CardTitle>
          <CardDescription>Basic details about this library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{library.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-base">{formatLocation(library.area)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Default Loan Time</p>
              <p className="text-base">{library.default_loan_time_days} days</p>
            </div>
            {library.public_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Public URL</p>
                <p className="text-base">{library.public_url}</p>
              </div>
            )}
            {library.area?.radius_kilometers && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Radius</p>
                <p className="text-base">{library.area.radius_kilometers} km</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Administrators</p>
              <p className="text-base">
                {(library.administrators || [])
                  .map((a) => (typeof a === 'string' ? a : a.name || a.email))
                  .join(', ')}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{itemCounts.available}</p>
              <p className="text-xs text-green-600">Available</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{itemCounts.borrowed}</p>
              <p className="text-xs text-blue-600">Borrowed</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{itemCounts.damaged}</p>
              <p className="text-xs text-red-600">Damaged</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{memberDetails.length}</p>
              <p className="text-xs text-gray-600">Members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) Members List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {memberDetails.length} member{memberDetails.length !== 1 ? 's' : ''} in this library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberDetails.length === 0 ? (
            <p className="text-muted-foreground">No members have joined this library yet.</p>
          ) : (
            <div className="space-y-3">
              {memberDetails.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg border"
                >
                  {/* Member summary row */}
                  <button
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                    onClick={() =>
                      setExpandedMember(expandedMember === member.id ? null : member.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(member.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.borrowedItems.length} borrowed</span>
                      <span>{member.availableItems.length} offered</span>
                      <span className="text-lg">{expandedMember === member.id ? '▾' : '▸'}</span>
                    </div>
                  </button>

                  {/* Expanded member details */}
                  {expandedMember === member.id && (
                    <div className="border-t px-4 pb-4 pt-3">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Borrowed Items */}
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">Currently Borrowed</h4>
                          {member.borrowedItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items borrowed</p>
                          ) : (
                            <ul className="space-y-1">
                              {member.borrowedItems.map((item) => (
                                <li key={item.id} className="flex items-center justify-between text-sm">
                                  <Link href={`/items/${item.id}`} className="text-primary hover:underline">
                                    {item.name}
                                  </Link>
                                  {getStatusBadge(item.status)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Available Items (offered by member) */}
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">Items Available for Loan</h4>
                          {member.availableItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items offered</p>
                          ) : (
                            <ul className="space-y-1">
                              {member.availableItems.map((item) => (
                                <li key={item.id} className="text-sm">
                                  <Link href={`/items/${item.id}`} className="text-primary hover:underline">
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Active Loans / Reservations */}
                        <div className="sm:col-span-2">
                          <h4 className="mb-2 text-sm font-semibold">Loan History & Reservations</h4>
                          {member.loans.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No loan records</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-left text-muted-foreground">
                                    <th className="pb-2 pr-4">Item</th>
                                    <th className="pb-2 pr-4">Status</th>
                                    <th className="pb-2 pr-4">Due Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {member.loans.map((loan) => {
                                    const loanItem = typeof loan.item === 'string' ? null : loan.item
                                    return (
                                      <tr key={loan.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4">
                                          {loanItem ? (
                                            <Link href={`/items/${loanItem.id}`} className="text-primary hover:underline">
                                              {loanItem.name}
                                            </Link>
                                          ) : (
                                            'Unknown item'
                                          )}
                                        </td>
                                        <td className="py-2 pr-4">{getStatusBadge(loan.status)}</td>
                                        <td className="py-2 pr-4">
                                          {loan.due_date
                                            ? new Date(loan.due_date).toLocaleDateString()
                                            : '—'}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3) Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {items.length} item{items.length !== 1 ? 's' : ''} in this library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-4 flex gap-2 border-b">
            {(['all', 'available', 'borrowed', 'damaged'] as ItemsTab[]).map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  itemsTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setItemsTab(tab)}
              >
                {tab} ({itemCounts[tab]})
              </button>
            ))}
          </div>

          {/* Items table */}
          {filteredItems.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No {itemsTab === 'all' ? '' : itemsTab} items found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Offered By</th>
                    <th className="pb-2 pr-4">Borrowing Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const offeredBy =
                      typeof item.offeredBy === 'string'
                        ? item.offeredBy
                        : item.offeredBy?.name || item.offeredBy?.email || 'Unknown'
                    // Find active loan for this item
                    const activeLoan = activeLoans.find((loan) => {
                      const loanItemId = typeof loan.item === 'string' ? loan.item : loan.item?.id
                      return loanItemId === item.id
                    })
                    const borrower = activeLoan
                      ? typeof activeLoan.borrower === 'string'
                        ? activeLoan.borrower
                        : activeLoan.borrower?.name || activeLoan.borrower?.email || 'Unknown'
                      : null

                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <Link href={`/items/${item.id}`} className="font-medium text-primary hover:underline">
                            {item.name}
                          </Link>
                          {borrower && (
                            <p className="text-xs text-muted-foreground">
                              Borrowed by {borrower}
                              {activeLoan?.due_date && (
                                <> · Due {new Date(activeLoan.due_date).toLocaleDateString()}</>
                              )}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3 pr-4">{offeredBy}</td>
                        <td className="py-3 pr-4">{item.borrowingTime} days</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
