.PHONY: setup setup-frontend setup-backend test test-frontend test-backend lint lint-frontend lint-backend clean deploy-frontend deploy-backend dev dev-frontend dev-backend db-migrate db-seed help

help:
	@echo "Legal Aid App — Development Commands"
	@echo ""
	@echo "  make setup              Setup both frontend and backend"
	@echo "  make setup-frontend     Setup frontend only"
	@echo "  make setup-backend      Setup backend only"
	@echo "  make dev-frontend       Start frontend dev server"
	@echo "  make dev-backend        Start backend dev server"
	@echo "  make test               Run all tests"
	@echo "  make test-frontend      Run frontend tests"
	@echo "  make test-backend       Run backend tests"
	@echo "  make lint               Lint all code"
	@echo "  make deploy-frontend    Deploy frontend to Netlify"
	@echo "  make deploy-backend     Deploy backend to Railway"
	@echo "  make db-migrate         Run Django migrations"
	@echo "  make db-seed            Load demo seed data"

setup: setup-frontend setup-backend

setup-frontend:
	cd frontend && cp -n .env.example .env 2>/dev/null || true && npm install

setup-backend:
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt && cp -n .env.example .env 2>/dev/null || true

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && . venv/bin/activate && python manage.py runserver

test: test-frontend test-backend

test-frontend:
	cd frontend && npm run test

test-backend:
	cd backend && . venv/bin/activate && pytest

lint: lint-frontend lint-backend

lint-frontend:
	cd frontend && npm run lint

lint-backend:
	cd backend && . venv/bin/activate && flake8 . --max-line-length=120 --exclude=venv,migrations

deploy-frontend:
	cd frontend && npm run build && netlify deploy --prod

deploy-backend:
	cd backend && railway up

db-migrate:
	cd backend && . venv/bin/activate && python manage.py migrate

db-seed:
	cd backend && . venv/bin/activate && python manage.py loaddata seed
