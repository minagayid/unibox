.PHONY: setup dev build test clean docker-up docker-down lint format

setup:
	pnpm install
	cd packages/frontend && pnpm install
	cd packages/backend && poetry install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint
	cd packages/backend && ruff check .

format:
	pnpm typecheck
	cd packages/backend && ruff format .

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

clean:
	rm -rf dist build node_modules packages/*/node_modules packages/*/.next packages/*/out
	rm -rf packages/backend/.venv
