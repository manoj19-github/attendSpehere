FROM node:18-alpine

# Install build tools for bcrypt (native module compilation)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Clean install (faster & deterministic than npm install)
RUN npm ci

COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size (typescript, nodemon, eslint, etc.)
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run compiled JS (not nodemon dev server)
CMD ["node", "dist/src/index.js"]