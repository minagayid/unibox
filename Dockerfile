# Multi-stage build for production
FROM node:20-slim AS frontend-base
WORKDIR /app/packages/frontend
COPY packages/frontend/package.json packages/frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY packages/frontend/ .

FROM python:3.12-slim AS backend-base
WORKDIR /app/packages/backend
COPY packages/backend/pyproject.toml packages/backend/poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev
COPY packages/backend/ .

FROM nginx:alpine AS production
COPY --from=frontend-base /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
