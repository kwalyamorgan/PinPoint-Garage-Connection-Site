FROM node:18

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm install

# Copy backend source
COPY . .

ENV NODE_ENV=development

CMD ["npm","run","dev"]
