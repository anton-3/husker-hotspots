FROM node:22-alpine

WORKDIR /app

RUN corepack enable

# Install exactly what the pnpm lockfile specifies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* values are embedded into the browser bundle at build time.
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN test -n "$NEXT_PUBLIC_MAPBOX_TOKEN" || (echo "NEXT_PUBLIC_MAPBOX_TOKEN is required" >&2 && exit 1)
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "NEXT_PUBLIC_API_URL is required" >&2 && exit 1)
RUN pnpm build

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

EXPOSE 3000

# Run the production server, never the development server.
CMD ["pnpm", "start"]
