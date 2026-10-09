# Dev AI

A full-stack AI developer platform that combines a modern web frontend with backend APIs and containerized deployment support.

## Highlights

- Full-stack application architecture
- AI-assisted developer workflows
- Separate frontend and API services
- Docker and Docker Compose support
- Deployment configurations for Vercel and Railway

## Technology

- JavaScript/TypeScript
- Node.js
- Frontend web application
- API services
- Docker

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Docker Desktop (recommended for the complete stack)
- Required API keys configured through environment variables

### Local Setup

```bash
git clone https://github.com/sameer-softengs/Dev-AI.git
cd Dev-AI
npm install
```

Create local environment files from `.env.example`, then start the frontend and API services according to their respective package scripts.

### Docker

```bash
docker compose up --build
```

## Configuration

Do not commit `.env` files or API credentials. Use the provided examples as a starting point and configure secrets through your local environment or deployment provider.

## Deployment

The repository includes configuration for container-based deployment and hosted frontend/API deployments. Review each provider’s environment-variable settings before deploying.

## License

See the repository for licensing details.
