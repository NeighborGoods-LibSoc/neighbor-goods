import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'FAQ | NeighborGoods',
  description: 'Frequently asked questions about NeighborGoods.',
}

type FaqSection = {
  title: string
  description: string
  href?: string
  comingSoon?: boolean
}

const sections: FaqSection[] = [
  {
    title: 'Library Types',
    description:
      'The different kinds of libraries our platform supports — from traditional lending libraries to BuyNothing groups.',
    href: '/faq/library-types',
  },
  {
    title: 'Getting Started',
    description: 'How to sign up, find a library near you, and borrow your first item.',
    comingSoon: true,
  },
  {
    title: 'Lending & Borrowing',
    description: 'Loans, returns, due dates, and what happens when something goes wrong.',
    comingSoon: true,
  },
  {
    title: 'For Library Operators',
    description: 'Starting a library, managing inventory, and running waiting lists.',
    comingSoon: true,
  },
]

export default function FaqIndexPage() {
  return (
    <div className="container py-16">
      <div className="prose max-w-none mb-10">
        <h1>Frequently Asked Questions</h1>
        <p>
          Welcome to the NeighborGoods FAQ. Pick a topic below to learn more. New sections will be
          added over time.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 list-none p-0">
        {sections.map((section) => {
          const content = (
            <div className="h-full rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/40">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold m-0">{section.title}</h2>
                {section.comingSoon && (
                  <span className="text-xs uppercase tracking-wide rounded bg-muted px-2 py-1 text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </div>
          )
          return (
            <li key={section.title}>
              {section.href ? (
                <Link href={section.href} className="block no-underline">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
