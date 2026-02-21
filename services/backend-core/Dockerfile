FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# รันเซิร์ฟเวอร์ด้วย Nodemon (โหมด dev)
CMD ["npm", "run", "dev"]