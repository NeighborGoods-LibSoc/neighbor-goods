import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './styles.css'

interface LandingPageProps {
  nodeName?: string
  nodeDescription?: string
}

export const LandingPage: React.FC<LandingPageProps> = ({
  nodeName = 'NeighborGoods',
  nodeDescription = 'Connect with neighbors to share resources, time, skills, and support—strengthening solidarity, trust, and resilience within communities.',
}) => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero__logo">
            <div className="logo-text">
              <img src="/Logo-lightbg.png"></img>
            </div>
          </div>
          <h1 className="hero__title">
            Share resources. Build community. Strengthen neighborhoods.
          </h1>
          <p className="hero__subtitle">
            NeighborGoods is a platform that empowers neighbors to share resources, time, skills,
            and support—strengthening solidarity, trust, and resilience within communities.
          </p>
          <p className="hero__subtitle">{nodeDescription}</p>
          <div className="hero__buttons">
            <Link href="/signup" className="btn btn-primary">
              Join {nodeName}
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="features__title">How NeighborGoods Works</h2>
          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__icon">🛠️</div>
              <h3 className="feature-card__title">Item Borrowing</h3>
              <div className="feature-card__content">
                <p>
                  Borrow tools, equipment, and other items from your neighbors when you need them.
                  No need to buy things you'll only use occasionally!
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🎁</div>
              <h3 className="feature-card__title">Resource Sharing</h3>
              <div className="feature-card__content">
                <p>
                  Share your own items with neighbors who could use them. Build community
                  connections while making better use of resources.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">👋</div>
              <h3 className="feature-card__title">Skill Exchange</h3>
              <div className="feature-card__content">
                <p>
                  Offer your skills and talents to help neighbors, or find someone with the
                  expertise you need for your next project.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">📅</div>
              <h3 className="feature-card__title">Community Events</h3>
              <div className="feature-card__content">
                <p>
                  Organize and discover local events, from tool workshops to skill shares to
                  neighborhood clean-ups.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🏡</div>
              <h3 className="feature-card__title">Hyperlocal Focus</h3>
              <div className="feature-card__content">
                <p>
                  Connect with people who live nearby, making exchanges convenient and building real
                  relationships in your community.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🔒</div>
              <h3 className="feature-card__title">Trust Building</h3>
              <div className="feature-card__content">
                <p>
                  Our community verification system helps ensure safe, reliable interactions between
                  neighbors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values">
        <div className="container">
          <h2 className="values__title">Our Values</h2>
          <div className="values__grid">
            <div className="value-card">
              <h4 className="value-card__title">Mutual Aid</h4>
              <p>We uplift each other through shared resources, not profit.</p>
            </div>
            <div className="value-card">
              <h4 className="value-card__title">Solidarity</h4>
              <p>We act together, not alone. We show up for our neighbors.</p>
            </div>
            <div className="value-card">
              <h4 className="value-card__title">Trust & Care</h4>
              <p>Our platform is built on kindness, consent, and community accountability.</p>
            </div>
            <div className="value-card">
              <h4 className="value-card__title">Accessibility</h4>
              <p>Simple, inclusive design for all people, regardless of tech literacy.</p>
            </div>
            <div className="value-card">
              <h4 className="value-card__title">Decentralization</h4>
              <p>Local servers & local power: communities make decisions for themselves.</p>
            </div>
            <div className="value-card">
              <h4 className="value-card__title">Non-extractive</h4>
              <p>No ads, no data harvesting, no rent-seeking—just people helping people.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="features">
        <div className="container">
          <h2 className="features__title">How To Get Started</h2>
          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__icon">1️⃣</div>
              <h3 className="feature-card__title">Sign Up</h3>
              <div className="feature-card__content">
                <p>
                  Create an account and complete your profile with items you're willing to share.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">2️⃣</div>
              <h3 className="feature-card__title">Get Verified</h3>
              <div className="feature-card__content">
                <p>
                  Meet with a community admin for a quick in-person verification to ensure
                  neighborhood safety.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">3️⃣</div>
              <h3 className="feature-card__title">Browse & Connect</h3>
              <div className="feature-card__content">
                <p>Explore available items and resources or post requests for things you need.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2 className="cta__title">Ready to join your local NeighborGoods community?</h2>
          <p className="cta__content">
            Create an account today and start connecting with neighbors who share your vision for a
            more resilient, cooperative community.
          </p>
          <div className="hero__buttons">
            <Link href="/signup" className="btn btn-secondary">
              Sign Up Now
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Log In
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
