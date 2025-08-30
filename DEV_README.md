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

Follow these steps to get the development environment running. Either follow the more automated path, or for more advanced users, follow the more manual path.

First time starting the server will take a few minutes as it installs all the dependencies. Subsequent starts of the server will be significantly faster.

Clone the repo
   ```bash
   git clone https://github.com/NeighborGoods-LibSoc/neighbor-goods.git
   cd neighbor-goods
   ```

#### (More Automated)

Utilize the start scripts to automate most of the setup. It will ask for certain values and generate the rest. It will also install dependencies and start the server afterwards.

Linux
   ```bash
   ./start.sh
   ```

Windows
  ```bash
   ./start.cmd
   ```

#### (More Manual)

Setup your .env file. This will contain certain secrets/sensitive data and should not be shared outside the server.

```aiignore
DATABASE_URI: URI of your database that the web portion will communicate with. Default: mongodb://mongo:27017/neighbor-goods
DATABASE_TYPE: Payload CMS supports multiple types of server types. Recommended to keep this value at: mongodb
NEXT_PUBLIC_SERVER_URL: The URL of the server that will be used for browsers and API calls
PAYLOAD_SECRET: Secret value used by Payload CMS. Start scripts will generate one. Try to make it long and complex.
CRON_SECRET: Secret for setting up cron jobs. Start scripts will generate one. Try to make it long and complex.
PREVIEW_SECRET: Secret for preview. Start scripts will generate one. Try to make it long and complex.
SMTP_SERVER: Used for sending emails to users (e.g. password resets).
SMTP_USER: Username for authenticating to the SMTP SMTP Server
SMTP_PASSWORD: Password used for authenticating to the SMTP Server
```

Install the required packages. pnpm and yarn are utilized for this.

```bash
pnpm install
```

Start the development environment with Docker
   ```bash
   docker-compose up
   ```

The application should now be running and accessible at the URL specified during the start script (the value in NEXT_PUBLIC_SERVER_URL).

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
