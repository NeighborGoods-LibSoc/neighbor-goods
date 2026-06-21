# Waiting Lists

When an item is borrowed, our system allows the library to order the next neighbors who will receive it. This is a
**waiting list** — a core mechanism for distributing shared goods fairly within the community.

NeighborGoods supports multiple waiting list strategies, each with different trade-offs. Choosing the right one is one of
the most important decisions a library makes, because it directly shapes how resources flow between neighbors and whether
the principles of [Library Socialism](https://en.wikipedia.org/wiki/Library_socialism) — especially **usufruct** and
**complementarity** — are upheld in practice.

Each library configures its waiting list type at the library level. All items within that library share the same strategy.

## Why Waiting Lists Matter

In a sharing economy built on solidarity rather than markets, we can't rely on price signals to allocate scarce goods.
Waiting lists are the mechanism that replaces market allocation with community-driven fairness. A well-designed waiting
list ensures that:

- **No one hoards**: Items flow to the next neighbor who needs them, reinforcing *usufruct* (use-rights based on need).
- **No one is excluded**: Everyone has equal opportunity to access shared goods, supporting the *irreducible minimum*.
- **The community decides**: Different libraries can choose the strategy that best fits their values and context.

## Basic Flow

1. **Browsing**: A neighbor sees that an item is currently checked out and can view the current wait.
2. **Joining the list**: The neighbor adds themselves to the waiting list.
3. **Reservation**: When the item is returned, the waiting list algorithm determines who is next. The item's status
   changes to `RESERVED` and a **reservation** is created for that neighbor.
4. **Notification**: The next neighbor is notified that the item is ready for them.
5. **Pickup window**: The neighbor has a configurable number of days (default: **3 days**) to pick up the item.
6. **Expiration & cascade**: If the reservation expires without pickup, the reservation is marked `EXPIRED` and the
   system moves to the next neighbor on the list, repeating from step 3.
7. **General availability**: Once the list is exhausted and the item is returned, it goes back to general availability
   for any neighbor to borrow.

### Reservation Lifecycle

A reservation moves through a strict state machine:

```
ASSIGNED → BORROWER_NOTIFIED → BORROWED
                              → EXPIRED
```

- **ASSIGNED**: The item has been reserved for a neighbor, but they haven't been notified yet.
- **BORROWER_NOTIFIED**: The neighbor has been notified and the pickup window is active.
- **BORROWED**: The neighbor picked up the item. The reservation is complete.
- **EXPIRED**: The pickup window passed without action. The system moves to the next neighbor.
- **CANCELLED**: The neighbor voluntarily removed themselves from the list, or was removed/blocked from the library.

Invalid transitions (e.g., going from `EXPIRED` back to `ASSIGNED`) are rejected by the domain model to maintain data
integrity.

## Waiting List Types

Each library chooses one of the following strategies. The choice is stored as a `WaitingListType` on the library and
used by the `WaitingListFactory` to create the appropriate list when an item first receives a reservation request.

### None

Some libraries — particularly **Free Stores** — may not use waiting lists at all. Items are available on a walk-in
basis: if it's on the shelf, you can take it. This is represented by the `NullWaitingList`, which accepts no members
and makes no reservations.

This is appropriate for libraries where items are abundant, low-value, or consumable, and where the overhead of managing
a queue would outweigh the benefit.

### First Come, First Serve

This is the most straightforward strategy: neighbors join the list in order, and the first person on the list gets the
item next. It's simple, transparent, and easy to understand.

**How it works:**
- Neighbors are added to an ordered list.
- When the item becomes available, the first person in the list is reserved the item.
- If they don't pick it up within the reservation window, their reservation expires and the next person is notified.
- Neighbors can cancel their place on the list at any time.

**Best for:** Most libraries, especially **Simple Libraries** and **Distributed Libraries**, where fairness and
simplicity are valued over nuance.

**Trade-offs:** Doesn't account for urgency or need — someone who casually added themselves months ago gets priority
over someone who desperately needs the item today.

### Library Voting *(Planned — Not Yet Implemented)*

Library Voting is a democratic waiting list strategy where the **members of the library collectively decide** who should
receive an item next. Rather than an algorithm picking the next borrower automatically, a voting window opens and
eligible library members cast their votes.

This is a heavyweight process, designed for libraries that manage **very valuable, high-impact, or life-affecting
resources** — where the stakes are high enough that the community should have a direct say in allocation. The canonical
example is a **housing cooperative** deciding which member should be offered the next available unit.

**How it works:**
- When an item becomes available, a **voting window** opens for a configurable period (e.g., 7–14 days).
- All eligible library members are notified that a vote is open.
- Members on the waiting list are the candidates; library members vote on who should receive the item next.
- When the voting window closes, the candidate with the most votes is reserved the item and the standard reservation
  lifecycle begins (notification → pickup window → borrowed or expired).
- If the winning candidate's reservation expires, the next-highest vote-getter is offered the item, without requiring
  a new vote.
- Ties can be broken by the library's configured tiebreaker rule (e.g., longest time on the list, random draw, or
  a runoff vote).

**Best for:** Libraries managing scarce, high-value, or life-critical resources where community consensus matters more
than speed — for example:
- A **housing cooperative** allocating available units to members.
- A **community land trust** deciding who gets access to a plot.
- A **shared vehicle fleet** with a single specialized vehicle (e.g., an accessible van).

**Trade-offs:** Significantly slower than other strategies — the voting window introduces days or weeks of delay before
an item can be borrowed. Requires active participation from library members; low voter turnout can undermine legitimacy.
May also introduce social dynamics (campaigning, popularity bias) that need to be managed through anonymity options or
structured deliberation.

**Philosophical note:** Library Voting is the most explicitly democratic mechanism in NeighborGoods. It embodies
**complementarity** — the idea that differences within a non-hierarchical community are generative — by giving every
member an equal voice in how shared resources are distributed. Unlike market-like mechanisms (such as Quadratic Lending),
it relies entirely on collective judgment rather than individual signaling. This makes it the strongest expression of
community self-governance in the platform, but also the most demanding in terms of member engagement.

### Quadratic Lending *(Planned — Not Yet Implemented)*

Quadratic Lending is a more nuanced strategy that lets neighbors signal **how much** they want an item, rather than the
simple yes/no of a first-come-first-serve list. It draws inspiration from
[Quadratic Voting](https://en.wikipedia.org/wiki/Quadratic_voting), adapted for resource sharing.

**How it works:**
- Neighbors bid tokens (or a library-specific currency) to express their level of interest.
- The neighbor with the highest effective bid gets the item next.
- To prevent any single neighbor from monopolizing popular items, the cost of holding an item **doubles each borrowing
  period**. If you've already borrowed an item twice, your bid counts at only **one quarter** of its face value.
- The winning bidder pays their bid amount, and the proceeds go to the library to fund maintenance, new acquisitions,
  or community programs.

**Best for:** Libraries with high-demand items where simple queuing doesn't capture the community's needs well — for
example, a shared workshop with a popular 3D printer.

**Trade-offs:** More complex to understand and administer. Requires a token or credit system. Must be carefully designed
to avoid replicating the wealth-based exclusion that Library Socialism seeks to eliminate — the quadratic cost curve is
specifically designed to counteract this, but it requires community trust and transparency.

**Philosophical note:** Quadratic Lending is the most "market-like" mechanism in NeighborGoods. It is included because
it solves a real problem (signaling intensity of need), but it must be implemented with care to ensure it doesn't
undermine the non-extractive, solidarity-first values of the platform. The doubling cost is the key safeguard: it
ensures that sustained hoarding becomes prohibitively expensive, pushing items back into circulation.

## Interaction with Library Types

Different [library types](./library-types.md) have natural affinities with different waiting list strategies:

| Library Type         | Typical Waiting List   | Notes                                                        |
|----------------------|------------------------|--------------------------------------------------------------|
| Simple Library       | First Come, First Serve | Straightforward; managed by library staff at a physical location. |
| Distributed Library  | First Come, First Serve | Pickup/return coordinated between neighbors directly.        |
| Free Store           | None                   | Items are freely available; no queue needed.                 |
| BuyNothing Groups    | None                   | Items are given away; first to respond typically gets it.    |

Libraries are free to choose any strategy regardless of type — these are just common defaults.

## Eligibility & Removal

Any borrower **in good standing** — meaning they are allowed to borrow from a library — can join that library's waiting
lists. This applies equally whether the borrower is local to the node or a federated neighbor from another node. If a
library is federated and the borrower is qualified, they may add themselves to the list just like any local member.

When a borrower is **removed or blocked** from a library, they are automatically removed from all of that library's
waiting lists. Any active reservations they hold are moved to `CANCELLED` status.

## Federation Considerations

In a [federated](./federation.md) NeighborGoods network, waiting lists are **local to each library node**, but they are
not restricted to local neighbors. If a library participates in federation, qualified borrowers from other nodes can join
its waiting lists just as local borrowers can. Federation enables:

- **Cross-node participation**: A neighbor on Node A can join a waiting list on Node B, provided they are in good
  standing with that library.
- **Visibility**: Neighbors can see that an item exists on another node and what the current wait looks like.
- **Redirecting demand**: If an item has a long wait on one node, a neighbor might find the same item available sooner
  on a nearby node.

## Configuration

Waiting list behavior is configurable at the library level:

- **`waitingListType`**: The strategy used for all items in the library (`NONE` or `FIRST_COME_FIRST_SERVE`, with
  `LIBRARY_VOTING` and `QUADRATIC_LENDING` planned).
- **Reservation window**: The number of days a neighbor has to pick up a reserved item before the reservation expires
  (default: 3 days). This is currently set per waiting list type implementation.

## Domain Model Reference

For developers working on the codebase, the waiting list system lives in:

- **`src/domain/entities/waiting_lists/`** — Core domain entities:
  - `WaitingList` (abstract base class) — defines the contract for all waiting list strategies.
  - `FirstComeFirstServeWaitingList` — the FCFS implementation.
  - `NullWaitingList` — the "no waiting list" implementation.
  - `Reservation` — represents a time-limited hold on an item for a specific neighbor.
- **`src/domain/factories/waitingListFactory.ts`** — Creates the appropriate waiting list based on library configuration.
- **`src/domain/valueItems/waitingListTypes.ts`** — The `WaitingListType` enum.
- **`src/domain/valueItems/reservationStatus.ts`** — The `ReservationStatus` enum governing reservation state transitions.
