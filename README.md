# Notion Clone Local 🚀

A full-stack clone of Notion built with NestJS, Next.js, and Docker. 
Designed for local execution, high performance, and robustness.

## 🛠 Tech Stack

- **Backend**: NestJS, PostgreSQL, Redis, TypeORM, Socket.io
- **Frontend**: Next.js 14, TailwindCSS, Zustand, React Query, Tiptap
- **Infrastructure**: Docker Compose, MinIO, MeiliSearch

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development outside Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/notion-clone.git
   cd notion-clone
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   cp .env.example backend/.env.local
   cp .env.example frontend/.env.local
   ```

3. **Start the Application**
   ```bash
   make up
   # OR
   docker-compose up -d
   ```

4. **Wait for Health Checks**
   Ensure all systems are operational:
   ```bash
   docker-compose ps
   ```

5. **Run Migrations & Seeds**
   ```bash
   make migrate
   make seed
   ```

6. **Access the App**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:4000](http://localhost:4000)
   - **MinIO Console**: [http://localhost:9001](http://localhost:9001) (User: `minioadmin`, Pass: `minioadmin123`)

## 🛠 Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services in background |
| `make down` | Stop all services |
| `make logs` | View logs for backend and frontend |
| `make clean` | Stop services and remove volumes (RESET) |
| `make migrate` | Run database migrations |
| `make seed` | Seed database with initial data |

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## 📄 License
MIT
