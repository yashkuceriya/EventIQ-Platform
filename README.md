# 🚀 EventIQ - AI-Powered Event Intelligence Platform

A production-ready microservices platform for real-time event processing with AI-powered insights.

## 🏗️ Architecture

- **Frontend**: Next.js 14 (Vercel)
- **Microservices**: TypeScript/Node.js
  - Event Ingestion Service (Port )
  - AI Analysis Service
  - Analytics Service (Port 3003)
- **Message Queue**: Apache Kafka
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis
- **AI**: OpenAI GPT-4
- **Infrastructure**: Docker, Terraform (AWS)

## 📦 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone and install**
```bash
cd eventiq-platform
pnpm install
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your values (DATABASE_URL, KAFKA_BROKERS, REDIS_URL, OPENAI_API_KEY)
```

3. **Start infrastructure**
```bash
docker-compose up -d
```

4. **Setup database**
```bash
cd packages/database
pnpm db:generate
pnpm db:migrate
cd ../..
```

5. **Start services**
```bash
# Terminal 1: Event Ingestion
cd apps/event-ingestion-service && pnpm dev

# Terminal 2: AI Analysis
cd apps/ai-analysis-service && pnpm dev

# Terminal 3: Analytics
cd apps/analytics-service && pnpm dev

# Terminal 4: Frontend
cd apps/web && pnpm dev
```

### Access

- **Frontend**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Kafka UI**: http://localhost:8080
- **Event Ingestion API**: http://localhost:3002
- **Analytics API**: http://localhost:3003

## 📡 API Examples

### Submit Event
```bash
curl -X POST http://localhost:3002/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.signup",
    "source": "web-app",
    "severity": "low",
    "message": "New user registered",
    "metadata": {
      "userId": "12345",
      "email": "user@example.com"
    }
  }'
```

### Get Metrics
```bash
curl http://localhost:3002/api/metrics
```

### Get Real-time Analytics
```bash
curl http://localhost:3003/api/metrics/realtime
```

## 📊 Features

✅ Real-time event ingestion with rate limiting  
✅ Kafka-based message streaming  
✅ AI anomaly detection (GPT-4)  
✅ Trend analysis  
✅ WebSocket real-time updates  
✅ Interactive dashboard  
✅ PostgreSQL with Prisma ORM  
✅ Redis caching  
✅ Error handling with DLQ (Dead Letter Queue)  
✅ Docker containerization  
✅ Monorepo with pnpm workspaces  
✅ TypeScript throughout  

## 🛠️ Development Commands

```bash
# Build all packages
pnpm build

# Run tests (when implemented)
pnpm test

# Lint
pnpm lint

# Database operations
cd packages/database
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Prisma Studio
pnpm db:generate     # Generate Prisma client
```

## 🐳 Docker Commands

```bash
# Start all infrastructure services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart postgres
```

## 📁 Project Structure

```
eventiq-platform/
├── apps/
│   ├── event-ingestion-service/    # REST API for event ingestion
│   ├── ai-analysis-service/        # AI-powered analysis
│   ├── analytics-service/          # Real-time analytics + WebSocket
│   └── web/                        # Next.js frontend
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   ├── kafka-client/               # Kafka producer/consumer wrapper
│   └── database/                   # Prisma schema and client
├── infrastructure/
│   └── terraform/                  # AWS infrastructure (optional)
├── docker-compose.yml              # Local development infrastructure
└── pnpm-workspace.yaml            # Monorepo configuration
```

## 🚀 Deployment

### Deploy Frontend to Vercel
```bash
cd apps/web
vercel --prod
```

### Deploy Services with Docker
```bash
# Build images
docker-compose -f docker-compose.services.yml build

# Push to registry (configure first)
docker-compose -f docker-compose.services.yml push
```

### Infrastructure with Terraform
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## 🔧 Configuration

### Environment Variables

**Event Ingestion Service** (`apps/event-ingestion-service/.env`):
```env
NODE_ENV=development
PORT=
DATABASE_URL=postgresql://eventiq:eventiq_dev_password@localhost:5432/eventiq_dev
KAFKA_BROKERS=localhost:19092
REDIS_URL=redis://localhost:6379
```

**AI Analysis Service** (`apps/ai-analysis-service/.env`):
```env
NODE_ENV=development
DATABASE_URL=postgresql://eventiq:eventiq_dev_password@localhost:5432/eventiq_dev
KAFKA_BROKERS=localhost:19092
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

**Analytics Service** (`apps/analytics-service/.env`):
```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://eventiq:eventiq_dev_password@localhost:5432/eventiq_dev
KAFKA_BROKERS=localhost:19092
REDIS_URL=redis://localhost:6379
```

## 🧪 Testing

```bash
# Test event ingestion
./scripts/test-api.sh

# Or manually:
curl -X POST http://localhost:/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test.event",
    "source": "test-script",
    "severity": "low",
    "message": "Test event"
  }'
```

## 📈 Monitoring

- **Kafka UI**: http://localhost:8080 - Monitor Kafka topics and messages
- **Prisma Studio**: Run `pnpm db:studio` in packages/database
- **Redis**: Connect with Redis CLI: `redis-cli -h localhost -p 6379`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Roadmap

- [ ] Add comprehensive test suite
- [ ] Implement authentication & authorization
- [ ] Add more AI analysis types (correlation, prediction)
- [ ] Implement event replay functionality
- [ ] Add alerting system
- [ ] Create admin dashboard
- [ ] Add API documentation (Swagger)
- [ ] Implement multi-tenancy
- [ ] Add performance metrics
- [ ] Create Kubernetes manifests

## 💡 Tips

- **Performance**: Adjust Kafka partition count for higher throughput
- **Scaling**: Each service can be scaled independently
- **Monitoring**: Add APM tools like DataDog or New Relic
- **Security**: Use environment variables for all secrets
- **Development**: Use `pnpm dev` for hot-reload during development

## 🆘 Troubleshooting

### Kafka not starting
```bash
docker-compose down -v
docker-compose up -d
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Regenerate Prisma client
cd packages/database && pnpm db:generate
```

### Port conflicts
```bash
# Check what's using the port
lsof -i :  # or :3003, :19092, etc.
```

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs: `docker-compose logs -f [service-name]`

---

**Built with ❤️ using TypeScript, Node.js, Kafka, PostgreSQL, Redis, and OpenAI GPT-4**
