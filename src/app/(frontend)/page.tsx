import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export default function HomePage() {
  return <LandingPage />
}

export const metadata: Metadata = {
  title: 'NeighborGoods - Community Resource Sharing',
  description:
    'NeighborGoods is a platform that empowers neighbors to share resources, time, skills, and support—strengthening solidarity, trust, and resilience within communities.',
  openGraph: {
    title: 'NeighborGoods - Community Resource Sharing',
    description: 'Share resources. Build community. Strengthen neighborhoods.',
    type: 'website',
  },
}
