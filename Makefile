# BMI UMS - Makefile for common development tasks

.PHONY: help install start stop restart dev docker-up docker-down migrate test typecheck lint clean logs seed status

# Default target
help:
	@echo "BMI University Management System - Available Commands"
	@echo "======================================================"
	@echo "make install      - Install all dependencies"
	@echo "make start        - Start all services (PocketBase, Ollama, API)"
	@echo "make stop         - Stop all services"
	@echo "make dev          - Start development mode with hot reload"
	@echo "make docker-up    - Start with Docker Compose"
	@echo "make docker-down  - Stop Docker Compose"
	@echo "make migrate      - Run database migrations"
	@echo "make test         - Run tests"
	@echo "make lint         - Run linter"
	@echo "make clean        - Clean build artifacts and logs"
	@echo "make logs         - View all logs"
	@echo "make status       - Check service status"

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && npm install
	@echo "Dependencies installed!"

# Start all services
start:
	@echo "Starting all services..."
	./scripts/start-all.sh

# Stop all services
stop:
	@echo "Stopping all services..."
	./scripts/stop-all.sh

# Development mode
dev:
	@echo "Starting development stack..."
	./scripts/dev/start-dev.sh || bash start-all.sh

# Backend development
dev-backend:
	@echo "Starting backend development server..."
	cd backend && npm run dev

# Frontend development
dev-frontend:
	@echo "Starting frontend development server..."
	npm run dev

# Docker Compose
docker-up:
	@echo "Starting with Docker Compose..."
	docker-compose up -d
	@echo "Services starting..."
	@echo "API will be available at: http://localhost:3001"
	@echo "PocketBase at: http://localhost:8090"

docker-down:
	@echo "Stopping Docker Compose..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f

# Database migrations
migrate:
	@echo "Running database migrations..."
	cd backend && npx tsx ../scripts/migrate-db.ts

# Create first admin user
create-admin:
	@echo "Creating admin user..."
	cd backend && npx tsx ../scripts/create-admin.ts

# Run all tests (frontend + backend)
test:
	@echo "Running frontend tests..."
	npm test
	@echo "Running backend tests..."
	cd backend && npm test

# Typecheck both projects
typecheck:
	@echo "Type-checking frontend..."
	npm run typecheck
	@echo "Type-checking backend..."
	cd backend && npx tsc --noEmit

# Restart backend API
restart:
	@echo "Restarting backend API..."
	./scripts/dev/restart-backend.sh || pkill -f 'node.*backend' || true
	cd backend && npm run dev &
	@echo "Backend restarting..."

# Seed development data
seed:
	@echo "Seeding development data..."
	cd backend && npx tsx scripts/seed-courses.ts || true
	cd backend && npx tsx scripts/seed-real-data.ts || true

# Linting
lint:
	@echo "Running linter..."
	cd backend && npm run lint

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf backend/node_modules
	rm -rf logs/*.log
	rm -f logs/*.pid
	docker-compose down -v
	docker system prune -f
	@echo "Clean complete!"

# View logs
logs:
	@echo "Viewing logs (Ctrl+C to exit)..."
	tail -f logs/*.log

# Check service status
status:
	@echo "Checking service status..."
	@echo "PocketBase (8090): $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8090/api/health 2>/dev/null || echo 'DOWN')"
	@echo "Ollama (11434): $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:11434/api/tags 2>/dev/null || echo 'DOWN')"
	@echo "API (3001): $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health 2>/dev/null || echo 'DOWN')"

# Setup (first time)
setup:
	@echo "Setting up BMI UMS for the first time..."
	@echo "1. Installing dependencies..."
	cd backend && npm install
	@echo "2. Creating environment file..."
	cd backend && cp .env.example .env
	@echo "3. Downloading PocketBase..."
	mkdir -p bin
	curl -L -o /tmp/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.37.4/pocketbase_0.37.4_linux_amd64.zip
	unzip -o /tmp/pb.zip -d bin/
	rm /tmp/pb.zip
	chmod +x bin/pocketbase
	@echo "4. Installing Ollama (if not installed)..."
	which ollama || curl -fsSL https://ollama.com/install.sh | sh
	@echo "Setup complete! Edit backend/.env with your settings, then run 'make start'"
