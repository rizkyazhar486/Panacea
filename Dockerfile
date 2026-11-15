FROM node:24-alpine
WORKDIR /app
COPY . .
EXPOSE 4040
ENV NODE_ENV=production
ENV PORT=4040
CMD ["node", "scripts/start-cockpit.mjs"]
