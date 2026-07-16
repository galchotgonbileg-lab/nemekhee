FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY package.json package.json
COPY apps/api apps/api
COPY packages/shared packages/shared
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["npm", "run", "dev"]
