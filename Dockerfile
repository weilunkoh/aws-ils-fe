# stage 1: build
# FROM node:16.13-alpine AS builder
FROM public.ecr.aws/docker/library/node:16.13-alpine AS builder
# set working directory
WORKDIR /app
# install dependencies first so that this layer is cached by Docker
# then, subsequent builds where only source files are edited and no new dependencies are installed will be faster
COPY package.json yarn.lock ./
RUN yarn
# copy remaining source code to the container and build
COPY . .
RUN yarn build

# stage 2: production env
# FROM node:16-alpine AS runner
FROM public.ecr.aws/docker/library/node:16-alpine AS runner
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]