# Stage 1: Build the application using Bun
FROM oven/bun:1 AS build

WORKDIR /app

# Copy lockfile and package.json first to leverage Docker caching
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the app (Vite outputs to 'dist' by default)
RUN bun run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built files from the Bun stage
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: Copy a custom nginx config to handle SPA routing (see below)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]