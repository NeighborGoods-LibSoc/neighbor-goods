# AI Agent Guide for NeighborGoods

This document provides essential context for AI agents and developers working on the NeighborGoods project. It combines the project's philosophical foundations with its technical architecture and development guidelines.

## 1. Project Vision & Philosophy

NeighborGoods is a Federated Library of Things based on the principles of **Library Socialism**. Its goal is to create a hyper-local, non-commercial platform that empowers neighbors to share resources, time, skills, and support—strengthening solidarity, trust, and resilience within communities.

### Core Philosophical Principles (Library Socialism)
- **Usufruct**: The right of individuals to use resources by virtue of their need and use. In NeighborGoods, this means you can use items, but you cannot deny them to others when not in use, nor can you destroy them.
- **Removal of Abusus**: We reject the "right of abuse" (the right to destroy or deny property to others). This prevents the creation of artificial scarcity used to exploit labor.
- **Irreducible Minimum**: Everyone is guaranteed a standard of living (universal outcomes like housing and food) regardless of their contribution, removing the threat of scarcity that forces people into capitalist wage labor.
- **Complementarity**: Differences in a non-hierarchical organization are generative. Borrowers and owners enhance the community and its resources through shared use, feedback, and collective action.
- **Ecological Responsibility**: Sharing resources reduces redundant production, minimizing the ecological footprint while providing a high standard of living.

## 2. Technical Stack

- **Language**: TypeScript
- **Backend/CMS**: [Payload CMS](https://payloadcms.com) (provides the REST/GraphQL API and Admin UI)
- **Frontend**: [Next.js](https://nextjs.org) with [React](https://reactjs.org)
- **Database**: [MongoDB](https://mongodb.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Environment**: Docker & Docker Compose

## 3. Project Structure

- `src/app/(frontend)/`: Next.js frontend pages and components.
- `src/app/(payload)/`: Payload CMS admin interface.
- `src/collections/`: Payload collection definitions (database models).
- `src/components/`: Reusable React components.
- `src/blocks/`: Payload block components for page building.
- `src/utilities/`: Helper functions and utilities.
- `src/domain/`: Core business logic and entities (if applicable).
- `.agents/skills/`: Detailed AI agent skills for specific project domains.

## 4. Key Data Models

- **User**: Authentication and personal info.
- **Item**: The representation of a shareable good.
- **ItemTransfer**: Records condition and location when an item changes hands.
- **ItemLog**: Audit log for tracking maintenance, restocks, and non-transactional events.
- **Certification**: Skills or training (e.g., "Chainsaw Certified"). Required for certain items.
- **CollectiveActionCampaign**: For solving problems collectively (e.g., starting a new tool library).
- **NodeSettings**: Server-specific settings (EAV model).
- **Post**: Markdown documents for community communication.

## 5. Development Guidelines

### Tone and Vibe
- **Voice**: Friendly, warm, neighborly, non-hierarchical.
- **Tone**: Casual but respectful. Community-first.
- **Vibe**: Avoid "corporate" or "sterile" styles. Think hand-painted signs, potluck flyers, and zines. Use soft edges and warm colors.

### Key Workflows
- **Item Borrowing**: Search -> Request -> Owner Approval -> Handover (Condition Logged) -> Return.
- **Verification**: New users are verified in-person by an Admin to build trust.
- **Federation**: Planned integration via **ActivityPub** to allow nodes to communicate and share resources across communities.

### Testing
- Integration tests require the Docker environment to be running (`docker-compose up`).
- Run tests using the configured test runner (e.g., `vitest`).

## 6. AI Interaction Rules
- **Respect the Philosophy**: When generating features or text, ensure they align with Library Socialism (sharing over ownership, solidarity over profit).
- **Non-Extractive**: Do not suggest features involving ads, data harvesting, or rent-seeking.
- **Accessibility**: Prioritize simple, inclusive designs for all tech literacy levels.
- **Decentralization**: Assume a multi-node, federated environment rather than a single central authority.
