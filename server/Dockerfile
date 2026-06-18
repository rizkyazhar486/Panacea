# Backend container — works on Railway, Fly.io, Cloud Run, etc.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
