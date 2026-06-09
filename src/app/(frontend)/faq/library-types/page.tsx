import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'Library Types | FAQ | NeighborGoods',
  description:
    'An overview of the library types supported by NeighborGoods: Simple Library, Distributed Library, Free Store, and BuyNothing Groups.',
}

/* ------------------------------------------------------------------ */
/* Diagrams — hand-authored SVG, themable via currentColor / tailwind */
/* ------------------------------------------------------------------ */

const svgBase = 'w-full h-auto max-w-xl text-foreground'

function SimpleLibraryDiagram() {
  return (
    <svg viewBox="0 0 480 220" role="img" aria-label="Simple Library diagram" className={svgBase}>
      <title>Simple Library</title>
      {/* Library building */}
      <rect x="180" y="60" width="120" height="100" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="180,60 240,30 300,60" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="240" y="115" textAnchor="middle" fontSize="14" fill="currentColor">Library</text>
      <text x="240" y="135" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">(owns goods)</text>

      {/* Borrower */}
      <circle cx="60" cy="110" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="150" textAnchor="middle" fontSize="12" fill="currentColor">Borrower</text>

      {/* Arrows: borrow + return */}
      <line x1="80" y1="100" x2="175" y2="100" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="127" y="92" textAnchor="middle" fontSize="11" fill="currentColor">borrow</text>

      <line x1="175" y1="125" x2="80" y2="125" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="127" y="142" textAnchor="middle" fontSize="11" fill="currentColor">return</text>

      {/* Staff */}
      <circle cx="420" cy="110" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="420" y="150" textAnchor="middle" fontSize="12" fill="currentColor">Staff</text>
      <line x1="404" y1="110" x2="305" y2="110" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />

      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  )
}

function DistributedLibraryDiagram() {
  return (
    <svg viewBox="0 0 480 240" role="img" aria-label="Distributed Library diagram" className={svgBase}>
      <title>Distributed Library</title>
      <defs>
        <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Users in a network */}
      {[
        { cx: 80, cy: 60, label: 'User A' },
        { cx: 400, cy: 60, label: 'User B' },
        { cx: 80, cy: 180, label: 'User C' },
        { cx: 400, cy: 180, label: 'User D' },
      ].map((u) => (
        <g key={u.label}>
          <circle cx={u.cx} cy={u.cy} r="18" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x={u.cx} y={u.cy + 36} textAnchor="middle" fontSize="12" fill="currentColor">
            {u.label}
          </text>
        </g>
      ))}

      {/* Network hub */}
      <rect x="200" y="100" width="80" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      <text x="240" y="124" textAnchor="middle" fontSize="11" fill="currentColor">platform</text>

      {/* Peer-to-peer lines */}
      <line x1="98" y1="60" x2="382" y2="60" stroke="currentColor" strokeWidth="2" markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
      <line x1="98" y1="180" x2="382" y2="180" stroke="currentColor" strokeWidth="2" markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
      <line x1="80" y1="78" x2="80" y2="162" stroke="currentColor" strokeWidth="2" markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
      <line x1="400" y1="78" x2="400" y2="162" stroke="currentColor" strokeWidth="2" markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />

      <text x="240" y="20" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
        peers lend &amp; borrow directly
      </text>
    </svg>
  )
}

function FreeStoreDiagram() {
  return (
    <svg viewBox="0 0 480 220" role="img" aria-label="Free Store diagram" className={svgBase}>
      <title>Free Store</title>
      <defs>
        <marker id="arrow3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Store */}
      <rect x="180" y="60" width="120" height="100" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="180,60 240,30 300,60" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="240" y="105" textAnchor="middle" fontSize="14" fill="currentColor">Free Store</text>
      <text x="240" y="125" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">NFC / RFID inventory</text>

      {/* Donor */}
      <circle cx="60" cy="110" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="150" textAnchor="middle" fontSize="12" fill="currentColor">Donor</text>
      <line x1="80" y1="110" x2="175" y2="110" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow3)" />
      <text x="127" y="102" textAnchor="middle" fontSize="11" fill="currentColor">donates</text>

      {/* Taker */}
      <circle cx="420" cy="110" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="420" y="150" textAnchor="middle" fontSize="12" fill="currentColor">Taker</text>
      <line x1="305" y1="110" x2="400" y2="110" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow3)" />
      <text x="352" y="102" textAnchor="middle" fontSize="11" fill="currentColor">takes</text>

      <text x="240" y="195" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
        no return required
      </text>
    </svg>
  )
}

function BuyNothingDiagram() {
  return (
    <svg viewBox="0 0 480 240" role="img" aria-label="BuyNothing Group diagram" className={svgBase}>
      <title>BuyNothing Group</title>
      <defs>
        <marker id="arrow4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Social platform cloud */}
      <ellipse cx="240" cy="120" rx="110" ry="60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <text x="240" y="118" textAnchor="middle" fontSize="13" fill="currentColor">Social Group</text>
      <text x="240" y="135" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">(Facebook, etc.)</text>

      {/* Members */}
      <circle cx="60" cy="60" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="180" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="420" cy="60" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="420" cy="180" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="40" textAnchor="middle" fontSize="11" fill="currentColor">member</text>
      <text x="60" y="210" textAnchor="middle" fontSize="11" fill="currentColor">member</text>
      <text x="420" y="40" textAnchor="middle" fontSize="11" fill="currentColor">member</text>
      <text x="420" y="210" textAnchor="middle" fontSize="11" fill="currentColor">member</text>

      <line x1="74" y1="68" x2="145" y2="100" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow4)" />
      <line x1="74" y1="172" x2="145" y2="140" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow4)" />
      <line x1="335" y1="100" x2="406" y2="68" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow4)" />
      <line x1="335" y1="140" x2="406" y2="172" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow4)" />

      {/* Adapter */}
      <rect x="200" y="200" width="80" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="240" y="218" textAnchor="middle" fontSize="11" fill="currentColor">Adapter</text>
      <line x1="240" y1="180" x2="240" y2="200" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                            */
/* ------------------------------------------------------------------ */

type LibraryType = {
  id: string
  name: string
  short: string
  howItWorks: string[]
  examples: string[]
  diagram: React.ReactNode
}

const libraryTypes: LibraryType[] = [
  {
    id: 'simple',
    name: 'Simple Library',
    short:
      'A traditional library with one or more physical locations where goods are borrowed and returned. The library itself legally owns the goods.',
    howItWorks: [
      'A borrower visits a physical location.',
      'A staff member (or self-checkout system) creates a Loan with a due date.',
      'When the item is returned in person, staff marks the loan complete.',
    ],
    examples: [
      'A neighborhood tool library with a storefront and opening hours.',
      'A public seed library run out of a community center.',
    ],
    diagram: <SimpleLibraryDiagram />,
  },
  {
    id: 'distributed',
    name: 'Distributed Library',
    short:
      'A collection of users who agree to lend and borrow goods directly from one another. The library itself does not own the goods.',
    howItWorks: [
      'Members list goods they own and are willing to lend.',
      'Borrower and lender coordinate pickup and return directly.',
      'Both parties confirm the return — and optionally provide location or photo evidence — to discourage fraud.',
      'Smart lockers can be used to automate handoff without meeting in person.',
    ],
    examples: [
      'Neighbors lending power tools to each other through the app.',
      'A book-swap network across a small town, using lockers for drop-off.',
    ],
    diagram: <DistributedLibraryDiagram />,
  },
  {
    id: 'free-store',
    name: 'Free Store',
    short:
      'Similar to a Simple Library, but items have no return date — they are given away. Users can both donate and take goods.',
    howItWorks: [
      'Donors drop items off at the physical location.',
      'Takers pick up whatever they need, with no obligation to return.',
      'NFC or RFID tags can keep inventory accurate automatically.',
    ],
    examples: [
      'A "Really Really Free Market" run permanently out of a storefront.',
      'A community fridge or pantry with tagged items.',
    ],
    diagram: <FreeStoreDiagram />,
  },
  {
    id: 'buy-nothing',
    name: 'BuyNothing Groups',
    short:
      'Existing BuyNothing groups on social media, surfaced into NeighborGoods through adapters. Goods are gifted without a return date, and members coordinate pickup directly.',
    howItWorks: [
      'An adapter connects to the social platform (e.g. a Facebook group).',
      'Posts offering items appear in NeighborGoods as available goods.',
      'Members coordinate pickup directly, similar to a Distributed Library.',
    ],
    examples: [
      'A local Facebook BuyNothing group made browsable inside NeighborGoods.',
      'A Discord gifting channel surfaced as a library feed.',
    ],
    diagram: <BuyNothingDiagram />,
  },
]

export default function LibraryTypesPage() {
  return (
    <div className="container py-12">
      <nav className="text-sm mb-6 text-muted-foreground">
        <Link href="/faq" className="hover:underline">
          FAQ
        </Link>{' '}
        / <span className="text-foreground">Library Types</span>
      </nav>

      <div className="prose max-w-none mb-8">
        <h1>Library Types</h1>
        <p>
          NeighborGoods supports many different kinds of libraries. Each one has its own rules
          around ownership, returns, and how pickup and drop-off are coordinated. Here&apos;s an
          overview of the types we support today.
        </p>
      </div>

      {/* Quick jump */}
      <ul className="flex flex-wrap gap-2 list-none p-0 mb-10">
        {libraryTypes.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className="inline-block rounded-full border border-border px-3 py-1 text-sm hover:bg-accent/40 no-underline"
            >
              {t.name}
            </a>
          </li>
        ))}
      </ul>

      <div className="space-y-14">
        {libraryTypes.map((t) => (
          <section key={t.id} id={t.id} className="scroll-mt-24">
            <div className="grid gap-8 md:grid-cols-2 md:items-start">
              <div className="prose max-w-none">
                <h2 className="!mb-2">{t.name}</h2>
                <p>{t.short}</p>

                <h3>How it works</h3>
                <ol>
                  {t.howItWorks.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                <h3>Examples</h3>
                <ul>
                  {t.examples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>

              <figure className="rounded-lg border border-border bg-card p-4">
                {t.diagram}
                <figcaption className="mt-2 text-xs text-center text-muted-foreground">
                  {t.name} — flow of goods between participants
                </figcaption>
              </figure>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16">
        <Link
          href="/faq"
          className="inline-block rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/40 no-underline"
        >
          ← Back to FAQ
        </Link>
      </div>
    </div>
  )
}
