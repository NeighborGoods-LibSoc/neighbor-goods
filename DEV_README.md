# Developer ReadMe
Thank you for your interest in contributing to the NeighborGoods project! This document contains instructions on how to set up your development environment, select issues, and get them merged into the main branch.

## Tech Stack
NeighborGoods is built using the following technologies:
- TypeScript: serves as the main programming language for the project.
- [Payload CMS](https://payloadcms.com): is a headless CMS framework for TypeScript that provides the backend API and admin interface.
- [Next.js](https://nextjs.org): React framework that handles server-side rendering, routing, and frontend functionality.
- [React](https://reactjs.org): JavaScript library for building the user interface components.
- [MongoDB](https://mongodb.com): NoSQL database for storing application data.
- [Tailwind CSS](https://tailwindcss.com): Utility-first CSS framework for styling.
- Docker: responsible for running the app, and used in development
## Getting a local development version working
### Install Prerequisites

Before setting up the development environment, ensure you have the following installed:

Node.js
- Download from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version`
Docker
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- Verify installation: `docker --version` and `docker-compose --version`
Git
- Download from [git-scm.com](https://git-scm.com/)
- Verify installation: `git --version`

### Cold Start

Follow these steps to get the development environment running:

Clone the repo
   ```bash
   git clone https://github.com/NeighborGoods-LibSoc/neighbor-goods.git
   cd neighbor-goods
   ```

Set up environment variables
   ```bash
   cp .env.example .env
   ```

Start the development environment with Docker
   ```bash
   docker-compose up
   ```

The application should now be running and accessible at http://localhost:3000.

## Developing NeighborGoods
When developing, the Docker containers are set to rebuild upon changes being detected in the source code. The first build might take a few minutes to install dependencies, but subsequent rebuilds should be relatively quick.

We are using GitHub issues to track what needs to be done. If you are unsure where to begin, start by going to [the repo issues page](https://github.com/NeighborGoods-LibSoc/neighbor-goods/issues) and picking out an issue with a `good first issue` tag. 

### Project Structure
- `src/app/(frontend)/` - Next.js frontend pages and components
- `src/app/(payload)/` - Payload CMS admin interface
- `src/collections/` - Payload collection definitions (database models)
- `src/components/` - Reusable React components
- `src/blocks/` - Payload block components for page building
- `src/utilities/` - Helper functions and utilities
