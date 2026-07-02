# UniBox

**The Universal AI Development Workspace.**

UniBox is a unified TypeScript + Python development workspace that brings together backend API services, a React frontend, and a testing framework in a single Docker-composable environment.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI |
| Frontend | React 18, TypeScript, Vite |
| Containerization | Docker, Docker Compose |
| Build | Makefile |

## Quick Start

```bash
# Using Docker (recommended)
docker compose up --build

# Or native
make install
make dev
```

## Project Structure

```
unibox/
├── backend/app/      # FastAPI backend
├── frontend/         # React/TypeScript frontend
├── tests/            # Test suite
├── Dockerfile        # Container image
├── docker-compose.yml
└── Makefile          # Dev commands
```

## License

MIT
