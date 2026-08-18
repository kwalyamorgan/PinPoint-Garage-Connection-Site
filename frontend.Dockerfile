FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

ENV NODE_ENV=development

CMD ["npm","run","dev","--","--host","0.0.0.0"]
