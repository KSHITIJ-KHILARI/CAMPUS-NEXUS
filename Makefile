.PHONY: help install install-backend install-frontend setup db-up db-down db-migrate db-seed test lint format clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend dependencies
	cd backend && pip install -r requirements.txt

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

setup: ## Initial project setup
	docker-compose up -d postgres redis
	cd backend && python -c "import asyncio; from app.core.database import init_db; asyncio.run(init_db())"
	cd backend && alembic stamp head
	cd backend && python scripts/seed_demo_data.py

db-up: ## Start database services
	docker-compose up -d postgres redis

db-down: ## Stop database services
	docker-compose down

db-migrate: ## Run database migrations
	cd backend && alembic upgrade head

db-migrate-create: ## Create new migration
	cd backend && alembic revision --autogenerate -m "$(msg)"

db-seed: ## Seed demo data
	cd backend && python scripts/seed_demo_data.py

test: ## Run all tests
	cd backend && pytest tests/ -v
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && pytest tests/ -v

test-frontend: ## Run frontend tests
	cd frontend && npm test

lint: ## Run linting
	cd backend && ruff check .
	cd frontend && npm run lint

format: ## Format code
	cd backend && ruff format .
	cd frontend && npm run format

dev-backend: ## Start backend dev server
	cd backend && uvicorn app.main:app --reload

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

dev: ## Start full development environment
	docker-compose up -d
	make dev-backend & make dev-frontend

clean: ## Clean build artifacts
	cd backend && rm -rf .pytest_cache htmlcov .coverage dist build *.egg-info
	cd frontend && rm -rf .next node_modules/.cache

demo: ## Run demo mode
	cd backend && python scripts/run_demo.py
