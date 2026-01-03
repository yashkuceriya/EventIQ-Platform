# EventIQ Platform

A high-performance event analytics platform built with modern technologies and microservices architecture.

## 🏗️ Architecture

This is a monorepo managed by **Turborepo** containing the following applications and packages:

### Applications (`apps/`)

- **web** - Next.js frontend application
- **event-ingestion-service** - Real-time event ingestion service
- **ai-analysis-service** - AI-powered analytics and insights
- **analytics-service** - Event analytics and reporting service

### Packages (`packages/`)

- **shared-types** - Shared TypeScript types across services
- **kafka-client** - Kafka client wrapper and utilities
- **database** - Prisma database client and schema

### Infrastructure (`infrastructure/`)

- **terraform** - Infrastructure as Code configurations

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker (for local development)
- PostgreSQL
- Apache Kafka
- Redis

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eventiq-platform
```

2. Copy the environment variables:
```bash
cp .env.example .env
```

3. Install dependencies:
```bash
pnpm install
```

4. Generate Prisma client:
```bash
pnpm db:generate
```

5. Run database migrations:
```bash
pnpm db:migrate
```

### Development

Run all applications in development mode:
```bash
pnpm dev
```

Build all applications:
```bash
pnpm build
```

Run linting:
```bash
pnpm lint
```

Run tests:
```bash
pnpm test
```

### Database Management

- Generate Prisma client: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`
- Open Prisma Studio: `pnpm db:studio`

## 📦 Tech Stack

- **Framework**: Next.js, Node.js
- **Language**: TypeScript
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Database**: PostgreSQL with Prisma
- **Message Queue**: Apache Kafka
- **Cache**: Redis
- **AI/ML**: OpenAI API
- **Infrastructure**: Terraform

## 🔧 Development Workflow

1. Create feature branches from `main`
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Create a pull request
5. After approval and CI passes, merge to `main`

## 📝 License

[Your License Here]
