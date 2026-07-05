# FROM node:20 
# WORKDIR /app
# COPY package*.json .
# RUN npm install 
# COPY . .
# RUN npm run build
# RUN npm install -g serve
# EXPOSE 3000
# CMD ["serve","-s","dist","-l","3000"]

# ----------- Stage 1: Build -----------
FROM node:20-alpine AS builder
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install only dependencies needed for build
RUN npm install

# Copy rest of the code
COPY . .

# 👑 THE FIX: Grant explicit executable permissions to the Vite binary layer
RUN chmod +x node_modules/.bin/vite

# Build the app (This will now execute cleanly!)
RUN npm run build

# ----------- Stage 2: Production -----------
FROM node:20-alpine
WORKDIR /app

# Install lightweight static server
RUN npm install -g serve

# Copy only build output from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Run app
CMD ["serve", "-s", "dist", "-l", "3000"]